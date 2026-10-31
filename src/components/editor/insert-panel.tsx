"use client";

// Blocks to add to the page: click to add after the selection, or drag onto the canvas.

import {
  AtSign,
  ClipboardList,
  GitCommitVertical,
  HelpCircle,
  Music,
  Columns2,
  Columns3,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Images,
  LayoutPanelLeft,
  List,
  type LucideIcon,
  MapPin,
  MessageCircle,
  Minus,
  MousePointerClick,
  MoveVertical,
  PlaySquare,
  Quote,
  RectangleHorizontal,
  Rows3,
  CalendarDays,
  Timer,
  Type,
} from "lucide-react";
import { useState } from "react";
import { BLOCKS, type BlockGroup } from "@/lib/editor/blocks";
import { BLOCK_MIME } from "./editor-canvas";
import { PanelSection } from "./controls";
import { useEditor } from "./editor-context";

const ICONS: Record<string, LucideIcon> = {
  "rsvp-form": ClipboardList,
  music: Music,
  faq: HelpCircle,
  timeline: GitCommitVertical,
  social: AtSign,
  heading: Heading1,
  subheading: Heading2,
  text: Type,
  button: MousePointerClick,
  image: ImageIcon,
  quote: Quote,
  list: List,
  divider: Minus,
  spacer: MoveVertical,
  section: Rows3,
  "two-columns": Columns2,
  "three-columns": Columns3,
  card: RectangleHorizontal,
  "image-text": LayoutPanelLeft,
  countdown: Timer,
  event: CalendarDays,
  map: MapPin,
  video: PlaySquare,
  gallery: Images,
  rsvp: MessageCircle,
};

const GROUPS: BlockGroup[] = ["Basics", "Layout", "Smart"];

export function InsertPanel() {
  const { insertHtml } = useEditor();
  const [custom, setCustom] = useState("");

  return (
    <div>
      <p className="px-4 pt-3 pb-1 text-xs text-zinc-500">
        Click to add after the selected element, or drag onto the page.
      </p>
      {GROUPS.map((group) => (
        <PanelSection key={group} title={group}>
          <div className="grid grid-cols-3 gap-1.5">
            {BLOCKS.filter((b) => b.group === group).map((block) => {
              const Icon = ICONS[block.id] ?? Rows3;
              return (
                <button
                  key={block.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(BLOCK_MIME, block.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => insertHtml(block.html, undefined, { countdown: block.countdown })}
                  className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white p-1 text-center text-[11px] leading-tight text-zinc-700 transition hover:border-zinc-900 hover:text-zinc-900 active:scale-95"
                >
                  <Icon size={18} strokeWidth={1.6} aria-hidden />
                  {block.label}
                </button>
              );
            })}
          </div>
        </PanelSection>
      ))}
      <PanelSection title="Custom HTML" defaultOpen={false}>
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder="<div>…</div>"
          className="block w-full resize-y rounded-md border border-zinc-200 p-2 font-mono text-[11px] leading-4 focus:border-zinc-900 focus:outline-hidden"
        />
        <button
          type="button"
          disabled={!custom.trim()}
          onClick={() => {
            insertHtml(custom);
            setCustom("");
          }}
          className="h-8 w-full rounded-md bg-zinc-900 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
        >
          Add to page
        </button>
      </PanelSection>
    </div>
  );
}
