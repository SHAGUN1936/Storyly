import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, LayoutGrid, Sparkles, Shield, LogOut, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StorylyMark } from './StorylyLogo';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import FeedbackModal from './FeedbackModal';
import ConfirmDialog from './ConfirmDialog';
import NeonOrb from '../ui/NeonOrb';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';
import { pageTransition } from '../motion/variants';

/* Adapter so the existing `<Icon filled={active}/>` API keeps working —
   lucide icons are stroked by default; when `filled` we tint the fill
   to currentColor for the active-pill look. */
const iconAdapter = (LucideIcon) => ({ filled, size = 20 }) => (
  <LucideIcon
    size={size}
    strokeWidth={2}
    fill={filled ? 'currentColor' : 'none'}
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);
const HomeIcon     = iconAdapter(Home);
const GridIcon     = iconAdapter(LayoutGrid);
const ShieldIcon   = iconAdapter(Shield);
const SparkleIcon  = () => <Sparkles size={20} strokeWidth={2} />;
const LogoutIcon   = () => <LogOut size={16} strokeWidth={2} />;
const FeedbackIcon = () => <MessageCircle size={16} strokeWidth={2} />;

export default function Layout() {
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Wait for the server to invalidate the session, then hard-navigate.
    // window.location.replace causes a full page reload, which:
    //   1. avoids the React Router + AnimatePresence transition that was
    //      showing a blank screen mid-animation,
    //   2. guarantees Login.jsx mounts fresh with no user state (no
    //      auto-redirect back into the studio),
    //   3. clears any cached page state / motion contexts cleanly.
    setLoggingOut(true);
    try { await logout(); } catch (_) { /* best-effort server cleanup */ }
    window.location.replace('/login');
  };

  const navItems = [
    { to: '/studio',    label: 'Feed',     icon: HomeIcon },
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

      {/* Five candy orbs scattered around the viewport — lavender, pink,
          peach, mint, yellow — at low alphas so the page reads colorful
          without ever feeling chaotic. */}
      <NeonOrb color="#C4B5FD" size="34rem" style={{ top: '-10rem', left: '-6rem' }} opacity={0.14} />
      <NeonOrb color="#F9A8D4" size="28rem" style={{ top: '-4rem', right: '-6rem' }} opacity={0.12} />
      <NeonOrb color="#FDBA74" size="24rem" style={{ top: '38%', right: '-8rem' }} opacity={0.08} />
      <NeonOrb color="#A7F3D0" size="26rem" style={{ bottom: '-6rem', left: '22%' }} opacity={0.10} />
      <NeonOrb color="#FDE68A" size="22rem" style={{ bottom: '22%', left: '-6rem' }} opacity={0.07} />

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
                          background: 'linear-gradient(120deg, rgba(167,139,250,0.25), rgba(139,92,246,0.35) 60%, rgba(236,72,153,0.25))',
                          boxShadow: '0 8px 24px -8px rgba(167,139,250,0.40), inset 0 1px 0 rgba(255,255,255,0.15)',
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
                        background: 'linear-gradient(120deg, rgba(196,181,253,0.18), rgba(167,139,250,0.22) 60%, rgba(244,114,182,0.18))',
                        boxShadow: '0 6px 18px -10px rgba(167,139,250,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
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
                to={location.pathname === '/studio' ? '/studio' : '/studio?scroll=templates'}
                onClick={(e) => {
                  // Already on /studio? Don't reload — scroll the templates
                  // grid into view instead. Dashboard listens for the event
                  // and does a smoothscroll with the topbar offset accounted.
                  if (location.pathname === '/studio') {
                    e.preventDefault();
                    window.dispatchEvent(new Event('storyly:scroll-to-templates'));
                  }
                }}
                className="hidden sm:inline-flex btn-glow !py-2 !px-4 !text-xs"
                data-tooltip="Create something new"
              >
                <SparkleIcon /> <span className="hidden lg:inline">Create</span>
              </Link>
              <div className="tpl-user-cluster flex items-center gap-2 rounded-full pl-1.5 pr-2 py-1">
                <Link to="/account" className="story-ring p-[2px] hover:opacity-90 transition" data-tooltip="Account & profile">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="tpl-user-avatar w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold">
                      {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </Link>
                <Link to="/account" className="tpl-user-name hidden sm:block text-xs font-semibold max-w-[8ch] truncate hover:opacity-80 transition" data-tooltip="Account & profile">
                  {user?.name}
                </Link>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setFeedbackOpen(true)}
                  className="tpl-user-signout rounded-full p-1.5 transition"
                  data-tooltip="Send feedback"
                  data-tooltip-align="end"
                  aria-label="Send feedback"
                >
                  <FeedbackIcon />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={() => setConfirmLogoutOpen(true)}
                  className="tpl-user-signout rounded-full p-1.5 transition"
                  data-tooltip="Sign out"
                  data-tooltip-align="end"
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
              to={location.pathname === '/studio' ? '/studio' : '/studio?scroll=templates'}
              onClick={(e) => {
                if (location.pathname === '/studio') {
                  e.preventDefault();
                  window.dispatchEvent(new Event('storyly:scroll-to-templates'));
                }
              }}
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
                onClick={() => setConfirmLogoutOpen(true)}
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

      {/* Sign-out confirmation — prevents accidental logout. */}
      <ConfirmDialog
        open={confirmLogoutOpen}
        title={`Heading out, ${user?.name?.split(' ')[0] || 'friend'}? 👋`}
        description="Your stories, drafts, and likes stay safe in your account — pop back in any time. Want us to sign you out on this device?"
        confirmLabel="Yes, sign me out"
        cancelLabel="Stay a while"
        loading={loggingOut}
        iconTone="pink"
        icon={
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        }
        onConfirm={handleLogout}
        onClose={() => !loggingOut && setConfirmLogoutOpen(false)}
      />
    </div>
  );
}
