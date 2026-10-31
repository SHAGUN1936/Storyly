"use client";

// What every editor panel can read and do. Provided by <TemplateEditor>.
// The page's DOM (inside the canvas iframe) is the source of truth: panels read it directly and
// call commit() after changing it, which records an undo step and re-renders the panels.

import { createContext, useContext } from "react";

export type Device = "desktop" | "tablet" | "mobile";

export const DEVICES: Record<Device, { label: string; width: number }> = {
  desktop: { label: "Desktop", width: 1280 },
  tablet: { label: "Tablet", width: 820 },
  mobile: { label: "Phone", width: 390 },
};

export type DropPosition = "before" | "after" | "inside";

/** Which page the canvas shows, and which popup is open on top of it (ids; null = first page / none). */
export type View = { page: string | null; popup: string | null };

export type EditorApi = {
  doc: Document | null;
  /** The picked element (null = the page itself). */
  selected: HTMLElement | null;
  select: (el: HTMLElement | null, opts?: { scroll?: boolean }) => void;
  view: View;
  /** Switch page (closes any popup) or open/close a popup. */
  setView: (view: Partial<View>) => void;
  /** What the canvas shows: the open popup, the current page, or the whole body. */
  viewRoot: HTMLElement | null;
  /** Changes on every edit, so panels re-read the page. */
  version: number;
  device: Device;
  /** Style changes apply to phones only (mobile view). */
  mobile: boolean;
  /** Records an undo step. Calls with the same key within a second merge into one step (e.g. typing). */
  commit: (key?: string) => void;
  /** Sets one style property on an element and records it. */
  setStyle: (el: HTMLElement, prop: string, value: string) => void;
  insertHtml: (
    html: string,
    target?: { el: HTMLElement; position: DropPosition },
    opts?: { countdown?: boolean },
  ) => void;
  move: (el: HTMLElement, target: HTMLElement, position: DropPosition) => void;
  duplicate: (el: HTMLElement) => void;
  remove: (el: HTMLElement) => void;
  shift: (el: HTMLElement, step: -1 | 1) => void;
  toggleHidden: (el: HTMLElement) => void;
  /** Copy an element / paste the copy after the selection. */
  copy: (el: HTMLElement) => void;
  paste: () => void;
  /** Copy an element's look (its own styles) / put it on another element. */
  copyStyle: (el: HTMLElement) => void;
  pasteStyle: (el: HTMLElement) => void;
  canPaste: boolean;
  canPasteStyle: boolean;
  uploadImage: (file: File) => Promise<string | null>;
};

export const EditorContext = createContext<EditorApi | null>(null);

export function useEditor() {
  const api = useContext(EditorContext);
  if (!api) throw new Error("useEditor() must be used inside <TemplateEditor>");
  return api;
}
