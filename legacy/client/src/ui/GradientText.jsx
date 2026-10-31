/**
 * Gradient text — animated rainbow shift. Choose a preset gradient.
 */
export default function GradientText({
  children,
  variant = 'cosmic',
  className = '',
  as: Tag = 'span',
  animate = true,
}) {
  const cls =
    variant === 'warm' ? 'gradient-text-warm'
    : variant === 'soft' ? 'gradient-text-soft'
    : 'gradient-text';
  return (
    <Tag className={`${cls} ${animate ? 'animate-gradient' : ''} ${className}`}>
      {children}
    </Tag>
  );
}
