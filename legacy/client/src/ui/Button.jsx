import { forwardRef } from 'react';
import { motion } from 'framer-motion';

/**
 * The single canonical button for the whole app.
 *
 *   <Button>Save</Button>                         // primary candy
 *   <Button variant="ghost">Cancel</Button>       // outline glass
 *   <Button variant="mint">Confirm</Button>       // teal success
 *   <Button variant="honey">Free forever</Button> // buttercup
 *   <Button size="lg" icon={<Sparkles size={16}/>}>Share your story</Button>
 *   <Button as="a" href="/foo">Link button</Button>
 *   <Button loading>Saving…</Button>
 *
 * Notes:
 *  • All variants share the same magnetic-halo shell (`btn-magnet`) so
 *    the cursor-tracking glow works everywhere.
 *  • Press feedback is a unified `whileTap: scale(0.97)`.
 *  • `loading` shows a spinner and disables the click target.
 *  • Forwards refs so framer-motion / anchor wrappers can still grab it.
 */
const VARIANT_CLASS = {
  primary: 'btn-glow',
  candy:   'btn-candy',
  ghost:   'btn-ghost',
  mint:    'btn-mint',
  honey:   'btn-honey',
  soft:    'btn-pill-soft',
  dark:    'btn-pill-dark',
  bubble:  'btn-bubble',
};

const SIZE_CLASS = {
  xs: '!py-1.5 !px-3 !text-[11px]',
  sm: '!py-2 !px-4 !text-xs',
  md: '', // base styles from the variant class
  lg: '!py-3.5 !px-6 !text-base',
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    as: Tag = 'button',
    icon,
    iconRight,
    loading = false,
    disabled = false,
    type,
    className = '',
    onMouseMove,
    ...rest
  },
  ref,
) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  const sizeClass    = SIZE_CLASS[size] || '';
  const MotionTag    = motion[Tag] || motion.button;
  const isDisabled   = disabled || loading;

  // Track cursor position for the magnetic halo (no element translation).
  const handleMove = (e) => {
    const el = e.currentTarget;
    if (el && el.style) {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      el.style.setProperty('--mx', `${(relX / rect.width) * 100}%`);
      el.style.setProperty('--my', `${(relY / rect.height) * 100}%`);
    }
    onMouseMove?.(e);
  };

  return (
    <MotionTag
      ref={ref}
      type={Tag === 'button' ? (type || 'button') : undefined}
      onMouseMove={handleMove}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      disabled={Tag === 'button' && isDisabled ? true : undefined}
      aria-disabled={isDisabled || undefined}
      className={`btn-magnet ${variantClass} ${sizeClass} ${className} ${isDisabled ? 'opacity-60 pointer-events-none' : ''}`.trim()}
      {...rest}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" />
          <span>Please wait…</span>
        </span>
      ) : (
        <>
          {icon ? <span className="inline-flex items-center shrink-0">{icon}</span> : null}
          <span>{children}</span>
          {iconRight ? <span className="inline-flex items-center shrink-0">{iconRight}</span> : null}
        </>
      )}
    </MotionTag>
  );
});

export default Button;
