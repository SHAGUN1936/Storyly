import { json, route } from "@/lib/http";
import { listPublishedTemplates } from "@/server/templates";

/** Browse grid: official + community templates, optionally one category (?category=Love). */
export const GET = route(async (req) => {
  const category = req.nextUrl.searchParams.get("category") || undefined;
  return json(await listPublishedTemplates(category));
});
