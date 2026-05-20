import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { configureFfmpeg } from '../config/ffmpegPaths.js';

configureFfmpeg();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const filePath = path.join(__dirname, '../uploads', 'temp-' + Date.now() + path.extname(new URL(url).pathname));
    const file = fs.createWriteStream(filePath);
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        return downloadFile(redirectUrl).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(filePath));
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

export async function generateVideoWithFFmpeg(videoDoc, outputPath) {
  const customizations = videoDoc.customizations || {};
  const mediaUrls = customizations.mediaUrls || [];
  const customText = customizations.text || '';

  if (mediaUrls.length === 0) {
    const inputPath = path.join(__dirname, '../uploads', 'placeholder.txt');
    if (!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(inputPath, 'Personalized Video');
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input('color=c=blue:s=1280x720:d=5')
        .inputOptions(['-f lavfi'])
        .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-t 5'])
        .output(outputPath)
        .on('end', () => {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          resolve();
        })
        .on('error', (err) => {
          if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
          reject(err);
        })
        .run();
    });
  }

  const tempFiles = [];
  try {
    const firstUrl = mediaUrls[0];
    const localPath = await downloadFile(firstUrl);
    tempFiles.push(localPath);

    return new Promise((resolve, reject) => {
      const cmd = ffmpeg(localPath)
        .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-pix_fmt yuv420p'])
        .output(outputPath)
        .duration(10)
        .on('end', () => {
          tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
          resolve();
        })
        .on('error', (err) => {
          tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
          reject(err);
        });
      cmd.run();
    });
  } catch (err) {
    tempFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    throw err;
  }
}
