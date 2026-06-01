import { useState } from 'react';

/**
 * Password input with a built-in show/hide eye toggle.
 *
 * Drop-in replacement for `<input type="password" ... />`. Same props
 * (value, onChange, placeholder, required, minLength, className) — the
 * component renders the input + an eye button positioned to its right.
 *
 * Forwards any additional props through to the underlying <input>.
 */
export default function PasswordField({
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  className = '',
  autoComplete = 'current-password',
  ...rest
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        // Add right padding so the toggle button doesn't overlap typed text
        className={`${className} !pr-12`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        data-tooltip={visible ? 'Hide password' : 'Show password'}
        data-tooltip-pos="top"
        data-tooltip-align="end"
        /* `!absolute` (position:absolute !important) is required because the
           `data-tooltip` attribute matches `[data-tooltip]{position:relative}`
           in index.css, which has equal specificity to `.absolute` but is
           declared later — so without !important it wins and the eye button
           falls out of the field (renders left + below instead of pinned to
           the field's right edge). */
        className="!absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-90 transition"
        // Don't steal tab focus inside the form flow
        tabIndex={-1}
      >
        {visible ? (
          // Eye-off icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          // Eye icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
