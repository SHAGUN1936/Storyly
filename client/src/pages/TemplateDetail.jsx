import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI, videosAPI } from '../api/api';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { extractSlotsFromStructure } from '../data/exampleSlideshowTemplate';
import {
  normalizeBuilderState,
  FILTER_PRESETS,
  STICKER_PRESETS,
  SHAPE_PRESETS,
  MUSIC_LIBRARY,
  BUILDER_FONT_OPTIONS,
  TEXT_EFFECT_PRESETS,
  ENTER_ANIM_PRESETS,
} from '../lib/visualTemplateBuilder';
import { StorylyMark } from '../components/StorylyLogo';
import { DARK_INPUT_CLASS, DARK_SELECT_CLASS } from '../lib/uiClasses';
import FloatingDecor from '../ui/FloatingDecor';

const CATEGORY_EMOJI = {
  Love: '💖', Friendship: '🫶', Birthday: '🎂', Memories: '📸', Wedding: '💍',
};

/** Mobile bottom-dock tool icons. */
const MOBILE_PALETTE = [
  { id: 'photo',   label: 'Photo',    emoji: '📸' },
  { id: 'gif',     label: 'GIF',      emoji: '🎞' },
  { id: 'sticker', label: 'Sticker',  emoji: '😎' },
  { id: 'text',    label: 'Text',     emoji: '✍️' },
  { id: 'shape',   label: 'Shape',    emoji: '⬢' },
  { id: 'count',   label: 'Timer',    emoji: '⏱' },
  { id: 'page',    label: 'Page',     emoji: '🎨' },
  { id: 'music',   label: 'Music',    emoji: '🎵' },
];

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customText, setCustomText] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [slotFills, setSlotFills] = useState({});
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [themeOverrides, setThemeOverrides] = useState({});

  /** Editor UI state */
  const [activePage, setActivePage] = useState(0);
  const [selectedOverlayIdx, setSelectedOverlayIdx] = useState(null);
  const [picker, setPicker] = useState(null); // 'sticker' | 'shape' | 'music' | null
  const [dragMode, setDragMode] = useState(true);
  const [mobileDrawer, setMobileDrawer] = useState(null);

  /** History / undo-redo (snapshots of {themeOverrides, slotFills, customText}) */
  const [history, setHistory] = useState({ past: [], future: [] });
  const lastSnapRef = useRef(null);
  const skipNextHistoryRef = useRef(false);
  const HISTORY_LIMIT = 80;

  /** Hidden file inputs */
  const slotFileInputRef = useRef(null);
  const overlayPhotoInputRef = useRef(null);
  const overlayGifInputRef = useRef(null);
  const pendingSlotRef = useRef(null);

  const structure = useMemo(() => {
    const raw = template?.structure;
    if (raw == null) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }, [template?.structure]);

  const isSlideshow = useMemo(() => {
    if (!structure) return false;
    if (structure.type && String(structure.type).toLowerCase() !== 'slideshow') return false;
    if (structure.mode === 'html' && typeof structure.html === 'string' && structure.html.trim()) return true;
    if (Array.isArray(structure.slides) && structure.slides.length > 0) return true;
    return false;
  }, [structure]);

  const slots = useMemo(() => extractSlotsFromStructure(structure), [structure]);
  const pages = slots?.pages || [];
  const pageCount = pages.length || 1;
  const currentPagePatch = themeOverrides?.pagePatches?.[activePage] || {};
  const overlays = useMemo(() => Array.isArray(currentPagePatch.extraBlocks) ? currentPagePatch.extraBlocks : [], [currentPagePatch]);
  const selectedOverlay = selectedOverlayIdx != null ? overlays[selectedOverlayIdx] : null;

  useEffect(() => {
    if (activePage >= pageCount) setActivePage(Math.max(0, pageCount - 1));
  }, [activePage, pageCount]);

  /** Reset overlay selection when page changes. */
  useEffect(() => { setSelectedOverlayIdx(null); }, [activePage]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const tpl = await templatesAPI.get(id);
        if (cancelled) return;
        setTemplate(tpl);
        if (editId) {
          try {
            const job = await videosAPI.get(editId);
            if (cancelled) return;
            const jobTplId = String(job.templateId?._id || job.templateId || '');
            if (jobTplId !== id) {
              setError('This page belongs to a different template.');
              return;
            }
            setCustomText(job.customizations?.text || '');
            setSlotFills(job.customizations?.slots || {});
            setThemeOverrides(
              job.customizations?.themeOverrides && typeof job.customizations.themeOverrides === 'object'
                ? job.customizations.themeOverrides
                : {}
            );
            const urls = job.customizations?.mediaUrls;
            setMediaUrls(Array.isArray(urls) ? urls : []);
          } catch {
            if (!cancelled) setError('Could not load your saved page.');
          }
        } else {
          setThemeOverrides({});
        }
      } catch {
        if (!cancelled) setTemplate(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, editId]);

  /** ── History snapshot (auto-track changes) ───────────────── */
  const stateSnapshot = useMemo(
    () => JSON.stringify({ themeOverrides, slotFills, customText }),
    [themeOverrides, slotFills, customText]
  );

  useEffect(() => {
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      lastSnapRef.current = stateSnapshot;
      return;
    }
    if (lastSnapRef.current != null && lastSnapRef.current !== stateSnapshot) {
      const prev = lastSnapRef.current;
      setHistory((h) => ({ past: [...h.past.slice(-(HISTORY_LIMIT - 1)), prev], future: [] }));
    }
    lastSnapRef.current = stateSnapshot;
  }, [stateSnapshot]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      const prevSnap = h.past[h.past.length - 1];
      const cur = stateSnapshot;
      skipNextHistoryRef.current = true;
      try {
        const s = JSON.parse(prevSnap);
        setThemeOverrides(s.themeOverrides || {});
        setSlotFills(s.slotFills || {});
        setCustomText(s.customText || '');
      } catch {}
      return { past: h.past.slice(0, -1), future: [...h.future, cur].slice(-HISTORY_LIMIT) };
    });
  }, [stateSnapshot]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      const nextSnap = h.future[h.future.length - 1];
      const cur = stateSnapshot;
      skipNextHistoryRef.current = true;
      try {
        const s = JSON.parse(nextSnap);
        setThemeOverrides(s.themeOverrides || {});
        setSlotFills(s.slotFills || {});
        setCustomText(s.customText || '');
      } catch {}
      return { past: [...h.past, cur].slice(-HISTORY_LIMIT), future: h.future.slice(0, -1) };
    });
  }, [stateSnapshot]);

  /** Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z = redo. Skip when inside editable. */
  useEffect(() => {
    const onKey = (e) => {
      const inEditable = e.target?.matches?.(
        'input, textarea, select, [contenteditable], [contenteditable="true"]'
      );
      if (inEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  /** ── pagePatches helpers ─────────────────────────────────── */
  const patchActivePage = useCallback((patch) => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      patches[activePage] = { ...(patches[activePage] || {}), ...patch };
      next.pagePatches = patches;
      return next;
    });
  }, [activePage]);

  const setSiteAudio = useCallback((url) => {
    setThemeOverrides((prev) => ({ ...prev, audioUrl: url || '' }));
  }, []);

  const appendExtraBlock = useCallback((block) => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      const cur = patches[activePage] || {};
      const extras = Array.isArray(cur.extraBlocks) ? cur.extraBlocks : [];
      patches[activePage] = { ...cur, extraBlocks: [...extras, block] };
      next.pagePatches = patches;
      return next;
    });
    // Select the new overlay (which is at the end of extras)
    setSelectedOverlayIdx(overlays.length);
  }, [activePage, overlays.length]);

  /** ── Overlay ops ─────────────────────────────────────────── */
  const updateOverlay = useCallback((idx, patch) => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      const cur = patches[activePage] || {};
      const extras = Array.isArray(cur.extraBlocks) ? [...cur.extraBlocks] : [];
      if (!extras[idx]) return prev;
      extras[idx] = { ...extras[idx], ...patch };
      patches[activePage] = { ...cur, extraBlocks: extras };
      next.pagePatches = patches;
      return next;
    });
  }, [activePage]);

  const updateSelectedOverlay = useCallback((patch) => {
    if (selectedOverlayIdx == null) return;
    updateOverlay(selectedOverlayIdx, patch);
  }, [selectedOverlayIdx, updateOverlay]);

  const reorderOverlay = useCallback((fromIdx, toIdx) => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      const cur = patches[activePage] || {};
      const extras = Array.isArray(cur.extraBlocks) ? [...cur.extraBlocks] : [];
      if (!extras[fromIdx] || toIdx < 0 || toIdx >= extras.length) return prev;
      const [moved] = extras.splice(fromIdx, 1);
      extras.splice(toIdx, 0, moved);
      patches[activePage] = { ...cur, extraBlocks: extras };
      next.pagePatches = patches;
      return next;
    });
    setSelectedOverlayIdx(toIdx);
  }, [activePage]);

  const toggleOverlayField = useCallback((idx, field) => {
    const o = overlays[idx];
    if (!o) return;
    updateOverlay(idx, { [field]: !o[field] });
  }, [overlays, updateOverlay]);

  const duplicateOverlay = useCallback((idx) => {
    const o = overlays[idx];
    if (!o) return;
    const copy = JSON.parse(JSON.stringify(o));
    if (Number.isFinite(Number(copy.x))) copy.x = Number(copy.x) + 24;
    if (Number.isFinite(Number(copy.y))) copy.y = Number(copy.y) + 24;
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      const cur = patches[activePage] || {};
      const extras = Array.isArray(cur.extraBlocks) ? [...cur.extraBlocks] : [];
      extras.splice(idx + 1, 0, copy);
      patches[activePage] = { ...cur, extraBlocks: extras };
      next.pagePatches = patches;
      return next;
    });
    setSelectedOverlayIdx(idx + 1);
  }, [activePage, overlays]);

  const deleteOverlayAt = useCallback((idx) => {
    setThemeOverrides((prev) => {
      const next = { ...prev };
      const patches = [...(prev.pagePatches || [])];
      while (patches.length <= activePage) patches.push({});
      const cur = patches[activePage] || {};
      const extras = (cur.extraBlocks || []).filter((_, i) => i !== idx);
      patches[activePage] = { ...cur, extraBlocks: extras };
      next.pagePatches = patches;
      return next;
    });
    setSelectedOverlayIdx(null);
  }, [activePage]);

  /** Drag-commit from the canvas updates overlay's x/y when dragging a user overlay. */
  const adminBlocksCount = useMemo(() => {
    if (!structure?.builderState) return 0;
    try {
      const base = normalizeBuilderState(structure.builderState);
      return base.pages[activePage]?.blocks?.length || 0;
    } catch { return 0; }
  }, [structure, activePage]);

  const handleBlockMoveCommit = useCallback((slot, x, y) => {
    // slot format: p{X}_b{Y} — Y is global index in merged blocks; user overlays live at Y >= adminBlocksCount
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage) return;
    if (blockIdx < adminBlocksCount) return; // admin block, ignore
    const overlayIdx = blockIdx - adminBlocksCount;
    updateOverlay(overlayIdx, { x, y });
  }, [activePage, adminBlocksCount, updateOverlay]);

  /** Canvas selection: only allow selecting user overlays. */
  const canSelectFromCanvas = useCallback((slot) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return false;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    return pageIdx === activePage && blockIdx >= adminBlocksCount;
  }, [activePage, adminBlocksCount]);

  const handleSelectionChange = useCallback((slot) => {
    if (!slot) { setSelectedOverlayIdx(null); return; }
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage || blockIdx < adminBlocksCount) {
      setSelectedOverlayIdx(null);
      return;
    }
    setSelectedOverlayIdx(blockIdx - adminBlocksCount);
  }, [activePage, adminBlocksCount]);

  const selectedSlot = useMemo(() => {
    if (selectedOverlayIdx == null) return null;
    return `p${activePage + 1}_b${adminBlocksCount + selectedOverlayIdx}`;
  }, [selectedOverlayIdx, activePage, adminBlocksCount]);

  const handleResizeCommit = useCallback((slot, w, h) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage || blockIdx < adminBlocksCount) return;
    const overlayIdx = blockIdx - adminBlocksCount;
    const o = overlays[overlayIdx];
    if (!o) return;
    const patch = { width: w, height: h };
    if (o.type === 'sticker') patch.size = Math.max(20, Math.min(240, Math.round(Math.max(w, h))));
    updateOverlay(overlayIdx, patch);
  }, [activePage, adminBlocksCount, overlays, updateOverlay]);

  const handleRotateCommit = useCallback((slot, deg) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage || blockIdx < adminBlocksCount) return;
    updateOverlay(blockIdx - adminBlocksCount, { rotateDeg: deg });
  }, [activePage, adminBlocksCount, updateOverlay]);

  /** ── Slot upload via canvas tap ───────────────────────────── */
  const onCanvasClick = (e) => {
    const target = e.target.closest('[data-slot]');
    if (!target) return;
    const slot = target.getAttribute('data-slot');
    if (!slot) return;
    e.preventDefault();
    e.stopPropagation();
    pendingSlotRef.current = slot;
    slotFileInputRef.current?.click();
  };

  const handleSlotFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const slot = pendingSlotRef.current;
    pendingSlotRef.current = null;
    if (!file || !slot) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await videosAPI.uploadMedia(file);
      setSlotFills((p) => ({ ...p, [slot]: url }));
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleTextSlotCommit = (slot, text) => {
    if (!slot) return;
    setSlotFills((p) => ({ ...p, [slot]: text }));
  };

  /** ── Overlay-add handlers ─────────────────────────────────── */
  const handleOverlayPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await videosAPI.uploadMedia(file);
      appendExtraBlock({
        type: 'image',
        defaultUrl: url,
        mediaFit: 'cover',
        mediaRadius: 18,
        mediaShadow: true,
        enterAnimation: 'pop',
      });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleOverlayGif = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { url } = await videosAPI.uploadMedia(file);
      appendExtraBlock({
        type: 'gif',
        defaultUrl: url,
        mediaFit: 'contain',
        mediaRadius: 12,
        mediaShadow: false,
        enterAnimation: 'pop',
      });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAddSticker = (emoji) => {
    appendExtraBlock({ type: 'sticker', emoji, size: 96, enterAnimation: 'pop' });
    setPicker(null);
  };

  const handleAddText = (textEffect = 'none', fontFamily = '') => {
    appendExtraBlock({
      type: 'text',
      text: 'Tap to edit',
      enterAnimation: 'fadeIn',
      textEffect,
      ...(fontFamily ? { fontFamily } : {}),
      ...(['gradient','neon','glow','stroke'].includes(textEffect)
        ? { textGradientFrom: '#f97316', textGradientTo: '#d946ef' }
        : {}),
    });
  };

  const handleAddShape = (kind) => {
    appendExtraBlock({
      type: 'shape',
      shapeKind: kind || 'rect',
      width: kind === 'pill' ? 220 : 160,
      height: kind === 'pill' ? 64 : 160,
      fillColor: '#d946ef',
      opacity: 1,
      enterAnimation: 'zoom',
    });
    setPicker(null);
  };

  const handleAddCountdown = () => {
    const t = new Date(Date.now() + 7 * 86400 * 1000);
    appendExtraBlock({
      type: 'countdown',
      targetISO: t.toISOString(),
      title: 'Counting down to',
      style: 'card',
      accentColor: '#d946ef',
      enterAnimation: 'pop',
    });
  };

  /** ── Publish / save ───────────────────────────────────────── */
  const handleGenerate = async () => {
    setError('');
    setGenerating(true);
    try {
      const allMedia = isSlideshow
        ? [...Object.values(slotFills).filter(Boolean), ...mediaUrls]
        : mediaUrls;

      if (editId) {
        await videosAPI.update(editId, {
          customizations: {
            text: customText,
            mediaUrls: allMedia,
            slots: isSlideshow ? slotFills : undefined,
            ...(isSlideshow && structure?.builderState ? { themeOverrides } : {}),
          },
        });
        if (!isSlideshow) await videosAPI.process(editId);
        navigate('/my-videos');
        return;
      }

      const { _id: jobId } = await videosAPI.createJob({
        templateId: id,
        customizations: {
          text: customText,
          mediaUrls: allMedia,
          slots: isSlideshow ? slotFills : undefined,
          ...(isSlideshow && structure?.builderState ? { themeOverrides } : {}),
        },
      });
      await videosAPI.process(jobId);
      navigate('/my-videos');
    } catch (err) {
      setError(err.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  /** ── Legacy non-slideshow video upload ────────────────────── */
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError('');
    try {
      const urls = [];
      for (const file of files) {
        const { url } = await videosAPI.uploadMedia(file);
        urls.push(url);
      }
      setMediaUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (loading || !template) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-3xl bg-brand-500/40 animate-pulse" />
          <div className="relative animate-pulse">
            <StorylyMark size={64} idSuffix="loadingt" />
          </div>
          <p className="mt-5 text-center text-xs uppercase tracking-[0.32em] font-bold text-slate-400">Loading studio</p>
        </div>
      </div>
    );
  }

  const cat = template.category || 'Event';
  const catEmoji = CATEGORY_EMOJI[cat] || '✨';

  if (!isSlideshow) {
    return (
      <LegacyVideoEditor
        template={template}
        cat={cat}
        catEmoji={catEmoji}
        customText={customText}
        setCustomText={setCustomText}
        mediaUrls={mediaUrls}
        setMediaUrls={setMediaUrls}
        uploading={uploading}
        generating={generating}
        error={error}
        editId={editId}
        handleFileUpload={handleFileUpload}
        handleGenerate={handleGenerate}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <input ref={slotFileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleSlotFile} />
      <input ref={overlayPhotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleOverlayPhoto} />
      <input ref={overlayGifInputRef} type="file" accept="image/gif,image/webp,image/png" className="hidden" onChange={handleOverlayGif} />

      {/* Admin-style dark editor shell — has its own ambient drifting
          decor since the opaque slate-950 background covers the
          Layout-level floating decor. `isolate` creates a stacking
          context so the negative-z decor stays inside the shell. */}
      <div data-lenis-prevent className="tpl-editor-shell rounded-2xl border border-white/10 bg-slate-950 overflow-hidden relative isolate">
        <div className="pointer-events-none absolute inset-0" style={{ zIndex: -1 }}>
          <FloatingDecor density="subtle" opacity={0.08} size={36} />
        </div>
        {/* ── Top toolbar ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3 sm:py-2.5 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              to="/studio"
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-2.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/15 hover:border-white/25 active:scale-95 transition"
              title="Back to feed"
              aria-label="Back to feed"
            >
              <span className="sm:hidden text-base leading-none">←</span>
              <span className="hidden sm:inline">← Feed</span>
            </Link>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate max-w-[14ch] sm:max-w-[22ch]">{template.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">{catEmoji} {cat} · {activePage + 1}/{pageCount}</p>
            </div>
            <div className="hidden md:flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
              <button
                type="button" title="Undo (Ctrl+Z)" aria-label="Undo"
                disabled={!history.past.length}
                onClick={undo}
                className="rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 px-2.5 py-2 text-xs text-slate-200 transition"
              >↶ Undo</button>
              <button
                type="button" title="Redo (Ctrl+Shift+Z)" aria-label="Redo"
                disabled={!history.future.length}
                onClick={redo}
                className="rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 px-2.5 py-2 text-xs text-slate-200 transition"
              >↷ Redo</button>
            </div>
            <div className="hidden md:flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
              <button
                type="button"
                onClick={() => setPicker(picker === 'sticker' ? null : 'sticker')}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'sticker' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
              >😎 Stickers</button>
              <button
                type="button"
                onClick={() => setPicker(picker === 'shape' ? null : 'shape')}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'shape' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
              >⬢ Shapes</button>
              <button
                type="button"
                onClick={() => setPicker(picker === 'music' ? null : 'music')}
                className={`rounded-lg px-2.5 py-2 text-xs font-semibold transition ${picker === 'music' ? 'bg-brand-500 text-slate-950' : 'bg-white/5 hover:bg-white/15 text-slate-200'}`}
                title={themeOverrides.audioUrl ? 'Music ON' : 'Music off'}
              >🎵 {themeOverrides.audioUrl ? 'Music ✓' : 'Music'}</button>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="hidden md:flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 cursor-pointer">
              <input type="checkbox" checked={dragMode} onChange={(e) => setDragMode(e.target.checked)} />
              <span>Drag mode</span>
            </label>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleGenerate}
              disabled={generating || uploading}
              className="rounded-xl px-3 py-2 sm:px-4 text-xs font-bold text-white border border-white/15 disabled:opacity-60 transition whitespace-nowrap"
              style={{
                backgroundImage: 'linear-gradient(120deg, #22D3EE 0%, #A855F7 50%, #F472B6 100%)',
                backgroundSize: '200% 200%',
                boxShadow: '0 18px 50px -16px rgba(168,85,247,0.65), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
              title={editId ? 'Save changes' : 'Publish your page'}
            >
              {generating ? '⏳' : editId ? '💾' : '🚀'}
              <span className="hidden sm:inline ml-1">
                {generating ? 'Saving…' : editId ? 'Save' : 'Publish'}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Story progress dots */}
        {pageCount > 1 && (
          <div className="flex items-center gap-1 px-3 py-2 bg-slate-900/60 border-b border-white/5">
            {Array.from({ length: pageCount }).map((_, i) => {
              const active = i === activePage;
              const past = i < activePage;
              return (
                <button
                  key={i}
                  onClick={() => setActivePage(i)}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    active ? 'bg-white' : past ? 'bg-slate-400' : 'bg-slate-700'
                  }`}
                  aria-label={`Page ${i + 1}`}
                />
              );
            })}
          </div>
        )}

        {/* ── Pickers ───────────────────────────────────────── */}
        <AnimatePresence>
          {picker === 'sticker' && (
            <motion.div
              key="picker-sticker"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-b border-white/10 bg-slate-900/95 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Pick a sticker</p>
                <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-9 sm:grid-cols-14 gap-1.5 max-h-44 overflow-y-auto">
                {STICKER_PRESETS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleAddSticker(e)}
                    className="rounded-lg bg-white/5 hover:bg-brand-500/30 text-2xl py-1.5 transition active:scale-90"
                  >{e}</button>
                ))}
              </div>
            </motion.div>
          )}
          {picker === 'shape' && (
            <motion.div
              key="picker-shape"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-b border-white/10 bg-slate-900/95 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Add a shape</p>
                <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {SHAPE_PRESETS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleAddShape(s.value)}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-brand-500/20 hover:border-brand-400 px-2 py-3 text-[11px] font-semibold text-slate-200 transition active:scale-95"
                  >
                    <ShapePreview kind={s.value} />
                    <span className="block mt-1.5">{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {picker === 'music' && (
            <motion.div
              key="picker-music"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="border-b border-white/10 bg-slate-900/95 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Background music</p>
                <div className="flex items-center gap-2">
                  {themeOverrides.audioUrl && (
                    <button type="button" onClick={() => setSiteAudio('')} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>
                  )}
                  <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MUSIC_LIBRARY.map((t) => {
                  const active = themeOverrides.audioUrl === t.url;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSiteAudio(t.url)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-brand-400 bg-brand-500/20 text-white'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">🎵 {t.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-400">{t.mood}</span>
                      </div>
                      <audio src={t.url} controls preload="none" className="mt-1.5 w-full h-8" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main 3-column ─────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden gap-3 p-3 lg:gap-4 lg:p-4 min-h-[70vh] lg:h-[calc(100vh-13rem)]">
          {/* LEFT — Add Elements + Pages + Overlay Layers */}
          <div className="hidden lg:flex w-48 flex-col gap-4 overflow-y-auto border-r border-white/10 pr-3">
            {/* Add Elements */}
            <div>
              <h4 className="mb-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Add elements</h4>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => overlayPhotoInputRef.current?.click()}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >📸 Photo</button>
                <button
                  type="button"
                  onClick={() => overlayGifInputRef.current?.click()}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >🎞 GIF</button>
                <button
                  type="button"
                  onClick={() => handleAddText('none')}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >✍️ Text</button>
                <button
                  type="button"
                  onClick={() => handleAddText('gradient')}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >🌈 Gradient</button>
                <button
                  type="button"
                  onClick={() => setPicker('sticker')}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >😎 Sticker</button>
                <button
                  type="button"
                  onClick={() => setPicker('shape')}
                  className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >⬢ Shape</button>
                <button
                  type="button"
                  onClick={handleAddCountdown}
                  className="col-span-2 rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                >⏱ Countdown</button>
              </div>
            </div>

            {/* Pages */}
            <div>
              <h4 className="mb-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Pages</h4>
              <div className="flex flex-wrap gap-1.5">
                {pages.map((p, i) => (
                  <button
                    key={p.index ?? i}
                    type="button"
                    onClick={() => setActivePage(i)}
                    title={p.title || `Page ${i + 1}`}
                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                      activePage === i ? 'bg-brand-500 text-slate-950' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                    }`}
                  >{i + 1}</button>
                ))}
              </div>
            </div>

            {/* Overlay Layers */}
            <div>
              <h4 className="mb-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5">
                Your layers
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{overlays.length}</span>
              </h4>
              {overlays.length === 0 ? (
                <p className="text-[11px] text-slate-500 leading-5">No overlays on this page yet. Add a sticker, photo, or text above ↑</p>
              ) : (
                <div className="space-y-1">
                  {overlays.map((b, i) => {
                    const active = selectedOverlayIdx === i;
                    const total = overlays.length;
                    return (
                      <div
                        key={i}
                        className={`group rounded-lg transition ${active ? 'bg-brand-500/25 ring-1 ring-brand-400' : 'bg-slate-800/40 hover:bg-slate-800/70'}`}
                      >
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOverlayIdx(i)}
                            className={`flex-1 text-left text-[11px] font-semibold transition ${active ? 'text-white' : 'text-slate-300'} ${b.hidden ? 'opacity-40' : ''}`}
                          >
                            <span className="inline-block w-3 mr-1">{b.locked ? '🔒' : ''}</span>
                            <span className="capitalize">{b.type}</span>
                            {b.type === 'sticker' && b.emoji && <span className="ml-1">{b.emoji}</span>}
                            {b.type === 'text' && b.text && <span className="ml-1 text-slate-400 truncate">"{b.text.slice(0, 12)}"</span>}
                          </button>
                          <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                            <button type="button" title="Up" aria-label="Move up" disabled={i === 0}
                              onClick={(e) => { e.stopPropagation(); reorderOverlay(i, i - 1); }}
                              className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300 disabled:opacity-20"
                            >▲</button>
                            <button type="button" title="Down" aria-label="Move down" disabled={i === total - 1}
                              onClick={(e) => { e.stopPropagation(); reorderOverlay(i, i + 1); }}
                              className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300 disabled:opacity-20"
                            >▼</button>
                            <button type="button" title={b.hidden ? 'Show' : 'Hide'} aria-label={b.hidden ? 'Show' : 'Hide'}
                              onClick={(e) => { e.stopPropagation(); toggleOverlayField(i, 'hidden'); }}
                              className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300"
                            >{b.hidden ? '🙈' : '👁'}</button>
                            <button type="button" title="Duplicate" aria-label="Duplicate"
                              onClick={(e) => { e.stopPropagation(); duplicateOverlay(i); }}
                              className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300"
                            >📋</button>
                            <button type="button" title="Delete" aria-label="Delete"
                              onClick={(e) => { e.stopPropagation(); deleteOverlayAt(i); }}
                              className="w-5 h-5 rounded text-[10px] hover:bg-red-500/40 text-rose-300"
                            >×</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CENTER — Canvas */}
          <div className="flex-1 flex flex-col gap-3 overflow-hidden min-w-0">
            <div
              className="flex-1 rounded-xl border border-white/10 bg-black overflow-hidden shadow-2xl relative"
              onClick={onCanvasClick}
            >
              <SlideshowBuilder
                structure={structure}
                fills={slotFills}
                themeOverrides={themeOverrides}
                editable
                dragMode={dragMode}
                activeIndex={activePage}
                onActiveIndexChange={setActivePage}
                onTextSlotCommit={handleTextSlotCommit}
                onBlockMoveCommit={handleBlockMoveCommit}
                selectedSlot={selectedSlot}
                onSelectionChange={handleSelectionChange}
                onResizeCommit={handleResizeCommit}
                onRotateCommit={handleRotateCommit}
                canSelect={canSelectFromCanvas}
                alwaysShowStoryDuringCountdown
                className="w-full h-full [&_.html-deck-root]:h-full [&_.html-deck-root]:min-h-full"
              />
              {uploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 pointer-events-none">
                  <div className="animate-pulse">
                    <StorylyMark size={56} idSuffix="uploading" />
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-[11px] text-slate-500">
              Tap photos to upload · tap text to edit · drag to move{selectedOverlay ? ' · selected overlay shown right' : ''}
            </p>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-200"
              >⚠ {error}</motion.div>
            )}
          </div>

          {/* RIGHT — Properties panel */}
          <div className="hidden lg:flex w-64 flex-col gap-4 overflow-y-auto border-l border-white/10 pl-3">
            {selectedOverlay ? (
              <OverlayProperties
                overlay={selectedOverlay}
                onUpdate={updateSelectedOverlay}
                onDelete={() => { if (selectedOverlayIdx != null) deleteOverlayAt(selectedOverlayIdx); }}
                onDeselect={() => setSelectedOverlayIdx(null)}
              />
            ) : (
              <PageProperties
                page={currentPage(pages, activePage)}
                pagePatch={currentPagePatch}
                onPatch={patchActivePage}
                builderTheme={structure?.builderState?.theme}
                customText={customText}
                setCustomText={setCustomText}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile bottom dock + drawer ───────────────────────── */}
      <div className="lg:hidden">
        <AnimatePresence>
          {mobileDrawer && (
            <motion.div
              key="mobile-drawer"
              initial={{ y: 320, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 320, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="fixed inset-x-0 bottom-[68px] z-30 mx-2 mb-2 rounded-[1.5rem] border border-white/12 max-h-[58vh] overflow-y-auto shadow-[0_40px_100px_-30px_rgba(0,0,0,0.75)] tpl-builder-drawer"
              style={{
                background: 'linear-gradient(180deg, rgba(17,24,39,0.96), rgba(11,15,25,0.96))',
                backdropFilter: 'blur(24px) saturate(160%)',
                WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              }}
            >
              {/* Grab handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 sticky top-0 z-10"
                style={{ background: 'rgba(11,15,25,0.92)', backdropFilter: 'blur(20px)' }}
              >
                <p className="font-bold font-display text-white text-sm">
                  {MOBILE_PALETTE.find((p) => p.id === mobileDrawer)?.emoji} {' '}
                  {MOBILE_PALETTE.find((p) => p.id === mobileDrawer)?.label}
                </p>
                <button
                  onClick={() => setMobileDrawer(null)}
                  className="rounded-full w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition active:scale-90"
                  aria-label="Close panel"
                >✕</button>
              </div>
              <div className="p-3">
                <MobilePanel
                  drawer={mobileDrawer}
                  overlayPhotoInputRef={overlayPhotoInputRef}
                  overlayGifInputRef={overlayGifInputRef}
                  handleAddSticker={handleAddSticker}
                  handleAddText={handleAddText}
                  handleAddShape={handleAddShape}
                  handleAddCountdown={() => { handleAddCountdown(); setMobileDrawer(null); }}
                  themeOverrides={themeOverrides}
                  setSiteAudio={setSiteAudio}
                  currentPagePatch={currentPagePatch}
                  patchActivePage={patchActivePage}
                  builderTheme={structure?.builderState?.theme}
                  overlays={overlays}
                  selectedOverlayIdx={selectedOverlayIdx}
                  setSelectedOverlayIdx={setSelectedOverlayIdx}
                  deleteOverlayAt={deleteOverlayAt}
                  pages={pages}
                  activePage={activePage}
                  setActivePage={setActivePage}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dark-glass bottom dock matching the editor shell */}
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 pb-safe"
          style={{
            background: 'rgba(11,15,25,0.92)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          }}
        >
          <div className="grid grid-cols-8 px-1">
            {MOBILE_PALETTE.map((t) => {
              const isActive = mobileDrawer === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (t.id === 'photo') { overlayPhotoInputRef.current?.click(); return; }
                    if (t.id === 'gif') { overlayGifInputRef.current?.click(); return; }
                    if (t.id === 'count') { handleAddCountdown(); return; }
                    setMobileDrawer(mobileDrawer === t.id ? null : t.id);
                  }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-2 text-[9px] font-bold uppercase tracking-[0.06em] transition active:scale-90 ${
                    isActive ? 'text-white' : 'text-slate-300 hover:text-white'
                  }`}
                  title={t.label}
                  aria-label={t.label}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <span
                      className="absolute inset-1 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(34,211,238,0.20), rgba(168,85,247,0.30) 50%, rgba(244,114,182,0.20))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
                      }}
                    />
                  )}
                  <span className="relative text-lg leading-none">{t.emoji}</span>
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        {/* Spacer so the dock doesn't cover the canvas */}
        <div className="h-20" />
      </div>
    </div>
  );
}

/** ── Subcomponents ───────────────────────────────────────── */

function currentPage(pages, idx) {
  return pages?.[idx];
}

function ShapePreview({ kind }) {
  const size = 26;
  const fill = '#d946ef';
  switch (kind) {
    case 'circle': return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={fill} /></svg>;
    case 'pill': return <svg width={size} height={size * 0.5} viewBox="0 0 24 12"><rect x="0" y="0" width="24" height="12" rx="6" fill={fill} /></svg>;
    case 'heart': return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-7-4.35-7-10.5C5 7.46 7.46 5 10.5 5c1.5 0 2.86.7 3.7 1.86C15.04 5.7 16.4 5 17.9 5c3.05 0 5.5 2.46 5.5 5.5 0 6.15-7 10.5-7 10.5H12z" fill={fill} transform="translate(-2,0)" /></svg>;
    case 'star': return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={fill} /></svg>;
    case 'blob': return <svg width={size} height={size} viewBox="0 0 200 200"><path d="M44.5,-58.8C57.4,-50.3,67.1,-36.8,71.5,-21.7C75.9,-6.6,75,9.9,68.5,23.2C62,36.4,49.9,46.4,36.6,55.7C23.3,65,8.7,73.5,-7.7,75.6C-24.2,77.7,-42.5,73.5,-54.1,62.6C-65.7,51.6,-70.4,33.9,-71.3,17.3C-72.2,0.8,-69.2,-14.7,-61.6,-27.5C-54,-40.3,-41.8,-50.4,-28.4,-58.2C-15,-66,-0.5,-71.5,12.7,-71.2C25.9,-71,40.6,-67.2,44.5,-58.8Z" transform="translate(100 100)" fill={fill} /></svg>;
    case 'speech': return <svg width={size} height={size * 0.8} viewBox="0 0 200 160"><path d="M20,20 H180 a20,20 0 0 1 20,20 V100 a20,20 0 0 1 -20,20 H80 L50,150 V120 H20 a20,20 0 0 1 -20,-20 V40 a20,20 0 0 1 20,-20 z" fill={fill} /></svg>;
    default: return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill={fill} /></svg>;
  }
}

/** Right-side panel — shown when no overlay is selected. */
function PageProperties({ page, pagePatch, onPatch, builderTheme, customText, setCustomText }) {
  const base = builderTheme || {};
  const swatches = ['#ffffff','#0f172a','#d946ef','#f43f5e','#f97316','#fbbf24','#10b981','#0ea5e9','#7c3aed'];
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Page</h4>
        <p className="text-sm font-bold text-white truncate">{page?.title || `Page`}</p>
        <p className="text-[11px] text-slate-500">Click an overlay on the left to edit it.</p>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">💬 Message</label>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          rows={3}
          placeholder="A memorable line…"
          maxLength={500}
          className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS} resize-y`}
        />
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">🎨 Text color</label>
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((c) => (
            <button
              key={`t-${c}`}
              onClick={() => onPatch({ textColor: c })}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full border-2 transition ${pagePatch.textColor === c ? 'border-brand-400 scale-110' : 'border-white/20'}`}
            />
          ))}
          <input
            type="color"
            value={pagePatch.textColor || base.textColor || '#ffffff'}
            onChange={(e) => onPatch({ textColor: e.target.value })}
            className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">📌 Heading color</label>
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((c) => (
            <button
              key={`h-${c}`}
              onClick={() => onPatch({ headingColor: c })}
              style={{ background: c }}
              className={`w-6 h-6 rounded-full border-2 transition ${pagePatch.headingColor === c ? 'border-brand-400 scale-110' : 'border-white/20'}`}
            />
          ))}
          <input
            type="color"
            value={pagePatch.headingColor || base.headingColor || '#ffffff'}
            onChange={(e) => onPatch({ headingColor: e.target.value })}
            className="w-6 h-6 rounded-full overflow-hidden border-2 border-white/20 cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">🖼 Background</label>
        <input
          type="color"
          value={pagePatch.pageBackground || base.pageBackground || '#111827'}
          onChange={(e) => onPatch({ pageBackground: e.target.value })}
          className="w-full h-9 rounded-lg overflow-hidden border border-white/10 cursor-pointer"
        />
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">🅰 Font</label>
        <select
          value={pagePatch.fontFamily || ''}
          onChange={(e) => onPatch({ fontFamily: e.target.value })}
          className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
        >
          <option value="">Inherit</option>
          {BUILDER_FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>{f.group} — {f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">📷 Page filter</label>
        <select
          value={pagePatch.pageFilter || 'none'}
          onChange={(e) => onPatch({ pageFilter: e.target.value })}
          className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
        >
          {FILTER_PRESETS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">✨ Page animation</label>
        <select
          value={pagePatch.pageAnimation || ''}
          onChange={(e) => onPatch({ pageAnimation: e.target.value })}
          className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
        >
          <option value="">Inherit</option>
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slideUp">Slide up</option>
          <option value="zoom">Zoom</option>
          <option value="drift">Drift</option>
        </select>
      </div>
    </div>
  );
}

/** Right-side panel — shown when an overlay is selected. */
function OverlayProperties({ overlay, onUpdate, onDelete, onDeselect }) {
  const type = overlay?.type;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
          {type} layer
        </h4>
        <button type="button" onClick={onDeselect} className="text-[10px] text-slate-400 hover:text-white">close</button>
      </div>

      {/* Text-like blocks */}
      {(type === 'text' || type === 'heading' || type === 'subheading') && (
        <>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Text</label>
            <textarea
              rows={3}
              value={overlay.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">🅰 Effect</label>
            <select
              value={overlay.textEffect || 'none'}
              onChange={(e) => onUpdate({ textEffect: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
            >
              {TEXT_EFFECT_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
          {['gradient','neon','glow','stroke'].includes(overlay.textEffect) && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Color 1</label>
                <input
                  type="color"
                  value={overlay.textGradientFrom || '#f97316'}
                  onChange={(e) => onUpdate({ textGradientFrom: e.target.value })}
                  className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Color 2</label>
                <input
                  type="color"
                  value={overlay.textGradientTo || '#d946ef'}
                  onChange={(e) => onUpdate({ textGradientTo: e.target.value })}
                  className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Font</label>
            <select
              value={overlay.fontFamily || ''}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
            >
              <option value="">Inherit</option>
              {BUILDER_FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.group} — {f.label}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Sticker */}
      {type === 'sticker' && (
        <>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Emoji</label>
            <input
              type="text" maxLength={4}
              value={overlay.emoji || ''}
              onChange={(e) => onUpdate({ emoji: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xl text-white text-center ${DARK_INPUT_CLASS}`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Size: {overlay.size || 96}px</label>
            <input
              type="range" min={20} max={240}
              value={overlay.size || 96}
              onChange={(e) => onUpdate({ size: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Shape */}
      {type === 'shape' && (
        <>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Kind</label>
            <select
              value={overlay.shapeKind || 'rect'}
              onChange={(e) => onUpdate({ shapeKind: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
            >
              {SHAPE_PRESETS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Fill</label>
            <input type="color" value={overlay.fillColor || '#d946ef'}
              onChange={(e) => onUpdate({ fillColor: e.target.value })}
              className="w-full h-8 rounded-lg border border-white/10 bg-slate-900" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">W</label>
              <input type="number" min={20} max={800}
                value={overlay.width || 160}
                onChange={(e) => onUpdate({ width: Number(e.target.value) || 160 })}
                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">H</label>
              <input type="number" min={20} max={800}
                value={overlay.height || 160}
                onChange={(e) => onUpdate({ height: Number(e.target.value) || 160 })}
                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Opacity: {Math.round((overlay.opacity ?? 1) * 100)}%</label>
            <input
              type="range" min={0} max={100}
              value={Math.round((overlay.opacity ?? 1) * 100)}
              onChange={(e) => onUpdate({ opacity: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </>
      )}

      {/* Countdown */}
      {type === 'countdown' && (
        <>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">⏱ Target date</label>
            <input
              type="datetime-local"
              value={(() => {
                const iso = overlay.targetISO;
                if (!iso) return '';
                try {
                  const d = new Date(iso);
                  if (!isFinite(d.getTime())) return '';
                  const pad = (n) => String(n).padStart(2, '0');
                  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                } catch { return ''; }
              })()}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) { onUpdate({ targetISO: '' }); return; }
                try { onUpdate({ targetISO: new Date(v).toISOString() }); } catch {}
              }}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Title</label>
            <input
              value={overlay.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Style</label>
              <select
                value={overlay.style || 'card'}
                onChange={(e) => onUpdate({ style: e.target.value })}
                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_SELECT_CLASS}`}
              >
                <option value="minimal">Minimal</option>
                <option value="card">Card</option>
                <option value="mega">Mega</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Accent</label>
              <input type="color"
                value={overlay.accentColor || '#d946ef'}
                onChange={(e) => onUpdate({ accentColor: e.target.value })}
                className="w-full h-9 rounded-lg border border-white/10 bg-slate-900" />
            </div>
          </div>
        </>
      )}

      {/* Media (image/gif/video) */}
      {(type === 'image' || type === 'gif' || type === 'video') && (
        <>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Fit</label>
            <select
              value={overlay.mediaFit || 'cover'}
              onChange={(e) => onUpdate({ mediaFit: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">📷 Filter</label>
            <select
              value={overlay.imageFilter || 'none'}
              onChange={(e) => onUpdate({ imageFilter: e.target.value })}
              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
            >
              {FILTER_PRESETS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          {[
            { key: 'brightness', label: '☀ Brightness' },
            { key: 'contrast',   label: '◐ Contrast' },
            { key: 'saturation', label: '🎨 Saturation' },
          ].map(({ key, label }) => {
            const cur = overlay[key] ?? 100;
            return (
              <div key={key}>
                <label className="block text-[11px] text-slate-400 mb-1">{label}: {Math.round(cur)}%</label>
                <input
                  type="range" min={0} max={300} value={cur}
                  onChange={(e) => onUpdate({ [key]: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            );
          })}
        </>
      )}

      {/* Rotation (all overlays) */}
      <div className="border-t border-white/5 pt-3">
        <label className="block text-[11px] text-slate-400 mb-1">Rotate: {Math.round(overlay.rotateDeg || 0)}°</label>
        <input
          type="range" min={-180} max={180}
          value={overlay.rotateDeg || 0}
          onChange={(e) => onUpdate({ rotateDeg: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Entrance animation (all overlays) */}
      <div className="border-t border-white/5 pt-3">
        <label className="block text-[11px] text-slate-400 mb-1">✨ Entrance</label>
        <select
          value={overlay.enterAnimation || 'none'}
          onChange={(e) => onUpdate({ enterAnimation: e.target.value })}
          className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
        >
          {ENTER_ANIM_PRESETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="w-full rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-bold py-2 hover:bg-rose-500/25 active:scale-95 transition"
      >🗑 Delete this layer</button>
    </div>
  );
}

/** Mobile drawer panel — flat list of options. */
function MobilePanel({
  drawer,
  overlayPhotoInputRef, overlayGifInputRef,
  handleAddSticker, handleAddText, handleAddShape,
  themeOverrides, setSiteAudio,
  currentPagePatch, patchActivePage, builderTheme,
  overlays, selectedOverlayIdx, setSelectedOverlayIdx, deleteOverlayAt,
  pages, activePage, setActivePage,
}) {
  if (drawer === 'sticker') {
    return (
      <div className="grid grid-cols-7 gap-1 max-h-72 overflow-y-auto pr-1">
        {STICKER_PRESETS.map((e) => (
          <button key={e} type="button" onClick={() => handleAddSticker(e)}
            className="rounded-xl bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-2xl py-1.5 active:scale-90 transition">
            {e}
          </button>
        ))}
      </div>
    );
  }
  if (drawer === 'shape') {
    return (
      <div className="grid grid-cols-4 gap-2">
        {SHAPE_PRESETS.map((s) => (
          <button key={s.value} type="button" onClick={() => handleAddShape(s.value)}
            className="rounded-xl bg-white border border-slate-200 hover:border-brand-400 px-2 py-3 text-[11px] font-bold text-slate-700 active:scale-95">
            <ShapePreview kind={s.value} />
            <span className="block mt-1">{s.label}</span>
          </button>
        ))}
      </div>
    );
  }
  if (drawer === 'text') {
    return (
      <div className="space-y-2">
        <p className="text-[12px] text-slate-600 mb-1">Drop an editable text overlay. Then tap it on the canvas to type.</p>
        <div className="grid grid-cols-2 gap-2">
          {TEXT_EFFECT_PRESETS.map((p) => (
            <button key={p.value} type="button" onClick={() => handleAddText(p.value)}
              className="rounded-xl bg-white border border-slate-200 hover:border-brand-400 px-3 py-2.5 text-[12px] font-bold text-slate-700 active:scale-95">
              ✍️ {p.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (drawer === 'page') {
    const swatches = ['#ffffff','#0f172a','#d946ef','#f43f5e','#f97316','#fbbf24','#10b981','#0ea5e9','#7c3aed'];
    return (
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pages</p>
          <div className="flex flex-wrap gap-1.5">
            {pages.map((p, i) => (
              <button key={p.index ?? i} type="button" onClick={() => setActivePage(i)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${activePage === i ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Text color</p>
          <div className="flex flex-wrap gap-1.5">
            {swatches.map((c) => (
              <button key={c} onClick={() => patchActivePage({ textColor: c })} style={{ background: c }}
                className={`w-7 h-7 rounded-full border-2 ${currentPagePatch.textColor === c ? 'border-brand-500 scale-110' : 'border-white'}`} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Font</p>
          <select
            value={currentPagePatch.fontFamily || ''}
            onChange={(e) => patchActivePage({ fontFamily: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-500 outline-none"
          >
            <option value="">Inherit</option>
            {BUILDER_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.group} — {f.label}</option>)}
          </select>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Filter</p>
          <div className="grid grid-cols-3 gap-1.5">
            {FILTER_PRESETS.map((f) => (
              <button key={f.value} onClick={() => patchActivePage({ pageFilter: f.value })}
                className={`rounded-xl border-2 px-2 py-1.5 text-[11px] font-bold ${(currentPagePatch.pageFilter || 'none') === f.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-700'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {overlays.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Layers on this page</p>
            <div className="space-y-1">
              {overlays.map((b, i) => (
                <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 border ${selectedOverlayIdx === i ? 'bg-brand-50 border-brand-400' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => setSelectedOverlayIdx(i)} className="text-xs font-bold text-slate-800 capitalize">
                    {b.type === 'sticker' ? `${b.emoji} sticker` : b.type === 'text' ? `"${(b.text || '').slice(0, 18)}"` : b.type}
                  </button>
                  <button onClick={() => deleteOverlayAt(i)} className="text-rose-500 text-xs font-bold">×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  if (drawer === 'music') {
    return (
      <div className="space-y-2">
        {MUSIC_LIBRARY.map((t) => {
          const active = themeOverrides.audioUrl === t.url;
          return (
            <button key={t.id} type="button" onClick={() => setSiteAudio(t.url)}
              className={`w-full rounded-2xl border-2 px-3 py-2.5 text-left ${active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">🎵 {t.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">{t.mood}</span>
              </div>
              <audio src={t.url} controls preload="none" className="w-full h-8 mt-1" />
            </button>
          );
        })}
        {themeOverrides.audioUrl && (
          <button onClick={() => setSiteAudio('')} className="w-full btn-ghost !py-2 !text-xs">Remove music</button>
        )}
      </div>
    );
  }
  return null;
}

/** Legacy non-slideshow video template editor (single-video FFmpeg pipeline). */
function LegacyVideoEditor({
  template, cat, catEmoji, customText, setCustomText, mediaUrls, setMediaUrls,
  uploading, generating, error, editId, handleFileUpload, handleGenerate,
}) {
  const removeMedia = (i) => setMediaUrls((p) => p.filter((_, idx) => idx !== i));
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <Link to="/studio" className="btn-ghost !py-2 !text-sm">← Feed</Link>
      </div>
      <div className="glass p-6 sm:p-8 space-y-6">
        <div>
          <span className="badge-pill">{catEmoji} {cat}</span>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {template.name}
          </h1>
          {template.description && <p className="mt-2 text-slate-600 leading-7">{template.description}</p>}
        </div>
        {template.previewVideoUrl && (
          <video src={template.previewVideoUrl} controls className="w-full aspect-video rounded-2xl bg-black" />
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">💬 Custom message</label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Add a message for your video…"
            className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            maxLength={500}
          />
        </div>
        <div className="panel-surface p-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">📸 Photos / Videos</label>
          <div className="flex flex-wrap gap-3 mb-3">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white">
                {url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={url} className="w-20 h-20 object-cover" muted />
                ) : (
                  <img src={url} alt="" className="w-20 h-20 object-cover" />
                )}
                <button type="button" onClick={() => removeMedia(i)}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-pop">×</button>
              </div>
            ))}
          </div>
          <label className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white border border-slate-200 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition text-sm font-semibold text-slate-700">
            <span>{uploading ? '⏳ Uploading…' : '📸 Upload media'}</span>
            <input type="file" accept="image/*,video/*" multiple disabled={uploading} onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">⚠ {error}</p>}
        <div className="flex gap-3 flex-wrap">
          {editId && <Link to="/my-videos" className="btn-ghost">Cancel</Link>}
          <button type="button" onClick={handleGenerate} disabled={generating} className="btn-glow flex-1 sm:flex-none disabled:opacity-60">
            {generating ? '⏳ Generating…' : editId ? '💾 Save & re-render' : '🎬 Generate video'}
          </button>
        </div>
      </div>
    </div>
  );
}
