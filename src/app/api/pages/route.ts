import { apiUser, json, readJson, route } from "@/lib/http";
import { createPageSchema } from "@/lib/validators";
import { createPage, listMyPages } from "@/server/pages";

/** The signed-in user's pages, newest first. */
export const GET = route(async () => json(await listMyPages((await apiUser()).id)));

/** Starts a page from a template. Publish it with POST /api/pages/[id]/process. */
export const POST = route(async (req) => {
  const user = await apiUser();
  const input = await readJson(req, createPageSchema);
  return json(await createPage(user.id, input), 201);
});
