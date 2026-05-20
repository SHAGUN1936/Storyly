import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'],
    required: true 
  },
  description: { type: String },
  previewVideoUrl: { type: String },
  thumbnailUrl: { type: String },
  structure: { type: mongoose.Schema.Types.Mixed }, // JSON structure for slots, text, duration
  duration: { type: Number }, // seconds
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

templateSchema.index({ category: 1, published: 1 });
templateSchema.index({ createdAt: -1 });

export default mongoose.model('Template', templateSchema);
