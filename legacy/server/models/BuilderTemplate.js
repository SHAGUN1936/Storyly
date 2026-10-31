import mongoose from 'mongoose';
import { stripHtmlFields } from '../utils/jsonOnly.js';

/**
 * Builder templates — published by users with role='builder'. They appear
 * in the public Browse Templates grid alongside admin templates. Each
 * record carries a `builderId` referencing the owning user.
 *
 * Schema mirrors the admin Template model so the frontend can render
 * either kind through the same components. The only structural addition
 * is `builderId`, which lets us attribute / filter / moderate per-builder.
 */
const builderTemplateSchema = new mongoose.Schema({
  builderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding', 'Event', 'Invitation', 'Couple', 'Greeting'],
    required: true,
  },
  description: { type: String },
  previewVideoUrl: { type: String },
  thumbnailUrl: { type: String },
  /* Full JSON structure for the template — slots, text, theme, builder
     state. Stored as Mixed so the editor can keep ANY shape (alignment,
     positions, decorations, music, etc.) and render it back identically. */
  structure: { type: mongoose.Schema.Types.Mixed },
  duration: { type: Number },
  published: { type: Boolean, default: false },
  /* Soft moderation gate — admins can flip this to remove a builder
     template from the public grid without deleting it. */
  approved: { type: Boolean, default: true },
}, { timestamps: true });

builderTemplateSchema.index({ category: 1, published: 1, approved: 1 });
builderTemplateSchema.index({ builderId: 1, createdAt: -1 });
builderTemplateSchema.index({ createdAt: -1 });

/* JSON-only enforcement: strip any `html` field on save and pin
   `mode: 'json'` so renderers always go through the JSON path. */
builderTemplateSchema.pre('save', function (next) {
  if (this.structure) {
    this.structure = stripHtmlFields(this.structure);
    if (this.structure && typeof this.structure === 'object') {
      this.structure.mode = 'json';
      this.markModified('structure');
    }
  }
  next();
});

export default mongoose.model('BuilderTemplate', builderTemplateSchema);
