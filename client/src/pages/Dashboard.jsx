import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { templatesAPI } from '../api/api';
import TemplateCard from '../components/TemplateCard';

const CATEGORIES = [
  { name: 'All',        emoji: '✨' },
  { name: 'Love',       emoji: '💖' },
  { name: 'Friendship', emoji: '🫶' },
  { name: 'Birthday',   emoji: '🎂' },
  { name: 'Memories',   emoji: '📸' },
  { name: 'Wedding',    emoji: '💍' },
];

export default function Dashboard() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
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
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="hero-panel mb-8 sm:mb-10 relative overflow-hidden"
      >
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-peach-400/30 blur-3xl" />
        <div className="absolute left-8 bottom-0 w-40 h-40 rounded-full bg-brand-400/30 floating-ring" />

        <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] items-center">
          <div>
            <span className="eyebrow mb-4">✨ Trending now</span>
            <h1 className="section-title max-w-3xl mt-4">
              Pick a vibe.{' '}
              <span className="gradient-text">Drop your pics.</span>{' '}
              Share the moment.
            </h1>
            <p className="mt-5 text-slate-600 max-w-2xl leading-8 text-base sm:text-lg">
              Birthdays, glow-ups, friend stories, wedding wishes — pick a template, swap photos, hit publish. Get a link and QR for everyone to scan.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#templates" className="btn-glow">
                Browse templates
              </a>
              <Link to="/my-videos" className="btn-ghost">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                My pages
              </Link>
            </div>
          </div>

          {/* Floating "stories" preview stack */}
          <div className="hidden lg:block relative h-64">
            {[
              { emoji: '💖', bg: 'linear-gradient(135deg,#fb7185 0%,#e11d48 60%,#9f1239 100%)' },
              { emoji: '🎂', bg: 'linear-gradient(135deg,#fbbf24 0%,#fb7185 55%,#c026d3 100%)' },
              { emoji: '🫶', bg: 'linear-gradient(135deg,#fb923c 0%,#f97316 45%,#c2410c 100%)' },
              { emoji: '📸', bg: 'linear-gradient(135deg,#a78bfa 0%,#7c3aed 50%,#4c1d95 100%)' },
            ].map((s, i) => (
              <motion.div
                key={s.emoji}
                initial={{ opacity: 0, y: 30, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: (i - 1.5) * 6 }}
                transition={{ delay: 0.15 * i, type: 'spring', stiffness: 120 }}
                className="absolute top-0 rounded-[1.75rem] bg-white p-1.5 border-2 border-white"
                style={{
                  left: `${i * 70}px`,
                  zIndex: i,
                  boxShadow: '0 24px 50px -16px rgba(15,23,42,0.35), 0 8px 18px -8px rgba(217,70,239,0.25)',
                }}
              >
                <div
                  className="w-24 h-40 rounded-[1.4rem] flex items-center justify-center text-5xl relative overflow-hidden"
                  style={{ background: s.bg }}
                >
                  {/* Instagram-style story progress bars at top */}
                  <div className="absolute inset-x-2 top-2 flex gap-1">
                    <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                    <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                    <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                  </div>
                  <span className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]">{s.emoji}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-center gap-3 rounded-full bg-white/80 border border-white/70 px-4 py-2.5 shadow-sm max-w-xl"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates: birthday, wedding, glow up…"
          className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700">✕</button>
        )}
      </motion.div>

      {/* Category chips (story-ring style for active) */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2 sm:gap-3 mb-7 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1"
      >
        {CATEGORIES.map((c) => {
          const active = category === c.name;
          return (
            <button
              key={c.name}
              onClick={() => setCategory(c.name)}
              className={`${active ? 'chip-active' : 'chip-default'} whitespace-nowrap`}
            >
              <span className="text-base">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Grid */}
      <div id="templates">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-[1.75rem] bg-white/70 border border-white/70 overflow-hidden relative">
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
                className="card-glass p-10 text-center"
              >
                <div className="text-5xl mb-3">🫥</div>
                <p className="font-bold text-lg text-slate-900">No templates match</p>
                <p className="text-sm text-slate-500 mt-1">
                  Try a different category or clear your search.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={`${category}-${query}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {visible.map((t, i) => (
                  <motion.div
                    key={t._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.035, 0.4) }}
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
