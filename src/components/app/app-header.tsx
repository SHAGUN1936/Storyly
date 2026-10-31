"use client";

// Top bar of the signed-in app: logo, Studio / My pages, and the account menu.

import { ChevronDown, Receipt, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import { HomeLink } from "@/components/home-link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { AuthUser } from "@/components/auth/auth-provider";
import { StorylyLogo } from "@/components/brand/logo";
import { Container } from "@/components/ui/section";
import { cn, firstName } from "@/lib/utils";

const NAV = [
  { label: "Studio", href: "/studio" },
  { label: "My pages", href: "/my-videos" },
];

export function AppHeader({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950 text-white">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <HomeLink href="/studio" aria-label="Storyly studio">
            <StorylyLogo inverted />
          </HomeLink>
          <nav className="flex items-center gap-1" aria-label="App">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname.startsWith(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith(item.href) ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <AccountMenu user={user} />
      </Container>
    </header>
  );
}

function AccountMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-white/15 py-1.5 pr-2.5 pl-1.5 text-sm font-medium text-white hover:bg-white/10"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-white text-xs font-semibold text-zinc-950 uppercase">
          {firstName(user.name).slice(0, 1) || "U"}
        </span>
        <span className="hidden sm:inline">{firstName(user.name)}</span>
        <ChevronDown size={14} className="text-zinc-400" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 animate-fade-in rounded-xl border border-zinc-200 bg-white p-1.5 text-zinc-900 shadow-xl shadow-zinc-900/10"
        >
          <div className="border-b border-zinc-100 px-3 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <div className="py-1">
            <Link href="/account" role="menuitem" className={item}>
              <UserRound size={16} aria-hidden /> Account
            </Link>
            <Link href="/receipts" role="menuitem" className={item}>
              <Receipt size={16} aria-hidden /> Receipts
            </Link>
            {user.role === "admin" && (
              <Link href="/admin" role="menuitem" className={item}>
                <Shield size={16} aria-hidden /> Admin panel
              </Link>
            )}
          </div>
          <SignOutButton icon role="menuitem" className={item} formClassName="border-t border-zinc-100 pt-1" />
        </div>
      )}
    </div>
  );
}
