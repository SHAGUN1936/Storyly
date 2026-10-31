"use client";

// Every keyboard shortcut of the editor. Opens with "?" or the keyboard button in the top bar.

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const GROUPS = [
  {
    title: "General",
    items: [
      ["Save", "Ctrl S"],
      ["Undo", "Ctrl Z"],
      ["Redo", "Ctrl Shift Z"],
      ["This list", "?"],
    ],
  },
  {
    title: "Selected element",
    items: [
      ["Edit text", "Double-click"],
      ["Finish editing text", "Esc"],
      ["Select parent / close popup", "Esc"],
      ["Copy / paste", "Ctrl C / Ctrl V"],
      ["Duplicate", "Ctrl D"],
      ["Copy / paste style", "Ctrl Alt C / V"],
      ["Move up / down", "Alt ↑ / Alt ↓"],
      ["Delete", "Del"],
      ["More actions", "Right-click"],
    ],
  },
  {
    title: "Inputs in the side panels",
    items: [
      ["Change a number by 1", "↑ / ↓"],
      ["Change a number by 10", "Shift ↑ / ↓"],
      ["Apply", "Enter"],
    ],
  },
];

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-zinc-950/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
          >
            <X size={16} />
          </button>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title} className="mt-5">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">{group.title}</p>
            <dl className="mt-2 divide-y divide-zinc-100">
              {group.items.map(([label, keys]) => (
                <div key={label} className="flex items-center justify-between py-2 text-sm">
                  <dt className="text-zinc-700">{label}</dt>
                  <dd className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs text-zinc-700">{keys}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
