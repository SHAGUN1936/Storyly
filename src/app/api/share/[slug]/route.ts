import { HttpError, json, route, type RouteContext } from "@/lib/http";
import { getSharedPage } from "@/server/pages";

/** A published page for the public share link. */
export const GET = route<RouteContext<"slug">>(async (_req, { params }) => {
  const page = await getSharedPage((await params).slug);
  if (!page) throw new HttpError(404, "Not found");
  return json(page);
});
