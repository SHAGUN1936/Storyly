"use client";

// Inspector sections for interactivity:
//   <ActionSection>  what happens when the element is clicked (go to a page, open a popup, call…)
//   <PartSection>    settings of a page or popup itself (name; popups can open by themselves)

import { MousePointerClick } from "lucide-react";
import { elementName } from "@/lib/editor/dom";
import { listPages, listPopups, NAME_ATTR, PAGE_ATTR, POPUP_ATTR, scrollTargets } from "@/lib/editor/pages";
import { PanelSection, Row, SelectInput, Slider, TextInput, Toggle } from "./controls";
import { useEditor } from "./editor-context";

const ACTION_ATTR = "data-storyly-action";
const TARGET_ATTR = "data-storyly-target";

const ACTIONS = [
  { value: "", label: "Nothing" },
  { value: "page", label: "Go to a page" },
  { value: "popup", label: "Open a popup" },
  { value: "close", label: "Close the popup" },
  { value: "scroll", label: "Scroll to a section" },
  { value: "link", label: "Open a link" },
  { value: "call", label: "Call a number" },
  { value: "email", label: "Send an email" },
  { value: "whatsapp", label: "WhatsApp message" },
];

/** The address an action opens, so plain links (<a>) work even before the page's script runs. */
function hrefFor(action: string, target: string) {
  if (action === "link") return target;
  if (action === "call") return `tel:${target.replace(/[^+\d]/g, "")}`;
  if (action === "email") return `mailto:${target}`;
  if (action === "whatsapp") {
    const [number, message] = target.split("|");
    return `https://wa.me/${(number ?? "").replace(/\D/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  }
  return "#";
}

export function ActionSection({ el }: { el: HTMLElement }) {
  const { doc, commit, viewRoot } = useEditor();
  if (!doc) return null;
  const action = el.getAttribute(ACTION_ATTR) ?? "";
  const target = el.getAttribute(TARGET_ATTR) ?? "";

  const apply = (nextAction: string, nextTarget: string) => {
    if (nextAction) {
      el.setAttribute(ACTION_ATTR, nextAction);
      if (nextTarget) el.setAttribute(TARGET_ATTR, nextTarget);
      else el.removeAttribute(TARGET_ATTR);
    } else {
      el.removeAttribute(ACTION_ATTR);
      el.removeAttribute(TARGET_ATTR);
    }
    if (el.tagName === "A") {
      if (nextAction) el.setAttribute("href", hrefFor(nextAction, nextTarget));
      if (["link", "call", "email", "whatsapp"].includes(nextAction)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
      }
    }
    commit();
  };

  const pages = listPages(doc);
  const popups = listPopups(doc);
  const sections = scrollTargets(viewRoot ?? doc.body);
  const [number = "", message = ""] = action === "whatsapp" ? target.split("|") : [];

  return (
    <PanelSection title="On click" defaultOpen={!!action || ["A", "BUTTON"].includes(el.tagName)}>
      <Row label="Action">
        <SelectInput
          value={action}
          options={ACTIONS}
          onChange={(next) => {
            // Pick a sensible first target so the action works straight away
            const first =
              next === "page" ? (pages[1]?.id ?? pages[0]?.id ?? "") : next === "popup" ? (popups[0]?.id ?? "") : "";
            apply(next, first);
          }}
        />
      </Row>

      {action === "page" &&
        (pages.length > 1 ? (
          <Row label="Page">
            <SelectInput
              value={target}
              options={pages.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(id) => apply("page", id)}
            />
          </Row>
        ) : (
          <Hint>Add more pages in the Pages panel first, then choose one here.</Hint>
        ))}

      {action === "popup" &&
        (popups.length ? (
          <Row label="Popup">
            <SelectInput
              value={target}
              options={popups.map((p) => ({ value: p.id, label: p.name }))}
              onChange={(id) => apply("popup", id)}
            />
          </Row>
        ) : (
          <Hint>Add a popup in the Pages panel first, then choose it here.</Hint>
        ))}

      {action === "close" && <Hint>Closes whichever popup is open. Use it on a popup&apos;s buttons.</Hint>}

      {action === "scroll" && (
        <Row label="Section">
          <SelectInput
            value={target}
            options={[
              { value: "", label: "Choose…" },
              ...sections.map((s, i) => ({ value: s.id || `#${i}`, label: elementName(s) })),
            ]}
            onChange={(value) => {
              const section = value.startsWith("#") ? sections[Number(value.slice(1))] : doc.getElementById(value);
              if (!section) return;
              if (!section.id) section.id = `sl-${Math.random().toString(36).slice(2, 8)}`;
              apply("scroll", section.id);
            }}
          />
        </Row>
      )}

      {action === "link" && (
        <Row label="Link">
          <TextInput value={target} onCommit={(v) => apply("link", v)} type="url" placeholder="https://…" />
        </Row>
      )}
      {action === "call" && (
        <Row label="Phone">
          <TextInput value={target} onCommit={(v) => apply("call", v)} placeholder="+91 98765 43210" />
        </Row>
      )}
      {action === "email" && (
        <Row label="Email">
          <TextInput value={target} onCommit={(v) => apply("email", v)} placeholder="name@example.com" />
        </Row>
      )}
      {action === "whatsapp" && (
        <>
          <Row label="Number">
            <TextInput
              value={number}
              onCommit={(v) => apply("whatsapp", `${v}|${message}`)}
              placeholder="+91 98765 43210"
            />
          </Row>
          <Row label="Message">
            <TextInput
              value={message}
              onCommit={(v) => apply("whatsapp", `${number}|${v}`)}
              placeholder="Yes, I'll be there!"
            />
          </Row>
        </>
      )}

      {action && (
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <MousePointerClick size={12} aria-hidden /> Try it with Preview (eye icon in the top bar).
        </p>
      )}
    </PanelSection>
  );
}

/** Settings of an RSVP form or a music player (works when anything inside them is selected). */
export function SmartSection({ el }: { el: HTMLElement }) {
  const { commit } = useEditor();
  const form = el.closest<HTMLElement>("[data-storyly-form]");
  const music = el.closest<HTMLElement>("[data-storyly-music]");
  const set = (node: HTMLElement, attr: string) => (value: string) => {
    node.setAttribute(attr, value);
    commit();
  };

  if (form) {
    const kind = form.getAttribute("data-storyly-form") === "email" ? "email" : "whatsapp";
    return (
      <PanelSection title="RSVP form">
        <Row label="Send to">
          <SelectInput
            value={kind}
            options={[
              { value: "whatsapp", label: "My WhatsApp" },
              { value: "email", label: "My email" },
            ]}
            onChange={set(form, "data-storyly-form")}
          />
        </Row>
        <Row label={kind === "email" ? "Email" : "Number"}>
          <TextInput
            value={form.getAttribute("data-storyly-target") ?? ""}
            onCommit={set(form, "data-storyly-target")}
            placeholder={kind === "email" ? "name@example.com" : "+91 98765 43210"}
          />
        </Row>
        <Row label="Subject">
          <TextInput
            value={form.getAttribute("data-storyly-intro") ?? ""}
            onCommit={set(form, "data-storyly-intro")}
            placeholder="RSVP"
          />
        </Row>
        <Hint>
          Guests fill it in and press send: their answers open as a ready-to-send{" "}
          {kind === "email" ? "email" : "WhatsApp message"} to you. Each field&apos;s name is its label.
        </Hint>
      </PanelSection>
    );
  }

  if (music) {
    return (
      <PanelSection title="Music">
        <Row label="Song link">
          <TextInput
            value={music.getAttribute("data-storyly-music") ?? ""}
            onCommit={set(music, "data-storyly-music")}
            type="url"
            placeholder="https://…/song.mp3"
          />
        </Row>
        <Hint>A direct link to an .mp3 file. Guests press the button to play; it loops until paused.</Hint>
      </PanelSection>
    );
  }
  return null;
}

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs leading-5 text-zinc-500">{children}</p>
);

/** Name of a page or popup; popups can also open by themselves after a delay. */
export function PartSection({ el }: { el: HTMLElement }) {
  const { commit } = useEditor();
  const isPopup = el.hasAttribute(POPUP_ATTR);
  if (!isPopup && !el.hasAttribute(PAGE_ATTR)) return null;
  const auto = el.getAttribute("data-storyly-popup-auto");

  return (
    <PanelSection title={isPopup ? "Popup" : "Page"}>
      <Row label="Name">
        <TextInput
          value={el.getAttribute(NAME_ATTR) ?? ""}
          onCommit={(v) => {
            el.setAttribute(NAME_ATTR, v.slice(0, 40) || "Untitled");
            commit();
          }}
        />
      </Row>
      {isPopup && (
        <>
          <Toggle
            label="Open by itself when the page opens"
            checked={auto !== null}
            onChange={(on) => {
              if (on) el.setAttribute("data-storyly-popup-auto", "2");
              else el.removeAttribute("data-storyly-popup-auto");
              commit();
            }}
          />
          {auto !== null && (
            <Row label="After">
              <Slider
                value={Number(auto) || 0}
                min={0}
                max={15}
                onChange={(v) => {
                  el.setAttribute("data-storyly-popup-auto", String(v));
                  commit("popup-auto");
                }}
                format={(v) => `${v}s`}
              />
            </Row>
          )}
          <Hint>Visitors close it with its buttons, the Esc key or a click outside the box.</Hint>
        </>
      )}
    </PanelSection>
  );
}
