import { apiAdmin, json, route } from "@/lib/http";
import { adminTemplateSchema } from "@/lib/validators";
import { createTemplate, listAllTemplates } from "@/server/templates";
import { filledFields, templateFiles } from "./form";

export const runtime = "nodejs";

export const GET = route(async () => {
  await apiAdmin();
  return json(await listAllTemplates());
});

/** New official template (multipart form: fields + optional "thumbnail" and "preview" files). */
export const POST = route(async (req) => {
  const admin = await apiAdmin();
  const form = await req.formData();
  const input = adminTemplateSchema.parse(filledFields(form));
  return json(await createTemplate(input, templateFiles(form), admin.id), 201);
});
