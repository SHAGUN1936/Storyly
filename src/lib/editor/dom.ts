// Helpers for the page being edited. The editor's iframe shares this site's origin but runs no scripts,
// so the editor reads and changes the page's DOM directly.
//
// Elements from the iframe belong to another window, so `instanceof HTMLElement` is always false here:
// check nodeType / tagName instead.

import { LABEL_ATTR, SLOT_ATTR } from "@/lib/site-template";

/** Attributes the editor puts on elements while editing. Never saved. */
const EDITOR_ATTRS = [
  "data-sl-hover",
  "data-sl-selected",
  "data-sl-editing",
  "data-sl-drop",
  "data-sl-wired",
  "data-sl-current",
  "data-sl-open",
];

/** Styles only the editor sees: hover/selection outlines, drop markers, clickable embeds. */
const EDITOR_CSS = `
html{scrollbar-width:thin}
[data-sl-hover]:not([data-sl-selected]){outline:1px dashed rgba(24,24,27,.55)!important;outline-offset:1px}
[data-sl-selected]{outline:2px solid #18181b!important;outline-offset:1px;box-shadow:0 0 0 4px rgba(255,255,255,.7)!important}
[data-sl-editing]{outline:2px dashed #18181b!important;cursor:text!important}
[data-sl-drop="before"]{box-shadow:0 -3px 0 0 #18181b!important}
[data-sl-drop="after"]{box-shadow:0 3px 0 0 #18181b!important}
[data-sl-drop="inside"]{outline:2px dashed #18181b!important;outline-offset:-2px}
iframe,video,embed,object{pointer-events:none!important}
a,button,label{cursor:default!important}
[data-storyly-page]:not([data-sl-current]){display:none!important}
[data-storyly-popup][data-sl-open]{display:flex!important;animation:none!important}
[data-storyly-popup][data-sl-open]>[data-storyly-popup-box]{animation:none!important}
`;

/** Tags that are never shown or picked in the editor. */
const SKIPPED = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "LINK", "META", "BR", "TEMPLATE", "TITLE", "HEAD", "WBR"]);

/** Tags that hold text the user can type into. */
const TEXT_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "A",
  "BUTTON",
  "LI",
  "LABEL",
  "BLOCKQUOTE",
  "EM",
  "STRONG",
  "B",
  "I",
  "SMALL",
  "FIGCAPTION",
  "TD",
  "TH",
  "DT",
  "DD",
  "CITE",
  "Q",
  "TIME",
  "MARK",
]);

const NAMES: Record<string, string> = {
  BODY: "Page",
  H1: "Heading 1",
  H2: "Heading 2",
  H3: "Heading 3",
  H4: "Heading 4",
  H5: "Heading 5",
  H6: "Heading 6",
  P: "Text",
  SPAN: "Text",
  A: "Link",
  BUTTON: "Button",
  IMG: "Image",
  VIDEO: "Video",
  IFRAME: "Embed",
  SECTION: "Section",
  HEADER: "Header",
  FOOTER: "Footer",
  NAV: "Menu",
  MAIN: "Main",
  ARTICLE: "Article",
  ASIDE: "Sidebar",
  UL: "List",
  OL: "Numbered list",
  LI: "List item",
  FORM: "Form",
  INPUT: "Input",
  TEXTAREA: "Text box",
  SELECT: "Dropdown",
  BLOCKQUOTE: "Quote",
  FIGURE: "Figure",
  HR: "Divider",
  SVG: "Icon",
  svg: "Icon",
  TABLE: "Table",
  DIV: "Box",
  PICTURE: "Picture",
  CANVAS: "Canvas",
};

export const isElement = (node: unknown): node is HTMLElement =>
  !!node && typeof node === "object" && (node as Node).nodeType === 1;

export const isTag = (el: Element | null | undefined, ...tags: string[]) =>
  !!el && tags.includes(el.tagName.toUpperCase());

/** Elements shown in the layers list and pickable on the canvas. */
export function visibleChildren(el: Element) {
  return Array.from(el.children).filter(
    (c) => !SKIPPED.has(c.tagName.toUpperCase()) && !c.hasAttribute("data-sl-editor"),
  );
}

export function isPickable(el: Element) {
  return !SKIPPED.has(el.tagName.toUpperCase()) && el.tagName !== "HTML";
}

/** True when the element is mostly text (so it can be typed into and styled as text). */
export function isTextElement(el: Element) {
  if (isTag(el, "IMG", "VIDEO", "IFRAME", "HR", "INPUT", "SELECT", "TEXTAREA", "SVG")) return false;
  if (!el.textContent?.trim()) return false;
  if (TEXT_TAGS.has(el.tagName.toUpperCase())) return true;
  // A box with only text and inline formatting inside it.
  return Array.from(el.children).every((c) => TEXT_TAGS.has(c.tagName.toUpperCase()) || c.tagName === "BR");
}

/** Plain text with no child elements: safe to replace as a whole. */
export const isPlainText = (el: Element) => isTextElement(el) && el.children.length === 0;

/** Name shown in the layers list and the inspector. */
export function elementName(el: Element) {
  const label = el.getAttribute(LABEL_ATTR);
  if (label) return label;
  if (el.hasAttribute("data-storyly-page")) return `Page: ${el.getAttribute("data-storyly-name") || "Untitled"}`;
  if (el.hasAttribute("data-storyly-popup")) return `Popup: ${el.getAttribute("data-storyly-name") || "Untitled"}`;
  if (el.hasAttribute("data-storyly-popup-box")) return "Popup box";
  const tag = el.tagName.toUpperCase();
  if (el.hasAttribute("data-storyly-countdown")) return "Countdown";
  if (el.hasAttribute("data-storyly-map")) return "Map";
  if (el.hasAttribute("data-storyly-video")) return "Video";
  const base = NAMES[tag] ?? NAMES[el.tagName] ?? tag.toLowerCase();
  if (tag === "IMG") return el.getAttribute("alt")?.trim().slice(0, 28) || base;
  if (isTextElement(el) && tag !== "BODY") {
    const text = el.textContent!.replace(/\s+/g, " ").trim();
    return text.length > 28 ? `${text.slice(0, 28)}…` : text;
  }
  return base;
}

export const kindName = (el: Element) => NAMES[el.tagName.toUpperCase()] ?? el.tagName.toLowerCase();

/** Where an element sits in the page (child indexes), to find it again after undo. */
export function pathOf(el: Element | null) {
  const path: number[] = [];
  while (el && el.parentElement) {
    path.unshift(Array.from(el.parentElement.children).indexOf(el));
    el = el.parentElement;
  }
  return path;
}

export function elementAt(doc: Document, path: number[]) {
  let el: Element | undefined = doc.documentElement;
  for (const i of path) el = el?.children[i];
  return isElement(el) ? el : null;
}

/** Adds the editor-only styles to the page. */
export function prepareEditorDoc(doc: Document) {
  // Saved pages hide all but the first page; the editor shows pages itself (see pages.ts applyView)
  doc.querySelectorAll("[data-storyly-page][hidden]").forEach((p) => p.removeAttribute("hidden"));
  if (doc.head.querySelector("style[data-sl-editor]")) return;
  const style = doc.createElement("style");
  style.setAttribute("data-sl-editor", "");
  style.textContent = EDITOR_CSS;
  doc.head.appendChild(style);
}

/** Removes editor attributes from `root` (itself included) and everything inside it. */
export function clearEditorAttrs(root: Element | Document, ...attrs: string[]) {
  for (const attr of attrs.length ? attrs : EDITOR_ATTRS) {
    const self = isElement(root) && root.hasAttribute(attr) ? [root] : [];
    [...self, ...Array.from(root.querySelectorAll(`[${attr}]`))].forEach((n) => {
      if (attr === "data-sl-editing") n.removeAttribute("contenteditable");
      n.removeAttribute(attr);
    });
  }
}

// The page's scripts never run in the editor. Giving them a type browsers ignore keeps them in the page
// (and out of the console's "blocked script" warnings); the real type is put back when saving.
const PAUSED_SCRIPT = "text/x-storyly-paused";

export function pauseScript(script: Element) {
  if (script.getAttribute("type") === PAUSED_SCRIPT) return;
  script.setAttribute("data-sl-type", script.getAttribute("type") ?? "");
  script.setAttribute("type", PAUSED_SCRIPT);
}

export function pauseScripts(root: ParentNode) {
  root.querySelectorAll("script").forEach(pauseScript);
}

function resumeScripts(root: Element) {
  root.querySelectorAll("script[data-sl-type]").forEach((s) => {
    const type = s.getAttribute("data-sl-type");
    if (type) s.setAttribute("type", type);
    else s.removeAttribute("type");
    s.removeAttribute("data-sl-type");
  });
}

/** The template as the editor's iframe loads it. Browser only. */
export function editableHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  // Pages saved before the editor cleaned up after itself may still carry its markers
  clearEditorAttrs(parsed.documentElement);
  pauseScripts(parsed);
  return `<!DOCTYPE html>\n${parsed.documentElement.outerHTML}`;
}

/** The page as HTML, without anything the editor added for itself. */
export function serialize(doc: Document) {
  syncMobileStyles(doc);
  const root = doc.documentElement.cloneNode(true) as HTMLElement;
  root.querySelectorAll("[data-sl-editor]").forEach((n) => n.remove());
  clearEditorAttrs(root);
  resumeScripts(root);
  // Before the page's script runs, only the first page shows
  root.querySelectorAll("[data-storyly-page]").forEach((page, i) => page.toggleAttribute("hidden", i > 0));
  return `<!DOCTYPE html>\n${root.outerHTML}`;
}

/** Puts a saved snapshot back into the page (undo / redo). Event listeners on `doc` stay. */
export function restore(doc: Document, html: string) {
  const parsed = new DOMParser().parseFromString(html, "text/html");
  pauseScripts(parsed);
  doc.replaceChild(doc.importNode(parsed.documentElement, true), doc.documentElement);
  prepareEditorDoc(doc);
}

const randomId = () => Math.random().toString(36).slice(2, 8);

/** A slot id that is not used yet, made from a label: "Couple names" -> "couple-names". */
export function uniqueSlotId(doc: Document, label: string) {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "field";
  let id = base;
  while (doc.querySelector(`[${SLOT_ATTR}="${id}"]`)) id = `${base}-${randomId().slice(0, 3)}`;
  return id;
}

/** Copy of an element for duplicate/paste: no editable-part ids or style ids, so nothing clashes. */
export function cloneForInsert(el: Element) {
  const copy = el.cloneNode(true) as HTMLElement;
  for (const node of [copy, ...Array.from(copy.querySelectorAll("*"))]) {
    for (const attr of [...EDITOR_ATTRS, SLOT_ATTR, LABEL_ATTR, "data-storyly-id", "id"]) node.removeAttribute(attr);
    if (node.getAttribute("contenteditable") === "true") node.removeAttribute("contenteditable");
  }
  return copy;
}

// ---------- Mobile styles ----------
// In mobile view, style changes go into an @media rule for that element only (keyed by data-storyly-id),
// so the desktop design stays as it is.

export const MOBILE_MAX_WIDTH = 640;
const MOBILE_MEDIA = `(max-width: ${MOBILE_MAX_WIDTH}px)`;

function mobileSheet(doc: Document) {
  let style = doc.head.querySelector<HTMLStyleElement>("style[data-storyly-mobile]");
  if (!style) {
    style = doc.createElement("style");
    style.setAttribute("data-storyly-mobile", "");
    doc.head.appendChild(style);
  }
  return style.sheet!;
}

const styleId = (el: Element) => {
  if (!el.getAttribute("data-storyly-id")) el.setAttribute("data-storyly-id", randomId());
  return el.getAttribute("data-storyly-id")!;
};

function mobileRule(el: Element, create: boolean) {
  const doc = el.ownerDocument;
  const sheet = mobileSheet(doc);
  let media = Array.from(sheet.cssRules).find((r): r is CSSMediaRule => "conditionText" in r);
  if (!media) {
    if (!create) return null;
    media = sheet.cssRules[sheet.insertRule(`@media ${MOBILE_MEDIA} {}`, sheet.cssRules.length)] as CSSMediaRule;
  }
  const id = create ? styleId(el) : el.getAttribute("data-storyly-id");
  if (!id) return null;
  const selector = `[data-storyly-id="${id}"]`;
  const rule = Array.from(media.cssRules).find((r): r is CSSStyleRule => (r as CSSStyleRule).selectorText === selector);
  if (rule || !create) return rule ?? null;
  return media.cssRules[media.insertRule(`${selector} {}`, media.cssRules.length)] as CSSStyleRule;
}

/** Writes the rules back into the <style> text so they are saved. */
function syncMobileStyles(doc: Document) {
  const style = doc.head.querySelector<HTMLStyleElement>("style[data-storyly-mobile]");
  if (!style?.sheet) return;
  const text = Array.from(style.sheet.cssRules)
    .map((r) => r.cssText)
    .join("\n");
  if (style.textContent !== text) style.textContent = text;
}

/** Sets (or clears, with "") one style property, for all screens or for phones only. */
export function setStyle(el: HTMLElement, prop: string, value: string, mobile = false) {
  if (mobile) {
    const rule = mobileRule(el, !!value);
    if (!rule) return;
    if (value) rule.style.setProperty(prop, value, "important");
    else rule.style.removeProperty(prop);
    return;
  }
  if (value) el.style.setProperty(prop, value);
  else el.style.removeProperty(prop);
  if (!el.getAttribute("style")) el.removeAttribute("style");
}

export function hasMobileStyles(el: Element) {
  return !!mobileRule(el, false)?.style.length;
}

export function clearMobileStyles(el: Element) {
  const rule = mobileRule(el, false);
  if (!rule) return;
  const media = rule.parentRule as CSSMediaRule;
  media.deleteRule(Array.from(media.cssRules).indexOf(rule));
}

/** "rgb(12, 34, 56)" -> "#0c2238". Transparent colours give "". */
export function toHex(color: string) {
  const m = color.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (!m) return color.startsWith("#") ? color : "";
  if (m[4] !== undefined && Number(m[4]) === 0) return "";
  return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
}
