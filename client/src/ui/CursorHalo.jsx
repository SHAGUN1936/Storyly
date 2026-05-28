import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Global mouse-follow cursor halo. Renders a soft blurred radial glow that
 * trails the mouse with a spring. Skipped on touch devices and when the user
 * prefers reduced motion.
 *
 * Light mode uses `mix-blend-mode: multiply` (darkens) with a deeper magenta;
 * dark mode uses `mix-blend-mode: screen` (lightens) with a luminous purple.
 */
export default function CursorHalo({
  darkColor = '#A855F7',
  lightColor = '#7C3AED',
  size = 320,
}) {
  const [enabled, setEnabled] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const posRef = useRef({ x: -size, y: -size });
  const elRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const touch  = window.matchMedia('(hover: none)').matches;
    if (reduce || touch) return;
    setEnabled(true);

    // Track theme — flip blend mode when `html.light` toggles
    const readTheme = () => setIsLight(document.documentElement.classList.contains('light'));
    readTheme();
    const obs = new MutationObserver(readTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    let raf;
    let tx = -size, ty = -size;
    const onMove = (e) => {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
    };
    const tick = () => {
      tx += (posRef.current.x - tx) * 0.16;
      ty += (posRef.current.y - ty) * 0.16;
      if (elRef.current) {
        elRef.current.style.transform = `translate3d(${tx - size / 2}px, ${ty - size / 2}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      obs.disconnect();
    };
  }, [size]);

  if (!enabled) return null;

  const color = isLight ? lightColor : darkColor;
  // Multiply darkens on light bg (visible); screen brightens on dark bg.
  const blend = isLight ? 'multiply' : 'screen';
  // Softer overall — the halo should be a hint of color, not a spotlight.
  const opacity = isLight ? 0.18 : 0.16;
  const grad = isLight
    ? `radial-gradient(circle, ${color}55 0%, ${color}20 40%, transparent 70%)`
    : `radial-gradient(circle, ${color}50 0%, ${color}18 40%, transparent 70%)`;

  return (
    <motion.div
      ref={elRef}
      className="pointer-events-none fixed top-0 left-0 z-[60] rounded-full"
      style={{
        width: size,
        height: size,
        background: grad,
        filter: 'blur(38px)',
        opacity,
        willChange: 'transform',
        mixBlendMode: blend,
      }}
      aria-hidden
    />
  );
}
