"use client";

// A link to a page you may already be on (e.g. the logo): if you are, it glides back to the top
// instead of jumping there.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { scrollToTop } from "./smooth-scroll";

export function HomeLink({ href, ...props }: React.ComponentProps<typeof Link> & { href: string }) {
  const pathname = usePathname();
  return (
    <Link
      href={href}
      {...props}
      onClick={(e) => {
        props.onClick?.(e);
        if (pathname !== href || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        scrollToTop();
      }}
    />
  );
}
