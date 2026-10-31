import mongoose from 'mongoose';
import { stripHtmlFields } from '../utils/jsonOnly.js';

/**
 * UserTemplate — the user's personal copy of a template (admin OR builder
 * sourced) with every customization they've made. Acts as both the
 * draft AND the published "page" of a user; status === 'draft' means
 * still being edited, status === 'completed' means published & shareable.
 *
 * Stored entirely as JSON in `customizations` so any layout/alignment/
 * position/decoration the user creates is reproduced exactly when they
 * re-open it via Edit, or when a visitor opens the share link.
 */
const generatedVideoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  /* Source template id — references either the admin `Template`
     collection or the builder `BuilderTemplate` collection. `sourceType`
     records which one so the editor knows where to fetch the base
     structure from. Defaults to 'admin' for backward compat with
     existing records that pre-date BuilderTemplate. */
  templateId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sourceType' },
  sourceType: {
    type: String,
    enum: ['Template', 'BuilderTemplate'],
    default: 'Template',
  },
  /* Person this story was made for — entered once when the user picks a
     template from Browse Templates. Locks the saved page to that name so
     the same dedicated story can't be re-purposed; sharing surfaces it
     ("For Ananya & Rohan") on the share page and QR popup. */
  recipientName: { type: String, trim: true, maxlength: 80 },
  videoUrl: { type: String },
  thumbnailUrl: { type: String },
  shareSlug: { type: String, unique: true },
  status: { type: String, enum: ['draft', 'pending', 'processing', 'completed', 'failed'], default: 'pending' },
  /* The full JSON state of the user's customizations. Includes:
       • text         — text-slot values
       • slots        — slot-keyed image/text fills
       • mediaUrls    — uploaded media list
       • themeOverrides — { pagePatches: [...] } with every block move,
                         text edit, sticker addition, alignment change
                         the user has made.
       • structureSnapshot — the resolved base structure (so render is
                              stable even if the source template later
                              changes).
       • pageKind / other derived fields the renderer needs.
     Mixed type so any shape persists exactly as written. */
  customizations: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

generatedVideoSchema.index({ userId: 1, createdAt: -1 });

/* JSON-only enforcement on the user's customizations: strip any `html`
   field that may have leaked in from an older client payload. */
generatedVideoSchema.pre('save', function (next) {
  if (this.customizations) {
    this.customizations = stripHtmlFields(this.customizations);
    this.markModified('customizations');
  }
  next();
});

export default mongoose.model('GeneratedVideo', generatedVideoSchema);
