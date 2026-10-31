"use client";

// Every element of the page as a tree. Click to select, drag to reorder or nest, eye to hide.

import {
  Box,
  ChevronRight,
  Eye,
  EyeOff,
  Heading,
  Image as ImageIcon,
  Link2,
  List,
  type LucideIcon,
  Minus,
  MousePointerClick,
  PenLine,
  PlaySquare,
  Rows3,
  Shapes,
  Timer,
  Type,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { elementName, isTag, isTextElement, visibleChildren } from "@/lib/editor/dom";
import { SLOT_ATTR } from "@/lib/site-template";
import { cn } from "@/lib/utils";
import { dropPosition } from "./editor-canvas";
import { useEditor, type DropPosition } from "./editor-context";

function iconFor(el: Element): LucideIcon {
  if (el.hasAttribute("data-storyly-countdown")) return Timer;
  if (isTag(el, "IMG", "PICTURE")) return ImageIcon;
  if (isTag(el, "VIDEO", "IFRAME")) return PlaySquare;
  if (isTag(el, "H1", "H2", "H3", "H4", "H5", "H6")) return Heading;
  if (isTag(el, "A")) return Link2;
  if (isTag(el, "BUTTON")) return MousePointerClick;
  if (isTag(el, "UL", "OL")) return List;
  if (isTag(el, "HR")) return Minus;
  if (isTag(el, "SVG")) return Shapes;
  if (isTag(el, "SECTION", "HEADER", "FOOTER", "MAIN", "NAV", "BODY")) return Rows3;
  if (isTextElement(el)) return Type;
  return Box;
}

export function LayersPanel() {
  const { doc, selected, version, viewRoot } = useEditor();
  const [open, setOpen] = useState<Set<Element>>(() => new Set());
  const dragged = useRef<HTMLElement | null>(null);
  const [drop, setDrop] = useState<{ el: Element; position: DropPosition } | null>(null);

  // Open the tree down to the selected element.
  useEffect(() => {
    if (!selected) return;
    setOpen((prev) => {
      const next = new Set(prev);
      for (let p = selected.parentElement; p; p = p.parentElement) next.add(p);
      return next;
    });
  }, [selected, version]);

  useEffect(() => {
    if (doc) setOpen((prev) => new Set(prev).add(doc.body).add(viewRoot ?? doc.body));
  }, [doc, viewRoot]);

  if (!doc) return null;

  const toggle = (el: Element) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(el)) next.delete(el);
      else next.add(el);
      return next;
    });

  return (
    <div className="py-2" onDragEnd={() => setDrop(null)}>
      <Layer
        el={viewRoot ?? doc.body}
        depth={0}
        open={open}
        toggle={toggle}
        dragged={dragged}
        drop={drop}
        setDrop={setDrop}
      />
    </div>
  );
}

function Layer({
  el,
  depth,
  open,
  toggle,
  dragged,
  drop,
  setDrop,
}: {
  el: HTMLElement;
  depth: number;
  open: Set<Element>;
  toggle: (el: Element) => void;
  dragged: React.RefObject<HTMLElement | null>;
  drop: { el: Element; position: DropPosition } | null;
  setDrop: (drop: { el: Element; position: DropPosition } | null) => void;
}) {
  const { selected, select, move, toggleHidden, doc } = useEditor();
  const children = visibleChildren(el) as HTMLElement[];
  const isOpen = open.has(el);
  const isBody = el === doc?.body;
  const isSelected = isBody ? !selected || selected === el : selected === el;
  const hidden = el.hasAttribute("data-storyly-hidden");
  const isSlot = el.hasAttribute(SLOT_ATTR);
  const Icon = iconFor(el);
  const dropHere = drop?.el === el ? drop.position : null;
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isSelected && !isBody) rowRef.current?.scrollIntoView({ block: "nearest" });
  }, [isSelected, isBody]);

  const canDropOn = (target: Element) =>
    !!dragged.current && dragged.current !== target && !dragged.current.contains(target);

  return (
    <div>
      <div
        ref={rowRef}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={children.length ? isOpen : undefined}
        draggable={!isBody}
        onDragStart={(e) => {
          dragged.current = el;
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", "");
        }}
        onDragOver={(e) => {
          if (!canDropOn(el)) return;
          e.preventDefault();
          const position = dropPosition(el, e.clientY, e.currentTarget);
          if (dropHere !== position) setDrop({ el, position });
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (dragged.current && dropHere && canDropOn(el)) move(dragged.current, el, dropHere);
          dragged.current = null;
          setDrop(null);
        }}
        onClick={() => select(isBody ? null : el, { scroll: true })}
        onMouseEnter={() => !isBody && el.setAttribute("data-sl-hover", "")}
        onMouseLeave={() => el.removeAttribute("data-sl-hover")}
        className={cn(
          "group relative mx-2 flex h-8 cursor-pointer items-center gap-1.5 rounded-md pr-1 text-xs text-zinc-700 select-none hover:bg-zinc-100",
          isSelected && "bg-zinc-900 text-white hover:bg-zinc-800",
          hidden && !isSelected && "text-zinc-400",
          dropHere === "inside" && "ring-2 ring-zinc-900 ring-inset",
        )}
        style={{ paddingLeft: 6 + depth * 14 }}
      >
        {dropHere === "before" && <span className="absolute inset-x-1 -top-px h-0.5 rounded bg-zinc-900" />}
        {dropHere === "after" && <span className="absolute inset-x-1 -bottom-px h-0.5 rounded bg-zinc-900" />}
        <button
          type="button"
          tabIndex={-1}
          aria-label={isOpen ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            toggle(el);
          }}
          className={cn("flex size-4 shrink-0 items-center justify-center", !children.length && "invisible")}
        >
          <ChevronRight size={12} className={cn("transition-transform", isOpen && "rotate-90")} />
        </button>
        <Icon size={13} className="shrink-0 opacity-70" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{elementName(el)}</span>
        {isSlot && (
          <span title="Users can edit this">
            <PenLine size={12} className="shrink-0 opacity-80" aria-label="Editable by users" />
          </span>
        )}
        {!isBody && (
          <button
            type="button"
            title={hidden ? "Show" : "Hide"}
            aria-label={hidden ? "Show" : "Hide"}
            onClick={(e) => {
              e.stopPropagation();
              toggleHidden(el);
            }}
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded opacity-0 group-hover:opacity-100",
              hidden && "opacity-100",
            )}
          >
            {hidden ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>
      {isOpen &&
        children.map((child, i) => (
          <Layer
            key={i}
            el={child}
            depth={depth + 1}
            open={open}
            toggle={toggle}
            dragged={dragged}
            drop={drop}
            setDrop={setDrop}
          />
        ))}
    </div>
  );
}
