import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI } from '../api/api';
import TemplateCard from '../components/TemplateCard';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import MarqueeRow from '../ui/MarqueeRow';
import FloatingDecor from '../ui/FloatingDecor';
import { BalloonSticker, ConfettiSticker, StarSticker } from '../ui/CartoonStickers';
import { fadeUp, blurUp, stagger } from '../motion/variants';

const CATEGORIES = [
  { name: 'All',        emoji: '✨' },
  { name: 'Love',       emoji: '💖' },
  { name: 'Friendship', emoji: '🫶' },
  { name: 'Birthday',   emoji: '🎂' },
  { name: 'Memories',   emoji: '📸' },
  { name: 'Wedding',    emoji: '💍' },
  { name: 'Event',      emoji: '🎉' },
  { name: 'Invitation', emoji: '💌' },
];

const TRENDING_LABELS = ['Wedding ✨', 'Birthday 🎂', 'Invitation 💌', 'Save the date 📅', 'RSVP 🎟️', 'Couple 💞', 'Anniversary 💖'];

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Pre-select the category from the URL if the user landed here from a
  // Landing-page category card (e.g. /studio?category=Wedding). Falls back
  // to "All" when nothing is set or the name doesn't match a known chip.
  const initialCategory = (() => {
    const fromUrl = searchParams.get('category');
    if (fromUrl && CATEGORIES.some((c) => c.name === fromUrl)) return fromUrl;
    return 'All';
  })();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      try {
        const data = await templatesAPI.list(category === 'All' ? undefined : category);
        if (!cancel) setTemplates(data);
      } catch (_) {
        if (!cancel) setTemplates([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    setLoading(true);
    run();
    return () => { cancel = true; };
  }, [category]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  }, [templates, query]);

  return (
    <div className="mx-auto max-w-7xl">
      {/* ─── Hero (compact) ─── */}
      <motion.section
        variants={stagger()}
        initial="hidden"
        animate="visible"
        className="relative mb-8"
      >
        <GlassCard tone="strong" className="!rounded-[1.75rem] p-6 sm:p-8 relative overflow-hidden">
          <NeonOrb color="#A855F7" size="18rem" style={{ top: '-5rem', right: '-5rem' }} />
          <NeonOrb color="#06B6D4" size="15rem" style={{ bottom: '-3rem', left: '-3rem' }} opacity={0.4} />
          <FloatingDecor density="subtle" opacity={0.14} size={30} />
          <div className="absolute inset-0 bg-grid-soft opacity-30 pointer-events-none" />

          <div className="relative grid gap-8 lg:grid-cols-[1.6fr_1fr] items-center">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Trending this week</span></motion.span>
              <motion.h1
                variants={blurUp}
                className="mt-4 font-display font-extrabold leading-[1.0] tracking-tight"
                style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)' }}
              >
                Pick a vibe.{' '}
                <GradientText variant="cosmic">Drop your pics.</GradientText>{' '}
                Share the moment.
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-4 text-slate-300 max-w-xl leading-7 text-sm sm:text-base">
                Weddings, birthdays, invitations, glow-ups — pick a cinematic template, swap photos, hit publish. One link, one QR, all the vibes.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-2.5">
                <a href="#templates" className="btn-glow !py-2.5 !px-5 !text-xs">
                  Browse templates →
                </a>
                <Link to="/my-videos" className="btn-ghost !py-2.5 !px-4 !text-xs">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                  My pages
                </Link>
              </motion.div>
            </div>

            {/* Floating story stack — smaller, with cartoon sticker accents */}
            <div className="hidden lg:block relative h-52">
              {/* Foreground cartoon accents */}
              <motion.div
                className="absolute -top-4 right-6 z-10"
                animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BalloonSticker size={48} color="#22D3EE" />
              </motion.div>
              <motion.div
                className="absolute top-1/3 -right-2 z-10"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
              >
                <ConfettiSticker size={38} />
              </motion.div>
              <motion.div
                className="absolute bottom-0 right-8 z-10"
                animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <StarSticker size={32} />
              </motion.div>
              {[
                { emoji: '💖', bg: 'linear-gradient(135deg,#F472B6 0%,#E11D48 60%,#9F1239 100%)' },
                { emoji: '🎂', bg: 'linear-gradient(135deg,#FBBF24 0%,#F472B6 55%,#A855F7 100%)' },
                { emoji: '🫶', bg: 'linear-gradient(135deg,#FB923C 0%,#F97316 45%,#C2410C 100%)' },
                { emoji: '📸', bg: 'linear-gradient(135deg,#A78BFA 0%,#7C3AED 50%,#4C1D95 100%)' },
              ].map((s, i) => (
                <motion.div
                  key={s.emoji}
                  initial={{ opacity: 0, y: 24, rotate: 0 }}
                  animate={{
                    opacity: 1,
                    y: [0, -6, 0, 4, 0],
                    rotate: (i - 1.5) * 6 + [0, 1.5, -1, 0][i % 4],
                  }}
                  transition={{
                    opacity: { delay: 0.12 * i, duration: 0.4 },
                    y:       { duration: 7 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
                    rotate:  { duration: 8 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 },
                  }}
                  className="keep-dark absolute top-0 rounded-2xl p-1 border border-white/20"
                  style={{
                    left: `${i * 56}px`,
                    zIndex: i,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))',
                    boxShadow: '0 18px 40px -14px rgba(0,0,0,0.55), 0 6px 20px -6px rgba(168,85,247,0.45)',
                  }}
                >
                  <div
                    className="w-20 h-36 rounded-[1.1rem] flex items-center justify-center text-4xl relative overflow-hidden"
                    style={{ background: s.bg }}
                  >
                    <div className="absolute inset-x-2 top-2 flex gap-1">
                      <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                    </div>
                    <span className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]">{s.emoji}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Tag marquee under hero */}
        <div className="mt-6">
          <MarqueeRow direction="left" speed="slow">
            {[...TRENDING_LABELS, ...TRENDING_LABELS].map((t, i) => (
              <span
                key={`tl-${i}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-slate-300"
              >
                {t}
              </span>
            ))}
          </MarqueeRow>
        </div>
      </motion.section>

      {/* ─── Search ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-3 rounded-full bg-white/[0.04] border border-white/10 px-5 py-3 backdrop-blur max-w-xl"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates: birthday, wedding, glow up…"
          className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white">✕</button>
        )}
      </motion.div>

      {/* ─── Category chips ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 sm:gap-3 mb-8 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
      >
        {CATEGORIES.map((c) => {
          const active = category === c.name;
          return (
            <button
              key={c.name}
              onClick={() => {
                setCategory(c.name);
                // Keep the URL in sync — refreshing or sharing the link
                // preserves the selected category filter.
                const next = new URLSearchParams(searchParams);
                if (c.name === 'All') next.delete('category');
                else next.set('category', c.name);
                setSearchParams(next, { replace: true });
              }}
              className={`${active ? 'chip chip-active' : 'chip chip-default'} whitespace-nowrap`}
            >
              <span className="text-base">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ─── Grid (denser, smaller cards) ─── */}
      <div id="templates">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-2xl bg-white/[0.04] border border-white/10 overflow-hidden relative">
                <div className="absolute inset-0 shimmer animate-shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {visible.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <GlassCard className="p-10">
                  <div className="text-5xl mb-3">🫥</div>
                  <p className="font-display font-bold text-base text-white">No templates match</p>
                  <p className="text-sm text-slate-400 mt-1">Try a different category or clear your search.</p>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key={`${category}-${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4"
              >
                {visible.map((t, i) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link to={`/template/${t._id}`}>
                      <TemplateCard template={t} />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
