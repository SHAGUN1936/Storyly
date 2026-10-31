import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicShell from './PublicShell';
import SubNav from './SubNav';
import GlassCard from '../ui/GlassCard';
import { fadeUp, blurUp, stagger } from '../motion/variants';

/**
 * Generic info-page renderer (About / Privacy / Terms / Contact / Help /
 * Tutorials / Stories). Drives content from a single config so the actual
 * page files stay focused on copy, not layout.
 *
 * Config shape:
 *   {
 *     base:      '/about',
 *     eyebrow:   'About',
 *     title:     JSX,
 *     subtitle:  string | null,
 *     tabs: [
 *       { path: '',       label: 'Our story', render: () => <JSX/> },
 *       { path: 'mission', label: 'Mission',  render: () => <JSX/> },
 *     ],
 *   }
 */
export default function InfoPage({ config }) {
  const location = useLocation();
  const activeTab =
    config.tabs.find((t) => {
      const tabPath = t.path ? `${config.base}/${t.path}` : config.base;
      return location.pathname === tabPath;
    }) || config.tabs[0];

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          variants={stagger()}
          initial="hidden"
          animate="visible"
          className="text-center mb-10"
        >
          <motion.span variants={fadeUp} className="eyebrow">
            <span>{config.eyebrow}</span>
          </motion.span>
          <motion.h1
            variants={blurUp}
            className="mt-5 font-display font-extrabold tracking-tight leading-[1.05]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
          >
            {config.title}
          </motion.h1>
          {config.subtitle && (
            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg text-slate-300 leading-7 max-w-2xl mx-auto"
            >
              {config.subtitle}
            </motion.p>
          )}
        </motion.div>

        <SubNav base={config.base} items={config.tabs} />

        <motion.div
          key={activeTab.path || 'root'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <GlassCard tone="strong" className="!rounded-[2rem] p-8 sm:p-12">
            <div className="prose-card">{activeTab.render()}</div>
          </GlassCard>
        </motion.div>
      </div>
    </PublicShell>
  );
}
