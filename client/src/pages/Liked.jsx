import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useLikedTemplates from '../hooks/useLikedTemplates';
import TemplateCard from '../components/TemplateCard';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import AnimatedCount from '../ui/AnimatedCount';
import FloatingDecor from '../ui/FloatingDecor';
import { HeartSticker, ConfettiSticker } from '../ui/CartoonStickers';
import { fadeUp, blurUp, stagger } from '../motion/variants';

export default function Liked() {
  const { liked, count, clear } = useLikedTemplates();

  return (
    <div className="mx-auto max-w-7xl">
      {/* Hero */}
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="mb-10">
        <GlassCard tone="strong" className="!rounded-[2rem] p-7 sm:p-10 relative overflow-hidden">
          <NeonOrb color="#F472B6" size="22rem" style={{ top: '-6rem', right: '-6rem' }} />
          <NeonOrb color="#A855F7" size="18rem" style={{ bottom: '-4rem', left: '-3rem' }} opacity={0.4} />
          <FloatingDecor density="subtle" opacity={0.13} size={32} items={['💖', '♥', '✨', '🪩', '💞', '⭐']} />
          <div className="absolute inset-0 bg-grid-soft opacity-25 pointer-events-none" />

          {/* Corner stickers */}
          <motion.div
            className="hidden md:block absolute top-4 right-12 z-10"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <HeartSticker size={48} color="#F43F5E" />
          </motion.div>
          <motion.div
            className="hidden lg:block absolute bottom-6 right-1/3 z-10"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <ConfettiSticker size={40} />
          </motion.div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Saved by you</span></motion.span>
              <motion.h1 variants={blurUp} className="section-title mt-5">
                <GradientText variant="warm">Liked</GradientText> templates
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-3 max-w-xl text-slate-300 leading-7">
                Every template you've tapped the heart on lands here. Come back and use them anytime — your saved aesthetic, ready to go.
              </motion.p>
              {count > 0 && (
                <motion.div variants={fadeUp} className="mt-5">
                  <button
                    type="button"
                    onClick={clear}
                    className="text-[10px] uppercase tracking-[0.22em] font-bold text-slate-400 hover:text-rose-300 transition"
                  >
                    Clear all liked
                  </button>
                </motion.div>
              )}
            </div>
            <motion.div variants={fadeUp} className="card-glass p-5 sm:p-6 text-center min-w-[160px]">
              <div className="text-2xl">💖</div>
              <p className="mt-1 text-3xl sm:text-4xl font-extrabold font-display">
                <GradientText variant="warm"><AnimatedCount to={count} /></GradientText>
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-0.5">Saved</p>
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Grid or empty state */}
      {liked.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-12 text-center">
            <div className="text-6xl mb-5">💔</div>
            <h2 className="text-xl font-display font-extrabold">
              <GradientText variant="warm">No liked templates yet</GradientText>
            </h2>
            <p className="mt-3 text-slate-400 max-w-md mx-auto">
              Tap the heart on any template in the feed to save it. Your collection lives here.
            </p>
            <Link to="/studio" className="btn-glow mt-7 inline-flex">
              ✨ Browse templates
            </Link>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {liked.map((t, i) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4), ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/template/${t._id}`}>
                <TemplateCard template={t} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
