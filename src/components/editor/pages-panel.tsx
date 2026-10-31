"use client";

// Pages and popups of the template: add, open, rename, reorder, duplicate, delete.
// The first page is the one visitors see first ("Home").

import { ArrowDown, ArrowUp, Copy, File, Home, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  addPage,
  addPopup,
  duplicatePage,
  listPages,
  listPopups,
  makeHome,
  movePage,
  NAME_ATTR,
  removePart,
  type Part,
} from "@/lib/editor/pages";
import { cn } from "@/lib/utils";
import { IconButton, PanelSection } from "./controls";
import { useEditor } from "./editor-context";

export function PagesPanel() {
  const { doc, view, setView, commit } = useEditor();
  const [renaming, setRenaming] = useState<HTMLElement | null>(null);
  const [deleting, setDeleting] = useState<Part | null>(null);
  if (!doc) return null;

  const pages = listPages(doc);
  const popups = listPopups(doc);
  const currentPage = pages.find((p) => p.id === view.page) ?? pages[0];

  const run = (fn: () => void, next?: Partial<typeof view>) => {
    fn();
    commit();
    if (next) setView(next);
  };

  const row = (part: Part, kind: "page" | "popup", index: number) => {
    const active = kind === "page" ? part === currentPage && !view.popup : view.popup === part.id;
    const Icon = kind === "popup" ? MessageSquare : index === 0 ? Home : File;
    return (
      <li key={part.id}>
        <div
          className={cn(
            "group flex h-9 items-center gap-2 rounded-md pr-1 pl-2.5 text-xs",
            active ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100",
          )}
        >
          <Icon size={14} className="shrink-0 opacity-70" aria-hidden />
          {renaming === part.el ? (
            <input
              autoFocus
              defaultValue={part.name}
              aria-label="Name"
              onBlur={(e) => {
                const name = e.target.value.trim().slice(0, 40);
                setRenaming(null);
                if (name && name !== part.name) run(() => part.el.setAttribute(NAME_ATTR, name));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setRenaming(null);
              }}
              className="h-7 min-w-0 flex-1 rounded border border-zinc-300 bg-white px-1.5 text-xs text-zinc-900 focus:outline-hidden"
            />
          ) : (
            <button
              type="button"
              onClick={() => setView(kind === "page" ? { page: part.id } : { popup: part.id })}
              onDoubleClick={() => setRenaming(part.el)}
              title="Click to open, double-click to rename"
              className="min-w-0 flex-1 truncate text-left"
            >
              {part.name}
              {kind === "page" && index === 0 && <span className="ml-1.5 opacity-50">· home</span>}
            </button>
          )}
          <div className={cn("flex opacity-0 group-hover:opacity-100", active && "opacity-100")}>
            {kind === "page" && (
              <>
                <IconButton
                  label="Move up"
                  className="size-7"
                  disabled={index === 0}
                  onClick={() => run(() => movePage(part.el, -1))}
                >
                  <ArrowUp size={13} />
                </IconButton>
                <IconButton
                  label="Move down"
                  className="size-7"
                  disabled={index === pages.length - 1}
                  onClick={() => run(() => movePage(part.el, 1))}
                >
                  <ArrowDown size={13} />
                </IconButton>
                <IconButton
                  label="Duplicate"
                  className="size-7"
                  onClick={() => {
                    const copy = duplicatePage(doc, part.el);
                    run(() => {}, { page: copy.getAttribute("data-storyly-page") });
                  }}
                >
                  <Copy size={13} />
                </IconButton>
              </>
            )}
            <IconButton
              label="Delete"
              className="size-7 hover:text-red-600"
              disabled={kind === "page" && pages.length < 2}
              onClick={() => setDeleting(part)}
            >
              <Trash2 size={13} />
            </IconButton>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div>
      <PanelSection
        title={`Pages (${Math.max(pages.length, 1)})`}
        action={
          <IconButton
            label="Add page"
            className="size-7"
            onClick={() => {
              const page = addPage(doc, `Page ${Math.max(pages.length, 1) + 1}`);
              run(() => {}, { page: page.getAttribute("data-storyly-page") });
            }}
          >
            <Plus size={15} />
          </IconButton>
        }
      >
        {pages.length ? (
          <ul className="space-y-0.5">{pages.map((p, i) => row(p, "page", i))}</ul>
        ) : (
          <p className="text-xs leading-5 text-zinc-500">
            This template is a single page. Add a page to split it: your current content becomes{" "}
            <strong className="font-medium text-zinc-700">Home</strong>.
          </p>
        )}
        {pages.length > 1 && currentPage && currentPage !== pages[0] && (
          <button
            type="button"
            onClick={() => run(() => makeHome(doc, currentPage.el))}
            className="mt-2 text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
          >
            Make “{currentPage.name}” the home page
          </button>
        )}
        <p className="mt-3 text-[11px] leading-4 text-zinc-400">
          Link to a page from any button: select it, then Inspector → On click → Go to page.
        </p>
      </PanelSection>

      <PanelSection
        title={`Popups (${popups.length})`}
        action={
          <IconButton
            label="Add popup"
            className="size-7"
            onClick={() => {
              const popup = addPopup(doc, `Popup ${popups.length + 1}`);
              run(() => {}, { popup: popup.getAttribute("data-storyly-popup") });
            }}
          >
            <Plus size={15} />
          </IconButton>
        }
      >
        {popups.length ? (
          <ul className="space-y-0.5">{popups.map((p, i) => row(p, "popup", i))}</ul>
        ) : (
          <p className="text-xs leading-5 text-zinc-500">
            Popups open on top of the page, from a button or automatically after a few seconds.
          </p>
        )}
        {view.popup && (
          <button
            type="button"
            onClick={() => setView({ popup: null })}
            className="mt-2 h-8 w-full rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:border-zinc-900"
          >
            Close popup (back to the page)
          </button>
        )}
      </PanelSection>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete “${deleting?.name}”?`}
        message="Buttons that pointed here will stop doing anything. You can undo with Ctrl+Z."
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const part = deleting!;
          setDeleting(null);
          run(() => removePart(doc, part.el), { page: null, popup: null });
        }}
      />
    </div>
  );
}
