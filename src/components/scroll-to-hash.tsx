"use client";

// Makes "#section" links reliable (e.g. /#faq in the header and footer):
// - on the same page: smooth-scrolls to the section, even when the link is clicked again
// - from another page: scrolls to the section once the new page has rendered
// Sections use `scroll-mt-*` so they stop just below the sticky header.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToId(id: string, behavior: ScrollBehavior) {
  const target = document.getElementById(decodeURIComponent(id));
  if (!target) return false;
  target.scrollIntoView({ behavior, block: "start" });
  return true;
}

export function ScrollToHash() {
  const pathname = usePathname();

  // Arriving on a page with a #hash: wait for the section to exist, then jump to it
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    let tries = 0;
    const timer = setInterval(() => {
      if (scrollToId(id, "auto") || ++tries > 20) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [pathname]);

  // Clicks on "#section" links that point at the current page
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as HTMLElement).closest("a");
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (!url.hash || url.origin !== window.location.origin || url.pathname !== window.location.pathname) return;
      if (!scrollToId(url.hash.slice(1), "smooth")) return;
      event.preventDefault();
      window.history.pushState(null, "", url.hash);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
