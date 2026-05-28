import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicShell from '../components/PublicShell';
import SubNav from '../components/SubNav';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import AnimatedCount from '../ui/AnimatedCount';
import { fadeUp, fadeUpSmall, blurUp, stagger } from '../motion/variants';

const CATEGORIES = [
  { path: '',            label: 'All',         emoji: '✨' },
  { path: 'wedding',     label: 'Wedding',     emoji: '💍' },
  { path: 'birthday',    label: 'Birthday',    emoji: '🎂' },
  { path: 'invitation',  label: 'Invitation',  emoji: '💌' },
  { path: 'celebration', label: 'Celebration', emoji: '🎉' },
];

const TEMPLATES = [
  // Wedding
  { id: 'w1', name: 'Royal Heritage',     cat: 'wedding',     price: 299, grad: 'from-rose-400 via-fuchsia-500 to-violet-600',  likes: 1284, uses: 312 },
  { id: 'w2', name: 'Beach Sunset Vows',  cat: 'wedding',     price: 199, grad: 'from-amber-400 via-rose-400 to-fuchsia-500',  likes: 894,  uses: 211 },
  { id: 'w3', name: 'Minimal Ivory',      cat: 'wedding',     price: 149, grad: 'from-slate-300 via-rose-200 to-fuchsia-300',  likes: 612,  uses: 178 },
  { id: 'w4', name: 'Hindu Mandap',       cat: 'wedding',     price: 249, grad: 'from-orange-400 via-rose-500 to-fuchsia-600', likes: 1502, uses: 408 },
  // Birthday
  { id: 'b1', name: 'Confetti Pop',       cat: 'birthday',    price: 99,  grad: 'from-fuchsia-400 via-purple-500 to-indigo-600', likes: 942,  uses: 354 },
  { id: 'b2', name: 'Disco Decade',       cat: 'birthday',    price: 149, grad: 'from-cyan-400 via-violet-500 to-fuchsia-600',  likes: 728,  uses: 188 },
  { id: 'b3', name: 'Pastel Surprise',    cat: 'birthday',    price: 79,  grad: 'from-pink-300 via-rose-300 to-fuchsia-300',    likes: 466,  uses: 142 },
  { id: 'b4', name: 'Sweet Sixteen',      cat: 'birthday',    price: 129, grad: 'from-pink-400 via-rose-400 to-fuchsia-500',    likes: 815,  uses: 246 },
  // Invitation
  { id: 'i1', name: 'Save The Date Noir', cat: 'invitation',  price: 199, grad: 'from-slate-700 via-violet-700 to-fuchsia-700', likes: 538,  uses: 161 },
  { id: 'i2', name: 'Engagement Eve',     cat: 'invitation',  price: 179, grad: 'from-rose-300 via-fuchsia-500 to-violet-500',  likes: 624,  uses: 198 },
  { id: 'i3', name: 'Housewarming',       cat: 'invitation',  price: 99,  grad: 'from-amber-300 via-rose-400 to-fuchsia-500',   likes: 312,  uses: 95 },
  { id: 'i4', name: 'Office Launch',      cat: 'invitation',  price: 149, grad: 'from-cyan-400 via-indigo-500 to-violet-600',   likes: 281,  uses: 78 },
  // Celebration
  { id: 'c1', name: 'Anniversary Glow',   cat: 'celebration', price: 199, grad: 'from-rose-400 via-pink-500 to-fuchsia-600',   likes: 712,  uses: 234 },
  { id: 'c2', name: 'New Year Reel',      cat: 'celebration', price: 129, grad: 'from-amber-400 via-fuchsia-500 to-cyan-500',  likes: 584,  uses: 167 },
  { id: 'c3', name: 'Baby Reveal',        cat: 'celebration', price: 149, grad: 'from-sky-300 via-rose-300 to-pink-400',       likes: 894,  uses: 312 },
  { id: 'c4', name: 'Graduation',         cat: 'celebration', price: 99,  grad: 'from-amber-400 via-rose-500 to-fuchsia-500',  likes: 442,  uses: 134 },
];

const CAT_EMOJI = {
  wedding: '💍', birthday: '🎂', invitation: '💌', celebration: '🎉',
};

export default function Marketplace() {
  const location = useLocation();
  const activeCat = location.pathname.split('/marketplace/')[1] || '';
  const filtered = useMemo(
    () => (activeCat ? TEMPLATES.filter((t) => t.cat === activeCat) : TEMPLATES),
    [activeCat]
  );

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        {/* Hero */}
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.span variants={fadeUpSmall} className="eyebrow">
            <span>Template marketplace</span>
          </motion.span>
          <motion.h1
            variants={blurUp}
            className="mt-5 font-display font-extrabold tracking-tight leading-[1.02]"
            style={{ fontSize: 'clamp(2.25rem, 6vw, 4.5rem)' }}
          >
            One-time. No subscription.{' '}
            <GradientText variant="cosmic">Just templates.</GradientText>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-2xl mx-auto text-lg text-slate-300 leading-7">
            Buy a premium template once. It lands in your feed forever — use it
            on every page you make from today onward. No subscription, no
            watermark, no surprises.
          </motion.p>
        </motion.div>

        {/* Stat strip */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <GlassCard tone="strong" className="!rounded-[1.75rem] p-6 mb-10 grid grid-cols-2 md:grid-cols-4 gap-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-soft opacity-25" />
            {[
              { label: 'Premium templates', value: 220, suffix: '+' },
              { label: 'Avg price',          value: 149, prefix: '₹' },
              { label: 'Lifetime use',       value: 100, suffix: '%' },
              { label: 'Subscription?',      value: 0,   suffix: ' / mo' },
            ].map((s) => (
              <div key={s.label} className="relative">
                <p className="font-display font-extrabold text-2xl sm:text-3xl">
                  <GradientText variant="cosmic">
                    <AnimatedCount to={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                  </GradientText>
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">{s.label}</p>
              </div>
            ))}
          </GlassCard>
        </motion.div>

        <SubNav base="/marketplace" items={CATEGORIES} />

        {/* Grid */}
        <motion.div
          key={activeCat || 'all'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
        >
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
            >
              <MarketplaceCard tpl={t} />
            </motion.div>
          ))}
        </motion.div>

        {/* How buying works */}
        <section className="mt-20">
          <motion.div variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} className="mb-10 text-center">
            <motion.span variants={fadeUp} className="eyebrow"><span>How it works</span></motion.span>
            <motion.h2 variants={blurUp} className="mt-5 section-title">
              From cart to{' '}
              <GradientText variant="warm">your feed.</GradientText>
            </motion.h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Pick a template', body: 'Browse by category. Like the look? Tap the card to preview.' },
              { step: '02', title: 'Pay once',         body: 'UPI, cards, NetBanking, wallets. Pricing is per-template, no subscription.' },
              { step: '03', title: 'Lands in your feed', body: 'The template appears in your "My templates" library — yours forever.' },
              { step: '04', title: 'Use it any time',   body: 'Spin up new pages from your purchased templates with one tap.' },
            ].map((s) => (
              <GlassCard key={s.step} withSpotlight className="p-6">
                <p className="font-display text-3xl font-extrabold gradient-text">{s.step}</p>
                <p className="mt-3 font-display text-lg font-bold text-white">{s.title}</p>
                <p className="mt-2 text-sm text-slate-300 leading-6">{s.body}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Become a seller cross-link */}
        <section className="mt-20">
          <GlassCard tone="strong" className="!rounded-[2rem] p-8 sm:p-12 relative overflow-hidden">
            <NeonOrb color="#A855F7" size="20rem" style={{ top: '-5rem', right: '-5rem' }} />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className="eyebrow"><span>Builder program</span></span>
                <h3 className="mt-4 font-display text-2xl sm:text-3xl font-extrabold">
                  Designer?{' '}
                  <GradientText variant="cosmic">Sell here.</GradientText>
                </h3>
                <p className="mt-3 text-slate-300 max-w-xl">
                  Submit your own templates to the marketplace. Subscribe to the
                  Builder Program (monthly or yearly) and earn commission every
                  time someone likes or uses your work.
                </p>
              </div>
              <Link to="/builder" className="btn-glow shrink-0">
                Become a builder →
              </Link>
            </div>
          </GlassCard>
        </section>
      </div>
    </PublicShell>
  );
}

function MarketplaceCard({ tpl }) {
  return (
    <motion.div whileHover={{ y: -6 }} className="card-glass spotlight overflow-hidden group cursor-pointer !rounded-2xl">
      <div className={`aspect-[4/5] relative overflow-hidden bg-gradient-to-br ${tpl.grad} keep-dark`}>
        <div className="absolute inset-x-2 top-2 flex gap-1">
          <span className="h-0.5 flex-1 rounded-full bg-white/90" />
          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
          <span className="h-0.5 flex-1 rounded-full bg-white/40" />
        </div>
        <div className="absolute inset-x-2 top-5 flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur border border-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white">
            {CAT_EMOJI[tpl.cat]} {tpl.cat}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white text-ink-950 px-2 py-0.5 text-[10px] font-extrabold">
            ₹{tpl.price}
          </span>
        </div>
        <div className="w-full h-full flex items-center justify-center text-6xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
          {CAT_EMOJI[tpl.cat]}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        <h3 className="absolute inset-x-2.5 bottom-2 font-display font-extrabold text-white text-sm drop-shadow leading-tight">
          {tpl.name}
        </h3>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.16em]">
        <span className="text-slate-400 inline-flex items-center gap-1">
          <span className="text-rose-400">♥</span>{tpl.likes}
        </span>
        <span className="text-slate-400">{tpl.uses} uses</span>
      </div>
      <div className="px-3 pb-3">
        <button className="btn-glow w-full !py-2 !text-xs">Buy ₹{tpl.price}</button>
      </div>
    </motion.div>
  );
}
