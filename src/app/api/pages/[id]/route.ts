import { apiUser, json, readJson, route } from "@/lib/http";
import { updatePageSchema } from "@/lib/validators";
import { deletePage, getMyPage, updatePage } from "@/server/pages";

export const GET = route(async (_req, { params }) => {
  const user = await apiUser();
  return json(await getMyPage((await params).id, user.id));
});

/** Saves the user's edits. Web pages publish right away. */
export const PATCH = route(async (req, { params }) => {
  const user = await apiUser();
  const { customizations } = await readJson(req, updatePageSchema);
  return json(await updatePage((await params).id, user.id, customizations));
});

export const DELETE = route(async (_req, { params }) => {
  const user = await apiUser();
  await deletePage((await params).id, user.id);
  return json({ message: "Deleted" });
});
