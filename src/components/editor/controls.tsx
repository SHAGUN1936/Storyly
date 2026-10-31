"use client";

// Small, dense inputs for the editor's side panels.

import { ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toHex } from "@/lib/editor/dom";
import { cn } from "@/lib/utils";

const input =
  "h-8 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 transition " +
  "placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-900 focus:outline-hidden";

/** A collapsible group in a panel. */
export function PanelSection({
  title,
  defaultOpen = true,
  action,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-zinc-100">
      <div className="flex items-center justify-between gap-2 px-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex flex-1 items-center gap-1.5 py-3 text-left text-xs font-semibold tracking-wide text-zinc-500 uppercase hover:text-zinc-900"
        >
          <ChevronDown size={14} className={cn("transition-transform", !open && "-rotate-90")} aria-hidden />
          {title}
        </button>
        {action}
      </div>
      {open && <div className="space-y-2.5 px-4 pb-4">{children}</div>}
    </section>
  );
}

/** Label on the left, control on the right. compact: narrow label, for two rows side by side. */
export function Row({ label, compact, children }: { label: string; compact?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid items-center gap-2", compact ? "grid-cols-[44px_1fr]" : "grid-cols-[84px_1fr]")}>
      <span className="truncate text-xs text-zinc-500">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Text input that applies its value on Enter or when it loses focus (not on every key).
 * ArrowUp/ArrowDown change the number in it (Shift = by 10), e.g. "16px" -> "17px".
 */
export function TextInput({
  value,
  onCommit,
  placeholder,
  className,
  type = "text",
  title,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "url" | "datetime-local";
  title?: string;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  const commit = (next: string) => {
    if (next.trim() !== value) onCommit(next.trim());
  };

  return (
    <input
      type={type}
      value={draft}
      title={title}
      placeholder={placeholder}
      spellCheck={false}
      className={cn(input, className)}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        commit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(value);
          (e.target as HTMLInputElement).blur();
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          const m = draft.match(/^(-?\d*\.?\d+)([a-z%]*)$/i);
          if (!m) return;
          e.preventDefault();
          const step = (e.shiftKey ? 10 : 1) * (e.key === "ArrowUp" ? 1 : -1);
          const decimals = m[1].includes(".") ? m[1].split(".")[1].length : 0;
          const next = `${(Number(m[1]) + step).toFixed(decimals)}${m[2] || "px"}`;
          setDraft(next);
          onCommit(next);
        }
      }}
    />
  );
}

/** Multi-line text, applied when it loses focus. */
export function TextArea({
  value,
  onCommit,
  rows = 3,
}: {
  value: string;
  onCommit: (value: string) => void;
  rows?: number;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <textarea
      rows={rows}
      value={draft}
      className={cn(input, "h-auto resize-y py-1.5 leading-5")}
      onFocus={() => (focused.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        focused.current = false;
        if (draft !== value) onCommit(draft);
      }}
    />
  );
}

export function SelectInput({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const known = options.some((o) => o.value === value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(input, "cursor-pointer pr-1")}>
      {!known && <option value={value}>{value || "—"}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Row of buttons where one is active (alignment, direction…). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | "";
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.label}
          aria-label={o.label}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex h-7 flex-1 items-center justify-center rounded text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-900",
            value === o.value && "bg-white text-zinc-900 shadow-xs",
          )}
        >
          {o.icon ?? o.label}
        </button>
      ))}
    </div>
  );
}

/** Colour picker + hex field. An empty value means "not set". */
export function ColorInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const hex = toHex(value);
  return (
    <div className="flex items-center gap-1.5">
      <label
        className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-zinc-200"
        style={{
          background: hex || "repeating-conic-gradient(#e4e4e7 0 25%, #fff 0 50%) 0 0 / 8px 8px",
        }}
      >
        <input
          type="color"
          value={hex || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Pick a colour"
        />
      </label>
      <TextInput value={hex} onCommit={onChange} placeholder="none" className="font-mono" />
      {hex && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Clear"
          aria-label="Clear colour"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Slider with its number. */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 flex-1 cursor-pointer accent-zinc-900"
      />
      <span className="w-10 text-right text-xs text-zinc-600 tabular-nums">{format(value)}</span>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-xs text-zinc-700">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-zinc-900" : "bg-zinc-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform",
            checked && "translate-x-4",
          )}
        />
      </button>
    </label>
  );
}

/** Small square icon button. */
export function IconButton({
  label,
  onClick,
  disabled,
  active,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-35",
        active && "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}
