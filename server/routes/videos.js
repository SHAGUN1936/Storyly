import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createVideoJob,
  processVideo,
  getMyVideos,
  getVideoById,
  deleteVideoJob,
  updateVideoJob,
  getQRCode
} from '../controllers/videoController.js';
import { uploadMedia } from '../controllers/uploadController.js';
import { upload } from '../utils/upload.js';

const router = express.Router();
router.use(protect);
router.post('/upload', upload.single('media'), uploadMedia);
router.post('/', createVideoJob);
router.get('/my', getMyVideos);
router.get('/:id/qr', getQRCode);
router.patch('/:id', updateVideoJob);
router.delete('/:id', deleteVideoJob);
router.get('/:id', getVideoById);
router.post('/:id/process', processVideo);
export default router;
