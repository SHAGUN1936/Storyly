"use client";

// Full-screen template editor.
//
//   ┌ top bar: back · name · devices · zoom · undo/redo · preview · publish · save ┐
//   │ rail │ Pages / Layers / Insert / Settings │   canvas (one page)   │ Inspector │
//
// The page lives in the canvas iframe and is edited in place; every change is recorded as an HTML
// snapshot for undo/redo. Saving sends the whole page to the server, which re-reads its editable parts.

import {
  ArrowLeft,
  Eye,
  Files,
  Keyboard,
  Layers,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Redo2,
  Settings2,
  Smartphone,
  Tablet,
  Undo2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveTemplateDesign, setPublished } from "@/app/(app)/admin/_actions/templates";
import { LogoMark } from "@/components/brand/logo";
import { SiteFrame } from "@/components/site-frame";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BLOCKS } from "@/lib/editor/blocks";
import {
  clearEditorAttrs,
  cloneForInsert,
  elementAt,
  isElement,
  isPickable,
  pathOf,
  prepareEditorDoc,
  restore,
  serialize,
  setStyle as writeStyle,
} from "@/lib/editor/dom";
import { applyView, isPart, listPages, POPUP_ATTR } from "@/lib/editor/pages";
import { ensureCountdownScript, ensureRuntimeStyle, ensureSiteScript } from "@/lib/editor/runtime";
import { cn } from "@/lib/utils";
import { IconButton } from "./controls";
import { EditorCanvas } from "./editor-canvas";
import { DEVICES, EditorContext, type Device, type DropPosition, type EditorApi, type View } from "./editor-context";
import { InsertPanel } from "./insert-panel";
import { Inspector } from "./inspector";
import { LayersPanel } from "./layers-panel";
import { PagesPanel } from "./pages-panel";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { SettingsPanel, type TemplateDetails } from "./settings-panel";

export type EditorTemplate = TemplateDetails & { published: boolean; document: string };

const PANELS = [
  { id: "pages", label: "Pages", icon: Files },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "insert", label: "Insert", icon: Plus },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;
type PanelId = (typeof PANELS)[number]["id"];

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const ZOOMS = [0.5, 0.75, 1, 1.25];
const HISTORY_LIMIT = 100;

export function TemplateEditor({ template }: { template: EditorTemplate }) {
  const router = useRouter();
  const [doc, setDoc] = useState<Document | null>(null);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [version, setVersion] = useState(0);
  const [device, setDevice] = useState<Device>("desktop");
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [panel, setPanel] = useState<PanelId | null>("layers");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [published, setPublishedState] = useState(template.published);
  const [leaving, setLeaving] = useState(false);
  const [view, setViewState] = useState<View>({ page: null, popup: null });
  const [viewRoot, setViewRoot] = useState<HTMLElement | null>(null);
  const [saving, startSaving] = useTransition();
  const [publishing, startPublishing] = useTransition();

  const history = useRef({ stack: [] as string[], index: -1, key: "", at: 0 });
  const savedHtml = useRef("");
  const clipboard = useRef<string | null>(null);
  const styleClipboard = useRef<string | null>(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const bump = () => setVersion((v) => v + 1);

  const select = useCallback<EditorApi["select"]>(
    (el, opts) => {
      if (!doc) return;
      clearEditorAttrs(doc, "data-sl-selected");
      const target = el && el !== doc.body ? el : null;
      target?.setAttribute("data-sl-selected", "");
      if (target && opts?.scroll) target.scrollIntoView({ block: "center", behavior: "smooth" });
      setSelected(target);
    },
    [doc],
  );

  const commit = useCallback<EditorApi["commit"]>(
    (key) => {
      if (!doc) return;
      ensureSiteScript(doc);
      const html = serialize(doc);
      const h = history.current;
      const now = Date.now();
      if (html !== h.stack[h.index]) {
        if (key && key === h.key && now - h.at < 1000) h.stack[h.index] = html;
        else {
          h.stack = [...h.stack.slice(0, h.index + 1), html].slice(-HISTORY_LIMIT);
          h.index = h.stack.length - 1;
        }
      }
      h.key = key ?? "";
      h.at = now;
      setDirty(html !== savedHtml.current);
      bump();
    },
    [doc],
  );

  const travel = (step: -1 | 1) => {
    const h = history.current;
    const index = h.index + step;
    if (!doc || index < 0 || index >= h.stack.length) return;
    h.index = index;
    h.key = "";
    const path = selected ? pathOf(selected) : null;
    restore(doc, h.stack[index]);
    const el = path && elementAt(doc, path);
    select(el && isPickable(el) ? el : null);
    setDirty(h.stack[index] !== savedHtml.current);
    bump();
  };

  useEffect(() => {
    if (doc) setViewRoot(applyView(doc, view));
  }, [doc, view, version]);

  const setView: EditorApi["setView"] = (next) => {
    // A new page closes any popup; nothing stays selected across pages
    setViewState((v) => ("page" in next ? { page: next.page ?? null, popup: null } : { ...v, ...next }));
    select(null);
  };

  /** Where new blocks go when nothing is selected: the open popup's box, the current page, or the body. */
  const container = () => {
    if (!doc || !viewRoot) return doc?.body ?? null;
    return viewRoot.querySelector<HTMLElement>("[data-storyly-popup-box]") ?? viewRoot;
  };

  function onReady(d: Document) {
    prepareEditorDoc(d);
    ensureRuntimeStyle(d);
    const html = serialize(d);
    history.current = { stack: [html], index: 0, key: "", at: 0 };
    savedHtml.current = html;
    setDoc(d);
  }

  // ---------- Element actions ----------

  const place = (node: HTMLElement, target: HTMLElement, position: DropPosition) => {
    if (position === "inside") target.append(node);
    else if (position === "before") target.before(node);
    else target.after(node);
  };

  const insertHtml: EditorApi["insertHtml"] = (html, target, opts) => {
    if (!doc) return;
    const tpl = doc.createElement("template");
    tpl.innerHTML = html.trim();
    const nodes = Array.from(tpl.content.children) as HTMLElement[];
    if (!nodes.length) return toast.error("Nothing to add");
    let node = nodes[0];
    if (nodes.length > 1) {
      node = doc.createElement("div");
      node.append(...nodes);
    }
    if (target) place(node, target.el, target.position);
    else if (selected && !isPart(selected)) selected.after(node);
    else (selected ?? container() ?? doc.body).append(node);
    if (opts?.countdown) ensureCountdownScript(doc);
    select(node, { scroll: true });
    commit();
  };

  const api: EditorApi = {
    doc,
    selected,
    select,
    view,
    setView,
    viewRoot,
    version,
    device,
    mobile: device === "mobile",
    commit,
    setStyle: (el, prop, value) => {
      writeStyle(el, prop, value, device === "mobile");
      commit(`style:${prop}`);
    },
    insertHtml,
    move: (el, target, position) => {
      place(el, target, position);
      select(el);
      commit();
    },
    duplicate: (el) => {
      if (isPart(el)) return void toast.info("Duplicate pages and popups from the Pages panel");
      const copy = cloneForInsert(el);
      el.after(copy);
      select(copy);
      commit();
    },
    remove: (el) => {
      if (!doc || el === doc.body) return;
      if (isPart(el)) return void toast.info("Delete pages and popups from the Pages panel");
      const next = [el.nextElementSibling, el.previousElementSibling].find(
        (n): n is HTMLElement => isElement(n) && isPickable(n),
      );
      el.remove();
      select(next ?? (el.parentElement !== doc.body ? el.parentElement : null));
      commit();
    },
    shift: (el, step) => {
      if (isPart(el)) return void toast.info("Reorder pages from the Pages panel");
      let sibling = step < 0 ? el.previousElementSibling : el.nextElementSibling;
      while (sibling && !isPickable(sibling))
        sibling = step < 0 ? sibling.previousElementSibling : sibling.nextElementSibling;
      if (!sibling) return;
      if (step < 0) sibling.before(el);
      else sibling.after(el);
      select(el);
      commit();
    },
    toggleHidden: (el) => {
      el.toggleAttribute("data-storyly-hidden");
      commit();
    },
    copy: (el) => {
      if (isPart(el)) return void toast.info("Duplicate pages and popups from the Pages panel");
      clipboard.current = el.outerHTML;
      toast.success("Copied");
    },
    paste: () => {
      if (!doc || !clipboard.current) return;
      const tpl = doc.createElement("template");
      tpl.innerHTML = clipboard.current;
      const el = tpl.content.firstElementChild;
      if (el) insertHtml(cloneForInsert(el).outerHTML);
    },
    copyStyle: (el) => {
      styleClipboard.current = el.getAttribute("style") ?? "";
      toast.success("Style copied");
    },
    pasteStyle: (el) => {
      if (styleClipboard.current === null) return;
      if (styleClipboard.current) el.setAttribute("style", styleClipboard.current);
      else el.removeAttribute("style");
      commit();
    },
    canPaste: !!clipboard.current,
    canPasteStyle: styleClipboard.current !== null,
    uploadImage: async (file) => {
      const body = new FormData();
      body.set("media", file);
      try {
        const res = await fetch("/api/uploads", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message ?? "Upload failed");
        return data.url as string;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
        return null;
      }
    },
  };

  // ---------- Save / publish ----------

  const save = () =>
    new Promise<boolean>((resolve) => {
      if (!doc) return resolve(false);
      const html = serialize(doc);
      startSaving(async () => {
        const result = await saveTemplateDesign(template.id, html);
        if (result?.ok) {
          savedHtml.current = html;
          setDirty(serialize(doc) !== html);
          toast.success(result.message);
        } else toast.error(result?.message ?? "Could not save");
        resolve(!!result?.ok);
      });
    });

  const togglePublished = () =>
    startPublishing(async () => {
      if (dirty && !(await save())) return;
      await setPublished(template.id, !published);
      setPublishedState(!published);
      toast.success(published ? "Template hidden from users" : "Template published");
    });

  const openPreview = () => doc && setPreview(serialize(doc));

  // ---------- Keyboard ----------

  const onKey = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && key === "s") {
      e.preventDefault();
      if (!saving) void save();
      return;
    }
    const target = e.target as HTMLElement | null;
    if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
    if (preview) {
      if (key === "escape") setPreview(null);
      return;
    }

    const run = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    if (key === "?") return run(() => setShortcutsOpen(true));
    if (mod && key === "z") return run(() => travel(e.shiftKey ? 1 : -1));
    if (mod && key === "y") return run(() => travel(1));
    if (key === "escape" && view.popup && !selected) return run(() => setView({ popup: null }));
    if (key === "escape")
      return run(() =>
        select(selected?.parentElement && selected.parentElement !== doc?.body ? selected.parentElement : null),
      );
    if (!selected) return;
    if (key === "delete" || key === "backspace") return run(() => api.remove(selected));
    if (mod && key === "d") return run(() => api.duplicate(selected));
    if (mod && e.altKey && key === "c") return run(() => api.copyStyle(selected));
    if (mod && e.altKey && key === "v") return run(() => api.pasteStyle(selected));
    if (mod && key === "c") return run(() => api.copy(selected));
    if (mod && key === "v" && clipboard.current) return run(() => api.paste());
    if (e.altKey && key === "arrowup") return run(() => api.shift(selected, -1));
    if (e.altKey && key === "arrowdown") return run(() => api.shift(selected, 1));
  };

  const onKeyRef = useRef(onKey);
  onKeyRef.current = onKey;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKeyRef.current(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const canUndo = history.current.index > 0;
  const canRedo = history.current.index < history.current.stack.length - 1;
  const DeviceIcon = DEVICE_ICONS[device];

  return (
    <EditorContext.Provider value={api}>
      <div className="flex h-dvh flex-col overflow-hidden bg-zinc-100 text-zinc-900">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-3">
          <IconButton
            label="Back to templates"
            onClick={() => (dirty ? setLeaving(true) : router.push("/admin/templates"))}
          >
            <ArrowLeft size={16} />
          </IconButton>
          <LogoMark className="size-7" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{template.name}</p>
            <p className="text-[11px] text-zinc-500">
              {saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}
              {" · "}
              {published ? "Published" : "Draft"}
            </p>
          </div>

          {/* Page switcher (when the template has pages) */}
          {doc && listPages(doc).length > 1 && (
            <select
              value={view.popup ? `popup:${view.popup}` : (view.page ?? listPages(doc)[0].id)}
              onChange={(e) => {
                const value = e.target.value;
                setView(value.startsWith("popup:") ? { popup: value.slice(6) } : { page: value });
              }}
              aria-label="Page shown in the canvas"
              className="ml-2 hidden h-8 max-w-44 cursor-pointer rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 focus:outline-hidden lg:block"
            >
              <optgroup label="Pages">
                {listPages(doc).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              {doc.querySelector(`[${POPUP_ATTR}]`) && (
                <optgroup label="Popups">
                  {Array.from(doc.querySelectorAll<HTMLElement>(`[${POPUP_ATTR}]`)).map((el) => (
                    <option key={el.getAttribute(POPUP_ATTR)!} value={`popup:${el.getAttribute(POPUP_ATTR)}`}>
                      {el.getAttribute("data-storyly-name") || el.getAttribute(POPUP_ATTR)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}

          <div className="mx-auto flex items-center gap-1 rounded-lg bg-zinc-100 p-1">
            {(Object.keys(DEVICES) as Device[]).map((d) => {
              const Icon = DEVICE_ICONS[d];
              return (
                <button
                  key={d}
                  type="button"
                  title={`${DEVICES[d].label} (${DEVICES[d].width}px)`}
                  aria-label={DEVICES[d].label}
                  aria-pressed={device === d}
                  onClick={() => setDevice(d)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-zinc-500 hover:text-zinc-900",
                    device === d && "bg-white text-zinc-900 shadow-xs",
                  )}
                >
                  <Icon size={14} aria-hidden />
                  <span className="hidden xl:inline">{DEVICES[d].label}</span>
                </button>
              );
            })}
            <select
              value={String(zoom)}
              onChange={(e) => setZoom(e.target.value === "fit" ? "fit" : Number(e.target.value))}
              aria-label="Zoom"
              className="h-7 cursor-pointer rounded-md bg-transparent px-1.5 text-xs font-medium text-zinc-600 hover:bg-white focus:outline-hidden"
            >
              <option value="fit">Fit</option>
              {ZOOMS.map((z) => (
                <option key={z} value={z}>
                  {z * 100}%
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <IconButton label="Undo (Ctrl+Z)" onClick={() => travel(-1)} disabled={!canUndo}>
              <Undo2 size={16} />
            </IconButton>
            <IconButton label="Redo (Ctrl+Shift+Z)" onClick={() => travel(1)} disabled={!canRedo}>
              <Redo2 size={16} />
            </IconButton>
            <IconButton label="Keyboard shortcuts (?)" onClick={() => setShortcutsOpen(true)}>
              <Keyboard size={16} />
            </IconButton>
            <IconButton label="Preview" onClick={openPreview} disabled={!doc}>
              <Eye size={16} />
            </IconButton>
            <IconButton
              label={inspectorOpen ? "Hide right panel" : "Show right panel"}
              onClick={() => setInspectorOpen((v) => !v)}
            >
              {inspectorOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            </IconButton>
            <span className="mx-1 h-6 w-px bg-zinc-200" />
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePublished}
              loading={publishing}
              loadingLabel="Updating…"
            >
              {published ? "Unpublish" : "Publish"}
            </Button>
            {/* Saves and goes back to the templates list (Ctrl+S saves and stays here) */}
            <Button
              size="sm"
              title="Save and go back to all templates (Ctrl+S saves and stays)"
              onClick={async () => {
                if (dirty && !(await save())) return;
                router.push("/admin/templates");
                router.refresh();
              }}
              loading={saving}
              loadingLabel="Saving…"
              disabled={!doc}
            >
              {dirty ? "Save" : "Done"}
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          {/* Panel rail */}
          <nav
            aria-label="Editor panels"
            className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-zinc-200 bg-white py-3"
          >
            {PANELS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={panel === id}
                onClick={() => setPanel(panel === id ? null : id)}
                className={cn(
                  "flex w-13 flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900",
                  panel === id && "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white",
                )}
              >
                <Icon size={18} aria-hidden />
                {label}
              </button>
            ))}
          </nav>

          {panel && (
            <aside className="w-72 shrink-0 overflow-y-auto border-r border-zinc-200 bg-white">
              <div className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-zinc-100 bg-white px-4">
                <h2 className="text-sm font-semibold">{PANELS.find((p) => p.id === panel)!.label}</h2>
                <IconButton label="Close panel" onClick={() => setPanel(null)} className="size-7">
                  <X size={14} />
                </IconButton>
              </div>
              {panel === "pages" && <PagesPanel />}
              {panel === "layers" && <LayersPanel />}
              {panel === "insert" && <InsertPanel />}
              {panel === "settings" && <SettingsPanel template={template} />}
            </aside>
          )}

          <EditorCanvas
            html={template.document}
            zoom={zoom}
            hidden={!!preview}
            onReady={onReady}
            onKey={onKey}
            onTextEdited={() => commit()}
            onDropBlock={(id, el, position) => {
              const block = BLOCKS.find((b) => b.id === id);
              if (block) insertHtml(block.html, { el, position }, { countdown: block.countdown });
            }}
          />

          {preview && (
            <div className="relative flex min-w-0 flex-1 flex-col items-center overflow-auto bg-zinc-800 p-6">
              <div className="mb-3 flex items-center gap-3 text-xs text-zinc-300">
                <DeviceIcon size={14} aria-hidden />
                Preview · {DEVICES[device].label} · scripts and animations run here
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-md bg-white px-2.5 py-1 font-medium text-zinc-900 hover:bg-zinc-200"
                >
                  Back to editing (Esc)
                </button>
              </div>
              <div
                className="w-full flex-1 overflow-hidden rounded-lg bg-white shadow-2xl"
                style={{ maxWidth: DEVICES[device].width }}
              >
                <SiteFrame html={preview} title="Preview" />
              </div>
            </div>
          )}

          {inspectorOpen && !preview && (
            <aside className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white">
              <Inspector />
            </aside>
          )}
        </div>
      </div>

      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ConfirmDialog
        open={leaving}
        title="Leave without saving?"
        message="Your latest changes to this template have not been saved."
        confirmLabel="Leave"
        onCancel={() => setLeaving(false)}
        onConfirm={() => router.push("/admin/templates")}
      />
    </EditorContext.Provider>
  );
}
