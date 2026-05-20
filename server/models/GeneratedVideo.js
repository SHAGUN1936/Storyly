import mongoose from 'mongoose';

const generatedVideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', required: true },
  videoUrl: { type: String },
  thumbnailUrl: { type: String },
  shareSlug: { type: String, unique: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  customizations: { type: mongoose.Schema.Types.Mixed }, // uploaded media URLs, text
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

generatedVideoSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('GeneratedVideo', generatedVideoSchema);
