import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen">
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-xl font-semibold gradient-text tracking-tight">Storyly</span>
              <span className="hidden sm:inline text-xs text-zinc-500 font-normal border-l border-white/10 pl-3">
                Your story, shared in seconds
              </span>
            </Link>
            <div className="flex items-center gap-4 flex-wrap justify-end">
              <Link to="/" className="text-zinc-400 hover:text-white transition text-sm sm:text-base">
                Dashboard
              </Link>
              <Link to="/my-videos" className="text-zinc-400 hover:text-white transition text-sm sm:text-base">
                My pages
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-brand-400 hover:text-brand-300 transition text-sm sm:text-base">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-500/30 flex items-center justify-center text-brand-400 font-medium text-sm">
                    {user?.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <span className="text-sm text-zinc-400 hidden sm:inline max-w-[120px] truncate">{user?.name}</span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  Logout
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="pt-20 pb-12 px-4">
        <Outlet />
      </main>
    </div>
  );
}
