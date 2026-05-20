import express from 'express';
import { getPublishedTemplates, getTemplateById } from '../controllers/templateController.js';

const router = express.Router();
router.get('/', getPublishedTemplates);
router.get('/:id', getTemplateById);
export default router;
