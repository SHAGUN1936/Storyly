/**
 * Ensures exactly one admin account. Demotes every other user to "user",
 * then creates or updates the designated admin (email + password).
 *
 * Run: npm run seed:admin   (from server/) or from repo root: npm run seed:admin
 *
 * Optional in server/.env: ADMIN_EMAIL, ADMIN_PASSWORD (overrides defaults below)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.join(__dirname, '..');

dotenv.config({ path: path.join(serverDir, '.env') });
if (!process.env.MONGODB_URI?.trim()) {
  dotenv.config({ path: path.join(serverDir, '.env.example') });
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'agrawalvishal617@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Shagun2804';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

function emailRegex(email) {
  return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

function normalizeMongoUri(raw) {
  const DEFAULT = 'mongodb://127.0.0.1:27017/personalized-videos';
  if (!raw?.trim()) return DEFAULT;
  let u = String(raw).trim();
  if ((u.startsWith('"') && u.endsWith('"')) || (u.startsWith("'") && u.endsWith("'"))) u = u.slice(1, -1);
  return u.trim();
}

async function main() {
  const uri = normalizeMongoUri(process.env.MONGODB_URI);
  await mongoose.connect(uri);
  console.log('MongoDB: connected');

  const r = await User.updateMany({}, { $set: { role: 'user' } });
  console.log(`Demoted all users to "user" (matched ${r.matchedCount}, modified ${r.modifiedCount}).`);

  let user = await User.findOne({ email: emailRegex(ADMIN_EMAIL) });
  if (user) {
    user.email = ADMIN_EMAIL;
    user.role = 'admin';
    user.password = ADMIN_PASSWORD;
    user.name = user.name || ADMIN_NAME;
    await user.save();
    console.log('Updated existing account to admin:', ADMIN_EMAIL);
  } else {
    await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: ADMIN_NAME,
      role: 'admin',
    });
    console.log('Created admin account:', ADMIN_EMAIL);
  }

  const admins = await User.countDocuments({ role: 'admin' });
  console.log(`Admin users in DB: ${admins} (expected 1).`);

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
