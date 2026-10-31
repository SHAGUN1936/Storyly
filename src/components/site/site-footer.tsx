// Dark footer: brand blurb, link columns, copyright, social links and a large faint wordmark.

import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { StorylyLogo } from "@/components/brand/logo";
import { Container } from "@/components/ui/section";
import { accountLinks, footerColumns } from "@/config/nav";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-content";
import { SocialLinks } from "./social-links";

export async function SiteFooter() {
  // Pages that need an account are only listed for signed-in users
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  const columns = user ? [{ title: "Your account", links: accountLinks }, ...footerColumns] : footerColumns;

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-zinc-950 text-zinc-400">
      <Container className="pt-14 pb-10">
        <div className="grid gap-10 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-[1.5fr]">
          <div className="max-w-xs">
            <HomeLink href="/" aria-label="Storyly home">
              <StorylyLogo inverted />
            </HomeLink>
            <p className="mt-4 text-sm leading-6 text-zinc-400">{siteConfig.description}</p>
            {settings.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="mt-4 inline-block text-sm font-medium text-white hover:underline"
              >
                {settings.supportEmail}
              </a>
            )}
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold text-white">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-zinc-400 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <SocialLinks settings={settings} tone="dark" />
        </div>
      </Container>
      <Container>
        <p
          aria-hidden
          className="pointer-events-none bg-gradient-to-b from-white/[0.09] to-white/0 bg-clip-text pb-6 text-center font-display text-[clamp(64px,15vw,200px)] leading-[0.9] font-semibold tracking-tighter text-transparent select-none"
        >
          Storyly
        </p>
      </Container>
    </footer>
  );
}
