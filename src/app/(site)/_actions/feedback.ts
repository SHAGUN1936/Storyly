"use server";

// Saves a story or feedback from the website form. Admins read them in Admin → Feedback.

import { z } from "zod";
import { db } from "@/lib/db";
import { toFriendlyError } from "@/lib/http";

const feedbackSchema = z
  .object({
    kind: z.enum(["story", "bug", "feature", "general"]),
    name: z.string().trim().max(80).default(""),
    email: z
      .string()
      .trim()
      .max(120)
      .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email or leave it empty")
      .default(""),
    title: z.string().trim().max(120).default(""),
    message: z.string().trim().min(1, "Please write a few words.").max(3000, "Please keep it under 3000 characters."),
    rating: z.number().int().min(0).max(5).default(0),
    context: z.string().trim().max(120).default(""),
  })
  .refine((v) => v.kind !== "story" || v.title, { message: "Please give your story a title.", path: ["title"] });

export type FeedbackInput = z.input<typeof feedbackSchema>;

export async function submitFeedback(input: FeedbackInput): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };
  try {
    await db.feedback.create({ data: parsed.data });
    return { ok: true };
  } catch (err) {
    console.error("[feedback]", err);
    return { ok: false, message: toFriendlyError(err).message };
  }
}
