// Template structure rules, shared by the server and the editor.
//
// Product rule: every template and every user customization is stored as pure JSON.
// The renderer builds HTML on the fly from `builderState`, so user edits (alignment,
// position, stickers, text) can be applied on top. Raw HTML is never stored.

export type JsonObject = Record<string, unknown>;

export function isJsonObject(value: unknown): value is JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/** Deep copy with every `html` field and every `mode: "html"` removed. */
export function stripHtmlFields<T>(value: T): T {
  if (Array.isArray(value)) return value.map(stripHtmlFields) as T;
  if (!isJsonObject(value)) return value;
  const out: JsonObject = {};
  for (const [key, v] of Object.entries(value)) {
    if (key === "html") continue;
    if (key === "mode" && v === "html") continue;
    out[key] = stripHtmlFields(v);
  }
  return out as T;
}

/** Accepts a structure as an object or a JSON string. Returns null for anything unusable. */
export function parseStructure(raw: unknown): JsonObject | null {
  if (isJsonObject(raw)) return raw;
  if (typeof raw !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isJsonObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Cleans a structure coming from the admin or builder editor.
 * It must carry a `builderState` tree, which the renderer and user editor both need.
 * Throws an Error with a user-facing message when it doesn't.
 */
export function normalizeTemplateStructure(raw: unknown): JsonObject {
  const parsed = typeof raw === "string" ? parseStructure(raw) : raw;
  if (!isJsonObject(parsed)) {
    throw new Error("Template structure must be a JSON object. Raw HTML is no longer accepted.");
  }
  const cleaned = stripHtmlFields(parsed);
  if (!isJsonObject(cleaned.builderState)) {
    throw new Error(
      "Template structure must include a `builderState` JSON tree. Build the template through the Visual Builder instead of pasting HTML.",
    );
  }
  return { ...cleaned, type: cleaned.type || "slideshow", mode: "json" };
}

/**
 * True when the structure renders as an interactive web page (not an FFmpeg video).
 * That is any slideshow-type structure with slides, legacy HTML, or a builder tree.
 */
export function isWebPageStructure(raw: unknown) {
  const s = parseStructure(raw);
  if (!s) return false;
  // Templates imported from a website are always web pages
  if (s.type === "site") return typeof s.document === "string";
  if (s.type && String(s.type).toLowerCase() !== "slideshow") return false;
  if (Array.isArray(s.slides) && s.slides.length > 0) return true;
  if (s.mode === "html" && typeof s.html === "string" && s.html.trim()) return true;
  return isJsonObject(s.builderState);
}

/**
 * The structure a page should render with: the page's own snapshot when it is usable,
 * otherwise the source template's. Pages keep a snapshot so they still work after the
 * admin edits or deletes the template.
 */
export function resolveStructureSnapshot(customizations: JsonObject | null | undefined, templateStructure: unknown) {
  const fromPage = parseStructure(customizations?.structureSnapshot);
  const fromTemplate = parseStructure(templateStructure);
  if (isWebPageStructure(fromPage)) return fromPage;
  if (isWebPageStructure(fromTemplate)) return fromTemplate;
  return fromPage ?? fromTemplate;
}
