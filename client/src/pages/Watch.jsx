import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { publicAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { getSharePageStructure, isSlideshowShare, isVideoShare } from '../lib/sharePage';
import { StorylyMark } from '../components/StorylyLogo';
import AuroraBackground from '../ui/AuroraBackground';
import FloatingDecor from '../ui/FloatingDecor';
import { ConfettiSticker, BalloonSticker, HeartSticker } from '../ui/CartoonStickers';

export default function Watch() {
  const { slug } = useParams();
  const { user } = useAuth();
  const homeTo = user ? '/studio' : '/';
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    publicAPI
      .getVideoBySlug(slug)
      .then(setVideo)
      .catch(() => setError('notfound'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 relative overflow-hidden">
        <AuroraBackground variant="cosmic" intensity={0.5} showGrid={false} />
        <div className="relative flex flex-col items-center gap-4">
          <div className="story-ring p-[3px] animate-pulse">
            <div className="bg-ink-900 p-3">
              <StorylyMark size={48} idSuffix="watch-loader" />
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.32em] font-bold text-slate-400">Loading story</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-ink-950 relative overflow-hidden">
        <AuroraBackground variant="cosmic" intensity={0.4} showGrid={false} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-center max-w-md"
        >
          <div className="text-7xl mb-6">🫥</div>
          <h1 className="font-display text-3xl font-extrabold text-white">Story not found</h1>
          <p className="mt-3 text-slate-400">This page isn’t ready or doesn’t exist.</p>
          <Link to={homeTo} className="btn-glow mt-8 inline-flex">Go home</Link>
        </motion.div>
      </div>
    );
  }

  const structure = getSharePageStructure(video);
  const fills = video.customizations?.slots || {};
  const showSlideshow = isSlideshowShare(video) && structure;

  if (showSlideshow && structure) {
    return (
      <div className="min-h-screen flex flex-col bg-ink-950 relative overflow-hidden">
        <AuroraBackground variant="cosmic" intensity={0.55} showGrid={false} />
        <FloatingDecor density="subtle" opacity={0.14} size={42} />

        {/* Corner stickers — make public share page feel celebratory */}
        <motion.div
          className="hidden md:block absolute top-20 left-10 z-10"
          animate={{ y: [0, -10, 0], rotate: [-6, 8, -6] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BalloonSticker size={64} color="#F472B6" />
        </motion.div>
        <motion.div
          className="hidden md:block absolute top-24 right-10 z-10"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'linear' }}
        >
          <ConfettiSticker size={56} />
        </motion.div>
        <motion.div
          className="hidden md:block absolute bottom-24 left-1/4 z-10"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HeartSticker size={48} color="#F43F5E" />
        </motion.div>
        <header className="relative border-b border-white/10 backdrop-blur-xl bg-ink-900/40 px-4 py-3.5">
          <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <StorylyMark size={28} idSuffix="watch-head" />
              <span className="storyly-wordmark font-display font-extrabold text-sm tracking-tight">Storyly</span>
            </Link>
            <p className="text-xs sm:text-sm text-slate-300 truncate">
              <span className="text-white font-semibold">{video.templateId?.name}</span>
              {video.templateId?.category ? <span className="text-slate-500"> · {video.templateId.category}</span> : null}
            </p>
            <span className="badge-pill badge-neon hidden sm:inline-flex">
              <span>Live</span>
            </span>
          </div>
        </header>

        <div className="relative flex-1 flex items-stretch justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-3xl"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-br from-brand-500/40 via-cyan-500/30 to-fuchsia-500/30 blur-2xl opacity-60" />
              <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-pop">
                <SlideshowBuilder
                  structure={structure}
                  fills={fills}
                  themeOverrides={video.customizations?.themeOverrides || {}}
                  className="min-h-[70vh]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <footer className="relative py-4 text-center text-xs uppercase tracking-[0.22em] text-slate-500 font-semibold">
          Powered by <span className="gradient-text font-bold">Storyly</span>
        </footer>
      </div>
    );
  }

  if (isVideoShare(video)) {
    return (
      <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <AuroraBackground variant="cosmic" intensity={0.4} showGrid={false} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative w-full max-w-4xl"
        >
          <div className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-br from-brand-500/30 to-cyan-500/30 blur-2xl opacity-60" />
          <div className="relative rounded-[1.75rem] overflow-hidden border border-white/10 shadow-pop">
            <video src={video.videoUrl} controls autoPlay className="w-full" />
          </div>
          <p className="text-center text-slate-400 mt-6">
            <span className="text-white font-semibold">{video.templateId?.name}</span>
            <span className="text-slate-500"> · {video.templateId?.category}</span>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-ink-950 text-slate-300 text-center relative overflow-hidden">
      <AuroraBackground variant="cosmic" intensity={0.3} showGrid={false} />
      <div className="relative max-w-md">
        <div className="text-6xl mb-5">📝</div>
        <p>
          This share link has no page layout or video yet. The website design may need a valid layout in the admin panel, or the record may be old — try publishing again from the dashboard.
        </p>
        <Link to={homeTo} className="btn-glow mt-6 inline-flex">Go home</Link>
      </div>
    </div>
  );
}
