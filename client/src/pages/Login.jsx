import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { APP_INPUT_BIG } from '../lib/uiClasses';
import { StorylyMark } from '../components/StorylyLogo';
import ThemeToggle from '../components/ThemeToggle';

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
        theme: 'outline',
        size: 'large',
        width: 320,
        type: 'standard',
        shape: 'pill',
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-20 w-[36rem] h-[36rem] rounded-full bg-peach-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-0 w-[34rem] h-[34rem] rounded-full bg-brand-400/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 w-[30rem] h-[30rem] rounded-full bg-sky2-400/20 blur-3xl" />

      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* Left hero */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-10 w-max">
            <StorylyMark size={44} idSuffix="login" />
            <span className="storyly-wordmark text-xl font-extrabold font-display tracking-tight">Storyly</span>
          </Link>

          <div className="max-w-xl">
            <span className="eyebrow">Welcome back ✨</span>
            <h1 className="mt-6 font-display text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              <span className="gradient-text">Make</span>
              <br />
              <span className="text-slate-900">moments swipeable.</span>
            </h1>
            <p className="mt-6 text-slate-600 leading-8 text-lg">
              Sign in and turn birthdays, crushes, wins, and main-character moments into share-worthy pages — in minutes.
            </p>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
            }}
            className="mt-10 grid grid-cols-2 gap-3 max-w-md"
          >
            {[
              { emoji: '🎉', text: 'Story-style pages' },
              { emoji: '📸', text: 'Drop photos in seconds' },
              { emoji: '🔗', text: 'Share with QR + link' },
              { emoji: '🪩', text: 'Animations & vibes' },
            ].map((b) => (
              <motion.div
                key={b.text}
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -3 }}
                className="feature-chip flex items-center gap-2"
              >
                <span className="text-lg">{b.emoji}</span>
                <span className="font-semibold text-slate-800">{b.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center px-4 py-10 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md glass p-7 sm:p-9"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold font-display text-slate-900 tracking-tight">Sign in</h2>
              <p className="mt-1.5 text-sm text-slate-600">Welcome back to your studio.</p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {error}
              </motion.p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={APP_INPUT_BIG}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={APP_INPUT_BIG}
                  placeholder="••••••••"
                  required
                />
              </div>
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="btn-glow w-full !py-3.5 !text-base disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign in ✨'}
              </motion.button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
              <div className="relative mx-auto w-fit bg-white px-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                or
              </div>
            </div>

            <div ref={googleContainerRef} className="flex justify-center min-h-[44px]" />

            <p className="mt-6 text-center text-sm text-slate-600">
              New here?{' '}
              <Link to="/signup" className="font-bold gradient-text">Create account</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
