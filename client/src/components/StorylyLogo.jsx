/**
 * Storyly brand mark + wordmark.
 *
 * <StorylyMark size={40} />          - icon only
 * <StorylyLogo size={40} showTag />  - icon + "Storyly" wordmark (+ optional tagline)
 *
 * Designed to read crisp at 16px through 64px. Uses the brand gradient
 * (peach → coral → fuchsia → violet) on a rounded square, with a custom
 * "S" path so it doesn't depend on a webfont being loaded.
 */
import { useEffect, useState } from 'react';

/**
 * Storyly mark — a polaroid sticker.
 *
 * In LIGHT mode the photo area is a sunset candy gradient (peach → pink
 * → lavender → violet); in DARK mode it flips to the same violet badge
 * gradient as the theme-toggle + primary CTA so the whole dark-mode
 * brand reads as one coordinated violet identity. The "S" inverts to
 * white on dark, deep violet on light.
 */
export function StorylyMark({ size = 40, className = '', idSuffix = '' }) {
  const seed       = idSuffix || Math.random().toString(36).slice(2, 8);
  const photoId    = `storyly-photo-${seed}`;
  const heartId    = `storyly-heart-${seed}`;
  const polaroidId = `storyly-polaroid-${seed}`;

  // Track the active theme so the photo gradient can swap between the
  // pastel sunset (light) and the violet badge (dark).
  const [isLight, setIsLight] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('light');
  });
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const read = () => setIsLight(document.documentElement.classList.contains('light'));
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  // Both modes use deep indigo for the "S" — dark text reads on both the
  // light pastel sunset AND the dulled dark lavender bubble, so the
  // brand glyph is consistent across themes.
  const sStrokeColor = '#1E1B4B';
  const sShadow = isLight
    ? 'drop-shadow(0 1px 1px rgba(255,255,255,0.65))'
    : 'drop-shadow(0 1px 1px rgba(255,255,255,0.45))';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={`storyly-mark ${className}`}
      aria-label="Storyly"
    >
      <defs>
        {isLight ? (
          <linearGradient id={photoId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#FED7AA" />
            <stop offset="35%"  stopColor="#FBCFE8" />
            <stop offset="70%"  stopColor="#DDD6FE" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
        ) : (
          /* Dark mode photo — dulled lavender → deep violet radial
             matching the buttons + theme-toggle. Deep indigo "S" sits
             on it cleanly. */
          <radialGradient id={photoId} cx="25%" cy="20%" r="110%">
            <stop offset="0%"   stopColor="#C4B5FD" />
            <stop offset="45%"  stopColor="#A78BFA" />
            <stop offset="80%"  stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </radialGradient>
        )}
        <linearGradient id={heartId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={polaroidId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      </defs>

      {/* Tilted polaroid stack — drop-shadow filter underneath for depth */}
      <g transform="rotate(-5 24 24)" filter="drop-shadow(0 2px 4px rgba(91,33,182,0.18))">
        {/* Polaroid backing (white card with rounded corners) */}
        <rect x="6" y="4" width="36" height="40" rx="4" fill={`url(#${polaroidId})`} stroke="#E2E8F0" strokeWidth="0.5" />

        {/* Photo area — candy gradient like a sunset capture */}
        <rect x="9" y="7" width="30" height="26" rx="2.5" fill={`url(#${photoId})`} />

        {/* Bold "S" — main brand mark, sitting prominently inside the
            photo so the logo reads as "Storyly" at a glance. Deep violet
            with a soft white drop-shadow so it pops on the pastel photo. */}
        <text
          x="24"
          y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Outfit', 'Inter', system-ui, sans-serif"
          fontWeight="800"
          fontSize="22"
          fill={sStrokeColor}
          style={{ letterSpacing: '-0.04em', filter: sShadow }}
        >S</text>

        {/* Mini heart sticker tucked into the bottom-right of the photo */}
        <g transform="translate(33 28) scale(0.20) translate(-24 -22)">
          <path
            d="M24 38 L8 22 Q3 16 8 11 Q13 6 18 11 L24 17 L30 11 Q35 6 40 11 Q45 16 40 22 Z"
            fill={`url(#${heartId})`}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        </g>

        {/* Caption strip — three dots like a doodle signature */}
        <circle cx="16" cy="39" r="0.9" fill="#CBD5E1" />
        <circle cx="20" cy="39" r="0.9" fill="#CBD5E1" />
        <circle cx="24" cy="39" r="0.9" fill="#CBD5E1" />
      </g>

      {/* Single sparkle popping out the top-right — playful corner accent */}
      <g className="storyly-mark-sparkle" style={{ transformOrigin: '41px 7px' }}>
        <path
          d="M41 3 L42.4 6.6 L46 8 L42.4 9.4 L41 13 L39.6 9.4 L36 8 L39.6 6.6 Z"
          fill="#FDE68A"
          stroke="#FFFFFF"
          strokeWidth="0.6"
        />
      </g>
    </svg>
  );
}

/**
 * Full lockup: mark + "Storyly" wordmark, with optional tagline.
 * Dark-mode aware via Tailwind `dark:` variants on the wordmark text.
 */
export function StorylyLogo({
  size = 40,
  showTag = false,
  className = '',
  taglineClassName = '',
  tag = 'make pages people remember',
}) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <StorylyMark size={size} />
      <span className="leading-tight">
        <span
          className="storyly-wordmark block font-display font-extrabold tracking-tight"
          style={{ fontSize: Math.max(13, Math.round(size * 0.42)) }}
        >
          Storyly
        </span>
        {showTag && (
          <span
            className={`storyly-tagline block -mt-0.5 ${taglineClassName}`}
            style={{ fontSize: Math.max(10, Math.round(size * 0.26)) }}
          >
            {tag}
          </span>
        )}
      </span>
    </span>
  );
}

export default StorylyLogo;
