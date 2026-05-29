import { motion } from 'framer-motion';
import useMouseGlow from '../motion/useMouseGlow';
import useLikedTemplates from '../hooks/useLikedTemplates';
import {
  HeartSticker, ChatSticker, CakeSticker, StarSticker,
  RingSticker, ConfettiSticker, GiftSticker, BalloonSticker, MusicSticker,
} from '../ui/CartoonStickers';

const CATEGORY_GRADIENT = {
  Love:       'from-rose-400 via-fuchsia-500 to-violet-600',
  Friendship: 'from-amber-400 via-fuchsia-500 to-rose-500',
  Birthday:   'from-fuchsia-400 via-purple-500 to-indigo-600',
  Memories:   'from-sky-400 via-indigo-500 to-violet-500',
  Wedding:    'from-rose-300 via-fuchsia-500 to-violet-500',
  Event:      'from-emerald-400 via-cyan-500 to-fuchsia-500',
  Invitation: 'from-cyan-400 via-violet-500 to-fuchsia-600',
  Couple:     'from-pink-400 via-rose-500 to-fuchsia-600',
  Greeting:   'from-amber-300 via-rose-400 to-fuchsia-500',
};

/** Each category renders as a cartoon SVG sticker instead of an emoji. */
const CATEGORY_STICKER = {
  Love:       HeartSticker,
  Friendship: ChatSticker,
  Birthday:   CakeSticker,
  Memories:   StarSticker,
  Wedding:    RingSticker,
  Event:      ConfettiSticker,
  Invitation: GiftSticker,
  Couple:     HeartSticker,
  Greeting:   BalloonSticker,
};

export default function TemplateCard({ template }) {
  const { isLiked, toggle } = useLikedTemplates();
  const liked = isLiked(template._id);
  const cat = template.category || 'Event';
  const grad = CATEGORY_GRADIENT[cat] || CATEGORY_GRADIENT.Event;
  const CategorySticker = CATEGORY_STICKER[cat] || ConfettiSticker;
  const ref = useMouseGlow();

  return (
    <motion.article
      ref={ref}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      className="card-glass spotlight overflow-hidden group cursor-pointer relative !rounded-2xl"
    >
      {/* Gradient halo on hover */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500"
        style={{
          background:
            'linear-gradient(135deg, rgba(168,85,247,0.55), rgba(6,182,212,0.55) 50%, rgba(244,114,182,0.55))',
          padding: '1px',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Media — 4:5 portrait */}
      <div className={`aspect-[4/5] relative overflow-hidden bg-gradient-to-br ${grad}`}>
        {template.thumbnailUrl || template.previewVideoUrl ? (
          <>
            <img
              src={template.thumbnailUrl || template.previewVideoUrl}
              alt={template.name}
              className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
              loading="lazy"
            />
            {template.previewVideoUrl && (
              <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                <span className="w-10 h-10 rounded-full bg-white/95 backdrop-blur flex items-center justify-center text-base text-ink-950 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.6)]">▶</span>
              </div>
            )}
          </>
        ) : (
          // No thumbnail → show the category cartoon sticker as the artwork
          // Layout: soft radial glow backdrop, centered sticker biased
          // slightly above center so the title at the bottom has breathing
          // room, with the category label tucked just below the sticker.
          <div className="w-full h-full relative flex flex-col items-center justify-center px-3 pt-8 pb-14">
            {/* Soft white halo behind the sticker for depth */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              aria-hidden
            >
              <div
                className="w-44 h-44 sm:w-52 sm:h-52 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.08) 35%, transparent 70%)',
                  filter: 'blur(2px)',
                }}
              />
            </div>
            {/* Sticker centered, with gentle infinite bob */}
            <motion.div
              className="relative"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <CategorySticker size={130} />
            </motion.div>
            {/* Category label under the sticker */}
            <p className="relative mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85 drop-shadow">
              {cat}
            </p>
          </div>
        )}

        {/* Story-progress style bars (top) */}
        <div className="absolute inset-x-2 top-2 flex gap-1">
          <span className="h-0.5 flex-1 rounded-full bg-white/90" />
          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
        </div>

        {/* Top overlays: category pill (with cartoon sticker logo) + like */}
        <div className="absolute inset-x-2 top-5 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/45 backdrop-blur border border-white/15 pl-1 pr-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
            <span className="inline-flex items-center justify-center w-4 h-4">
              <CategorySticker size={16} />
            </span>
            <span>{cat}</span>
          </span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(template); }}
            className="w-7 h-7 rounded-full bg-black/40 backdrop-blur border border-white/15 flex items-center justify-center transition active:scale-90 hover:border-white/40"
            aria-label={liked ? 'Remove from liked' : 'Save to liked'}
            title={liked ? 'Remove from liked' : 'Save to liked'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? '#F472B6' : 'none'} stroke={liked ? '#F472B6' : '#FFFFFF'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Bottom gradient + title */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        <div className="absolute inset-x-2.5 bottom-2 text-white">
          <h3 className="text-sm font-extrabold drop-shadow font-display leading-tight line-clamp-2">
            {template.name}
          </h3>
        </div>
      </div>

      {/* Footer caption — compact */}
      <div className="px-3 py-2.5 relative flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.16em] truncate">
          {template.duration ? `${template.duration}s vibe` : 'Quick build'}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold gradient-text shrink-0">
          Customize →
        </span>
      </div>
    </motion.article>
  );
}

// Silence unused-import linter for future categories we may add (Music, etc.)
export const __CATEGORY_STICKERS_AVAILABLE = { MusicSticker };
