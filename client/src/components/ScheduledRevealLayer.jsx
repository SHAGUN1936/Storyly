import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeBuilderState } from '../lib/visualTemplateBuilder';

function parseTargetMs(targetLocal) {
  if (!targetLocal || typeof targetLocal !== 'string') return null;
  const t = new Date(targetLocal).getTime();
  return Number.isFinite(t) ? t : null;
}

function formatCountdown(ms) {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(String(h).padStart(2, '0'));
  parts.push(String(m).padStart(2, '0'));
  parts.push(String(sec).padStart(2, '0'));
  return parts.join(':');
}

function ConfettiBackdrop() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: `${((i * 17) % 100) + (i % 3) * 0.5}%`,
        delay: (i % 12) * 0.04,
        dur: 2.2 + (i % 6) * 0.25,
        hue: ['#f472b6', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#fb7185'][i % 6],
      })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2.5 w-2 rounded-sm opacity-90"
          style={{ left: p.left, background: p.hue }}
          initial={{ y: -24, opacity: 0.9, rotate: 0 }}
          animate={{ y: '110%', opacity: [0.9, 0.9, 0], rotate: 720 }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}

const effectMotion = {
  none: { initial: { opacity: 0.96 }, animate: { opacity: 1 }, transition: { duration: 0.2 } },
  pulse: {
    initial: { scale: 0.92 },
    animate: { scale: [1, 1.06, 1] },
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
  bounce: {
    initial: { y: 12 },
    animate: { y: [0, -10, 0] },
    transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
  },
  glow: {
    initial: { boxShadow: '0 0 0 0 rgba(244, 114, 182, 0.5)' },
    animate: {
      boxShadow: [
        '0 0 20px 4px rgba(244, 114, 182, 0.45)',
        '0 0 36px 10px rgba(96, 165, 250, 0.35)',
        '0 0 20px 4px rgba(244, 114, 182, 0.45)',
      ],
    },
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
  shake: {
    initial: { x: 0 },
    animate: { x: [0, -6, 6, -5, 5, 0] },
    transition: { duration: 0.5, repeat: Infinity, repeatDelay: 1.2 },
  },
  confetti: {
    initial: { scale: 0.95 },
    animate: { scale: 1 },
    transition: { duration: 0.35 },
  },
};

/**
 * Live gate: when hideStoryUntilReveal, story DOM is not mounted until countdown ends.
 * `alwaysShowStoryDuringCountdown` — only for template slot preview: show story so users can fill slots while timer mode is on.
 */
export function useScheduledRevealGate(structure, alwaysShowStoryDuringCountdown = false) {
  const sr = useMemo(
    () => normalizeBuilderState(structure?.builderState || {}).scheduledReveal,
    [structure?.builderState]
  );
  const [now, setNow] = useState(() => Date.now());
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  useEffect(() => {
    if (!sr?.enabled) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [sr?.enabled]);

  useEffect(() => {
    setCelebrationDismissed(false);
  }, [sr?.targetLocal, sr?.enabled, sr?.messageAfter, sr?.hideStoryUntilReveal]);

  const targetMs = parseTargetMs(sr?.targetLocal);
  const active = Boolean(sr?.enabled && targetMs);
  const remaining = active && targetMs ? Math.max(0, targetMs - now) : 0;
  const revealed = !active || remaining <= 0;

  const hideStory =
    active && Boolean(sr.hideStoryUntilReveal) && !revealed && !alwaysShowStoryDuringCountdown;

  return {
    sr,
    active,
    targetMs,
    remaining,
    revealed,
    hideStory,
    celebrationDismissed,
    setCelebrationDismissed,
  };
}

/**
 * Countdown strip, fullscreen countdown (when story hidden), and post-time celebration.
 * Pass `gate` from useScheduledRevealGate(structure, alwaysShowStoryDuringCountdown).
 */
export default function ScheduledRevealLayer({ gate }) {
  const { sr, active, remaining, revealed, hideStory, celebrationDismissed, setCelebrationDismissed } = gate;

  if (!active) return null;

  const em = effectMotion[sr.effectAfter] || effectMotion.pulse;
  const showStrip = !revealed && !hideStory;

  return (
    <>
      {showStrip && (
        <div className="pointer-events-none absolute left-2 right-2 top-2 z-[120] flex flex-col items-center gap-1 rounded-2xl border border-white/15 bg-black/55 px-3 py-2.5 text-center shadow-lg backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/90">{sr.title}</p>
          <p className="text-[10px] text-white/65">{sr.subtitleBefore}</p>
          <p className="font-mono text-lg font-bold tabular-nums text-brand-300">{formatCountdown(remaining)}</p>
        </div>
      )}

      {!revealed && hideStory && (
        <div className="absolute inset-0 z-[125] flex flex-col items-center justify-center rounded-[inherit] bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-5 text-center shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">{sr.title}</p>
          <p className="mt-2 max-w-[18rem] text-sm text-white/70">{sr.subtitleBefore}</p>
          <p className="mt-6 font-mono text-4xl font-bold tabular-nums tracking-tight text-brand-300 sm:text-5xl">
            {formatCountdown(remaining)}
          </p>
          <p className="mt-8 text-[10px] text-white/35">Story opens when the timer hits zero</p>
        </div>
      )}

      <AnimatePresence>
        {revealed && !celebrationDismissed && (
          <motion.button
            type="button"
            aria-label="Dismiss celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 z-[130] flex cursor-pointer items-center justify-center rounded-[inherit] border-0 bg-black/72 p-4 backdrop-blur-[2px]"
            onClick={() => setCelebrationDismissed(true)}
          >
            {sr.effectAfter === 'confetti' && <ConfettiBackdrop />}
            <motion.div
              className="relative z-[1] max-w-[min(92%,22rem)] rounded-2xl border border-white/20 bg-gradient-to-br from-zinc-900/95 to-zinc-950/95 px-5 py-6 text-center shadow-2xl"
              {...em}
            >
              <p className="whitespace-pre-wrap text-lg font-semibold leading-snug text-white md:text-xl">
                {sr.messageAfter}
              </p>
              <p className="mt-4 text-[11px] text-white/45">Tap anywhere to continue</p>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
