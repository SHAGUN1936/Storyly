import { useEffect, useRef, useState } from 'react';

/**
 * Number that animates to its target value.
 *
 * Behavior:
 *  - First time the element scrolls into view, it eases from 0 to `to`.
 *  - Whenever `to` changes after that (e.g., when async data loads and the
 *    parent re-renders with a new count), it animates from the current
 *    displayed value to the new target. Earlier versions of this component
 *    only animated once which caused counts to stay at 0 if data arrived
 *    after the initial intersection.
 */
export default function AnimatedCount({
  to = 0,
  duration = 1400,
  prefix = '',
  suffix = '',
  className = '',
}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const rafRef = useRef(null);
  const inViewRef = useRef(false);
  const target = Number(to) || 0;

  const runAnimation = (toValue) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startValue = valueRef.current;
    if (startValue === toValue) return;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(startValue + (toValue - startValue) * eased);
      valueRef.current = next;
      setValue(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  // Initial intersection — animate from 0 to current target once the element
  // appears on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !inViewRef.current) {
          inViewRef.current = true;
          runAnimation(target);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // intentionally empty deps — fires once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-animate whenever `to` changes after the component is already on
  // screen (e.g., async stats arrive after the first render).
  useEffect(() => {
    if (inViewRef.current) runAnimation(target);
  }, [target, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
