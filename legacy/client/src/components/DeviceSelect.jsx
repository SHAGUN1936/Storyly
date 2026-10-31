import { useState, useRef, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, ChevronDown, Check } from 'lucide-react';

const ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
const LABELS = { mobile: 'Mobile', tablet: 'Tablet', desktop: 'Desktop' };

/**
 * Themed device picker (custom dropdown — native <select> can't match the
 * glass/candy UI). Used in the admin editor and the template preview so
 * the user can switch which device they're designing / viewing.
 *
 * Props:
 *  - value:    'mobile' | 'tablet' | 'desktop'
 *  - options:  array of device keys (default all three)
 *  - onChange: (key) => void
 *  - size:     'sm' (toolbar) | 'md' (preview)
 *  - align:    'left' | 'right' | 'center'  — menu alignment
 */
export default function DeviceSelect({
  value,
  options = ['mobile', 'tablet', 'desktop'],
  onChange,
  size = 'sm',
  align = 'left',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const CurIcon = ICONS[value] || Monitor;
  const trigger =
    size === 'md'
      ? 'gap-2 px-4 py-2.5 text-sm'
      : 'gap-1.5 px-3 py-2 text-xs';
  const menuAlign =
    align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose device"
        className={`inline-flex items-center ${trigger} rounded-xl bg-white/[0.07] border border-white/15 font-bold text-slate-100 hover:bg-white/[0.13] hover:border-white/25 focus:outline-none focus:border-brand-400 transition`}
      >
        <span className="text-brand-300"><CurIcon size={size === 'md' ? 16 : 14} strokeWidth={2.4} /></span>
        <span>{LABELS[value] || 'Device'}</span>
        <ChevronDown size={size === 'md' ? 15 : 13} strokeWidth={2.6} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          /* `keep-dark` + an inline dark background keep the menu legible in
             BOTH themes: in light mode the global rules would otherwise flip
             the slate text to dark (invisible on a dark popover), and the
             editor's light overrides would lighten a `bg-slate-900` class.
             Inline bg dodges the class-based flip; keep-dark keeps text white. */
          className={`keep-dark absolute top-full ${menuAlign} mt-2 z-[120] w-44 rounded-2xl border border-white/15 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] p-1.5 animate-fade-in`}
          style={{ background: 'rgba(15,23,42,0.45)' }}
        >
          {options.map((key) => {
            const Icon = ICONS[key] || Monitor;
            const active = key === value;
            return (
              <button
                key={key}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange?.(key); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  active
                    ? 'bg-gradient-to-r from-brand-500 to-pink-500 text-white shadow-md'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Icon size={15} strokeWidth={2.4} className={active ? 'text-white' : 'text-slate-300'} />
                <span className="flex-1 text-left">{LABELS[key]}</span>
                {active && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
