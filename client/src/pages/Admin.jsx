import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, videosAPI } from '../api/api';
import { htmlToStructure } from '../lib/htmlTemplate';
import {
  visualBuilderToHtml,
  validateBuilderState,
  defaultVisualBuilderState,
  normalizeBuilderState,
  updateBuilderTextBySlot,
  updateBuilderBlockPositionBySlot,
} from '../lib/visualTemplateBuilder';
import { APP_INPUT_CLASS, APP_SELECT_CLASS } from '../lib/uiClasses';
import ConfirmDialog from '../components/ConfirmDialog';
import SlideshowBuilder from '../components/SlideshowBuilder';

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

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: 'Memories', description: '' });
    setThumbnailFile(null);
    setBuilderState(defaultVisualBuilderState());
    setActivePage(0);
    setSelectedBlockIndex(0);
    setCreateStep(1);
    setFormOpen(true);
    setError('');
  };

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
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Storyly — Admin</h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-xl">
            Build websites in the visual editor — pages, photos, colors, and floating or stable buttons. No HTML required.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium"
        >
          + New website
        </motion.button>
      </motion.div>

      {error && !nameRequiredError && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-400 text-sm mb-4">{success}</p>}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                {t.thumbnailUrl ? (
                  <img src={t.thumbnailUrl} alt="" className="w-20 h-14 object-cover rounded-lg" />
                ) : (
                  <div className="w-20 h-14 rounded-lg bg-white/5 flex items-center justify-center text-2xl">🎬</div>
                )}
                <div>
                  <h3 className="font-semibold text-white">{t.name}</h3>
                  <p className="text-sm text-zinc-500">
                    {t.category} • {t.published ? 'Published' : 'Draft'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(t)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm transition"
                >
                  Edit
                </button>
                {!t.published && (
                  <button
                    onClick={() => handlePublish(t._id)}
                    className="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 text-sm transition"
                  >
                    Publish
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(t._id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

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

      {formOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            if (!formSubmitting) setFormOpen(false);
          }}
        >
          <motion.form
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className="glass rounded-2xl p-5 sm:p-6 w-full max-w-3xl max-h-[94vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold text-white mb-1">
              {editing ? 'Edit website' : createStep === 1 ? 'New website' : 'Story designer'}
            </h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-2xl">
              {editing || createStep === 2
                ? 'Edit like an Instagram story: the phone below is the real page — add blocks, timers, and buttons. No separate preview column.'
                : 'First name your design, then you’ll build each page in the story editor.'}
            </p>

            {!editing && createStep === 1 && (
              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1">Website name</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className={`rounded-xl ${APP_INPUT_CLASS}`}
                      required
                    />
                    {nameRequiredError && <p className="mt-1 text-xs text-red-400">{nameRequiredError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className={APP_SELECT_CLASS}
                    >
                      {['Love', 'Friendship', 'Birthday', 'Memories', 'Wedding'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Description</label>
                    <input
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className={APP_INPUT_CLASS}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-zinc-400 mb-1">Thumbnail (gallery card)</label>
                    <p className="text-xs text-zinc-500 mb-2">Optional — JPG, PNG, or WebP.</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400"
                    />
                    {thumbnailPreviewUrl && (
                      <img
                        src={thumbnailPreviewUrl}
                        alt=""
                        className="mt-3 h-24 w-32 object-cover rounded-lg border border-white/10"
                      />
                    )}
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap pt-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!form.name.trim()) {
                        setError('Please enter a website name.');
                        return;
                      }
                      setError('');
                      setCreateStep(2);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium"
                  >
                    Continue to story editor
                  </button>
                </div>
              </div>
            )}

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
                  <h3 className="text-sm font-semibold text-brand-300 mb-2">Live story (same as published)</h3>
                  <div className="mx-auto max-w-[min(100%,380px)] rounded-[2rem] border-4 border-zinc-700 bg-black p-2 shadow-2xl">
                    <div className="overflow-hidden rounded-[1.5rem] bg-zinc-950">
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

                <div className="rounded-xl border border-white/10 bg-black/20 p-3 space-y-3">
                  <p className="text-xs font-semibold text-brand-300/90">Show timer (Instagram-style)</p>
                  <p className="text-[11px] text-zinc-500">
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

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Story controls (UI only)</label>
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-500 mr-1">Pages</span>
                      {normalizedBuilder.pages.map((p, i) => (
                        <button
                          key={p.id || i}
                          type="button"
                          onClick={() => setActivePage(i)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            activePage === i ? 'bg-brand-500/35 text-white' : 'bg-white/10 text-zinc-300'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={addPageQuick}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-300"
                      >
                        + Page
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200">
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
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15"
                        >
                          + {label}
                        </button>
                      ))}
                      <label className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15 cursor-pointer">
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
                      <label className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15 cursor-pointer">
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
                      <label className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15 cursor-pointer">
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
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15"
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
                            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/15"
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
