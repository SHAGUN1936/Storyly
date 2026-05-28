import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StorylyMark } from './StorylyLogo';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';

/** Top-level navigation for public pages — kept minimal so the
 *  contextual SubNav inside each page can carry section-specific items. */
const PUBLIC_NAV = [
  { label: 'Home',        to: '/' },
  { label: 'Marketplace', to: '/marketplace' },
  { label: 'Builder',     to: '/builder' },
  { label: 'Help',        to: '/help' },
  { label: 'About',       to: '/about' },
];

/** Reusable shell for public-facing pages (About, Privacy, Terms, etc.)
 *  Renders the floating top nav + ambient drifting decor + Footer. */
export default function PublicShell({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <CursorHalo />
      <div className="pointer-events-none fixed inset-x-0 top-24 bottom-0 z-0">
        <FloatingDecor density="subtle" opacity={0.15} size={44} />
      </div>
      <div className="tpl-nav-backdrop pointer-events-none fixed inset-x-0 top-0 h-24 z-30" />

      <header className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-4 flex items-center justify-between rounded-full border border-white/10 bg-ink-900/70 backdrop-blur-xl px-4 py-2.5 shadow-glass">
            <Link to="/" className="flex items-center gap-2.5">
              <StorylyMark size={36} idSuffix="pub-nav" />
              <span className="storyly-wordmark font-display text-base font-extrabold tracking-tight">Storyly</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
              {PUBLIC_NAV.map((n) => {
                // `/` only matches exactly — every path technically `startsWith('/')`,
                // so we must special-case the Home link.
                const active = n.to === '/' ? location.pathname === '/' || location.pathname === '/landing' : location.pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`px-3 py-1.5 rounded-full transition ${
                      active ? 'text-white bg-white/10' : 'hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
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

      <main className="relative z-10 pt-28 sm:pt-32">
        {children}
      </main>

      <Footer variant="landing" />
      <div className="h-12" />
    </div>
  );
}
