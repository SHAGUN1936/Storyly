// Turns a static website (index.html + its CSS, JS and images) into ONE self-contained HTML document:
// local CSS and JS are inlined, local images and media are uploaded to Cloudinary (or embedded),
// so the template no longer depends on its original files.
//
// Framework source code (React/Vue… that needs a build step) can't be bundled here;
// detectSource() spots it so the importer can hand it to AI instead.

import "server-only";
import path from "path";
import { parse, type HTMLElement } from "node-html-parser";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { HttpError } from "@/lib/http";
import { readText, type SiteFiles } from "./files";

const ENTRY_CANDIDATES = ["index.html", "dist/index.html", "build/index.html", "out/index.html", "public/index.html"];

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

/** Files a template may embed directly (fonts, small icons) instead of uploading. */
const EMBED_MAX_BYTES = 400 * 1024;

export function findEntry(files: SiteFiles) {
  return ENTRY_CANDIDATES.find((p) => files.has(p)) ?? [...files.keys()].find((p) => /(^|\/)index\.html?$/i.test(p));
}

/** True when the upload is app source that needs a build (e.g. a Vite/React project), not a finished site. */
export function detectSource(files: SiteFiles): string | null {
  const pkg = readText(files, "package.json");
  const entry = findEntry(files);
  const html = entry ? (readText(files, entry) ?? "") : "";
  const needsBuild = /<script[^>]+src=["'][^"']+\.(jsx|tsx|ts|vue|svelte)["']/i.test(html);
  if (needsBuild) return "This is source code that needs a build step.";
  if (!entry && pkg) return "No index.html found, only a project (package.json).";
  if (!entry) return null;
  return null;
}

const isLocal = (ref: string) => !!ref && !/^(https?:|data:|blob:|mailto:|tel:|#|\/\/|javascript:)/i.test(ref.trim());

/** Resolves a reference like "./img/a.png" or "/img/a.png" against the HTML/CSS file it appears in. */
function resolveRef(from: string, ref: string, root: string) {
  const clean = decodeURIComponent(ref.trim().split(/[?#]/)[0] ?? "");
  const joined = clean.startsWith("/")
    ? path.posix.join(root, clean)
    : path.posix.join(path.posix.dirname(from), clean);
  return path.posix.normalize(joined).replace(/^\.\//, "");
}

/**
 * Returns a function giving a public URL for a local asset: Cloudinary when configured,
 * else an embedded data: URI for small files. Results are cached per path; problems go to `warnings`.
 */
export function createAssetUploader(files: SiteFiles, warnings: string[]) {
  const cache = new Map<string, string>();
  return async function assetUrl(filePath: string): Promise<string | null> {
    if (cache.has(filePath)) return cache.get(filePath) || null;
    const bytes = files.get(filePath);
    if (!bytes) {
      warnings.push(`Missing file: ${filePath}`);
      return null;
    }
    const mime = MIME[path.posix.extname(filePath).toLowerCase()];
    let url: string | null = null;
    if (!mime?.startsWith("font/")) {
      try {
        url = (await uploadToCloudinary(Buffer.from(bytes), "template-sites")).secure_url;
      } catch {
        // Cloudinary not set up: fall back to embedding small files below
      }
    }
    if (!url && mime && bytes.byteLength <= EMBED_MAX_BYTES) {
      url = `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
    }
    if (!url) warnings.push(`Skipped ${filePath} (too large to embed and uploads are not set up).`);
    cache.set(filePath, url ?? "");
    return url;
  };
}

/** Media files (images, video, audio) in an upload, e.g. to give their URLs to the AI conversion. */
export function mediaPaths(files: SiteFiles) {
  return [...files.keys()].filter((p) => {
    const mime = MIME[path.posix.extname(p).toLowerCase()];
    return !!mime && !mime.startsWith("font/");
  });
}

export async function bundleStaticSite(files: SiteFiles): Promise<{ document: string; warnings: string[] }> {
  const entry = findEntry(files);
  if (!entry) throw new HttpError(400, "No index.html found in the upload.");
  const root = path.posix.dirname(entry) === "." ? "" : path.posix.dirname(entry);
  const warnings: string[] = [];
  const assetUrl = createAssetUploader(files, warnings);

  /** Rewrites url(...) references inside CSS. */
  async function rewriteCss(css: string, from: string) {
    const refs = [...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)];
    for (const [match, , ref] of refs) {
      if (!ref || !isLocal(ref)) continue;
      const url = await assetUrl(resolveRef(from, ref, root));
      if (url) css = css.split(match).join(`url("${url}")`);
    }
    return css;
  }

  const html = readText(files, entry)!;
  const doc = parse(html, { comment: false, blockTextElements: { script: true, style: true, noscript: true } });

  // Stylesheets -> inline <style>
  for (const link of doc.querySelectorAll('link[rel~="stylesheet"]')) {
    const href = link.getAttribute("href") ?? "";
    if (!isLocal(href)) continue;
    const cssPath = resolveRef(entry, href, root);
    const css = readText(files, cssPath);
    if (css === undefined) {
      warnings.push(`Missing stylesheet: ${cssPath}`);
      link.remove();
      continue;
    }
    link.replaceWith(`<style>${(await rewriteCss(css, cssPath)).replace(/<\/style/gi, "<\\/style")}</style>`);
  }

  // <style> blocks may point at images too
  for (const style of doc.querySelectorAll("style")) {
    style.set_content(await rewriteCss(style.innerHTML, entry));
  }

  // Scripts -> inline <script>
  for (const script of doc.querySelectorAll("script[src]")) {
    const src = script.getAttribute("src") ?? "";
    if (!isLocal(src)) continue;
    const jsPath = resolveRef(entry, src, root);
    const js = readText(files, jsPath);
    if (js === undefined) {
      warnings.push(`Missing script: ${jsPath}`);
      script.remove();
      continue;
    }
    const type = script.getAttribute("type");
    script.replaceWith(`<script${type ? ` type="${type}"` : ""}>${js.replace(/<\/script/gi, "<\\/script")}</script>`);
  }

  // Images, media and icons
  const mediaAttrs: Array<[string, string]> = [
    ["img", "src"],
    ["source", "src"],
    ["video", "src"],
    ["video", "poster"],
    ["audio", "src"],
    ["link[rel~='icon']", "href"],
  ];
  for (const [selector, attr] of mediaAttrs) {
    for (const el of doc.querySelectorAll(selector)) {
      const ref = el.getAttribute(attr) ?? "";
      if (!isLocal(ref)) continue;
      const url = await assetUrl(resolveRef(entry, ref, root));
      if (url) el.setAttribute(attr, url);
    }
  }
  for (const el of doc.querySelectorAll("img[srcset], source[srcset]")) el.removeAttribute("srcset");

  // Inline style="background: url(...)"
  for (const el of doc.querySelectorAll("[style]")) {
    const style = el.getAttribute("style") ?? "";
    if (style.includes("url(")) el.setAttribute("style", await rewriteCss(style, entry));
  }

  return { document: ensureDocument(doc), warnings };
}

/** Makes sure the result is a full document with a doctype and charset. */
function ensureDocument(doc: HTMLElement) {
  let out = doc.toString();
  if (!/<html[\s>]/i.test(out)) out = `<html><head><meta charset="utf-8"></head><body>${out}</body></html>`;
  if (!/^\s*<!doctype/i.test(out)) out = `<!doctype html>\n${out}`;
  return out;
}
