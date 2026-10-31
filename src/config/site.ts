// Brand details used across the website, share pages and emails. Edit these first.

export const siteConfig = {
  name: "Storyly",
  tagline: "Beautiful pages for life's big moments",
  description:
    "Create elegant invitations, wedding websites and celebration pages from professionally designed templates, then share them with a link or QR code.",
  supportEmail: "agrawalvishal617@gmail.com",
};

/** Public address of the site, used in share links and QR codes. Falls back to the request's own origin. */
export function siteUrl(requestOrigin?: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv || requestOrigin || "http://localhost:3001").replace(/\/+$/, "");
}
