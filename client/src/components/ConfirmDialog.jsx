import { motion } from 'framer-motion';

/**
 * Modal confirmation — replaces window.confirm().
 * Theme-aware via the `.tpl-modal-card` class (explicit !important light/dark
 * colors) plus inline-styled buttons that don't rely on Tailwind cascade.
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
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="tpl-modal-card rounded-2xl border p-6 w-full max-w-md shadow-2xl"
      >
        {danger && (
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-2xl mb-3">
            ⚠
          </div>
        )}
        <h2
          id="confirm-dialog-title"
          className="font-display text-xl font-extrabold mb-1.5"
          style={{ color: 'inherit' }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-6">
            {description}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full text-sm font-bold border border-slate-200 dark:border-white/15 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-full text-sm font-bold text-white transition active:scale-95 disabled:opacity-50 shadow-pop ${
              danger
                ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700'
                : 'bg-gradient-to-r from-brand-500 via-pink-500 to-fuchsia-600 hover:opacity-95'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
