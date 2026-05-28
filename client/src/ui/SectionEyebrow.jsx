/**
 * Small uppercase eyebrow label with a glowing neon dot.
 */
export default function SectionEyebrow({ children, className = '' }) {
  return (
    <span className={`eyebrow ${className}`}>
      <span>{children}</span>
    </span>
  );
}
