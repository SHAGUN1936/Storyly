import { BUTTON_VARIANT_PRESETS } from '../lib/visualTemplateBuilder';

/**
 * ButtonStudioPanel — Canva-style styling for a button block.
 *
 * Style variants (solid / outline / gradient / ghost), fill + text colors
 * (+ a 2nd gradient color), corner radius, and padding (size). The button's
 * FONT is set from the same "Aa" font bar used for text. Everything writes
 * through onChange(patch) → updateSelectedBlock → builderState, so it's live
 * and stored in the template JSON (buttonVariant / buttonBg / buttonBg2 /
 * buttonText / buttonRadius / paddingX / paddingY / fontFamily).
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
function Slider({ label, min, max, step = 1, unit, value, def, onChange }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}: {Math.round(value)}{unit}</label>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
        <button type="button" title="Reset" onClick={() => onChange(def)}
          className="rounded bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] px-1.5 py-0.5">↺</button>
      </div>
    </div>
  );
}

export default function ButtonStudioPanel({ block, onChange }) {
  if (!block) return null;
  const variant = BUTTON_VARIANT_PRESETS.some((v) => v.value === block.buttonVariant) ? block.buttonVariant : 'solid';
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-semibold text-brand-300/90 mb-1.5">Button style</label>
        <div className="flex flex-wrap gap-1.5">
          {BUTTON_VARIANT_PRESETS.map((v) => {
            const active = variant === v.value;
            return (
              <button
                key={v.value}
                type="button"
                onClick={() => onChange({ buttonVariant: v.value })}
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition ${active ? 'bg-brand-500 text-white border-brand-300' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}
              >{v.label}</button>
            );
          })}
        </div>
      </div>

      {/* Quick SHAPE presets (set corner radius) */}
      <div>
        <label className="block text-[11px] font-semibold text-brand-300/90 mb-1.5">Shape</label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: 'Square', r: 0 },
            { label: 'Rounded', r: 14 },
            { label: 'Pill', r: 999 },
          ].map((s) => {
            const active = num(block.buttonRadius, 24) === s.r;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => onChange({ buttonRadius: s.r })}
                aria-pressed={active}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold border transition ${active ? 'bg-brand-500 text-white border-brand-300' : 'bg-slate-800 text-white border-white/15 hover:bg-slate-700'}`}
              >{s.label}</button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ColorField label={variant === 'gradient' ? 'Fill 1' : variant === 'outline' || variant === 'ghost' ? 'Accent' : 'Fill'} value={block.buttonBg || '#ffffff'} onChange={(v) => onChange({ buttonBg: v })} />
        {variant === 'gradient' && <ColorField label="Fill 2" value={block.buttonBg2 || '#7c3aed'} onChange={(v) => onChange({ buttonBg2: v })} />}
        <ColorField label="Text" value={block.buttonText || '#0b0f19'} onChange={(v) => onChange({ buttonText: v })} />
      </div>

      <Slider label="Corner radius" min={0} max={999} unit="px" def={24} value={num(block.buttonRadius, 24)} onChange={(v) => onChange({ buttonRadius: v })} />
      <Slider label="Padding X" min={0} max={80} unit="px" def={20} value={num(block.paddingX, 20)} onChange={(v) => onChange({ paddingX: v })} />
      <Slider label="Padding Y" min={0} max={48} unit="px" def={12} value={num(block.paddingY, 12)} onChange={(v) => onChange({ paddingY: v })} />

      <p className="text-[10px] text-slate-500">Tip: set the button’s font with the “Aa” bar (tap Aa in the toolbar).</p>
    </div>
  );
}
