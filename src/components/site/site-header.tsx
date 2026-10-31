"use client";

// Sticky top bar: logo, main menu, sign-in / studio buttons, and a menu sheet on phones.
// While a dark hero (any element with data-dark-hero, e.g. the home hero or <PageHeader>) is under it,
// the bar is dark; once the page scrolls past the hero it turns white.

import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { StorylyLogo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-styles";
import { Container } from "@/components/ui/section";
import { isActive, mainNav } from "@/config/nav";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  // Close the phone menu after navigating
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.querySelector("[data-dark-hero]");
      setDark(!!hero && hero.getBoundingClientRect().bottom > 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  // Visitors only meet sign-up when they choose to start; the sign-up screen links to sign-in.
  // On the dark bar the button is white; inside the white phone menu it is always black.
  const action = (onDark: boolean) => (
    <Link
      href={user ? "/studio" : "/signup"}
      className={buttonClasses({ size: "sm", variant: onDark ? "inverted" : "primary" })}
    >
      {user ? "Open studio" : "Get started"}
    </Link>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        dark ? "border-white/10 bg-zinc-950" : "border-zinc-200/80 bg-white/95",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <HomeLink href="/" aria-label="Storyly home">
          <StorylyLogo inverted={dark} />
        </HomeLink>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                dark
                  ? "text-zinc-400 hover:text-white"
                  : isActive(pathname, item.href)
                    ? "text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">{action(dark)}</div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "-mr-2 rounded-md p-2 md:hidden",
            dark ? "text-white hover:bg-white/10" : "text-zinc-700 hover:bg-zinc-100",
          )}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <motion.span
            key={open ? "x" : "menu"}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            className="block"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </motion.span>
        </button>
      </Container>

      {/* Phone menu: slides open, links arrive one after another */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden border-t border-zinc-200 bg-white text-zinc-900 md:hidden"
          >
            <Container className="py-4">
              <nav className="grid gap-1" aria-label="Main">
                {mainNav.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-2.5 text-base font-medium text-zinc-800 hover:bg-zinc-50"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 [&>a]:w-full">{action(false)}</div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
