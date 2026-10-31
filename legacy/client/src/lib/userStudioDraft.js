/**
 * Helpers for the user-facing Studio editor (UserStudio.jsx).
 *
 * The user edits a PRIVATE copy of a template's `builderState` with the same
 * admin-style canvas, then we persist that edited design into their own draft
 * (a GeneratedVideo job) — never back onto the master template. These pure
 * helpers isolate the two transforms that bridge the editor state and the
 * saved/shared shapes.
 */
import { htmlToStructure } from './htmlTemplate';
import {
  visualBuilderToHtml,
  normalizeBuilderState,
  defaultVisualBuilderState,
} from './visualTemplateBuilder';

/** Parse a template/job `structure` field that may be an object OR a JSON string. */
function parseStructureRaw(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

/**
 * Deep-clone a template's `builderState` for editing, so the user's canvas
 * mutators never reach into the live template object held in component state
 * (the master template must stay immutable). Falls back to a fresh default
 * builder when the template has no usable builderState.
 *
 * Accepts the raw template object (admin Template or BuilderTemplate); reads
 * `structure.builderState`.
 */
export function cloneBuilderStateFromTemplate(template) {
  const structure = parseStructureRaw(template?.structure);
  const bs = structure?.builderState;
  if (bs && typeof bs === 'object') {
    // JSON deep-clone first → normalize. normalizeBuilderState may return
    // shared nested refs, so the clone is what guarantees immutability.
    try {
      return normalizeBuilderState(JSON.parse(JSON.stringify(bs)));
    } catch {
      return normalizeBuilderState(bs);
    }
  }
  return defaultVisualBuilderState();
}

/**
 * Build the share-ready structure snapshot from an edited builderState — the
 * SAME shape the admin editor saves: `{ type:'slideshow', mode:'html', html,
 * builderState }`. The server's `resolveStructureSnapshot` and the client's
 * `getSharePageStructure` only prefer a job's snapshot when it passes
 * `isSlideshowStructure` (mode === 'html' AND non-empty html), so the html
 * MUST be present — `visualBuilderToHtml` always emits markup, and we guard
 * with a minimal fallback just in case.
 */
export function buildStructureSnapshot(builderState) {
  const normalized = normalizeBuilderState(builderState);
  let html = '';
  try {
    html = visualBuilderToHtml(normalized) || '';
  } catch {
    html = '';
  }
  let structure;
  try {
    structure = htmlToStructure(html);
  } catch {
    structure = null;
  }
  if (!structure || typeof structure !== 'object') {
    structure = { type: 'slideshow', mode: 'html', html };
  }
  // Defensive: a degenerate design could yield empty html, which would make
  // the snapshot fail isSlideshowStructure and silently fall back to the
  // template (losing the user's edits). Pin a non-empty html + the builder
  // tree so the snapshot always wins.
  if (!structure.html || !String(structure.html).trim()) {
    structure.html = '<div class="tpl-deck" data-empty="1"></div>';
  }
  structure.type = 'slideshow';
  structure.mode = 'html';
  structure.builderState = normalized;
  return structure;
}
