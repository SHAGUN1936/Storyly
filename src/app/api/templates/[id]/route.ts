import { getCurrentUser } from "@/lib/auth";
import { HttpError, json, route } from "@/lib/http";
import { toId } from "@/lib/utils";
import { getTemplate } from "@/server/templates";

/** One template. Community templates need ?source=BuilderTemplate. */
export const GET = route(async (req, { params }) => {
  const id = toId((await params).id);
  if (!id) throw new HttpError(404, "Template not found");
  const source = req.nextUrl.searchParams.get("source") === "BuilderTemplate" ? "BuilderTemplate" : "Template";
  return json(await getTemplate(id, source, await getCurrentUser()));
});
