/**
 * JSON-only enforcement helpers.
 *
 * The product rule: every template (admin or builder) and every user
 * customization is stored as PURE JSON — no raw HTML strings, no
 * pre-rendered markup. The render pipeline (visualBuilderToHtml) builds
 * HTML on-the-fly from the JSON `builderState`, so saving HTML directly
 * just blocks the editor from applying user patches (alignment, position,
 * sticker placement, text edits) on top.
 *
 * These helpers strip any sneaky `html` field from incoming payloads and
 * ensure that we keep only structured JSON data on disk.
 */

/**
 * Deep-clone-and-strip: returns a copy of the value with any
 * `html` / raw-string-of-HTML field removed at the top level + one
 * level deep. Mixed types in Mongoose accept any shape, so this acts
 * as our application-level constraint.
 */
export function stripHtmlFields(value) {
  if (value == null) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stripHtmlFields);
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    // Skip any field named exactly 'html' — that's where the legacy
    // raw-HTML string used to live on `structure`.
    if (k === 'html') continue;
    // Also drop `mode: 'html'` — the renderer should always treat
    // structures as JSON-mode going forward.
    if (k === 'mode' && v === 'html') continue;
    out[k] = stripHtmlFields(v);
  }
  return out;
}

/**
 * Ensure a template structure has the JSON-mode shape:
 * `{ type, builderState: {...}, slots, pages, ... }`.
 * Returns the cleaned structure or throws if it's unusable.
 */
export function ensureJsonStructure(structure) {
  if (!structure || typeof structure !== 'object') {
    throw new Error('Template structure must be a JSON object — raw HTML is no longer accepted.');
  }
  const cleaned = stripHtmlFields(structure);
  if (!cleaned.builderState || typeof cleaned.builderState !== 'object') {
    throw new Error('Template structure must include a `builderState` JSON tree — use the Visual Builder to author templates.');
  }
  // Stamp the mode so downstream code is unambiguous.
  cleaned.type = cleaned.type || 'slideshow';
  cleaned.mode = 'json';
  return cleaned;
}

/**
 * For user customizations on GeneratedVideo — strips html fields but
 * doesn't require builderState (customizations are patches, not the
 * full template).
 */
export function cleanCustomizations(customizations) {
  if (!customizations || typeof customizations !== 'object') return {};
  return stripHtmlFields(customizations);
}
