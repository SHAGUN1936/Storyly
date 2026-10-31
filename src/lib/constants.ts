// Dropdown lists and fixed values used by both the browser and the server.

/** Categories admins can publish official templates in. */
export const TEMPLATE_CATEGORIES = ["Love", "Friendship", "Birthday", "Memories", "Wedding"] as const;

/** Builders get a few extra categories on top of the admin ones. */
export const BUILDER_CATEGORIES = [...TEMPLATE_CATEGORIES, "Event", "Invitation", "Couple", "Greeting"] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];
export type BuilderCategory = (typeof BUILDER_CATEGORIES)[number];

/** Longest allowed "made for" name on a page. */
export const RECIPIENT_MAX = 80;

/** Largest photo/video a user can upload. */
export const UPLOAD_MAX_BYTES = 100 * 1024 * 1024;

/** File types accepted by the upload endpoint. */
export const UPLOAD_EXTENSIONS = /\.(jpe?g|png|gif|webp|mp4|mov|webm)$/i;
