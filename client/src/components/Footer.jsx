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

/* Brand glyphs — proper trademark paths instead of the previous outline
   approximations. Each renders crisp at 16–24px and inherits currentColor
   so hover tinting works. */
function SocialIcon({ kind }) {
  const baseProps = { width: 16, height: 16, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg', 'aria-hidden': true };
  switch (kind) {
    case 'instagram':
      // Real Instagram outline (camera body + lens + flash dot)
      return (
        <svg {...baseProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'x':
      // Official X wordmark
      return (
        <svg {...baseProps} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'youtube':
      // YouTube play badge (rounded rect + triangle)
      return (
        <svg {...baseProps} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.546 15.568V8.432L15.818 12l-6.272 3.568z" />
        </svg>
      );
    case 'github':
      // GitHub Octocat mark
      return (
        <svg {...baseProps} fill="currentColor">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      );
    default:
      return null;
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
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 60%)', filter: 'blur(50px)' }} />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.30) 0%, transparent 60%)', filter: 'blur(50px)' }} />

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

              {/* Social cluster — each chip lights up in its real brand
                  color on hover (Instagram gradient, X near-black, YouTube
                  red, GitHub ink). */}
              <div className="mt-6 flex items-center gap-2.5">
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
                    className={`social-chip social-chip-${s.kind}`}
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
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
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
  // group-hover animates the leading gradient bar (width 0 → 2.5) AND
  // nudges the label slightly to the right. Both transitions use the
  // same duration so they read as a single smooth motion.
  const cls = 'group inline-flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition-colors duration-300';
  const inner = (
    <>
      <span className="inline-block w-0 group-hover:w-3 h-px bg-gradient-to-r from-indigo-400 to-violet-500 transition-all duration-300 ease-out" />
      <span className="inline-block transform group-hover:translate-x-1 transition-transform duration-300 ease-out">
        {item.label}
      </span>
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
