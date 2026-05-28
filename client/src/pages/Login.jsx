import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { APP_INPUT_BIG } from '../lib/uiClasses';
import { StorylyMark } from '../components/StorylyLogo';
import ThemeToggle from '../components/ThemeToggle';
import AuroraBackground from '../ui/AuroraBackground';
import ParticleField from '../ui/ParticleField';
import GlassCard from '../ui/GlassCard';
import MagneticButton from '../ui/MagneticButton';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import FloatingDecor from '../ui/FloatingDecor';
import CursorHalo from '../ui/CursorHalo';
import { fadeUp, blurUp, stagger } from '../motion/variants';

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
      navigate(user.role === 'admin' ? '/admin' : '/studio');
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
            navigate(user.role === 'admin' ? '/admin' : '/studio');
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
        shape: 'pill',
      });
    };
    if (window.google?.accounts?.id) init();
    else {
      const t = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(t); init(); }
      }, 100);
      return () => clearInterval(t);
    }
  }, [login, navigate]);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/studio'} replace />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CursorHalo />
      <AuroraBackground variant="cosmic" intensity={0.85} />
      <ParticleField count={48} color="#A855F7" />
      <FloatingDecor density="normal" opacity={0.14} size={44} />

      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* Left hero */}
        <motion.div
          variants={stagger(0.1, 0.08)}
          initial="hidden"
          animate="visible"
          className="lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 relative"
        >
          <NeonOrb color="#A855F7" size="22rem" style={{ top: '-3rem', left: '-3rem' }} />

          <motion.div variants={fadeUp}>
            <Link to="/landing" className="inline-flex items-center gap-3 mb-12 w-max group">
              <StorylyMark size={44} idSuffix="login" />
              <span className="storyly-wordmark font-display text-xl font-extrabold tracking-tight">Storyly</span>
            </Link>
          </motion.div>

          <div className="max-w-xl relative">
            <motion.span variants={fadeUp} className="eyebrow">
              <span>Welcome back</span>
            </motion.span>
            <motion.h1
              variants={blurUp}
              className="mt-6 font-display font-extrabold leading-[1.0] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              <span className="block text-white">Make moments</span>
              <span className="block"><GradientText variant="cosmic">unforgettable.</GradientText></span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 text-lg leading-8 text-slate-300 max-w-md">
              Sign in to your studio and turn birthdays, invitations, wins and main-character moments into cinematic share-worthy pages.
            </motion.p>
          </div>

          <motion.div
            variants={stagger(0.4, 0.07)}
            initial="hidden"
            animate="visible"
            className="mt-12 grid grid-cols-2 gap-3 max-w-md"
          >
            {[
              { emoji: '🎬', text: 'Cinematic templates' },
              { emoji: '⚡', text: 'Live in 60 seconds' },
              { emoji: '🔗', text: 'QR + share links' },
              { emoji: '🪩', text: 'Animations & vibes' },
            ].map((b) => (
              <motion.div
                key={b.text}
                variants={fadeUp}
                whileHover={{ y: -3 }}
                className="feature-chip flex items-center gap-2"
              >
                <span className="text-lg">{b.emoji}</span>
                <span className="font-semibold">{b.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center px-4 py-10 lg:p-12 relative">
          <NeonOrb color="#06B6D4" size="20rem" style={{ bottom: '2rem', right: '-2rem' }} opacity={0.4} />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <GlassCard tone="strong" withBorder className="!rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
              <div className="mb-7">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">Sign in</h2>
                <p className="mt-2 text-sm text-slate-400">Welcome back to your studio.</p>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
                >
                  {error}
                </motion.p>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Email</label>
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
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={APP_INPUT_BIG}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <MagneticButton
                  type="submit"
                  variant="glow"
                  className="w-full !py-4 !text-base disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>Sign in <span className="text-base">✨</span></>
                  )}
                </MagneticButton>
              </form>

              <div className="relative my-7">
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <div className="relative mx-auto w-fit bg-ink-900 px-4 text-[10px] font-bold uppercase tracking-[0.32em] text-slate-500">
                  or continue with
                </div>
              </div>

              <div ref={googleContainerRef} className="flex justify-center min-h-[44px]" />

              <p className="mt-7 text-center text-sm text-slate-400">
                New here?{' '}
                <Link to="/signup" className="font-bold gradient-text">Create account</Link>
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
