import { useMemo, useState } from 'react';
import { TYPOGRAPHY_PRESETS, TYPOGRAPHY_CATEGORIES, RESET_PATCH } from '../lib/typographyPresets';

/* Inline CSS that approximates `textEffectStyle` so each chip previews itself. */
function previewStyle(p) {
  const s = { fontFamily: p.fontFamily, fontWeight: p.fontWeight || 600, lineHeight: 1.15, whiteSpace: 'nowrap' };
  if (p.letterSpacingEm != null) s.letterSpacing = `${p.letterSpacingEm}em`;
  if (p.textTransform && p.textTransform !== 'none') s.textTransform = p.textTransform;
  const c1 = p.textGradientFrom || '#fff';
  const c2 = p.textGradientTo || c1;
  switch (p.textEffect) {
    case 'gradient':
      Object.assign(s, { backgroundImage: `linear-gradient(120deg,${c1},${c2})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', WebkitTextFillColor: 'transparent' });
      break;
    case 'neon':
      Object.assign(s, { color: c1, textShadow: `0 0 4px #fff,0 0 8px ${c1},0 0 16px ${c2}` });
      break;
    case 'glow':
      Object.assign(s, { color: p.color || '#fff', textShadow: `0 0 10px ${c1},0 0 20px ${c2}` });
      break;
    case 'shadow':
      Object.assign(s, { color: p.color || '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.5)' });
      break;
    case '3d':
      Object.assign(s, { color: p.color || '#fff', textShadow: '1px 1px 0 rgba(0,0,0,.25),2px 2px 0 rgba(0,0,0,.2),3px 3px 0 rgba(0,0,0,.16)' });
      break;
    case 'stroke':
      Object.assign(s, { color: 'transparent', WebkitTextStroke: `1px ${c1}` });
      break;
    default:
      s.color = p.color || '#fff';
  }
  return s;
}

/**
 * TypographyPresetsPanel — 100 one-click type looks across 9 categories.
 * `onApply(patch)` merges the preset over RESET_PATCH (clears any stale
 * effect/tracking) and writes it to the selected text block.
 */
export default function TypographyPresetsPanel({ onApply }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState('Luxury');

  const list = useMemo(() => TYPOGRAPHY_PRESETS.filter((p) => p.category === cat), [cat]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-[12px] font-bold text-slate-100"
      >
        <span>✨ Typography presets <span className="font-normal text-slate-500">· 100 one-tap looks</span></span>
        <span className="text-slate-400">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="px-2 pb-2">
          {/* Category filter */}
          <div className="mb-2 flex flex-wrap gap-1">
            {TYPOGRAPHY_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                  cat === c ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >{c}</button>
            ))}
          </div>

          {/* Preset chips — each rendered in its own style */}
          <div className="max-h-[280px] space-y-1.5 overflow-y-auto pr-1">
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApply?.({ ...RESET_PATCH, ...p.patch })}
                title={`Apply “${p.label}”`}
                className="group flex w-full items-center justify-between gap-2 overflow-hidden rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2.5 text-left transition hover:border-brand-400 hover:bg-slate-900 active:scale-[0.99]"
              >
                <span className="min-w-0 flex-1 truncate text-[17px]" style={previewStyle(p.patch)}>{p.label}</span>
                <span className="shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300 opacity-0 transition group-hover:opacity-100">Apply</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
