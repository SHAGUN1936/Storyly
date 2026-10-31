"use client";

// Right panel: everything about the selected element (or the whole page when nothing is selected).

import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Copy,
  CornerLeftUp,
  Eye,
  EyeOff,
  Italic,
  Play,
  Smartphone,
  Trash2,
  Underline,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { mapEmbedUrl, toEmbedUrl } from "@/lib/editor/blocks";
import {
  clearMobileStyles,
  elementName,
  hasMobileStyles,
  isPlainText,
  isTag,
  isTextElement,
  kindName,
  uniqueSlotId,
} from "@/lib/editor/dom";
import { isPart } from "@/lib/editor/pages";
import { ANIMATIONS, ensureFont, FONTS } from "@/lib/editor/runtime";
import { humanizeSlotId, LABEL_ATTR, SLOT_ATTR } from "@/lib/site-template";
import { cn } from "@/lib/utils";
import {
  ColorInput,
  IconButton,
  PanelSection,
  Row,
  Segmented,
  SelectInput,
  Slider,
  TextArea,
  TextInput,
  Toggle,
} from "./controls";
import { ActionSection, PartSection, SmartSection } from "./actions-section";
import { useEditor } from "./editor-context";

const WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"].map((w) => ({ value: w, label: w }));

const SHADOWS = [
  { value: "none", label: "None" },
  { value: "0 1px 3px rgba(0,0,0,.12)", label: "S" },
  { value: "0 8px 24px rgba(0,0,0,.12)", label: "M" },
  { value: "0 20px 50px rgba(0,0,0,.18)", label: "L" },
];

const DISPLAYS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "inline-block", label: "Inline block" },
  { value: "inline", label: "Inline" },
];

/** "100.796875px" -> "100.8px" */
const tidy = (value: string) => value.replace(/-?\d+\.\d+/g, (n) => String(Number(Number(n).toFixed(1))));

/** Which shadow preset the element uses ("" if its shadow is something else). */
function activeShadow(el: HTMLElement) {
  const current = el.style.boxShadow;
  if (!current) return getComputedStyle(el).boxShadow === "none" ? "none" : "";
  const probe = el.ownerDocument.createElement("div").style;
  return (
    SHADOWS.find((s) => {
      probe.boxShadow = s.value;
      return probe.boxShadow === current;
    })?.value ?? ""
  );
}

export function Inspector() {
  const editor = useEditor();
  const { doc, selected, mobile } = editor;
  if (!doc) return null;
  const el = selected ?? doc.body;
  const isBody = el === doc.body;
  // Read styles through the page's own window, so its media queries apply.
  const cs = (el.ownerDocument.defaultView ?? window).getComputedStyle(el);
  /** The value set on the element itself if any (desktop), else what the browser computed. */
  const value = (prop: string) => tidy((!mobile && el.style.getPropertyValue(prop)) || cs.getPropertyValue(prop));
  const set = (prop: string) => (v: string) => editor.setStyle(el, prop, v);

  const text = isTextElement(el) || isBody;
  const flexOrGrid = /flex|grid/.test(cs.display);

  return (
    <div className="pb-10">
      <Header el={el} isBody={isBody} />

      {mobile && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg bg-zinc-100 px-3 py-2.5 text-xs leading-5 text-zinc-700">
          <Smartphone size={14} className="mt-0.5 shrink-0" aria-hidden />
          <div className="flex-1">
            Style changes here apply to phones only.
            {hasMobileStyles(el) && (
              <button
                type="button"
                onClick={() => {
                  clearMobileStyles(el);
                  editor.commit();
                }}
                className="ml-1 font-medium underline underline-offset-2"
              >
                Reset phone styles
              </button>
            )}
          </div>
        </div>
      )}

      {!isBody && <ContentSection el={el} />}
      {!isBody && <PartSection el={el} />}
      {!isBody && <SmartSection el={el} />}
      {!isBody && <SlotSection el={el} />}
      {!isBody && !isPart(el) && <ActionSection el={el} />}

      {text && (
        <PanelSection title="Text">
          <Row label="Font">
            <SelectInput
              value={cs.fontFamily.split(",")[0].replace(/["']/g, "").trim()}
              options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
              onChange={(family) => {
                if (family) ensureFont(doc, family);
                set("font-family")(
                  family ? `"${family}", ${/Script|Vibes|Pacifico/.test(family) ? "cursive" : "sans-serif"}` : "",
                );
              }}
            />
          </Row>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Size" compact>
              <TextInput value={tidy(cs.fontSize)} onCommit={set("font-size")} />
            </Row>
            <Row label="Weight" compact>
              <SelectInput value={cs.fontWeight} options={WEIGHTS} onChange={set("font-weight")} />
            </Row>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Row label="Line" compact>
              <TextInput value={value("line-height")} onCommit={set("line-height")} title="Line height" />
            </Row>
            <Row label="Spacing" compact>
              <TextInput value={value("letter-spacing")} onCommit={set("letter-spacing")} title="Letter spacing" />
            </Row>
          </div>
          <Row label="Colour">
            <ColorInput value={cs.color} onChange={set("color")} />
          </Row>
          <Segmented
            value={cs.textAlign === "start" ? "left" : (cs.textAlign as "left")}
            onChange={set("text-align")}
            options={[
              { value: "left", label: "Align left", icon: <AlignLeft size={14} /> },
              { value: "center", label: "Centre", icon: <AlignCenter size={14} /> },
              { value: "right", label: "Align right", icon: <AlignRight size={14} /> },
              { value: "justify", label: "Justify", icon: <AlignJustify size={14} /> },
            ]}
          />
          <div className="flex gap-1">
            <IconButton
              label="Italic"
              active={cs.fontStyle === "italic"}
              onClick={() => set("font-style")(cs.fontStyle === "italic" ? "normal" : "italic")}
            >
              <Italic size={14} />
            </IconButton>
            <IconButton
              label="Underline"
              active={cs.textDecorationLine.includes("underline")}
              onClick={() => set("text-decoration")(cs.textDecorationLine.includes("underline") ? "none" : "underline")}
            >
              <Underline size={14} />
            </IconButton>
            <IconButton
              label="Uppercase"
              active={cs.textTransform === "uppercase"}
              onClick={() => set("text-transform")(cs.textTransform === "uppercase" ? "none" : "uppercase")}
            >
              <span className="text-[11px] font-semibold">AA</span>
            </IconButton>
          </div>
        </PanelSection>
      )}

      <PanelSection title="Size & spacing">
        <div className="grid grid-cols-2 gap-2">
          <Row label="Width" compact>
            <TextInput value={value("width")} onCommit={set("width")} placeholder="auto" />
          </Row>
          <Row label="Height" compact>
            <TextInput value={value("height")} onCommit={set("height")} placeholder="auto" />
          </Row>
        </div>
        <Row label="Max width">
          <TextInput value={value("max-width")} onCommit={set("max-width")} placeholder="none" />
        </Row>
        <BoxSides label="Padding" prop="padding" value={value} set={set} />
        <BoxSides label="Margin" prop="margin" value={value} set={set} />
        <Row label="Display">
          <SelectInput value={cs.display} options={DISPLAYS} onChange={set("display")} />
        </Row>
        {flexOrGrid && (
          <>
            {cs.display.includes("flex") && (
              <Row label="Direction">
                <Segmented
                  value={cs.flexDirection.startsWith("column") ? "column" : "row"}
                  onChange={set("flex-direction")}
                  options={[
                    { value: "row", label: "Row" },
                    { value: "column", label: "Column" },
                  ]}
                />
              </Row>
            )}
            <Row label="Align">
              <SelectInput
                value={cs.alignItems}
                onChange={set("align-items")}
                options={["normal", "flex-start", "center", "flex-end", "stretch"].map((v) => ({ value: v, label: v }))}
              />
            </Row>
            <Row label="Justify">
              <SelectInput
                value={cs.justifyContent}
                onChange={set("justify-content")}
                options={["normal", "flex-start", "center", "flex-end", "space-between", "space-around"].map((v) => ({
                  value: v,
                  label: v,
                }))}
              />
            </Row>
            <Row label="Gap">
              <TextInput value={value("gap")} onCommit={set("gap")} />
            </Row>
          </>
        )}
      </PanelSection>

      <BackgroundSection el={el} cs={cs} set={set} />

      <PanelSection title="Border" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <Row label="Radius" compact>
            <TextInput value={value("border-radius")} onCommit={set("border-radius")} />
          </Row>
          <Row label="Width" compact>
            <TextInput value={value("border-width")} onCommit={set("border-width")} />
          </Row>
        </div>
        <Row label="Style">
          <SelectInput
            value={cs.borderStyle.split(" ")[0]}
            onChange={set("border-style")}
            options={["none", "solid", "dashed", "dotted", "double"].map((v) => ({ value: v, label: v }))}
          />
        </Row>
        <Row label="Colour">
          <ColorInput value={cs.borderTopColor} onChange={set("border-color")} />
        </Row>
      </PanelSection>

      <PanelSection title="Effects" defaultOpen={false}>
        <Row label="Opacity">
          <Slider
            value={Math.round(Number(cs.opacity) * 100)}
            min={0}
            max={100}
            onChange={(v) => set("opacity")(v === 100 ? "" : String(v / 100))}
            format={(v) => `${v}%`}
          />
        </Row>
        <Row label="Rotate">
          <Slider
            value={parseFloat(cs.rotate) || 0}
            min={-180}
            max={180}
            onChange={(v) => set("rotate")(v ? `${v}deg` : "")}
            format={(v) => `${v}°`}
          />
        </Row>
        <Row label="Blur">
          <Slider
            value={parseFloat(cs.filter.match(/blur\(([\d.]+)px\)/)?.[1] ?? "0")}
            min={0}
            max={20}
            onChange={(v) => set("filter")(v ? `blur(${v}px)` : "")}
            format={(v) => `${v}px`}
          />
        </Row>
        <Row label="Shadow">
          <Segmented
            value={activeShadow(el)}
            onChange={(v) => set("box-shadow")(v === "none" ? "" : v)}
            options={SHADOWS}
          />
        </Row>
      </PanelSection>

      {!isBody && <AnimationSection el={el} />}
    </div>
  );
}

function Header({ el, isBody }: { el: HTMLElement; isBody: boolean }) {
  const { select, shift, duplicate, toggleHidden, remove } = useEditor();
  const hidden = el.hasAttribute("data-storyly-hidden");
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        {isBody ? "Page" : kindName(el)}
      </p>
      <p className="truncate text-sm font-medium text-zinc-900">{isBody ? "Whole page" : elementName(el)}</p>
      {!isBody && (
        <div className="mt-2 flex gap-0.5">
          <IconButton label="Select parent" onClick={() => el.parentElement && select(el.parentElement)}>
            <CornerLeftUp size={15} />
          </IconButton>
          <IconButton label="Move up" onClick={() => shift(el, -1)}>
            <ArrowUp size={15} />
          </IconButton>
          <IconButton label="Move down" onClick={() => shift(el, 1)}>
            <ArrowDown size={15} />
          </IconButton>
          <IconButton label="Duplicate" onClick={() => duplicate(el)}>
            <Copy size={15} />
          </IconButton>
          <IconButton label={hidden ? "Show" : "Hide"} onClick={() => toggleHidden(el)} active={hidden}>
            {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </IconButton>
          <IconButton label="Delete" onClick={() => remove(el)} className="ml-auto hover:bg-red-50 hover:text-red-600">
            <Trash2 size={15} />
          </IconButton>
        </div>
      )}
    </div>
  );
}

/** Four inputs: top, right, bottom, left. */
function BoxSides({
  label,
  prop,
  value,
  set,
}: {
  label: string;
  prop: "padding" | "margin";
  value: (prop: string) => string;
  set: (prop: string) => (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs text-zinc-500">{label}</span>
      <div className="grid grid-cols-4 gap-1">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <label key={side} className="block">
            <TextInput value={value(`${prop}-${side}`)} onCommit={set(`${prop}-${side}`)} className="text-center" />
            <span className="mt-0.5 block text-center text-[10px] text-zinc-400 capitalize">{side}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function UploadButton({ onUploaded, label = "Upload" }: { onUploaded: (url: string) => void; label?: string }) {
  const { uploadImage } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:border-zinc-900 disabled:opacity-50"
      >
        <Upload size={13} aria-hidden />
        {busy ? "Uploading…" : label}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          const url = await uploadImage(file);
          setBusy(false);
          if (url) onUploaded(url);
        }}
      />
    </>
  );
}

function ContentSection({ el }: { el: HTMLElement }) {
  const { commit, setStyle } = useEditor();
  const attr = (name: string) => el.getAttribute(name) ?? "";
  const setAttr = (name: string, key?: string) => (v: string) => {
    if (v) el.setAttribute(name, v);
    else el.removeAttribute(name);
    commit(key);
  };

  const parts: React.ReactNode[] = [];

  if (isPlainText(el)) {
    parts.push(
      <TextArea
        key="text"
        value={el.textContent ?? ""}
        onCommit={(v) => {
          el.textContent = v;
          commit();
        }}
      />,
    );
  } else if (isTextElement(el)) {
    parts.push(
      <p key="hint" className="text-xs leading-5 text-zinc-500">
        Double-click the text on the page to edit it.
      </p>,
    );
  }

  if (isTag(el, "IMG")) {
    parts.push(
      <div key="img" className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attr("src")} alt="" className="max-h-32 w-full rounded-md bg-zinc-100 object-contain" />
        <UploadButton label="Replace photo" onUploaded={setAttr("src")} />
        <Row label="Link">
          <TextInput
            value={attr("src").startsWith("data:") ? "" : attr("src")}
            onCommit={setAttr("src")}
            type="url"
            placeholder="https://…"
          />
        </Row>
        <Row label="Alt text">
          <TextInput value={attr("alt")} onCommit={setAttr("alt")} placeholder="Describe the photo" />
        </Row>
        <Row label="Fit">
          <Segmented
            value={(el.style.objectFit || "") as "cover"}
            onChange={(v) => setStyle(el, "object-fit", v)}
            options={[
              { value: "cover", label: "Fill" },
              { value: "contain", label: "Fit" },
              { value: "fill", label: "Stretch" },
            ]}
          />
        </Row>
      </div>,
    );
  }

  // A link with an "On click" action gets its address from the action instead
  if (isTag(el, "A") && el.hasAttribute("data-storyly-action")) {
    parts.push(
      <p key="link" className="text-xs leading-5 text-zinc-500">
        Where this goes is set under <strong className="font-medium text-zinc-700">On click</strong> below.
      </p>,
    );
  } else if (isTag(el, "A")) {
    parts.push(
      <div key="link" className="space-y-2">
        <Row label="Link to">
          <TextInput value={attr("href")} onCommit={setAttr("href")} placeholder="https://…" />
        </Row>
        <Toggle
          label="Open in a new tab"
          checked={attr("target") === "_blank"}
          onChange={(on) => {
            if (on) {
              el.setAttribute("target", "_blank");
              el.setAttribute("rel", "noopener");
            } else el.removeAttribute("target");
            commit();
          }}
        />
      </div>,
    );
  }

  if (el.hasAttribute("data-storyly-countdown")) {
    parts.push(
      <Row key="countdown" label="Counts to">
        <TextInput
          type="datetime-local"
          value={attr("data-storyly-countdown")}
          onCommit={setAttr("data-storyly-countdown")}
        />
      </Row>,
    );
  }

  if (el.hasAttribute("data-storyly-map")) {
    parts.push(
      <Row key="map" label="Place">
        <TextInput
          value={attr("data-storyly-map")}
          placeholder="Address or place name"
          onCommit={(place) => {
            el.setAttribute("data-storyly-map", place);
            el.querySelector("iframe")?.setAttribute("src", mapEmbedUrl(place));
            commit();
          }}
        />
      </Row>,
    );
  }

  if (el.hasAttribute("data-storyly-video")) {
    parts.push(
      <Row key="video" label="Video link">
        <TextInput
          value={attr("data-storyly-video")}
          placeholder="YouTube or Vimeo link"
          onCommit={(url) => {
            el.setAttribute("data-storyly-video", url);
            el.querySelector("iframe")?.setAttribute("src", toEmbedUrl(url));
            commit();
          }}
        />
      </Row>,
    );
  }

  if (!parts.length) return null;
  return <PanelSection title="Content">{parts}</PanelSection>;
}

/** Turn an element into a part users fill in when they make a page from this template. */
function SlotSection({ el }: { el: HTMLElement }) {
  const { doc, commit } = useEditor();
  if (!doc || !(isTextElement(el) || isTag(el, "IMG"))) return null;
  const isSlot = el.hasAttribute(SLOT_ATTR);
  const label = el.getAttribute(LABEL_ATTR) || (isSlot ? humanizeSlotId(el.getAttribute(SLOT_ATTR)!) : "");

  return (
    <PanelSection title="For users">
      <Toggle
        label="Users can edit this"
        checked={isSlot}
        onChange={(on) => {
          if (on) {
            const name = isTag(el, "IMG") ? "Photo" : elementName(el).slice(0, 24);
            el.setAttribute(SLOT_ATTR, uniqueSlotId(doc, name));
            el.setAttribute(LABEL_ATTR, name);
          } else {
            el.removeAttribute(SLOT_ATTR);
            el.removeAttribute(LABEL_ATTR);
          }
          commit();
        }}
      />
      {isSlot && (
        <Row label="Field name">
          <TextInput
            value={label}
            placeholder="e.g. Your name"
            onCommit={(v) => {
              el.setAttribute(LABEL_ATTR, v.slice(0, 60) || "Field");
              commit();
            }}
          />
        </Row>
      )}
      <p className="text-xs leading-5 text-zinc-500">
        {isSlot
          ? `Users will see a “${label || "Field"}” ${isTag(el, "IMG") ? "photo picker" : "text box"} when they make their page.`
          : "Turn on to let users change this when they make their own page."}
      </p>
    </PanelSection>
  );
}

function BackgroundSection({
  el,
  cs,
  set,
}: {
  el: HTMLElement;
  cs: CSSStyleDeclaration;
  set: (prop: string) => (v: string) => void;
}) {
  const image = cs.backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1] ?? "";
  const gradient = cs.backgroundImage.includes("gradient") ? cs.backgroundImage : "";
  return (
    <PanelSection title="Background" defaultOpen={el.tagName === "BODY"}>
      <Row label="Colour">
        <ColorInput value={cs.backgroundColor} onChange={set("background-color")} />
      </Row>
      <Row label="Image">
        <div className="space-y-1.5">
          <UploadButton
            label={image ? "Replace image" : "Upload image"}
            onUploaded={(url) => {
              set("background-image")(`url("${url}")`);
              if (cs.backgroundSize === "auto") {
                set("background-size")("cover");
                set("background-position")("center");
              }
            }}
          />
          {(image || gradient) && (
            <button
              type="button"
              onClick={() => set("background-image")("none")}
              className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
            >
              Remove {image ? "image" : "gradient"}
            </button>
          )}
        </div>
      </Row>
      {image && (
        <Row label="Size" compact>
          <Segmented
            value={
              (cs.backgroundSize === "cover" || cs.backgroundSize === "contain" ? cs.backgroundSize : "") as "cover"
            }
            onChange={set("background-size")}
            options={[
              { value: "cover", label: "Fill" },
              { value: "contain", label: "Fit" },
            ]}
          />
        </Row>
      )}
    </PanelSection>
  );
}

function AnimationSection({ el }: { el: HTMLElement }) {
  const { commit } = useEditor();
  const anim = el.getAttribute("data-storyly-anim") ?? "";
  const trigger = el.getAttribute("data-storyly-anim-on") === "scroll" ? "scroll" : "load";
  const seconds = (name: string, fallback: number) => parseFloat(el.style.getPropertyValue(name)) || fallback;

  const play = () => {
    const name = el.getAttribute("data-storyly-anim");
    if (!name) return;
    el.removeAttribute("data-storyly-anim");
    void el.offsetWidth; // restart the animation
    el.setAttribute("data-storyly-anim", name);
  };

  const setVar = (name: string) => (v: number) => {
    el.style.setProperty(name, `${v}s`);
    commit(name);
  };

  return (
    <PanelSection title="Animation" defaultOpen={!!anim}>
      <Row label="Effect">
        <SelectInput
          value={anim}
          options={[{ value: "", label: "None" }, ...ANIMATIONS.map((a) => ({ value: a.id, label: a.label }))]}
          onChange={(v) => {
            if (v) el.setAttribute("data-storyly-anim", v);
            else {
              el.removeAttribute("data-storyly-anim");
              el.removeAttribute("data-storyly-anim-on");
              el.style.removeProperty("--sl-dur");
              el.style.removeProperty("--sl-delay");
            }
            commit();
            play();
          }}
        />
      </Row>
      {anim && (
        <>
          <Row label="Starts">
            <Segmented
              value={trigger}
              onChange={(v) => {
                if (v === "scroll") el.setAttribute("data-storyly-anim-on", "scroll");
                else el.removeAttribute("data-storyly-anim-on");
                commit();
              }}
              options={[
                { value: "load", label: "On open" },
                { value: "scroll", label: "On scroll" },
              ]}
            />
          </Row>
          <Row label="Duration">
            <Slider
              value={seconds("--sl-dur", 0.8)}
              min={0.2}
              max={3}
              step={0.1}
              onChange={setVar("--sl-dur")}
              format={(v) => `${v}s`}
            />
          </Row>
          {trigger === "load" && (
            <Row label="Delay">
              <Slider
                value={seconds("--sl-delay", 0)}
                min={0}
                max={3}
                step={0.1}
                onChange={setVar("--sl-delay")}
                format={(v) => `${v}s`}
              />
            </Row>
          )}
          <button
            type="button"
            onClick={play}
            className={cn(
              "flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-zinc-200 text-xs font-medium text-zinc-700 hover:border-zinc-900",
            )}
          >
            <Play size={13} aria-hidden /> Play
          </button>
        </>
      )}
    </PanelSection>
  );
}
