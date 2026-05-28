import { useEffect, useRef } from 'react';

/**
 * Cinematic animated aurora background.
 * Pure CSS — three blurred radial blobs slowly drift and rotate. Lightweight
 * GPU-only animation, safe on mobile.
 *
 * Use as a fixed/full-bleed background:
 *   <AuroraBackground />
 *
 * Or scoped inside a container with `absolute inset-0`.
 */
export default function AuroraBackground({
  variant = 'cosmic',
  className = '',
  intensity = 0.7,
  showGrid = true,
}) {
  const stage = VARIANTS[variant] || VARIANTS.cosmic;
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {/* Base mesh */}
      <div
        className="absolute inset-0"
        style={{ background: stage.base, opacity: intensity }}
      />
      {/* Animated orbs */}
      {stage.orbs.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: orb.top,
            left: orb.left,
            right: orb.right,
            bottom: orb.bottom,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 60%)`,
            filter: 'blur(80px)',
            opacity: orb.opacity ?? intensity,
            animation: `auroraSpin ${orb.duration || 24}s linear infinite`,
            animationDelay: `${orb.delay || 0}s`,
            animationDirection: orb.reverse ? 'reverse' : 'normal',
            transformOrigin: 'center',
          }}
        />
      ))}
      {/* Optional grid texture */}
      {showGrid && <div className="absolute inset-0 bg-grid-soft opacity-30" />}
      {/* Noise + vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(6,7,12,0.55) 100%)',
        }}
      />
    </div>
  );
}

const VARIANTS = {
  cosmic: {
    base: 'radial-gradient(60rem 40rem at 10% 0%, rgba(124,58,237,0.18), transparent 60%), radial-gradient(50rem 35rem at 90% 30%, rgba(6,182,212,0.16), transparent 60%), radial-gradient(60rem 40rem at 50% 110%, rgba(244,114,182,0.14), transparent 60%)',
    orbs: [
      { top: '-10%', left: '-5%', size: '40rem', color: '#7C3AED', duration: 28 },
      { top: '20%',  right: '-10%', size: '36rem', color: '#06B6D4', duration: 34, reverse: true },
      { bottom: '-15%', left: '20%', size: '44rem', color: '#A855F7', duration: 40, delay: 4 },
    ],
  },
  warm: {
    base: 'radial-gradient(60rem 40rem at 10% 0%, rgba(244,114,182,0.20), transparent 60%), radial-gradient(50rem 35rem at 90% 30%, rgba(251,191,36,0.15), transparent 60%), radial-gradient(60rem 40rem at 50% 110%, rgba(168,85,247,0.14), transparent 60%)',
    orbs: [
      { top: '-10%', left: '0%', size: '36rem', color: '#F472B6', duration: 30 },
      { top: '10%',  right: '0%', size: '32rem', color: '#FBBF24', duration: 28, reverse: true },
      { bottom: '-10%', left: '30%', size: '40rem', color: '#A855F7', duration: 36, delay: 3 },
    ],
  },
  cool: {
    base: 'radial-gradient(60rem 40rem at 10% 0%, rgba(6,182,212,0.18), transparent 60%), radial-gradient(50rem 35rem at 90% 30%, rgba(56,189,248,0.16), transparent 60%), radial-gradient(60rem 40rem at 50% 110%, rgba(124,58,237,0.14), transparent 60%)',
    orbs: [
      { top: '-10%', left: '0%', size: '36rem', color: '#06B6D4', duration: 30 },
      { top: '10%',  right: '0%', size: '32rem', color: '#38BDF8', duration: 28, reverse: true },
      { bottom: '-10%', left: '30%', size: '40rem', color: '#7C3AED', duration: 36, delay: 3 },
    ],
  },
};
