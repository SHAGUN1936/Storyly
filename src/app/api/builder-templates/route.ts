import { apiUser, json, readJson, route } from "@/lib/http";
import { builderTemplateSchema } from "@/lib/validators";
import { createBuilderTemplate, listMyBuilderTemplates } from "@/server/templates";

/** The signed-in builder's own templates, drafts included. */
export const GET = route(async () => json(await listMyBuilderTemplates(await apiUser())));

export const POST = route(async (req) => {
  const user = await apiUser();
  const input = await readJson(req, builderTemplateSchema);
  return json(await createBuilderTemplate(user, input), 201);
});
