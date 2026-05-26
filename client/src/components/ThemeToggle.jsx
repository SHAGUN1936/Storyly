import { useState, useEffect } from 'react';

/**
 * Light / dark mode toggle.
 * Reads / writes `localStorage('storyly-theme')` and toggles `html.dark`.
 * Initial value: stored preference → system preference → light.
 */
export default function ThemeToggle({ className = '' }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem('storyly-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('storyly-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`w-10 h-10 rounded-full bg-white/90 dark:bg-white/10 border border-slate-200 dark:border-white/15 flex items-center justify-center hover:bg-white dark:hover:bg-white/20 transition active:scale-90 shadow-sm backdrop-blur ${className}`}
    >
      <span className="text-base leading-none" style={{ color: dark ? '#ffffff' : '#0f172a' }}>
        {dark ? '☀' : '🌙'}
      </span>
    </button>
  );
}
