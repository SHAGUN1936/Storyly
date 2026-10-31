import express from 'express';
import { getVideoBySlug } from '../controllers/videoController.js';

const router = express.Router();
router.get('/video/:slug', getVideoBySlug);
export default router;
