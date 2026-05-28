import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StorylyMark } from './StorylyLogo';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import FeedbackModal from './FeedbackModal';
import NeonOrb from '../ui/NeonOrb';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';
import { pageTransition } from '../motion/variants';

const HomeIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" />
  </svg>
);
const GridIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);
const ShieldIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
  </svg>
);
const HeartIcon = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
  </svg>
);
const FeedbackIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function Layout() {
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/studio',    label: 'Feed',     icon: HomeIcon },
    { to: '/liked',     label: 'Liked',    icon: HeartIcon },
    { to: '/my-videos', label: 'My pages', icon: GridIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative animate-pulse">
          <div className="absolute inset-0 rounded-full blur-2xl bg-brand-500/40" />
          <StorylyMark size={56} idSuffix="layout-loader" />
        </div>
      </div>
    );
  }

  if (!user) return <Outlet />;

  const isActive = (to) =>
    to === '/studio'
      ? location.pathname === '/studio'
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Cursor halo (desktop only, respects reduced-motion) */}
      <CursorHalo />

      {/* Ambient drifting orbs */}
      <NeonOrb color="#7C3AED" size="36rem" style={{ top: '-12rem', left: '-8rem' }} opacity={0.32} />
      <NeonOrb color="#06B6D4" size="30rem" style={{ top: '-6rem', right: '-6rem' }} opacity={0.22} />
      <NeonOrb color="#F472B6" size="28rem" style={{ bottom: '-10rem', left: '30%' }} opacity={0.18} />

      {/* Sitewide floating decor — clipped away from the top + bottom
          navbars so emojis never paint under them. Single subtle layer. */}
      <div className="pointer-events-none fixed inset-x-0 top-20 bottom-24 md:bottom-0 z-0">
        <FloatingDecor density="subtle" opacity={0.18} size={48} />
      </div>

      {/* Topbar backdrop strip — sits above the page but below the floating
          pill nav. Frosted-glass fade so the area around the nav feels like
          a clean unified topbar instead of empty space. */}
      <div className="tpl-nav-backdrop pointer-events-none fixed inset-x-0 top-0 h-24 z-30" />

      {/* Mobile-only bottom nav backdrop (mirrors the topbar strip) */}
      <div className="tpl-nav-backdrop tpl-nav-backdrop-bottom md:hidden pointer-events-none fixed inset-x-0 bottom-0 h-24 z-30" />

      {/* Top bar — floating pill */}
      <nav className="fixed inset-x-0 top-0 z-40 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-ink-900/65 backdrop-blur-xl px-3 sm:px-4 py-2 shadow-glass">
            <Link to="/" className="flex items-center gap-2.5 group">
              <StorylyMark size={36} idSuffix="nav" />
              <div className="leading-tight hidden sm:block">
                <p className="storyly-wordmark text-base font-extrabold font-display tracking-tight">Storyly</p>
                <p className="storyly-tagline hidden md:block text-[10px] -mt-0.5 uppercase tracking-[0.18em]">cinematic story builder</p>
              </div>
            </Link>

            {/* Desktop nav pills */}
            <div className="hidden md:flex items-center gap-1 rounded-full bg-white/[0.04] px-1.5 py-1 border border-white/10">
              {navItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? 'text-white' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'linear-gradient(120deg, rgba(34,211,238,0.25), rgba(168,85,247,0.35) 60%, rgba(244,114,182,0.25))',
                          boxShadow: '0 8px 24px -8px rgba(168,85,247,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon filled={active} />
                    <span className="relative">{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    location.pathname.startsWith('/admin') ? 'text-white' : 'text-brand-200 hover:text-white'
                  }`}
                >
                  {location.pathname.startsWith('/admin') && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(120deg, rgba(34,211,238,0.25), rgba(168,85,247,0.35) 60%, rgba(244,114,182,0.25))',
                        boxShadow: '0 8px 24px -8px rgba(168,85,247,0.55), inset 0 1px 0 rgba(255,255,255,0.15)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <ShieldIcon filled={location.pathname.startsWith('/admin')} />
                  <span className="relative">Admin</span>
                </Link>
              )}
            </div>

            {/* Profile cluster */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="!w-9 !h-9" />
              <Link
                to="/studio"
                className="hidden sm:inline-flex btn-glow !py-2 !px-4 !text-xs"
                title="Create something new"
              >
                <SparkleIcon /> <span className="hidden lg:inline">Create</span>
              </Link>
              <div className="tpl-user-cluster flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1">
                <div className="story-ring p-[2px]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="tpl-user-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold">
                      {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <span className="tpl-user-name hidden sm:block text-xs font-semibold max-w-[8ch] truncate">
                  {user?.name}
                </span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="tpl-user-signout rounded-full p-1.5 transition"
                  title="Send feedback"
                  aria-label="Send feedback"
                >
                  <FeedbackIcon />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={handleLogout}
                  className="tpl-user-signout rounded-full p-1.5 transition"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogoutIcon />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          {...pageTransition}
          className="relative z-10 pt-24 pb-28 md:pb-12 px-4 sm:px-6 lg:px-8"
        >
          <Outlet />
          {/* Footer hidden on full-height editor routes */}
          {!location.pathname.startsWith('/template/') && !location.pathname.startsWith('/admin') && (
            <Footer variant="app" />
          )}
        </motion.main>
      </AnimatePresence>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pointer-events-none">
        <div className="pointer-events-auto rounded-full border border-white/10 bg-ink-900/85 backdrop-blur-xl shadow-glass pb-safe">
          <div className="grid grid-cols-5">
            {navItems.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                    active ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  <Icon filled={active} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link
              to="/studio"
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200"
            >
              <SparkleIcon />
              <span>Create</span>
            </Link>
            {isAdmin ? (
              <Link
                to="/admin"
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] transition ${
                  location.pathname.startsWith('/admin') ? 'text-white' : 'text-slate-400'
                }`}
              >
                <ShieldIcon filled={location.pathname.startsWith('/admin')} />
                <span>Admin</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400"
              >
                <LogoutIcon />
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Feedback modal — opened from the topbar avatar cluster */}
      <FeedbackModal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        defaultKind="general"
        context="From the in-app avatar menu"
      />
    </div>
  );
}
