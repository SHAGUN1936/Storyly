import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import NeonOrb from '../ui/NeonOrb';
import AnimatedCount from '../ui/AnimatedCount';
import { fadeUp, stagger } from '../motion/variants';

/**
 * Receipts / billing history.
 *
 * Storyly currently has two paid surfaces: one-time Marketplace template
 * purchases and the Builder Program subscription. Until those checkouts
 * are wired to a real payments provider, the receipts list reads from
 * `localStorage('storyly-receipts')` — anything written there shows up.
 *
 * The empty state is shown when there are no entries (typical for a new
 * account). It links to the Marketplace and Builder pages so the user
 * knows where receipts would come from.
 */
const STORAGE_KEY = 'storyly-receipts';

function loadReceipts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Receipts() {
  const { user } = useAuth();
  const [receipts] = useState(loadReceipts);
  const [filter, setFilter] = useState('all');

  const stats = useMemo(() => {
    const total = receipts.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return {
      total,
      count: receipts.length,
      marketplace: receipts.filter((r) => r.kind === 'marketplace').length,
      subscription: receipts.filter((r) => r.kind === 'subscription').length,
    };
  }, [receipts]);

  const visible = useMemo(() => {
    if (filter === 'all') return receipts;
    return receipts.filter((r) => r.kind === filter);
  }, [receipts, filter]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Hero */}
      <motion.div variants={stagger()} initial="hidden" animate="visible" className="mb-10">
        <GlassCard tone="strong" className="!rounded-[2rem] p-7 sm:p-10 relative overflow-hidden">
          <NeonOrb color="#A78BFA" size="22rem" style={{ top: '-6rem', right: '-6rem' }} opacity={0.4} />
          <NeonOrb color="#EC4899" size="18rem" style={{ bottom: '-4rem', left: '-3rem' }} opacity={0.35} />
          <div className="absolute inset-0 bg-grid-soft opacity-25 pointer-events-none" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.span variants={fadeUp} className="eyebrow"><span>Billing</span></motion.span>
              <motion.h1 variants={fadeUp} className="section-title mt-5">
                <GradientText variant="cosmic">Receipts</GradientText> & history
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-3 text-slate-300 max-w-xl leading-7">
                Every Marketplace template you've bought and every Builder Program payment lives here. Download a receipt anytime — useful for taxes and expense reports.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2 sm:gap-3 min-w-[280px]">
              <Stat label="Receipts" value={stats.count} prefix="" />
              <Stat label="Templates" value={stats.marketplace} prefix="" />
              <Stat label="Total" value={stats.total} prefix="₹" />
            </motion.div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Filter chips */}
      {receipts.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'all',          label: 'All' },
            { id: 'marketplace',  label: 'Template purchases' },
            { id: 'subscription', label: 'Subscriptions' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`${filter === f.id ? 'chip chip-active' : 'chip chip-default'} whitespace-nowrap`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {receipts.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-12 text-center">
            <div className="text-6xl mb-5">🧾</div>
            <h2 className="text-xl font-display font-extrabold">
              <GradientText variant="cosmic">No receipts yet</GradientText>
            </h2>
            <p className="mt-3 text-slate-400 max-w-md mx-auto leading-7">
              When you buy a premium template or subscribe to the Builder Program, the receipt lands here automatically.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link to="/marketplace" className="btn-glow !text-sm">Browse marketplace</Link>
              <Link to="/builder/pricing" className="btn-ghost !text-sm">Builder Program</Link>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {visible.map((r, i) => (
            <motion.div
              key={r.id || i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <ReceiptRow receipt={r} userEmail={user?.email} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, prefix }) {
  return (
    <div className="card-glass p-4 sm:p-5 text-center">
      <p className="text-2xl sm:text-3xl font-extrabold font-display">
        <GradientText variant="cosmic">
          <AnimatedCount to={value} prefix={prefix} />
        </GradientText>
      </p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.22em] mt-0.5">{label}</p>
    </div>
  );
}

function ReceiptRow({ receipt, userEmail }) {
  const date = receipt.date ? new Date(receipt.date) : null;
  const kindIcon = receipt.kind === 'subscription' ? '⭕' : '🛍️';
  const kindLabel = receipt.kind === 'subscription' ? 'Subscription' : 'Template';
  return (
    <GlassCard withSpotlight className="p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-xl">
          {kindIcon}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-white truncate">{receipt.description || 'Storyly purchase'}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {kindLabel}
            {date ? ` · ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
            {receipt.id ? ` · #${String(receipt.id).slice(-8)}` : ''}
          </p>
          {userEmail && <p className="text-[10px] text-slate-500 mt-0.5">{userEmail}</p>}
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-display font-extrabold text-white text-lg whitespace-nowrap">
          ₹{Number(receipt.amount || 0).toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-teal-300">
          Paid
        </p>
      </div>
    </GlassCard>
  );
}
