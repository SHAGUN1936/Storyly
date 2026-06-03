import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeMusic, parseYouTubeId } from '../lib/visualTemplateBuilder';
import { decodeAudio, computePeaks, detectBestSegment, fmtTime } from '../lib/audioUtils';
import { mountYouTubeAudio } from '../lib/youtubeAudio';
import { musicAPI } from '../api/api';
import { GripVertical } from 'lucide-react';

/**
 * MusicEngine — search/upload a track, then trim it on a waveform with fades,
 * loop, volume, AI best-segment detection and page-duration matching. Plays a
 * live preview before saving. Output is the normalized `theme.music` JSON.
 */
export default function MusicEngine({ music, pages = [], onSave, onClose, onUpload }) {
  const [draft, setDraft] = useState(() => normalizeMusic(music));
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(music?.url ? 'loading' : 'idle'); // idle|loading|ready|error
  const [peaks, setPeaks] = useState(null);
  const [duration, setDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hits, setHits] = useState([]);       // live search results (real songs)
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState('');
  const [source, setSource] = useState('itunes'); // itunes (30s) | archive (full)
  const [resolving, setResolving] = useState('');

  const bufferRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const dragRef = useRef(null);
  const ytHostRef = useRef(null);
  const ytCtlRef = useRef(null);
  const playheadRef = useRef(null);
  const timeRef = useRef(null);
  const draftRef = useRef(draft);   // latest values, so a running preview follows live edits
  const durationRef = useRef(0);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const isYT = !!draft.youtubeId;
  const end = draft.trimEnd > 0 ? draft.trimEnd : duration;

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  /* Move the Instagram-style playhead + seconds readout (direct DOM = smooth). */
  const showPlayhead = (on) => { if (playheadRef.current) playheadRef.current.style.display = on ? 'block' : 'none'; };
  const updatePlayhead = (t) => {
    const dur = durationRef.current || (draftRef.current.trimEnd || 0) || 1;
    if (playheadRef.current) playheadRef.current.style.left = `${Math.max(0, Math.min(100, (t / dur) * 100))}%`;
    if (timeRef.current) timeRef.current.textContent = fmtTime(t);
  };
  /* Live cut config — the YouTube player reads this each frame so the preview
     follows the handles as you drag. */
  const liveCfg = () => ({
    start: draftRef.current.trimStart, end: draftRef.current.trimEnd,
    fadeIn: draftRef.current.fadeIn, fadeOut: draftRef.current.fadeOut,
    loop: draftRef.current.loop, volume: draftRef.current.volume,
  });

  /* Mount ONE persistent YouTube player as soon as a YT link is set, so it's
     pre-loaded and playback is instant (no per-tap load delay). It also reports
     the duration for the trim timeline. */
  useEffect(() => {
    if (!isYT || !draft.youtubeId || !ytHostRef.current) return undefined;
    setDuration(0);
    ytCtlRef.current = mountYouTubeAudio(ytHostRef.current, {
      videoId: draft.youtubeId, autostart: false,
      getConfig: liveCfg,
      onReady: (dur) => { if (dur > 0) setDuration(dur); },
      onTick: (t) => updatePlayhead(t),
    });
    return () => { try { ytCtlRef.current && ytCtlRef.current.destroy(); } catch { /* */ } ytCtlRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYT, draft.youtubeId]);

  const totalPageSec = useMemo(
    () => Math.max(2, pages.reduce((s, p) => s + (Number(p.pageDurationMs) || 4000), 0) / 1000),
    [pages],
  );

  /* Live song search (debounced) via our server proxy. */
  useEffect(() => {
    const q = query.trim();
    if (!q) { setHits([]); setSearching(false); setSearchErr(''); return undefined; }
    setSearching(true); setSearchErr('');
    const id = setTimeout(() => {
      musicAPI.search(q, source)
        .then((d) => setHits(Array.isArray(d.results) ? d.results : []))
        .catch(() => { setHits([]); setSearchErr('Search unavailable — restart the server, or upload a file.'); })
        .finally(() => setSearching(false));
    }, 450);
    return () => clearTimeout(id);
  }, [query, source]);

  const MOODS = ['lofi', 'chill', 'romantic', 'piano', 'happy', 'epic', 'party', 'acoustic', 'ambient'];

  /* Decode whenever the source changes → waveform + duration. */
  useEffect(() => {
    let cancel = false;
    stopPreview();
    bufferRef.current = null;
    setPeaks(null);
    // YouTube has no decodable audio (DRM) — trim numerically, no waveform.
    if (draft.youtubeId) { setStatus('youtube'); setDuration(0); return undefined; }
    if (!draft.url) { setStatus('idle'); setDuration(0); return undefined; }
    setStatus('loading');
    // Direct decode first (same-origin uploads). For cross-origin CDNs that
    // block CORS (e.g. Apple previews), retry through our same-origin proxy so
    // the waveform still renders.
    const tryDecode = async () => {
      try { return await decodeAudio(draft.url); }
      catch { return await decodeAudio(`/api/music/stream?url=${encodeURIComponent(draft.url)}`); }
    };
    tryDecode()
      .then((buf) => {
        if (cancel) return;
        bufferRef.current = buf;
        setPeaks(computePeaks(buf, 700));
        setDuration(buf.duration);
        setStatus('ready');
      })
      .catch(() => { if (!cancel) { setStatus('error'); /* keep numeric controls usable */ } });
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.url, draft.youtubeId]);

  /* Draw the waveform / timeline + trim region + fades. */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (!duration) return;
    const X = (t) => (t / duration) * W;
    const sx = X(draft.trimStart);
    const ex = X(end);
    if (peaks) {
      const bw = W / peaks.length;
      for (let i = 0; i < peaks.length; i++) {
        const t = (i / peaks.length) * duration;
        const bh = Math.max(2, peaks[i] * H * 0.92);
        ctx.fillStyle = t >= draft.trimStart && t <= end ? '#c4b5fd' : '#475569';
        ctx.fillRect(i * bw, (H - bh) / 2, Math.max(1, bw - 0.5), bh);
      }
      // light dim outside the selection (subtle, not muddy)
      ctx.fillStyle = 'rgba(2,6,23,0.5)';
      ctx.fillRect(0, 0, sx, H);
      ctx.fillRect(ex, 0, W - ex, H);
    } else {
      // YouTube: no waveform → a clean track with a bright selected segment.
      ctx.fillStyle = 'rgba(148,163,184,0.22)';
      ctx.fillRect(0, H / 2 - 11, W, 22);
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#8b5cf6'); g.addColorStop(1, '#ec4899');
      ctx.fillStyle = g;
      ctx.fillRect(sx, H / 2 - 11, Math.max(2, ex - sx), 22);
    }
    // (handles + playhead are clean DOM overlays — see the JSX below)
    // fade ramps
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    if (draft.fadeIn > 0) { ctx.beginPath(); ctx.moveTo(X(draft.trimStart), H); ctx.lineTo(X(Math.min(end, draft.trimStart + draft.fadeIn)), 3); ctx.stroke(); }
    if (draft.fadeOut > 0) { ctx.beginPath(); ctx.moveTo(X(Math.max(draft.trimStart, end - draft.fadeOut)), 3); ctx.lineTo(X(end), H); ctx.stroke(); }
  }, [peaks, duration, draft.trimStart, draft.trimEnd, draft.fadeIn, draft.fadeOut, end]);

  /* Waveform pointer drag — pick the nearest handle and move it. */
  const onCanvasDown = (e) => {
    if (!duration) return;
    const cv = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * duration;
    const handles = [
      { k: 'start', t: draft.trimStart },
      { k: 'end', t: end },
      { k: 'fin', t: draft.trimStart + draft.fadeIn },
      { k: 'fout', t: end - draft.fadeOut },
    ];
    let best = handles[0]; let bd = Infinity;
    handles.forEach((h) => { const d = Math.abs(h.t - t); if (d < bd) { bd = d; best = h; } });
    dragRef.current = best.k;
    // Instagram-style: grabbing a cut handle auto-plays the preview from the
    // start point, so you can place it on the right line by ear.
    if ((best.k === 'start' || best.k === 'end') && !playing) playPreview();
    moveHandle(e);
  };
  const seekPreview = (t) => {
    if (isYT) { try { ytCtlRef.current && ytCtlRef.current.seek(t); } catch { /* */ } }
    else if (audioRef.current) { try { audioRef.current.currentTime = t; } catch { /* */ } }
  };
  const moveHandle = (e) => {
    if (!dragRef.current || !duration) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(duration, ((e.clientX - rect.left) / rect.width) * duration));
    const k = dragRef.current;
    if (k === 'start') {
      const ns = Math.min(t, end - 0.5);
      set({ trimStart: ns });
      // Scrub: play from the new start point as you drag (hear where it begins).
      if (playing) seekPreview(ns);
    } else if (k === 'end') set({ trimEnd: Math.max(draft.trimStart + 0.5, t) });
    else if (k === 'end') set({ trimEnd: Math.max(draft.trimStart + 0.5, t) });
    else if (k === 'fin') set({ fadeIn: Math.max(0, Math.min(end - draft.trimStart, t - draft.trimStart)) });
    else if (k === 'fout') set({ fadeOut: Math.max(0, Math.min(end - draft.trimStart, end - t)) });
  };
  useEffect(() => {
    const up = () => { dragRef.current = null; };
    const mv = (e) => moveHandle(e);
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
  });

  /* ── Preview playback — follows live edits + drives the playhead ── */
  function stopPreview() {
    cancelAnimationFrame(rafRef.current);
    const a = audioRef.current;
    if (a) { try { a.pause(); } catch { /* */ } }
    // Keep the YT player loaded (just pause) so the next play is instant.
    if (ytCtlRef.current) { try { ytCtlRef.current.pause(); } catch { /* */ } }
    showPlayhead(false);
    setPlaying(false);
  }
  const playPreview = () => {
    if (isYT) {
      if (ytCtlRef.current) { try { ytCtlRef.current.play(); } catch { /* */ } }
      showPlayhead(true);
      setPlaying(true);
      return;
    }
    const a = audioRef.current;
    if (!a || !draft.url) return;
    a.volume = draftRef.current.fadeIn > 0 ? 0 : draftRef.current.volume;
    try { a.currentTime = draftRef.current.trimStart; } catch { /* */ }
    a.play().then(() => {
      showPlayhead(true);
      setPlaying(true);
      const tick = () => {
        const c = draftRef.current;                 // LIVE values
        const t = a.currentTime;
        const e3 = c.trimEnd > 0 ? c.trimEnd : (a.duration || durationRef.current || Infinity);
        updatePlayhead(t);
        if (t >= e3 - 0.03 || t < c.trimStart - 0.1) { if (c.loop) { try { a.currentTime = c.trimStart; } catch { /* */ } } else { stopPreview(); return; } }
        let v = c.volume;
        if (c.fadeIn > 0 && t < c.trimStart + c.fadeIn) v = c.volume * Math.max(0, (t - c.trimStart) / c.fadeIn);
        if (c.fadeOut > 0 && e3 !== Infinity && t > e3 - c.fadeOut) v = Math.min(v, c.volume * Math.max(0, (e3 - t) / c.fadeOut));
        a.volume = Math.max(0, Math.min(1, v));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {});
  };
  useEffect(() => () => stopPreview(), []);

  /* ── Smart actions ── */
  const matchPages = () => {
    const len = Math.min(duration || totalPageSec, totalPageSec);
    set({ trimEnd: Math.min(duration || draft.trimStart + len, draft.trimStart + len) });
  };
  const aiBest = () => {
    const buf = bufferRef.current;
    if (!buf) return;
    const len = Math.min(buf.duration, (draft.trimEnd > draft.trimStart ? draft.trimEnd - draft.trimStart : totalPageSec) || totalPageSec);
    const s = detectBestSegment(buf, len);
    set({ trimStart: +s.toFixed(2), trimEnd: +(s + len).toFixed(2) });
  };
  const resetTrim = () => set({ trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0 });

  const pickTrack = async (t) => {
    const title = t.artist ? `${t.artist} – ${t.title}` : t.title;
    if (t.url) { set({ url: t.url, youtubeId: '', title }); return; }
    if (!t.identifier) return;
    setResolving(t.id);
    try {
      const d = await musicAPI.resolve(t.identifier);
      if (d?.url) set({ url: d.url, youtubeId: '', title });
      else setSearchErr('That track has no playable file — try another.');
    } catch { setSearchErr('Could not load that track.'); }
    setResolving('');
  };
  /* Smart URL field: a YouTube link → YouTube player; anything else → audio. */
  const setUrlOrYouTube = (u) => {
    const id = parseYouTubeId(u);
    if (id) set({ youtubeId: id, url: u, title: draft.title || 'YouTube track', trimStart: 0, trimEnd: 0 });
    else set({ url: u, youtubeId: '', title: draft.title || 'Custom track' });
  };
  const upload = async (file) => {
    if (!file || !onUpload) return;
    setBusy(true);
    const url = await onUpload(file);
    setBusy(false);
    if (url) set({ url, youtubeId: '', title: file.name.replace(/\.[^.]+$/, '') });
  };

  const save = () => { stopPreview(); onSave?.(normalizeMusic(draft)); onClose?.(); };
  const removeSong = () => { stopPreview(); onSave?.(normalizeMusic({})); onClose?.(); };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/60 p-4" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/12 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-extrabold text-white">🎵 Music Engine</h3>
          <button type="button" onClick={() => { stopPreview(); onClose?.(); }} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="max-h-[78vh] space-y-3 overflow-y-auto p-4">
          {/* Source: search · upload · url */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            {/* Source toggle: 30s previews (any song) vs full royalty-free */}
            <div className="mb-2 flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
              {[{ k: 'itunes', l: 'Any song · 30s' }, { k: 'archive', l: 'Full · royalty-free' }].map((o) => (
                <button key={o.k} type="button" onClick={() => setSource(o.k)} aria-pressed={source === o.k}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-bold transition ${source === o.k ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-white/5'}`}>{o.l}</button>
              ))}
            </div>
            <p className="mb-1.5 text-[10px] text-slate-500">
              {source === 'itunes'
                ? 'Apple gives 30-second previews only. For complete songs, use “Full · royalty-free” or upload your own.'
                : 'Full-length royalty-free / public-domain tracks.'}
            </p>

            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="🔎 Search any song (artist / title)…"
                className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-brand-400" />
              <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-2 text-[11px] font-semibold text-slate-200 hover:border-brand-400 hover:bg-white/5 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                {busy ? '⏳' : '⬆ Upload'}
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>

            {query.trim() ? (
              <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
                {searching && <p className="px-1 py-1.5 text-[11px] text-slate-400">Searching…</p>}
                {!searching && searchErr && <p className="px-1 py-1.5 text-[11px] text-amber-300">{searchErr}</p>}
                {!searching && !searchErr && !hits.length && <p className="px-1 py-1.5 text-[11px] text-slate-500">No songs found.</p>}
                {hits.map((t) => (
                  <button key={t.id} type="button" onClick={() => pickTrack(t)} aria-pressed={draft.url && draft.url === t.url}
                    className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${draft.url && draft.url === t.url ? 'border-brand-400 bg-brand-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                    {t.artwork
                      ? <img src={t.artwork} alt="" className="h-9 w-9 shrink-0 rounded object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      : <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-white/10 text-sm">🎵</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold text-white">{t.title}</span>
                      <span className="block truncate text-[10px] text-slate-400">{t.artist}{t.full ? ' · full track' : ` · ${fmtTime(t.duration)}`}</span>
                    </span>
                    {resolving === t.id && <span className="text-[10px] text-brand-300">loading…</span>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-slate-500">Quick search</p>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((mood) => (
                    <button key={mood} type="button" onClick={() => setQuery(mood)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-200 hover:border-brand-400 hover:bg-brand-500/15">{mood}</button>
                  ))}
                </div>
              </div>
            )}

            <input type="url" defaultValue={draft.youtubeId ? `https://youtu.be/${draft.youtubeId}` : draft.url} onBlur={(e) => { const u = e.target.value.trim(); if (u) setUrlOrYouTube(u); }}
              placeholder="…or paste an audio URL or a 📺 YouTube link" className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-[11px] text-white outline-none focus:border-brand-400" />
            <p className="mt-1 text-[10px] text-slate-500">Tip: paste a YouTube link too — it plays via the YouTube player (trim &amp; fade work; no waveform).</p>
          </div>

          {(draft.url || draft.youtubeId) && (
            <>
              {/* Trim timeline — waveform for audio, a flat track for YouTube.
                  Drag the pink handles to cut start/end. */}
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2.5">
                <div className="relative">
                  <canvas ref={canvasRef} width={520} height={96} onPointerDown={onCanvasDown}
                    className="block h-24 w-full cursor-ew-resize rounded-lg" style={{ touchAction: 'none' }} />
                  {/* Cutter handles — rounded grips that stick OUT above/below the
                      track, with a grip icon. Visual only; the drag is on the canvas. */}
                  {duration > 0 && [
                    { pct: (draft.trimStart / duration) * 100 },
                    { pct: (end / duration) * 100 },
                  ].map((h, i) => (
                    <div key={i} className="pointer-events-none absolute -top-2.5 -bottom-2.5 z-20 -translate-x-1/2" style={{ left: `${Math.max(0, Math.min(100, h.pct))}%` }}>
                      <div className="flex h-full w-[18px] items-center justify-center rounded-full bg-gradient-to-b from-pink-400 to-fuchsia-600 shadow-lg ring-1 ring-white/50">
                        <GripVertical size={13} className="text-white" strokeWidth={2.4} />
                      </div>
                    </div>
                  ))}
                  {/* Instagram-style playhead — sticks out, with a dot cap, sweeps while playing */}
                  <div ref={playheadRef} className="pointer-events-none absolute -top-3 -bottom-3 z-30 w-[2px] -translate-x-1/2 bg-white" style={{ left: '0%', display: 'none', boxShadow: '0 0 8px rgba(255,255,255,0.95)' }}>
                    <span className="absolute -top-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow" />
                  </div>
                  <span ref={timeRef} className="pointer-events-none absolute right-1.5 top-1.5 z-30 rounded-md border border-white/25 bg-slate-900 px-2 py-1 text-[12px] font-extrabold tabular-nums text-white shadow-lg">0:00</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold tabular-nums">
                  <span className="text-emerald-300">Start {fmtTime(draft.trimStart)}</span>
                  <span className="text-slate-200">{(isYT && !duration) ? 'Loading length…' : status === 'loading' ? 'Decoding…' : status === 'error' ? '⚠ No waveform — trim by numbers' : `Length ${fmtTime((end) - draft.trimStart)}`}</span>
                  <span className="text-rose-300">End {fmtTime(end)}</span>
                </div>
              </div>

              {/* Smart actions */}
              <div className="flex flex-wrap gap-1.5">
                {!isYT && (
                  <button type="button" onClick={aiBest} disabled={!bufferRef.current}
                    className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-1.5 text-[11px] font-bold text-white disabled:opacity-40">🤖 AI best part</button>
                )}
                <button type="button" onClick={matchPages} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-100 hover:bg-slate-700">📐 Match pages ({fmtTime(totalPageSec)})</button>
                <button type="button" onClick={resetTrim} className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-100 hover:bg-slate-700">↺ Reset</button>
              </div>

              {/* Numeric trims (always usable; required for YouTube) */}
              {(isYT || status === 'error' || status === 'ready') && (
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <label className="flex items-center justify-between gap-2">Start (s)
                    <input type="number" min={0} step={0.5} value={draft.trimStart} onChange={(e) => set({ trimStart: Math.max(0, Number(e.target.value) || 0) })} className="w-16 rounded bg-slate-950 px-2 py-1 text-white" /></label>
                  <label className="flex items-center justify-between gap-2">End (s)
                    <input type="number" min={0} step={0.5} value={draft.trimEnd} onChange={(e) => set({ trimEnd: Math.max(0, Number(e.target.value) || 0) })} className="w-16 rounded bg-slate-950 px-2 py-1 text-white" placeholder="end" /></label>
                </div>
              )}

              {/* Fades + loop + volume */}
              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300">
                <label className="block">Fade in: {draft.fadeIn.toFixed(1)}s
                  <input type="range" min={0} max={10} step={0.5} value={draft.fadeIn} onChange={(e) => set({ fadeIn: Number(e.target.value) })} className="w-full accent-brand-500" /></label>
                <label className="block">Fade out: {draft.fadeOut.toFixed(1)}s
                  <input type="range" min={0} max={10} step={0.5} value={draft.fadeOut} onChange={(e) => set({ fadeOut: Number(e.target.value) })} className="w-full accent-brand-500" /></label>
                <label className="block">Volume: {Math.round(draft.volume * 100)}%
                  <input type="range" min={0} max={1} step={0.05} value={draft.volume} onChange={(e) => set({ volume: Number(e.target.value) })} className="w-full accent-brand-500" /></label>
                <label className="flex items-center gap-2 self-end"><input type="checkbox" checked={draft.loop} onChange={(e) => set({ loop: e.target.checked })} className="accent-brand-500" /> Loop</label>
              </div>

              {!isYT && <audio ref={audioRef} src={draft.url} preload="auto" />}
              {/* Hidden host for the persistent YouTube player (pre-loaded) */}
              <div ref={ytHostRef} style={{ position: 'fixed', left: -9999, top: 0, width: 200, height: 120, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }} />
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
          <button type="button" onClick={playing ? stopPreview : playPreview} disabled={!draft.url && !draft.youtubeId}
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-40">{playing ? '⏸ Stop preview' : '▶ Preview'}</button>
          <div className="flex gap-2">
            {(music?.url || draft.url) && (
              <button type="button" onClick={removeSong} className="rounded-lg bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/25">🗑 Remove song</button>
            )}
            <button type="button" onClick={() => { stopPreview(); onClose?.(); }} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white">Cancel</button>
            <button type="button" onClick={save} disabled={!draft.url && !draft.youtubeId} className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 disabled:opacity-40">Save music</button>
          </div>
        </div>
      </div>
    </div>
  );
}
