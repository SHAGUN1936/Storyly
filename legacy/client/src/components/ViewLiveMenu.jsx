import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smartphone, Tablet, Monitor } from 'lucide-react';

const DEVICES = [
  { k: 'mobile', l: 'Mobile', d: '390 × 844', Icon: Smartphone },
  { k: 'tablet', l: 'Tablet', d: '834 × 1112', Icon: Tablet },
  { k: 'desktop', l: 'Desktop', d: '1280 × 720', Icon: Monitor },
];

/**
 * ViewLiveMenu — the "View live" button with a screen-picker dropdown. Choosing
 * a device opens the full-screen, scroll-free live preview for that screen.
 * Rendered via a portal so the toolbar's overflow can't clip it.
 */
export default function ViewLiveMenu({ onPick }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);

  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const W = 190;
    setPos({ left: Math.max(8, Math.min(b.right - W, window.innerWidth - W - 8)), top: b.bottom + 8 });
  };
  const toggle = () => { if (!open) place(); setOpen((v) => !v); };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return; setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => { document.removeEventListener('pointerdown', onDown); window.removeEventListener('resize', onScroll); window.removeEventListener('scroll', onScroll, true); };
  }, [open]);

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-95 active:scale-95"
        data-tooltip="Preview the full website on a chosen screen"
        data-tooltip-pos="bottom"
      >⤢ View live <span className="text-[9px] opacity-80">▾</span></button>

      {open && createPortal(
        <div ref={popRef} className="keep-dark fixed z-[3000] w-[170px] rounded-2xl border border-white/15 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl animate-fade-in" style={{ left: pos.left, top: pos.top, background: 'rgba(15,23,42,0.55)' }}>
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">View on screen</p>
          {DEVICES.map(({ k, l, Icon }) => (
            <button
              key={k}
              type="button"
              onClick={() => { onPick?.(k); setOpen(false); }}
              className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[12px] font-bold text-slate-200 transition hover:bg-gradient-to-r hover:from-brand-500 hover:to-pink-500 hover:text-white"
            >
              <Icon size={15} strokeWidth={2.4} className="shrink-0 text-brand-300 transition group-hover:text-white" />
              <span className="flex-1">{l}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
