import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { videosAPI } from '../api/api';
import { isVideoShare } from '../lib/sharePage';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_STYLE = {
  completed: 'bg-mint-500/15 text-emerald-700 border-emerald-200',
  processing: 'bg-amber-100 text-amber-700 border-amber-200',
  failed: 'bg-rose-100 text-rose-700 border-rose-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
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

  const stats = useMemo(() => ({
    total: videos.length,
    live: videos.filter((v) => v.status === 'completed').length,
    processing: videos.filter((v) => v.status === 'processing').length,
  }), [videos]);

  const filtered = useMemo(() => {
    if (filter === 'all') return videos;
    if (filter === 'live') return videos.filter((v) => v.status === 'completed');
    if (filter === 'processing') return videos.filter((v) => v.status === 'processing');
    if (filter === 'failed') return videos.filter((v) => v.status === 'failed');
    return videos;
  }, [videos, filter]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero stat bar (profile-ish) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel mb-8 relative overflow-hidden"
      >
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="absolute -left-12 bottom-0 w-40 h-40 rounded-full bg-peach-400/20 floating-ring" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow">📚 Your studio</span>
            <h1 className="section-title mt-4">My pages</h1>
            <p className="mt-3 max-w-2xl text-slate-600 leading-7">
              Every page you've made — share links, QR codes, edit anytime. Your aesthetic, your audience.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: 'Total', value: stats.total, emoji: '📦' },
              { label: 'Live', value: stats.live, emoji: '🟢' },
              { label: 'Building', value: stats.processing, emoji: '⏳' },
            ].map((s) => (
              <div key={s.label} className="card-glass p-4 sm:p-5 text-center">
                <div className="text-lg sm:text-xl">{s.emoji}</div>
                <p className="mt-1 text-2xl sm:text-3xl font-extrabold gradient-text font-display">{s.value}</p>
                <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'all', label: 'All', emoji: '✨' },
          { id: 'live', label: 'Live', emoji: '🟢' },
          { id: 'processing', label: 'Building', emoji: '⏳' },
          { id: 'failed', label: 'Failed', emoji: '⚠️' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`${filter === f.id ? 'chip-active' : 'chip-default'} whitespace-nowrap`}
          >
            <span>{f.emoji}</span><span>{f.label}</span>
          </button>
        ))}
      </div>

      {deleteError && (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{deleteError}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-white/70 border border-white/70 overflow-hidden relative">
              <div className="absolute inset-0 shimmer animate-shimmer" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-12 text-center"
        >
          <div className="text-6xl mb-4">🪩</div>
          <h2 className="text-2xl font-extrabold font-display gradient-text">No pages yet</h2>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            Pick a template from the feed and your first story page will land here in minutes.
          </p>
          <Link to="/" className="btn-glow mt-6">
            ✨ Browse templates
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((video, i) => {
            const templateRef = video.templateId && typeof video.templateId === 'object' ? video.templateId._id : video.templateId;
            const statusStyle = STATUS_STYLE[video.status] || STATUS_STYLE.draft;
            return (
              <motion.div
                key={video._id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="card-glass overflow-hidden group"
              >
                <div className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-brand-400 via-peach-400 to-sunset-400">
                  {video.thumbnailUrl || video.videoUrl ? (
                    <img src={video.thumbnailUrl || video.videoUrl} alt="" className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">
                      {STATUS_EMOJI[video.status] || '🎬'}
                    </div>
                  )}
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider border ${statusStyle}`}>
                      <span>{STATUS_EMOJI[video.status] || '•'}</span> {video.status}
                    </span>
                    {video.status === 'completed' && (
                      <span className="badge-pill">
                        {isVideoShare(video) ? '🎞 Video' : '🌐 Page'}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
                  <h3 className="absolute inset-x-3 bottom-3 font-display font-extrabold text-white text-lg drop-shadow line-clamp-2">
                    {video.templateId?.name || 'Untitled page'}
                  </h3>
                </div>

                <div className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {video.templateId?.category || 'Event'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {video.status === 'completed' && (
                      <>
                        <a
                          href={`/watch/${video.shareSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-pill-dark"
                        >
                          {isVideoShare(video) ? '▶ Open video' : '🌐 Open page'}
                        </a>
                        <button onClick={() => showQR(video)} className="btn-pill-soft">
                          🔗 QR
                        </button>
                      </>
                    )}
                    {templateRef && (video.status === 'completed' || video.status === 'failed') && (
                      <Link
                        to={`/template/${templateRef}?edit=${video._id}`}
                        className="btn-ghost !py-2 !text-xs"
                      >
                        ✏️ Edit
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(video)}
                      disabled={deletingId === video._id}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 text-xs font-semibold hover:bg-rose-100 transition active:scale-95 disabled:opacity-50"
                    >
                      {deletingId === video._id ? 'Deleting…' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
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

      <AnimatePresence>
        {qrData && qrVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setQrVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="tpl-modal-card rounded-[2rem] border p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="story-ring p-[3px] w-fit mx-auto mb-4">
                <div className="bg-white dark:bg-slate-900 px-4 py-2 text-xs font-extrabold uppercase tracking-widest gradient-text">Share</div>
              </div>
              <h3 className="text-xl font-extrabold font-display !text-slate-900 dark:!text-white mb-1">Spread the vibe</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">Scan the QR or copy the share link below.</p>
              {qrData.qrCode && (
                <div className="story-ring p-[3px] w-fit mx-auto mb-5">
                  <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48 rounded-3xl bg-white p-2" />
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 break-all mb-4 rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2 border border-slate-200 dark:border-white/10">
                {qrData.shareUrl}
              </p>
              <button onClick={copyLink} className="btn-glow w-full">
                {copied ? '✅ Copied!' : '🔗 Copy link'}
              </button>
              <button
                onClick={() => setQrVideo(null)}
                className="w-full mt-2 rounded-full border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
