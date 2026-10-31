import { motion } from 'framer-motion';
import useMouseGlow from '../motion/useMouseGlow';

/**
 * Premium glass card — rounded, blurred, gradient-edge, mouse-follow glow.
 *
 * Props:
 *  - tone: 'default' | 'strong' | 'subtle'
 *  - withBorder: gradient border treatment
 *  - withSpotlight: enables `.spotlight` mouse-follow shine
 *  - hover: 'lift' (default) | 'tilt' | 'none'
 */
export default function GlassCard({
  children,
  className = '',
  tone = 'default',
  withBorder = false,
  withSpotlight = false,
  hover = 'lift',
  as = 'div',
  ...rest
}) {
  const ref = useMouseGlow();
  const Tag = motion[as] || motion.div;

  const base =
    tone === 'strong' ? 'glass-strong'
    : tone === 'subtle' ? 'card-glass'
    : 'glass';

  const hoverProps =
    hover === 'lift'
      ? { whileHover: { y: -4 }, transition: { type: 'spring', stiffness: 240, damping: 22 } }
      : hover === 'tilt'
      ? { whileHover: { y: -6, rotateX: 1.5, rotateY: -1.5 } }
      : {};

  return (
    <Tag
      ref={withSpotlight ? ref : undefined}
      className={`relative ${base} ${withBorder ? 'border-gradient' : ''} ${withSpotlight ? 'spotlight' : ''} ${className}`}
      {...hoverProps}
      {...rest}
    >
      {children}
    </Tag>
  );
}
