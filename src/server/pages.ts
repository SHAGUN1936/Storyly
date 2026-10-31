// Pages: a user's own copy of a template with all their edits ("My pages").
//
// status "draft"     → still being edited
// status "pending"   → video template waiting for processPage()
// status "completed" → published and shareable at /watch/<shareSlug>

import "server-only";
import type { Page, Prisma } from "@prisma/client";
import { customAlphabet } from "nanoid";
import QRCode from "qrcode";
import type { z } from "zod";
import { siteUrl } from "@/config/site";
import { uploadToCloudinary, videoThumbnailOf } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { renderVideo } from "@/lib/ffmpeg";
import { HttpError } from "@/lib/http";
import {
  isJsonObject,
  isWebPageStructure,
  parseStructure,
  resolveStructureSnapshot,
  stripHtmlFields,
  type JsonObject,
} from "@/lib/structure";
import { isImageUrl, toId } from "@/lib/utils";
import type { createPageSchema, saveDraftSchema } from "@/lib/validators";
import { findSourceTemplate, type TemplateSourceType } from "./templates";

const newShareSlug = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

type SourceTemplate = Awaited<ReturnType<typeof findSourceTemplate>>;

// ---------- Small helpers ----------

const asObject = (value: unknown): JsonObject => (isJsonObject(value) ? value : {});

/** Customizations ready to save: html stripped (pure JSON rule). */
const toJson = (value: JsonObject) => stripHtmlFields(value) as Prisma.InputJsonObject;

/** Slot values and media URLs the user filled in. */
function filledMedia(customizations: JsonObject) {
  const slots = Object.values(asObject(customizations.slots)).filter(Boolean);
  const media = Array.isArray(customizations.mediaUrls) ? customizations.mediaUrls : [];
  return { slots, media };
}

/** Card thumbnail: first slot image, then first uploaded image, then the template's, then the current one. */
function pickThumbnail(customizations: JsonObject, ...fallbacks: Array<string | null | undefined>) {
  const { slots, media } = filledMedia(customizations);
  const image = slots.find(isImageUrl) ?? media.find(isImageUrl);
  return (image as string | undefined) ?? fallbacks.find(Boolean) ?? "";
}

/** A structure the client legitimately holds for a template that was since deleted/unpublished. */
function hasUsableStructure(raw: unknown) {
  const s = parseStructure(raw);
  return !!s && (isWebPageStructure(s) || isJsonObject(s.builderState));
}

/**
 * Copies the template's name/category/thumbnail onto the page the first time,
 * so "My pages" still shows them after the admin renames or deletes the template.
 */
function withTemplateMeta(customizations: JsonObject, template: SourceTemplate): JsonObject {
  if (!template) return customizations;
  return {
    templateId: template.id,
    templateName: template.name ?? "",
    templateCategory: template.category ?? "",
    templateThumb: template.thumbnailUrl ?? "",
    ...customizations,
  };
}

/** Adds the resolved structure snapshot, when there is one. */
function withSnapshot(customizations: JsonObject, template: SourceTemplate): JsonObject {
  const snapshot = resolveStructureSnapshot(customizations, template?.structure);
  return snapshot ? { ...customizations, structureSnapshot: snapshot } : customizations;
}

async function ownedPage(id: string, userId: string, notFound = "Page not found") {
  const page = toId(id) ? await db.page.findUnique({ where: { id } }) : null;
  if (!page || page.userId !== userId) throw new HttpError(404, notFound);
  return page;
}

/** Template info shown next to a page (name, category, thumbnail, structure). */
function templateSummary(template: SourceTemplate) {
  if (!template) return null;
  const { id, name, category, description, thumbnailUrl, structure } = template;
  return { id, name, category, description, thumbnailUrl, structure };
}

/** Attaches each page's source template, loading all templates in two queries. */
async function withTemplates(pages: Page[]) {
  const idsBy = (source: TemplateSourceType) => [
    ...new Set(pages.filter((p) => p.sourceType === source).map((p) => p.templateId)),
  ];
  const [official, community] = await Promise.all([
    db.template.findMany({ where: { id: { in: idsBy("Template") } } }),
    db.builderTemplate.findMany({ where: { id: { in: idsBy("BuilderTemplate") } } }),
  ]);
  const byId = new Map<string, SourceTemplate>([...official, ...community].map((t) => [t.id, t]));
  return pages.map((page) => ({ ...page, template: templateSummary(byId.get(page.templateId) ?? null) }));
}

// ---------- Reading ----------

export async function listMyPages(userId: string) {
  const pages = await db.page.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return withTemplates(pages);
}

export async function getMyPage(id: string, userId: string) {
  const [page] = await withTemplates([await ownedPage(id, userId)]);
  return page;
}

/** A published page for the public /watch/<slug> link. */
export async function getSharedPage(slug: string) {
  const page = await db.page.findUnique({ where: { shareSlug: slug } });
  if (!page || page.status !== "completed") return null;
  const template = await findSourceTemplate(page.templateId, page.sourceType);
  const customizations = asObject(page.customizations);
  return {
    id: page.id,
    recipientName: page.recipientName,
    videoUrl: page.videoUrl,
    thumbnailUrl: page.thumbnailUrl,
    shareSlug: page.shareSlug,
    createdAt: page.createdAt,
    template: templateSummary(template),
    customizations: {
      ...customizations,
      structureSnapshot: resolveStructureSnapshot(customizations, template?.structure),
    } as JsonObject,
  };
}

/** Share link + QR code image for one of the user's pages. */
export async function getShareInfo(id: string, userId: string, requestOrigin: string) {
  const page = await ownedPage(id, userId);
  const shareUrl = `${siteUrl(requestOrigin)}/watch/${page.shareSlug}`;
  return {
    shareUrl,
    qrCode: await QRCode.toDataURL(shareUrl, { width: 300, margin: 2 }),
    recipientName: page.recipientName ?? "",
  };
}

// ---------- Creating and saving ----------

/**
 * Loads the source template for a new page. A user may keep using a template they
 * engaged with even after the admin deletes or unpublishes it: then the browser sends
 * its own `structureSnapshot` and we skip the live-template checks.
 */
async function sourceForNewPage(templateId: string, sourceType: TemplateSourceType, customizations: JsonObject) {
  const hasClientSnapshot = hasUsableStructure(customizations.structureSnapshot);
  const template = await findSourceTemplate(templateId, sourceType);
  if (!template && !hasClientSnapshot) throw new HttpError(404, "Template not found");
  const unpublished = template && sourceType === "Template" && !template.published;
  return { template, blocked: unpublished && !hasClientSnapshot };
}

/** Starts a page that will be published by processPage(). */
export async function createPage(userId: string, input: z.output<typeof createPageSchema>) {
  const { template, blocked } = await sourceForNewPage(input.templateId, input.sourceType, input.customizations);
  if (blocked) throw new HttpError(404, "Website not found");
  return db.page.create({
    data: {
      userId,
      templateId: input.templateId,
      sourceType: input.sourceType,
      recipientName: input.recipientName || undefined,
      customizations: toJson(withTemplateMeta(withSnapshot(input.customizations, template), template)),
      shareSlug: newShareSlug(),
      status: "pending",
    },
  });
}

/**
 * Saves a draft without publishing. Without `id` it creates a new draft;
 * with `id` it merges the changes into that draft.
 */
export async function saveDraft(userId: string, input: z.output<typeof saveDraftSchema>) {
  if (input.id) {
    const page = await ownedPage(input.id, userId, "Draft not found");
    if (!["draft", "pending", "failed"].includes(page.status)) {
      throw new HttpError(400, "Cannot save draft over a published page");
    }
    const template = await findSourceTemplate(page.templateId, page.sourceType);
    const merged = withSnapshot({ ...asObject(page.customizations), ...input.customizations }, template);
    return db.page.update({
      where: { id: page.id },
      data: {
        customizations: toJson(merged),
        status: "draft",
        // Never wipe a saved name with an empty one
        recipientName: input.recipientName || undefined,
        thumbnailUrl: pickThumbnail(merged, template?.thumbnailUrl, page.thumbnailUrl),
      },
    });
  }

  const templateId = toId(input.templateId);
  if (!templateId) throw new HttpError(400, "templateId required for new drafts");
  const { template } = await sourceForNewPage(templateId, input.sourceType, input.customizations);
  const customizations = withTemplateMeta(withSnapshot(input.customizations, template), template);
  return db.page.create({
    data: {
      userId,
      templateId,
      sourceType: input.sourceType,
      recipientName: input.recipientName || undefined,
      customizations: toJson(customizations),
      shareSlug: newShareSlug(),
      status: "draft",
      thumbnailUrl: pickThumbnail(customizations, template?.thumbnailUrl),
    },
  });
}

/**
 * Saves the user's edits. Web pages publish right away;
 * video pages go back to "pending" and need processPage() again.
 */
export async function updatePage(id: string, userId: string, patch: JsonObject) {
  const page = await ownedPage(id, userId);
  if (page.status === "processing") throw new HttpError(400, "Cannot edit while processing");

  const template = await findSourceTemplate(page.templateId, page.sourceType);
  const merged = withSnapshot({ ...asObject(page.customizations), ...patch }, template);

  if (isWebPageStructure(merged.structureSnapshot)) {
    return publishAsWebPage(page, merged, template);
  }

  const wasPublished = page.status === "completed" || page.status === "failed";
  return db.page.update({
    where: { id: page.id },
    data: {
      customizations: toJson(merged),
      status: "pending",
      ...(wasPublished && {
        videoUrl: null,
        thumbnailUrl: template?.thumbnailUrl || page.thumbnailUrl || "",
      }),
    },
  });
}

function publishAsWebPage(page: Page, customizations: JsonObject, template: SourceTemplate) {
  return db.page.update({
    where: { id: page.id },
    data: {
      videoUrl: null,
      thumbnailUrl: pickThumbnail({ slots: customizations.slots }, template?.thumbnailUrl, page.thumbnailUrl),
      status: "completed",
      customizations: toJson({ ...customizations, pageKind: "web" }),
    },
  });
}

/** Publishes a pending page: web pages instantly, video pages after an FFmpeg render. */
export async function processPage(id: string, userId: string) {
  const page = await ownedPage(id, userId, "Video not found");
  if (page.status !== "pending") throw new HttpError(400, "Video already processed or in progress");
  await db.page.update({ where: { id: page.id }, data: { status: "processing" } });

  try {
    const template = await findSourceTemplate(page.templateId, page.sourceType);
    const customizations = withSnapshot(asObject(page.customizations), template);

    if (isWebPageStructure(customizations.structureSnapshot)) {
      return await publishAsWebPage(page, customizations, template);
    }

    const mediaUrls = filledMedia(customizations).media.map(String);
    const { secure_url } = await uploadToCloudinary(await renderVideo(mediaUrls), "generated-videos");
    return await db.page.update({
      where: { id: page.id },
      data: {
        videoUrl: secure_url,
        thumbnailUrl: videoThumbnailOf(secure_url),
        customizations: toJson({ ...customizations, pageKind: "video" }),
        status: "completed",
      },
    });
  } catch (err) {
    await db.page.update({ where: { id: page.id }, data: { status: "failed" } });
    throw err;
  }
}

export async function deletePage(id: string, userId: string) {
  const page = await ownedPage(id, userId, "Video not found");
  await db.page.delete({ where: { id: page.id } });
}
