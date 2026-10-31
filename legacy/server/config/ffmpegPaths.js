import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

/**
 * fluent-ffmpeg needs the ffmpeg binary on PATH, or explicit paths via env / bundled installer.
 * Import this module once (from utils/ffmpeg.js) after loadEnv.
 */
export function configureFfmpeg() {
  const custom = process.env.FFMPEG_PATH?.trim();
  if (custom) {
    if (!fs.existsSync(custom)) {
      console.warn('[ffmpeg] FFMPEG_PATH does not exist:', custom);
    }
    ffmpeg.setFfmpegPath(custom);
    console.log('[ffmpeg] Using FFMPEG_PATH from env');
  } else {
    const bundled = ffmpegInstaller?.path;
    if (bundled && fs.existsSync(bundled)) {
      ffmpeg.setFfmpegPath(bundled);
      console.log('[ffmpeg] Using @ffmpeg-installer/ffmpeg');
    } else {
      console.warn(
        '[ffmpeg] No bundled binary; using system ffmpeg on PATH. Install FFmpeg or set FFMPEG_PATH in server/.env'
      );
    }
  }

  const ffprobe = process.env.FFPROBE_PATH?.trim();
  if (ffprobe && fs.existsSync(ffprobe)) {
    ffmpeg.setFfprobePath(ffprobe);
  }
}
