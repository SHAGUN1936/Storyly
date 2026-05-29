import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/**
 * Premium glassmorphism confirmation modal. Replaces window.confirm().
 * Dark by default (glass), flips to a lighter card in light mode via
 * `.tpl-modal-card`. Preserves the same props as before.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}) {
  useLockBodyScroll(open);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="tpl-modal-card tpl-modal-scroll rounded-3xl p-7 w-full max-w-md relative"
          >
            {/* Glow rim */}
            <div className={`absolute -top-px left-1/2 -translate-x-1/2 w-40 h-px ${danger ? 'bg-gradient-to-r from-transparent via-rose-400 to-transparent' : 'bg-gradient-to-r from-transparent via-brand-400 to-transparent'}`} />

            {danger && (
              <div className="w-14 h-14 rounded-2xl border flex items-center justify-center text-2xl mb-4 relative"
                style={{
                  background: 'linear-gradient(135deg, rgba(244,63,94,0.18), rgba(244,63,94,0.06))',
                  borderColor: 'rgba(244,63,94,0.35)',
                  boxShadow: '0 0 30px -4px rgba(244,63,94,0.45)',
                }}
              >
                ⚠
              </div>
            )}

            <h2
              id="confirm-dialog-title"
              className="tpl-modal-title font-display text-2xl font-extrabold mb-1.5 tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p className="tpl-modal-desc text-sm leading-7 mb-7">
                {description}
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="tpl-modal-cancel px-5 py-2.5 rounded-full text-sm font-bold transition disabled:opacity-50 active:scale-95"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`px-6 py-2.5 rounded-full text-sm font-bold text-white transition active:scale-95 disabled:opacity-50 border border-white/15 ${
                  danger
                    ? 'shadow-[0_18px_60px_-16px_rgba(244,63,94,0.65),inset_0_1px_0_rgba(255,255,255,0.25)]'
                    : 'shadow-[0_18px_60px_-16px_rgba(168,85,247,0.65),inset_0_1px_0_rgba(255,255,255,0.25)]'
                }`}
                style={{
                  backgroundImage: danger
                    ? 'linear-gradient(120deg, #F43F5E 0%, #EF4444 60%, #B91C1C 100%)'
                    : 'linear-gradient(120deg, #22D3EE 0%, #A855F7 50%, #F472B6 100%)',
                }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Please wait…
                  </span>
                ) : confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
