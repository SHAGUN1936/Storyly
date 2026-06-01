import { BUILDER_FONT_OPTIONS } from '../lib/visualTemplateBuilder';

/**
 * FontBar — an Instagram-story–style font picker that slides up from the
 * bottom of the editor. A single horizontal, scrollable row of pill chips,
 * each rendered IN ITS OWN FONT so you preview before tapping. Tapping applies
 * instantly (live) and keeps the bar open so you can try several; the active
 * font is highlighted. Reachable straight from the contextual bar — no need to
 * open the side properties panel.
 *
 * Fonts are bundled (@fontsource), so the chips always render in their real
 * typeface. Purely presentational — state + persistence live in the parent.
 */
export default function FontBar({ open, value, onPick, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl m-2 rounded-2xl border border-white/12 bg-slate-950/95 backdrop-blur-xl shadow-[0_-10px_40px_-12px_rgba(0,0,0,0.7)]">
        <div className="flex items-center gap-2 px-3 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/90">Aa Fonts</span>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fonts"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition"
          >✕</button>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-2.5">
          {BUILDER_FONT_OPTIONS.map((f) => {
            const active = value === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onPick(f.value)}
                aria-pressed={active}
                className={`shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-4 py-2 min-w-[78px] whitespace-nowrap border transition ${
                  active
                    ? 'bg-brand-500 text-white border-brand-300 shadow-lg'
                    : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'
                }`}
              >
                {/* Big sample IN the font (white = always legible, even for
                    thin/script faces) + the name in a readable base font. */}
                <span style={{ fontFamily: f.value }} className="text-2xl leading-none">Ag</span>
                <span className="text-[10px] leading-none opacity-80 font-sans">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
