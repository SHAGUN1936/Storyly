import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';

const MotionContext = createContext({ lenis: null, prefersReducedMotion: false });

/** Routes where Lenis must NOT take over the wheel — these pages are
 *  full-screen editor shells (their entire viewport is an editor with
 *  internal scroll containers, so Lenis has nothing useful to do and
 *  its wheel hijacking breaks the editor's panels).
 *
 *  Only the EDITOR sub-routes opt out (`/template/:id/edit` and
 *  `/template/:id/customize`). The bare template PREVIEW (`/template/:id`)
 *  is a normal scrolling page and keeps smooth scroll. Other pages that
 *  contain an editor shell (e.g. /admin) keep Lenis on and let the editor
 *  opt out with `data-lenis-prevent` on its `.tpl-editor-shell` root. */
const NO_LENIS_PREFIXES = [];
const EDITOR_ROUTE = /^\/template\/[^/]+\/(edit|customize)(\/|$)/;

/* Master switch for Lenis smooth scroll. Turned OFF: Lenis drives scroll
   with an inertia/lerp so the page keeps gliding ("slowly drifting down")
   after the user stops scrolling, which reads as laggy. Native scrolling
   stops exactly when the finger/wheel stops — crisp on every device. Flip
   to `true` to bring smooth scroll back. */
const LENIS_SMOOTH_SCROLL = false;

/* Coarse pointer / no-hover = a touch device (phone or tablet). */
const TOUCH_QUERY = '(pointer: coarse), (hover: none)';
function detectTouch() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(TOUCH_QUERY).matches;
}

/**
 * Global motion provider — boots Lenis smooth scroll except on routes
 * that need native inner-container scrolling. Lenis is also disabled
 * when the user prefers reduced motion.
 */
export function MotionProvider({ children }) {
  const lenisRef = useRef(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  /* Touch devices use NATIVE scrolling — never Lenis. Lenis attaches its
     touch listeners with `{ passive: false }` and calls preventDefault()
     to drive its own scroll; on phones this fights the browser's native
     touch panning and can leave single-finger scrolling blocked. Native
     mobile scroll is already smooth, so Lenis has nothing to add there.

     Detected SYNCHRONOUSLY in the initial state (lazy initializer) so
     Lenis is never even constructed on a touch device — there's no
     window between first render and an effect where its passive:false
     touch listeners could attach. Kept reactive below so the dev-tools
     device-emulation toggle flips it live. */
  const [isTouch, setIsTouch] = useState(detectTouch);
  const location = useLocation();
  const skipLenis =
    !LENIS_SMOOTH_SCROLL ||
    isTouch ||
    NO_LENIS_PREFIXES.some((p) => location.pathname.startsWith(p)) ||
    EDITOR_ROUTE.test(location.pathname);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(TOUCH_QUERY);
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion || skipLenis) return;
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisRef.current = lenis;
    let raf;
    const tick = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReducedMotion, skipLenis]);

  return (
    <MotionContext.Provider value={{ lenis: lenisRef.current, prefersReducedMotion }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion() {
  return useContext(MotionContext);
}
