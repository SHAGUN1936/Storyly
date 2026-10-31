import mongoose from 'mongoose';
import { stripHtmlFields } from '../utils/jsonOnly.js';

/**
 * Admin-published templates. The `structure` field stores PURE JSON —
 * the editor's `builderState` (pages, blocks, theme, slots) — never raw
 * HTML. Renderers turn the JSON into HTML on-the-fly via
 * `visualBuilderToHtml`, so user customizations (alignment, position,
 * etc.) can be merged on top.
 *
 * A pre-save hook strips any `html` field from the structure (or
 * customizations) before persisting, just in case an old client sends
 * one through.
 */
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
  /* JSON-only template structure. Expected shape:
       { type: 'slideshow', mode: 'json', builderState: {...},
         slots: [...], pages: [...] } */
  structure: { type: mongoose.Schema.Types.Mixed },
  duration: { type: Number },
  published: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

templateSchema.index({ category: 1, published: 1 });
templateSchema.index({ createdAt: -1 });

templateSchema.pre('save', function (next) {
  if (this.structure) {
    this.structure = stripHtmlFields(this.structure);
    if (this.structure && typeof this.structure === 'object') {
      // Pin the JSON mode so downstream renderers don't fall back to
      // the legacy raw-HTML branch.
      this.structure.mode = 'json';
      this.markModified('structure');
    }
  }
  next();
});

export default mongoose.model('Template', templateSchema);
