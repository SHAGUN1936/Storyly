import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * Contextual sub-navigation pill row. Sits at the top of a section page
 * and lets users switch between sibling sub-routes.
 *
 * Props:
 *   - base:  the parent route, e.g. "/about"
 *   - items: [{ path: '', label: 'Our story' }, { path: 'mission', label: 'Mission' }, ...]
 *
 * The active tab gets an animated `layoutId` pill that morphs between
 * tabs (just like the main nav indicator).
 */
export default function SubNav({ base, items, layoutId = 'subnav-pill' }) {
  const location = useLocation();

  return (
    <div className="mb-10 flex justify-center">
      <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-ink-900/55 backdrop-blur-xl p-1.5 max-w-full overflow-x-auto hide-scrollbar">
        {items.map((item) => {
          const to = item.path ? `${base}/${item.path}` : base;
          const active =
            location.pathname === to ||
            (item.path === '' && location.pathname === base);
          return (
            <Link
              key={item.path || 'root'}
              to={to}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                active ? 'text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'linear-gradient(120deg, rgba(34,211,238,0.25), rgba(168,85,247,0.30) 60%, rgba(244,114,182,0.22))',
                    boxShadow:
                      '0 8px 24px -8px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
