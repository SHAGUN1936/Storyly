import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const googleContainerRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authAPI.login({ email, password });
      login(user);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleContainerRef.current || typeof window.google === 'undefined') return;
    const init = () => {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          setError('');
          try {
            const { user } = await authAPI.google(response.credential);
            login(user);
            navigate(user.role === 'admin' ? '/admin' : '/');
          } catch (err) {
            setError(err.message || 'Google login failed');
          }
        },
      });
      window.google.accounts.id.renderButton(googleContainerRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 320,
        type: 'standard',
      });
    };
    if (window.google?.accounts?.id) init();
    else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(t);
          init();
        }
      }, 100);
      return () => clearInterval(t);
    }
  }, [login, navigate]);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:w-1/2 flex flex-col justify-center px-8 py-12 lg:py-0 lg:px-16 xl:px-24 border-b lg:border-b-0 lg:border-r border-white/5"
      >
        <span className="text-3xl font-bold gradient-text mb-4 tracking-tight">Storyly</span>
        <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-3">Sign in to continue</h2>
        <p className="text-zinc-400 max-w-md leading-relaxed">
          Pick a ready-made mini website, add your photos and words, then share a link or QR — perfect for surprises,
          invites, and memories.
        </p>
        <div className="hidden lg:flex mt-10 flex-wrap gap-3 text-sm text-zinc-500">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Story pages</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Video &amp; pages</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">Secure login</span>
        </div>
      </motion.div>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 shadow-2xl"
      >
        <h1 className="text-2xl font-bold gradient-text mb-2">Welcome back</h1>
        <p className="text-zinc-400 text-sm mb-6">Sign in to Storyly with email or Google</p>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm mb-4 p-3 rounded-lg bg-red-500/10"
          >
            {error}
          </motion.p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 to-pink-500 text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-dark-800 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <div ref={googleContainerRef} className="flex justify-center min-h-[44px]" />

        <p className="mt-6 text-center text-zinc-400 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign up
          </Link>
        </p>
      </motion.div>
      </div>
    </div>
  );
}
