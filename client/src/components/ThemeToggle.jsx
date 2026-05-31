import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Light / dark toggle. DARK is the default theme; toggling switches to light.
 * Persists choice in `localStorage('storyly-theme')` and toggles `html.light`.
 * The boot script in index.html reads the same key pre-paint to avoid flash.
 *
 * Style: a soft pastel chip that signals the *current* theme — indigo/violet
 * moon for dark, peach/pink sun for light. No translate on hover (the topbar
 * had a "bubbling" feel before); just a tiny halo + icon spin on click.
 */
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem('storyly-theme');
      if (saved === 'light') return false;
      if (saved === 'dark') return true;
    } catch {}
    return true; // default dark
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }
    try { localStorage.setItem('storyly-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  // Dark = night-sky lavender; Light = sunrise pastel (yellow → pink →
  // lavender). Both pull from the candy palette so the toggle reads as
  // a coordinated little sticker, not a generic icon button.
  const darkStyle = {
    background:
      'radial-gradient(130% 110% at 25% 20%, #C4B5FD 0%, #A78BFA 45%, #8B5CF6 80%, #6D28D9 100%)',
    borderColor: 'rgba(255,255,255,0.35)',
    boxShadow:
      '0 10px 24px -10px rgba(91,33,182,0.65), 0 0 0 1px rgba(124,58,237,0.30), inset 0 1px 0 rgba(255,255,255,0.35)',
    color: '#F1F5F9',
  };
  const lightStyle = {
    /* Same mesh gradient as the light btn-glow — peach pool bottom-left,
       violet pool top-right, soft pink-lavender base — so the toggle
       reads as the same painterly candy sticker as the buttons. */
    background:
      'radial-gradient(70% 90% at 0% 100%, #FED7AA 0%, rgba(254,215,170,0) 60%),' +
      'radial-gradient(75% 95% at 100% 0%, #C4B5FD 0%, rgba(196,181,253,0) 60%),' +
      'linear-gradient(115deg, #FBCFE8 0%, #EDE9FE 50%, #DDD6FE 100%)',
    borderColor: 'rgba(139,92,246,0.40)',
    boxShadow:
      '0 10px 24px -10px rgba(244,114,182,0.40), 0 0 0 1px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.90)',
    color: '#0F172A',
  };

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      data-tooltip={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-tooltip-align="end"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`theme-toggle relative w-10 h-10 rounded-full flex items-center justify-center border transition-[box-shadow,transform] duration-200 ease-out active:scale-90 ${className}`}
      style={dark ? darkStyle : lightStyle}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -120, scale: 0.6, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 120, scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
          className="relative text-base leading-none font-bold pointer-events-none"
        >
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <line x1="12" y1="3"  x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="21" />
              <line x1="3"  y1="12" x2="5"  y2="12" />
              <line x1="19" y1="12" x2="21" y2="12" />
              <line x1="5.6" y1="5.6" x2="7" y2="7" />
              <line x1="17" y1="17" x2="18.4" y2="18.4" />
              <line x1="5.6" y1="18.4" x2="7" y2="17" />
              <line x1="17" y1="7" x2="18.4" y2="5.6" />
            </svg>
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
