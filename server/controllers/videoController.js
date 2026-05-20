import GeneratedVideo from '../models/GeneratedVideo.js';
import Template from '../models/Template.js';
import { v4 as uuidv4 } from 'uuid';
import { generateVideoWithFFmpeg } from '../utils/ffmpeg.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createVideoJob = async (req, res) => {
  try {
    const { templateId, customizations: bodyCustom } = req.body;
    const template = await Template.findById(templateId);
    if (!template || !template.published) {
      return res.status(404).json({ message: 'Website not found' });
    }
    const customizations = { ...(bodyCustom || {}) };
    const resolved = resolveStructureSnapshot(customizations, template.structure);
    if (resolved) customizations.structureSnapshot = resolved;
    const slug = uuidv4().replace(/-/g, '').slice(0, 12);
    const video = await GeneratedVideo.create({
      userId: req.user._id,
      templateId,
      customizations,
      shareSlug: slug,
      status: 'pending'
    });
    res.status(201).json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const processVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await GeneratedVideo.findById(id).populate('templateId');
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (video.status !== 'pending') {
      return res.status(400).json({ message: 'Video already processed or in progress' });
    }
    video.status = 'processing';
    await video.save();

    try {
      const tpl = video.templateId;
      const prev = video.customizations?.toObject?.() || video.customizations || {};
      const resolvedStruct = resolveStructureSnapshot(prev, tpl?.structure);
      const isSlideshow = isSlideshowTemplate(resolvedStruct);

      if (isSlideshow) {
        const slots = video.customizations?.slots || {};
        const urls = Object.values(slots).filter(Boolean);
        const firstImage = urls.find((u) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(u)));
        video.videoUrl = null;
        video.thumbnailUrl = firstImage || tpl.thumbnailUrl || '';
        video.status = 'completed';
        video.customizations = {
          ...prev,
          structureSnapshot: resolvedStruct || prev.structureSnapshot || tpl.structure,
          pageKind: 'web',
        };
        await video.save();
        return res.json(video);
      }

      const outputPath = path.join(__dirname, '../uploads', `output-${video._id}.mp4`);
      await generateVideoWithFFmpeg(video, outputPath);
      const uploadResult = await uploadToCloudinary(outputPath, 'generated-videos');
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      video.videoUrl = uploadResult.secure_url;
      video.thumbnailUrl = uploadResult.secure_url.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/');
      video.customizations = { ...video.customizations, pageKind: 'video' };
      video.status = 'completed';
      await video.save();
      res.json(video);
    } catch (genErr) {
      video.status = 'failed';
      await video.save();
      throw genErr;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyVideos = async (req, res) => {
  try {
    const videos = await GeneratedVideo.find({ userId: req.user._id })
      .populate('templateId', 'name category thumbnailUrl structure')
      .sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getVideoById = async (req, res) => {
  try {
    const video = await GeneratedVideo.findById(req.params.id).populate(
      'templateId',
      'name category thumbnailUrl structure description'
    );
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteVideoJob = async (req, res) => {
  try {
    const video = await GeneratedVideo.findById(req.params.id);
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    await GeneratedVideo.deleteOne({ _id: video._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateVideoJob = async (req, res) => {
  try {
    const { customizations: patch } = req.body;
    if (!patch || typeof patch !== 'object') {
      return res.status(400).json({ message: 'customizations required' });
    }
    const video = await GeneratedVideo.findById(req.params.id).populate('templateId');
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    if (video.status === 'processing') {
      return res.status(400).json({ message: 'Cannot edit while processing' });
    }

    const tpl = video.templateId;
    const prev = video.customizations?.toObject?.() || video.customizations || {};
    const merged = { ...prev, ...patch };
    const resolved = resolveStructureSnapshot(merged, tpl?.structure);
    if (resolved) merged.structureSnapshot = resolved;

    const struct = resolveStructureSnapshot(merged, tpl?.structure);
    const isSlideshow = isSlideshowTemplate(struct);

    if (video.status === 'pending') {
      video.customizations = merged;
      await video.save();
      return res.json(video);
    }

    if (video.status === 'completed' || video.status === 'failed') {
      if (isSlideshow) {
        const slots = merged.slots || {};
        const urls = Object.values(slots).filter(Boolean);
        const firstImage = urls.find((u) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(u)));
        video.thumbnailUrl = firstImage || tpl?.thumbnailUrl || video.thumbnailUrl;
        video.videoUrl = null;
        video.status = 'completed';
        video.customizations = { ...merged, pageKind: 'web' };
      } else {
        video.customizations = merged;
        video.status = 'pending';
        video.videoUrl = undefined;
        video.thumbnailUrl = tpl?.thumbnailUrl || video.thumbnailUrl || '';
      }
    }

    await video.save();
    res.json(video);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function parseStructureMaybe(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function isSlideshowStructure(struct) {
  if (!struct) return false;
  if (struct.type && String(struct.type).toLowerCase() !== 'slideshow') return false;
  if (Array.isArray(struct.slides) && struct.slides.length > 0) return true;
  if (struct.mode === 'html' && typeof struct.html === 'string' && struct.html.trim()) return true;
  return false;
}

/** Prefer job snapshot when it has slides; otherwise use template (fixes empty `{}` blocking template). */
function resolveStructureSnapshot(customizations, templateStructure) {
  const fromJob = parseStructureMaybe(customizations?.structureSnapshot);
  const fromTpl = parseStructureMaybe(templateStructure);
  if (isSlideshowStructure(fromJob)) return fromJob;
  if (isSlideshowStructure(fromTpl)) return fromTpl;
  return fromJob || fromTpl || null;
}

function isSlideshowTemplate(struct) {
  return isSlideshowStructure(parseStructureMaybe(struct));
}

export const getVideoBySlug = async (req, res) => {
  try {
    const video = await GeneratedVideo.findOne({ shareSlug: req.params.slug })
      .populate('templateId', 'name category structure thumbnailUrl');
    if (!video) return res.status(404).json({ message: 'Not found' });
    if (video.status !== 'completed') return res.status(404).json({ message: 'Not ready yet' });

    const v = video.toObject({ virtuals: true });
    const tpl = v.templateId;
    const structure = resolveStructureSnapshot(v.customizations, tpl?.structure);

    v.customizations = {
      ...(v.customizations && typeof v.customizations === 'object' ? v.customizations : {}),
      structureSnapshot: structure,
    };

    res.json(v);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getQRCode = async (req, res) => {
  try {
    const video = await GeneratedVideo.findById(req.params.id);
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const shareUrl = `${baseUrl}/watch/${video.shareSlug}`;
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 300, margin: 2 });
    res.json({ shareUrl, qrCode: qrDataUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
