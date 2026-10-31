// Templates imported from a website ("site" templates).
//
// The template is one HTML document. Editable parts carry data-storyly-slot="<id>", and the template's
// `slots` list says what each one is. A user's page stores only the values they changed;
// applySlotValues() writes them into the document when the page is shown.
//
// Pages render inside a sandboxed iframe (no access to the site's cookies), see <SiteFrame>.

import { parse } from "node-html-parser";
import { z } from "zod";

export const SLOT_ATTR = "data-storyly-slot";

export const slotSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{1,40}$/i),
  label: z.string().trim().min(1).max(60),
  type: z.enum(["text", "image"]),
  default: z.string().max(2000),
});

export type Slot = z.infer<typeof slotSchema>;

export type SiteStructure = {
  type: "site";
  /** The full HTML document. */
  document: string;
  slots: Slot[];
};

export function isSiteStructure(value: unknown): value is SiteStructure {
  const v = value as SiteStructure | null;
  return !!v && typeof v === "object" && v.type === "site" && typeof v.document === "string" && Array.isArray(v.slots);
}

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Only plain web or Cloudinary image links can replace an image. */
const isSafeImageUrl = (url: string) => /^https:\/\/[^\s"'<>]+$/i.test(url);

/** The document with the user's values written into the editable parts. Unknown or unsafe values are ignored. */
export function applySlotValues(structure: SiteStructure, values: Record<string, unknown>) {
  const doc = parse(structure.document, {
    comment: true,
    blockTextElements: { script: true, style: true, noscript: true },
  });
  for (const slot of structure.slots) {
    const value = values[slot.id];
    if (typeof value !== "string" || value === slot.default) continue;
    for (const el of doc.querySelectorAll(`[${SLOT_ATTR}="${slot.id}"]`)) {
      if (slot.type === "image") {
        if (isSafeImageUrl(value)) el.setAttribute("src", value);
      } else {
        el.set_content(escapeHtml(value).replace(/\n/g, "<br>"));
      }
    }
  }
  return doc.toString();
}

export const LABEL_ATTR = "data-storyly-label";

/** "couple-names" -> "Couple names" */
export function humanizeSlotId(id: string) {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The editable parts of a page, read from its markup: every element with data-storyly-slot
 * (label from data-storyly-label). The first element with an id wins; images are image slots.
 */
export function readSlots(document: string): Slot[] {
  const doc = parse(document, { comment: true, blockTextElements: { script: true, style: true, noscript: true } });
  const slots: Slot[] = [];
  const seen = new Set<string>();
  for (const el of doc.querySelectorAll(`[${SLOT_ATTR}]`)) {
    const id = (el.getAttribute(SLOT_ATTR) ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 40);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const isImage = el.tagName === "IMG";
    slots.push({
      id,
      label: (el.getAttribute(LABEL_ATTR) ?? "").trim().slice(0, 60) || humanizeSlotId(id),
      type: isImage ? "image" : "text",
      default: isImage ? (el.getAttribute("src") ?? "") : el.text.replace(/\s+/g, " ").trim().slice(0, 2000),
    });
  }
  return slots;
}
