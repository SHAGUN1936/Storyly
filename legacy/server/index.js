import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import builderTemplateRoutes from './routes/builderTemplates.js';
import videoRoutes from './routes/videos.js';
import adminRoutes from './routes/admin.js';
import publicRoutes from './routes/public.js';
import musicRoutes from './routes/music.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://storyly-rosy.vercel.app',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/builder-templates', builderTemplateRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/music', musicRoutes);

app.get('/api/health', (req, res) => {
  const mongo =
    mongoose.connection.readyState === 1
      ? 'connected'
      : mongoose.connection.readyState === 2
        ? 'connecting'
        : 'disconnected';
  res.json({ status: 'ok', mongo });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
