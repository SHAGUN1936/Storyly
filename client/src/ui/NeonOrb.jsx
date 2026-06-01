import { motion } from 'framer-motion';
import { useMemo } from 'react';

/**
 * Decorative neon orb — soft blurred radial. Position absolutely.
 * When `drift` is on it slowly translates in a lazy loop (default ON).
 */
export default function NeonOrb({
  color = '#8B5CF6',
  size = '24rem',
  className = '',
  style = {},
  opacity = 0.55,
  drift = true,
  duration,
}) {
  const path = useMemo(() => {
    const r = Math.random() * 80 + 40;
    return {
      x: [0, r, -r * 0.6, 0],
      y: [0, -r * 0.4, r * 0.7, 0],
    };
  }, []);
  const Tag = drift ? motion.div : 'div';
  const motionProps = drift
    ? {
        animate: path,
        transition: {
          duration: duration || 18 + Math.random() * 8,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <Tag
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 60%)`,
        filter: 'blur(60px)',
        opacity,
        // Keep the (expensive) blur rasterized on its own GPU layer so the
        // drift animation + page scroll only TRANSLATE a cached texture
        // instead of re-painting the blur every frame — prevents scroll jank.
        willChange: 'transform',
        ...style,
      }}
      {...motionProps}
      aria-hidden
    />
  );
}
