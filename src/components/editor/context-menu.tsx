"use client";

// Right-click menu on the canvas, for the element under the mouse (it is selected first).

import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Copy,
  CopyPlus,
  CornerLeftUp,
  Eye,
  EyeOff,
  Paintbrush,
  PaintBucket,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useEditor } from "./editor-context";

type Item = { label: string; icon: LucideIcon; keys?: string; run: () => void; disabled?: boolean; danger?: boolean };

export function ContextMenu({ x, y, onClose }: { x: number; y: number; onClose: () => void }) {
  const editor = useEditor();
  const { selected: el } = editor;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && onClose();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!el) return null;
  const hidden = el.hasAttribute("data-storyly-hidden");

  const groups: Item[][] = [
    [
      { label: "Copy", icon: Copy, keys: "Ctrl C", run: () => editor.copy(el) },
      { label: "Paste after", icon: ClipboardPaste, keys: "Ctrl V", run: editor.paste, disabled: !editor.canPaste },
      { label: "Duplicate", icon: CopyPlus, keys: "Ctrl D", run: () => editor.duplicate(el) },
    ],
    [
      { label: "Copy style", icon: Paintbrush, keys: "Ctrl Alt C", run: () => editor.copyStyle(el) },
      {
        label: "Paste style",
        icon: PaintBucket,
        keys: "Ctrl Alt V",
        run: () => editor.pasteStyle(el),
        disabled: !editor.canPasteStyle,
      },
    ],
    [
      {
        label: "Select parent",
        icon: CornerLeftUp,
        keys: "Esc",
        run: () => el.parentElement && editor.select(el.parentElement),
      },
      { label: "Move up", icon: ArrowUp, keys: "Alt ↑", run: () => editor.shift(el, -1) },
      { label: "Move down", icon: ArrowDown, keys: "Alt ↓", run: () => editor.shift(el, 1) },
      { label: hidden ? "Show" : "Hide", icon: hidden ? Eye : EyeOff, run: () => editor.toggleHidden(el) },
    ],
    [{ label: "Delete", icon: Trash2, keys: "Del", run: () => editor.remove(el), danger: true }],
  ];

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute z-20 w-56 animate-fade-in rounded-xl border border-zinc-200 bg-white p-1 shadow-xl shadow-zinc-900/15"
      style={{ left: x, top: y }}
    >
      {groups.map((items, i) => (
        <div key={i} className={cn(i > 0 && "mt-1 border-t border-zinc-100 pt-1")}>
          {items.map(({ label, icon: Icon, keys, run, disabled, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                run();
                onClose();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs text-zinc-700 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40",
                danger && "text-red-600 hover:bg-red-50",
              )}
            >
              <Icon size={14} aria-hidden />
              <span className="flex-1">{label}</span>
              {keys && <span className="text-[10px] text-zinc-400">{keys}</span>}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
