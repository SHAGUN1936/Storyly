// What the editor adds to a saved page so its features work without the editor:
// hidden layers, entrance animations, Google fonts and the countdown script.
// Everything is tagged with a data-storyly-* attribute so it is added only once.

import { pauseScript } from "./dom";

export const ANIMATIONS = [
  { id: "fade", label: "Fade in" },
  { id: "slide-up", label: "Slide up" },
  { id: "slide-down", label: "Slide down" },
  { id: "slide-left", label: "Slide from right" },
  { id: "slide-right", label: "Slide from left" },
  { id: "zoom-in", label: "Zoom in" },
  { id: "zoom-out", label: "Zoom out" },
  { id: "blur", label: "Blur in" },
  { id: "pop", label: "Pop" },
  { id: "float", label: "Float (loop)" },
  { id: "pulse", label: "Pulse (loop)" },
] as const;

const RUNTIME_CSS = `
[data-storyly-hidden]{display:none!important}
[data-storyly-anim]{animation-duration:var(--sl-dur,.8s);animation-delay:var(--sl-delay,0s);animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.7,.2,1)}
@keyframes sl-fade{from{opacity:0}}
@keyframes sl-slide-up{from{opacity:0;translate:0 40px}}
@keyframes sl-slide-down{from{opacity:0;translate:0 -40px}}
@keyframes sl-slide-left{from{opacity:0;translate:40px 0}}
@keyframes sl-slide-right{from{opacity:0;translate:-40px 0}}
@keyframes sl-zoom-in{from{opacity:0;scale:.85}}
@keyframes sl-zoom-out{from{opacity:0;scale:1.15}}
@keyframes sl-blur{from{opacity:0;filter:blur(12px)}}
@keyframes sl-pop{0%{opacity:0;scale:.6}70%{opacity:1;scale:1.05}100%{scale:1}}
@keyframes sl-float{to{translate:0 -10px}}
@keyframes sl-pulse{to{scale:1.05}}
${ANIMATIONS.map(({ id }) => `[data-storyly-anim="${id}"]{animation-name:sl-${id}}`).join("\n")}
[data-storyly-anim="float"],[data-storyly-anim="pulse"]{animation-iteration-count:infinite;animation-direction:alternate;animation-timing-function:ease-in-out;animation-fill-mode:none}
@supports (animation-timeline:view()){[data-storyly-anim-on="scroll"]:not([data-storyly-anim="float"]):not([data-storyly-anim="pulse"]){animation-timeline:view();animation-range:entry 0% cover 30%;animation-duration:auto;animation-delay:0s}}
@media (prefers-reduced-motion:reduce){[data-storyly-anim]{animation:none!important}}
[data-storyly-page][hidden]{display:none!important}
.sl-page-in{animation:sl-page .55s cubic-bezier(.2,.7,.2,1) both}
@keyframes sl-page{from{opacity:0;translate:0 24px}}
[data-storyly-action],[data-storyly-music]{cursor:pointer}
[data-storyly-music] .sl-on{display:none}
[data-storyly-music].sl-playing .sl-on{display:inline}
[data-storyly-music].sl-playing .sl-off{display:none}
[data-storyly-music].sl-playing{animation:sl-pulse 1.2s ease-in-out infinite alternate}
[data-storyly-popup]{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(9,9,11,.6);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);overflow:auto}
[data-storyly-popup].sl-open{display:flex;animation:sl-fade .3s ease both}
[data-storyly-popup].sl-open>[data-storyly-popup-box]{animation:sl-pop .45s cubic-bezier(.2,.7,.2,1) both}
[data-storyly-popup-box]{position:relative;max-height:calc(100vh - 48px);overflow:auto}
@media (prefers-reduced-motion:reduce){.sl-page-in,[data-storyly-popup].sl-open,[data-storyly-popup].sl-open>[data-storyly-popup-box]{animation:none!important}}
`.trim();

/**
 * Pages, popups and click actions on a saved page:
 *   [data-storyly-page="id"]           one page; only one is shown at a time (the first on open)
 *   [data-storyly-popup="id"]          a popup, opened by an action or automatically
 *                                      (data-storyly-popup-auto="<seconds>")
 *   [data-storyly-action][data-storyly-target]   on click: page | popup | close | scroll | link | call | email
 *                                                | whatsapp ("number|message")
 */
const SITE_JS = `
(function () {
  var pages = [].slice.call(document.querySelectorAll("[data-storyly-page]"));
  function showPage(id) {
    if (!pages.length) return;
    var next = pages.filter(function (p) { return p.getAttribute("data-storyly-page") === id; })[0] || pages[0];
    pages.forEach(function (p) { p.hidden = p !== next; });
    next.classList.remove("sl-page-in");
    void next.offsetWidth;
    next.classList.add("sl-page-in");
    closePopups();
    window.scrollTo(0, 0);
  }
  function linkFor(action, target) {
    if (!target) return "";
    if (action === "link") return target;
    if (action === "call") return "tel:" + target.replace(/[^+\\d]/g, "");
    if (action === "email") return "mailto:" + target;
    if (action === "whatsapp") {
      var parts = target.split("|");
      return "https://wa.me/" + parts[0].replace(/\\D/g, "") + (parts[1] ? "?text=" + encodeURIComponent(parts[1]) : "");
    }
    return "";
  }
  function popup(id) { return document.querySelector('[data-storyly-popup="' + id + '"]'); }
  function openPopup(id) { var p = popup(id); if (p) { closePopups(); p.classList.add("sl-open"); } }
  function closePopups() { [].forEach.call(document.querySelectorAll("[data-storyly-popup].sl-open"), function (p) { p.classList.remove("sl-open"); }); }
  document.addEventListener("click", function (e) {
    var open = e.target.closest && e.target.closest("[data-storyly-popup].sl-open");
    if (open && e.target === open) { closePopups(); return; }
    var el = e.target.closest && e.target.closest("[data-storyly-action]");
    if (!el) return;
    var action = el.getAttribute("data-storyly-action"), target = el.getAttribute("data-storyly-target") || "";
    if (action === "page") { e.preventDefault(); showPage(target); }
    else if (action === "popup") { e.preventDefault(); openPopup(target); }
    else if (action === "close") { e.preventDefault(); closePopups(); }
    else if (action === "scroll") { e.preventDefault(); var to = document.getElementById(target); if (to) to.scrollIntoView({ behavior: "smooth", block: "start" }); }
    else {
      var url = linkFor(action, target);
      if (url) { e.preventDefault(); window.open(url, "_blank", "noopener"); }
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePopups(); });
  [].forEach.call(document.querySelectorAll("[data-storyly-popup-auto]"), function (p) {
    var wait = parseFloat(p.getAttribute("data-storyly-popup-auto")) || 0;
    setTimeout(function () { openPopup(p.getAttribute("data-storyly-popup")); }, wait * 1000);
  });
  // RSVP / contact forms: the answers go out as a WhatsApp message or an email draft
  [].forEach.call(document.querySelectorAll("form[data-storyly-form]"), function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = [];
      [].forEach.call(form.elements, function (field) {
        if (field.name && field.value) lines.push(field.name + ": " + field.value);
      });
      var to = form.getAttribute("data-storyly-target") || "";
      var text = (form.getAttribute("data-storyly-intro") || "") + "\\n" + lines.join("\\n");
      var url = form.getAttribute("data-storyly-form") === "email"
        ? "mailto:" + to + "?subject=" + encodeURIComponent(form.getAttribute("data-storyly-intro") || "RSVP") + "&body=" + encodeURIComponent(text)
        : "https://wa.me/" + to.replace(/\\D/g, "") + "?text=" + encodeURIComponent(text);
      window.open(url, "_blank", "noopener");
      var done = form.querySelector("[data-storyly-done]");
      if (done) done.hidden = false;
    });
  });
  // Music: a play / pause button with a looping track
  [].forEach.call(document.querySelectorAll("[data-storyly-music]"), function (button) {
    var audio = new Audio(button.getAttribute("data-storyly-music"));
    audio.loop = true;
    button.addEventListener("click", function () {
      if (audio.paused) { audio.play(); button.classList.add("sl-playing"); }
      else { audio.pause(); button.classList.remove("sl-playing"); }
    });
  });
  showPage(pages.length ? pages[0].getAttribute("data-storyly-page") : "");
})();
`.trim();

const COUNTDOWN_JS = `
document.querySelectorAll("[data-storyly-countdown]").forEach(function (el) {
  function tick() {
    var left = new Date(el.getAttribute("data-storyly-countdown")) - new Date();
    if (isNaN(left)) return;
    left = Math.max(0, left);
    var v = [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60];
    el.querySelectorAll("[data-unit]").forEach(function (n, i) { n.textContent = String(v[i]).padStart(2, "0"); });
  }
  tick();
  setInterval(tick, 1000);
});
`.trim();

/** Fonts offered in the editor. Google fonts are linked into the page when first used. */
export const FONTS = [
  { label: "Page default", value: "" },
  { label: "Inter", value: "Inter", google: true },
  { label: "Poppins", value: "Poppins", google: true },
  { label: "Montserrat", value: "Montserrat", google: true },
  { label: "DM Sans", value: "DM Sans", google: true },
  { label: "Space Grotesk", value: "Space Grotesk", google: true },
  { label: "Playfair Display", value: "Playfair Display", google: true },
  { label: "Cormorant Garamond", value: "Cormorant Garamond", google: true },
  { label: "Lora", value: "Lora", google: true },
  { label: "DM Serif Display", value: "DM Serif Display", google: true },
  { label: "Dancing Script", value: "Dancing Script", google: true },
  { label: "Great Vibes", value: "Great Vibes", google: true },
  { label: "Pacifico", value: "Pacifico", google: true },
  { label: "Georgia", value: "Georgia" },
  { label: "Arial", value: "Arial" },
  { label: "Courier New", value: "Courier New" },
];

function ensureHeadChild(doc: Document, selector: string, create: () => Element) {
  const found = doc.head.querySelector(selector);
  if (found) return found;
  const el = create();
  doc.head.appendChild(el);
  return el;
}

/** Adds the hidden-layer and animation styles to the page (once). */
export function ensureRuntimeStyle(doc: Document) {
  const style = ensureHeadChild(doc, "style[data-storyly-runtime]", () => {
    const el = doc.createElement("style");
    el.setAttribute("data-storyly-runtime", "");
    return el;
  });
  if (style.textContent !== RUNTIME_CSS) style.textContent = RUNTIME_CSS;
}

/** Links a Google font into the page (once). */
export function ensureFont(doc: Document, family: string) {
  const font = FONTS.find((f) => f.value === family);
  if (!font?.google) return;
  ensureHeadChild(doc, `link[data-storyly-font="${family}"]`, () => {
    const link = doc.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-storyly-font", family);
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@400;500;600;700&display=swap`;
    return link;
  });
}

/** Adds (or updates) one of the page's own scripts. The editor itself never runs them. */
function ensureScript(doc: Document, name: string, code: string) {
  let script = doc.querySelector(`script[data-storyly-runtime="${name}"]`);
  if (!script) {
    script = doc.createElement("script");
    script.setAttribute("data-storyly-runtime", name);
    pauseScript(script);
  }
  if (script.textContent !== code) script.textContent = code;
  // Always last in <body>, so everything it looks for already exists when it runs
  if (doc.body.lastElementChild !== script) doc.body.appendChild(script);
}

/** The script that makes countdown blocks tick. */
export function ensureCountdownScript(doc: Document) {
  ensureScript(doc, "countdown", COUNTDOWN_JS);
}

/** The script behind pages, popups and click actions. Added when the page uses any of them. */
export function ensureSiteScript(doc: Document) {
  const used = doc.querySelector(
    "[data-storyly-page], [data-storyly-popup], [data-storyly-action], [data-storyly-form], [data-storyly-music]",
  );
  const script = doc.querySelector('script[data-storyly-runtime="site"]');
  if (used) ensureScript(doc, "site", SITE_JS);
  else script?.remove();
}
