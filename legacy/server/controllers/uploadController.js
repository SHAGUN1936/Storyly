import { uploadToCloudinary } from '../utils/cloudinary.js';

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file?.path) return res.status(400).json({ message: 'No file uploaded' });
    const result = await uploadToCloudinary(req.file.path, 'user-media');
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
