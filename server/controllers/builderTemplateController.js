import BuilderTemplate from '../models/BuilderTemplate.js';
import { stripHtmlFields } from '../utils/jsonOnly.js';

/* Helper — ensure the caller has the right role. */
const isBuilder = (user) => user?.role === 'builder' || user?.role === 'admin';

/**
 * JSON-only validator for incoming `structure` payloads. Drops any raw
 * `html` field and refuses to save a structure that doesn't carry a
 * `builderState` tree (which is what the renderer + editor consume).
 */
function normalizeStructure(raw) {
  if (raw == null) return undefined;
  if (typeof raw !== 'object') {
    throw new Error('Template structure must be a JSON object.');
  }
  const cleaned = stripHtmlFields(raw);
  if (!cleaned.builderState || typeof cleaned.builderState !== 'object') {
    throw new Error('Template structure must include a `builderState` JSON tree.');
  }
  cleaned.type = cleaned.type || 'slideshow';
  cleaned.mode = 'json';
  return cleaned;
}

/**
 * Public list — every published + approved builder template, plus
 * optional filter by category. Joined with admin templates on the
 * frontend (`templatesAPI.list`) so Browse Templates shows both.
 */
export const listPublicBuilderTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { published: true, approved: true };
    if (category) filter.category = category;
    const items = await BuilderTemplate.find(filter)
      .populate('builderId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Single template by id — used by the editor when a user picks one. */
export const getBuilderTemplate = async (req, res) => {
  try {
    const tpl = await BuilderTemplate.findById(req.params.id)
      .populate('builderId', 'name avatar');
    if (!tpl) return res.status(404).json({ message: 'Template not found' });
    res.json(tpl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Builder-only — list templates owned by the calling builder (so the
 * "My builder templates" surface can render). Includes drafts.
 */
export const listMyBuilderTemplates = async (req, res) => {
  try {
    if (!isBuilder(req.user)) return res.status(403).json({ message: 'Builder access required' });
    const items = await BuilderTemplate.find({ builderId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Builder-only — create a new builder template (draft by default). */
export const createBuilderTemplate = async (req, res) => {
  try {
    if (!isBuilder(req.user)) return res.status(403).json({ message: 'Builder access required' });
    const { name, category, description, structure, thumbnailUrl, duration, published } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'name and category are required' });
    let cleaned;
    try {
      cleaned = normalizeStructure(structure);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }
    const created = await BuilderTemplate.create({
      builderId: req.user._id,
      name,
      category,
      description: description || '',
      structure: cleaned || {},
      thumbnailUrl: thumbnailUrl || '',
      duration: duration || 0,
      published: Boolean(published),
      approved: true,
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Builder-only — update one of MY templates. */
export const updateBuilderTemplate = async (req, res) => {
  try {
    if (!isBuilder(req.user)) return res.status(403).json({ message: 'Builder access required' });
    const tpl = await BuilderTemplate.findById(req.params.id);
    if (!tpl) return res.status(404).json({ message: 'Template not found' });
    if (String(tpl.builderId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your template' });
    }
    const allow = ['name', 'category', 'description', 'thumbnailUrl', 'duration', 'published'];
    for (const k of allow) {
      if (k in req.body) tpl[k] = req.body[k];
    }
    if (req.body.structure !== undefined) {
      try {
        tpl.structure = normalizeStructure(req.body.structure);
      } catch (e) {
        return res.status(400).json({ message: e.message });
      }
      tpl.markModified('structure');
    }
    await tpl.save();
    res.json(tpl);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Builder-only — delete one of MY templates (admin can delete any). */
export const deleteBuilderTemplate = async (req, res) => {
  try {
    if (!isBuilder(req.user)) return res.status(403).json({ message: 'Builder access required' });
    const tpl = await BuilderTemplate.findById(req.params.id);
    if (!tpl) return res.status(404).json({ message: 'Template not found' });
    if (String(tpl.builderId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not your template' });
    }
    await BuilderTemplate.deleteOne({ _id: tpl._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
