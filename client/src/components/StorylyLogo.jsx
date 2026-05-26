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
export function StorylyMark({ size = 40, className = '', idSuffix = '' }) {
  // Unique gradient IDs prevent collisions when multiple marks render on one page.
  const gradId = `storyly-grad-${idSuffix || Math.random().toString(36).slice(2, 8)}`;
  const shineId = `storyly-shine-${idSuffix || Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Storyly"
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="2" x2="46" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="38%" stopColor="#f43f5e" />
          <stop offset="72%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded square with brand gradient */}
      <rect width="48" height="48" rx="13" fill={`url(#${gradId})`} />
      {/* Subtle top shine for depth */}
      <rect width="48" height="48" rx="13" fill={`url(#${shineId})`} />
      {/* Soft inner border ring */}
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="12.25" fill="none" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="0.75" />

      {/* Bold "S" — handcrafted path, no webfont dependency */}
      <path
        d="M 33 17 C 31.6 14 28.1 12.2 23.8 12.2 C 18.3 12.2 14.2 15.2 14.2 19.6 C 14.2 24 17.6 25.5 22.8 26.4 C 26.7 27 28.5 27.7 28.5 29.5 C 28.5 31.3 26.6 32.2 23.7 32.2 C 20 32.2 16.9 30.6 15 28.2 L 12.6 31.2 C 15.2 34.2 19.1 35.8 23.8 35.8 C 29.9 35.8 33.7 33 33.7 28.4 C 33.7 23.7 30.2 22.3 24.9 21.5 C 21.1 20.9 19.3 20.2 19.3 18.8 C 19.3 17.1 21.1 16.3 23.7 16.3 C 26.5 16.3 28.7 17.4 30.3 19.3 L 33 17 Z"
        fill="#ffffff"
      />

      {/* Tiny Instagram-story-style indicator dot */}
      <circle cx="40" cy="9" r="3.5" fill="#ffffff" />
      <circle cx="40" cy="9" r="2" fill="#f43f5e" />
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
