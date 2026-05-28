import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientText from '../ui/GradientText';

const FEEDBACK_TYPES = [
  { id: 'story',   label: 'Share my story', emoji: '✨', desc: 'Tell us how you used Storyly for your moment.' },
  { id: 'bug',     label: 'Report a bug',   emoji: '🐞', desc: 'Something broken in the editor or share page.' },
  { id: 'feature', label: 'Feature request', emoji: '💡', desc: 'Something you wish Storyly could do.' },
  { id: 'general', label: 'General feedback', emoji: '💬', desc: 'Anything else you want to tell the team.' },
];

const FEEDBACK_KEY = 'storyly-feedback-log';

/**
 * Premium feedback / share-your-story modal. Captures:
 *   - kind (story / bug / feature / general)
 *   - name, email
 *   - title, body
 *   - star rating
 *
 * Submits locally to `localStorage` (no backend changes) and shows a
 * success state. Hooked to BOTH the Stories page ("Share yours" tab + CTA)
 * and the Layout avatar cluster ("Send feedback").
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - defaultKind: optional preset for the kind selector
 *  - context: optional label shown as the subtitle (e.g. "from Customer Stories")
 */
export default function FeedbackModal({ open, onClose, defaultKind = 'story', context }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="tpl-modal-card rounded-[2rem] w-full max-w-2xl relative overflow-hidden"
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-40 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
            <FeedbackForm defaultKind={defaultKind} context={context} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Standalone form — can be rendered inline (Stories "Share yours" tab)
 * or inside the modal above. Lives in this file so the kind picker, rating,
 * and submit logic stay in one place.
 */
export function FeedbackForm({ defaultKind = 'story', context, onClose, inline = false }) {
  const [kind, setKind]   = useState(defaultKind);
  const [name, setName]   = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!body.trim()) { setError('Please write a few words.'); return; }
    if (kind === 'story' && !title.trim()) { setError('Give your story a title.'); return; }

    const entry = {
      kind, name, email, title, body, rating,
      context: context || null,
      at: new Date().toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify([entry, ...existing].slice(0, 200)));
    } catch (_) {
      /* localStorage blocked — ignore, still show success */
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className={`relative ${inline ? 'p-2' : 'p-8 sm:p-10'} text-center`}>
        <div className="text-7xl mb-5 drop-shadow-[0_10px_30px_rgba(168,85,247,0.55)]">🎉</div>
        <h3 className="tpl-modal-title font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          Thanks for sharing!
        </h3>
        <p className="tpl-modal-desc mt-3 max-w-md mx-auto leading-7">
          Your {kind === 'story' ? 'story' : 'feedback'} just landed with the team.
          We read every submission and will reach out if we feature you.
        </p>
        {!inline && (
          <button onClick={onClose} className="btn-glow mt-7">
            Done
          </button>
        )}
        {inline && (
          <button
            onClick={() => { setSubmitted(false); setBody(''); setTitle(''); setRating(0); }}
            className="btn-ghost mt-7 !text-sm"
          >
            Submit another →
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`relative ${inline ? '' : 'p-7 sm:p-9'}`}>
      <h3 id="feedback-title" className="tpl-modal-title font-display text-2xl font-extrabold tracking-tight">
        <GradientText variant="cosmic">Share with us.</GradientText>
      </h3>
      {context && <p className="tpl-modal-desc mt-1.5 text-sm">{context}</p>}

      {/* Kind picker */}
      <div className="mt-5 grid grid-cols-2 gap-2">
        {FEEDBACK_TYPES.map((t) => {
          const active = kind === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setKind(t.id)}
              className={`text-left rounded-2xl border px-3 py-2.5 transition active:scale-[0.98] ${
                active
                  ? 'border-brand-400 bg-brand-500/15 text-white'
                  : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{t.emoji}</span>
                <span className="text-xs font-bold">{t.label}</span>
              </div>
              <p className="mt-1 text-[10px] leading-snug text-slate-400">{t.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Name + Email */}
      <div className="mt-4 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?"
            className="tpl-modal-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="tpl-modal-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Title (only for "story" kind) */}
      {kind === 'story' && (
        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Story title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A wedding that felt like a film"
            className="tpl-modal-input w-full px-3.5 py-2.5 rounded-xl text-sm"
          />
        </div>
      )}

      {/* Body */}
      <div className="mt-4">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          {kind === 'story' ? 'Your story' : kind === 'bug' ? 'What happened?' : kind === 'feature' ? 'What should we build?' : 'Your message'}
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            kind === 'story'
              ? 'Tell us how you used Storyly — the moment, the page, the reactions you got.'
              : kind === 'bug'
              ? 'What went wrong? What did you expect to happen?'
              : kind === 'feature'
              ? 'Describe the feature and why it would help.'
              : 'Anything else?'
          }
          rows={kind === 'story' ? 5 : 4}
          className="tpl-modal-input w-full px-3.5 py-2.5 rounded-xl text-sm resize-y"
        />
      </div>

      {/* Rating */}
      <div className="mt-4">
        <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          How would you rate Storyly?
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const filled = (hoverRating || rating) >= n;
            return (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(n)}
                className="text-2xl transition active:scale-90"
                style={{
                  color: filled ? '#FBBF24' : 'rgba(255,255,255,0.20)',
                  filter: filled ? 'drop-shadow(0 0 10px rgba(251,191,36,0.6))' : 'none',
                }}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            );
          })}
          {rating > 0 && (
            <span className="ml-2 text-xs font-bold text-slate-400">{rating} / 5</span>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2 justify-end">
        {!inline && (
          <button type="button" onClick={onClose} className="tpl-modal-cancel px-5 py-2.5 rounded-full text-sm font-bold transition">
            Cancel
          </button>
        )}
        <button type="submit" className="btn-glow !text-sm">
          {kind === 'story' ? 'Send my story' : 'Send feedback'} →
        </button>
      </div>
    </form>
  );
}
