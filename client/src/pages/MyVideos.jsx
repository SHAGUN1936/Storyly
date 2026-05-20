import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { videosAPI } from '../api/api';
import { isVideoShare } from '../lib/sharePage';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MyVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrVideo, setQrVideo] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadVideos = () => {
    videosAPI.myVideos().then(setVideos).catch(() => setVideos([])).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVideos();
  }, []);

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

  return (
    <div className="max-w-5xl mx-auto">
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold gradient-text mb-2"
      >
        My pages
      </motion.h1>
      <p className="text-zinc-400 mb-8 max-w-2xl">
        Your published Storyly pages — shareable links and videos. Send the link or QR so anyone can open them.
      </p>
      {deleteError && <p className="text-red-400 text-sm mb-4">{deleteError}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-zinc-500 py-12 text-center"
        >
          No pages yet. Choose a website from the home gallery, customize it, and publish.
        </motion.p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {videos.map((video, i) => {
            const templateRef = video.templateId && typeof video.templateId === 'object' ? video.templateId._id : video.templateId;
            return (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl overflow-hidden"
            >
              <div className="aspect-video bg-dark-700 relative">
                {video.thumbnailUrl || video.videoUrl ? (
                  <img
                    src={video.thumbnailUrl || video.videoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">
                      {video.status === 'processing' ? '⏳' : video.status === 'failed' ? '❌' : '🎬'}
                    </span>
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-xs capitalize">
                  {video.status}
                </span>
                {video.status === 'completed' && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-500/40 text-[10px] font-medium text-white">
                    {isVideoShare(video) ? 'Video' : 'Mini-site'}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white">{video.templateId?.name || 'Page'}</h3>
                <p className="text-sm text-zinc-500">{video.templateId?.category}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {video.status === 'completed' && (
                    <>
                      <a
                        href={`/watch/${video.shareSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition"
                      >
                        {isVideoShare(video) ? 'Open video' : 'Open page'}
                      </a>
                      <button
                        onClick={() => showQR(video)}
                        className="text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition"
                      >
                        QR & Link
                      </button>
                    </>
                  )}
                  {templateRef && (video.status === 'completed' || video.status === 'failed') && (
                    <Link
                      to={`/template/${templateRef}?edit=${video._id}`}
                      className="text-sm px-3 py-1.5 rounded-lg bg-white/10 text-zinc-200 hover:bg-white/15 transition"
                    >
                      Edit
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingDelete(video)}
                    disabled={deletingId === video._id}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition disabled:opacity-50"
                  >
                    {deletingId === video._id ? 'Deleting…' : 'Delete'}
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

      {qrData && qrVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setQrVideo(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl p-8 max-w-sm w-full text-center"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Share your page</h3>
            <p className="text-sm text-zinc-400 mb-4">Scan the QR code or copy the link — opens your public mini-site or video.</p>
            {qrData.qrCode && (
              <img src={qrData.qrCode} alt="QR Code" className="w-48 h-48 mx-auto mb-4 rounded-lg bg-white p-2" />
            )}
            <p className="text-xs text-zinc-500 break-all mb-3">{qrData.shareUrl}</p>
            <button
              onClick={copyLink}
              className="w-full py-2 rounded-xl bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition"
            >
              Copy link
            </button>
            <button
              onClick={() => setQrVideo(null)}
              className="w-full mt-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
