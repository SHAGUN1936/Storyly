import { HttpError, route } from "@/lib/http";
import { isAllowedStreamUrl } from "@/server/music";

/**
 * Same-origin audio proxy (?url=...). The Music Engine needs it to decode a remote
 * preview into a waveform, because Apple's CDN does not send CORS headers.
 */
export const GET = route(async (req) => {
  const url = req.nextUrl.searchParams.get("url") ?? "";
  if (!isAllowedStreamUrl(url)) throw new HttpError(400, "URL not allowed");
  const upstream = await fetch(url);
  if (!upstream.ok || !upstream.body) throw new HttpError(502, "Could not load that track.");
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
