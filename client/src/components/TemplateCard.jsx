import { useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORY_GRADIENT = {
  Love: 'from-rose-400 via-pink-500 to-fuchsia-500',
  Friendship: 'from-amber-400 via-orange-500 to-rose-500',
  Birthday: 'from-fuchsia-400 via-purple-500 to-indigo-500',
  Memories: 'from-sky-400 via-indigo-500 to-violet-500',
  Wedding: 'from-rose-300 via-fuchsia-400 to-violet-400',
  Event: 'from-emerald-400 via-cyan-500 to-sky-500',
};

const CATEGORY_EMOJI = {
  Love: '💖',
  Friendship: '🫶',
  Birthday: '🎂',
  Memories: '📸',
  Wedding: '💍',
  Event: '✨',
};

export default function TemplateCard({ template }) {
  const [liked, setLiked] = useState(false);
  const cat = template.category || 'Event';
  const grad = CATEGORY_GRADIENT[cat] || CATEGORY_GRADIENT.Event;
  const emoji = CATEGORY_EMOJI[cat] || '✨';

  return (
    <motion.article
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="card-glass overflow-hidden group cursor-pointer"
    >
      {/* Media — 4:5 like an Instagram post */}
      <div className={`aspect-[4/5] relative overflow-hidden bg-gradient-to-br ${grad}`}>
        {template.thumbnailUrl || template.previewVideoUrl ? (
          <>
            <img
              src={template.thumbnailUrl || template.previewVideoUrl}
              alt={template.name}
              className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
            />
            {template.previewVideoUrl && (
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                <span className="w-14 h-14 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-2xl text-slate-900 shadow-lg">▶</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
            {emoji}
          </div>
        )}

        {/* Top overlays: category pill + like */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
          <span className="badge-pill">
            <span>{emoji}</span>
            <span>{cat}</span>
          </span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLiked((v) => !v); }}
            className="w-9 h-9 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-sm transition active:scale-90"
            aria-label={liked ? 'Unsave' : 'Save'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#f43f5e' : 'none'} stroke={liked ? '#f43f5e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Bottom gradient + title peek on hover */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2 text-white">
          <h3 className="text-base sm:text-lg font-extrabold drop-shadow font-display leading-tight line-clamp-2">
            {template.name}
          </h3>
        </div>
      </div>

      {/* Footer caption */}
      <div className="p-4">
        {template.description && (
          <p className="text-sm leading-6 text-slate-600 line-clamp-2 mb-3">{template.description}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500">
            {template.duration ? `${template.duration}s vibe` : 'Quick build'}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold gradient-text">
            Customize →
          </span>
        </div>
      </div>
    </motion.article>
  );
}
