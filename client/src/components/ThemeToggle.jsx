import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Light / dark toggle. DARK is the default theme; toggling switches to light.
 * Persists choice in `localStorage('storyly-theme')` and toggles `html.light`.
 * The boot script in index.html reads the same key pre-paint to avoid flash.
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

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-10 h-10 rounded-full flex items-center justify-center transition active:scale-90 bg-white/5 border border-white/10 hover:border-white/25 hover:bg-white/10 backdrop-blur overflow-hidden ${className}`}
    >
      <span
        className="absolute inset-0 opacity-0 hover:opacity-100 transition"
        style={{ background: 'radial-gradient(circle at center, rgba(168,85,247,0.30), transparent 60%)' }}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative text-base leading-none"
          style={{ color: dark ? '#FFFFFF' : '#0B0F19' }}
        >
          {dark ? '☾' : '☀'}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
