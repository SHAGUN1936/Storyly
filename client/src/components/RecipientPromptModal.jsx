import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import { APP_INPUT_BIG } from '../lib/uiClasses';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

/**
 * Asks "Who is this story for?" before the user opens the editor for a
 * chosen template. The answer is passed to TemplateDetail via the
 * `?for=<name>` query param and persisted with the saved page.
 *
 * Why a forced prompt? Each saved page is dedicated to one person — the
 * name shows up in the share link + QR popup, and locks the saved card
 * so it can't be re-used for someone else. The user can still pick the
 * same template again from Browse Templates for a different person.
 */
export default function RecipientPromptModal({ open, template, onCancel, onConfirm }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the input once the modal opens, then reset on close.
  useEffect(() => {
    if (!open) {
      setName('');
      setError('');
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  useLockBodyScroll(open);

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please add a name so we can dedicate this story.');
      return;
    }
    if (trimmed.length > 80) {
      setError('Keep it under 80 characters.');
      return;
    }
    onConfirm(trimmed);
  };

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
          aria-labelledby="recipient-modal-title"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="tpl-modal-card rounded-[1.75rem] p-7 sm:p-9 w-full max-w-md relative overflow-hidden text-center"
          >
            {/* Soft pastel orbs */}
            <div
              className="absolute -top-16 -right-12 w-56 h-56 rounded-full pointer-events-none opacity-50"
              style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.30) 0%, transparent 65%)' }}
            />
            <div
              className="absolute -bottom-16 -left-12 w-56 h-56 rounded-full pointer-events-none opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.25) 0%, transparent 65%)' }}
            />

            {/* Hero sparkle badge */}
            <div className="relative flex justify-center mb-5">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-white border-2"
                style={{
                  background: 'linear-gradient(135deg, #C4B5FD 0%, #A78BFA 55%, #7C3AED 100%)',
                  borderColor: 'rgba(255,255,255,0.30)',
                  boxShadow: '0 18px 38px -14px rgba(124,58,237,0.55)',
                }}
              >
                <Sparkles size={32} strokeWidth={2.2} />
              </div>
            </div>

            <h2 id="recipient-modal-title" className="tpl-modal-title font-display text-2xl sm:text-[1.65rem] font-extrabold mb-2 tracking-tight relative">
              Who is this story for?
            </h2>
            <p className="tpl-modal-desc text-sm leading-7 mb-6 max-w-sm mx-auto relative">
              {template?.name ? <>You picked <span className="font-semibold">{template.name}</span>. </> : null}
              We'll dedicate this page to one special person — their name will appear on the shared link &amp; QR.
            </p>

            <form onSubmit={submit} className="relative space-y-4">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (error) setError(''); }}
                placeholder="e.g. Ananya & Rohan"
                maxLength={80}
                className={`${APP_INPUT_BIG} text-center`}
              />
              {error && (
                <p className="form-error-pill mx-auto">
                  <span aria-hidden="true">⚠</span>
                  {error}
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 sm:justify-center pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="tpl-modal-cancel px-6 py-3 rounded-full text-sm font-bold transition active:scale-95"
                >
                  Cancel
                </button>
                <Button type="submit" size="lg" disabled={!name.trim()}>
                  Open the editor →
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
