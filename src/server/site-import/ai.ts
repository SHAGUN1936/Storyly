// Optional AI help for imports (Claude). Only used when ANTHROPIC_API_KEY is set in this project's .env.
// - convertSourceToDocument(): turns framework source code (React, Vue…) into one self-contained HTML page
// - describeTemplate(): suggests a name, category, description and friendly labels for the editable parts
//
// The key is read from this project's .env only (not from any other login on the machine).

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { TEMPLATE_CATEGORIES } from "@/lib/constants";
import { HttpError } from "@/lib/http";
import type { Slot } from "@/lib/site-template";
import { isTextFile, type SiteFiles } from "./files";

const MODEL = "claude-opus-5-5";
/** Most source text we send in one conversion request. */
const SOURCE_LIMIT_CHARS = 400_000;

export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new HttpError(400, "AI is not set up. Add ANTHROPIC_API_KEY to .env, or upload a built site.");
  return new Anthropic({ apiKey });
}

/** Maps AI failures to messages an admin can act on. */
function aiError(err: unknown): never {
  if (err instanceof HttpError) throw err;
  if (err instanceof Anthropic.AuthenticationError)
    throw new HttpError(400, "The Anthropic API key in .env was rejected.");
  if (err instanceof Anthropic.RateLimitError) throw new HttpError(429, "AI is busy right now. Try again in a minute.");
  if (err instanceof Anthropic.APIError) throw new HttpError(502, `AI request failed (${err.status ?? "network"}).`);
  throw err;
}

const CONVERT_SYSTEM = `You convert a small website's source code into ONE self-contained HTML document that looks and behaves the same in a browser.

Rules:
- Output only the HTML document, starting with <!doctype html>. No explanations, no markdown fences.
- Inline all CSS in <style> and all JavaScript in <script>. Do not import local files; there is no build step.
- Prefer plain HTML/CSS/JavaScript. Rebuild framework components (React, Vue, Svelte, etc.) as static markup plus small vanilla scripts for interactivity and animation.
- Use the image URLs given in the asset list wherever the source uses those files. Keep external https links as they are.
- Add data-storyly-slot="<short-id>" to every element a person would personalise: names, dates, headings, messages, venue, photos (<img>). Use unique, descriptive ids like "couple-names" or "hero-photo".
- Keep it under 300 KB. Leave out code that cannot run in a static page (servers, databases, logins, payments).`;

/** Converts framework source into one HTML document (long output, so it streams). */
export async function convertSourceToDocument(files: SiteFiles, assetUrls: Map<string, string>) {
  let budget = SOURCE_LIMIT_CHARS;
  const parts: string[] = [];
  for (const [path, bytes] of files) {
    if (!isTextFile(path) || /(package-lock|yarn\.lock|pnpm-lock)/.test(path)) continue;
    const text = new TextDecoder().decode(bytes);
    if (text.length > budget) {
      throw new HttpError(
        400,
        "The project's source is too large for AI conversion. Upload the built site (the dist or build folder) instead.",
      );
    }
    budget -= text.length;
    parts.push(`<file path="${path}">\n${text}\n</file>`);
  }
  const assets = [...assetUrls].map(([path, url]) => `${path} -> ${url}`).join("\n") || "(none)";

  try {
    const stream = client().beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: CONVERT_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Asset list (local path -> public URL):\n${assets}\n\nSource files:\n${parts.join("\n")}`,
        },
      ],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw new HttpError(422, "AI could not convert this project.");
    if (message.stop_reason === "max_tokens")
      throw new HttpError(422, "The page was too large for AI to convert in one go.");
    const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const start = text.search(/<!doctype html|<html/i);
    if (start < 0) throw new HttpError(422, "AI did not return an HTML page.");
    return text
      .slice(start)
      .replace(/```\s*$/, "")
      .trim();
  } catch (err) {
    aiError(err);
  }
}

const descriptionSchema = z.object({
  name: z.string().describe("Short template name, 2-5 words, e.g. 'Royal Wedding Invite'"),
  category: z.enum(TEMPLATE_CATEGORIES),
  description: z.string().describe("One or two sentences describing the template for users"),
  slots: z.array(
    z.object({
      id: z.string(),
      label: z
        .string()
        .describe("What a user fills in here, 1-4 words, e.g. 'Couple names', 'Wedding date', 'Hero photo'"),
      keep: z.boolean().describe("false for text users would never change (menu labels, copyright, button words)"),
    }),
  ),
});

export type TemplateDescription = z.infer<typeof descriptionSchema>;

/** Suggests template details and slot labels from the page's editable parts. */
export async function describeTemplate(title: string, slots: Slot[]): Promise<TemplateDescription> {
  const list = slots
    .map((s) => `${s.id} [${s.type}]: ${s.type === "image" ? "(image)" : s.default.slice(0, 120)}`)
    .join("\n");
  try {
    const message = await client().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: betaZodOutputFormat(descriptionSchema) },
      messages: [
        {
          role: "user",
          content: `This is a page template for personal occasions (invitations, wedding pages, birthdays). Page title: "${title}".
Its editable parts are listed below. Suggest the template's name, category and description, and give every part a short label saying what a user would put there. Mark parts users would not personalise with keep=false.

${list}`,
        },
      ],
    });
    if (message.stop_reason === "refusal" || !message.parsed_output) {
      throw new HttpError(422, "AI could not describe this template.");
    }
    return message.parsed_output;
  } catch (err) {
    aiError(err);
  }
}
