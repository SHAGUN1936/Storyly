// Menus for the header and the footer.

export const mainNav = [
  { label: "Templates", href: "/marketplace" },
  { label: "Features", href: "/#features" },
  { label: "Customers", href: "/stories" },
  { label: "For creators", href: "/builder" },
  { label: "Help", href: "/help" },
];

/** Extra footer links shown only to signed-in users (these pages need an account). */
export const accountLinks = [
  { label: "Studio", href: "/studio" },
  { label: "My pages", href: "/my-videos" },
  { label: "Account", href: "/account" },
];

export const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Templates", href: "/marketplace" },
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Tutorials", href: "/tutorials" },
      { label: "Customer stories", href: "/stories" },
      { label: "Creator program", href: "/builder" },
      { label: "Creator pricing", href: "/builder/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

/** True when `href` is the current section. Home only matches "/" exactly. */
export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
