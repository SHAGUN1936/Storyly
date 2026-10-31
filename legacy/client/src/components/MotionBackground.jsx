import { lazy, Suspense, useMemo } from 'react';
import { normalizeMotionBg } from '../lib/motionBackgrounds';

const ParticlesBg = lazy(() => import('./ParticlesBg'));

/**
 * MotionBackground — animated background layer rendered BEHIND the deck
 * content (editor + published page). Driven by `theme.motionBg` in the
 * template JSON. Pure CSS for every type except `particles` (tsParticles,
 * lazy-loaded). Always pointer-events:none and absolutely fills its parent
 * (parent must be position:relative). Honors prefers-reduced-motion.
 */
const DUR = { 1: '30s', 2: '18s', 3: '10s' }; // speed → animation duration

export default function MotionBackground({ config, className = '' }) {
  const cfg = useMemo(() => normalizeMotionBg(config), [config]);
  const { type, color1, color2, speed } = cfg;
  if (type === 'none') return null;

  const dur = DUR[speed] || DUR[2];
  const wrap = `absolute inset-0 overflow-hidden pointer-events-none ${className}`;

  // Deterministic positions (no randomness → stable across renders/SSR).
  const blobs = [
    { l: '12%', t: '18%', s: 220, d: '0s' },
    { l: '70%', t: '12%', s: 300, d: '-4s' },
    { l: '78%', t: '66%', s: 260, d: '-9s' },
    { l: '22%', t: '74%', s: 240, d: '-13s' },
    { l: '46%', t: '40%', s: 200, d: '-6s' },
  ];

  if (type === 'gradient') {
    return (
      <div className={wrap} aria-hidden>
        <div className="mbg-gradient mbg-anim" style={{ '--c1': color1, '--c2': color2, animationDuration: dur }} />
      </div>
    );
  }

  if (type === 'particles') {
    return (
      <div className={wrap} aria-hidden>
        <Suspense fallback={null}>
          <ParticlesBg color1={color1} color2={color2} speed={speed} />
        </Suspense>
      </div>
    );
  }

  if (type === 'shapes') {
    return (
      <div className={wrap} aria-hidden>
        {blobs.map((b, i) => (
          <span key={i} className="mbg-shape mbg-anim" style={{
            left: b.l, top: b.t, width: b.s, height: b.s,
            background: i % 2 ? color2 : color1,
            animationDuration: `calc(${dur} * ${0.7 + (i % 3) * 0.25})`, animationDelay: b.d,
          }} />
        ))}
      </div>
    );
  }

  if (type === 'smoke') {
    return (
      <div className={wrap} aria-hidden>
        {blobs.map((b, i) => (
          <span key={i} className="mbg-smoke mbg-anim" style={{
            left: b.l, top: b.t, width: b.s * 1.4, height: b.s * 1.4,
            background: i % 2 ? color2 : color1,
            animationDuration: `calc(${dur} * ${1 + (i % 3) * 0.3})`, animationDelay: b.d,
          }} />
        ))}
      </div>
    );
  }

  if (type === 'clouds') {
    return (
      <div className={wrap} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="mbg-cloud mbg-anim" style={{
            top: `${10 + i * 22}%`, width: 200 + (i % 2) * 120, height: 90 + (i % 2) * 30,
            animationDuration: `calc(${dur} * ${1.2 + i * 0.4})`, animationDelay: `${-i * 5}s`,
          }} />
        ))}
      </div>
    );
  }

  if (type === 'galaxy') {
    return (
      <div className={wrap} style={{ background: `radial-gradient(120% 120% at 50% 40%, ${color1}22, transparent 70%)` }} aria-hidden>
        <div className="mbg-stars mbg-anim" style={{ animationDuration: `calc(${dur} * 4)` }} />
        <div className="mbg-stars mbg-stars-2 mbg-anim" style={{ animationDuration: `calc(${dur} * 7)` }} />
        <div className="mbg-galaxy-core" style={{ background: `radial-gradient(circle, ${color2}33, transparent 60%)` }} />
      </div>
    );
  }

  if (type === 'waves') {
    return (
      <div className={wrap} aria-hidden>
        <svg className="mbg-waves" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path className="mbg-anim mbg-wave-a" fill={color1} fillOpacity="0.45" d="M0,160 C320,260 520,60 720,140 C920,220 1120,80 1440,160 L1440,320 L0,320 Z" style={{ animationDuration: dur }} />
          <path className="mbg-anim mbg-wave-b" fill={color2} fillOpacity="0.40" d="M0,200 C300,120 560,280 760,200 C1000,110 1180,250 1440,190 L1440,320 L0,320 Z" style={{ animationDuration: `calc(${dur} * 1.5)` }} />
        </svg>
      </div>
    );
  }

  if (type === 'light') {
    return (
      <div className={wrap} aria-hidden>
        <div className="mbg-light mbg-anim" style={{ '--c1': color1, '--c2': color2, animationDuration: `calc(${dur} * 1.4)` }} />
      </div>
    );
  }

  return null;
}
