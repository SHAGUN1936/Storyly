// Song search for the Music Engine. No API keys needed.
//   itunes  → any song, 30-second preview
//   archive → full-length royalty-free / public-domain tracks (Internet Archive)

import "server-only";
import { HttpError } from "@/lib/http";

const HEADERS = { "User-Agent": "StorylyMusicEngine/1.0" };

export type MusicSource = "itunes" | "archive";

export type Track = {
  id: string;
  identifier?: string;
  title: string;
  artist: string;
  url: string;
  artwork: string;
  duration: number;
  /** Full-length track whose file URL is looked up later with resolveArchiveTrack(). */
  full?: boolean;
};

async function getJson<T>(url: string, errorMessage: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new HttpError(502, errorMessage);
  return res.json() as Promise<T>;
}

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value) as string | undefined;

export async function searchMusic(query: string, source: MusicSource): Promise<Track[]> {
  if (!query) return [];
  const unavailable = "Music search is unavailable right now.";

  if (source === "archive") {
    const q = encodeURIComponent(`(${query}) AND mediatype:(audio)`);
    const data = await getJson<{ response?: { docs?: Array<Record<string, unknown>> } }>(
      `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier&fl[]=title&fl[]=creator&rows=24&page=1&output=json`,
      unavailable,
    );
    return (data.response?.docs ?? []).map((doc) => {
      const id = String(doc.identifier);
      return {
        id,
        identifier: id,
        title: first(doc.title) || id,
        artist: first(doc.creator) || "",
        artwork: `https://archive.org/services/img/${encodeURIComponent(id)}`,
        url: "",
        full: true,
        duration: 0,
      };
    });
  }

  const data = await getJson<{ results?: Array<Record<string, unknown>> }>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=24`,
    unavailable,
  );
  return (data.results ?? [])
    .filter((t) => t.previewUrl)
    .map((t) => ({
      id: String(t.trackId || t.previewUrl),
      title: String(t.trackName || "Track"),
      artist: String(t.artistName || ""),
      url: String(t.previewUrl),
      artwork: String(t.artworkUrl100 || "").replace("100x100", "200x200"),
      duration: t.trackTimeMillis ? Math.round(Number(t.trackTimeMillis) / 1000) : 30,
    }));
}

/** Finds the playable MP3/OGG file of an Internet Archive item. */
export async function resolveArchiveTrack(id: string) {
  const failed = "Could not load that track.";
  const meta = await getJson<{ files?: Array<Record<string, string>>; server?: string; dir?: string }>(
    `https://archive.org/metadata/${encodeURIComponent(id)}`,
    failed,
  );
  const files = meta.files ?? [];
  const file = files.find((f) => /\.mp3$/i.test(f.name ?? "")) ?? files.find((f) => /\.ogg$/i.test(f.name ?? ""));
  if (!file) throw new HttpError(404, "No playable audio in this item.");

  const length = String(file.length ?? "");
  const duration = length.includes(":")
    ? length.split(":").reduce((total, part) => total * 60 + Number(part), 0)
    : Math.round(Number(length) || 0);

  return {
    url: `https://${meta.server || "archive.org"}${meta.dir || `/${id}`}/${encodeURIComponent(file.name)}`,
    duration,
    title: file.title || "",
  };
}

/**
 * Hosts the audio proxy may fetch from. The editor needs same-origin audio to draw a
 * waveform, but an open proxy would let anyone make our server fetch any URL.
 */
const STREAM_HOSTS = ["mzstatic.com", "itunes.apple.com", "apple.com", "pixabay.com", "archive.org"];

export function isAllowedStreamUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && STREAM_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
