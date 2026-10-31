// Templates: official ones (made by admins) and community ones (made by builders).

import "server-only";
import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import { canBuild, type SessionUser } from "@/lib/auth";
import { thumbnailOf, uploadToCloudinary, videoThumbnailOf } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { normalizeTemplateStructure } from "@/lib/structure";
import { isSiteStructure, readSlots, type SiteStructure } from "@/lib/site-template";
import type { adminTemplateSchema, builderTemplateSchema, builderTemplateUpdateSchema } from "@/lib/validators";

export type TemplateSourceType = "Template" | "BuilderTemplate";

const builderInfo = { select: { id: true, name: true, avatar: true } } as const;

/** Checks an editor structure; a bad one becomes a 400 with the reason. */
function cleanStructure(raw: unknown) {
  try {
    return normalizeTemplateStructure(raw) as Prisma.InputJsonObject;
  } catch (err) {
    throw new HttpError(400, (err as Error).message);
  }
}

// ---------- Browsing ----------

/** Browse grid: published official templates first, then published community templates. */
export async function listPublishedTemplates(category?: string) {
  const byCategory = category ? { category } : {};
  const [official, community] = await Promise.all([
    db.template.findMany({ where: { ...byCategory, published: true }, orderBy: { createdAt: "desc" } }),
    db.builderTemplate.findMany({
      where: { ...byCategory, published: true, approved: true },
      include: { builder: builderInfo },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return [
    ...official.map((t) => ({ ...t, sourceType: "Template" as const })),
    ...community.map((t) => ({ ...t, sourceType: "BuilderTemplate" as const })),
  ];
}

/** One template for the preview/editor. Unpublished official templates are admin-only. */
export async function getTemplate(id: string, sourceType: TemplateSourceType, viewer: SessionUser | null) {
  if (sourceType === "BuilderTemplate") {
    const template = await db.builderTemplate.findUnique({ where: { id }, include: { builder: builderInfo } });
    if (!template) throw new HttpError(404, "Template not found");
    return { ...template, sourceType };
  }
  const template = await db.template.findUnique({ where: { id } });
  if (!template) throw new HttpError(404, "Website not found");
  if (!template.published && viewer?.role !== "admin") throw new HttpError(403, "This website is not available");
  return { ...template, sourceType };
}

/** The raw source template behind a page, or null if it was deleted. */
export function findSourceTemplate(id: string, sourceType: TemplateSourceType) {
  return sourceType === "BuilderTemplate"
    ? db.builderTemplate.findUnique({ where: { id } })
    : db.template.findUnique({ where: { id } });
}

// ---------- Admin: official templates ----------

type AdminTemplateInput = z.output<typeof adminTemplateSchema>;
type TemplateFiles = { thumbnail?: File | null; preview?: File | null };

/** Uploads the optional thumbnail image and preview video. A preview's first frame doubles as the thumbnail. */
async function uploadTemplateMedia({ thumbnail, preview }: TemplateFiles) {
  const media: { thumbnailUrl?: string; previewVideoUrl?: string } = {};
  if (thumbnail) {
    media.thumbnailUrl = thumbnailOf((await uploadToCloudinary(thumbnail, "template-thumbnails")).secure_url);
  }
  if (preview) {
    const url = (await uploadToCloudinary(preview, "template-previews")).secure_url;
    media.previewVideoUrl = url;
    media.thumbnailUrl ??= videoThumbnailOf(url);
  }
  return media;
}

export function listAllTemplates() {
  return db.template.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
}

/** New templates always start as drafts. */
export async function createTemplate(input: AdminTemplateInput, files: TemplateFiles, adminId: string) {
  return db.template.create({
    data: {
      name: input.name,
      category: input.category,
      description: input.description,
      structure: input.structure ? cleanStructure(input.structure) : {},
      duration: input.duration ?? 10,
      published: false,
      createdById: adminId,
      ...(await uploadTemplateMedia(files)),
    },
  });
}

export async function updateTemplate(id: string, input: Partial<AdminTemplateInput>, files: TemplateFiles) {
  await findTemplateOrThrow(id);
  return db.template.update({
    where: { id },
    data: {
      name: input.name || undefined,
      category: input.category || undefined,
      description: input.description,
      structure: input.structure ? cleanStructure(input.structure) : undefined,
      duration: input.duration,
      published: input.published,
      ...(await uploadTemplateMedia(files)),
    },
  });
}

/**
 * Takes a template live or offline without touching its design,
 * so users who already opened it never see it change underneath them.
 */
export async function setTemplatePublished(id: string, published: boolean) {
  await findTemplateOrThrow(id);
  return db.template.update({ where: { id }, data: { published } });
}

export async function deleteTemplate(id: string) {
  await findTemplateOrThrow(id);
  await db.template.delete({ where: { id } });
}

async function findTemplateOrThrow(id: string) {
  const template = await db.template.findUnique({ where: { id }, select: { id: true } });
  if (!template) throw new HttpError(404, "Website not found");
  return template;
}

// ---------- Builders: community templates ----------

function requireBuilder(user: SessionUser) {
  if (!canBuild(user)) throw new HttpError(403, "Builder access required");
}

/** A builder template the user may change: their own, or any if they are an admin. */
async function ownedBuilderTemplate(id: string, user: SessionUser) {
  requireBuilder(user);
  const template = await db.builderTemplate.findUnique({ where: { id } });
  if (!template) throw new HttpError(404, "Template not found");
  if (template.builderId !== user.id && user.role !== "admin") throw new HttpError(403, "Not your template");
  return template;
}

export function listMyBuilderTemplates(user: SessionUser) {
  requireBuilder(user);
  return db.builderTemplate.findMany({ where: { builderId: user.id }, orderBy: { createdAt: "desc" } });
}

export function createBuilderTemplate(user: SessionUser, input: z.output<typeof builderTemplateSchema>) {
  requireBuilder(user);
  return db.builderTemplate.create({
    data: {
      ...input,
      builderId: user.id,
      structure: input.structure ? cleanStructure(input.structure) : {},
      approved: true,
    },
  });
}

export async function updateBuilderTemplate(
  id: string,
  user: SessionUser,
  input: z.output<typeof builderTemplateUpdateSchema>,
) {
  await ownedBuilderTemplate(id, user);
  return db.builderTemplate.update({
    where: { id },
    data: { ...input, structure: input.structure ? cleanStructure(input.structure) : undefined },
  });
}

export async function deleteBuilderTemplate(id: string, user: SessionUser) {
  await ownedBuilderTemplate(id, user);
  await db.builderTemplate.delete({ where: { id } });
}

// ---------- Admin: templates imported from a website ----------

/** Saves an import as a new draft template. */
export function createSiteTemplate(
  input: { name: string; category: string; description: string; structure: SiteStructure },
  adminId: string,
) {
  return db.template.create({
    data: {
      name: input.name,
      category: input.category,
      description: input.description,
      structure: input.structure as unknown as Prisma.InputJsonObject,
      published: false,
      createdById: adminId,
    },
  });
}

async function findSiteTemplate(id: string) {
  const template = await db.template.findUnique({ where: { id } });
  if (!template || !isSiteStructure(template.structure)) throw new HttpError(404, "Template not found");
  return { ...template, structure: template.structure };
}

/** Name, category, description and (optionally) a new thumbnail. */
export async function updateSiteTemplateDetails(
  id: string,
  input: { name: string; category: string; description: string },
  thumbnail: File | null,
) {
  await findSiteTemplate(id);
  return db.template.update({
    where: { id },
    data: { ...input, ...(await uploadTemplateMedia({ thumbnail })) },
  });
}

/** Largest page we store per template (Mongo documents are limited to 16 MB). */
const DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

/** Saves the page designed in the editor. The editable parts are read from the page itself. */
export async function updateSiteTemplateDocument(id: string, document: string) {
  await findSiteTemplate(id);
  if (Buffer.byteLength(document) > DOCUMENT_MAX_BYTES) throw new HttpError(400, "The page is larger than 4 MB.");
  if (!/<body[\s>]/i.test(document)) throw new HttpError(400, "The page is missing its <body>.");
  const structure: SiteStructure = { type: "site", document, slots: readSlots(document) };
  return db.template.update({ where: { id }, data: { structure: structure as unknown as Prisma.InputJsonObject } });
}
