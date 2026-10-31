"use client";

// Pill tabs for switching between the parts of a section (e.g. /about, /about/mission).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SubNavItem = { path: string; label: string };

/** URL of a tab: "" is the section root, anything else is /base/path. */
export const tabHref = (base: string, path: string) => (path ? `${base}/${path}` : base);

export function SubNav({ base, items, className }: { base: string; items: SubNavItem[]; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto p-1", className)} aria-label="Section">
      {items.map((item) => {
        const href = tabHref(base, item.path);
        const active = pathname === href;
        return (
          <Link
            key={item.path || "root"}
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-zinc-900 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
