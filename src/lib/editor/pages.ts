// Pages and popups inside one template document.
//
//   <body>
//     <section data-storyly-page="home" data-storyly-name="Home">…</section>   the first page opens first
//     <section data-storyly-page="rsvp" data-storyly-name="RSVP">…</section>
//     <div data-storyly-popup="thanks" data-storyly-name="Thank you">            popups live at the body level
//       <div data-storyly-popup-box>…</div>
//     </div>
//   </body>
//
// A template without pages is one page (its whole body). The first "Add page" turns the existing
// content into the "Home" page. The saved page's script (see runtime.ts) shows one page at a time.

export const PAGE_ATTR = "data-storyly-page";
export const POPUP_ATTR = "data-storyly-popup";
export const NAME_ATTR = "data-storyly-name";

/** Elements that are page furniture, not content: they stay outside the pages. */
const OUTSIDE_PAGES = "script, style, link, noscript, template, [data-storyly-popup]";

export type Part = { id: string; name: string; el: HTMLElement };

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30) || "page";

function uniqueId(doc: Document, attr: string, name: string) {
  const base = slug(name);
  let id = base;
  for (let n = 2; doc.querySelector(`[${attr}="${id}"]`); n++) id = `${base}-${n}`;
  return id;
}

function parts(doc: Document, attr: string): Part[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(`[${attr}]`)).map((el) => ({
    id: el.getAttribute(attr)!,
    name: el.getAttribute(NAME_ATTR) || el.getAttribute(attr)!,
    el,
  }));
}

export const listPages = (doc: Document) => parts(doc, PAGE_ATTR);
export const listPopups = (doc: Document) => parts(doc, POPUP_ATTR);

/** Turns a single-page template into "Home" (all its content), if it is not split into pages yet. */
export function ensurePages(doc: Document) {
  if (doc.querySelector(`[${PAGE_ATTR}]`)) return;
  const home = doc.createElement("div");
  home.setAttribute(PAGE_ATTR, "home");
  home.setAttribute(NAME_ATTR, "Home");
  const content = Array.from(doc.body.childNodes).filter(
    (n) => !(n.nodeType === 1 && (n as Element).matches(OUTSIDE_PAGES)),
  );
  home.append(...content);
  doc.body.prepend(home);
}

const BLANK_PAGE = (name: string) =>
  `<section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:64px 24px;text-align:center"><h1 style="margin:0;font-size:48px;line-height:1.1">${name}</h1><p style="margin:0;max-width:560px;font-size:18px;line-height:1.7;opacity:.75">Add blocks from the Insert panel.</p></section>`;

export function addPage(doc: Document, name: string, after?: HTMLElement) {
  ensurePages(doc);
  const page = doc.createElement("div");
  page.setAttribute(PAGE_ATTR, uniqueId(doc, PAGE_ATTR, name));
  page.setAttribute(NAME_ATTR, name);
  page.innerHTML = BLANK_PAGE(name.replace(/[<>&]/g, ""));
  const pages = listPages(doc);
  (after ?? pages[pages.length - 1].el).after(page);
  return page;
}

export function duplicatePage(doc: Document, page: HTMLElement) {
  const name = `${page.getAttribute(NAME_ATTR) || "Page"} copy`;
  const copy = page.cloneNode(true) as HTMLElement;
  // Ids and editable parts must stay unique
  for (const node of [copy, ...Array.from(copy.querySelectorAll("*"))]) {
    for (const attr of ["id", "data-storyly-id", "data-storyly-slot", "data-storyly-label"]) node.removeAttribute(attr);
  }
  copy.setAttribute(PAGE_ATTR, uniqueId(doc, PAGE_ATTR, name));
  copy.setAttribute(NAME_ATTR, name);
  page.after(copy);
  return copy;
}

/** Moves a page one place up or down (the first page is the one that opens first). */
export function movePage(page: HTMLElement, step: -1 | 1) {
  const sibling = (step < 0 ? page.previousElementSibling : page.nextElementSibling) as HTMLElement | null;
  if (!sibling?.hasAttribute(PAGE_ATTR)) return false;
  if (step < 0) sibling.before(page);
  else sibling.after(page);
  return true;
}

export function makeHome(doc: Document, page: HTMLElement) {
  listPages(doc)[0].el.before(page);
}

export function addPopup(doc: Document, name: string) {
  const popup = doc.createElement("div");
  popup.setAttribute(POPUP_ATTR, uniqueId(doc, POPUP_ATTR, name));
  popup.setAttribute(NAME_ATTR, name);
  popup.innerHTML = `<div data-storyly-popup-box style="width:100%;max-width:440px;padding:36px 32px;border-radius:24px;background:#fff;color:#18181b;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.35)"><button data-storyly-action="close" aria-label="Close" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:999px;background:rgba(0,0,0,.06);font-size:18px;line-height:1">×</button><h3 style="margin:0 0 10px;font-size:26px">${name.replace(/[<>&]/g, "")}</h3><p style="margin:0 0 22px;line-height:1.7;opacity:.75">Write your message here.</p><button data-storyly-action="close" style="padding:12px 26px;border:0;border-radius:999px;background:#18181b;color:#fff;font-weight:600">Got it</button></div>`;
  doc.body.append(popup);
  return popup;
}

/** Removes a page or popup, and every click action that pointed at it. */
export function removePart(doc: Document, el: HTMLElement) {
  const isPage = el.hasAttribute(PAGE_ATTR);
  const id = el.getAttribute(isPage ? PAGE_ATTR : POPUP_ATTR);
  el.remove();
  doc
    .querySelectorAll(`[data-storyly-action="${isPage ? "page" : "popup"}"][data-storyly-target="${id}"]`)
    .forEach((n) => {
      n.removeAttribute("data-storyly-action");
      n.removeAttribute("data-storyly-target");
    });
}

export const isPart = (el: Element) => el.hasAttribute(PAGE_ATTR) || el.hasAttribute(POPUP_ATTR);

/**
 * Shows one page (and optionally one open popup) in the editor's canvas. Editor-only attributes,
 * removed when saving. Returns the element the canvas is showing (popup box, page, or body).
 */
export function applyView(doc: Document, view: { page: string | null; popup: string | null }) {
  const pages = listPages(doc);
  const page = pages.find((p) => p.id === view.page) ?? pages[0];
  for (const p of pages) p.el.toggleAttribute("data-sl-current", p === page);
  let popupEl: HTMLElement | null = null;
  for (const p of listPopups(doc)) {
    const open = p.id === view.popup;
    p.el.toggleAttribute("data-sl-open", open);
    if (open) popupEl = p.el;
  }
  return popupEl ?? page?.el ?? doc.body;
}

/** Elements a "scroll to" action can point at: the sections of a page. */
export function scrollTargets(root: HTMLElement) {
  return Array.from(root.children).filter((c): c is HTMLElement => !c.matches(OUTSIDE_PAGES) && c.tagName !== "BR");
}
