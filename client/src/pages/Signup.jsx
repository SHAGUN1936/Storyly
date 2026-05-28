import { useState } from 'react';
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

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await authAPI.signup({ name, email, password });
      login(user);
      navigate(user.role === 'admin' ? '/admin' : '/studio');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/studio'} replace />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <CursorHalo color="#F472B6" />
      <AuroraBackground variant="warm" intensity={0.85} />
      <ParticleField count={48} color="#F472B6" />
      <FloatingDecor density="normal" opacity={0.14} size={44} items={['🎉', '✨', '💍', '🎂', '💌', '🪩', '🎵', '💞']} />

      <div className="absolute top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        <motion.div
          variants={stagger(0.1, 0.08)}
          initial="hidden"
          animate="visible"
          className="lg:w-1/2 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 relative"
        >
          <NeonOrb color="#F472B6" size="22rem" style={{ top: '-3rem', left: '-3rem' }} />

          <motion.div variants={fadeUp}>
            <Link to="/landing" className="inline-flex items-center gap-3 mb-12 w-max">
              <StorylyMark size={44} idSuffix="signup" />
              <span className="storyly-wordmark font-display text-xl font-extrabold tracking-tight">Storyly</span>
            </Link>
          </motion.div>

          <div className="max-w-xl relative">
            <motion.span variants={fadeUp} className="eyebrow"><span>Join the studio</span></motion.span>
            <motion.h1
              variants={blurUp}
              className="mt-6 font-display font-extrabold leading-[1.0] tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
            >
              <span className="block text-white">Your story.</span>
              <span className="block"><GradientText variant="warm">Your aesthetic.</GradientText></span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 text-lg leading-8 text-slate-300 max-w-md">
              Build cinematic invitation, birthday, wedding and event pages in minutes — animated, shareable, uniquely <em>you</em>.
            </motion.p>
          </div>

          <motion.div
            variants={stagger(0.4, 0.07)}
            initial="hidden"
            animate="visible"
            className="mt-12 grid grid-cols-2 gap-3 max-w-md"
          >
            {[
              { emoji: '🪩', text: 'Free to start' },
              { emoji: '⚡', text: 'Live in 60 seconds' },
              { emoji: '💌', text: 'QR + share links' },
              { emoji: '🎨', text: 'Drag, drop, done' },
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

        <div className="flex-1 flex items-center justify-center px-4 py-10 lg:p-12 relative">
          <NeonOrb color="#A855F7" size="20rem" style={{ bottom: '2rem', right: '-2rem' }} opacity={0.4} />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <GlassCard tone="strong" withBorder className="!rounded-[2rem] p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
              <div className="mb-7">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white">Create account</h2>
                <p className="mt-2 text-sm text-slate-400">Free forever plan. Your first page is live today.</p>
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
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={APP_INPUT_BIG}
                    placeholder="What should we call you?"
                    required
                  />
                </div>
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
                    placeholder="6+ characters"
                    required
                    minLength={6}
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
                      Creating…
                    </>
                  ) : (
                    <>Get started <span className="text-base">✨</span></>
                  )}
                </MagneticButton>
              </form>

              <p className="mt-7 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold gradient-text">Sign in</Link>
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
