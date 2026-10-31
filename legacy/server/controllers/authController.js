import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { getJwtSecret } from '../utils/jwtSecret.js';
import { friendlyError } from '../utils/friendlyError.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

export const signup = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password and name required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ email, password, name });
    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.status(201).json({
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
      token
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    console.error('[signup]', err);
    const fe = friendlyError(err, 'Signup failed. Please try again.');
    res.status(fe.status).json({ message: fe.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.json({
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
      token
    });
  } catch (err) {
    console.error('[login]', err);
    const fe = friendlyError(err, 'Login failed. Please try again.');
    res.status(fe.status).json({ message: fe.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        googleId: payload.sub
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      user.avatar = user.avatar || payload.picture;
      await user.save();
    }
    const token = generateToken(user._id);
    res.cookie('token', token, cookieOptions);
    res.json({
      user: { id: user._id, email: user.email, name: user.name, avatar: user.avatar, role: user.role },
      token
    });
  } catch (err) {
    console.error('[googleAuth]', err);
    const fe = friendlyError(err, 'Google sign-in failed. Please try again.');
    res.status(fe.status).json({ message: fe.message });
  }
};

export const me = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
      role: req.user.role
    }
  });
};

export const logout = (req, res) => {
  res.cookie('token', '', { ...cookieOptions, maxAge: 0 });
  res.json({ message: 'Logged out' });
};

/**
 * PATCH /auth/me — update the signed-in user's editable profile fields.
 * Currently allows: name, avatar.
 * Email is NOT editable (unique identifier, used for billing/login).
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (name.trim().length > 80) {
      return res.status(400).json({ message: 'Name must be 80 characters or fewer' });
    }
    req.user.name = name.trim();
    if (typeof avatar === 'string') req.user.avatar = avatar.trim();
    await req.user.save();
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
      }
    });
  } catch (err) {
    console.error('[updateProfile]', err);
    const fe = friendlyError(err, 'Could not update profile.');
    res.status(fe.status).json({ message: fe.message });
  }
};

/**
 * POST /auth/password — change the signed-in user's password.
 * Requires the current password for verification.
 * Google-only accounts (no local password) can set one for the first time.
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    if (req.user.password) {
      // User has an existing password — must verify it.
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required' });
      }
      const match = await req.user.comparePassword(currentPassword);
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
    }
    req.user.password = newPassword; // pre-save hook re-hashes
    await req.user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error('[changePassword]', err);
    const fe = friendlyError(err, 'Could not update password.');
    res.status(fe.status).json({ message: fe.message });
  }
};
