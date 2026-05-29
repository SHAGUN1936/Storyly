import { useEffect } from 'react';
import { useMotion } from '../motion/MotionProvider';

/**
 * Robust body-scroll lock used by every modal in the app.
 *
 * What it does while `locked` is true:
 *   1. Saves the current window.scrollY.
 *   2. Pins <body> with `position: fixed; top: -scrollY` so the page
 *      visually stays put. This is the only reliable way to lock scroll
 *      on iOS Safari — `overflow: hidden` alone doesn't stop touch-drag.
 *   3. Sets `overflow: hidden` on <html> so the scrollbar disappears
 *      cleanly (the `scrollbar-gutter: stable` rule in index.css keeps
 *      the page width unchanged — no layout shift).
 *   4. Stops Lenis (smooth-scroll) so wheel events inside the modal
 *      don't drive the page underneath.
 *
 * On unlock the body styles are reverted and window.scrollTo restores
 * the original scroll position. Reference-counted so nested modals
 * (rare, but possible) cooperate correctly.
 */
let lockCount = 0;
let savedScrollY = 0;
let savedPath = '';
let savedBodyPosition = '';
let savedBodyTop = '';
let savedBodyLeft = '';
let savedBodyRight = '';
let savedBodyWidth = '';
let savedBodyPaddingRight = '';
let savedHtmlOverflow = '';

function currentPath() {
  return window.location.pathname + window.location.search;
}

function applyLock() {
  if (typeof window === 'undefined') return;
  const body = document.body;
  const html = document.documentElement;

  // Measure the scrollbar width BEFORE we hide it. We'll re-apply this
  // as padding-right so the page doesn't visually shift wider when the
  // scrollbar disappears under overflow:hidden.
  const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);

  savedScrollY = window.scrollY || window.pageYOffset || 0;
  savedPath = currentPath();
  savedBodyPosition = body.style.position;
  savedBodyTop = body.style.top;
  savedBodyLeft = body.style.left;
  savedBodyRight = body.style.right;
  savedBodyWidth = body.style.width;
  savedBodyPaddingRight = body.style.paddingRight;
  savedHtmlOverflow = html.style.overflow;

  // iOS-friendly lock: pin the body in place at its current scroll offset.
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.left = '0';
  // Constrain the right edge so the body doesn't expand into the
  // disappearing scrollbar's space — this keeps centered content
  // visually stable when the modal opens. Falls through to the existing
  // padding-right if any was set inline.
  body.style.right = `${scrollbarWidth}px`;
  body.style.width = `calc(100% - ${scrollbarWidth}px)`;
  html.style.overflow = 'hidden';
}

function releaseLock() {
  if (typeof window === 'undefined') return;
  const body = document.body;
  const html = document.documentElement;
  body.style.position = savedBodyPosition;
  body.style.top = savedBodyTop;
  body.style.left = savedBodyLeft;
  body.style.right = savedBodyRight;
  body.style.width = savedBodyWidth;
  body.style.paddingRight = savedBodyPaddingRight;
  html.style.overflow = savedHtmlOverflow;
  // ONLY restore the saved scroll position if we're still on the same
  // page. If the user navigated away while a modal was open, ScrollToTop
  // has already reset the new page to its expected scroll (0). Restoring
  // the old page's scrollY here would cause a visible "auto scroll" to
  // an unexpected position on the new page.
  if (currentPath() === savedPath) {
    window.scrollTo(0, savedScrollY);
  }
}

export default function useLockBodyScroll(locked) {
  const { lenis } = useMotion();

  useEffect(() => {
    if (!locked) return;
    if (typeof window === 'undefined') return;

    if (lockCount === 0) {
      applyLock();
      // Pause Lenis so its rAF loop doesn't keep generating scroll
      // animations against a frozen body.
      lenis?.stop?.();
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        releaseLock();
        lenis?.start?.();
      }
    };
  }, [locked, lenis]);
}
