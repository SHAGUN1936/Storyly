import mongoose from 'mongoose';
import Template from '../models/Template.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

function sendError(res, err, logLabel) {
  console.error(logLabel, err);
  if (err instanceof mongoose.Error.ValidationError) {
    const msg = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return res.status(400).json({ message: msg });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate value' });
  }
  return res.status(500).json({ message: err.message || 'Server error' });
}

function parseStructure(structure) {
  if (structure == null || structure === '') return undefined;
  if (typeof structure === 'object' && !Array.isArray(structure)) return structure;
  if (typeof structure === 'string') {
    try {
      return JSON.parse(structure || '{}');
    } catch {
      throw new Error('Invalid JSON in structure field');
    }
  }
  return structure;
}

export const createTemplate = async (req, res) => {
  try {
    const { name, category, description, structure, duration } = req.body;
    let previewVideoUrl = '';
    let thumbnailUrl = '';
    if (req.files?.thumbnail?.[0]?.path) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].path, 'template-thumbnails');
      thumbnailUrl = result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/');
    }
    if (req.files?.preview?.[0]?.path) {
      const result = await uploadToCloudinary(req.files.preview[0].path, 'template-previews');
      previewVideoUrl = result.secure_url;
      if (!thumbnailUrl) {
        thumbnailUrl = result.secure_url.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/');
      }
    }
    let parsedStructure;
    try {
      parsedStructure = parseStructure(structure);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
    const template = await Template.create({
      name,
      category: category || 'Memories',
      description,
      structure: parsedStructure ?? {},
      duration: duration ? Number(duration) : 10,
      previewVideoUrl,
      thumbnailUrl,
      published: false,
      createdBy: req.user._id,
    });
    res.status(201).json(template);
  } catch (err) {
    sendError(res, err, '[admin createTemplate]');
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Website not found' });
    const { name, category, description, structure, duration, published } = req.body;
    if (name) template.name = name;
    if (category) template.category = category;
    if (description !== undefined) template.description = description;
    if (structure !== undefined && structure !== '') {
      try {
        template.structure = parseStructure(structure);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
    }
    if (duration !== undefined && duration !== '') template.duration = Number(duration);
    if (typeof published === 'boolean') template.published = published;
    if (req.files?.thumbnail?.[0]?.path) {
      const result = await uploadToCloudinary(req.files.thumbnail[0].path, 'template-thumbnails');
      template.thumbnailUrl = result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fill/');
    }
    if (req.files?.preview?.[0]?.path) {
      const result = await uploadToCloudinary(req.files.preview[0].path, 'template-previews');
      template.previewVideoUrl = result.secure_url;
      if (!req.files?.thumbnail?.[0]?.path) {
        template.thumbnailUrl = result.secure_url.replace('/upload/', '/upload/so_0,w_400,h_300,c_fill/');
      }
    }
    await template.save();
    res.json(template);
  } catch (err) {
    sendError(res, err, '[admin updateTemplate]');
  }
};

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json(templates);
  } catch (err) {
    sendError(res, err, '[admin getAllTemplates]');
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Website not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, '[admin deleteTemplate]');
  }
};

export const publishTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { published: true },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Website not found' });
    res.json(template);
  } catch (err) {
    sendError(res, err, '[admin publishTemplate]');
  }
};
