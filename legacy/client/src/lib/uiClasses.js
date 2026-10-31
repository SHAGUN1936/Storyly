/**
 * Shared Tailwind classes — premium dark-luxury (default) with optional
 * light-mode flips. Existing components import these so changing them
 * here cascades visual polish app-wide.
 */
export const APP_SELECT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 shadow-sm cursor-pointer hover:border-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 [&>option]:bg-ink-900 [&>option]:text-slate-100';

export const APP_INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30';

export const APP_TEXTAREA_CLASS =
  'w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-y';

/** Bigger, rounder hero forms (login/signup, template detail). */
export const APP_INPUT_BIG =
  'w-full px-5 py-4 rounded-3xl bg-white/5 border border-white/10 text-base text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition backdrop-blur';

/**
 * Inputs on DARK surfaces (admin builder shell) — intentionally NO bg/text
 * tokens so they don't conflict with surrounding text-white/bg-slate-900.
 */
export const DARK_INPUT_CLASS =
  'placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/30';

export const DARK_SELECT_CLASS =
  'cursor-pointer hover:border-brand-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/30 [&>option]:bg-ink-900 [&>option]:text-white';
