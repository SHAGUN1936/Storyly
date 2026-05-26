/** Shared Tailwind classes for inputs/selects (keep visually consistent app-wide). */
export const APP_SELECT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 shadow-sm cursor-pointer hover:border-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 [&>option]:bg-white [&>option]:text-slate-900';

export const APP_INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25';

export const APP_TEXTAREA_CLASS =
  'w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 resize-y';

/** Bigger, rounder variants for hero forms (login/signup, template detail). */
export const APP_INPUT_BIG =
  'w-full px-5 py-3.5 rounded-3xl bg-white border border-slate-200 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 transition';

/**
 * For inputs/selects rendered on a DARK background (admin builder shell). These
 * intentionally DO NOT set a `text-*` or `bg-*` color so they don't collide with
 * the surrounding `text-white` / `bg-slate-900` set at the call site.
 */
export const DARK_INPUT_CLASS =
  'placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/30';

export const DARK_SELECT_CLASS =
  'cursor-pointer hover:border-brand-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/30 [&>option]:bg-slate-900 [&>option]:text-white';
