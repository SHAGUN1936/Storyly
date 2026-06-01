import { BUILDER_FONT_OPTIONS, TEXT_EFFECT_PRESETS } from '../lib/visualTemplateBuilder';

/**
 * TextStudioPanel — Canva-style text styling for the selected text block.
 *
 * • Instagram-style FONT picker: a horizontal, scrollable row of chips, each
 *   rendered IN ITS OWN FONT so you preview before tapping (fonts are bundled
 *   via @fontsource so they always load). Tapping applies instantly.
 * • Text EFFECTS: gradient · neon · glow · shadow · outline · 3D · reflection
 *   (+ typewriter / blink animations). Each is a CSS effect applied live.
 * • Sliders: letter spacing, line height, font size, outline stroke width.
 *
 * Everything writes back through `onChange(patch)` (→ updateSelectedBlock →
 * builderState), so it's real-time AND persisted in the template JSON. No new
 * data shape — uses the existing block fields (fontFamily, textEffect,
 * textGradientFrom/To, strokeWidth, letterSpacingEm, lineHeight, fontSize,
 * color).
 */
function ColorField({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-slate-300">
      <span className="relative w-7 h-7 rounded-lg border border-white/15 overflow-hidden cursor-pointer shrink-0">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-[160%] h-[160%] -m-2 cursor-pointer" />
      </span>
      {label}
    </label>
  );
}

function Slider({ label, min, max, step, unit, value, def, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}: {Number(value).toFixed(step < 1 ? 2 : 0)}{unit}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
        <button type="button" title="Reset" onClick={() => onChange(def)}
          className="rounded bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] px-1.5 py-0.5">↺</button>
      </div>
    </div>
  );
}

export default function TextStudioPanel({ block, onChange }) {
  if (!block) return null;
  const ff = block.fontFamily || '';
  const fx = TEXT_EFFECT_PRESETS.some((e) => e.value === block.textEffect) ? block.textEffect : 'none';
  const usesColor1 = ['gradient', 'neon', 'glow', 'stroke'].includes(fx);
  const usesColor2 = ['gradient', 'neon', 'glow'].includes(fx);
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  return (
    <div className="space-y-4">
      {/* ── FONT (Instagram-style chips, each in its own font) ── */}
      <div>
        <label className="block text-[11px] font-semibold text-brand-300/90 mb-1.5">Aa Font</label>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1.5">
          {BUILDER_FONT_OPTIONS.map((f) => {
            const active = ff === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ fontFamily: f.value })}
                aria-pressed={active}
                className={`shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-1.5 min-w-[66px] whitespace-nowrap border transition ${active ? 'bg-brand-500 text-white border-brand-300 shadow' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}
              >
                <span style={{ fontFamily: f.value }} className="text-xl leading-none">Ag</span>
                <span className="text-[9px] leading-none opacity-80 font-sans">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EFFECT chips ── */}
      <div>
        <label className="block text-[11px] font-semibold text-brand-300/90 mb-1.5">Effect</label>
        <div className="flex flex-wrap gap-1.5">
          {TEXT_EFFECT_PRESETS.map((e) => {
            const active = fx === e.value;
            return (
              <button
                key={e.value}
                type="button"
                onClick={() => onChange({ textEffect: e.value })}
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition ${active ? 'bg-brand-500 text-white border-brand-300' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}
              >
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Effect colors (gradient / neon / glow / outline) */}
      {usesColor1 && (
        <div className="flex flex-wrap items-center gap-3">
          <ColorField label={usesColor2 ? 'Color 1' : 'Color'} value={block.textGradientFrom || '#f97316'} onChange={(v) => onChange({ textGradientFrom: v })} />
          {usesColor2 && <ColorField label="Color 2" value={block.textGradientTo || '#d946ef'} onChange={(v) => onChange({ textGradientTo: v })} />}
        </div>
      )}

      {/* Outline stroke width */}
      {fx === 'stroke' && (
        <Slider label="Stroke width" min={0.5} max={12} step={0.5} unit="px" def={2} value={num(block.strokeWidth, 2)} onChange={(v) => onChange({ strokeWidth: v })} />
      )}

      {/* Universal type controls */}
      <Slider label="Font size" min={8} max={160} step={1} unit="px" def={num(block.fontSize, 32)} value={num(block.fontSize, 32)} onChange={(v) => onChange({ fontSize: v })} />
      <Slider label="Letter spacing" min={-0.1} max={0.5} step={0.01} unit="em" def={0} value={num(block.letterSpacingEm, 0)} onChange={(v) => onChange({ letterSpacingEm: v })} />
      <Slider label="Line height" min={0.8} max={2.4} step={0.05} unit="" def={1.2} value={num(block.lineHeight, 1.2)} onChange={(v) => onChange({ lineHeight: v })} />

      {/* Plain text colour (hidden when gradient/outline drive the fill) */}
      {fx !== 'gradient' && fx !== 'stroke' && (
        <ColorField label="Text color" value={block.color || '#ffffff'} onChange={(v) => onChange({ color: v })} />
      )}
    </div>
  );
}
