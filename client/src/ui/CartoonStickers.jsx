/**
 * Cartoon-style animated SVG stickers. Each one is a small inline
 * illustration that self-animates (sway, pulse, spin, flicker, etc.).
 * Drop them anywhere as React components, set size via the `size` prop.
 *
 * Use STICKER_LIBRARY (array of components) to randomly sprinkle them.
 */

const baseProps = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 64 64',
  xmlns: 'http://www.w3.org/2000/svg',
  className: 'overflow-visible',
});

// ── 1. Balloon ─────────────────────────────────────────────────
export function BalloonSticker({ size = 56, color = '#F472B6' }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 6px 16px rgba(244,114,182,0.5))' }}>
      <g style={{ transformOrigin: '32px 24px', animation: 'cartoonSway 5s ease-in-out infinite' }}>
        <ellipse cx="32" cy="24" rx="16" ry="20" fill={color} />
        <ellipse cx="26" cy="18" rx="4" ry="6" fill="#fff" opacity="0.45" />
        <path d="M30 44 L34 44 L32 50 Z" fill={color} />
        <path d="M32 50 Q34 56 30 60 Q32 64 32 64" stroke="#94A3B8" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}

// ── 2. Birthday cake ──────────────────────────────────────────
export function CakeSticker({ size = 56 }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 6px 16px rgba(168,85,247,0.45))' }}>
      <g style={{ transformOrigin: '32px 32px', animation: 'cartoonBob 4.5s ease-in-out infinite' }}>
        <rect x="10" y="34" width="44" height="22" rx="4" fill="#A855F7" />
        <rect x="10" y="34" width="44" height="6" fill="#F472B6" />
        <circle cx="20" cy="34" r="3" fill="#FBBF24" />
        <circle cx="32" cy="34" r="3" fill="#22D3EE" />
        <circle cx="44" cy="34" r="3" fill="#34D399" />
        <rect x="30" y="20" width="4" height="14" fill="#FBBF24" />
        <path
          d="M32 8 Q28 14 32 20 Q36 14 32 8 Z"
          fill="#F97316"
          style={{ transformOrigin: '32px 18px', animation: 'cartoonFlicker 0.4s ease-in-out infinite' }}
        />
      </g>
    </svg>
  );
}

// ── 3. Heart pulse ─────────────────────────────────────────────
export function HeartSticker({ size = 48, color = '#F43F5E' }) {
  return (
    <svg {...baseProps(size)} style={{ filter: `drop-shadow(0 6px 18px ${color}80)` }}>
      <g style={{ transformOrigin: '32px 36px', animation: 'cartoonPulse 1.6s ease-in-out infinite' }}>
        <path
          d="M32 56 L10 34 Q4 26 10 18 Q16 12 24 18 L32 24 L40 18 Q48 12 54 18 Q60 26 54 34 Z"
          fill={color}
        />
        <ellipse cx="22" cy="22" rx="4" ry="3" fill="#fff" opacity="0.5" />
      </g>
    </svg>
  );
}

// ── 4. Diamond ring ────────────────────────────────────────────
export function RingSticker({ size = 56 }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 6px 18px rgba(34,211,238,0.55))' }}>
      <g style={{ transformOrigin: '32px 38px', animation: 'cartoonSway 6s ease-in-out infinite' }}>
        <circle cx="32" cy="42" r="16" fill="none" stroke="#FBBF24" strokeWidth="3.5" />
        <path d="M22 22 L32 6 L42 22 L32 30 Z" fill="#22D3EE" stroke="#FFFFFF" strokeWidth="1.5" />
        <path d="M32 6 L32 30" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
      </g>
      <g style={{ transformOrigin: '32px 14px', animation: 'cartoonSparkle 2s ease-in-out infinite' }}>
        <path d="M50 10 L52 14 L56 16 L52 18 L50 22 L48 18 L44 16 L48 14 Z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

// ── 5. Confetti burst ──────────────────────────────────────────
export function ConfettiSticker({ size = 56 }) {
  const colors = ['#F472B6', '#A855F7', '#22D3EE', '#FBBF24', '#34D399'];
  return (
    <svg {...baseProps(size)}>
      <g style={{ transformOrigin: '32px 32px', animation: 'cartoonSpin 8s linear infinite' }}>
        {colors.map((c, i) => {
          const angle = (i / colors.length) * Math.PI * 2;
          const r = 22;
          const cx = 32 + Math.cos(angle) * r;
          const cy = 32 + Math.sin(angle) * r;
          return (
            <rect
              key={i}
              x={cx - 3} y={cy - 6} width="6" height="12" rx="2"
              fill={c}
              transform={`rotate(${(angle * 180) / Math.PI + 90} ${cx} ${cy})`}
            />
          );
        })}
        <circle cx="32" cy="32" r="4" fill="#FFFFFF" opacity="0.8" />
      </g>
    </svg>
  );
}

// ── 6. Sparkle star ────────────────────────────────────────────
export function StarSticker({ size = 48 }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 0 18px rgba(251,191,36,0.7))' }}>
      <g style={{ transformOrigin: '32px 32px', animation: 'cartoonPulse 2.6s ease-in-out infinite' }}>
        <path
          d="M32 4 L40 24 L60 28 L46 42 L50 60 L32 50 L14 60 L18 42 L4 28 L24 24 Z"
          fill="#FBBF24"
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <circle cx="26" cy="26" r="3" fill="#FFFFFF" opacity="0.55" />
      </g>
    </svg>
  );
}

// ── 7. Disco ball ──────────────────────────────────────────────
export function DiscoSticker({ size = 56 }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 6px 18px rgba(168,85,247,0.55))' }}>
      <g style={{ transformOrigin: '32px 34px', animation: 'cartoonSpin 5s linear infinite' }}>
        <circle cx="32" cy="34" r="20" fill="url(#discoGrad)" />
        <defs>
          <radialGradient id="discoGrad" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#F0ABFC" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#4C1D95" />
          </radialGradient>
        </defs>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={32 + Math.cos(a) * 6}
              y1={34 + Math.sin(a) * 6}
              x2={32 + Math.cos(a) * 18}
              y2={34 + Math.sin(a) * 18}
              stroke="#FFFFFF"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          );
        })}
        <line x1="32" y1="14" x2="32" y2="4" stroke="#94A3B8" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

// ── 8. Music note ──────────────────────────────────────────────
export function MusicSticker({ size = 48, color = '#22D3EE' }) {
  return (
    <svg {...baseProps(size)} style={{ filter: `drop-shadow(0 6px 18px ${color}80)` }}>
      <g style={{ transformOrigin: '32px 32px', animation: 'cartoonBob 3s ease-in-out infinite' }}>
        <path d="M28 12 L28 44 Q28 50 22 50 Q16 50 16 44 Q16 38 22 38 Q24 38 26 39 L26 18 L52 14 L52 42 Q52 48 46 48 Q40 48 40 42 Q40 36 46 36 Q48 36 50 37" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="22" cy="44" rx="5" ry="3.5" fill={color} />
        <ellipse cx="46" cy="42" rx="5" ry="3.5" fill={color} />
      </g>
    </svg>
  );
}

// ── 9. Gift box ────────────────────────────────────────────────
export function GiftSticker({ size = 56 }) {
  return (
    <svg {...baseProps(size)} style={{ filter: 'drop-shadow(0 6px 18px rgba(244,114,182,0.55))' }}>
      <g style={{ transformOrigin: '32px 36px', animation: 'cartoonBob 4s ease-in-out infinite' }}>
        <rect x="8" y="26" width="48" height="30" rx="3" fill="#F472B6" />
        <rect x="8" y="26" width="48" height="6" fill="#A855F7" />
        <rect x="28" y="26" width="8" height="30" fill="#FBBF24" />
        <path d="M28 26 Q22 16 14 18 Q18 22 28 26 Z" fill="#FBBF24" />
        <path d="M36 26 Q42 16 50 18 Q46 22 36 26 Z" fill="#FBBF24" />
        <circle cx="32" cy="24" r="3" fill="#FBBF24" />
      </g>
    </svg>
  );
}

// ── 10. Speech bubble (chat / RSVP feel) ──────────────────────
export function ChatSticker({ size = 52, color = '#22D3EE' }) {
  return (
    <svg {...baseProps(size)} style={{ filter: `drop-shadow(0 6px 18px ${color}55)` }}>
      <g style={{ transformOrigin: '32px 28px', animation: 'cartoonBob 3.5s ease-in-out infinite' }}>
        <path
          d="M8 16 Q8 8 16 8 L48 8 Q56 8 56 16 L56 36 Q56 44 48 44 L28 44 L18 54 L20 44 L16 44 Q8 44 8 36 Z"
          fill={color}
        />
        <circle cx="22" cy="26" r="2.5" fill="#FFFFFF" />
        <circle cx="32" cy="26" r="2.5" fill="#FFFFFF" />
        <circle cx="42" cy="26" r="2.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

/** All exported stickers, for randomization. */
export const STICKER_LIBRARY = [
  BalloonSticker,
  CakeSticker,
  HeartSticker,
  RingSticker,
  ConfettiSticker,
  StarSticker,
  DiscoSticker,
  MusicSticker,
  GiftSticker,
  ChatSticker,
];
