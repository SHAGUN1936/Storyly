import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMotion } from '../motion/MotionProvider';

/**
 * Resets scroll to the top of the page on every route change. Lives at
 * the top of <App> so it fires for ALL navigations — footer links,
 * navbar clicks, Link components, anything.
 *
 * Respects `#hash` anchors — if the user clicked a link with a hash
 * (e.g. /landing#features), let the browser/SubNav scroll to that
 * anchor instead of jumping to top.
 *
 * Uses the Lenis instance when available (so smooth-scroll pages reset
 * cleanly); falls back to window.scrollTo otherwise.
 */
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();
  const { lenis } = useMotion();

  useEffect(() => {
    // Hash navigation — let the destination page handle scroll-to-anchor
    if (hash) return;

    // Lenis (smooth scroll) is the source of truth when active
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
      return;
    }

    // Native scroll fallback
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    }
  }, [pathname, hash, key, lenis]);

  return null;
}
