// Form and request rules (Zod). Used by server actions and API routes.

import { z } from "zod";
import { BUILDER_CATEGORIES, RECIPIENT_MAX, TEMPLATE_CATEGORIES } from "./constants";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^\S+@\S+\.\S+$/, "Enter a valid email");
const password = z.string().min(6, "Password must be at least 6 characters");
const name = z.string().trim().min(1, "Name is required").max(80, "Name must be 80 characters or fewer");

/** Any JSON object (template structure, page customizations). */
const jsonObject = z.record(z.string(), z.unknown());

// ---------- Accounts ----------

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z.object({ name, email, password });

export const profileSchema = z.object({
  name,
  avatar: z.string().trim().optional(),
});

export const changePasswordSchema = z.object({
  // Google-only accounts have no password yet, so this one can be empty
  currentPassword: z.string().optional().default(""),
  newPassword: password,
});

// ---------- Templates ----------

/** Admin template form (multipart: these fields plus optional thumbnail/preview files). */
export const adminTemplateSchema = z.object({
  name: z.string().trim().min(1, "Please enter a website name."),
  category: z.enum(TEMPLATE_CATEGORIES).catch("Memories"),
  description: z.string().optional(),
  structure: z.string().optional(),
  duration: z.coerce.number().positive().optional().catch(undefined),
  published: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

export const builderTemplateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  category: z.enum(BUILDER_CATEGORIES, "Pick a category"),
  description: z.string().optional().default(""),
  structure: jsonObject.optional(),
  thumbnailUrl: z.string().optional().default(""),
  duration: z.number().optional().default(0),
  published: z.boolean().optional().default(false),
});

export const builderTemplateUpdateSchema = builderTemplateSchema
  .extend({
    description: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    duration: z.number().optional(),
    published: z.boolean().optional(),
  })
  .partial();

// ---------- Pages (a user's copy of a template) ----------

const recipientName = z
  .string()
  .trim()
  .transform((v) => v.slice(0, RECIPIENT_MAX))
  .optional();

const sourceType = z.enum(["Template", "BuilderTemplate"]).catch("Template");

export const createPageSchema = z.object({
  templateId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid template id"),
  sourceType,
  recipientName,
  customizations: jsonObject.optional().default({}),
});

export const saveDraftSchema = z.object({
  id: z.string().optional(),
  templateId: z.string().optional(),
  sourceType,
  recipientName,
  customizations: jsonObject.optional().default({}),
});

export const updatePageSchema = z.object({
  customizations: jsonObject,
});

// ---------- Website content (Admin → Website) ----------

const text = (label: string, max = 600) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be ${max} characters or fewer`);
const order = z.coerce.number().int().min(0).max(999).catch(0);
/** Checkbox: present ("on") means true. */
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

export const faqSchema = z.object({
  question: text("Question", 200),
  answer: text("Answer", 1000),
  order,
  published: checkbox,
});

export const testimonialSchema = z.object({
  name: text("Name", 80),
  role: z.string().trim().max(80).default(""),
  quote: text("Quote", 500),
  order,
  published: checkbox,
});

export const statSchema = z.object({
  label: text("Label", 60),
  value: z.coerce.number("Enter a number").int("Use a whole number").min(0),
  suffix: z.string().max(10).default(""),
  order,
});

/** Empty, or a full https:// link. */
const url = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "Links must start with https://");

export const siteSettingsSchema = z.object({
  supportEmail: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email"),
  phone: z.string().trim().max(30),
  address: z.string().trim().max(200),
  instagram: url,
  twitter: url,
  youtube: url,
  linkedin: url,
});
