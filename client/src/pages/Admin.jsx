import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI, videosAPI } from '../api/api';
import { htmlToStructure } from '../lib/htmlTemplate';
import {
  visualBuilderToHtml,
  validateBuilderState,
  defaultVisualBuilderState,
  normalizeBuilderState,
  updateBuilderTextBySlot,
  updateBuilderBlockPositionBySlot,
  FILTER_PRESETS,
  ENTER_ANIM_PRESETS,
  STICKER_PRESETS,
  SHAPE_PRESETS,
  MUSIC_LIBRARY,
  TEXT_EFFECT_PRESETS,
  BUILDER_FONT_OPTIONS,
} from '../lib/visualTemplateBuilder';
import { APP_INPUT_CLASS, APP_SELECT_CLASS, DARK_INPUT_CLASS, DARK_SELECT_CLASS } from '../lib/uiClasses';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { STARTER_TEMPLATES } from '../lib/starterTemplates';
import { StarSticker, DiscoSticker, GiftSticker } from '../ui/CartoonStickers';
import FloatingDecor from '../ui/FloatingDecor';

function ShapePreview({ kind }) {
  const size = 28;
  const fill = '#d946ef';
  switch (kind) {
    case 'circle':
      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={fill} /></svg>;
    case 'pill':
      return <svg width={size} height={size * 0.5} viewBox="0 0 24 12"><rect x="0" y="0" width="24" height="12" rx="6" fill={fill} /></svg>;
    case 'heart':
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 21s-7-4.35-7-10.5C5 7.46 7.46 5 10.5 5c1.5 0 2.86.7 3.7 1.86C15.04 5.7 16.4 5 17.9 5c3.05 0 5.5 2.46 5.5 5.5 0 6.15-7 10.5-7 10.5H12z" fill={fill} transform="translate(-2,0)" /></svg>;
    case 'star':
      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={fill} /></svg>;
    case 'blob':
      return <svg width={size} height={size} viewBox="0 0 200 200"><path d="M44.5,-58.8C57.4,-50.3,67.1,-36.8,71.5,-21.7C75.9,-6.6,75,9.9,68.5,23.2C62,36.4,49.9,46.4,36.6,55.7C23.3,65,8.7,73.5,-7.7,75.6C-24.2,77.7,-42.5,73.5,-54.1,62.6C-65.7,51.6,-70.4,33.9,-71.3,17.3C-72.2,0.8,-69.2,-14.7,-61.6,-27.5C-54,-40.3,-41.8,-50.4,-28.4,-58.2C-15,-66,-0.5,-71.5,12.7,-71.2C25.9,-71,40.6,-67.2,44.5,-58.8Z" transform="translate(100 100)" fill={fill} /></svg>;
    case 'speech':
      return <svg width={size} height={size * 0.8} viewBox="0 0 200 160"><path d="M20,20 H180 a20,20 0 0 1 20,20 V100 a20,20 0 0 1 -20,20 H80 L50,150 V120 H20 a20,20 0 0 1 -20,-20 V40 a20,20 0 0 1 20,-20 z" fill={fill} /></svg>;
    case 'rect':
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="4" fill={fill} /></svg>;
  }
}

export default function Admin() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Memories',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [builderState, setBuilderState] = useState(() => defaultVisualBuilderState());
  const [activePage, setActivePage] = useState(0);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0);
  const [dragMode, setDragMode] = useState(true);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  /** Create flow: 1 = name/category/desc only, 2 = Instagram-style story designer */
  const [createStep, setCreateStep] = useState(1);
  /** Phase 2a additions: undo/redo + Canva-style pickers */
  const [history, setHistory] = useState({ past: [], future: [] });
  const lastSnapshotRef = useRef(null);
  const skipNextHistoryRef = useRef(false);
  const HISTORY_LIMIT = 80;
  /** Open picker key: 'sticker' | 'shape' | 'music' | null */
  const [picker, setPicker] = useState(null);
  const normalizedBuilder = useMemo(() => normalizeBuilderState(builderState), [builderState]);

  const thumbnailPreviewUrl = useMemo(() => {
    if (!thumbnailFile) return null;
    return URL.createObjectURL(thumbnailFile);
  }, [thumbnailFile]);

  const previewStructure = useMemo(
    () => ({
      mode: 'html',
      html: '',
      type: 'slideshow',
      builderState: normalizeBuilderState(builderState),
      deck: {
        pageTimerEnabled: true,
        autoPlay: false,
        pageMode: true,
      },
    }),
    [builderState]
  );

  const builderPreviewError = validateBuilderState(builderState);
  const nameRequiredError = error === 'Please enter a website name.' ? error : '';

  /** Snapshot builderState changes into history (auto). Programmatic undo/redo skips this. */
  useEffect(() => {
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      lastSnapshotRef.current = JSON.stringify(builderState);
      return;
    }
    const snap = JSON.stringify(builderState);
    if (snap === lastSnapshotRef.current) return;
    if (lastSnapshotRef.current != null) {
      const prev = lastSnapshotRef.current;
      setHistory((h) => ({
        past: [...h.past.slice(-(HISTORY_LIMIT - 1)), prev],
        future: [],
      }));
    }
    lastSnapshotRef.current = snap;
  }, [builderState]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (!h.past.length) return h;
      const prevSnap = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(prevSnap));
      return { past: newPast, future: [...h.future, currentSnap].slice(-HISTORY_LIMIT) };
    });
  }, [builderState]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (!h.future.length) return h;
      const nextSnap = h.future[h.future.length - 1];
      const newFuture = h.future.slice(0, -1);
      const currentSnap = JSON.stringify(builderState);
      skipNextHistoryRef.current = true;
      setBuilderState(JSON.parse(nextSnap));
      return { past: [...h.past, currentSnap].slice(-HISTORY_LIMIT), future: newFuture };
    });
  }, [builderState]);

  /** Cmd/Ctrl+Z = undo, Cmd/Ctrl+Shift+Z = redo. Skip when typing in inputs/contenteditable. */
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e) => {
      const inEditable =
        e.target?.matches?.('input, textarea, select, [contenteditable], [contenteditable="true"]');
      if (inEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'z') return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [formOpen, undo, redo]);

  const addStickerQuick = (emoji) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = { type: 'sticker', emoji: emoji || '✨', size: 88, enterAnimation: 'pop' };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  const addCountdownQuick = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    // Default: 7 days from now in local time, formatted as datetime-local string
    const t = new Date(Date.now() + 7 * 86400 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const targetLocal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
    const block = {
      type: 'countdown',
      targetISO: new Date(targetLocal).toISOString(),
      title: 'Counting down to',
      style: 'card',
      accentColor: '#d946ef',
      enterAnimation: 'pop',
    };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const addShapeQuick = (kind) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const block = {
      type: 'shape',
      shapeKind: kind || 'rect',
      width: kind === 'pill' ? 220 : 160,
      height: kind === 'pill' ? 64 : 160,
      fillColor: '#d946ef',
      strokeColor: 'transparent',
      strokeWidth: 0,
      opacity: 1,
      enterAnimation: 'zoom',
    };
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
    setPicker(null);
  };

  /** Canvas resize/rotate commits (Admin operates on builderState). */
  const handleResizeCommit = useCallback((slot, w, h) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const page = n.pages[pageIdx];
      if (!page) return prev;
      const blocks = [...(page.blocks || [])];
      const b = blocks[blockIdx];
      if (!b) return prev;
      const patch = { ...b, width: w, height: h };
      if (b.type === 'sticker') patch.size = Math.max(20, Math.min(240, Math.round(Math.max(w, h))));
      blocks[blockIdx] = patch;
      const pages = [...n.pages];
      pages[pageIdx] = { ...page, blocks };
      return { ...n, pages };
    });
  }, []);

  const handleRotateCommit = useCallback((slot, deg) => {
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot || ''));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      const page = n.pages[pageIdx];
      if (!page) return prev;
      const blocks = [...(page.blocks || [])];
      const b = blocks[blockIdx];
      if (!b) return prev;
      blocks[blockIdx] = { ...b, rotateDeg: deg };
      const pages = [...n.pages];
      pages[pageIdx] = { ...page, blocks };
      return { ...n, pages };
    });
  }, []);

  const handleAdminSelectionChange = useCallback((slot) => {
    if (!slot) return;
    const m = /^p(\d+)_b(\d+)$/.exec(String(slot));
    if (!m) return;
    const pageIdx = Number(m[1]) - 1;
    const blockIdx = Number(m[2]);
    if (pageIdx !== activePage) setActivePage(pageIdx);
    setSelectedBlockIndex(blockIdx);
  }, [activePage]);

  const selectedSlotForCanvas = useMemo(() => {
    return `p${activePage + 1}_b${selectedBlockIndex}`;
  }, [activePage, selectedBlockIndex]);

  const setGlobalMusic = (url) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, theme: { ...n.theme, audioUrl: url || '' } };
    });
    setPicker(null);
  };
  const clearGlobalMusic = () => setGlobalMusic('');

  useEffect(() => {
    return () => {
      if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl);
    };
  }, [thumbnailPreviewUrl]);

  const loadTemplates = () => {
    adminAPI.getTemplates().then(setTemplates).catch(() => setTemplates([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  /** Modal mode: 'starters' = show full gallery, 'blank' = blank-only quick form. */
  const [creationMode, setCreationMode] = useState('starters');

  const openCreate = (mode = 'starters') => {
    setEditing(null);
    setForm({ name: '', category: 'Memories', description: '' });
    setThumbnailFile(null);
    setBuilderState(defaultVisualBuilderState());
    setActivePage(0);
    setSelectedBlockIndex(0);
    setCreateStep(1);
    setPickedStarterId(null);
    setCreationMode(mode);
    setFormOpen(true);
    setError('');
  };

  const openCreateBlank = () => openCreate('blank');
  const openCreateWithStarters = () => openCreate('starters');

  const openEdit = (t) => {
    setEditing(t);
    setThumbnailFile(null);
    setCreateStep(2);
    const s = t.structure;
    const isHtml = s && typeof s === 'object' && s.mode === 'html' && typeof s.html === 'string';
    setForm({
      name: t.name,
      category: t.category,
      description: t.description || '',
    });
    if (isHtml && s.builderState && typeof s.builderState === 'object') {
      setBuilderState(normalizeBuilderState(s.builderState));
    } else {
      setBuilderState(defaultVisualBuilderState());
    }
    setActivePage(0);
    setSelectedBlockIndex(0);
    setFormOpen(true);
    setError('');
  };

  useEffect(() => {
    if (activePage >= normalizedBuilder.pages.length) setActivePage(Math.max(0, normalizedBuilder.pages.length - 1));
  }, [activePage, normalizedBuilder.pages.length]);

  useEffect(() => {
    const blocks = normalizedBuilder.pages[activePage]?.blocks || [];
    if (selectedBlockIndex >= blocks.length) setSelectedBlockIndex(Math.max(0, blocks.length - 1));
  }, [normalizedBuilder, activePage, selectedBlockIndex]);

  const setPageAt = (pageIndex, nextPage) => {
    const pages = [...normalizedBuilder.pages];
    pages[pageIndex] = nextPage;
    setBuilderState({ ...normalizedBuilder, pages });
  };

  const patchPage = (pageIndex, patch) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    setPageAt(pageIndex, { ...page, ...patch });
  };

  const patchScheduledReveal = (patch) => {
    setBuilderState((prev) => {
      const n = normalizeBuilderState(prev);
      return { ...n, scheduledReveal: { ...n.scheduledReveal, ...patch } };
    });
  };

  const addPageQuick = () => {
    const pages = [...normalizedBuilder.pages];
    const nextPageIndex = pages.length;
    pages.push({
      id: `p_${Date.now()}`,
      pageTitle: `Page ${nextPageIndex + 1}`,
      pageDurationMs: '',
      pageBackground: '',
      blocks: [{ type: 'text', text: 'New page' }],
    });
    setBuilderState({ ...normalizedBuilder, pages });
    setActivePage(nextPageIndex);
    setSelectedBlockIndex(0);
  };

  const addBlockQuick = (kind) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    let block = { type: 'text', text: 'Text' };
    if (kind === 'text') block = { type: 'text', text: 'Type your text' };
    if (kind === 'heading') block = { type: 'heading', text: 'Heading' };
    if (kind === 'gallery') block = { type: 'gallery', count: 6, slotPrefix: `gal${activePage + 1}`, galleryAnimation: 'fade', photoDurationMs: 1200 };
    if (kind === 'image') block = { type: 'image', slotKey: 'photo', label: 'Photo', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'gif') block = { type: 'gif', slotKey: 'gif', label: 'GIF', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'video') block = { type: 'video', slotKey: 'video', label: 'Video', defaultUrl: '', mediaFit: 'cover', mediaRadius: 12, mediaShadow: true };
    if (kind === 'music') {
      const track = window.prompt('Song name or URL (optional):', '') || 'Music';
      block = { type: 'subheading', text: `🎵 ${track}` };
    }
    if (kind === 'button') {
      const targetRaw = window.prompt(`Go to which page? (1 - ${normalizedBuilder.pages.length})`, String(Math.min(activePage + 2, normalizedBuilder.pages.length)));
      const target = Number(targetRaw);
      block = { type: 'button', label: 'Tap', navPage: Number.isFinite(target) && target > 0 ? target : 1, buttonStyle: 'stable' };
    }
    const blocks = [...(page.blocks || []), block];
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(blocks.length - 1);
  };

  const updateSelectedBlock = (patch) => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const current = blocks[selectedBlockIndex];
    if (!current) return;
    blocks[selectedBlockIndex] = { ...current, ...patch };
    setPageAt(activePage, { ...page, blocks });
  };

  const addUploadedMediaBlock = async (file, mediaType) => {
    if (!file) return;
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      const page = normalizedBuilder.pages[activePage];
      if (!page) return;
      const block = {
        type: mediaType,
        slotKey: mediaType === 'gif' ? 'gif' : mediaType === 'video' ? 'video' : 'photo',
        label: mediaType === 'gif' ? 'GIF' : mediaType === 'video' ? 'Video' : 'Photo',
        defaultUrl: url,
        mediaFit: 'cover',
        mediaRadius: 12,
        mediaShadow: true,
      };
      const blocks = [...(page.blocks || []), block];
      setPageAt(activePage, { ...page, blocks });
      setSelectedBlockIndex(blocks.length - 1);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadingAsset(false);
    }
  };

  const removeSelectedBlock = () => {
    const page = normalizedBuilder.pages[activePage];
    if (!page) return;
    const blocks = (page.blocks || []).filter((_, i) => i !== selectedBlockIndex);
    setPageAt(activePage, { ...page, blocks });
    setSelectedBlockIndex(Math.max(0, selectedBlockIndex - 1));
  };

  /** ── Layer ops ───────────────────────────────────────── */
  const toggleBlockField = (pageIndex, idx, field) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const b = blocks[idx];
    if (!b) return;
    blocks[idx] = { ...b, [field]: !b[field] };
    setPageAt(pageIndex, { ...page, blocks });
  };

  const reorderBlock = (pageIndex, fromIdx, toIdx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    if (fromIdx < 0 || fromIdx >= blocks.length) return;
    if (toIdx < 0 || toIdx >= blocks.length) return;
    const [moved] = blocks.splice(fromIdx, 1);
    blocks.splice(toIdx, 0, moved);
    setPageAt(pageIndex, { ...page, blocks });
    setSelectedBlockIndex(toIdx);
  };

  const duplicateBlockAt = (pageIndex, idx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const src = blocks[idx];
    if (!src) return;
    const copy = JSON.parse(JSON.stringify(src));
    if (Number.isFinite(Number(copy.x))) copy.x = Number(copy.x) + 24;
    if (Number.isFinite(Number(copy.y))) copy.y = Number(copy.y) + 24;
    blocks.splice(idx + 1, 0, copy);
    setPageAt(pageIndex, { ...page, blocks });
    setSelectedBlockIndex(idx + 1);
  };

  const deleteBlockAt = (pageIndex, idx) => {
    const page = normalizedBuilder.pages[pageIndex];
    if (!page) return;
    const blocks = (page.blocks || []).filter((_, i) => i !== idx);
    setPageAt(pageIndex, { ...page, blocks });
    if (selectedBlockIndex >= blocks.length) {
      setSelectedBlockIndex(Math.max(0, blocks.length - 1));
    }
  };

  /** ── Starter templates ──────────────────────────────── */
  const [starterPickerOpen, setStarterPickerOpen] = useState(false);
  /** When creating a NEW website, this holds the user's currently-picked starter (null = blank canvas). */
  const [pickedStarterId, setPickedStarterId] = useState(null);

  const loadStarterTemplate = (id) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setForm((f) => ({
      ...f,
      name: f.name || tpl.name,
      category: tpl.category || f.category,
      description: f.description || tpl.description,
    }));
    skipNextHistoryRef.current = false;
    setBuilderState(normalizeBuilderState(tpl.builderState));
    setActivePage(0);
    setSelectedBlockIndex(0);
    setStarterPickerOpen(false);
  };

  /** Pick (but don't load yet) — just stages the choice and pre-fills the name. */
  const pickStarter = (id) => {
    setPickedStarterId(id);
    if (!id) {
      // Blank canvas
      return;
    }
    const tpl = STARTER_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    setForm((f) => ({
      name: f.name || tpl.name,
      category: tpl.category || f.category || 'Memories',
      description: f.description || tpl.description || '',
    }));
  };

  /** Called by the new-website modal "Continue" button. */
  const commitStarterAndContinue = () => {
    if (!form.name.trim()) {
      setError('Please enter a website name.');
      return;
    }
    setError('');
    if (pickedStarterId) {
      const tpl = STARTER_TEMPLATES.find((t) => t.id === pickedStarterId);
      if (tpl) {
        skipNextHistoryRef.current = false;
        setBuilderState(normalizeBuilderState(tpl.builderState));
      }
    } else {
      // Blank canvas — start from default builder state
      skipNextHistoryRef.current = false;
      setBuilderState(defaultVisualBuilderState());
    }
    setActivePage(0);
    setSelectedBlockIndex(0);
    setPickedStarterId(null);
    setCreateStep(2);
  };

  const uploadGalleryPhotoAt = async (slotIndex, file) => {
    if (!file) return;
    const block = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex];
    if (!block || block.type !== 'gallery') return;
    const prefix = block.slotPrefix || 'gal';
    const key = `${prefix}_${slotIndex}`;
    setUploadingAsset(true);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      const defaults = { ...(block.galleryDefaults || {}), [key]: url };
      updateSelectedBlock({ galleryDefaults: defaults });
    } catch (err) {
      setError(err.message || 'Gallery upload failed');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formSubmitting) return;
    setError('');
    setSuccess('');

    const vErr = validateBuilderState(builderState);
    if (vErr) {
      setError(vErr);
      return;
    }
    const htmlFromBuilder = visualBuilderToHtml(builderState);
    let structurePayload;
    try {
      structurePayload = htmlToStructure(htmlFromBuilder);
      structurePayload.builderState = normalizeBuilderState(builderState);
    } catch (err) {
      setError(err.message || 'Could not build website from the visual design');
      return;
    }

    setFormSubmitting(true);
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('structure', JSON.stringify(structurePayload));
    formData.append('duration', '10');
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      if (editing) {
        await adminAPI.updateTemplate(editing._id, formData);
        setSuccess('Website saved.');
      } else {
        await adminAPI.createTemplate(formData);
        setSuccess('Website created.');
      }
      setFormOpen(false);
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    setError('');
    try {
      await adminAPI.publishTemplate(id);
      setSuccess('Website is live in the gallery.');
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed');
    }
  };

  const executeDeleteTemplate = async () => {
    if (!deleteConfirmId) return;
    setDeleteLoading(true);
    setError('');
    try {
      await adminAPI.deleteTemplate(deleteConfirmId);
      setSuccess('Website removed.');
      setDeleteConfirmId(null);
      loadTemplates();
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong rounded-[2rem] p-8 mb-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid-soft opacity-30 pointer-events-none" />
        <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.40) 0%, transparent 60%)', filter: 'blur(50px)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 60%)', filter: 'blur(50px)' }} />

        {/* Cartoon accents in the studio header */}
        <motion.div
          className="hidden md:block absolute top-4 right-1/3 z-10"
          animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <GiftSticker size={56} />
        </motion.div>
        <motion.div
          className="hidden lg:block absolute top-8 right-12 z-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
          <DiscoSticker size={64} />
        </motion.div>
        <motion.div
          className="hidden md:block absolute bottom-6 right-1/4 z-10"
          animate={{ scale: [1, 1.25, 1], rotate: [0, 18, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <StarSticker size={40} />
        </motion.div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow"><span>Admin studio</span></span>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.05]">
              <span className="text-white">Build the </span>
              <span className="gradient-text animate-gradient">story.</span>
            </h1>
            <p className="mt-4 text-slate-300 leading-7 max-w-xl">
              Manage templates, publish campaigns, and design story-driven pages from one beautiful studio.
            </p>
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreateBlank}
            className="btn-glow !py-3.5 !px-6"
          >
            ✨ New website
          </motion.button>
        </div>
      </motion.div>

      <div className={`grid gap-6 items-start ${formOpen && (editing || createStep === 2) ? 'lg:grid-cols-1' : 'lg:grid-cols-[0.95fr_1.1fr]'}`}>
        <section className={`glass-strong rounded-[2rem] p-6 ${formOpen && (editing || createStep === 2) ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Template library</h2>
              <p className="text-sm text-slate-400">Your published and draft websites in one place.</p>
            </div>
            <div className="badge-pill badge-brand">
              {templates.length} templates
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-[1.5rem] bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No templates yet. Click “New website” to get started.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 auto-rows-min gap-4">
              {templates.map((t) => (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -3 }}
                  className={`group rounded-[1.5rem] border overflow-hidden shadow-popSoft transition ${
                    editing?._id === t._id ? 'border-brand-400 ring-2 ring-brand-400/30' : 'border-slate-200 bg-white hover:border-brand-300'
                  }`}
                >
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-brand-200 via-peach-200 to-sunset-400/40 overflow-hidden">
                    {t.thumbnailUrl ? (
                      <img src={t.thumbnailUrl} alt="" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎬</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                    <span className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[10px] uppercase tracking-wider font-bold border backdrop-blur ${
                      t.published
                        ? 'bg-emerald-500/85 border-emerald-300 text-white'
                        : 'bg-white/85 border-white/70 text-slate-700'
                    }`}>
                      {t.published ? '🟢 Live' : '📝 Draft'}
                    </span>
                    <h3 className="absolute inset-x-3 bottom-2 font-display font-extrabold text-white text-lg drop-shadow truncate">
                      {t.name}
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-3">{t.category}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="btn-glow flex-1 !py-2 !px-3 !text-xs"
                      >
                        ✏️ Edit
                      </button>
                      {!t.published && (
                        <button
                          onClick={() => handlePublish(t._id)}
                          className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition active:scale-95"
                          style={{
                            background: 'linear-gradient(120deg, rgba(16,185,129,0.18), rgba(16,185,129,0.10))',
                            color: '#10B981',
                            border: '1px solid rgba(16,185,129,0.45)',
                          }}
                        >
                          🚀 Publish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(t._id)}
                        aria-label={`Delete ${t.name}`}
                        title="Delete template"
                        className="inline-flex items-center justify-center gap-1 rounded-full px-3 py-2 text-xs font-bold transition active:scale-95"
                        style={{
                          background: 'linear-gradient(120deg, rgba(244,63,94,0.16), rgba(244,63,94,0.08))',
                          color: '#F43F5E',
                          border: '1px solid rgba(244,63,94,0.40)',
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="glass-strong rounded-[2rem] p-6 min-h-[660px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold text-white">Editor panel</h2>
              <p className="text-sm text-slate-400">Build or edit the selected website in the story-driven editor.</p>
            </div>
            <button
              type="button"
              onClick={openCreateBlank}
              className="btn-pill-soft"
            >
              ✨ Start new website
            </button>
          </div>

          {!formOpen ? (
            <div className="relative flex h-full min-h-[420px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 p-8 text-center overflow-hidden"
              style={{ background: 'radial-gradient(circle at 30% 20%, rgba(168,85,247,0.15), transparent 60%), radial-gradient(circle at 80% 80%, rgba(6,182,212,0.12), transparent 60%), rgba(11,15,25,0.45)' }}
            >
              <div className="text-6xl mb-4 drop-shadow-[0_8px_20px_rgba(168,85,247,0.6)]">🎨</div>
              <p className="font-display text-2xl font-extrabold text-white">Ready to build something?</p>
              <p className="mt-2 text-sm text-slate-300 max-w-md leading-7">
                Pick a template from the left or start a fresh website. You can also load one of our ready-made starters.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={openCreateBlank}
                  className="btn-glow !py-2.5 !text-sm"
                >
                  ✨ Create new website
                </button>
                <button
                  type="button"
                  onClick={openCreateWithStarters}
                  className="btn-ghost !py-2.5 !text-sm"
                >
                  🪄 Use a starter
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {error && !nameRequiredError && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
              {success && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p>}

              {!editing && createStep === 1 && (
                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950/95 via-slate-900/80 to-brand-950/90 p-6 shadow-[0_24px_80px_-45px_rgba(15,23,42,0.35)] text-white">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-brand-300/70">Mood board</p>
                        <h3 className="text-2xl font-semibold">Create a vibe-forward template</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStarterPickerOpen(true)}
                        className="rounded-full bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 transition active:scale-95"
                      >
                        ✨ Use a starter
                      </button>
                    </div>
                    <p className="mt-4 max-w-xl text-slate-300">
                      Give your website a catchy name, choose a mood, and add a visual thumbnail — or skip ahead and start from a pre-made template.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Website name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${APP_INPUT_CLASS}`}
                        placeholder="Your campaign title"
                        required
                      />
                      {nameRequiredError && <p className="mt-2 text-xs text-rose-600">{nameRequiredError}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-700 mb-2">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className={`rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${APP_SELECT_CLASS}`}
                      >
                        {['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Description</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className={`rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm ${APP_INPUT_CLASS}`}
                        placeholder="What makes this page special?"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-slate-700 mb-2">Thumbnail</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-brand-500/10 file:text-brand-700"
                      />
                      {thumbnailPreviewUrl && (
                        <img
                          src={thumbnailPreviewUrl}
                          alt=""
                          className="mt-3 h-24 w-32 rounded-3xl object-cover border border-slate-200"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {(editing || createStep === 2) && (
                <div className="tpl-editor-shell relative isolate flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                  <div className="pointer-events-none absolute inset-0" style={{ zIndex: -1 }}>
                    <FloatingDecor density="subtle" opacity={0.08} size={36} />
                  </div>
                  {/* Top Toolbar */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3 gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate max-w-[16ch]">{form.name || 'Untitled'}</p>
                        <p className="text-xs text-slate-400">Page {activePage + 1} of {normalizedBuilder.pages.length}</p>
                      </div>
                      <div className="flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
                        <button
                          type="button"
                          title="Undo (Ctrl+Z)"
                          disabled={!history.past.length}
                          onClick={undo}
                          className="rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 px-2.5 py-2 text-xs text-slate-200 transition"
                        >↶ Undo</button>
                        <button
                          type="button"
                          title="Redo (Ctrl+Shift+Z)"
                          disabled={!history.future.length}
                          onClick={redo}
                          className="rounded-lg bg-white/5 hover:bg-white/15 disabled:opacity-30 px-2.5 py-2 text-xs text-slate-200 transition"
                        >↷ Redo</button>
                      </div>
                      <div className="flex items-center gap-1 border-l border-white/10 pl-3 ml-1">
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
                          title={normalizedBuilder.theme?.audioUrl ? 'Music: ON' : 'Music: off'}
                        >🎵 {normalizedBuilder.theme?.audioUrl ? 'Music ✓' : 'Music'}</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">
                        <input type="checkbox" checked={dragMode} onChange={(e) => setDragMode(e.target.checked)} />
                        <span>Drag mode</span>
                      </label>
                      <button
                        type="button"
                        disabled={!normalizedBuilder.pages[activePage]?.blocks?.length}
                        onClick={removeSelectedBlock}
                        className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <div className="w-px h-6 bg-white/10 mx-1" />
                      <button
                        type="button"
                        disabled={formSubmitting}
                        onClick={() => { setFormOpen(false); setCreateStep(1); setEditing(null); }}
                        className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={formSubmitting}
                        onClick={() => handleSubmit({ preventDefault: () => {} })}
                        className="rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg hover:opacity-95 active:scale-95 disabled:opacity-60"
                      >
                        {formSubmitting ? 'Saving…' : editing ? '💾 Save' : '🚀 Publish'}
                      </button>
                    </div>
                  </div>

                  {/* Pickers — Sticker / Shape / Music */}
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
                          <p className="text-xs uppercase tracking-widest text-slate-400">Pick a sticker</p>
                          <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-9 sm:grid-cols-12 gap-1.5 max-h-44 overflow-y-auto">
                          {STICKER_PRESETS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => addStickerQuick(e)}
                              className="rounded-lg bg-white/5 hover:bg-brand-500/30 text-2xl py-1.5 transition active:scale-90"
                              title={e}
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
                          <p className="text-xs uppercase tracking-widest text-slate-400">Add a shape</p>
                          <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                          {SHAPE_PRESETS.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => addShapeQuick(s.value)}
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
                          <p className="text-xs uppercase tracking-widest text-slate-400">Background music (whole site)</p>
                          <div className="flex items-center gap-2">
                            {normalizedBuilder.theme?.audioUrl && (
                              <button type="button" onClick={clearGlobalMusic} className="text-xs text-rose-300 hover:text-rose-200">Remove</button>
                            )}
                            <button type="button" onClick={() => setPicker(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {MUSIC_LIBRARY.map((t) => {
                            const active = normalizedBuilder.theme?.audioUrl === t.url;
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => setGlobalMusic(t.url)}
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
                        <div className="mt-3">
                          <label className="block text-xs text-slate-400 mb-1">Or paste an https URL</label>
                          <input
                            type="url"
                            placeholder="https://…/song.mp3"
                            defaultValue={normalizedBuilder.theme?.audioUrl || ''}
                            onBlur={(e) => setGlobalMusic(e.target.value.trim())}
                            className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main Content Area */}
                  <div className="flex flex-1 overflow-hidden gap-4 p-4">
                    {/* Left Sidebar - Elements & Layers */}
                    <div className="w-48 flex flex-col gap-4 overflow-y-auto border-r border-white/10 pr-3">
                      {/* Templates/Elements Section */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Add Elements</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: '📝 Text', kind: 'text' },
                            { label: '📌 Heading', kind: 'heading' },
                            { label: '🖼️ Gallery', kind: 'gallery' },
                            { label: '🎬 GIF', kind: 'gif' },
                            { label: '🔘 Button', kind: 'button' },
                          ].map(({ label, kind }) => (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => addBlockQuick(kind)}
                              className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                            >
                              {label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setPicker('sticker')}
                            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            😎 Stickers
                          </button>
                          <button
                            type="button"
                            onClick={() => setPicker('shape')}
                            className="rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            ⬢ Shapes
                          </button>
                          <button
                            type="button"
                            onClick={addCountdownQuick}
                            className="col-span-2 rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition"
                          >
                            ⏱ Countdown
                          </button>
                        </div>
                      </div>

                      {/* Media Upload */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Media</h4>
                        <div className="space-y-2">
                          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                            📸 Photo
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                addUploadedMediaBlock(f, 'image');
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-slate-900 px-2 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:border-brand-400 transition">
                            🎥 Video
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                addUploadedMediaBlock(f, 'video');
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Pages/Layers */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Pages</h4>
                        <div className="flex flex-wrap gap-2">
                          {normalizedBuilder.pages.map((p, i) => (
                            <button
                              key={p.id || i}
                              type="button"
                              onClick={() => setActivePage(i)}
                              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                                activePage === i ? 'bg-brand-500 text-slate-950' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={addPageQuick}
                            className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-semibold text-brand-200 hover:bg-brand-500/20"
                          >
                            + Page
                          </button>
                        </div>
                      </div>

                      {/* Layers / Blocks List */}
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Layers</h4>
                          <div className="space-y-1.5">
                            {normalizedBuilder.pages[activePage].blocks.map((b, i) => {
                              const total = normalizedBuilder.pages[activePage].blocks.length;
                              const active = selectedBlockIndex === i;
                              return (
                                <div
                                  key={`${b.type}-${i}`}
                                  className={`group rounded-lg transition ${active ? 'bg-brand-500/20 ring-1 ring-brand-400' : 'bg-slate-800/40 hover:bg-slate-800/70'}`}
                                >
                                  <div className="flex items-center gap-1 px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedBlockIndex(i)}
                                      className={`flex-1 text-left text-[11px] font-semibold transition ${active ? 'text-white' : 'text-slate-300'} ${b.hidden ? 'opacity-40' : ''}`}
                                    >
                                      <span className="inline-block w-3 mr-1">{b.locked ? '🔒' : ''}</span>
                                      <span className="capitalize">{b.type}</span> {i + 1}
                                      {b.type === 'sticker' && b.emoji && <span className="ml-1">{b.emoji}</span>}
                                      {b.type === 'text' && b.text && <span className="ml-1 text-slate-400">"{b.text.slice(0, 14)}"</span>}
                                    </button>
                                    <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition">
                                      <button
                                        type="button"
                                        title="Move up"
                                        disabled={i === 0}
                                        onClick={() => reorderBlock(activePage, i, i - 1)}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300 disabled:opacity-20"
                                      >▲</button>
                                      <button
                                        type="button"
                                        title="Move down"
                                        disabled={i === total - 1}
                                        onClick={() => reorderBlock(activePage, i, i + 1)}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300 disabled:opacity-20"
                                      >▼</button>
                                      <button
                                        type="button"
                                        title={b.hidden ? 'Show' : 'Hide'}
                                        onClick={() => toggleBlockField(activePage, i, 'hidden')}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300"
                                      >{b.hidden ? '🙈' : '👁'}</button>
                                      <button
                                        type="button"
                                        title={b.locked ? 'Unlock' : 'Lock'}
                                        onClick={() => toggleBlockField(activePage, i, 'locked')}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300"
                                      >{b.locked ? '🔓' : '🔒'}</button>
                                      <button
                                        type="button"
                                        title="Duplicate"
                                        onClick={() => duplicateBlockAt(activePage, i)}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-white/15 text-slate-300"
                                      >📋</button>
                                      <button
                                        type="button"
                                        title="Delete"
                                        onClick={() => deleteBlockAt(activePage, i)}
                                        className="w-5 h-5 rounded text-[10px] hover:bg-red-500/40 text-rose-300"
                                      >×</button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Center Canvas */}
                    <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                      <div className="flex-1 rounded-xl border border-white/10 bg-black overflow-hidden shadow-2xl">
                        {builderPreviewError ? (
                          <div className="p-6 text-sm text-amber-300 flex items-center justify-center h-full">{builderPreviewError}</div>
                        ) : (
                          <SlideshowBuilder
                            structure={previewStructure}
                            fills={{}}
                            editable
                            dragMode={dragMode}
                            activeIndex={activePage}
                            onActiveIndexChange={setActivePage}
                            onTextSlotCommit={(slot, text) =>
                              setBuilderState((prev) => updateBuilderTextBySlot(prev, slot, text))
                            }
                            onBlockMoveCommit={(slot, x, y) =>
                              setBuilderState((prev) => updateBuilderBlockPositionBySlot(prev, slot, x, y))
                            }
                            selectedSlot={selectedSlotForCanvas}
                            onSelectionChange={handleAdminSelectionChange}
                            onResizeCommit={handleResizeCommit}
                            onRotateCommit={handleRotateCommit}
                            className="w-full h-full [&_.html-deck-root]:h-full [&_.html-deck-root]:min-h-full"
                          />
                        )}
                      </div>
                      <p className="text-center text-xs text-slate-500">Click any block to select • Drag corners to resize • Top handle to rotate (hold Shift for 15°)</p>
                    </div>

                    {/* Right Sidebar - Properties */}
                    <div className="w-60 flex flex-col gap-4 overflow-y-auto border-l border-white/10 pl-3">
                      {editing && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Campaign Info</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Name</label>
                              <input
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Thumbnail</label>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                className="w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-200"
                              />
                              {(thumbnailPreviewUrl || editing?.thumbnailUrl) && (
                                <img
                                  src={thumbnailPreviewUrl || editing?.thumbnailUrl}
                                  alt=""
                                  className="mt-2 h-16 w-24 rounded-lg border border-white/10 object-cover"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Page Settings */}
                      <div>
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Page Settings</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Title</label>
                            <input
                              value={normalizedBuilder.pages[activePage]?.pageTitle || ''}
                              onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })}
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              placeholder="Page title"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Duration (sec)</label>
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={
                                normalizedBuilder.pages[activePage]?.pageDurationMs === '' ||
                                normalizedBuilder.pages[activePage]?.pageDurationMs == null
                                  ? ''
                                  : Math.round(Number(normalizedBuilder.pages[activePage]?.pageDurationMs) / 1000)
                              }
                              onChange={(e) =>
                                patchPage(activePage, {
                                  pageDurationMs:
                                    e.target.value === '' ? '' : Math.min(120000, Math.max(0, Number(e.target.value) * 1000)),
                                })
                              }
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Background</label>
                            <input
                              value={normalizedBuilder.pages[activePage]?.pageBackground || ''}
                              onChange={(e) => patchPage(activePage, { pageBackground: e.target.value })}
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              placeholder="#1a1a1a"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Selected Block Properties */}
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <div>
                          <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Block Properties</h4>
                          <div className="space-y-3">
                            {'text' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Text</label>
                                <textarea
                                  rows={3}
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.text || ''}
                                  onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  placeholder="Edit text"
                                />
                              </div>
                            )}
                            {'label' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Label</label>
                                <input
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.label || ''}
                                  onChange={(e) => updateSelectedBlock({ label: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  placeholder="Button label"
                                />
                              </div>
                            )}
                            {'navPage' in (normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex] || {}) && (
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Navigate to Page</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={normalizedBuilder.pages.length}
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.navPage ?? 1}
                                  onChange={(e) => updateSelectedBlock({ navPage: Number(e.target.value) || 1 })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                />
                              </div>
                            )}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'gallery' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Photo Count</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={12}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.count ?? 4}
                                    onChange={(e) => updateSelectedBlock({ count: Math.min(12, Math.max(1, Number(e.target.value) || 4)) })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Animation</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.galleryAnimation || 'fade'}
                                    onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    <option value="fade">Fade</option>
                                    <option value="zoom">Zoom</option>
                                    <option value="slide">Slide up</option>
                                    <option value="lanes">Lanes</option>
                                    <option value="autoVertical">Auto vertical</option>
                                  </select>
                                </div>
                              </>
                            )}
                            {['image', 'gif', 'video', 'gallery'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <>
                                {['image', 'gif', 'video'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Fit</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.mediaFit || 'cover'}
                                      onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="cover">Cover</option>
                                      <option value="contain">Contain</option>
                                      <option value="fill">Fill</option>
                                    </select>
                                  </div>
                                )}
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">📷 Filter</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.imageFilter || 'none'}
                                    onChange={(e) => updateSelectedBlock({ imageFilter: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    {FILTER_PRESETS.map((f) => (
                                      <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                  </select>
                                </div>
                                {/* Brightness / Contrast / Saturation */}
                                {[
                                  { key: 'brightness', label: '☀ Brightness' },
                                  { key: 'contrast',   label: '◐ Contrast' },
                                  { key: 'saturation', label: '🎨 Saturation' },
                                ].map(({ key, label }) => {
                                  const cur = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.[key] ?? 100;
                                  return (
                                    <div key={key}>
                                      <label className="block text-xs text-slate-400 mb-1">{label}: {Math.round(cur)}%</label>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="range" min={0} max={300}
                                          value={cur}
                                          onChange={(e) => updateSelectedBlock({ [key]: Number(e.target.value) })}
                                          className="w-full"
                                        />
                                        <button
                                          type="button"
                                          title="Reset"
                                          onClick={() => updateSelectedBlock({ [key]: 100 })}
                                          className="rounded bg-white/5 hover:bg-white/15 text-slate-300 text-[10px] px-1.5 py-0.5"
                                        >↺</button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>
                            )}

                            {/* Sticker props */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'sticker' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Emoji</label>
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.emoji || ''}
                                    onChange={(e) => updateSelectedBlock({ emoji: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xl text-white text-center ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Size: {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.size || 64}px</label>
                                  <input
                                    type="range" min={20} max={240}
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.size || 64}
                                    onChange={(e) => updateSelectedBlock({ size: Number(e.target.value) })}
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}

                            {/* Shape props */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'shape' && (
                              <>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Kind</label>
                                  <select
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.shapeKind || 'rect'}
                                    onChange={(e) => updateSelectedBlock({ shapeKind: e.target.value })}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                  >
                                    {SHAPE_PRESETS.map((s) => (
                                      <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Fill color</label>
                                  <input
                                    type="color"
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fillColor || '#d946ef'}
                                    onChange={(e) => updateSelectedBlock({ fillColor: e.target.value })}
                                    className="w-full h-9 rounded-lg border border-white/10 bg-slate-900"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">W</label>
                                    <input
                                      type="number" min={20} max={800}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.width || 160}
                                      onChange={(e) => updateSelectedBlock({ width: Number(e.target.value) || 160 })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">H</label>
                                    <input
                                      type="number" min={20} max={800}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.height || 160}
                                      onChange={(e) => updateSelectedBlock({ height: Number(e.target.value) || 160 })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Opacity: {Math.round((normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.opacity ?? 1) * 100)}%</label>
                                  <input
                                    type="range" min={0} max={100}
                                    value={Math.round((normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.opacity ?? 1) * 100)}
                                    onChange={(e) => updateSelectedBlock({ opacity: Number(e.target.value) / 100 })}
                                    className="w-full"
                                  />
                                </div>
                              </>
                            )}

                            {/* Countdown block properties */}
                            {normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type === 'countdown' && (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">⏱ Target date & time</label>
                                  <input
                                    type="datetime-local"
                                    value={(() => {
                                      const iso = normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.targetISO;
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
                                      if (!v) { updateSelectedBlock({ targetISO: '' }); return; }
                                      try { updateSelectedBlock({ targetISO: new Date(v).toISOString() }); } catch {}
                                    }}
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Title</label>
                                  <input
                                    value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.title || ''}
                                    onChange={(e) => updateSelectedBlock({ title: e.target.value })}
                                    placeholder="Counting down to"
                                    className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Style</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.style || 'card'}
                                      onChange={(e) => updateSelectedBlock({ style: e.target.value })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="minimal">Minimal</option>
                                      <option value="card">Card</option>
                                      <option value="mega">Mega</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-slate-400 mb-1">Accent</label>
                                    <input
                                      type="color"
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.accentColor || '#d946ef'}
                                      onChange={(e) => updateSelectedBlock({ accentColor: e.target.value })}
                                      className="w-full h-9 rounded-lg border border-white/10 bg-slate-900"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Text effects (text/heading/subheading) */}
                            {['text','heading','subheading'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.type) && (
                              <div className="border-t border-white/5 pt-3 space-y-2">
                                <label className="block text-xs text-slate-400 mb-1">🅰 Text effect</label>
                                <select
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textEffect || 'none'}
                                  onChange={(e) => updateSelectedBlock({ textEffect: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                >
                                  {TEXT_EFFECT_PRESETS.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                  ))}
                                </select>
                                {['gradient','neon','glow','stroke'].includes(normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textEffect) && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Color 1</label>
                                      <input
                                        type="color"
                                        value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textGradientFrom || '#f97316'}
                                        onChange={(e) => updateSelectedBlock({ textGradientFrom: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-500 mb-1">Color 2</label>
                                      <input
                                        type="color"
                                        value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.textGradientTo || '#d946ef'}
                                        onChange={(e) => updateSelectedBlock({ textGradientTo: e.target.value })}
                                        className="w-full h-8 rounded-lg border border-white/10 bg-slate-900"
                                      />
                                    </div>
                                  </div>
                                )}
                                <label className="block text-xs text-slate-400 mt-1">Font</label>
                                <select
                                  value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontFamily || ''}
                                  onChange={(e) => updateSelectedBlock({ fontFamily: e.target.value })}
                                  className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                                >
                                  <option value="">Inherit</option>
                                  {BUILDER_FONT_OPTIONS.map((f) => (
                                    <option key={f.value} value={f.value}>{f.group} — {f.label}</option>
                                  ))}
                                </select>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Weight</label>
                                    <select
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.fontWeight || ''}
                                      onChange={(e) => updateSelectedBlock({ fontWeight: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_SELECT_CLASS}`}
                                    >
                                      <option value="">Auto</option>
                                      <option value="300">Light</option>
                                      <option value="400">Reg</option>
                                      <option value="600">Semi</option>
                                      <option value="700">Bold</option>
                                      <option value="800">X-Bold</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Spacing</label>
                                    <input
                                      type="number" step={0.01} min={-0.1} max={0.5}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.letterSpacingEm ?? ''}
                                      onChange={(e) => updateSelectedBlock({ letterSpacingEm: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="0"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 mb-1">Line h</label>
                                    <input
                                      type="number" step={0.05} min={0.8} max={2.4}
                                      value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.lineHeight ?? ''}
                                      onChange={(e) => updateSelectedBlock({ lineHeight: e.target.value === '' ? '' : Number(e.target.value) })}
                                      className={`w-full rounded-lg border border-white/10 bg-slate-900 px-2 py-1.5 text-xs text-white ${DARK_INPUT_CLASS}`}
                                      placeholder="1.2"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Entrance animation (every block) */}
                            <div className="border-t border-white/5 pt-3">
                              <label className="block text-xs text-slate-400 mb-1">✨ Entrance animation</label>
                              <select
                                value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.enterAnimation || 'none'}
                                onChange={(e) => updateSelectedBlock({ enterAnimation: e.target.value })}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_SELECT_CLASS}`}
                              >
                                {ENTER_ANIM_PRESETS.map((a) => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                              <label className="block text-xs text-slate-400 mt-2 mb-1">Delay (ms)</label>
                              <input
                                type="number" min={0} max={3000} step={50}
                                value={normalizedBuilder.pages[activePage]?.blocks?.[selectedBlockIndex]?.enterDelayMs || 0}
                                onChange={(e) => updateSelectedBlock({ enterDelayMs: Number(e.target.value) || 0 })}
                                className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Countdown Timer */}
                      <div className="border-t border-white/10 pt-4">
                        <h4 className="mb-3 text-xs uppercase tracking-widest text-slate-400">Countdown Timer</h4>
                        <label className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-200">
                          <input
                            type="checkbox"
                            checked={normalizedBuilder.scheduledReveal.enabled}
                            onChange={(e) => patchScheduledReveal({ enabled: e.target.checked })}
                          />
                          Enable
                        </label>
                        {normalizedBuilder.scheduledReveal.enabled && (
                          <div className="mt-3 space-y-3">
                            <input
                              type="datetime-local"
                              value={normalizedBuilder.scheduledReveal.targetLocal}
                              onChange={(e) => patchScheduledReveal({ targetLocal: e.target.value })}
                              className={`w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white ${DARK_INPUT_CLASS}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={deleteConfirmId != null}
        title="Remove this website?"
        description="This cannot be undone. People who already published a page from it may need to create a new link."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) setDeleteConfirmId(null);
        }}
        onConfirm={executeDeleteTemplate}
      />

      {/* Starter templates picker */}
      <AnimatePresence>
        {starterPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setStarterPickerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="tpl-modal-card w-full max-w-4xl rounded-[2rem] border p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-brand-700 dark:text-fuchsia-300">✨ Starter templates</p>
                  <h3 className="tpl-modal-title font-display text-2xl font-extrabold mt-1">Pick a starting point</h3>
                  <p className="tpl-modal-desc text-sm mt-1">Loads a ready-to-edit story. You can change anything after.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStarterPickerOpen(false)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white text-lg w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition flex items-center justify-center"
                  aria-label="Close"
                >✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STARTER_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => loadStarterTemplate(t.id)}
                    className="group text-left rounded-[1.5rem] overflow-hidden border-2 border-slate-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-400 transition active:scale-[0.98]"
                  >
                    <div
                      className="aspect-[4/5] flex items-center justify-center text-6xl relative"
                      style={{ background: t.accent }}
                    >
                      <div className="absolute inset-x-2 top-2 flex gap-1">
                        <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                        <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                        <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                      </div>
                      <span className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-110 transition">{t.emoji}</span>
                    </div>
                    <div className="tpl-modal-tile-footer p-4">
                      <p className="tpl-modal-title font-bold" style={{ fontSize: '16px' }}>{t.name}</p>
                      <p className="tpl-modal-label text-[11px] uppercase tracking-wider mt-0.5">
                        {t.category} · {t.builderState.pages.length} pages
                      </p>
                      <p className="tpl-modal-desc text-xs mt-2 line-clamp-2">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New-website modal — gallery-dominant picker with sticky footer. */}
      {formOpen && !editing && createStep === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md"
          onClick={() => { if (!formSubmitting) setFormOpen(false); }}
        >
          <motion.form
            initial={{ scale: 0.94, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="tpl-modal-card relative w-full max-w-5xl rounded-[2rem] border shadow-2xl flex flex-col max-h-[94vh] overflow-hidden"
          >
            {/* Soft gradient stripe across the top */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-600" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-8 sm:pt-7">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-700 dark:text-fuchsia-300">
                  {creationMode === 'starters' ? '🪄 Pick a starter' : '✨ Create new website'}
                </p>
                <h2 className="tpl-modal-title mt-2 font-display text-2xl sm:text-3xl font-extrabold">
                  {creationMode === 'starters' ? 'Pick a starting point' : 'Start a blank canvas'}
                </h2>
                <p className="tpl-modal-desc mt-1 text-sm max-w-2xl">
                  {creationMode === 'starters'
                    ? 'Tap a template to start with a ready-made story. You can rename and customize everything in the next step.'
                    : 'Name your page and jump into the editor. You can add pages, photos, stickers, and effects from there.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !formSubmitting && setFormOpen(false)}
                className="shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition flex items-center justify-center"
                aria-label="Close"
              >✕</button>
            </div>

            {/* Body: gallery (starters mode) OR centered illustration (blank mode) */}
            <div className="px-6 sm:px-8 py-5 overflow-y-auto flex-1">
              {creationMode === 'starters' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {STARTER_TEMPLATES.map((t) => {
                    const active = pickedStarterId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => pickStarter(t.id)}
                        aria-pressed={active}
                        className={`group text-left rounded-2xl overflow-hidden border-2 transition active:scale-[0.97] ${
                          active
                            ? 'border-brand-500 ring-4 ring-brand-500/20 shadow-xl shadow-brand-500/15'
                            : 'border-slate-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-400'
                        }`}
                      >
                        <div
                          className="aspect-[4/5] flex items-center justify-center text-5xl relative overflow-hidden"
                          style={{ background: t.accent }}
                        >
                          {active && (
                            <span className="absolute top-2 right-2 rounded-full bg-white text-brand-700 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow">✓ Picked</span>
                          )}
                          <div className="absolute inset-x-2 top-2 flex gap-1 pr-16">
                            <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                          </div>
                          <span className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-110 transition">{t.emoji}</span>
                        </div>
                        <div className="tpl-modal-tile-footer p-3">
                          <p className="tpl-modal-title font-bold text-sm truncate" style={{ fontSize: '14px' }}>{t.name}</p>
                          <p className="tpl-modal-label text-[10px] uppercase tracking-wider mt-0.5">
                            {t.category} · {t.builderState.pages.length} pages
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  {/* Thumbnail picker — tap the + tile to upload an image */}
                  {thumbnailPreviewUrl ? (
                    <div className="relative group mb-3">
                      <img
                        src={thumbnailPreviewUrl}
                        alt="Thumbnail"
                        className="w-32 h-32 rounded-3xl object-cover border-2 border-slate-200 dark:border-white/15 shadow-pop"
                      />
                      <button
                        type="button"
                        onClick={() => setThumbnailFile(null)}
                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-sm font-bold flex items-center justify-center shadow-lg hover:bg-rose-600 transition active:scale-90"
                        aria-label="Remove thumbnail"
                      >×</button>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition rounded-3xl text-white text-xs font-bold cursor-pointer">
                        📸 Change
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/[0.02] border-2 border-dashed border-slate-300 dark:border-white/15 flex flex-col items-center justify-center mb-3 shadow-pop cursor-pointer hover:border-brand-400 hover:from-brand-50 hover:to-peach-100 dark:hover:from-fuchsia-500/8 dark:hover:to-purple-500/8 transition group">
                      <span className="text-3xl tpl-modal-title group-hover:scale-110 transition">+</span>
                      <span className="tpl-modal-label text-[10px] uppercase tracking-wider mt-1">Add cover</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  )}
                  <p className="tpl-modal-title font-display text-xl font-extrabold" style={{ fontSize: '20px' }}>Blank canvas</p>
                  <p className="tpl-modal-desc text-sm mt-1 max-w-md">
                    {thumbnailPreviewUrl
                      ? '3 empty pages with your cover image. Add text, photos, stickers, and music in the editor.'
                      : '3 empty pages ready for your text, photos, stickers, and music. Tap + to add a cover image.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCreationMode('starters')}
                    className="mt-3 text-xs font-bold text-brand-700 dark:text-fuchsia-300 hover:underline"
                  >
                    or pick a starter instead →
                  </button>
                </div>
              )}

              {/* Category selector (both modes) */}
              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
                <p className="tpl-modal-label block text-[10px] font-extrabold uppercase tracking-[0.16em] mb-2">
                  Category
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Birthday',   emoji: '🎂' },
                    { name: 'Love',       emoji: '💖' },
                    { name: 'Wedding',    emoji: '💍' },
                    { name: 'Friendship', emoji: '🫶' },
                    { name: 'Memories',   emoji: '📸' },
                  ].map((c) => {
                    const active = form.category === c.name;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, category: c.name }))}
                        aria-pressed={active}
                        className={`tpl-modal-chip ${active ? 'is-active' : ''} inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition active:scale-95`}
                      >
                        <span>{c.emoji}</span>
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sticky footer: name + Continue */}
            <div className="tpl-modal-footer border-t border-slate-200 dark:border-white/10 backdrop-blur-sm px-6 sm:px-8 py-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 min-w-0">
                  <label className="tpl-modal-label block text-[10px] font-extrabold uppercase tracking-[0.16em] mb-1">
                    Name your page
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="tpl-modal-input w-full rounded-2xl border px-4 py-2.5 text-sm font-bold transition"
                    placeholder={
                      creationMode === 'starters' && pickedStarterId
                        ? STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.name || 'Name your page'
                        : "e.g. Aarav's 25th Birthday"
                    }
                    required
                  />
                  {nameRequiredError && <p className="mt-1 text-xs text-rose-600">{nameRequiredError}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="tpl-modal-cancel rounded-full px-4 py-2.5 text-sm font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commitStarterAndContinue}
                    disabled={creationMode === 'starters' && !pickedStarterId}
                    className="rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-fuchsia-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/30 hover:opacity-95 active:scale-[0.98] transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creationMode === 'starters'
                      ? (pickedStarterId
                          ? `Use ${STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.emoji || ''} ${STARTER_TEMPLATES.find(t => t.id === pickedStarterId)?.name || 'starter'} →`
                          : 'Pick a template above ↑')
                      : 'Open the editor →'}
                  </button>
                </div>
              </div>
            </div>
          </motion.form>
        </motion.div>
      )}

      {/* Legacy modal step 2 — never renders now (we hide modal when createStep===2 or editing), but kept for any edge cases. */}
      {false && (
        <motion.div>
          <motion.form onSubmit={handleSubmit}>
            {!editing && createStep === 1 && null}

            {(editing || createStep === 2) && (
              <div className="space-y-6">
                {editing && (
                  <div className="grid sm:grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-500">Website name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className={`mt-1 ${APP_INPUT_CLASS}`}
                        required
                      />
                      {nameRequiredError && <p className="mt-1 text-xs text-red-400">{nameRequiredError}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                        className={`mt-1 ${APP_SELECT_CLASS}`}
                      >
                        {['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-500">Description</label>
                      <input
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        className={`mt-1 ${APP_INPUT_CLASS}`}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-zinc-500">Thumbnail</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="mt-1 w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400"
                      />
                      {(thumbnailPreviewUrl || editing?.thumbnailUrl) && (
                        <img
                          src={thumbnailPreviewUrl || editing?.thumbnailUrl}
                          alt=""
                          className="mt-2 h-20 w-28 object-cover rounded-lg border border-white/10"
                        />
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3 rounded-3xl border border-white/10 bg-slate-950/85 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Live story preview</p>
                      <p className="text-xs text-slate-400">Same as your published experience.</p>
                    </div>
                    <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-200">Live</span>
                  </div>
                  <div className="mx-auto max-w-[min(100%,380px)] rounded-[2rem] border-4 border-white/10 bg-slate-950 p-3 shadow-2xl">
                    <div className="overflow-hidden rounded-[1.5rem] bg-black">
                      {builderPreviewError ? (
                        <div className="p-4 text-sm text-amber-300/95">{builderPreviewError}</div>
                      ) : (
                        <SlideshowBuilder
                          structure={previewStructure}
                          fills={{}}
                          editable
                          dragMode={dragMode}
                          activeIndex={activePage}
                          onActiveIndexChange={setActivePage}
                          onTextSlotCommit={(slot, text) =>
                            setBuilderState((prev) => updateBuilderTextBySlot(prev, slot, text))
                          }
                          onBlockMoveCommit={(slot, x, y) =>
                            setBuilderState((prev) => updateBuilderBlockPositionBySlot(prev, slot, x, y))
                          }
                          className="w-full [&_.html-deck-root]:min-h-[min(68vh,520px)] [&_.html-deck-root]:h-auto"
                        />
                      )}
                    </div>
                  </div>
                  <p className="text-center text-[11px] text-zinc-600 mt-2">
                    Click any heading/text in the phone to edit it live. Use controls below for media, buttons, and timers.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4 space-y-4">
                  <p className="text-xs font-semibold text-brand-300/90">Show timer (Instagram-style)</p>
                  <p className="text-[11px] text-slate-400">
                    Set a date and time: visitors see a countdown until then, then your message with an animation (like a birthday at midnight).
                  </p>
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={normalizedBuilder.scheduledReveal.enabled}
                      onChange={(e) => patchScheduledReveal({ enabled: e.target.checked })}
                    />
                    Enable countdown &amp; celebration
                  </label>
                  <label className="flex items-start gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={normalizedBuilder.scheduledReveal.hideStoryUntilReveal}
                      onChange={(e) => patchScheduledReveal({ hideStoryUntilReveal: e.target.checked })}
                      disabled={!normalizedBuilder.scheduledReveal.enabled}
                    />
                    <span>
                      Until then, show only countdown (hide all pages)
                      <span className="block text-[11px] font-normal text-zinc-500 mt-0.5">
                        Phone preview matches the published link. Uncheck this to edit page content while the timer is still running.
                      </span>
                    </span>
                  </label>
                  {normalizedBuilder.scheduledReveal.enabled && (
                    <div className="space-y-3 border-t border-white/5 pt-3">
                      <div>
                        <label className="text-xs text-zinc-500">When (your device time zone)</label>
                        <input
                          type="datetime-local"
                          value={normalizedBuilder.scheduledReveal.targetLocal}
                          onChange={(e) => patchScheduledReveal({ targetLocal: e.target.value })}
                          className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-zinc-500">Countdown title</label>
                          <input
                            value={normalizedBuilder.scheduledReveal.title}
                            onChange={(e) => patchScheduledReveal({ title: e.target.value })}
                            className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                            placeholder="Countdown"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-zinc-500">Animation after</label>
                          <select
                            value={normalizedBuilder.scheduledReveal.effectAfter}
                            onChange={(e) => patchScheduledReveal({ effectAfter: e.target.value })}
                            className={`mt-1 w-full ${APP_SELECT_CLASS}`}
                          >
                            <option value="none">None</option>
                            <option value="pulse">Pulse</option>
                            <option value="bounce">Bounce</option>
                            <option value="glow">Glow</option>
                            <option value="shake">Shake</option>
                            <option value="confetti">Confetti</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Line under title (before time)</label>
                        <input
                          value={normalizedBuilder.scheduledReveal.subtitleBefore}
                          onChange={(e) => patchScheduledReveal({ subtitleBefore: e.target.value })}
                          className={`mt-1 w-full ${APP_INPUT_CLASS}`}
                          placeholder="Something special is coming…"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Message at / after that time</label>
                        <textarea
                          value={normalizedBuilder.scheduledReveal.messageAfter}
                          onChange={(e) => patchScheduledReveal({ messageAfter: e.target.value })}
                          rows={2}
                          className={`mt-1 w-full ${APP_INPUT_CLASS} resize-y min-h-[3rem]`}
                          placeholder="🎉 Happy Birthday! 🎂"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-white">Story controls</p>
                      <p className="text-xs text-slate-400">Page navigation, add content, and fine-tune each block.</p>
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">UI only</span>
                  </div>
                  <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-500 mr-1">Pages</span>
                      {normalizedBuilder.pages.map((p, i) => (
                        <button
                          key={p.id || i}
                          type="button"
                          onClick={() => setActivePage(i)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            activePage === i ? 'bg-brand-500/35 text-white' : 'bg-slate-800/80 text-slate-200 hover:bg-slate-800/95'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={addPageQuick}
                        className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold text-brand-300 hover:bg-slate-800/95"
                      >
                        + Page
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-2 rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95">
                        <input type="checkbox" checked={dragMode} onChange={(e) => setDragMode(e.target.checked)} />
                        Move mode (drag with cursor)
                      </label>
                      {[
                        ['Text', 'text'],
                        ['Heading', 'heading'],
                        ['Gallery', 'gallery'],
                        ['GIF', 'gif'],
                        ['Song', 'music'],
                        ['Button', 'button'],
                      ].map(([label, kind]) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => addBlockQuick(kind)}
                          className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                        >
                          + {label}
                        </button>
                      ))}
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Photo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            addUploadedMediaBlock(f, 'image');
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Video'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            addUploadedMediaBlock(f, 'video');
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <label className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95 cursor-pointer">
                        {uploadingAsset ? 'Uploading...' : '+ Song upload'}
                        <input
                          type="file"
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            setUploadingAsset(true);
                            try {
                              const { url } = await videosAPI.uploadMedia(f);
                              const page = normalizedBuilder.pages[activePage];
                              if (!page) return;
                              const blocks = [...(page.blocks || []), { type: 'subheading', text: `🎵 ${f.name}`, songUrl: url }];
                              setPageAt(activePage, { ...page, blocks });
                              setSelectedBlockIndex(blocks.length - 1);
                            } catch (err) {
                              setError(err.message || 'Song upload failed');
                            } finally {
                              setUploadingAsset(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedBlock({
                                rotateDeg:
                                  (Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) - 15,
                              })
                            }
                            className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                          >
                            Rotate -15
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSelectedBlock({
                                rotateDeg:
                                  (Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) + 15,
                              })
                            }
                            className="rounded-2xl bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800/95"
                          >
                            Rotate +15
                          </button>
                        </>
                      )}
                    </div>

                    {normalizedBuilder.pages[activePage] && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          value={normalizedBuilder.pages[activePage].pageTitle || ''}
                          onChange={(e) => patchPage(activePage, { pageTitle: e.target.value })}
                          className={APP_INPUT_CLASS}
                          placeholder="Page title"
                        />
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={
                            normalizedBuilder.pages[activePage].pageDurationMs === '' ||
                            normalizedBuilder.pages[activePage].pageDurationMs == null
                              ? ''
                              : Math.round(Number(normalizedBuilder.pages[activePage].pageDurationMs) / 1000)
                          }
                          onChange={(e) =>
                            patchPage(activePage, {
                              pageDurationMs:
                                e.target.value === '' ? '' : Math.min(120000, Math.max(0, Number(e.target.value) * 1000)),
                            })
                          }
                          className={APP_INPUT_CLASS}
                          placeholder="Timer sec"
                        />
                        <input
                          value={normalizedBuilder.pages[activePage].pageBackground || ''}
                          onChange={(e) => patchPage(activePage, { pageBackground: e.target.value })}
                          className={APP_INPUT_CLASS}
                          placeholder="Background color (#111827)"
                        />
                      </div>
                    )}

                    {(normalizedBuilder.pages[activePage]?.blocks || []).length > 0 && (
                      <div className="rounded-lg border border-white/10 bg-black/25 p-2 space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {normalizedBuilder.pages[activePage].blocks.map((b, i) => (
                            <button
                              key={`${b.type}-${i}`}
                              type="button"
                              onClick={() => setSelectedBlockIndex(i)}
                              className={`rounded-md px-2 py-1 text-xs ${
                                selectedBlockIndex === i ? 'bg-brand-500/30 text-white' : 'bg-white/10 text-zinc-300'
                              }`}
                            >
                              {b.type} {i + 1}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {'text' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <textarea
                              rows={3}
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].text || ''}
                              onChange={(e) => updateSelectedBlock({ text: e.target.value })}
                              className={APP_INPUT_CLASS}
                              placeholder="Text"
                            />
                          )}
                          {'label' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <input
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].label || ''}
                              onChange={(e) => updateSelectedBlock({ label: e.target.value })}
                              className={APP_INPUT_CLASS}
                              placeholder="Label"
                            />
                          )}
                          {'navPage' in (normalizedBuilder.pages[activePage].blocks[selectedBlockIndex] || {}) && (
                            <input
                              type="number"
                              min={1}
                              max={normalizedBuilder.pages.length}
                              value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex].navPage ?? 1}
                              onChange={(e) => updateSelectedBlock({ navPage: Number(e.target.value) || 1 })}
                              className={APP_INPUT_CLASS}
                              placeholder="Navigate to page"
                            />
                          )}
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'button' && (
                            <label className="inline-flex items-center gap-2 text-xs text-zinc-400">
                              <input
                                type="checkbox"
                                checked={Boolean(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.showAfterGallery)}
                                onChange={(e) => updateSelectedBlock({ showAfterGallery: e.target.checked })}
                              />
                              Show button only after gallery completes
                            </label>
                          )}
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'gallery' && (
                            <>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count ?? 4}
                                onChange={(e) => updateSelectedBlock({ count: Math.min(12, Math.max(1, Number(e.target.value) || 4)) })}
                                className={APP_INPUT_CLASS}
                                placeholder="How many photos"
                              />
                              <input
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || ''}
                                onChange={(e) => updateSelectedBlock({ slotPrefix: e.target.value })}
                                className={APP_INPUT_CLASS}
                                placeholder="Gallery key prefix"
                              />
                              <select
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.galleryAnimation || 'fade'}
                                onChange={(e) => updateSelectedBlock({ galleryAnimation: e.target.value })}
                                className={APP_SELECT_CLASS}
                              >
                                <option value="fade">Fade animation</option>
                                <option value="zoom">Zoom animation</option>
                                <option value="slide">Slide-up animation</option>
                                <option value="lanes">Two-lane opposite scroll</option>
                                <option value="autoVertical">Auto up/down (no manual scroll)</option>
                                <option value="slideshow">Single-box timed slideshow</option>
                              </select>
                              <input
                                type="number"
                                min={500}
                                max={8000}
                                step={100}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.photoDurationMs ?? 1200}
                                onChange={(e) => updateSelectedBlock({ photoDurationMs: Number(e.target.value) || 1200 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Per photo time (ms)"
                              />
                              <input
                                type="number"
                                min={4}
                                max={60}
                                step={1}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.laneDurationSec ?? 14}
                                onChange={(e) => updateSelectedBlock({ laneDurationSec: Number(e.target.value) || 14 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Lane speed duration (sec)"
                              />
                            </>
                          )}
                          <label className="text-xs text-zinc-400">
                            Rotate (%)
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min={-100}
                                max={100}
                                value={Math.round((Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) / 1.8)}
                                onChange={(e) => updateSelectedBlock({ rotateDeg: (Number(e.target.value) || 0) * 1.8 })}
                                className="w-full"
                              />
                              <input
                                type="number"
                                min={-100}
                                max={100}
                                value={Math.round((Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.rotateDeg) || 0) / 1.8)}
                                onChange={(e) => updateSelectedBlock({ rotateDeg: (Number(e.target.value) || 0) * 1.8 })}
                                className="w-20 rounded bg-white/5 border border-white/10 px-2 py-1 text-xs"
                              />
                            </div>
                          </label>
                          {['image', 'gif', 'video'].includes(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type) && (
                            <>
                              <select
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.mediaFit || 'cover'}
                                onChange={(e) => updateSelectedBlock({ mediaFit: e.target.value })}
                                className={APP_SELECT_CLASS}
                              >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="fill">Fill</option>
                              </select>
                              <input
                                type="number"
                                min={0}
                                max={80}
                                value={normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.mediaRadius ?? 12}
                                onChange={(e) => updateSelectedBlock({ mediaRadius: Number(e.target.value) || 0 })}
                                className={APP_INPUT_CLASS}
                                placeholder="Corner radius"
                              />
                            </>
                          )}
                        </div>
                        <div className="flex justify-end">
                          {normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.type === 'gallery' && (
                            <div className="mr-auto w-full space-y-2">
                              <p className="text-xs text-zinc-500">
                                Slots: {Array.from({ length: Math.min(12, Math.max(1, Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count) || 4)) })
                                  .map((_, i) => `${normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || 'gal'}_${i}`)
                                  .join(', ')}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Array.from({
                                  length: Math.min(12, Math.max(1, Number(normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.count) || 4)),
                                }).map((_, i) => {
                                  const prefix = normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.slotPrefix || 'gal';
                                  const key = `${prefix}_${i}`;
                                  const val = normalizedBuilder.pages[activePage].blocks[selectedBlockIndex]?.galleryDefaults?.[key];
                                  return (
                                    <label key={key} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-300 cursor-pointer">
                                      {val ? `Photo ${i + 1} ✓` : `Photo ${i + 1}`}
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="hidden"
                                        onChange={(e) => {
                                          const f = e.target.files?.[0];
                                          uploadGalleryPhotoAt(i, f);
                                          e.target.value = '';
                                        }}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={removeSelectedBlock}
                            className="rounded-md bg-red-500/20 px-3 py-1 text-xs text-red-300"
                          >
                            Remove selected
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(editing || createStep === 2) && (
            <div className="flex gap-3 mt-8 flex-wrap">
              {!editing && (
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setCreateStep(1)}
                  className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50 text-sm"
                >
                  ← Back
                </button>
              )}
              <button
                type="button"
                disabled={formSubmitting}
                onClick={() => setFormOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition disabled:opacity-50 disabled:pointer-events-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-60 disabled:pointer-events-none"
              >
                {formSubmitting ? 'Saving…' : editing ? 'Save changes' : 'Create website'}
              </button>
            </div>
            )}
          </motion.form>
        </motion.div>
      )}
    </div>
  );
}
