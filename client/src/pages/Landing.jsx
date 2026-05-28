import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
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
import MarqueeRow from '../ui/MarqueeRow';
import AnimatedCount from '../ui/AnimatedCount';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';
import {
  BalloonSticker, CakeSticker, HeartSticker, RingSticker,
  ConfettiSticker, StarSticker, DiscoSticker, GiftSticker,
} from '../ui/CartoonStickers';
import { fadeUp, fadeUpSmall, stagger, blurUp } from '../motion/variants';

const HERO_TEMPLATES = [
  { emoji: '💍', cat: 'Wedding',     grad: 'from-rose-400 via-fuchsia-500 to-violet-600' },
  { emoji: '🎂', cat: 'Birthday',    grad: 'from-fuchsia-400 via-purple-500 to-indigo-600' },
  { emoji: '✨', cat: 'Invitation',  grad: 'from-cyan-400 via-violet-500 to-fuchsia-600' },
  { emoji: '💖', cat: 'Couple',      grad: 'from-pink-400 via-rose-500 to-fuchsia-600' },
  { emoji: '🎉', cat: 'Celebration', grad: 'from-amber-400 via-fuchsia-500 to-cyan-500' },
];

const FEATURE_TIMELINE = [
  {
    step: '01',
    title: 'Pick a vibe',
    desc: 'Choose from cinematic templates curated by designers — weddings, birthdays, invitations, every moment.',
    color: '#22D3EE',
  },
  {
    step: '02',
    title: 'Drag, drop, edit',
    desc: 'Real-time visual editor. Text, photos, videos, music, stickers — change anything by tapping it.',
    color: '#A855F7',
  },
  {
    step: '03',
    title: 'Animate the magic',
    desc: 'Add transitions, soundtracks, and motion. Your page feels like a movie, not a PDF.',
    color: '#F472B6',
  },
  {
    step: '04',
    title: 'Share & celebrate',
    desc: 'One link, one QR. Mobile-first, instant-loading, shareable everywhere.',
    color: '#FBBF24',
  },
];

const CATEGORIES = [
  { name: 'Wedding',    icon: '💍', count: '120+' },
  { name: 'Birthday',   icon: '🎂', count: '90+' },
  { name: 'Invitation', icon: '✨', count: '60+' },
  { name: 'Event',      icon: '🎉', count: '80+' },
  { name: 'Couple',     icon: '💖', count: '40+' },
  { name: 'Greeting',   icon: '💌', count: '35+' },
];

const STORIES = [
  { name: 'Ananya & Rohan', title: 'A wedding that felt like a film',
    quote: '“We sent the link to 300 guests. Everyone asked who designed it. Storyly did, in 20 minutes.”' },
  { name: 'Krish T.', title: 'My birthday went viral',
    quote: '“Friends literally screamshotted the animations. I felt like a main character.”' },
  { name: 'Meera R.', title: 'Cinematic invitation, zero stress',
    quote: '“It looked like a Bollywood teaser. Drag, drop, share. Done.”' },
];

export default function Landing() {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY    = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpac = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  // Hero stack — micro animation on mount via GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-card', {
        y: 60, opacity: 0, scale: 0.92, stagger: 0.12, duration: 1.1, ease: 'expo.out', delay: 0.3,
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const ctaTo = user ? '/studio' : '/signup';
  const ctaLabel = user ? 'Open studio' : 'Start free';

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <CursorHalo />
      {/* Sitewide floating decor — clipped so it never paints under the
          floating navbar at the top of the page. */}
      <div className="pointer-events-none fixed inset-x-0 top-24 bottom-0 z-0">
        <FloatingDecor density="normal" opacity={0.18} size={52} />
      </div>
      {/* Topbar frosted backdrop — grounds the floating pill nav */}
      <div className="tpl-nav-backdrop pointer-events-none fixed inset-x-0 top-0 h-24 z-30" />

      {/* ─── Top nav ─── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-ink-900/70 backdrop-blur-xl px-4 py-2.5 shadow-glass">
            <Link to="/" className="flex items-center gap-2.5">
              <StorylyMark size={36} idSuffix="land-nav" />
              <span className="storyly-wordmark font-display text-base font-extrabold tracking-tight">Storyly</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
              <a href="#features" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Features</a>
              <Link to="/marketplace" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Marketplace</Link>
              <Link to="/builder" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition inline-flex items-center gap-1.5">
                <span>Builder</span>
                <span className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-1.5 py-px text-[8px] font-bold text-white uppercase tracking-[0.16em]">New</span>
              </Link>
              <Link to="/stories" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">Stories</Link>
              <Link to="/about" className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition">About</Link>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle className="!w-9 !h-9" />
              {user ? (
                <Link to="/studio" className="btn-glow !py-2 !px-4 !text-xs">Open studio</Link>
              ) : (
                <>
                  <Link to="/login" className="hidden sm:inline-flex btn-ghost !py-2 !px-4 !text-xs">Sign in</Link>
                  <Link to="/signup" className="btn-glow !py-2 !px-4 !text-xs">Get started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section ref={heroRef} className="relative pt-32 pb-24 sm:pt-44 sm:pb-32">
        <AuroraBackground variant="cosmic" intensity={0.85} />
        <ParticleField count={64} color="#A855F7" />

        <motion.div
          style={{ y: heroY, opacity: heroOpac }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.div
            variants={stagger(0.15, 0.10)}
            initial="hidden"
            animate="visible"
            className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16 items-center"
          >
            <div>
              <motion.span variants={fadeUpSmall} className="eyebrow">
                <span>AI-powered story builder</span>
              </motion.span>

              <motion.h1
                variants={blurUp}
                className="mt-6 font-display font-extrabold leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 7.5vw, 5.75rem)' }}
              >
                <span className="block text-white">Design moments that feel</span>
                <span className="block">
                  <GradientText variant="cosmic" className="block">cinematic.</GradientText>
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-7 max-w-xl text-lg sm:text-xl text-slate-300 leading-[1.6]"
              >
                Build invitations, wedding pages, birthdays and celebrations that look like films — animated, shareable, unforgettable. No code. No designer needed.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-3">
                <MagneticButton as="a" href={ctaTo} variant="glow" className="!px-7 !py-4 !text-base">
                  <span>{ctaLabel}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </MagneticButton>
                <Link to="#templates" className="btn-ghost !px-6 !py-4 !text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Watch the demo
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.22em] text-slate-500 font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live in 60 seconds
                </span>
                <span>Free forever plan</span>
                <span>No card required</span>
              </motion.div>

              {/* Mini sticker row — celebrates the moments Storyly is for */}
              <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">For every</span>
                <motion.div animate={{ y: [0, -6, 0], rotate: [-4, 4, -4] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
                  <CakeSticker size={42} />
                </motion.div>
                <motion.div animate={{ y: [0, -4, 0], rotate: [3, -3, 3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}>
                  <HeartSticker size={36} />
                </motion.div>
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}>
                  <DiscoSticker size={40} />
                </motion.div>
                <motion.div animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
                  <GiftSticker size={40} />
                </motion.div>
                <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}>
                  <StarSticker size={32} />
                </motion.div>
              </motion.div>
            </div>

            {/* Right-side floating story stack */}
            <div className="relative h-[460px] sm:h-[560px] hidden md:block">
              <NeonOrb color="#A855F7" size="22rem" style={{ top: '-3rem', right: '-3rem' }} />
              <NeonOrb color="#06B6D4" size="20rem" style={{ bottom: '-2rem', left: '-2rem' }} opacity={0.4} />

              {/* Cartoon stickers floating beside the phone stack */}
              <motion.div
                className="absolute -top-6 -left-6 z-10"
                animate={{ y: [0, -14, 4, 0], rotate: [-8, 6, -10, -8] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BalloonSticker size={84} color="#F472B6" />
              </motion.div>
              <motion.div
                className="absolute top-1/3 -right-4 z-10"
                animate={{ y: [0, -10, 0], rotate: [4, -4, 4] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ConfettiSticker size={64} />
              </motion.div>
              <motion.div
                className="absolute -bottom-2 right-12 z-10"
                animate={{ y: [0, -8, 2, 0], rotate: [-6, 8, -4, -6] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RingSticker size={72} />
              </motion.div>
              <motion.div
                className="absolute top-12 right-12 z-10"
                animate={{ scale: [1, 1.18, 1], rotate: [0, 15, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <StarSticker size={48} />
              </motion.div>

              <div className="relative h-full">
                {HERO_TEMPLATES.map((t, i) => {
                  const angles = [-12, -4, 4, 12, 20];
                  const offsets = [0, 60, 120, 180, 240];
                  return (
                    <div
                      key={t.cat}
                      className="hero-card keep-dark absolute"
                      style={{
                        left: `${offsets[i]}px`,
                        top: `${i * 14}px`,
                        zIndex: i + 1,
                        transform: `rotate(${angles[i]}deg)`,
                      }}
                    >
                      <div
                        className="w-44 h-72 rounded-[2rem] p-1.5 shadow-pop border border-white/15"
                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))' }}
                      >
                        <div className={`w-full h-full rounded-[1.7rem] bg-gradient-to-br ${t.grad} relative overflow-hidden flex flex-col`}>
                          <div className="absolute inset-x-3 top-3 flex gap-1">
                            <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                            <span className="h-0.5 flex-1 rounded-full bg-white/40" />
                          </div>
                          <div className="flex-1 flex items-center justify-center text-7xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]">
                            {t.emoji}
                          </div>
                          <div className="p-4">
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">{t.cat}</p>
                            <p className="mt-1 font-display font-bold text-white text-lg leading-tight">Your moment, your way.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Trending templates marquee ─── */}
      <section id="templates" className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-10">
          <motion.div
            variants={stagger()}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.span variants={fadeUpSmall} className="eyebrow"><span>Trending templates</span></motion.span>
            <motion.h2 variants={fadeUp} className="section-title mt-5 max-w-3xl">
              Curated by designers.{' '}
              <GradientText variant="soft">Customized by you.</GradientText>
            </motion.h2>
          </motion.div>
        </div>

        <div className="space-y-6">
          <MarqueeRow direction="left" speed="normal">
            {[...HERO_TEMPLATES, ...HERO_TEMPLATES].map((t, i) => (
              <div
                key={`row1-${i}`}
                className={`w-56 h-80 rounded-[2rem] bg-gradient-to-br ${t.grad} relative overflow-hidden p-1 border border-white/10 shadow-card shrink-0`}
              >
                <div className="absolute inset-1 rounded-[1.75rem] overflow-hidden flex flex-col justify-end p-4">
                  <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-95">{t.emoji}</div>
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">{t.cat}</p>
                    <p className="mt-1 font-display font-bold text-white text-lg">Premium · 4K</p>
                  </div>
                </div>
              </div>
            ))}
          </MarqueeRow>

          <MarqueeRow direction="right" speed="slow">
            {[...HERO_TEMPLATES].reverse().concat(HERO_TEMPLATES).map((t, i) => (
              <div
                key={`row2-${i}`}
                className={`w-56 h-80 rounded-[2rem] bg-gradient-to-tr ${t.grad} relative overflow-hidden p-1 border border-white/10 shadow-card shrink-0`}
              >
                <div className="absolute inset-1 rounded-[1.75rem] overflow-hidden flex flex-col justify-end p-4">
                  <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-95">{t.emoji}</div>
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">{t.cat}</p>
                    <p className="mt-1 font-display font-bold text-white text-lg">Animated</p>
                  </div>
                </div>
              </div>
            ))}
          </MarqueeRow>
        </div>

        <div className="mt-12 flex justify-center">
          <Link to={user ? '/' : '/signup'} className="btn-glow">Explore all templates →</Link>
        </div>
      </section>

      {/* ─── Categories grid ─── */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="text-center mb-12"
          >
            <motion.span variants={fadeUpSmall} className="eyebrow"><span>For every moment</span></motion.span>
            <motion.h2 variants={fadeUp} className="section-title mt-5">
              One platform.{' '}
              <GradientText variant="cosmic">Every celebration.</GradientText>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger(0.1, 0.06)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
          >
            {CATEGORIES.map((c) => (
              <motion.div key={c.name} variants={fadeUpSmall}>
                <GlassCard withSpotlight hover="lift" className="p-5 flex flex-col items-center text-center cursor-pointer">
                  <div className="text-4xl mb-3 drop-shadow-[0_4px_12px_rgba(168,85,247,0.6)]">{c.icon}</div>
                  <p className="font-display font-bold text-white text-sm">{c.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 mt-1">{c.count}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Feature timeline ─── */}
      <section id="features" className="relative py-24 sm:py-32">
        <NeonOrb color="#7C3AED" size="36rem" style={{ top: '0%', left: '-12%' }} opacity={0.25} />
        <NeonOrb color="#06B6D4" size="32rem" style={{ bottom: '-10%', right: '-12%' }} opacity={0.25} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="mb-16 max-w-3xl"
          >
            <motion.span variants={fadeUpSmall} className="eyebrow"><span>How it works</span></motion.span>
            <motion.h2 variants={fadeUp} className="section-title mt-5">
              From idea to{' '}
              <GradientText variant="cosmic">share link</GradientText>{' '}
              in 4 steps.
            </motion.h2>
          </motion.div>

          <div className="relative grid md:grid-cols-2 gap-6 lg:gap-8">
            {FEATURE_TIMELINE.map((f, i) => (
              <motion.div
                key={f.step}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.08 }}
              >
                <GlassCard withSpotlight withBorder className="p-7 sm:p-8 h-full">
                  <div className="flex items-start gap-5">
                    <div
                      className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-display font-extrabold text-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${f.color}, ${f.color}80)`,
                        boxShadow: `0 0 30px -4px ${f.color}80`,
                      }}
                    >
                      {f.step}
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-white">{f.title}</h3>
                      <p className="mt-2 text-slate-300 leading-7">{f.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI-powered builder showcase ─── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GlassCard tone="strong" className="relative overflow-hidden p-8 sm:p-14 lg:p-20">
            <NeonOrb color="#A855F7" size="28rem" style={{ top: '-6rem', right: '-6rem' }} />
            <NeonOrb color="#06B6D4" size="24rem" style={{ bottom: '-6rem', left: '-4rem' }} opacity={0.35} />

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
              >
                <motion.span variants={fadeUpSmall} className="eyebrow"><span>AI customization</span></motion.span>
                <motion.h3 variants={fadeUp} className="mt-5 font-display font-extrabold tracking-tight text-4xl sm:text-5xl leading-[1.05]">
                  Edit it like a{' '}
                  <GradientText variant="warm">story.</GradientText>
                </motion.h3>
                <motion.p variants={fadeUp} className="mt-5 text-lg text-slate-300 leading-8 max-w-lg">
                  Tap anything to change it. Swap photos with a drop. Drag fonts, animations, music. Storyly's editor feels like an Instagram story — but you build websites with it.
                </motion.p>
                <motion.ul variants={fadeUp} className="mt-7 space-y-3">
                  {[
                    'Real-time text + media editing',
                    'Smart snapping & layout guides',
                    'GIFs, stickers, music, animations',
                    'Mobile/desktop preview toggle',
                    'One-click publish + share link',
                  ].map((b) => (
                    <li key={b} className="flex items-center gap-3 text-slate-200">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 flex items-center justify-center text-[10px] font-extrabold text-white">✓</span>
                      {b}
                    </li>
                  ))}
                </motion.ul>
              </motion.div>

              {/* Mock editor preview */}
              <div className="relative">
                <div
                  className="relative mx-auto w-[280px] sm:w-[320px] rounded-[2.5rem] p-2 border border-white/15 shadow-pop"
                  style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(0,0,0,0.4))' }}
                >
                  <div className="aspect-[9/19] rounded-[2.2rem] overflow-hidden relative keep-dark" style={{ background: 'linear-gradient(135deg, #1E1B4B, #4C1D95 40%, #7C3AED 90%)' }}>
                    <div className="absolute inset-x-3 top-3 flex gap-1">
                      <span className="h-0.5 flex-1 rounded-full bg-white/90" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/30" />
                      <span className="h-0.5 flex-1 rounded-full bg-white/30" />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-300 font-bold">Save the date</p>
                      <h4 className="mt-3 font-display font-extrabold text-white text-3xl leading-[1.05]">
                        Ananya & Rohan
                      </h4>
                      <p className="mt-2 text-sm text-slate-200">12 · 02 · 2026</p>
                      <div className="mt-5 h-px w-16 bg-white/40" />
                      <p className="mt-4 text-xs text-slate-300/90">The Leela Palace · Udaipur</p>
                      <div className="mt-6 inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white border border-white/20">
                        RSVP →
                      </div>
                    </div>
                    {/* Live selection chrome (cinematic touch) */}
                    <div className="absolute inset-x-10 top-1/2 -translate-y-1/2 h-32 rounded-2xl border-2 border-cyan-300 pointer-events-none animate-pulse" />
                    <div className="absolute top-1/2 -translate-y-[88px] left-1/2 -translate-x-[2px] w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_12px_4px_rgba(34,211,238,0.65)]" />
                  </div>
                </div>

                {/* Floating UI chips around the phone */}
                <div className="absolute -left-6 top-12 hidden sm:block animate-float">
                  <GlassCard tone="strong" className="!rounded-2xl px-4 py-2 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-semibold text-white">Auto-saved</span>
                  </GlassCard>
                </div>
                <div className="absolute -right-4 top-1/3 hidden sm:block animate-float" style={{ animationDelay: '1.4s' }}>
                  <GlassCard tone="strong" className="!rounded-2xl px-4 py-2 flex items-center gap-2 text-xs">
                    <span className="text-base">🎵</span>
                    <span className="font-semibold text-white">Lo-fi piano</span>
                  </GlassCard>
                </div>
                <div className="absolute -left-4 bottom-12 hidden sm:block animate-float" style={{ animationDelay: '2s' }}>
                  <GlassCard tone="strong" className="!rounded-2xl px-4 py-2 flex items-center gap-2 text-xs">
                    <span className="text-base">✨</span>
                    <span className="font-semibold text-white">Glow effect</span>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── QR showcase ─── */}
      <section className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="relative">
                <NeonOrb color="#06B6D4" size="20rem" style={{ top: '-3rem', left: '-3rem' }} />
                <GlassCard tone="strong" className="!rounded-[2rem] p-8 relative">
                  <div className="story-ring p-[3px] w-fit mx-auto">
                    <div className="bg-ink-900 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.22em] gradient-text">Scan to view</div>
                  </div>
                  <div className="story-ring p-[3px] w-fit mx-auto mt-5">
                    <div className="bg-white p-3 rounded-2xl">
                      {/* Decorative QR */}
                      <div className="w-44 h-44 grid grid-cols-12 gap-[2px]">
                        {Array.from({ length: 144 }).map((_, i) => (
                          <div
                            key={i}
                            className="rounded-[1px]"
                            style={{
                              background: Math.random() > 0.55 ? '#06070C' : '#FFFFFF',
                              opacity: i % 13 === 0 ? 1 : Math.random(),
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-5 text-center text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
                    storyly.app / r3p2q9
                  </p>
                </GlassCard>
              </div>
            </div>
            <motion.div variants={fadeUp} className="order-1 lg:order-2">
              <span className="eyebrow"><span>QR & sharing</span></span>
              <h3 className="mt-5 font-display font-extrabold tracking-tight text-4xl sm:text-5xl leading-[1.05]">
                One scan.{' '}
                <GradientText variant="cosmic">Whole story.</GradientText>
              </h3>
              <p className="mt-5 text-lg text-slate-300 leading-8 max-w-lg">
                Every page you publish gets a beautiful link and a designer QR code. Drop them on invites, stories, or printed cards — anyone with a phone is one tap from your moment.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm">
                {[
                  { label: 'Link', icon: '🔗' },
                  { label: 'QR', icon: '📱' },
                  { label: 'Embed', icon: '✨' },
                ].map((m) => (
                  <GlassCard key={m.label} className="!rounded-2xl p-4 text-center" hover="lift">
                    <div className="text-2xl">{m.icon}</div>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-slate-300">{m.label}</p>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <GlassCard tone="strong" className="!rounded-[2rem] p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-soft opacity-30" />
            {[
              { label: 'Pages built',     to: 12480, suffix: '+' },
              { label: 'Templates',       to: 220,   suffix: '+' },
              { label: 'Avg. setup',      to: 60,    suffix: 's' },
              { label: 'Mobile loads', to: 99, suffix: '%' },
            ].map((s) => (
              <div key={s.label} className="relative">
                <p className="font-display font-extrabold text-4xl sm:text-5xl">
                  <GradientText variant="cosmic">
                    <AnimatedCount to={s.to} suffix={s.suffix} />
                  </GradientText>
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] font-bold text-slate-400">{s.label}</p>
              </div>
            ))}
          </GlassCard>
        </div>
      </section>

      {/* ─── Customer stories ─── */}
      <section id="stories" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger()} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}
            className="mb-12 text-center"
          >
            <motion.span variants={fadeUpSmall} className="eyebrow"><span>Loved by storytellers</span></motion.span>
            <motion.h2 variants={fadeUp} className="section-title mt-5">
              People are{' '}
              <GradientText variant="warm">obsessed.</GradientText>
            </motion.h2>
          </motion.div>

          <motion.div
            variants={stagger(0.1, 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-3 gap-5"
          >
            {STORIES.map((s) => (
              <motion.div key={s.name} variants={fadeUp}>
                <GlassCard withSpotlight className="p-7 h-full">
                  <div className="story-ring p-[2px] w-fit mb-4">
                    <div className="bg-ink-900 w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-white">
                      {s.name[0]}
                    </div>
                  </div>
                  <p className="text-lg font-display font-bold text-white">{s.title}</p>
                  <p className="mt-3 text-slate-300 leading-7">{s.quote}</p>
                  <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{s.name}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section id="pricing" className="relative py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <GlassCard tone="strong" className="!rounded-[2.5rem] p-10 sm:p-16 text-center relative overflow-hidden">
            <AuroraBackground variant="warm" intensity={0.4} showGrid={false} />
            <ParticleField count={32} color="#F472B6" />
            <div className="relative">
              <span className="eyebrow"><span>Start free · upgrade anytime</span></span>
              <h2 className="mt-6 section-display">
                <span className="text-white">Your story</span>{' '}
                <GradientText variant="cosmic">deserves better</GradientText>{' '}
                <span className="text-white">than a PDF.</span>
              </h2>
              <p className="mt-6 max-w-xl mx-auto text-lg text-slate-300 leading-7">
                Join the next-gen storytellers building cinematic pages, invitations and event sites with Storyly.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <MagneticButton as="a" href={ctaTo} variant="glow" className="!px-7 !py-4 !text-base">
                  {ctaLabel} — free
                </MagneticButton>
                <Link to="/login" className="btn-ghost !px-6 !py-4 !text-sm">I already have an account</Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer variant="landing" />
      <div className="h-12" />
    </div>
  );
}
