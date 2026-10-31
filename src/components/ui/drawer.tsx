"use client";

// Side panel for menus on phones: slides in over a dimmed page, closes on the backdrop, Esc or ×.
//   <Drawer open={open} onClose={() => setOpen(false)} title="Menu">…</Drawer>
// Rendered in <body> so sticky/blurred headers can't clip it.

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useScrollLock } from "@/lib/use-scroll-lock";
import { cn } from "@/lib/utils";

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  dark = false,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Shown at the top of the panel (e.g. the logo). */
  title?: React.ReactNode;
  side?: "left" | "right";
  dark?: boolean;
  /** Pinned to the bottom of the panel (e.g. sign-in or sign-out). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  const from = side === "right" ? "100%" : "-100%";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />
          <motion.aside
            className={cn(
              "absolute inset-y-0 flex w-[min(20rem,86vw)] flex-col shadow-2xl",
              side === "right" ? "right-0" : "left-0",
              dark ? "bg-zinc-950 text-white" : "bg-white text-zinc-900",
            )}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            <div
              className={cn(
                "flex h-16 shrink-0 items-center justify-between border-b px-4",
                dark ? "border-white/10" : "border-zinc-100",
              )}
            >
              <div className="min-w-0">{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  dark ? "hover:bg-white/10" : "hover:bg-zinc-100",
                )}
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3" data-lenis-prevent>
              {children}
            </div>
            {footer && (
              <div className={cn("shrink-0 border-t p-4", dark ? "border-white/10" : "border-zinc-100")}>{footer}</div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
