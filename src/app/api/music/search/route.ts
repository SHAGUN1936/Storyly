import { json, route } from "@/lib/http";
import { searchMusic } from "@/server/music";

/** ?q=love&source=itunes|archive */
export const GET = route(async (req) => {
  const params = req.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();
  const source = params.get("source") === "archive" ? "archive" : "itunes";
  return json({ results: await searchMusic(query, source) });
});
