import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, QrCode, Pencil, Trash2, Search, Wand2, HeartOff } from 'lucide-react';
import { toast } from 'sonner';
import { videosAPI } from '../api/api';
import { isVideoShare } from '../lib/sharePage';
import ConfirmDialog from '../components/ConfirmDialog';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import AnimatedCount from '../ui/AnimatedCount';
import FloatingDecor from '../ui/FloatingDecor';
import { GiftSticker, HeartSticker, MusicSticker } from '../ui/CartoonStickers';
import { fadeUp, stagger } from '../motion/variants';
import useLikedTemplates from '../hooks/useLikedTemplates';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/* Frosted-white pill + dark status-coloured text, so the badge stays
   readable over ANY thumbnail — light pastel placeholders OR bright/dark
   photos (the old light-mint text vanished on the pastel cards). */
const STATUS_STYLE = {
  completed:  { tint: 'rgba(255,255,255,0.9)', border: 'rgba(5,150,105,0.55)',  color: '#047857' },
  processing: { tint: 'rgba(255,255,255,0.9)', border: 'rgba(109,40,217,0.55)', color: '#6D28D9' },
  failed:     { tint: 'rgba(255,255,255,0.9)', border: 'rgba(190,18,60,0.55)',  color: '#BE123C' },
  draft:      { tint: 'rgba(255,255,255,0.9)', border: 'rgba(190,24,93,0.55)',  color: '#BE185D' },
};

const STATUS_EMOJI = {
  completed: '✅',
  processing: '⏳',
  failed: '⚠️',
  draft: '✏️',
};

export default function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVideo, setQrVideo] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  // Read the initial filter from the URL — lets `/liked` redirect land
  // on the Liked filter, and lets the chip selection survive a refresh.
  const initialFilter = (() => {
    const f = searchParams.get('filter');
    return ['all', 'drafts', 'liked'].includes(f) ? f : 'all';
  })();
  const [filter, setFilter] = useState(initialFilter);
  const [copied, setCopied] = useState(false);

  const loadVideos = () => {
    videosAPI.myVideos().then(setVideos).catch(() => setVideos([])).finally(() => setLoading(false));
  };

  useEffect(() => { loadVideos(); }, []);

  const showQR = async (video) => {
    if (video.status !== 'completed') return;
    try {
      const data = await videosAPI.getQR(video._id);
      setQrVideo(video);
      setQrData(data);
    } catch (_) {
      setQrData(null);
    }
  };

  const copyLink = () => {
    if (qrData?.shareUrl) {
      navigator.clipboard.writeText(qrData.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const confirmDeletePage = async () => {
    const video = pendingDelete;
    if (!video) return;
    setDeleteError('');
    setDeletingId(video._id);
    try {
      await videosAPI.delete(video._id);
      setVideos((prev) => prev.filter((v) => v._id !== video._id));
      setPendingDelete(null);
      toast.success('Page deleted.');
      if (qrVideo?._id === video._id) {
        setQrVideo(null);
        setQrData(null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Could not delete');
      toast.error(err.message || 'Could not delete');
    } finally {
      setDeletingId(null);
    }
  };

  const { liked: likedTemplates, toggle: toggleLiked } = useLikedTemplates();
  const [query, setQuery] = useState('');
  // Lock body scroll while the QR popup is open (ConfirmDialog handles its own lock).
  useLockBodyScroll(Boolean(qrData && qrVideo));
  // Liked = admin "basic" templates only (matches what the Liked tab shows).
  const likedAdminCount = useMemo(
    () => (likedTemplates || []).filter((t) => t?.sourceType !== 'BuilderTemplate').length,
    [likedTemplates]
  );
  const stats = useMemo(() => ({
    total:  videos.length,
    drafts: videos.filter((v) => v.status === 'draft').length,
    liked:  likedAdminCount,
  }), [videos, likedAdminCount]);

  const filtered = useMemo(() => {
    /* Decorate items with a discriminator (`__kind`) so the grid can
       render two shapes in one list: real user-created `video` pages,
       and `template`-only cards (liked but never customized). */
    let list = videos.map((v) => ({ __kind: 'video', ...v }));
    if (filter === 'drafts') {
      list = list.filter((v) => v.status === 'draft');
    } else if (filter === 'liked') {
      /* Liked always shows every hearted ADMIN "basic" template as its
         DEFAULT template card, so the user can start fresh from it — even
         if they've ALSO customized it (that customized copy lives under
         All / Drafts and is intentionally not duplicated here). This keeps
         Liked looking like the browse gallery: clean, reusable templates.
         User/builder-made templates never appear in Liked. */
      list = (likedTemplates || [])
        .filter((t) => t?._id && t.sourceType !== 'BuilderTemplate')
        .map((t) => ({ __kind: 'template', ...t }));
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      if (item.__kind === 'template') {
        return (
          (item.name || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q) ||
          (item.description || '').toLowerCase().includes(q)
        );
      }
      const recipient = (item.recipientName || '').toLowerCase();
      const tplName   = (item.templateId?.name || '').toLowerCase();
      const category  = (item.templateId?.category || '').toLowerCase();
      return recipient.includes(q) || tplName.includes(q) || category.includes(q);
    });
  }, [videos, filter, query, likedTemplates]);

  // Smoothly bring the cards section into view when a chip is tapped,
  // mirroring the Dashboard templates-section scroll behavior.
  const scrollToCards = useCallback(() => {
    /* Target the section wrapper (chips + grid) so the chip row is
       still visible after the scroll, mirroring Dashboard's behavior. */
    const el = document.getElementById('my-pages-section');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  // Keep `?filter=…` in sync with the active chip so the URL is shareable
  // and a refresh restores the same view.
  useEffect(() => {
    const current = searchParams.get('filter');
    const next = filter === 'all' ? null : filter;
    if (current === next) return;
    const params = new URLSearchParams(searchParams);
    if (next) params.set('filter', next);
    else params.delete('filter');
    setSearchParams(params, { replace: true });
  }, [filter, searchParams, setSearchParams]);

  // If landing here with a non-default filter (e.g. via /liked redirect),
  // give the grid a beat to mount then scroll it into view.
  useEffect(() => {
    if (initialFilter === 'all') return;
    const t = setTimeout(scrollToCards, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      {/* ─── Hero ─── */}
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="mb-10">
        <GlassCard tone="strong" className="!rounded-[2rem] p-7 sm:p-10 relative overflow-hidden">
          <NeonOrb color="#7C3AED" size="20rem" style={{ top: '-5rem', right: '-5rem' }} />
          <NeonOrb color="#EC4899" size="18rem" style={{ bottom: '-4rem', left: '-3rem' }} opacity={0.4} />
          <FloatingDecor density="subtle" opacity={0.14} size={32} items={['📦', '🎂', '💍', '✨', '🪩', '🎉']} />
          <div className="absolute inset-0 bg-grid-soft opacity-30 pointer-events-none" />

          {/* Cartoon sticker accents in the corners */}
          <motion.div
            className="hidden md:block absolute top-3 right-4 z-10"
            animate={{ y: [0, -8, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <GiftSticker size={56} />
          </motion.div>
          <motion.div
            className="hidden md:block absolute bottom-3 right-20 z-10"
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <HeartSticker size={36} color="#EC4899" />
          </motion.div>
          <motion.div
            className="hidden md:block absolute top-12 right-32 z-10"
            animate={{ y: [0, -6, 0], rotate: [-4, 6, -4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            <MusicSticker size={40} color="#A78BFA" />
          </motion.div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Your studio</span></motion.span>
              <motion.h1 variants={fadeUp} className="section-title mt-5">My pages</motion.h1>
              <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-slate-300 leading-7">
                Every page you've made — share links, QR codes, edit anytime. Your aesthetic, your audience.
              </motion.p>
            </div>
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 sm:gap-3 min-w-[280px] lg:min-w-[360px]">
              {/* Read-only stat tiles — filtering happens via the chip
                  row below, so the cards stay non-interactive. */}
              {[
                { label: 'All',    value: stats.total,  emoji: '✨' },
                { label: 'Drafts', value: stats.drafts, emoji: '✏️' },
                { label: 'Liked',  value: stats.liked,  emoji: '💖' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="card-glass p-4 sm:p-5 text-center select-none"
                  aria-live="polite"
                >
                  <div className="text-xl">{s.emoji}</div>
                  <p className="mt-1 text-3xl font-extrabold font-display">
                    <GradientText variant="cosmic"><AnimatedCount to={s.value} /></GradientText>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-0.5">{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ─── Search bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="search-shell mb-4 flex items-center gap-3 rounded-full px-5 py-3 backdrop-blur max-w-xl"
      >
        <Search size={18} strokeWidth={2} className="search-icon shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by recipient name, template, or category…"
          className="search-input flex-1 bg-transparent outline-none text-sm font-medium"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="search-clear w-6 h-6 rounded-full inline-flex items-center justify-center text-xs"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* ─── Filter chips + grid wrapper ───
          Both the chips and the grid live inside a single anchor section
          so the scroll-into-view lands on the chips first, with the
          first row of cards visible right beneath. */}
      <section id="my-pages-section" style={{ scrollMarginTop: '104px' }}>

      {/* ─── Filter chips — All templates / Drafts / Liked ───
          pt-2 / pb-3 gives the hover-lift visible space. */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-2 pb-3">
        {[
          { id: 'all',    label: 'All',    emoji: '✨' },
          { id: 'drafts', label: 'Drafts', emoji: '✏️' },
          { id: 'liked',  label: 'Liked',  emoji: '💖' },
        ].map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); scrollToCards(); }}
              className={`${active ? 'chip chip-active' : 'chip chip-default'} whitespace-nowrap`}
            >
              <span
                className={`inline-flex items-center justify-center text-base leading-none ${
                  active
                    ? 'w-6 h-6 rounded-full bg-white/95 text-[14px] shadow-[0_2px_6px_-2px_rgba(0,0,0,0.25)]'
                    : ''
                }`}
                aria-hidden="true"
              >
                {f.emoji}
              </span>
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {deleteError && (
        <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{deleteError}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-[1.5rem] bg-white/[0.04] border border-white/10 overflow-hidden relative">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-12 text-center">
            <div className="text-6xl mb-5">🪩</div>
            <h2 className="text-2xl font-display font-extrabold"><GradientText variant="cosmic">No pages yet</GradientText></h2>
            <p className="mt-3 text-slate-400 max-w-md mx-auto">
              Pick a template from the feed and your first story page will land here in minutes.
            </p>
            <Link to="/studio" className="btn-glow mt-7 inline-flex">
              ✨ Browse templates
            </Link>
          </GlassCard>
        </motion.div>
      ) : (
        /* Denser grid — 2 columns at xs, 3 at sm, 4 at md, 5 at xl, so cards
           are smaller and the page fits more at once. */
        <div id="my-pages-grid" style={{ scrollMarginTop: '104px' }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {filtered.map((item, i) => {
            /* Liked-only templates (no saved page yet) render as a
               simpler card with a single "Use this template" CTA. */
            if (item.__kind === 'template') {
              return (
                <LikedTemplateCard
                  key={`tpl-${item._id}`}
                  template={item}
                  index={i}
                  onUnlike={() => { toggleLiked(item); toast.success('Removed from liked'); }}
                />
              );
            }
            const video = item;
            /* Prefer the live ref, but fall back to the id snapshotted into
               the user's own copy — so Edit still works after the admin
               deletes the source template (the populated ref becomes null). */
            const templateRef =
              (video.templateId && typeof video.templateId === 'object' ? video.templateId._id : video.templateId) ||
              video.customizations?.templateId ||
              '';
            const templateName = video.templateId?.name || video.customizations?.templateName || 'Untitled page';
            /* Build the wizard URL for this page — thread the draft id,
               recipient, and sourceType so the wizard reopens exactly
               where the user left off. */
            const editHref = (() => {
              if (!templateRef) return '';
              const qs = new URLSearchParams({ edit: String(video._id) });
              if (video.recipientName) qs.set('for', video.recipientName);
              if (video.sourceType === 'BuilderTemplate') qs.set('src', 'BuilderTemplate');
              return `/template/${templateRef}/customize?${qs.toString()}`;
            })();
            const status = STATUS_STYLE[video.status] || STATUS_STYLE.draft;
            return (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              >
                {/* No `overflow-hidden` on the card so the icon-button
                    tooltips can escape upward instead of being clipped
                    by the card edge. The image area below has its own
                    `overflow-hidden` + explicit rounded top corners. */}
                <GlassCard withSpotlight className="group !rounded-2xl my-page-card relative">
                  <div className="aspect-[4/5] relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-violet-200 via-fuchsia-200 to-pink-200">
                    {video.thumbnailUrl || video.videoUrl ? (
                      <img
                        src={video.thumbnailUrl || video.videoUrl}
                        alt=""
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.08]"
                        /* Hide a broken/empty thumbnail so only the clean
                           pastel placeholder shows (no broken-image glyph). */
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
                        {STATUS_EMOJI[video.status] || '🎬'}
                      </div>
                    )}
                    <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] border backdrop-blur"
                        style={{ background: status.tint, borderColor: status.border, color: status.color }}
                      >
                        <span>{STATUS_EMOJI[video.status] || '•'}</span> {video.status}
                      </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                    {/* Recipient name is the headline if set — that's who
                        the page was made for. Template name + category
                        sit below as supporting metadata. */}
                    <div className="absolute inset-x-2 bottom-2">
                      <h3 className="font-display font-extrabold text-white text-sm drop-shadow line-clamp-1">
                        {video.recipientName ? (
                          <span className="inline-flex items-center gap-1">
                            <span aria-hidden="true">💌</span>
                            For {video.recipientName}
                          </span>
                        ) : (
                          templateName
                        )}
                      </h3>
                      {video.recipientName && (
                        <p className="text-[10px] text-white/80 line-clamp-1">{templateName}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] truncate">
                        {video.templateId?.category || 'Event'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Open page — drafts open in the editor (preview-by-
                          editing), completed open the live share URL. */}
                      {(video.status === 'completed' || video.status === 'draft') && (
                        <a
                          href={
                            video.status === 'draft'
                              ? editHref
                              : `/watch/${video.shareSlug}`
                          }
                          target={video.status === 'draft' ? undefined : '_blank'}
                          rel={video.status === 'draft' ? undefined : 'noopener noreferrer'}
                          className="my-page-icon-btn my-page-icon-btn-primary"
                          data-tooltip={
                            video.status === 'draft'
                              ? 'Open draft'
                              : isVideoShare(video) ? 'Open video' : 'Open page'
                          }
                          data-tooltip-pos="top"
                          aria-label="Open"
                        >
                          <ExternalLink size={14} strokeWidth={2.2} />
                        </a>
                      )}
                      {/* Share QR — only when the page is actually live. */}
                      {video.status === 'completed' && (
                        <button
                          onClick={() => showQR(video)}
                          className="my-page-icon-btn my-page-icon-btn-soft"
                          data-tooltip="Share QR + link"
                          data-tooltip-pos="top"
                          aria-label="Share QR"
                        >
                          <QrCode size={14} strokeWidth={2.2} />
                        </button>
                      )}
                      {/* Edit — drafts + completed + failed all editable. */}
                      {templateRef && (video.status === 'draft' || video.status === 'completed' || video.status === 'failed') && (
                        <Link
                          to={editHref}
                          className="my-page-icon-btn my-page-icon-btn-ghost"
                          data-tooltip="Edit"
                          data-tooltip-pos="top"
                          aria-label="Edit"
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingDelete(video)}
                        disabled={deletingId === video._id}
                        className="my-page-icon-btn my-page-icon-btn-danger ml-auto"
                        data-tooltip="Delete"
                        data-tooltip-pos="top"
                        data-tooltip-align="end"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      </section>

      <ConfirmDialog
        open={pendingDelete != null}
        title="Delete this page?"
        description="The share link will stop working and visitors will no longer see this page."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={Boolean(pendingDelete && deletingId === pendingDelete._id)}
        onClose={() => {
          if (deletingId === pendingDelete?._id) return;
          setPendingDelete(null);
        }}
        onConfirm={confirmDeletePage}
      />

      {/* QR popup — portaled to <body> so it escapes any motion.main
          transform/filter that would otherwise become its containing
          block and position the popup off-center. */}
      {typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        {qrData && qrVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            data-lenis-prevent
            onClick={() => setQrVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="tpl-modal-card rounded-[2rem] p-8 max-w-sm w-full text-center relative"
            >
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
              <div className="story-ring p-[3px] w-fit mx-auto mb-4">
                <div
                  className="px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.22em]"
                  style={{
                    background: 'linear-gradient(120deg, #C4B5FD 0%, #F9A8D4 50%, #A78BFA 100%)',
                    color: '#FFFFFF',
                    WebkitTextFillColor: '#FFFFFF',
                  }}
                >
                  Share
                </div>
              </div>
              <h3 className="tpl-modal-title text-xl font-extrabold font-display mb-1.5">Spread the vibe</h3>
              {(qrData.recipientName || qrVideo?.recipientName) && (
                <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold border mb-3" style={{ background: 'rgba(167,139,250,0.12)', borderColor: 'rgba(167,139,250,0.40)', color: '#5B21B6' }}>
                  <span aria-hidden="true">💌</span>
                  Dedicated to <span className="truncate max-w-[18ch]">{qrData.recipientName || qrVideo?.recipientName}</span>
                </p>
              )}
              <p className="tpl-modal-desc text-sm mb-6">Scan the QR or copy the share link below.</p>
              {qrData.qrCode && (
                <div className="story-ring p-[3px] w-fit mx-auto mb-5">
                  <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48 rounded-3xl bg-white p-2" />
                </div>
              )}
              <p className="tpl-modal-input text-xs break-all mb-4 rounded-2xl px-3 py-2 border font-mono">
                {qrData.shareUrl}
              </p>
              <button onClick={copyLink} className="btn-glow w-full">
                {copied ? '✅ Copied!' : '🔗 Copy link'}
              </button>
              <button
                onClick={() => setQrVideo(null)}
                className="tpl-modal-cancel w-full mt-2 px-5 py-2.5 rounded-full text-sm font-bold transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
}

/**
 * Card shown in the Liked filter for a template the user has hearted
 * but not yet customized — clicking takes them to the template
 * preview. Includes a quick "unlike" affordance so the card doesn't
 * stick around once they change their mind.
 */
function LikedTemplateCard({ template, index, onUnlike }) {
  const src = template.sourceType === 'BuilderTemplate' ? '?src=BuilderTemplate' : '';
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard withSpotlight className="group !rounded-2xl my-page-card relative">
        <Link
          to={`/template/${template._id}${src}`}
          className="block aspect-[4/5] relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-violet-200 via-fuchsia-200 to-pink-200"
        >
          {template.thumbnailUrl || template.previewVideoUrl ? (
            <img
              src={template.thumbnailUrl || template.previewVideoUrl}
              alt={template.name || 'Template'}
              className="w-full h-full object-cover transition duration-700 group-hover:scale-[1.08]"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
              💖
            </div>
          )}
          <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] border backdrop-blur"
              style={{ background: 'rgba(244,114,182,0.18)', borderColor: 'rgba(244,114,182,0.45)', color: '#FBCFE8' }}
            >
              <span>💖</span> Liked
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
          <div className="absolute inset-x-2 bottom-2">
            <h3 className="font-display font-extrabold text-white text-sm drop-shadow line-clamp-1">
              {template.name || 'Untitled'}
            </h3>
            <p className="text-[10px] text-white/80 line-clamp-1">{template.category || 'Template'}</p>
          </div>
        </Link>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] truncate">
              Saved template
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              to={`/template/${template._id}${src}`}
              className="my-page-icon-btn my-page-icon-btn-primary"
              data-tooltip="Use this template"
              data-tooltip-pos="top"
              aria-label="Use this template"
            >
              <Wand2 size={14} strokeWidth={2.2} />
            </Link>
            <button
              type="button"
              onClick={onUnlike}
              className="my-page-icon-btn my-page-icon-btn-ghost ml-auto"
              data-tooltip="Remove from liked"
              data-tooltip-pos="top"
              data-tooltip-align="end"
              aria-label="Remove from liked"
            >
              <HeartOff size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
