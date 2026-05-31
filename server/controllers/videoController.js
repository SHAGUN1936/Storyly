import GeneratedVideo from '../models/GeneratedVideo.js';
import Template from '../models/Template.js';
import BuilderTemplate from '../models/BuilderTemplate.js';
import { v4 as uuidv4 } from 'uuid';

/* Look up a template by id from either the admin or builder collection.
   `sourceType` is 'Template' (admin) or 'BuilderTemplate' (builder); we
   default to 'Template' for backward compat with old clients. */
function templateModelFor(sourceType) {
  return sourceType === 'BuilderTemplate' ? BuilderTemplate : Template;
}
import { generateVideoWithFFmpeg } from '../utils/ffmpeg.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createVideoJob = async (req, res) => {
  try {
    const { templateId, customizations: bodyCustom, recipientName, sourceType } = req.body;
    const TplModel = templateModelFor(sourceType);
    const customizations = { ...(bodyCustom || {}) };
    /* The user may legitimately hold a template they engaged with earlier
       (liked / saved) even after the admin deletes or unpublishes it. In
       that case the client ships its own `structureSnapshot`; we accept it
       and skip the live-template/published checks so the user keeps full
       use/edit/share access to their copy. */
    const hasClientSnap = hasUsableStructure(customizations.structureSnapshot);
    const template = await TplModel.findById(templateId);
    if (!template && !hasClientSnap) return res.status(404).json({ message: 'Website not found' });
    // Admin templates require `published` — unless the user already holds
    // a snapshot of it.
    if (template && sourceType !== 'BuilderTemplate' && !template.published && !hasClientSnap) {
      return res.status(404).json({ message: 'Website not found' });
    }
    const resolved = resolveStructureSnapshot(customizations, template?.structure);
    if (resolved) customizations.structureSnapshot = resolved;
    // Snapshot identifying meta so the saved page is fully self-contained —
    // it lists, renders, and edits correctly even if the admin later edits
    // or deletes the source template.
    snapshotTemplateMeta(customizations, template);
    const slug = uuidv4().replace(/-/g, '').slice(0, 12);
    const cleanRecipient = typeof recipientName === 'string'
      ? recipientName.trim().slice(0, 80)
      : '';
    const video = await GeneratedVideo.create({
      userId: req.user._id,
      templateId,
      sourceType: sourceType === 'BuilderTemplate' ? 'BuilderTemplate' : 'Template',
      customizations,
      recipientName: cleanRecipient || undefined,
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
        video.thumbnailUrl = firstImage || tpl?.thumbnailUrl || video.thumbnailUrl || '';
        video.status = 'completed';
        video.customizations = {
          ...prev,
          structureSnapshot: resolvedStruct || prev.structureSnapshot || tpl?.structure,
          pageKind: 'web',
        };
        video.markModified('customizations');
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
      video.markModified('customizations');
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

/**
 * Save (or update) a draft — never triggers processing. Used by the
 * editor when the user clicks "Save as draft" or when the browser tab
 * loses focus mid-edit. Creates a new GeneratedVideo if `id` is missing,
 * otherwise patches the existing draft.
 */
/* Pick a thumbnail from the user's actual customizations so the My
   Pages card reflects what they're editing. Order of preference:
     1. First slot image (slideshow templates)
     2. First mediaUrl (legacy / non-slideshow)
     3. Template's default thumbnail
     4. Existing thumbnail */
function pickDraftThumbnail(customizations, templateThumb, currentThumb) {
  const isImg = (u) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(u || ''));
  const slots = customizations?.slots || {};
  const slotUrls = Object.values(slots).filter(Boolean);
  const firstSlotImage = slotUrls.find(isImg);
  if (firstSlotImage) return firstSlotImage;
  const mediaUrls = Array.isArray(customizations?.mediaUrls) ? customizations.mediaUrls : [];
  const firstMedia = mediaUrls.find(isImg);
  if (firstMedia) return firstMedia;
  return templateThumb || currentThumb || '';
}

export const saveDraft = async (req, res) => {
  try {
    const { id, templateId, customizations: bodyCustom, recipientName, sourceType } = req.body;
    const TplModel = templateModelFor(sourceType);
    const cleanRecipient = typeof recipientName === 'string'
      ? recipientName.trim().slice(0, 80)
      : '';

    if (id) {
      const video = await GeneratedVideo.findById(id).populate('templateId');
      if (!video || video.userId.toString() !== req.user._id.toString()) {
        return res.status(404).json({ message: 'Draft not found' });
      }
      // Only allow patching drafts and pending records via this endpoint.
      if (!['draft', 'pending', 'failed'].includes(video.status)) {
        return res.status(400).json({ message: 'Cannot save draft over a published page' });
      }
      const prev = video.customizations?.toObject?.() || video.customizations || {};
      const merged = { ...prev, ...(bodyCustom || {}) };
      const resolved = resolveStructureSnapshot(merged, video.templateId?.structure);
      if (resolved) merged.structureSnapshot = resolved;
      video.customizations = merged;
      // Mongoose Schema.Types.Mixed can't auto-detect nested changes —
      // even with a fresh object assignment Mongoose sometimes skips
      // the write. Mark the path so save() definitely persists it.
      video.markModified('customizations');
      video.status = 'draft';
      // Refresh recipient name if a non-empty new one came in, but never
      // wipe a saved name with an empty patch.
      if (cleanRecipient) video.recipientName = cleanRecipient;
      // Re-pick thumbnail from latest customizations so the My Pages
      // card reflects whatever the user just added.
      video.thumbnailUrl = pickDraftThumbnail(
        merged,
        video.templateId?.thumbnailUrl,
        video.thumbnailUrl,
      );
      await video.save();
      return res.json(video);
    }

    if (!templateId) return res.status(400).json({ message: 'templateId required for new drafts' });
    const customizations = { ...(bodyCustom || {}) };
    // Accept a client-held snapshot for templates the admin has since
    // removed/unpublished (see createVideoJob for the rationale).
    const hasClientSnap = hasUsableStructure(customizations.structureSnapshot);
    const template = await TplModel.findById(templateId);
    if (!template && !hasClientSnap) return res.status(404).json({ message: 'Template not found' });

    const resolved = resolveStructureSnapshot(customizations, template?.structure);
    if (resolved) customizations.structureSnapshot = resolved;
    snapshotTemplateMeta(customizations, template);
    const slug = uuidv4().replace(/-/g, '').slice(0, 12);
    const video = await GeneratedVideo.create({
      userId: req.user._id,
      templateId,
      sourceType: sourceType === 'BuilderTemplate' ? 'BuilderTemplate' : 'Template',
      customizations,
      recipientName: cleanRecipient || undefined,
      shareSlug: slug,
      status: 'draft',
      thumbnailUrl: pickDraftThumbnail(customizations, template?.thumbnailUrl, ''),
    });
    res.status(201).json(video);
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

    /* Slideshow templates publish instantly — set status='completed'
       and capture a thumbnail right here. Works for any prior status
       (draft, pending, completed, failed). */
    if (isSlideshow) {
      const slots = merged.slots || {};
      const urls = Object.values(slots).filter(Boolean);
      const firstImage = urls.find((u) => /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(u)));
      video.thumbnailUrl = firstImage || tpl?.thumbnailUrl || video.thumbnailUrl;
      video.videoUrl = null;
      video.status = 'completed';
      video.customizations = { ...merged, pageKind: 'web' };
      video.markModified('customizations');
      await video.save();
      return res.json(video);
    }

    /* Video templates need processing — drafts/pending stay pending so
     * the subsequent /process call picks them up; completed/failed get
     * re-queued with a fresh render. */
    if (video.status === 'draft' || video.status === 'pending') {
      video.customizations = merged;
      video.markModified('customizations');
      video.status = 'pending';
      await video.save();
      return res.json(video);
    }

    if (video.status === 'completed' || video.status === 'failed') {
      video.customizations = merged;
      video.markModified('customizations');
      video.status = 'pending';
      video.videoUrl = undefined;
      video.thumbnailUrl = tpl?.thumbnailUrl || video.thumbnailUrl || '';
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

/* Copy the source template's identifying meta onto the user's saved copy
   the first time (without overwriting on later saves). Keeps "My Pages"
   labels and the editor title working even after the admin deletes or
   renames the template — the user's page is fully independent. */
function snapshotTemplateMeta(customizations, template) {
  if (!customizations || !template) return;
  // Stash the id as a plain string too: once the admin deletes the
  // template, the populated `templateId` ref resolves to null, so this is
  // the only surviving handle the editor route needs.
  if (customizations.templateId == null && template._id) customizations.templateId = String(template._id);
  if (customizations.templateName == null) customizations.templateName = template.name || '';
  if (customizations.templateCategory == null) customizations.templateCategory = template.category || '';
  if (customizations.templateThumb == null) customizations.templateThumb = template.thumbnailUrl || '';
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

/* Is this a usable structure snapshot the client legitimately holds? Looser
   than isSlideshowStructure: JSON-mode builder templates carry a
   `builderState` tree (and their bulky `html` is stripped on the client),
   so the slides/html checks alone would wrongly reject them. */
function hasUsableStructure(raw) {
  const s = parseStructureMaybe(raw);
  if (!s) return false;
  if (isSlideshowStructure(s)) return true;
  return !!(s.builderState && typeof s.builderState === 'object');
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

/**
 * Resolve the public base URL that share links / QR codes should point to.
 * Order of precedence:
 *   1. `CLIENT_URL` env var — explicit production override.
 *   2. `Origin` header — set by the browser on cross-origin fetches.
 *   3. `Referer` header — set on same-origin requests when Origin isn't.
 *   4. `http://localhost:5173` — local dev fallback.
 */
function resolveShareBaseUrl(req) {
  if (process.env.CLIENT_URL) return process.env.CLIENT_URL.replace(/\/+$/, '');
  const origin = req.headers.origin;
  if (origin) return origin.replace(/\/+$/, '');
  const referer = req.headers.referer || req.headers.referrer;
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch { /* malformed referer — fall through */ }
  }
  return 'http://localhost:5173';
}

export const getQRCode = async (req, res) => {
  try {
    const video = await GeneratedVideo.findById(req.params.id);
    if (!video || video.userId.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    const baseUrl = resolveShareBaseUrl(req);
    const shareUrl = `${baseUrl}/watch/${video.shareSlug}`;
    const qrDataUrl = await QRCode.toDataURL(shareUrl, { width: 300, margin: 2 });
    res.json({
      shareUrl,
      qrCode: qrDataUrl,
      recipientName: video.recipientName || '',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
