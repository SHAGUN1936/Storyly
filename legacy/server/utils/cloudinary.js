import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export async function uploadToCloudinary(filePath, folder = 'personalized-videos') {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME?.trim() || !CLOUDINARY_API_KEY?.trim() || !CLOUDINARY_API_SECRET?.trim()) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error(
      'Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to server/.env'
    );
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
  });
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return result;
}

export async function uploadStream(stream, folder = 'personalized-videos', resourceType = 'video') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.pipe(uploadStream);
  });
}
