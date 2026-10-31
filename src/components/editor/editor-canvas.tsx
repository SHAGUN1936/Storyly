"use client";

// The page being edited, shown at the chosen device width and zoom.
//
// The iframe has sandbox="allow-same-origin" without "allow-scripts": the template's own scripts never
// run here, and the editor can read and change the page directly. Clicks pick elements, double-click
// types into text, and blocks from the Insert panel can be dropped onto the page.

import { ArrowDown, ArrowUp, Copy, CornerLeftUp, EyeOff, Trash2 } from "lucide-react";
import { ContextMenu } from "./context-menu";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  clearEditorAttrs,
  editableHtml,
  isElement,
  isPickable,
  isTag,
  isTextElement,
  kindName,
} from "@/lib/editor/dom";
import { cn } from "@/lib/utils";
import { DEVICES, useEditor, type DropPosition } from "./editor-context";

export const BLOCK_MIME = "application/x-storyly-block";

const GUTTER = 32;

type Handlers = {
  onReady: (doc: Document) => void;
  onKey: (e: KeyboardEvent) => void;
  onTextEdited: () => void;
  onDropBlock: (blockId: string, target: HTMLElement, position: DropPosition) => void;
};

/** The nearest element that can be picked (not a <br>, <script>…). */
function pickable(node: EventTarget | null, doc: Document) {
  let el = isElement(node) ? node : null;
  while (el && !isPickable(el)) el = el.parentElement;
  return el && el !== doc.documentElement ? el : doc.body;
}

const canHoldChildren = (el: Element) =>
  !isTextElement(el) && !isTag(el, "IMG", "HR", "INPUT", "TEXTAREA", "SELECT", "VIDEO", "IFRAME", "SVG");

/** Where a drop lands: the top/bottom edge of `el` = before/after, the middle of a container = inside. */
export function dropPosition(el: Element, clientY: number, box: Element = el): DropPosition {
  const rect = box.getBoundingClientRect();
  const y = (clientY - rect.top) / Math.max(rect.height, 1);
  if (el.tagName === "BODY") return "inside";
  if (canHoldChildren(el) && y > 0.25 && y < 0.75) return "inside";
  return y < 0.5 ? "before" : "after";
}

export function EditorCanvas({
  html,
  zoom,
  hidden,
  ...handlers
}: Handlers & { html: string; zoom: number | "fit"; hidden: boolean }) {
  const { doc, selected, select, device, duplicate, remove, shift, toggleHidden } = useEditor();
  // Built in the browser (it needs DOMParser), so the iframe only appears after the first render.
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  useEffect(() => setSrcDoc(editableHtml(html)), [html]);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [, setTick] = useState(0);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // The menu is placed from iframe coordinates, so it needs the current scale and position
  const geometry = useRef({ scale: 1, left: 0 });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const selectRef = useRef(select);
  selectRef.current = select;

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const deviceWidth = DEVICES[device].width;
  const fitScale = size.width ? Math.min(1, (size.width - GUTTER * 2) / deviceWidth) : 1;
  const scale = zoom === "fit" ? fitScale : zoom;
  const frameHeight = Math.max(200, (size.height - GUTTER) / scale);

  // Wire up the page once it has loaded.
  function onLoad() {
    const d = frameRef.current?.contentDocument;
    if (!d || d.documentElement.hasAttribute("data-sl-wired")) return;
    d.documentElement.setAttribute("data-sl-wired", "");
    const h = () => handlersRef.current;
    const editing = () => d.querySelector<HTMLElement>("[data-sl-editing]");

    const stopEditing = () => {
      if (!editing()) return;
      clearEditorAttrs(d, "data-sl-editing");
      h().onTextEdited();
    };

    const startEditing = (el: HTMLElement, x: number, y: number) => {
      el.setAttribute("contenteditable", "true");
      el.setAttribute("data-sl-editing", "");
      el.focus();
      const range = d.caretRangeFromPoint?.(x, y);
      if (range) {
        const sel = d.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };

    d.addEventListener("mouseover", (e) => {
      const el = pickable(e.target, d);
      clearEditorAttrs(d, "data-sl-hover");
      if (el !== d.body) el.setAttribute("data-sl-hover", "");
    });
    d.addEventListener("mouseleave", () => clearEditorAttrs(d, "data-sl-hover"));

    d.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        const current = editing();
        if (current?.contains(e.target as Node)) return;
        stopEditing();
        selectRef.current(pickable(e.target, d));
      },
      true,
    );

    d.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      const el = pickable(e.target, d);
      selectRef.current(el);
      const { scale: s, left } = geometry.current;
      setMenu({ x: left + e.clientX * s, y: GUTTER / 2 + e.clientY * s });
    });
    d.addEventListener("mousedown", () => setMenu(null));
    d.addEventListener("scroll", () => setMenu(null), true);

    d.addEventListener("dblclick", (e) => {
      const el = pickable(e.target, d);
      if (el === d.body || !isTextElement(el)) return;
      e.preventDefault();
      selectRef.current(el);
      startEditing(el, e.clientX, e.clientY);
    });

    d.addEventListener("focusout", (e) => {
      if ((e.target as Element)?.hasAttribute?.("data-sl-editing")) stopEditing();
    });

    d.addEventListener("paste", (e) => {
      if (!editing()) return;
      e.preventDefault();
      d.execCommand("insertText", false, e.clipboardData?.getData("text/plain") ?? "");
    });

    d.addEventListener("keydown", (e) => {
      if (editing()) {
        if (
          e.key === "Escape" ||
          (e.key === "Enter" && !e.shiftKey && /^H[1-6]$|^A$|^BUTTON$/.test(editing()!.tagName))
        ) {
          e.preventDefault();
          stopEditing();
          return;
        }
        if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s")) return;
      }
      h().onKey(e);
    });

    d.addEventListener("submit", (e) => e.preventDefault(), true);
    d.addEventListener("scroll", () => setTick((t) => t + 1), true);

    // Blocks dragged in from the Insert panel.
    d.addEventListener("dragover", (e) => {
      if (!e.dataTransfer?.types.includes(BLOCK_MIME)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      const el = pickable(e.target, d);
      clearEditorAttrs(d, "data-sl-drop");
      el.setAttribute("data-sl-drop", dropPosition(el, e.clientY));
    });
    d.addEventListener("dragleave", (e) => {
      if (!e.relatedTarget) clearEditorAttrs(d, "data-sl-drop");
    });
    d.addEventListener("drop", (e) => {
      const id = e.dataTransfer?.getData(BLOCK_MIME);
      clearEditorAttrs(d, "data-sl-drop");
      if (!id) return;
      e.preventDefault();
      const el = pickable(e.target, d);
      h().onDropBlock(id, el, dropPosition(el, e.clientY));
    });

    h().onReady(d);
  }

  // Keep the floating toolbar next to the selection.
  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const frameLeft = Math.max(GUTTER, (size.width - deviceWidth * scale) / 2);
  geometry.current = { scale, left: frameLeft };
  let toolbar: { top: number; left: number; width: number; height: number } | null = null;
  if (doc && selected && selected !== doc.body && selected.isConnected) {
    const r = selected.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < frameHeight && r.width > 0;
    if (visible)
      toolbar = {
        top: GUTTER / 2 + r.top * scale,
        left: frameLeft + r.left * scale,
        width: r.width * scale,
        height: r.height * scale,
      };
  }

  return (
    <div ref={boxRef} className={cn("relative min-w-0 flex-1 overflow-auto bg-zinc-100", hidden && "hidden")}>
      <div
        className="absolute shadow-[0_1px_3px_rgba(0,0,0,.08),0_12px_40px_-12px_rgba(0,0,0,.18)] transition-[width] duration-200"
        style={{ top: GUTTER / 2, left: frameLeft, width: deviceWidth * scale, height: frameHeight * scale }}
      >
        {srcDoc !== null && (
          <iframe
            ref={frameRef}
            srcDoc={srcDoc}
            title="Page being edited"
            sandbox="allow-same-origin"
            onLoad={onLoad}
            className="origin-top-left border-0 bg-white"
            style={{ width: deviceWidth, height: frameHeight, transform: `scale(${scale})` }}
          />
        )}
        {!doc && <div className="absolute inset-0 animate-pulse bg-white" />}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
      {toolbar && selected && (
        <SelectionToolbar
          rect={toolbar}
          name={kindName(selected)}
          onParent={() => selected.parentElement && select(selected.parentElement)}
          onUp={() => shift(selected, -1)}
          onDown={() => shift(selected, 1)}
          onDuplicate={() => duplicate(selected)}
          onHide={() => toggleHidden(selected)}
          onDelete={() => remove(selected)}
        />
      )}
    </div>
  );
}

function SelectionToolbar({
  rect,
  name,
  ...actions
}: {
  rect: { top: number; left: number; width: number; height: number };
  name: string;
  onParent: () => void;
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onHide: () => void;
  onDelete: () => void;
}) {
  const above = rect.top > 44;
  const buttons = [
    { label: "Select parent", icon: CornerLeftUp, run: actions.onParent },
    { label: "Move up (Alt+↑)", icon: ArrowUp, run: actions.onUp },
    { label: "Move down (Alt+↓)", icon: ArrowDown, run: actions.onDown },
    { label: "Duplicate (Ctrl+D)", icon: Copy, run: actions.onDuplicate },
    { label: "Hide", icon: EyeOff, run: actions.onHide },
    { label: "Delete (Del)", icon: Trash2, run: actions.onDelete },
  ];
  return (
    <div
      className="pointer-events-none absolute z-10 flex"
      style={{ top: above ? rect.top - 38 : rect.top + 6, left: Math.max(8, rect.left) }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg bg-zinc-900 p-1 text-white shadow-lg">
        <span className="px-2 text-[11px] font-medium text-zinc-300">{name}</span>
        {buttons.map(({ label, icon: Icon, run }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={run}
            className="flex size-6 items-center justify-center rounded hover:bg-white/15"
          >
            <Icon size={13} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
