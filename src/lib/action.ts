// Helpers shared by all server actions (functions that run on the server when a form is submitted).

import { revalidatePath } from "next/cache";
import type { z } from "zod";

/** Call after saving anything, so every page shows the fresh data. */
export function refreshPages() {
  revalidatePath("/", "layout");
}

/** What a form action returns to the page: a success or error message. */
export type ActionState = { ok: boolean; message: string } | null;

export const success = (message: string): ActionState => ({ ok: true, message });
export const failure = (message: string): ActionState => ({ ok: false, message });

/** Reads a submitted form into a plain object. */
export function formValues(formData: FormData) {
  const values: Record<string, unknown> = {};
  for (const key of new Set(formData.keys())) values[key] = formData.get(key);
  return values;
}

/**
 * Validates a form with a Zod schema.
 *   const parsed = parseForm(loginSchema, formData);
 *   if (!parsed.ok) return parsed.state;   // shows the first error to the user
 *   parsed.data                            // clean, typed values
 */
export function parseForm<S extends z.ZodType>(schema: S, formData: FormData) {
  const result = schema.safeParse(formValues(formData));
  if (result.success) return { ok: true as const, data: result.data as z.output<S> };
  return { ok: false as const, state: failure(result.error.issues[0]?.message ?? "Invalid form") };
}
