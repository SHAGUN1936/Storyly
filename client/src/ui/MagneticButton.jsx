import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Magnetic button — gently follows the cursor when hovered, with a glowing
 * radial trail. Wraps any inner content.
 *
 * Props:
 *  - variant: 'glow' (gradient fill) | 'ghost' (outline) | 'soft' (subtle)
 *  - as: render element (default 'button')
 *  - strength: how strongly it follows the cursor (px)
 */
export default function MagneticButton({
  children,
  className = '',
  variant = 'glow',
  as: Tag = 'button',
  strength = 14,
  onMouseMove,
  onMouseLeave,
  type,
  ...rest
}) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.6 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.6 });
  const rotX = useTransform(springY, [-strength, strength], [4, -4]);
  const rotY = useTransform(springX, [-strength, strength], [-4, 4]);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const dx = ((relX - rect.width / 2) / rect.width) * 2 * strength;
    const dy = ((relY - rect.height / 2) / rect.height) * 2 * strength;
    x.set(dx);
    y.set(dy);
    el.style.setProperty('--mx', `${(relX / rect.width) * 100}%`);
    el.style.setProperty('--my', `${(relY / rect.height) * 100}%`);
    onMouseMove?.(e);
  };
  const handleLeave = (e) => {
    x.set(0); y.set(0);
    onMouseLeave?.(e);
  };

  const variantClass =
    variant === 'glow' ? 'btn-glow'
    : variant === 'ghost' ? 'btn-ghost'
    : 'btn-pill-soft';

  const MotionTag = motion[Tag] || motion.button;

  return (
    <MotionTag
      ref={ref}
      type={Tag === 'button' ? (type || 'button') : undefined}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY, rotateX: rotX, rotateY: rotY, transformPerspective: 600 }}
      className={`btn-magnet ${variantClass} ${className}`}
      whileTap={{ scale: 0.96 }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
