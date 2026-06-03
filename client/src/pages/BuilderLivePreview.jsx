import { useEffect, useState } from 'react';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { VIEWPORT_PRESETS } from '../lib/visualTemplateBuilder';

const KEY = 'storyly:livePreview';
const DIMS = {
  mobile: { w: 390, h: 844, label: 'Mobile' },
  tablet: { w: 834, h: 1112, label: 'Tablet' },
  desktop: { w: 1280, h: 720, label: 'Desktop' },
};

/* A phone/tablet mockup — bezel + notch around the screen. The screen is fit to
   the viewport (contain) so the WHOLE website shows with no scroll. */
function PhoneFrame({ w, h, tablet, children }) {
  return (
    <div className={`relative bg-slate-900 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.85)] ${tablet ? 'rounded-[28px] p-2.5' : 'rounded-[48px] p-3'}`}>
      {!tablet && <div className="absolute left-1/2 top-[14px] z-20 h-[22px] w-28 -translate-x-1/2 rounded-full bg-slate-900" />}
      <div
        className="relative overflow-hidden bg-black"
        style={{ aspectRatio: `${w} / ${h}`, height: `min(${tablet ? '88vh' : '86vh'}, calc(92vw * ${h} / ${w}))`, borderRadius: tablet ? 18 : 34 }}
      >
        {children}
      </div>
    </div>
  );
}

/* A desktop browser-window mockup — title bar with traffic lights + address bar. */
function WindowFrame({ w, h, children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.85)]">
      <div className="flex h-8 items-center gap-2 bg-slate-800 px-3">
        <span className="h-3 w-3 rounded-full bg-rose-500" />
        <span className="h-3 w-3 rounded-full bg-amber-400" />
        <span className="h-3 w-3 rounded-full bg-emerald-500" />
        <div className="mx-2 flex h-5 flex-1 items-center gap-1 rounded-md bg-slate-900 px-2 text-[10px] text-slate-400">🔒 your-story.storyly.app</div>
      </div>
      <div
        className="overflow-hidden bg-black"
        style={{ aspectRatio: `${w} / ${h}`, width: `min(94vw, calc((90vh - 2rem) * ${w} / ${h}))` }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * BuilderLivePreview — full-browser, scroll-free preview of the working website
 * inside a real device frame (phone mockup / browser window). It's a page-wise
 * album: one page fills the screen. Exit with Esc or the ✕ that appears when the
 * cursor moves to the top. Structure is handed over via localStorage.
 */
export default function BuilderLivePreview() {
  const [structure, setStructure] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  });
  const [barShown, setBarShown] = useState(true);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const reqDevice = DIMS[params?.get('d')] ? params.get('d') : 'desktop';
  const respEnabled = !!structure?.builderState?.responsive?.enabled;

  /* The SCREEN must match what's actually rendered so the website fills it (no
     black letterbox): a responsive design uses the requested device's artboard;
     a fixed design uses its own viewport regardless of the requested device. */
  const designVp = structure?.builderState?.viewport || 'desktop';
  const src = respEnabled ? DIMS[reqDevice] : (VIEWPORT_PRESETS[designVp] || DIMS.desktop);
  const sw = src.w || src.width;
  const sh = src.h || src.height;
  const portrait = sh >= sw;
  const isTablet = respEnabled && reqDevice === 'tablet';
  const label = respEnabled ? DIMS[reqDevice].label : (portrait ? 'Mobile' : 'Desktop');
  const d = { w: sw, h: sh, label };
  const deviceKey = reqDevice;

  useEffect(() => {
    document.title = 'Live preview · Storyly';
    const onStorage = (e) => { if (e.key === KEY) { try { setStructure(JSON.parse(e.newValue || 'null')); } catch { /* */ } } };
    const onKey = (e) => { if (e.key === 'Escape') window.close(); };
    const onMove = (e) => setBarShown(e.clientY < 64);
    window.addEventListener('storage', onStorage);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMove);
    const t = setTimeout(() => setBarShown(false), 2600);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMove);
      clearTimeout(t);
    };
  }, []);

  if (!structure) {
    return (
      <div className="grid h-screen place-items-center bg-slate-950 p-6 text-center text-sm text-slate-400">
        No preview yet — open this from the editor’s <span className="mx-1 font-bold text-brand-300">⤢ View live</span> button.
      </div>
    );
  }

  const site = (
    <SlideshowBuilder
      structure={structure}
      fills={{}}
      previewBreakpoint={respEnabled ? deviceKey : null}
      embedded
      chromeless
      className="!h-full !w-full [&_.html-deck-root]:!h-full [&_.html-deck-root]:!min-h-0 [&_.html-deck-root]:!rounded-none [&_.html-deck-root]:!border-0 [&_.html-deck-root]:!bg-transparent"
    />
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-black">
      {/* Auto-hide top bar (reveals on cursor-to-top) with the close button */}
      <div
        className={`absolute inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-2.5 transition-all duration-300 ${barShown ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
        style={{ background: 'linear-gradient(to bottom, rgba(2,6,23,.9), transparent)' }}
        onMouseEnter={() => setBarShown(true)}
      >
        <span className="text-[11px] font-semibold text-white/85">{d.label} preview · press <kbd className="rounded bg-white/15 px-1">Esc</kbd> to exit</span>
        <button type="button" onClick={() => window.close()} title="Close (Esc)"
          className="grid h-8 w-8 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/30 active:scale-95">✕</button>
      </div>
      <div className="absolute inset-x-0 top-0 z-30 h-3" onMouseEnter={() => setBarShown(true)} />

      {/* Device frame (phone for portrait designs, window for landscape) so the
          website always FILLS the screen, fully on-screen with no scroll. */}
      <div className="grid h-full w-full place-items-center p-3">
        {portrait
          ? <PhoneFrame w={d.w} h={d.h} tablet={isTablet}>{site}</PhoneFrame>
          : <WindowFrame w={d.w} h={d.h}>{site}</WindowFrame>}
      </div>
    </div>
  );
}
