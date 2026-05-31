import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  listPublicBuilderTemplates,
  getBuilderTemplate,
  listMyBuilderTemplates,
  createBuilderTemplate,
  updateBuilderTemplate,
  deleteBuilderTemplate,
} from '../controllers/builderTemplateController.js';

const router = express.Router();

/* Public — anyone authenticated can browse builder templates (same
   surface as admin templates in the Browse grid). */
router.use(protect);
router.get('/',            listPublicBuilderTemplates);
router.get('/mine',        listMyBuilderTemplates);
router.get('/:id',         getBuilderTemplate);

/* Builder-only — only role='builder' (and 'admin') can mutate. */
router.post('/',           createBuilderTemplate);
router.patch('/:id',       updateBuilderTemplate);
router.delete('/:id',      deleteBuilderTemplate);

export default router;
