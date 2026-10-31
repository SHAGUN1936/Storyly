import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
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
  icon,
  iconTone = 'brand', // 'brand' | 'mint' | 'pink' | 'sun'
  onConfirm,
  onClose,
}) {
  useLockBodyScroll(open);
  if (typeof document === 'undefined') return null;

  const toneBg =
    iconTone === 'mint' ? 'linear-gradient(135deg, #5EEAD4 0%, #14B8A6 100%)'
    : iconTone === 'pink' ? 'linear-gradient(135deg, #F472B6 0%, #DB2777 100%)'
    : iconTone === 'sun' ? 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)'
    : 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 55%, #F9A8D4 100%)';
  const toneGlow =
    iconTone === 'mint' ? '0 18px 38px -14px rgba(20,184,166,0.55)'
    : iconTone === 'pink' ? '0 18px 38px -14px rgba(219,39,119,0.55)'
    : iconTone === 'sun' ? '0 18px 38px -14px rgba(249,115,22,0.55)'
    : '0 18px 38px -14px rgba(167,139,250,0.40)';

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
            className="tpl-modal-card rounded-[1.75rem] p-8 sm:p-9 w-full max-w-md relative overflow-hidden text-center"
          >
            {/* Soft pastel orbs in the background */}
            <div
              className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none opacity-50"
              style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 65%)' }}
            />
            <div
              className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full pointer-events-none opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 65%)' }}
            />

            {/* Hero icon */}
            <div className="relative flex justify-center mb-5">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white border-2"
                style={{
                  background: danger
                    ? 'linear-gradient(135deg, #FB7185 0%, #DB2777 100%)'
                    : toneBg,
                  borderColor: 'rgba(255,255,255,0.30)',
                  boxShadow: danger
                    ? '0 18px 38px -14px rgba(219,39,119,0.55)'
                    : toneGlow,
                }}
              >
                {icon || (danger ? <DefaultDangerIcon /> : <DefaultBrandIcon />)}
              </div>
            </div>

            <h2
              id="confirm-dialog-title"
              className="tpl-modal-title font-display text-2xl sm:text-[1.65rem] font-extrabold mb-2 tracking-tight relative"
            >
              {title}
            </h2>
            {description && (
              <p className="tpl-modal-desc text-sm leading-7 mb-7 max-w-sm mx-auto relative">
                {description}
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sm:justify-center relative">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="tpl-modal-cancel px-6 py-3 rounded-full text-sm font-bold transition disabled:opacity-50 active:scale-95"
              >
                {cancelLabel}
              </button>
              <Button
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
                size="lg"
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DefaultDangerIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function DefaultBrandIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.39 5.36L20 8.27l-4 4.07.94 5.66L12 15.27 7.06 18l.94-5.66-4-4.07 5.61-.91L12 2z" />
    </svg>
  );
}
