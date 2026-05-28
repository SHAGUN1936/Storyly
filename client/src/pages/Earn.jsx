import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StorylyMark } from '../components/StorylyLogo';
import ThemeToggle from '../components/ThemeToggle';
import Footer from '../components/Footer';
import AuroraBackground from '../ui/AuroraBackground';
import ParticleField from '../ui/ParticleField';
import GlassCard from '../ui/GlassCard';
import MagneticButton from '../ui/MagneticButton';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';
import AnimatedCount from '../ui/AnimatedCount';
import { StarSticker, GiftSticker, DiscoSticker } from '../ui/CartoonStickers';
import { fadeUp, fadeUpSmall, stagger, blurUp } from '../motion/variants';

const PRICING = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    blurb: 'For your first pages — get a feel for the editor.',
    cta: 'Start free',
    features: [
      '3 published pages',
      'Storyly watermark on shared pages',
      'Basic templates',
      'QR + share link',
    ],
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 399,
    period: '/ month',
    blurb: 'Everything you need to ship cinematic event sites.',
    cta: 'Go Pro',
    features: [
      'Unlimited published pages',
      'No watermark',
      'Premium templates + animations',
      'Custom music + GIFs',
      'Analytics on share link',
      'Priority email support',
    ],
    highlight: true,
  },
  {
    id: 'business',
    name: 'Studio',
    price: 1499,
    period: '/ month',
    blurb: 'For agencies, studios, and creators selling sites.',
    cta: 'Talk to sales',
    features: [
      'Everything in Pro',
      'White-label share pages',
      'Custom domain',
      'Team seats (up to 5)',
      'Marketplace seller dashboard',
      'Dedicated success manager',
    ],
    highlight: false,
  },
];

const EARN_MODES = [
  {
    id: 'affiliate',
    icon: '🤝',
    title: 'Affiliate Program',
    headline: 'Refer friends. Earn 20% recurring.',
    body:
      'Share your unique Storyly link. Anyone who upgrades to Pro or Studio earns you 20% of every payment — for as long as they keep their plan. Tracked automatically, paid monthly.',
    bullets: [
      '20% lifetime commission',
      'Cookie tracking 60 days',
      'Real-time earnings dashboard',
      'Payouts to UPI, PayPal, bank',
    ],
    cta: 'Join the affiliate program',
  },
  {
    id: 'creator',
    icon: '🎨',
    title: 'Creator Program',
    headline: 'Design templates. Get paid per use.',
    body:
      'Submit your template designs to the Storyly library. Every time a user picks one of your templates to build their page, you earn royalties. The most popular creators earn ₹50,000+/month.',
    bullets: [
      'Royalty per template use',
      'Featured creator spotlight',
      'Public attribution + portfolio',
      'Tools to build & test your own templates',
    ],
    cta: 'Become a creator',
  },
  {
    id: 'marketplace',
    icon: '🛍️',
    title: 'Marketplace',
    headline: 'Sell premium templates directly.',
    body:
      'List one-off premium templates for sale to other Storyly users. Set your own price, keep 80% of every sale. Built-in checkout, instant license delivery, lifetime updates.',
    bullets: [
      'Keep 80% of every sale',
      'Storyly handles payments + tax',
      'Buyer rating & review system',
      'One-click duplicate & customize',
    ],
    cta: 'Open a seller account',
  },
];

const EARN_STATS = [
  { label: 'Creators earning', value: 1240, suffix: '+' },
  { label: 'Avg. top creator', value: 50000, prefix: '₹', suffix: '/mo' },
  { label: 'Affiliate commission', value: 20, suffix: '%' },
  { label: 'Marketplace cut to seller', value: 80, suffix: '%' },
];

export default function Earn() {
  const { user } = useAuth();
  const location = useLocation();
  const ctaTo = user ? '/studio' : '/signup';
  const ctaLabel = user ? 'Open my studio' : 'Start free — earn from day one';

  // Smooth-scroll to in-page hash on mount (#affiliate / #creator / #marketplace / #pricing)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }, [location.hash]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <CursorHalo />
      <div className="pointer-events-none fixed inset-x-0 top-24 bottom-0 z-0">
        <FloatingDecor density="normal" opacity={0.15} size={48} items={['💰', '✨', '🎨', '🚀', '💸', '🪩', '⭐', '🎁', '💎', '🤝']} />
      </div>
      <div className="tpl-nav-backdrop pointer-events-none fixed inset-x-0 top-0 h-24 z-30" />

      {/* ─── Top nav ─── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-ink-900/70 backdrop-blur-xl px-4 py-2.5 shadow-glass">
            <Link to="/" className="flex items-center gap-2.5">
              <StorylyMark size={36} idSuffix="earn-nav" />
              <span className="storyly-wordmark font-display text-base font-extrabold tracking-tight">Storyly</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
              <Link to="/landing" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Home</Link>
              <a href="#affiliate" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Affiliate</a>
              <a href="#creator" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Creator</a>
              <a href="#marketplace" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Marketplace</a>
              <a href="#pricing" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Pricing</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle className="!w-9 !h-9" />
              {user ? (
                <Link to="/studio" className="btn-glow !py-2 !px-4 !text-xs">Open studio</Link>
              ) : (
                <Link to="/signup" className="btn-glow !py-2 !px-4 !text-xs">Get started</Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 sm:pt-44 sm:pb-28">
        <AuroraBackground variant="warm" intensity={0.7} />
        <ParticleField count={50} color="#FBBF24" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger(0.15, 0.10)}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center"
          >
            <div>
              <motion.span variants={fadeUpSmall} className="eyebrow"><span>Earn with Storyly</span></motion.span>
              <motion.h1
                variants={blurUp}
                className="mt-6 font-display font-extrabold leading-[0.96] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
              >
                <span className="block text-white">Build, share, </span>
                <span className="block"><GradientText variant="warm">earn.</GradientText></span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-7 max-w-xl text-lg sm:text-xl text-slate-300 leading-[1.6]">
                Storyly turns your design taste into a business. Refer friends, sell templates, design for the marketplace — three ways to make real income while building cinematic stories.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
                <MagneticButton as="a" href={ctaTo} variant="glow" className="!px-7 !py-4 !text-base">
                  {ctaLabel}
                </MagneticButton>
                <a href="#pricing" className="btn-ghost !px-6 !py-4 !text-sm">See pricing</a>
              </motion.div>
            </div>

            {/* Right — floating earnings cards */}
            <div className="relative hidden md:block h-[440px]">
              <NeonOrb color="#FBBF24" size="22rem" style={{ top: '-3rem', right: '-3rem' }} />
              <motion.div
                className="absolute top-4 right-4 keep-dark"
                animate={{ y: [0, -10, 0], rotate: [-4, 4, -4] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <GlassCard tone="strong" className="!rounded-2xl p-5 w-64">
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Affiliate</p>
                  <p className="mt-2 font-display text-3xl font-extrabold">
                    <GradientText variant="warm">₹12,480</GradientText>
                  </p>
                  <p className="mt-1 text-xs text-slate-300">this month from 42 referrals</p>
                </GlassCard>
              </motion.div>
              <motion.div
                className="absolute top-44 left-2 keep-dark"
                animate={{ y: [0, -8, 0], rotate: [3, -3, 3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >
                <GlassCard tone="strong" className="!rounded-2xl p-5 w-64">
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Creator royalties</p>
                  <p className="mt-2 font-display text-3xl font-extrabold">
                    <GradientText variant="cosmic">₹38,250</GradientText>
                  </p>
                  <p className="mt-1 text-xs text-slate-300">12 templates · 4.8★ avg</p>
                </GlassCard>
              </motion.div>
              <motion.div
                className="absolute bottom-4 right-8 keep-dark"
                animate={{ y: [0, -6, 0], rotate: [-5, 5, -5] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              >
                <GlassCard tone="strong" className="!rounded-2xl p-5 w-64">
                  <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">Marketplace sales</p>
                  <p className="mt-2 font-display text-3xl font-extrabold">
                    <GradientText variant="soft">₹24,900</GradientText>
                  </p>
                  <p className="mt-1 text-xs text-slate-300">19 sales · 80% your cut</p>
                </GlassCard>
              </motion.div>

              <motion.div className="absolute top-2 left-6" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
                <StarSticker size={44} />
              </motion.div>
              <motion.div className="absolute bottom-12 left-12" animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <GiftSticker size={48} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GlassCard tone="strong" className="!rounded-[2rem] p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-soft opacity-25" />
            {EARN_STATS.map((s) => (
              <div key={s.label} className="relative">
                <p className="font-display font-extrabold text-3xl sm:text-4xl">
                  <GradientText variant="warm">
                    <AnimatedCount to={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} />
                  </GradientText>
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400">{s.label}</p>
              </div>
            ))}
          </GlassCard>
        </div>
      </section>

      {/* ─── Earning modes — Affiliate / Creator / Marketplace ─── */}
      {EARN_MODES.map((m, i) => (
        <section
          key={m.id}
          id={m.id}
          className="relative py-20 sm:py-28 scroll-mt-28"
        >
          <NeonOrb color={i === 0 ? '#FBBF24' : i === 1 ? '#A855F7' : '#22D3EE'} size="32rem" style={i % 2 === 0 ? { top: '-10rem', left: '-10rem' } : { top: '-10rem', right: '-10rem' }} opacity={0.3} />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={stagger()}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}
            >
              <motion.div variants={fadeUp} className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                <span className="eyebrow"><span>{m.title}</span></span>
                <h2 className="mt-5 font-display font-extrabold tracking-tight leading-[1.05]" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}>
                  <GradientText variant={i === 0 ? 'warm' : i === 1 ? 'cosmic' : 'soft'}>{m.headline}</GradientText>
                </h2>
                <p className="mt-5 text-lg text-slate-300 leading-8 max-w-lg">{m.body}</p>
                <ul className="mt-7 space-y-3">
                  {m.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-slate-200">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-[10px] font-extrabold text-white">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <MagneticButton as="a" href={ctaTo} variant="glow" className="!px-6 !py-3 !text-sm">
                    {m.cta} →
                  </MagneticButton>
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className={i % 2 === 1 ? 'lg:[direction:ltr]' : ''}>
                <GlassCard tone="strong" withBorder withSpotlight className="!rounded-[2rem] p-10 text-center relative overflow-hidden">
                  <div className="text-7xl mb-6 drop-shadow-[0_10px_30px_rgba(168,85,247,0.4)]">{m.icon}</div>
                  <p className="font-display text-2xl font-extrabold text-white">{m.title}</p>
                  <p className="mt-2 text-sm text-slate-400">Tap the button on the left to enroll.</p>
                  <motion.div className="absolute top-4 right-4" animate={{ rotate: [0, 360] }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}>
                    <DiscoSticker size={36} />
                  </motion.div>
                </GlassCard>
              </motion.div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* ─── Pricing ─── */}
      <section id="pricing" className="relative py-24 sm:py-32 scroll-mt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <motion.span variants={fadeUpSmall} className="eyebrow"><span>Pricing</span></motion.span>
            <motion.h2 variants={fadeUp} className="section-title mt-5">
              Simple plans.{' '}
              <GradientText variant="cosmic">Real earnings.</GradientText>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-slate-300 max-w-2xl mx-auto">
              Affiliate + Creator + Marketplace earnings are available on every plan, including Free.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger(0.1, 0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-5"
          >
            {PRICING.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <GlassCard
                  tone="strong"
                  withBorder={p.highlight}
                  withSpotlight
                  className={`!rounded-[2rem] p-8 h-full relative overflow-hidden ${p.highlight ? 'ring-1 ring-brand-400/40' : ''}`}
                >
                  {p.highlight && (
                    <span className="absolute top-4 right-4 badge-pill badge-brand">Most popular</span>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">{p.name}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-4xl text-white">₹{p.price.toLocaleString()}</span>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-[0.16em]">{p.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300 leading-6">{p.blurb}</p>
                  <ul className="mt-6 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                        <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-[9px] font-extrabold text-white">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <Link
                      to={ctaTo}
                      className={p.highlight ? 'btn-glow w-full' : 'btn-ghost w-full'}
                    >
                      {p.cta}
                    </Link>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <GlassCard tone="strong" className="!rounded-[2.5rem] p-10 sm:p-14 text-center relative overflow-hidden">
            <AuroraBackground variant="warm" intensity={0.4} showGrid={false} />
            <ParticleField count={28} color="#FBBF24" />
            <div className="relative">
              <span className="eyebrow"><span>Get started in 2 minutes</span></span>
              <h2 className="mt-5 section-display">
                <span className="text-white">Your taste,</span>{' '}
                <GradientText variant="warm">your income.</GradientText>
              </h2>
              <p className="mt-5 max-w-xl mx-auto text-lg text-slate-300 leading-7">
                Sign up free. Refer friends from your dashboard. Submit your first template by tomorrow.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <MagneticButton as="a" href={ctaTo} variant="glow" className="!px-7 !py-4 !text-base">
                  {ctaLabel}
                </MagneticButton>
                <Link to="/landing" className="btn-ghost !px-6 !py-4 !text-sm">Back to home</Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <Footer variant="landing" />
      <div className="h-12" />
    </div>
  );
}
