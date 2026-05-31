import express from 'express';
import {
  signup,
  login,
  googleAuth,
  me,
  logout,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', protect, me);
router.patch('/me', protect, updateProfile);
router.post('/password', protect, changePassword);
router.post('/logout', logout);
export default router;
