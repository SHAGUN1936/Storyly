import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll to the top of the page when the user navigates to a
 * different top-level section. Lives at the top of <App> so it fires
 * for every route change anywhere in the app.
 *
 * What it does NOT do (intentionally):
 *  - Scroll when only the SUB-route changes (e.g. /about → /about/team
 *    or /marketplace → /marketplace/wedding). The user just clicked
 *    a tab inside the same section — keeping their scroll position
 *    means the SubNav stays in view and they don't see a janky
 *    "scroll-to-top THEN content swap" sequence.
 *  - Scroll when the URL has a `#hash` — let the destination page
 *    handle anchor positioning.
 *
 * Uses plain `window.scrollTo(0, 0)` (no smooth behavior, no Lenis)
 * so the reset is truly instant — no visible animation between routes.
 */
function getSection(pathname) {
  return (pathname.split('/').filter(Boolean)[0] || '').toLowerCase();
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const previousSectionRef = useRef(getSection(pathname));

  useEffect(() => {
    if (hash) return;
    const currentSection = getSection(pathname);
    const previousSection = previousSectionRef.current;
    previousSectionRef.current = currentSection;

    // Sub-tab change within the same section — preserve scroll.
    if (currentSection === previousSection) return;

    // Cross-section navigation — instant snap to top, no animation.
    // Briefly override the global `html { scroll-behavior: smooth }`
    // so this route-change reset isn't animated.
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      const savedSB = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      html.style.scrollBehavior = savedSB;
    }
  }, [pathname, hash]);

  return null;
}
