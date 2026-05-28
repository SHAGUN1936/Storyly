import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StorylyMark } from './StorylyLogo';
import GradientText from '../ui/GradientText';
import GlassCard from '../ui/GlassCard';

/**
 * Footer link config — every link points to a unique route, no two
 * destinations overlap. Items can declare `to:` (React Router),
 * `hash:` (anchor link), or `external:` (new tab).
 */
const PRODUCT_LINKS = [
  { label: 'Studio',          to: '/studio' },
  { label: 'My pages',        to: '/my-videos' },
  { label: 'Marketplace',     to: '/marketplace' },
  { label: 'Builder Program', to: '/builder' },
];

const RESOURCE_LINKS = [
  { label: 'Help Center', to: '/help' },
  { label: 'Tutorials',   to: '/tutorials' },
  { label: 'Customer stories', to: '/stories' },
];

const COMPANY_LINKS = [
  { label: 'About',   to: '/about' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms',   to: '/terms' },
  { label: 'Contact', to: '/contact' },
];

function SocialIcon({ kind }) {
  const common = {
    width: 16, height: 16, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (kind) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      );
    case 'youtube':
      return (
        <svg {...common}>
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'github':
      return (
        <svg {...common}>
          <path d="M9 19c-5 1.5-5-2-7-2.5M15 22v-4a3.4 3.4 0 0 0-1-2.6c3 0 6-2 6-5.5a4.4 4.4 0 0 0-1.2-3.1 4 4 0 0 0-.1-3.2s-1 0-3.2 1.3a11 11 0 0 0-6 0C7.3 3 6.4 3 6.4 3a4 4 0 0 0-.1 3.2A4.4 4.4 0 0 0 5 9.3c0 3.5 3 5.5 6 5.5a3.4 3.4 0 0 0-1 2.6V22" />
        </svg>
      );
    default: return null;
  }
}

/**
 * Premium footer — glass band with brand block, link columns, social
 * cluster, animated bottom strip. Variants:
 *   - variant="app"      → tight, signed-in app footer (default)
 *   - variant="landing"  → bigger, marketing-page footer
 */
export default function Footer({ variant = 'app' }) {
  const isLanding = variant === 'landing';
  const year = new Date().getFullYear();

  return (
    <footer className={`relative ${isLanding ? 'mt-20 sm:mt-28' : 'mt-16'}`}>
      <div className={`mx-auto max-w-7xl ${isLanding ? 'px-4 sm:px-6 lg:px-8' : 'px-2 sm:px-4'}`}>
        <GlassCard
          tone="strong"
          className={`!rounded-[2rem] relative overflow-hidden ${isLanding ? 'p-10 sm:p-14' : 'p-8 sm:p-10'}`}
          hover="none"
        >
          {/* Decorative glow + grid */}
          <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-20" />
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 60%)', filter: 'blur(50px)' }} />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.30) 0%, transparent 60%)', filter: 'blur(50px)' }} />

          <div className="relative grid gap-10 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
            {/* Brand block */}
            <div>
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <StorylyMark size={40} idSuffix="foot" />
                <span className="storyly-wordmark font-display font-extrabold text-lg tracking-tight">Storyly</span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
                The cinematic story builder for{' '}
                <GradientText variant="cosmic">every celebration.</GradientText>{' '}
                Invitations, weddings, birthdays, events — built in minutes.
              </p>

              {/* Social cluster */}
              <div className="mt-6 flex items-center gap-2">
                {[
                  { kind: 'instagram', label: 'Instagram' },
                  { kind: 'x',         label: 'X (Twitter)' },
                  { kind: 'youtube',   label: 'YouTube' },
                  { kind: 'github',    label: 'GitHub' },
                ].map((s) => (
                  <motion.a
                    key={s.kind}
                    href="#"
                    aria-label={s.label}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/[0.10] flex items-center justify-center transition"
                  >
                    <SocialIcon kind={s.kind} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <FooterColumn title="Product"   items={PRODUCT_LINKS} />
            <FooterColumn title="Resources" items={RESOURCE_LINKS} />
            <FooterColumn title="Company"   items={COMPANY_LINKS} />
          </div>

          {/* Bottom strip */}
          <div className="relative mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              © {year} Storyly. Crafted with{' '}
              <span className="inline-block animate-pulse text-base align-middle">💜</span>
              {' '}for storytellers.
            </p>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.22em] font-bold text-slate-500">
              <span>v1.0</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All systems live
              </span>
            </div>
          </div>

          {/* Animated beam line at the very bottom */}
          <div className="pointer-events-none absolute inset-x-10 bottom-0 h-px overflow-hidden">
            <div className="beam-line h-px w-full" />
          </div>
        </GlassCard>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-4">{title}</p>
      <ul className="space-y-2.5">
        {items.map((i) => (
          <li key={i.label}>
            <FooterLink item={i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterLink({ item }) {
  const cls = 'group inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition';
  const inner = (
    <>
      <span className="inline-block w-0 group-hover:w-2.5 h-px bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-300" />
      {item.label}
    </>
  );
  if (item.external) {
    return (
      <a href={item.external} className={cls} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }
  if (item.hash) {
    return <a href={item.hash} className={cls}>{inner}</a>;
  }
  return <Link to={item.to} className={cls}>{inner}</Link>;
}
