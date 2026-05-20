import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { publicAPI } from '../api/api';
import SlideshowBuilder from '../components/SlideshowBuilder';
import { getSharePageStructure, isSlideshowShare, isVideoShare } from '../lib/sharePage';

export default function Watch() {
  const { slug } = useParams();
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-xl text-zinc-400 mb-4">This page isn&apos;t ready or doesn&apos;t exist.</p>
          <Link to="/" className="text-brand-400 hover:underline">
            Go home
          </Link>
        </motion.div>
      </div>
    );
  }

  const structure = getSharePageStructure(video);
  const fills = video.customizations?.slots || {};
  const showSlideshow = isSlideshowShare(video) && structure;

  if (showSlideshow && structure) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <header className="border-b border-white/10 bg-black/40 px-4 py-3 text-center">
          <p className="text-sm text-zinc-500">
            {video.templateId?.name}
            {video.templateId?.category ? ` · ${video.templateId.category}` : ''}
          </p>
        </header>
        <div className="flex-1 flex items-stretch justify-center p-4 md:p-8">
          <div className="w-full max-w-3xl">
            <SlideshowBuilder
              structure={structure}
              fills={fills}
              themeOverrides={video.customizations?.themeOverrides || {}}
              className="min-h-[70vh] shadow-2xl"
            />
          </div>
        </div>
        <footer className="py-4 text-center text-xs text-zinc-600">
          Storyly · shared with you
        </footer>
      </div>
    );
  }

  if (isVideoShare(video)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <video src={video.videoUrl} controls autoPlay className="w-full rounded-2xl shadow-2xl" />
          <p className="text-center text-zinc-500 mt-4">
            {video.templateId?.name} • {video.templateId?.category}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-zinc-950 text-zinc-400 text-center">
      <p className="max-w-md">
        This share link has no page layout or video yet. The website design may need a valid layout in the admin
        panel, or the record may be old — try publishing again from the dashboard.
      </p>
      <Link to="/" className="text-brand-400 hover:underline">
        Go home
      </Link>
    </div>
  );
}
