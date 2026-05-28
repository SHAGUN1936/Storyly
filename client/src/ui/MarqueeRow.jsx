/**
 * Infinite horizontal marquee — duplicates children so the row scrolls
 * seamlessly. Used for trending templates, social proof, etc.
 *
 * Props:
 *  - direction: 'left' | 'right'
 *  - speed: 'slow' | 'normal'
 *  - pauseOnHover
 */
export default function MarqueeRow({
  children,
  direction = 'left',
  speed = 'normal',
  pauseOnHover = true,
  className = '',
}) {
  const animClass = speed === 'slow' ? 'animate-marquee-slow' : 'animate-marquee';
  const reverse = direction === 'right' ? 'reverse' : 'normal';
  return (
    <div className={`marquee-mask overflow-hidden ${className}`}>
      <div
        className={`flex gap-6 w-max ${animClass}`}
        style={{
          animationDirection: reverse,
          animationPlayState: 'running',
        }}
        onMouseEnter={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'paused')}
        onMouseLeave={(e) => pauseOnHover && (e.currentTarget.style.animationPlayState = 'running')}
      >
        <div className="flex gap-6 shrink-0">{children}</div>
        <div className="flex gap-6 shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
