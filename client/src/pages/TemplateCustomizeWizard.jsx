import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { templatesAPI, videosAPI } from '../api/api';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { extractSlotsFromStructure } from '../data/exampleSlideshowTemplate';
import { MUSIC_LIBRARY, STICKER_PRESETS, ENTER_ANIM_PRESETS } from '../lib/visualTemplateBuilder';
import { StorylyMark } from '../components/StorylyLogo';
import useLockBodyScroll from '../hooks/useLockBodyScroll';
import Button from '../ui/Button';

/* Theme/background palette offered as quick swatches on each page. The
   hex is applied to the page's primary text color via themeOverrides. */
const THEME_SWATCHES = [
  { name: 'Pearl',    text: '#F8FAFC', bg: 'linear-gradient(135deg,#EEF2FF,#FCE7F3)' },
  { name: 'Lavender', text: '#FFFFFF', bg: 'linear-gradient(135deg,#A78BFA,#F472B6)' },
  { name: 'Peach',    text: '#1F2937', bg: 'linear-gradient(135deg,#FED7AA,#FBCFE8)' },
  { name: 'Mint',     text: '#0F172A', bg: 'linear-gradient(135deg,#A7F3D0,#FDE68A)' },
  { name: 'Honey',    text: '#0F172A', bg: 'linear-gradient(135deg,#FDE68A,#FCA5A5)' },
  { name: 'Midnight', text: '#FFFFFF', bg: 'linear-gradient(135deg,#1E1B4B,#6D28D9)' },
];

/**
 * TemplateCustomizeWizard — guided, distraction-free flow that walks
 * the user through every page of a template, surfacing only the
 * editable content for that page (text, images, video, music, theme).
 *
 * Routed at `/template/:id/customize?for=<name>&src=...&edit=<jobId>`.
 *
 * Save model: same `customizations` shape as the full editor, so the
 * same draft/page can be reopened in either UI without conversion.
 */
export default function TemplateCustomizeWizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const recipientName = (searchParams.get('for') || '').trim();
  const sourceType = searchParams.get('src') === 'BuilderTemplate' ? 'BuilderTemplate' : 'Template';

  /* Lock the page scroll while the wizard is mounted — nothing else
     should be visible behind it. */
  useLockBodyScroll(true);

  /* ── Source-template + draft state ───────────────────────────── */
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* customizations shape — kept identical to TemplateDetail so the
     server payload + draft schema are exactly the same. */
  const [slotFills, setSlotFills] = useState({});
  const [mediaUrls, setMediaUrls] = useState([]);
  const [themeOverrides, setThemeOverrides] = useState({});
  const [customText, setCustomText] = useState('');
  const [loadedRecipient, setLoadedRecipient] = useState('');

  /* Wizard chrome state */
  const [activePage, setActivePage] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);
  const [exitConfirm, setExitConfirm] = useState(false);

  /* Refs used by the auto-save lifecycle — see effects below. */
  const draftJobIdRef = useRef(editId || null);
  const readyForSaveRef = useRef(false);
  const skipNextLoadRef = useRef(false);
  const latestPayloadRef = useRef(null);

  const effectiveRecipient = (loadedRecipient || recipientName || '').trim();

  /* ── Structure + page slot derivations ───────────────────────── */
  const structure = useMemo(() => {
    const raw = template?.structure;
    if (raw == null) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return null;
  }, [template?.structure]);

  const slots = useMemo(() => extractSlotsFromStructure(structure), [structure]);
  const pages = slots?.pages || [];
  const pageCount = pages.length || 1;
  const isLastPage = activePage >= pageCount - 1;

  /* Filter the current page's slots into edit-able buckets. We only
     surface kinds the user is supposed to fill — image/video/text.
     Audio is global (music picker at top), buttons are decoration. */
  const pageSlots = useMemo(() => {
    const page = pages[activePage];
    const arr = Array.isArray(page?.slots) ? page.slots : [];
    return {
      text:  arr.filter((s) => s.kind === 'text'),
      image: arr.filter((s) => !s.kind || s.kind === 'image'),
      video: arr.filter((s) => s.kind === 'video'),
    };
  }, [pages, activePage]);

  const currentPagePatch = themeOverrides?.pagePatches?.[activePage] || {};

  /* Clamp activePage when the structure resolves and pageCount changes. */
  useEffect(() => {
    if (activePage >= pageCount) setActivePage(Math.max(0, pageCount - 1));
  }, [activePage, pageCount]);

  /* ── Load template + (optional) existing draft ───────────────── */
  useEffect(() => {
    /* skipNextLoadRef is set right before the auto-create updates the
       URL — without this guard the effect re-runs on the URL change
       and wipes the user's in-progress edits with the empty draft. */
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        if (editId) {
          /* Editing an existing saved page: load the user's OWN snapshot
             as the base structure. This makes the page fully independent —
             it edits correctly even if the admin later changed or DELETED
             the source template, and admin edits never alter a page a user
             already saved. We only fall back to the live template for
             legacy pages saved before snapshots existed. */
          const job = await videosAPI.get(editId);
          if (cancelled) return;
          const jobTplId = String(job.templateId?._id || job.templateId || '');
          if (jobTplId && id && jobTplId !== id) {
            setError('This page belongs to a different template.');
            return;
          }
          const c = job.customizations || {};
          let baseTpl = null;
          if (c.structureSnapshot != null) {
            baseTpl = {
              structure: c.structureSnapshot,
              name: c.templateName || job.templateId?.name || job.recipientName || 'My page',
              category: c.templateCategory || job.templateId?.category || '',
              thumbnailUrl: c.templateThumb || job.templateId?.thumbnailUrl || job.thumbnailUrl || '',
            };
          } else {
            // Legacy page with no snapshot — fall back to the live template.
            try { baseTpl = await templatesAPI.get(id, sourceType); } catch { baseTpl = null; }
          }
          if (cancelled) return;
          if (!baseTpl || baseTpl.structure == null) {
            setError('Could not load your saved page.');
            return;
          }
          setTemplate(baseTpl);
          setCustomText(c.text || '');
          setSlotFills(c.slots || {});
          setThemeOverrides(
            c.themeOverrides && typeof c.themeOverrides === 'object' ? c.themeOverrides : {}
          );
          setMediaUrls(Array.isArray(c.mediaUrls) ? c.mediaUrls : []);
          if (job.recipientName) setLoadedRecipient(job.recipientName);
          draftJobIdRef.current = editId;
          readyForSaveRef.current = true;
        } else {
          /* New page from a browsable (published) template — use the live
             template; a fresh snapshot is captured server-side on save. */
          const tpl = await templatesAPI.get(id, sourceType);
          if (cancelled) return;
          setTemplate(tpl);
        }
      } catch {
        if (!cancelled) {
          setTemplate(null);
          setError('Could not load your saved page.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, editId, sourceType]);

  /* ── Customizations payload (identical shape to TemplateDetail) ─ */
  const buildDraftPayload = useCallback(() => {
    const allMedia = [...Object.values(slotFills).filter((v) => typeof v === 'string'), ...mediaUrls]
      .filter(Boolean);
    return {
      id: draftJobIdRef.current || undefined,
      templateId: id,
      sourceType,
      recipientName: effectiveRecipient,
      customizations: {
        text: customText,
        mediaUrls: Array.from(new Set(allMedia)),
        slots: slotFills,
        themeOverrides,
      },
    };
  }, [id, sourceType, effectiveRecipient, customText, mediaUrls, slotFills, themeOverrides]);

  /* Keep latestPayloadRef fresh so the unmount/beforeunload handlers
     can ship the current state without hitting stale closures. */
  useEffect(() => {
    latestPayloadRef.current = buildDraftPayload();
  }, [buildDraftPayload]);

  /* ── saveDraft (manual + silent) ─────────────────────────────── */
  const saveDraft = useCallback(
    async ({ silent = false, navigateAfter = false } = {}) => {
      if (!template) return null;
      try {
        if (!silent) setSavingDraft(true);
        const saved = await videosAPI.saveDraft(buildDraftPayload());
        if (saved?._id) {
          draftJobIdRef.current = saved._id;
          /* First save of a fresh page — sync ?edit=<id> into URL so
             refresh/close-reopen resumes the same draft. Skip the next
             load fire (it would re-fetch the empty draft and wipe). */
          if (!editId) {
            skipNextLoadRef.current = true;
            const params = new URLSearchParams(searchParams);
            params.set('edit', saved._id);
            params.delete('for');
            setSearchParams(params, { replace: true });
          }
        }
        if (!silent) toast.success('Draft saved');
        if (navigateAfter) navigate('/my-videos');
        return saved;
      } catch (err) {
        if (!silent) toast.error(err.message || 'Could not save draft');
        return null;
      } finally {
        if (!silent) setSavingDraft(false);
      }
    },
    [template, buildDraftPayload, editId, searchParams, setSearchParams, navigate]
  );

  /* Auto-create draft on first mount of a fresh template (no editId).
     Without this, the unmount/beforeunload paths would have nothing to
     PATCH and the user's edits would disappear on accidental close. */
  useEffect(() => {
    if (!template || editId || readyForSaveRef.current) return;
    let cancelled = false;
    (async () => {
      const saved = await saveDraft({ silent: true });
      if (!cancelled && saved?._id) readyForSaveRef.current = true;
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, editId]);

  /* Unmount cleanup — fetch with keepalive so the request survives
     unmount. Only fires if we already have a draft id (i.e. the
     auto-create succeeded), otherwise we'd POST a fresh duplicate. */
  useEffect(() => {
    return () => {
      if (!readyForSaveRef.current) return;
      const body = latestPayloadRef.current;
      if (!body?.id) return;
      try {
        fetch('/api/videos/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          credentials: 'include',
          keepalive: true,
        });
      } catch {}
    };
  }, []);

  /* beforeunload — sendBeacon is the only thing browsers reliably
     dispatch during a page-close. Same gate as unmount. */
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!readyForSaveRef.current) return;
      const body = latestPayloadRef.current;
      if (!body?.id) return;
      try {
        const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
        navigator.sendBeacon('/api/videos/draft', blob);
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  /* visibilitychange:hidden — when the user switches tabs / locks the
     phone, snapshot a draft so nothing is lost if the tab is killed. */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'hidden') return;
      if (!readyForSaveRef.current) return;
      saveDraft({ silent: true });
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [saveDraft]);

  /* ── Editing handlers (content-only) ─────────────────────────── */
  const setTextSlot = useCallback((slotId, value) => {
    setSlotFills((p) => ({ ...p, [slotId]: value }));
  }, []);

  /** Image upload — replaces the value of a single image slot. */
  const uploadToSlot = useCallback(async (slotId, file) => {
    if (!file) return;
    setUploadingSlot(slotId);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      setSlotFills((p) => ({ ...p, [slotId]: url }));
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  }, []);

  const setSiteAudio = useCallback((url) => {
    setThemeOverrides((prev) => ({ ...prev, audioUrl: url || '' }));
  }, []);

  /** Add a decoration block (sticker / shape) to the current page. */
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
  }, [activePage]);

  /** Patch the current page's themeOverrides (color, etc). */
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

  /* ── Publish (final save → process → my-videos) ──────────────── */
  const handlePublish = useCallback(async () => {
    if (!template) return;
    setError('');
    setPublishing(true);
    try {
      const allMedia = [...Object.values(slotFills).filter((v) => typeof v === 'string'), ...mediaUrls]
        .filter(Boolean);
      const fullCustomizations = {
        text: customText,
        mediaUrls: Array.from(new Set(allMedia)),
        slots: slotFills,
        themeOverrides,
      };
      const jobId = draftJobIdRef.current;
      if (jobId) {
        await videosAPI.update(jobId, { customizations: fullCustomizations });
        await videosAPI.process(jobId);
      } else {
        const { _id } = await videosAPI.createJob({
          templateId: id,
          sourceType,
          recipientName: effectiveRecipient,
          customizations: fullCustomizations,
        });
        await videosAPI.process(_id);
      }
      /* readyForSaveRef must flip OFF before navigate — otherwise the
         unmount cleanup would PATCH the just-published page back to
         draft data. */
      readyForSaveRef.current = false;
      toast.success(`Page ready ${effectiveRecipient ? `for ${effectiveRecipient}` : ''}`);
      navigate('/my-videos');
    } catch (err) {
      setError(err.message || 'Could not publish');
      toast.error(err.message || 'Could not publish');
    } finally {
      setPublishing(false);
    }
  }, [template, slotFills, mediaUrls, customText, themeOverrides, id, sourceType, effectiveRecipient, navigate]);

  /* ── Wizard chrome ───────────────────────────────────────────── */
  const goBack = () => setActivePage((p) => Math.max(0, p - 1));
  const goNext = () => {
    if (isLastPage) handlePublish();
    else setActivePage((p) => Math.min(pageCount - 1, p + 1));
  };

  /* Closing — confirm if there are unsaved-ish edits, then save draft
     and bounce to My pages. The auto-save also runs on unmount so the
     draft is safe either way. */
  const handleClose = async () => {
    if (!exitConfirm) {
      setExitConfirm(true);
      return;
    }
    await saveDraft({ silent: true });
    navigate('/my-videos');
  };

  const audioUrl = themeOverrides?.audioUrl || '';

  /* Render via portal so the wizard escapes any layout/stacking
     context from a parent (we render this route outside Layout, but
     this is also a safety net). */
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-br from-[#1B1240] via-[#2A1758] to-[#1B1240]"
      data-lenis-prevent
    >
      {/* Decorative ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-pink-400/10 blur-3xl" />
      </div>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="relative shrink-0 px-4 sm:px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          <div className="shrink-0">
            <StorylyMark size={36} idSuffix="wizard-mark" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-pink-200/90 font-bold">
              <span>Customizing</span>
              {effectiveRecipient && (
                <span className="text-pink-100">· for {effectiveRecipient}</span>
              )}
            </div>
            <p className="mt-0.5 text-sm sm:text-base font-display font-extrabold text-white truncate">
              {template?.name || 'Loading…'} · Page {Math.min(activePage + 1, pageCount)} of {pageCount}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePage(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === activePage
                    ? 'w-8 bg-pink-300'
                    : i < activePage
                      ? 'w-3 bg-pink-300/60'
                      : 'w-3 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => saveDraft({ silent: false })}
            disabled={savingDraft || !template}
          >
            {savingDraft ? 'Saving…' : '📥 Save draft'}
          </Button>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close customizer"
            title={exitConfirm ? 'Click again to exit' : 'Exit (your draft is saved automatically)'}
          >
            {exitConfirm ? '⏎' : '✕'}
          </button>
        </div>
      </header>

      {/* ── Body — scrollable canvas + controls ─────────────────── */}
      <main className="relative flex-1 overflow-y-auto" style={{ overflowAnchor: 'none' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 grid lg:grid-cols-[1fr_22rem] gap-6">
          {/* Left: live preview of the current page only */}
          <section className="rounded-3xl glass-strong overflow-hidden p-2 sm:p-3">
            {loading ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-pulse">
                  <StorylyMark size={48} idSuffix="wizard-load" />
                </div>
              </div>
            ) : error ? (
              <div className="min-h-[40vh] flex items-center justify-center text-rose-300 text-sm">
                {error}
              </div>
            ) : structure ? (
              <div className="rounded-2xl overflow-hidden bg-black/40 min-h-[60vh]">
                <SlideshowBuilder
                  structure={structure}
                  fills={slotFills}
                  themeOverrides={themeOverrides}
                  editable
                  activeIndex={activePage}
                  onActiveIndexChange={setActivePage}
                  onTextSlotCommit={setTextSlot}
                  alwaysShowStoryDuringCountdown
                  embedded
                  className="w-full"
                />
              </div>
            ) : (
              <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
                Couldn’t load this template.
              </div>
            )}
          </section>

          {/* Right: controls for the current page + global music/theme */}
          <aside className="space-y-4">
            {/* Music — global across all pages */}
            <MusicPicker audioUrl={audioUrl} onChange={setSiteAudio} />

            {/* Per-page theme */}
            <ThemeSwatchPicker
              activeText={currentPagePatch?.textColor || ''}
              onPick={(text) => patchActivePage({ textColor: text })}
            />

            {/* Page motion — enter animation applied to newly-added
                stickers on this page. */}
            <AnimationPicker
              value={currentPagePatch?.stickerEnterAnimation || 'pop'}
              onChange={(v) => patchActivePage({ stickerEnterAnimation: v })}
            />

            {/* Sticker palette — tap to drop onto the current page. */}
            <StickerPalette
              count={(currentPagePatch?.extraBlocks || []).filter((b) => b?.type === 'sticker').length}
              onPick={(emoji) =>
                appendExtraBlock({
                  type: 'sticker',
                  emoji,
                  size: 88,
                  enterAnimation: currentPagePatch?.stickerEnterAnimation || 'pop',
                })
              }
              onClearAll={() => {
                const filtered = (currentPagePatch?.extraBlocks || []).filter(
                  (b) => b?.type !== 'sticker'
                );
                patchActivePage({ extraBlocks: filtered });
              }}
            />

            {/* Text inputs for this page's text slots */}
            {pageSlots.text.length > 0 && (
              <PanelCard title="📝 Text on this page">
                {pageSlots.text.map((s) => (
                  <SlotTextInput
                    key={s.id}
                    slot={s}
                    value={slotFills[s.id] ?? ''}
                    onChange={(v) => setTextSlot(s.id, v)}
                  />
                ))}
              </PanelCard>
            )}

            {/* Photo uploads for this page's image slots */}
            {pageSlots.image.length > 0 && (
              <PanelCard title="📸 Photos on this page">
                {pageSlots.image.map((s) => (
                  <SlotImageInput
                    key={s.id}
                    slot={s}
                    value={slotFills[s.id] ?? ''}
                    uploading={uploadingSlot === s.id}
                    onUpload={(file) => uploadToSlot(s.id, file)}
                    onClear={() => setSlotFills((p) => ({ ...p, [s.id]: '' }))}
                  />
                ))}
              </PanelCard>
            )}

            {/* Video slots — URL input only for now */}
            {pageSlots.video.length > 0 && (
              <PanelCard title="🎬 Videos on this page">
                {pageSlots.video.map((s) => (
                  <SlotTextInput
                    key={s.id}
                    slot={s}
                    placeholder="https://… (paste a video URL)"
                    value={slotFills[s.id] ?? ''}
                    onChange={(v) => setTextSlot(s.id, v)}
                  />
                ))}
              </PanelCard>
            )}

            {/* When the page has nothing user-editable on it */}
            {pageSlots.text.length === 0 &&
              pageSlots.image.length === 0 &&
              pageSlots.video.length === 0 && (
                <PanelCard title="✨ Nothing to fill in here">
                  <p className="text-xs text-slate-300 leading-5">
                    This page is decorative. Tap <strong>Next →</strong> when you’re ready.
                  </p>
                </PanelCard>
              )}
          </aside>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="relative shrink-0 px-4 sm:px-6 py-3 border-t border-white/10 backdrop-blur-md bg-black/30">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={activePage === 0}
          >
            ← Back
          </Button>

          <div className="hidden sm:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
            <span>Page</span>
            <strong className="text-pink-200">{Math.min(activePage + 1, pageCount)}</strong>
            <span>/</span>
            <span>{pageCount}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isLastPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => saveDraft({ silent: false, navigateAfter: true })}
                disabled={savingDraft}
              >
                Save draft & exit
              </Button>
            )}
            <Button
              variant="candy"
              onClick={goNext}
              disabled={publishing}
              loading={publishing && isLastPage}
            >
              {isLastPage ? '✨ Save & publish' : 'Next →'}
            </Button>
          </div>
        </div>
      </footer>
    </div>,
    document.body
  );
}

/* ── Sub-components ───────────────────────────────────────────── */

function PanelCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-pink-200/90 mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SlotTextInput({ slot, value, onChange, placeholder }) {
  const label = humanizeSlotId(slot.id);
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-slate-200 mb-1">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || slot.placeholder || `Type ${label.toLowerCase()}…`}
        className="w-full rounded-xl bg-black/30 border border-white/10 focus:border-pink-300/60 outline-none px-3 py-2 text-sm text-white placeholder:text-slate-500 transition"
      />
    </label>
  );
}

function SlotImageInput({ slot, value, uploading, onUpload, onClear }) {
  const label = humanizeSlotId(slot.id);
  const fileRef = useRef(null);
  return (
    <div>
      <p className="text-[11px] font-bold text-slate-200 mb-1.5">{label}</p>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-black/40 shrink-0 flex items-center justify-center text-xl">
          {value ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img src={value} alt={`${label} preview`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-500">📷</span>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) onUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full text-left text-xs font-bold rounded-lg px-3 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-300/30 text-pink-100 transition disabled:opacity-60"
          >
            {uploading ? 'Uploading…' : value ? 'Replace photo' : 'Upload photo'}
          </button>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="text-[10px] text-slate-400 hover:text-rose-300 text-left transition"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ThemeSwatchPicker({ activeText, onPick }) {
  return (
    <PanelCard title="🎨 Background & color">
      <div className="grid grid-cols-3 gap-2">
        {THEME_SWATCHES.map((s) => {
          const isActive = activeText.toLowerCase() === s.text.toLowerCase();
          return (
            <button
              key={s.name}
              type="button"
              onClick={() => onPick(s.text)}
              className={`aspect-[3/2] rounded-xl border transition relative overflow-hidden ${
                isActive ? 'border-pink-300 ring-2 ring-pink-300/40' : 'border-white/10 hover:border-white/30'
              }`}
              style={{ background: s.bg }}
              title={s.name}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold tracking-wider"
                style={{ color: s.text }}
              >
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-400 leading-4">
        Picks the text color for this page. The background gradient hint is a preview.
      </p>
    </PanelCard>
  );
}

function MusicPicker({ audioUrl, onChange }) {
  const active = MUSIC_LIBRARY.find((t) => t.url === audioUrl);
  return (
    <PanelCard title="🎵 Background music">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          className={`text-left rounded-xl border px-3 py-2 transition ${
            !audioUrl
              ? 'border-pink-300 bg-pink-500/15 text-pink-100'
              : 'border-white/10 hover:border-white/30 text-slate-300'
          }`}
        >
          <p className="text-[11px] font-extrabold">No music</p>
          <p className="text-[9px] uppercase tracking-[0.16em] mt-0.5 opacity-70">Silent</p>
        </button>
        {MUSIC_LIBRARY.map((t) => {
          const isActive = active?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.url)}
              className={`text-left rounded-xl border px-3 py-2 transition ${
                isActive
                  ? 'border-pink-300 bg-pink-500/15 text-pink-100'
                  : 'border-white/10 hover:border-white/30 text-slate-300'
              }`}
            >
              <p className="text-[11px] font-extrabold truncate">{t.name}</p>
              <p className="text-[9px] uppercase tracking-[0.16em] mt-0.5 opacity-70 truncate">
                {t.mood}
              </p>
            </button>
          );
        })}
      </div>
    </PanelCard>
  );
}

function StickerPalette({ count, onPick, onClearAll }) {
  return (
    <PanelCard title="✨ Stickers on this page">
      <div className="grid grid-cols-8 gap-1">
        {STICKER_PRESETS.map((e, i) => (
          <button
            key={`${e}-${i}`}
            type="button"
            onClick={() => onPick(e)}
            className="aspect-square rounded-lg bg-white/[0.04] hover:bg-pink-500/20 border border-white/10 hover:border-pink-300/40 transition flex items-center justify-center text-lg active:scale-95"
            aria-label={`Add ${e}`}
            title={`Add ${e}`}
          >
            <span aria-hidden>{e}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mt-3 text-[10px] text-slate-400">
        <span>{count} added to this page</span>
        {count > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="font-bold uppercase tracking-[0.16em] text-rose-300 hover:text-rose-200 transition"
          >
            Clear all
          </button>
        )}
      </div>
    </PanelCard>
  );
}

function AnimationPicker({ value, onChange }) {
  return (
    <PanelCard title="🎞️ Page motion">
      <div className="grid grid-cols-2 gap-2">
        {ENTER_ANIM_PRESETS.map((a) => {
          const isActive = value === a.value;
          return (
            <button
              key={a.value}
              type="button"
              onClick={() => onChange(a.value)}
              className={`text-left rounded-xl border px-3 py-2 transition ${
                isActive
                  ? 'border-pink-300 bg-pink-500/15 text-pink-100'
                  : 'border-white/10 hover:border-white/30 text-slate-300'
              }`}
            >
              <p className="text-[11px] font-extrabold truncate">{a.label}</p>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-slate-400 leading-4">
        Applies to new stickers added to this page.
      </p>
    </PanelCard>
  );
}

/* Slot ids tend to be camelCase or snake_case ("photo1", "title_main").
   Turn them into something human-readable for the input labels. */
function humanizeSlotId(id) {
  if (!id) return 'Field';
  return String(id)
    .replace(/[_-]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}
