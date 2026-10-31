// Brand details used across the website, share pages and emails. Edit these first.

export const siteConfig = {
  name: "Storyly",
  tagline: "Beautiful pages for life's big moments",
  description:
    "Create elegant invitations, wedding websites and celebration pages from professionally designed templates, then share them with a link or QR code.",
  supportEmail: "agrawalvishal617@gmail.com",
};

/** Live address of the site. QR codes and share links always point here, even when running locally. */
const PUBLIC_SITE_URL = "https://storyly-rosy.vercel.app";

/** Public address of the site, used in share links and QR codes. NEXT_PUBLIC_SITE_URL overrides it. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function siteUrl(_requestOrigin?: string) {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return (fromEnv || PUBLIC_SITE_URL).replace(/\/+$/, "");
}
