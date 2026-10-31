// Website copy that admins edit in Admin → Website: FAQs, testimonials, headline numbers, business details.
// FAQs have starting content (real policy answers). Testimonials and numbers start empty and their
// home page sections stay hidden until an admin adds real ones.

import "server-only";
import { cache } from "react";
import { siteConfig } from "@/config/site";
import { db } from "./db";

export const DEFAULT_FAQS = [
  {
    question: "Is Storyly free to use?",
    answer:
      "Yes. You can create and publish pages on the free plan. Premium marketplace templates are an optional one-time purchase, from ₹49 to ₹999.",
  },
  {
    question: "Do I need design skills?",
    answer:
      "No. Every template is designed by professionals. You click any text, photo or video to replace it, and layout guides keep everything aligned.",
  },
  {
    question: "How do guests open my page?",
    answer:
      "Every published page gets a short link and a QR code. Guests open it in their phone's browser; there is nothing to install.",
  },
  {
    question: "Can I edit a page after sharing it?",
    answer: "Yes. Edit any time and the changes appear on the same link instantly, so you never need to resend it.",
  },
  {
    question: "Who can see my page?",
    answer:
      "Anyone with the link can view it. Pages are not listed in any public directory, so only the people you share it with will find it.",
  },
  {
    question: "Which payment methods do you accept?",
    answer: "UPI, all major credit and debit cards, NetBanking and international wallets.",
  },
  {
    question: "Can I get a refund?",
    answer: "Templates are refundable within 7 days if unused. See the refund policy in our Terms for details.",
  },
];

/** No built-in testimonials or numbers: the home page only shows the ones an admin adds. */
export const DEFAULT_TESTIMONIALS: Array<{ name: string; role: string; quote: string }> = [];
export const DEFAULT_STATS: Array<{ label: string; value: number; suffix: string }> = [];

export const DEFAULT_SETTINGS = {
  supportEmail: siteConfig.supportEmail,
  phone: "",
  address: "",
  instagram: "",
  twitter: "",
  youtube: "",
  linkedin: "",
};

export type SiteSettingsData = typeof DEFAULT_SETTINGS;

/**
 * Reads from the database, falling back to the starting content when nothing is saved yet
 * or the database can't be reached (the public site should always render).
 */
async function withFallback<T>(load: () => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    const rows = await load();
    return rows.length ? rows : fallback;
  } catch (err) {
    console.error("[site-content]", err);
    return fallback;
  }
}

const byOrder = { orderBy: [{ order: "asc" as const }, { createdAt: "asc" as const }] };

export const getFaqs = cache(() =>
  withFallback(() => db.faq.findMany({ where: { published: true }, ...byOrder }), DEFAULT_FAQS),
);

export const getTestimonials = cache(() =>
  withFallback(() => db.testimonial.findMany({ where: { published: true }, ...byOrder }), DEFAULT_TESTIMONIALS),
);

export const getStats = cache(() => withFallback(() => db.siteStat.findMany(byOrder), DEFAULT_STATS));

export const getSiteSettings = cache(async (): Promise<SiteSettingsData> => {
  try {
    const row = await db.siteSettings.findFirst();
    return row ? { ...DEFAULT_SETTINGS, ...row } : DEFAULT_SETTINGS;
  } catch (err) {
    console.error("[site-content]", err);
    return DEFAULT_SETTINGS;
  }
});
