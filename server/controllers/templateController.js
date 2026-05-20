import Template from '../models/Template.js';

export const getPublishedTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { published: true };
    if (category) filter.category = category;
    const templates = await Template.find(filter).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Website not found' });
    if (!template.published && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'This website is not available' });
    }
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
