import express from 'express';
import { protect, adminOnly, devAdminBypass } from '../middleware/auth.js';
import {
  createTemplate,
  updateTemplate,
  getAllTemplates,
  deleteTemplate,
  publishTemplate
} from '../controllers/adminController.js';
import { upload } from '../utils/upload.js';
import { envBool } from '../utils/envBool.js';

const router = express.Router();

const useDevBypass = envBool('DEV_ADMIN_BYPASS') && process.env.NODE_ENV !== 'production';

if (useDevBypass) {
  router.use(devAdminBypass);
} else {
  router.use(protect, adminOnly);
}

const uploadFields = upload.fields([
  { name: 'preview', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

function runMulter(req, res, next) {
  uploadFields(req, res, (err) => {
    if (err) {
      console.error('[multer]', err.message);
      return res.status(400).json({ message: err.message || 'File upload error' });
    }
    next();
  });
}

router.get('/templates', getAllTemplates);
router.post('/templates', runMulter, createTemplate);
router.post('/templates/:id/publish', publishTemplate);
router.put('/templates/:id', runMulter, updateTemplate);
router.post('/templates/:id', runMulter, updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
