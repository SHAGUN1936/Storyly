// Finds the editable parts of an imported page (headings, short texts, images) and tags each one
// with data-storyly-slot so users can replace it later. If the page already marks its parts
// (starter designs, AI conversions), only those are used.

import "server-only";
import { parse, type HTMLElement, NodeType } from "node-html-parser";
import { humanizeSlotId, LABEL_ATTR, SLOT_ATTR, type Slot } from "@/lib/site-template";

const TEXT_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "LI",
  "A",
  "BUTTON",
  "SPAN",
  "TIME",
  "FIGCAPTION",
  "BLOCKQUOTE",
  "LABEL",
  "SMALL",
  "STRONG",
  "EM",
  "TD",
  "TH",
  "DT",
  "DD",
  "CITE",
]);
const SKIP_INSIDE = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "TEMPLATE", "HEAD"]);
const INLINE_OK = new Set(["BR", "B", "I", "EM", "STRONG", "U", "SMALL", "SPAN"]);

const LIMITS = { text: 60, image: 30, textLength: 400 };

function insideSkipped(el: HTMLElement) {
  for (let node = el.parentNode; node; node = node.parentNode) {
    if (SKIP_INSIDE.has(node.tagName)) return true;
  }
  return false;
}

/** A text element whose content is just text (maybe with <br>/<b>/<em>), so it can be replaced as a whole. */
function isPlainText(el: HTMLElement) {
  if (!TEXT_TAGS.has(el.tagName)) return false;
  const text = el.text.replace(/\s+/g, " ").trim();
  if (!text || text.length > LIMITS.textLength || !/[\p{L}\p{N}]/u.test(text)) return false;
  return el.childNodes.every(
    (child) =>
      child.nodeType === NodeType.TEXT_NODE ||
      (child instanceof Object &&
        INLINE_OK.has((child as HTMLElement).tagName) &&
        !(child as HTMLElement).childNodes.some((c) => c.nodeType === NodeType.ELEMENT_NODE)),
  );
}

/** Nested matches (e.g. <a><span>) would edit the same words twice: keep only the outermost. */
function hasTaggedAncestor(el: HTMLElement) {
  for (let node = el.parentNode; node; node = node.parentNode) {
    if (node.getAttribute?.(SLOT_ATTR)) return true;
  }
  return false;
}

export function detectSlots(document: string): { document: string; slots: Slot[] } {
  const doc = parse(document, { comment: true, blockTextElements: { script: true, style: true, noscript: true } });
  const slots: Slot[] = [];
  const counts = { text: 0, image: 0 };
  const used = new Set<string>();

  // 1. Keep slots that are already marked
  for (const el of doc.querySelectorAll(`[${SLOT_ATTR}]`)) {
    const id = (el.getAttribute(SLOT_ATTR) ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    if (!id || used.has(id)) {
      el.removeAttribute(SLOT_ATTR);
      continue;
    }
    el.setAttribute(SLOT_ATTR, id);
    used.add(id);
    const isImage = el.tagName === "IMG";
    slots.push({
      id,
      label: el.getAttribute(LABEL_ATTR)?.trim().slice(0, 60) || humanizeSlotId(id) || (isImage ? "Image" : "Text"),
      type: isImage ? "image" : "text",
      default: isImage ? (el.getAttribute("src") ?? "") : el.text.trim(),
    });
  }

  // A page that already marks its editable parts (starter designs, AI conversions) knows best
  if (slots.length) return { document: doc.toString(), slots };

  // 2. Otherwise find them, in page order
  let next = 1;
  const newId = (prefix: string) => {
    while (used.has(`${prefix}${next}`)) next++;
    const id = `${prefix}${next++}`;
    used.add(id);
    return id;
  };

  for (const el of doc.querySelectorAll("body *")) {
    if (el.getAttribute(SLOT_ATTR) || insideSkipped(el) || hasTaggedAncestor(el)) continue;
    if (el.tagName === "IMG") {
      const src = el.getAttribute("src") ?? "";
      if (!src || counts.image >= LIMITS.image) continue;
      const id = newId("img");
      el.setAttribute(SLOT_ATTR, id);
      slots.push({
        id,
        label: el.getAttribute("alt")?.trim().slice(0, 60) || `Image ${++counts.image}`,
        type: "image",
        default: src,
      });
      continue;
    }
    if (counts.text >= LIMITS.text || !isPlainText(el)) continue;
    const id = newId("t");
    el.setAttribute(SLOT_ATTR, id);
    counts.text++;
    const text = el.text.replace(/\s+/g, " ").trim();
    slots.push({ id, label: text.slice(0, 40), type: "text", default: text });
  }

  return { document: doc.toString(), slots };
}
