import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const STATUS_STYLE = {
  completed:  { tint: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.45)', color: '#6EE7B7' },
  processing: { tint: 'rgba(251,191,36,0.18)', border: 'rgba(251,191,36,0.45)', color: '#FCD34D' },
  failed:     { tint: 'rgba(244,63,94,0.18)',  border: 'rgba(244,63,94,0.45)',  color: '#FCA5A5' },
  draft:      { tint: 'rgba(148,163,184,0.16)', border: 'rgba(148,163,184,0.40)', color: '#CBD5E1' },
};

const STATUS_EMOJI = {
  completed: '✅',
  processing: '⏳',
  failed: '⚠️',
  draft: '📝',
};

export default function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVideo, setQrVideo] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [filter, setFilter] = useState('all');
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
      if (qrVideo?._id === video._id) {
        setQrVideo(null);
        setQrData(null);
      }
    } catch (err) {
      setDeleteError(err.message || 'Could not delete');
    } finally {
      setDeletingId(null);
    }
  };

  const { count: likedCount } = useLikedTemplates();
  // Lock body scroll while the QR popup is open (ConfirmDialog handles its own lock).
  useLockBodyScroll(Boolean(qrData && qrVideo));
  const stats = useMemo(() => ({
    total:      videos.length,
    live:       videos.filter((v) => v.status === 'completed').length,
    processing: videos.filter((v) => v.status === 'processing').length,
    liked:      likedCount,
  }), [videos, likedCount]);

  const filtered = useMemo(() => {
    if (filter === 'all') return videos;
    if (filter === 'live') return videos.filter((v) => v.status === 'completed');
    if (filter === 'processing') return videos.filter((v) => v.status === 'processing');
    if (filter === 'failed') return videos.filter((v) => v.status === 'failed');
    return videos;
  }, [videos, filter]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* ─── Hero ─── */}
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="mb-10">
        <GlassCard tone="strong" className="!rounded-[2rem] p-7 sm:p-10 relative overflow-hidden">
          <NeonOrb color="#7C3AED" size="20rem" style={{ top: '-5rem', right: '-5rem' }} />
          <NeonOrb color="#F472B6" size="18rem" style={{ bottom: '-4rem', left: '-3rem' }} opacity={0.4} />
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
            <HeartSticker size={36} color="#F472B6" />
          </motion.div>
          <motion.div
            className="hidden md:block absolute top-12 right-32 z-10"
            animate={{ y: [0, -6, 0], rotate: [-4, 6, -4] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          >
            <MusicSticker size={40} color="#22D3EE" />
          </motion.div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Your studio</span></motion.span>
              <motion.h1 variants={fadeUp} className="section-title mt-5">My pages</motion.h1>
              <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-slate-300 leading-7">
                Every page you've made — share links, QR codes, edit anytime. Your aesthetic, your audience.
              </motion.p>
            </div>
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 min-w-[280px] lg:min-w-[460px]">
              {[
                { label: 'Total',    value: stats.total,      emoji: '📦' },
                { label: 'Live',     value: stats.live,       emoji: '🟢' },
                { label: 'Building', value: stats.processing, emoji: '⏳' },
                { label: 'Liked',    value: stats.liked,      emoji: '💖', to: '/liked' },
              ].map((s) => {
                const inner = (
                  <>
                    <div className="text-xl">{s.emoji}</div>
                    <p className="mt-1 text-3xl font-extrabold font-display">
                      <GradientText variant="cosmic"><AnimatedCount to={s.value} /></GradientText>
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-0.5">{s.label}</p>
                  </>
                );
                return s.to ? (
                  <Link key={s.label} to={s.to} className="card-glass p-4 sm:p-5 text-center hover:border-white/25 transition">
                    {inner}
                  </Link>
                ) : (
                  <div key={s.label} className="card-glass p-4 sm:p-5 text-center">
                    {inner}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ─── Filter chips ─── */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all',        label: 'All',      emoji: '✨' },
          { id: 'live',       label: 'Live',     emoji: '🟢' },
          { id: 'processing', label: 'Building', emoji: '⏳' },
          { id: 'failed',     label: 'Failed',   emoji: '⚠️' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`${filter === f.id ? 'chip chip-active' : 'chip chip-default'} whitespace-nowrap`}
          >
            <span>{f.emoji}</span><span>{f.label}</span>
          </button>
        ))}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video, i) => {
            const templateRef = video.templateId && typeof video.templateId === 'object' ? video.templateId._id : video.templateId;
            const status = STATUS_STYLE[video.status] || STATUS_STYLE.draft;
            return (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard withSpotlight className="overflow-hidden group">
                  <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-brand-500 via-fuchsia-500 to-cyan-500">
                    {video.thumbnailUrl || video.videoUrl ? (
                      <img src={video.thumbnailUrl || video.videoUrl} alt="" className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">
                        {STATUS_EMOJI[video.status] || '🎬'}
                      </div>
                    )}
                    <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] border backdrop-blur"
                        style={{ background: status.tint, borderColor: status.border, color: status.color }}
                      >
                        <span>{STATUS_EMOJI[video.status] || '•'}</span> {video.status}
                      </span>
                      {video.status === 'completed' && (
                        <span className="badge-pill">
                          {isVideoShare(video) ? '🎞 Video' : '🌐 Page'}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    <h3 className="absolute inset-x-3 bottom-3 font-display font-extrabold text-white text-lg drop-shadow line-clamp-2">
                      {video.templateId?.name || 'Untitled page'}
                    </h3>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em]">
                      {video.templateId?.category || 'Event'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {video.status === 'completed' && (
                        <>
                          <a
                            href={`/watch/${video.shareSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-pill-dark !py-2 !px-3 !text-xs"
                          >
                            {isVideoShare(video) ? '▶ Open video' : '🌐 Open page'}
                          </a>
                          <button onClick={() => showQR(video)} className="btn-pill-soft !py-2 !px-3 !text-xs">
                            🔗 QR
                          </button>
                        </>
                      )}
                      {templateRef && (video.status === 'completed' || video.status === 'failed') && (
                        <Link
                          to={`/template/${templateRef}?edit=${video._id}`}
                          className="btn-ghost !py-2 !px-3 !text-xs"
                        >
                          ✏️ Edit
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => setPendingDelete(video)}
                        disabled={deletingId === video._id}
                        className="inline-flex items-center justify-center gap-1 rounded-full bg-rose-500/10 border border-rose-400/30 text-rose-300 px-3 py-2 text-xs font-bold hover:bg-rose-500/20 transition active:scale-95 disabled:opacity-50"
                      >
                        {deletingId === video._id ? 'Deleting…' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

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
              className="tpl-modal-card tpl-modal-scroll rounded-[2rem] p-8 max-w-sm w-full text-center relative"
            >
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
              <div className="story-ring p-[3px] w-fit mx-auto mb-4">
                <div className="px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em]">
                  <span className="gradient-text">Share</span>
                </div>
              </div>
              <h3 className="tpl-modal-title text-xl font-extrabold font-display mb-1.5">Spread the vibe</h3>
              <p className="tpl-modal-desc text-sm mb-6">Scan the QR or copy the share link below.</p>
              {qrData.qrCode && (
                <div className="story-ring p-[3px] w-fit mx-auto mb-5">
                  <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48 rounded-3xl bg-white p-2" />
                </div>
              )}
              <p className="text-xs break-all mb-4 rounded-2xl px-3 py-2 border tpl-modal-input">
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
