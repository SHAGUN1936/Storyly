// Reads an uploaded website (one .zip, or the files of a folder) into a map of path -> bytes.

import "server-only";
import { unzipSync } from "fflate";
import { HttpError } from "@/lib/http";

export type SiteFiles = Map<string, Uint8Array>;

export const IMPORT_LIMITS = {
  totalBytes: 25 * 1024 * 1024,
  files: 400,
};

/** Folders that never belong in a website upload. */
const SKIP = /(^|\/)(node_modules|\.git|\.next|\.vercel|__MACOSX|\.DS_Store|Thumbs\.db)(\/|$)/;

function cleanPath(path: string) {
  return path.replace(/\\/g, "/").replace(/^\.?\//, "");
}

/** If every file sits inside the same top folder ("my-site/…"), drop that folder. */
function stripCommonRoot(files: SiteFiles): SiteFiles {
  const paths = [...files.keys()];
  const first = paths[0]?.split("/")[0];
  if (!first || !paths.every((p) => p.startsWith(`${first}/`))) return files;
  return new Map([...files].map(([p, bytes]) => [p.slice(first.length + 1), bytes]));
}

export async function readUpload(uploads: File[]): Promise<SiteFiles> {
  const files: SiteFiles = new Map();
  let total = 0;

  const add = (rawPath: string, bytes: Uint8Array) => {
    const path = cleanPath(rawPath);
    if (!path || path.endsWith("/") || SKIP.test(path)) return;
    total += bytes.byteLength;
    if (total > IMPORT_LIMITS.totalBytes) throw new HttpError(400, "The website is larger than 25 MB.");
    if (files.size >= IMPORT_LIMITS.files) throw new HttpError(400, "The website has more than 400 files.");
    files.set(path, bytes);
  };

  for (const upload of uploads) {
    const bytes = new Uint8Array(await upload.arrayBuffer());
    if (uploads.length === 1 && /\.zip$/i.test(upload.name)) {
      let entries: Record<string, Uint8Array>;
      try {
        entries = unzipSync(bytes);
      } catch {
        throw new HttpError(400, "That zip file could not be opened.");
      }
      for (const [path, data] of Object.entries(entries)) add(path, data);
    } else {
      // Folder uploads send each file's path inside the folder as its name
      add(upload.name, bytes);
    }
  }

  if (!files.size) throw new HttpError(400, "No files found. Upload a .zip or choose the website's folder.");
  return stripCommonRoot(files);
}

export function readText(files: SiteFiles, path: string) {
  const bytes = files.get(path);
  return bytes ? new TextDecoder().decode(bytes) : undefined;
}

const TEXT_FILE = /\.(html?|css|js|mjs|cjs|jsx|tsx?|vue|svelte|astro|json|md|txt|svg)$/i;

export function isTextFile(path: string) {
  return TEXT_FILE.test(path);
}
