import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * ArrangeMenu — a cute popover for screen-relative layout.
 * Each option shows a tiny "phone screen" preview of where elements land.
 * `onArrange(mode)` applies arrangeBuilderPage with that mode.
 */
const Dot = ({ l, t }) => (
  <span className="absolute h-1.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-300"
    style={{ left: `${l}%`, top: `${t}%` }} />
);

// Dot coordinates (left%, top%) for each layout's mini preview.
const PREVIEW = {
  center: [[50, 38], [50, 50], [50, 62]],
  spread: [[50, 18], [50, 50], [50, 82]],
  stack: [[50, 16], [50, 30], [50, 44]],
  grid: [[32, 32], [68, 32], [32, 68], [68, 68]],
  left: [[28, 28], [28, 50], [28, 72]],
  hcenter: [[50, 28], [50, 50], [50, 72]],
  right: [[72, 28], [72, 50], [72, 72]],
};

function Screen({ mode }) {
  return (
    <div className="relative mx-auto mb-1 h-11 w-7 rounded-md border border-white/20 bg-slate-950/70 overflow-hidden">
      {(PREVIEW[mode] || []).map(([l, t], i) => <Dot key={i} l={l} t={t} />)}
    </div>
  );
}

const LAYOUTS = [
  { mode: 'center', label: 'Center' },
  { mode: 'spread', label: 'Spread' },
  { mode: 'stack', label: 'Stack' },
  { mode: 'grid', label: 'Grid' },
];
const ALIGNS = [
  { mode: 'left', label: 'Left' },
  { mode: 'hcenter', label: 'Center' },
  { mode: 'right', label: 'Right' },
];

export default function ArrangeMenu({ onArrange }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const btnRef = useRef(null);
  const popRef = useRef(null);

  // The toolbar clips overflow, so the popover is positioned `fixed` and
  // anchored to the button (escapes the clip), clamped to the viewport.
  const place = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const W = 230;
    const vw = window.innerWidth;
    const left = Math.max(8, Math.min(b.left + b.width / 2 - W / 2, vw - W - 8));
    setPos({ left, top: b.bottom + 8 });
  };
  const toggle = () => { if (!open) place(); setOpen((v) => !v); };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target) || popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const pick = (mode) => { onArrange?.(mode); setOpen(false); };

  const Tile = ({ mode, label }) => (
    <button
      type="button"
      onClick={() => pick(mode)}
      className="group flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] px-2 py-2 transition hover:border-brand-400 hover:bg-brand-500/15 active:scale-95"
    >
      <Screen mode={mode} />
      <span className="text-[10px] font-bold text-slate-300 group-hover:text-white">{label}</span>
    </button>
  );

  return (
    <div className="shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-2.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-500/25 transition hover:opacity-95 active:scale-95"
        data-tooltip="Arrange elements to fit the screen"
        data-tooltip-pos="bottom"
      >✨ Arrange</button>

      {open && createPortal(
        <div
          ref={popRef}
          className="fixed z-[2000] w-[230px] rounded-2xl border border-white/12 bg-slate-900/95 p-3 shadow-2xl backdrop-blur"
          style={{ left: pos.left, top: pos.top }}
        >
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-200">📐 Layout</p>
          <div className="grid grid-cols-4 gap-1.5">
            {LAYOUTS.map((o) => <Tile key={o.mode} {...o} />)}
          </div>
          <p className="mb-1.5 mt-3 text-[10px] font-extrabold uppercase tracking-widest text-brand-200">↔ Align</p>
          <div className="grid grid-cols-3 gap-1.5">
            {ALIGNS.map((o) => <Tile key={o.mode} {...o} />)}
          </div>
          <p className="mt-2 text-center text-[9px] text-slate-500">Positions adapt to every screen size</p>
        </div>,
        document.body,
      )}
    </div>
  );
}
