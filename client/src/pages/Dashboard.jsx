import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI } from '../api/api';
import Button from '../ui/Button';
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
  const navigate = useNavigate();
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

  /** Smoothly bring the templates section into view, with the floating
   *  topbar and the chip row's hover-lift accounted for. We target the
   *  search/chips wrapper (not just `#templates`) so the category pills
   *  stay visible above the grid after the scroll lands. */
  const scrollToTemplates = useCallback(() => {
    const el = document.getElementById('templates-section');
    if (!el) return;
    // 96px floating navbar + a few px so the chip row isn't kissing the
    // navbar edge (its hover-lift would otherwise be clipped).
    const top = el.getBoundingClientRect().top + window.scrollY - 104;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, []);

  // Layout.jsx fires this on Create-button clicks when already on /studio.
  useEffect(() => {
    const onCreate = () => scrollToTemplates();
    window.addEventListener('storyly:scroll-to-templates', onCreate);
    return () => window.removeEventListener('storyly:scroll-to-templates', onCreate);
  }, [scrollToTemplates]);

  // Cross-page Create-button navigation (?scroll=templates) — wait one
  // frame for the grid to mount, then scroll smoothly. Clears the param
  // so refreshing the page doesn't re-trigger.
  useEffect(() => {
    if (searchParams.get('scroll') !== 'templates') return;
    const t = setTimeout(() => {
      scrollToTemplates();
      const next = new URLSearchParams(searchParams);
      next.delete('scroll');
      setSearchParams(next, { replace: true });
    }, 120);
    return () => clearTimeout(t);
  }, [searchParams, setSearchParams, scrollToTemplates]);

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
          <NeonOrb color="#8B5CF6" size="18rem" style={{ top: '-5rem', right: '-5rem' }} />
          <NeonOrb color="#7C3AED" size="15rem" style={{ bottom: '-3rem', left: '-3rem' }} opacity={0.4} />
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
                <Button size="sm" onClick={scrollToTemplates} iconRight={<span>→</span>}>
                  Browse templates
                </Button>
                <Button
                  as="a"
                  variant="ghost"
                  size="sm"
                  href="/my-videos"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  }
                >
                  My pages
                </Button>
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
                <BalloonSticker size={48} color="#A78BFA" />
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
                // Baby pastel sticker gradients — match the trending-template
                // marquee aesthetic instead of the old saturated brights.
                { emoji: '💖', bg: 'linear-gradient(135deg,#FBCFE8 0%,#F9A8D4 55%,#DDD6FE 100%)' },
                { emoji: '🎂', bg: 'linear-gradient(135deg,#FED7AA 0%,#FBCFE8 50%,#DDD6FE 100%)' },
                { emoji: '🫶', bg: 'linear-gradient(135deg,#BAE6FD 0%,#DDD6FE 50%,#FBCFE8 100%)' },
                { emoji: '📸', bg: 'linear-gradient(135deg,#DDD6FE 0%,#C4B5FD 50%,#FBCFE8 100%)' },
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
                    boxShadow: '0 18px 40px -14px rgba(0,0,0,0.55), 0 6px 20px -6px rgba(139,92,246,0.45)',
                  }}
                >
                  <div
                    className="w-20 h-36 rounded-[1.1rem] flex items-center justify-center text-4xl relative overflow-hidden"
                    style={{ background: s.bg }}
                  >
                    <span className="drop-shadow-[0_8px_18px_rgba(0,0,0,0.18)]">{s.emoji}</span>
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

      {/* Search + chips + grid live under one wrapper so the scroll helper
          can land the user on a viewport that shows BOTH the category
          pills and the template grid at once (instead of just the grid,
          which left the chips clipped behind the floating navbar). */}
      <section id="templates-section" style={{ scrollMarginTop: '104px' }}>

      {/* ─── Search ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="search-shell mb-5 flex items-center gap-3 rounded-full px-5 py-3 backdrop-blur max-w-xl"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon shrink-0">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates: birthday, wedding, glow up…"
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

      {/* ─── Category chips ───
          pt-2 / pb-3 gives breathing room above & below so the hover-lift
          (-3px translate + scale) is fully visible. Without it the chip
          top was being clipped because `overflow-x-auto` implicitly forces
          `overflow-y: auto` on the same element. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 sm:gap-3 mb-8 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pt-2 pb-3"
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
                // Snap the templates grid into view so the filter result
                // is visible without the user having to scroll manually.
                scrollToTemplates();
              }}
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
                {c.emoji}
              </span>
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
                    {/* Card click → template preview. The recipient
                        prompt now lives inside the preview, fired by
                        its Customize CTA, so users see the template
                        first and only commit a name when they're ready. */}
                    <button
                      type="button"
                      onClick={() => {
                        const qs = t.sourceType === 'BuilderTemplate'
                          ? '?src=BuilderTemplate'
                          : '';
                        navigate(`/template/${t._id}${qs}`);
                      }}
                      className="block w-full text-left"
                      aria-label={`Preview ${t.name || 'template'}`}
                    >
                      <TemplateCard template={t} />
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      </section>

    </div>
  );
}
