import { apiUser, HttpError, json, readJson, route, type RouteContext } from "@/lib/http";
import { toId } from "@/lib/utils";
import { builderTemplateUpdateSchema } from "@/lib/validators";
import { deleteBuilderTemplate, updateBuilderTemplate } from "@/server/templates";

async function templateId(params: RouteContext["params"]) {
  const id = toId((await params).id);
  if (!id) throw new HttpError(404, "Template not found");
  return id;
}

export const PATCH = route(async (req, { params }) => {
  const user = await apiUser();
  const input = await readJson(req, builderTemplateUpdateSchema);
  return json(await updateBuilderTemplate(await templateId(params), user, input));
});

export const DELETE = route(async (_req, { params }) => {
  await deleteBuilderTemplate(await templateId(params), await apiUser());
  return json({ message: "Deleted" });
});
