// Website -> template importer. Steps:
// 1. read the upload (zip or folder), or take pasted HTML
// 2. a finished site is bundled into one HTML document; framework source is converted by AI
// 3. editable parts are found and tagged (slots)
// 4. if AI is set up, it suggests the name, category, description and friendly slot labels
// The admin reviews the result before publishing.

import "server-only";
import { parse } from "node-html-parser";
import { HttpError } from "@/lib/http";
import { LABEL_ATTR, SLOT_ATTR, type Slot } from "@/lib/site-template";
import { aiEnabled, convertSourceToDocument, describeTemplate } from "./ai";
import { bundleStaticSite, createAssetUploader, detectSource, mediaPaths } from "./bundle";
import { readUpload } from "./files";
import { detectSlots } from "./slots";
import { STARTERS } from "./starters";

/** Largest document we store per template (Mongo documents are limited to 16 MB). */
const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export type ImportResult = {
  document: string;
  slots: Slot[];
  name: string;
  category: string;
  description: string;
  warnings: string[];
  usedAi: boolean;
};

export async function importSite(uploads: File[]): Promise<ImportResult> {
  const files = await readUpload(uploads);
  const warnings: string[] = [];
  let usedAi = false;
  let document: string;

  const sourceReason = detectSource(files);
  if (sourceReason) {
    if (!aiEnabled()) {
      throw new HttpError(
        400,
        `${sourceReason} Upload the built site (the dist or build folder), or add ANTHROPIC_API_KEY to .env so AI can convert it.`,
      );
    }
    const assetUrl = createAssetUploader(files, warnings);
    const urls = new Map<string, string>();
    for (const p of mediaPaths(files)) {
      const url = await assetUrl(p);
      if (url && !url.startsWith("data:")) urls.set(p, url);
    }
    document = (await convertSourceToDocument(files, urls))!;
    usedAi = true;
  } else {
    const bundled = await bundleStaticSite(files);
    document = bundled.document;
    warnings.push(...bundled.warnings);
  }

  return finishImport(document, warnings, usedAi);
}

/** A single HTML file pasted in (e.g. a page generated with an AI chat). */
export async function importHtml(html: string): Promise<ImportResult> {
  if (!/<(html|body|div|section|main|h1|p)[\s>]/i.test(html)) {
    throw new HttpError(400, "That doesn't look like HTML. Paste the full page, starting with <!doctype html>.");
  }
  const files = new Map([["index.html", new TextEncoder().encode(html)]]);
  const bundled = await bundleStaticSite(files);
  return finishImport(bundled.document, bundled.warnings, false);
}

/** Size check, editable parts, and (with AI) suggested details and labels. */
async function finishImport(document: string, warnings: string[], usedAi: boolean): Promise<ImportResult> {
  if (Buffer.byteLength(document) > DOCUMENT_MAX_BYTES) {
    throw new HttpError(400, "The page is larger than 4 MB after bundling. Use smaller images or enable uploads.");
  }

  const detected = detectSlots(document);
  const title = parse(detected.document).querySelector("title")?.text.trim() ?? "";
  let slots = detected.slots;
  let name = title.slice(0, 60) || "Imported template";
  let category = "Memories";
  let description = "";

  if (aiEnabled() && slots.length) {
    try {
      const ai = await describeTemplate(title, slots);
      const byId = new Map(ai.slots.map((s) => [s.id, s]));
      slots = slots
        .filter((s) => byId.get(s.id)?.keep !== false)
        .map((s) => ({ ...s, label: byId.get(s.id)?.label.trim().slice(0, 60) || s.label }));
      name = ai.name.trim().slice(0, 60) || name;
      category = ai.category;
      description = ai.description.trim().slice(0, 300);
      usedAi = true;
    } catch (err) {
      warnings.push(`AI suggestions skipped: ${(err as Error).message}`);
    }
  }

  if (!slots.length) warnings.push("No editable parts were found. Users will see the page exactly as uploaded.");
  return { document: writeSlotLabels(detected.document, slots), slots, name, category, description, warnings, usedAi };
}

/** Stores each slot's label on its element, and drops markers for parts that were left out. */
function writeSlotLabels(document: string, slots: Slot[]) {
  const doc = parse(document, { comment: true, blockTextElements: { script: true, style: true, noscript: true } });
  const labels = new Map(slots.map((s) => [s.id, s.label]));
  for (const el of doc.querySelectorAll(`[${SLOT_ATTR}]`)) {
    const label = labels.get(el.getAttribute(SLOT_ATTR) ?? "");
    if (label) el.setAttribute(LABEL_ATTR, label);
    else el.removeAttribute(SLOT_ATTR);
  }
  return doc.toString();
}

/** A built-in starter design, with its own name, category and description. */
export async function importStarter(id: string): Promise<ImportResult> {
  const starter = STARTERS.find((s) => s.id === id);
  if (!starter) throw new HttpError(404, "Starter design not found");
  const result = await importHtml(starter.html);
  return { ...result, name: starter.name, category: starter.category, description: starter.description };
}
