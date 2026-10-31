"use server";

// Saving the website copy from Admin → Website and Admin → Settings.
// Every action checks the visitor is an admin first, then refreshes the public pages.

import type { z } from "zod";
import { parseForm, refreshPages, success, type ActionState } from "@/lib/action";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_FAQS } from "@/lib/site-content";
import { faqSchema, siteSettingsSchema, statSchema, testimonialSchema } from "@/lib/validators";

/** Validates the form, runs the write, refreshes the site. */
async function save<S extends z.ZodType>(
  schema: S,
  formData: FormData,
  write: (data: z.output<S>) => Promise<unknown>,
  message: string,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  await write(parsed.data);
  refreshPages();
  return success(message);
}

async function remove(write: () => Promise<unknown>) {
  await requireAdmin();
  await write();
  refreshPages();
}

/** Numbers each starting item 0, 1, 2… so they keep their order. */
const ordered = <T extends object>(items: T[]) => items.map((item, order) => ({ ...item, order }));

// ---------- FAQs ----------

export async function createFaq(_prev: ActionState, formData: FormData) {
  return save(faqSchema, formData, (data) => db.faq.create({ data }), "Question added");
}

export async function updateFaq(id: string, _prev: ActionState, formData: FormData) {
  return save(faqSchema, formData, (data) => db.faq.update({ where: { id }, data }), "Question saved");
}

export async function deleteFaq(id: string) {
  await remove(() => db.faq.delete({ where: { id } }));
}

export async function importDefaultFaqs() {
  await remove(() => db.faq.createMany({ data: ordered(DEFAULT_FAQS) }));
}

// ---------- Testimonials ----------

export async function createTestimonial(_prev: ActionState, formData: FormData) {
  return save(testimonialSchema, formData, (data) => db.testimonial.create({ data }), "Testimonial added");
}

export async function updateTestimonial(id: string, _prev: ActionState, formData: FormData) {
  return save(
    testimonialSchema,
    formData,
    (data) => db.testimonial.update({ where: { id }, data }),
    "Testimonial saved",
  );
}

export async function deleteTestimonial(id: string) {
  await remove(() => db.testimonial.delete({ where: { id } }));
}

// ---------- Headline numbers ----------

export async function createStat(_prev: ActionState, formData: FormData) {
  return save(statSchema, formData, (data) => db.siteStat.create({ data }), "Number added");
}

export async function updateStat(id: string, _prev: ActionState, formData: FormData) {
  return save(statSchema, formData, (data) => db.siteStat.update({ where: { id }, data }), "Number saved");
}

export async function deleteStat(id: string) {
  await remove(() => db.siteStat.delete({ where: { id } }));
}

// ---------- Business details ----------

export async function saveSiteSettings(_prev: ActionState, formData: FormData) {
  return save(
    siteSettingsSchema,
    formData,
    async (data) => {
      const existing = await db.siteSettings.findFirst({ select: { id: true } });
      return existing ? db.siteSettings.update({ where: { id: existing.id }, data }) : db.siteSettings.create({ data });
    },
    "Settings saved",
  );
}

// ---------- Feedback from the website form ----------

export async function deleteFeedback(id: string) {
  await remove(() => db.feedback.delete({ where: { id } }));
}
