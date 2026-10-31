"use server";

// Actions on the signed-in user's own pages (My pages).

import { headers } from "next/headers";
import { refreshPages } from "@/lib/action";
import { requireUser } from "@/lib/auth";
import { toFriendlyError } from "@/lib/http";
import { db } from "@/lib/db";
import { isSiteStructure } from "@/lib/site-template";
import { toId } from "@/lib/utils";
import { createPage, deletePage, getShareInfo, processPage } from "@/server/pages";

export async function deleteMyPage(id: string) {
  const user = await requireUser();
  await deletePage(id, user.id);
  refreshPages();
}

/** Share link + QR code image, or an error message the dialog can show. */
export async function getMyPageShareInfo(id: string) {
  const user = await requireUser();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  try {
    return { ok: true as const, ...(await getShareInfo(id, user.id, origin)) };
  } catch (err) {
    return { ok: false as const, message: toFriendlyError(err).message };
  }
}

/**
 * Creates and publishes a page from an imported ("site") template with the user's values.
 * Only the template's own editable parts are accepted.
 */
export async function createSitePage(
  templateId: string,
  input: { recipientName: string; values: Record<string, string> },
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const user = await requireUser();
  try {
    const template = toId(templateId) ? await db.template.findUnique({ where: { id: templateId } }) : null;
    if (!template || !isSiteStructure(template.structure) || (!template.published && user.role !== "admin")) {
      return { ok: false, message: "This template is not available." };
    }
    const structure = template.structure;
    const slots: Record<string, string> = {};
    for (const slot of structure.slots) {
      const value = input.values[slot.id];
      if (typeof value !== "string" || value === slot.default) continue;
      if (slot.type === "image" && !/^https:\/\/\S+$/i.test(value)) continue;
      slots[slot.id] = value.slice(0, 2000);
    }
    const page = await createPage(user.id, {
      templateId: template.id,
      sourceType: "Template",
      recipientName: input.recipientName.trim().slice(0, 80) || undefined,
      customizations: { slots, structureSnapshot: structure },
    });
    await processPage(page.id, user.id);
    refreshPages();
    return { ok: true, id: page.id };
  } catch (err) {
    return { ok: false, message: toFriendlyError(err).message };
  }
}
