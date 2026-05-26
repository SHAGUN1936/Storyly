import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { StorylyMark, StorylyLogo } from './StorylyLogo';
import ThemeToggle from './ThemeToggle';

const HomeIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" />
  </svg>
);
const GridIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const SparkleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" />
  </svg>
);
const ShieldIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" />
  </svg>
);

export default function Layout() {
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Feed', icon: HomeIcon },
    { to: '/my-videos', label: 'My pages', icon: GridIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <StorylyMark size={56} idSuffix="loader" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  const isActive = (to) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-32 -left-24 w-[36rem] h-[36rem] rounded-full bg-peach-400/25 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[32rem] h-[32rem] rounded-full bg-brand-400/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-sky2-400/20 blur-3xl" />

      {/* Top bar */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/50 bg-white/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-3">
            <Link to="/" className="flex items-center gap-3 group">
              <StorylyMark size={40} idSuffix="nav" />
              <div className="leading-tight">
                <p className="storyly-wordmark text-base sm:text-lg font-extrabold font-display tracking-tight">
                  Storyly
                </p>
                <p className="storyly-tagline hidden sm:block text-[11px] -mt-0.5">
                  make pages people remember
                </p>
              </div>
            </Link>

            {/* Desktop nav pills */}
            <div className="hidden md:flex items-center gap-1 rounded-full bg-white/80 px-1.5 py-1 border border-white/70 shadow-sm">
              {navItems.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active ? 'bg-slate-950 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon filled={active} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    location.pathname.startsWith('/admin')
                      ? 'btn-glow !py-2 !px-4 !text-sm'
                      : 'text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  <ShieldIcon filled={location.pathname.startsWith('/admin')} />
                  <span>Admin</span>
                </Link>
              )}
            </div>

            {/* Profile cluster */}
            <div className="flex items-center gap-2">
              <ThemeToggle className="!w-9 !h-9" />
              <Link
                to="/"
                className="hidden sm:inline-flex btn-glow !py-2 !px-4 !text-xs"
                title="Create something new"
              >
                <SparkleIcon /> <span className="hidden lg:inline">Create</span>
              </Link>
              <div className="flex items-center gap-2 rounded-full bg-white/80 pl-1.5 pr-2 py-1 border border-white/70">
                <div className="story-ring p-[2px]">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-xs font-extrabold text-brand-700">
                      {user?.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[8ch] truncate">
                  {user?.name}
                </span>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                  title="Sign out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative pt-20 pb-28 md:pb-12 px-4 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      {/* Mobile bottom nav (Instagram-style) */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/90 backdrop-blur-xl pb-safe">
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                  active ? 'text-slate-950' : 'text-slate-500'
                }`}
              >
                <Icon filled={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/"
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-brand-700"
          >
            <SparkleIcon />
            <span>Create</span>
          </Link>
          {isAdmin ? (
            <Link
              to="/admin"
              className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                location.pathname.startsWith('/admin') ? 'text-slate-950' : 'text-slate-500'
              }`}
            >
              <ShieldIcon filled={location.pathname.startsWith('/admin')} />
              <span>Admin</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold text-slate-500"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
              </svg>
              <span>Sign out</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
