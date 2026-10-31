/**
 * Legacy export — kept so existing imports compile.
 *
 *   import MagneticButton from '../ui/MagneticButton';
 *
 * The single canonical button now lives in `Button.jsx`. New code should
 * import that directly:
 *
 *   import Button from '../ui/Button';
 *
 * The `variant="glow"` prop is mapped to the new `variant="primary"`
 * for backward compatibility.
 */
import Button from './Button';

export default function MagneticButton({ variant = 'glow', ...rest }) {
  // Old API used `variant="glow"` for the primary CTA. Map it.
  const normalized = variant === 'glow' ? 'primary' : variant;
  return <Button variant={normalized} {...rest} />;
}
