import { apiAdmin, HttpError, json, route, type RouteContext } from "@/lib/http";
import { toId } from "@/lib/utils";
import { adminTemplateSchema } from "@/lib/validators";
import { deleteTemplate, updateTemplate } from "@/server/templates";
import { filledFields, templateFiles } from "../form";

export const runtime = "nodejs";

async function templateId(params: RouteContext["params"]) {
  const id = toId((await params).id);
  if (!id) throw new HttpError(404, "Website not found");
  return id;
}

/**
 * Edits a template (multipart form). Send only the fields that change;
 * `published=true|false` takes it live or offline.
 */
export const PATCH = route(async (req, { params }) => {
  await apiAdmin();
  const form = await req.formData();
  const input = adminTemplateSchema.partial().parse(filledFields(form));
  return json(await updateTemplate(await templateId(params), input, templateFiles(form)));
});

export const DELETE = route(async (_req, { params }) => {
  await apiAdmin();
  await deleteTemplate(await templateId(params));
  return json({ message: "Deleted" });
});
