"use server";

// Admin → Templates: the editor's save actions, publish/unpublish, delete.

import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, refreshPages, success, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/lib/auth";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import { toFriendlyError } from "@/lib/http";
import {
  deleteTemplate,
  setTemplatePublished,
  updateSiteTemplateDetails,
  updateSiteTemplateDocument,
} from "@/server/templates";

const detailsSchema = z.object({
  name: z.string().trim().min(1, "Give the template a name").max(60),
  category: z.enum(TEMPLATE_CATEGORIES, "Pick a category"),
  description: z.string().trim().max(300).default(""),
});

/** Name, category, description and thumbnail (editor → Settings). */
export async function saveTemplateDetails(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = detailsSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return failure(parsed.error.issues[0]?.message ?? "Please check the form");
  const thumbnail = formData.get("thumbnail");
  try {
    await updateSiteTemplateDetails(id, parsed.data, thumbnail instanceof File && thumbnail.size ? thumbnail : null);
  } catch (err) {
    return failure(toFriendlyError(err).message);
  }
  refreshPages();
  return success("Details saved");
}

/** The page designed in the editor (the full HTML document). */
export async function saveTemplateDesign(id: string, document: string): Promise<ActionState> {
  await requireAdmin();
  try {
    await updateSiteTemplateDocument(id, document);
  } catch (err) {
    return failure(toFriendlyError(err).message);
  }
  refreshPages();
  return success("Design saved");
}

export async function setPublished(id: string, published: boolean) {
  await requireAdmin();
  await setTemplatePublished(id, published);
  refreshPages();
}

export async function removeTemplate(id: string) {
  await requireAdmin();
  await deleteTemplate(id);
  refreshPages();
  redirect("/admin/templates");
}
