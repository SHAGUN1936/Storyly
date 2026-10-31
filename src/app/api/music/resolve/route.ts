import { HttpError, json, route } from "@/lib/http";
import { resolveArchiveTrack } from "@/server/music";

/** Playable file URL + duration of an Internet Archive item (?id=...). */
export const GET = route(async (req) => {
  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();
  if (!id) throw new HttpError(400, "id required");
  return json(await resolveArchiveTrack(id));
});
