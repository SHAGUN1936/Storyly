import { apiUser, json, route } from "@/lib/http";
import { processPage } from "@/server/pages";

// Video templates are rendered with FFmpeg, which needs Node.js and can take a while.
export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = route(async (_req, { params }) => {
  const user = await apiUser();
  return json(await processPage((await params).id, user.id));
});
