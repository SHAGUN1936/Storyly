import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/jwtSecret.js';
import { envBool } from '../utils/envBool.js';

const DEV_ADMIN_EMAIL = 'shagun2804@gmail.com';

/**
 * When DEV_ADMIN_BYPASS is enabled and not production, admin routes use a MongoDB-backed dev admin user (no JWT).
 */
export const devAdminBypass = async (req, res, next) => {
  try {
    let user = await User.findOne({ email: DEV_ADMIN_EMAIL });
    if (!user) {
      user = await User.create({
        email: DEV_ADMIN_EMAIL,
        name: 'Shagun',
        password: 'Shagun@2804',
        role: 'admin',
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('[devAdminBypass]', err);
    res.status(500).json({ message: err.message });
  }
};

export const protect = async (req, res, next) => {
  let token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.slice(7));
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
