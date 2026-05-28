import { useEffect, useRef } from 'react';

/**
 * Attaches a CSS-variable mouse-follow glow to a ref'd container.
 * Use with `.spotlight` (sets --x/--y) or `.btn-magnet` (sets --mx/--my).
 *
 * Returns a ref to attach: `const ref = useMouseGlow();`
 */
export default function useMouseGlow({ varX = '--x', varY = '--y' } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty(varX, `${x}%`);
      el.style.setProperty(varY, `${y}%`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, [varX, varY]);
  return ref;
}
