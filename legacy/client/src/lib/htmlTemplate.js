/**
 * HTML templates: optional multi-page decks (.slide or [data-page]), slots, text, buttons.
 * Full <html> documents: <head> styles/links are preserved in the stored fragment.
 */

function wrapAsHtml(raw) {
  const t = (raw || '').trim();
  if (!t) return '<!DOCTYPE html><html><head></head><body></body></html>';
  if (/^<!DOCTYPE|^<html[\s>]/i.test(t)) return t;
  return `<!DOCTYPE html><html><head></head><body>${t}</body></html>`;
}

export function parseHtmlToDocument(html) {
  const doc = new DOMParser().parseFromString(wrapAsHtml(html), 'text/html');
  return doc;
}

/** Head styles + links concatenated for injection beside body content */
function extractHeadFragment(doc) {
  const links = [...doc.head.querySelectorAll('link[rel="stylesheet"]')];
  const styles = [...doc.head.querySelectorAll('style')];
  return [...links, ...styles].map((el) => el.outerHTML).join('');
}

export function sanitizeHtmlTemplate(html) {
  const raw = (html || '').trim();
  if (!raw) return '';
  const doc = parseHtmlToDocument(raw);
  doc.querySelectorAll('script, iframe, object, embed').forEach((el) => el.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      const v = attr.value.trim().toLowerCase();
      if (attr.name.startsWith('on') || v.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  const headHtml = extractHeadFragment(doc);
  return headHtml + doc.body.innerHTML;
}

/**
 * Inline `<style>` in templates often targets `html` / `body`. When that fragment is injected
 * into a div, those selectors still match the real document `<body>` and can disable page scroll.
 * Rewrite root selectors to `.template-html-sandbox` (add that class on the preview wrapper).
 */
function scopeTemplateStyles(cssText) {
  if (!cssText || typeof cssText !== 'string') return cssText;
  let s = cssText;
  s = s.replace(/\bhtml\s*,\s*body\b/g, '.template-html-sandbox, .template-html-sandbox');
  s = s.replace(/\bbody\s*,\s*html\b/g, '.template-html-sandbox, .template-html-sandbox');
  s = s.replace(/\bhtml\s*\{/g, '.template-html-sandbox {');
  s = s.replace(/\bbody\s*\{/g, '.template-html-sandbox {');
  s = s.replace(/\bhtml\s*,/g, '.template-html-sandbox,');
  s = s.replace(/\bbody\s*,/g, '.template-html-sandbox,');
  s = s.replace(/\bhtml\s+/g, '.template-html-sandbox ');
  s = s.replace(/\bbody\s+/g, '.template-html-sandbox ');
  return s;
}

function getSlideRootElements(doc) {
  const body = doc.body;
  const pages = [...body.querySelectorAll('.page')];
  if (pages.length > 0) return pages;
  const directDataPage = [...body.children].filter((el) => el.hasAttribute('data-page'));
  if (directDataPage.length) return directDataPage;
  const anyDataPage = [...body.querySelectorAll('[data-page]')];
  if (anyDataPage.length) return anyDataPage;
  const slides = [...body.querySelectorAll('.slide')];
  if (slides.length) return slides;
  return [body];
}

function inferMediaKind(el) {
  const tag = el.tagName.toLowerCase();
  let kind = el.getAttribute('data-slot-kind')?.toLowerCase();
  if (kind && ['image', 'video', 'audio', 'text', 'button'].includes(kind)) return kind;
  if (tag === 'video') return 'video';
  if (tag === 'audio') return 'audio';
  if (tag === 'img') return 'image';
  return 'image';
}

/**
 * Extract flat slots + per-page groups for the template builder.
 */
export function extractSlotsFromHtmlDocument(html) {
  const doc = parseHtmlToDocument(html);
  const slideRoots = getSlideRootElements(doc);
  const flat = [];
  const seen = new Set();
  const pages = [];

  const addSpec = (spec) => {
    if (seen.has(spec.id)) {
      throw new Error(`Duplicate slot id "${spec.id}". Use unique ids across all pages.`);
    }
    seen.add(spec.id);
    flat.push(spec);
  };

  slideRoots.forEach((root, index) => {
    const pageSlots = [];

    root.querySelectorAll('[data-slot]').forEach((el) => {
      const id = el.getAttribute('data-slot');
      if (!id) return;
      const kind = inferMediaKind(el);
      const label = el.getAttribute('data-slot-label') || id;
      const spec = { id, kind, label };
      addSpec(spec);
      pageSlots.push(spec);
    });
    root.querySelectorAll('[data-text-slot]').forEach((el) => {
      const id = el.getAttribute('data-text-slot');
      if (!id) return;
      const spec = { id, kind: 'text', label: el.getAttribute('data-slot-label') || id };
      addSpec(spec);
      pageSlots.push(spec);
    });
    root.querySelectorAll('[data-button-slot]').forEach((el) => {
      const id = el.getAttribute('data-button-slot');
      if (!id) return;
      const spec = { id, kind: 'button', label: el.getAttribute('data-slot-label') || id };
      addSpec(spec);
      pageSlots.push(spec);
    });

    const title = root.getAttribute('data-page-title') || `Page ${index + 1}`;
    pages.push({ index, title, slots: pageSlots });
  });

  return { slots: flat, pages, slideCount: slideRoots.length };
}

/** Build stored structure from admin HTML */
export function htmlToStructure(html) {
  let sanitized;
  try {
    sanitized = sanitizeHtmlTemplate(html);
  } catch (e) {
    throw e;
  }
  let extracted;
  try {
    extracted = extractSlotsFromHtmlDocument(sanitized);
  } catch (e) {
    throw new Error(e.message || 'Invalid slot markup in HTML');
  }
  const docBody = parseHtmlToDocument(sanitized).body;
  const intervalAttr =
    docBody.getAttribute('data-deck-interval') ||
    docBody.querySelector('[data-deck-interval]')?.getAttribute('data-deck-interval');
  const autoMs = intervalAttr ? Math.max(500, parseInt(intervalAttr, 10) || 3000) : 3000;
  const pageEls = docBody.querySelectorAll('.page');
  const pageMode =
    docBody.getAttribute('data-deck-mode') === 'pages' || pageEls.length > 1;

  return {
    type: 'slideshow',
    mode: 'html',
    version: 2,
    html: sanitized,
    slots: extracted.slots,
    pages: extracted.pages,
    slideCount: extracted.slideCount,
    deck: {
      enabled: extracted.slideCount > 1,
      pageMode: pageMode && pageEls.length > 1,
      autoPlayMs: autoMs,
      autoPlay: pageMode && pageEls.length > 1 ? false : extracted.slideCount > 1,
    },
  };
}

/** Apply user fills to HTML (body fragment may include leading <style> from head) */
export function applySlotFillsToHtml(html, fills = {}) {
  const raw = (html || '').trim();
  if (!raw) return '';
  const doc = parseHtmlToDocument(raw);

  doc.querySelectorAll('[data-slot]').forEach((el) => {
    const id = el.getAttribute('data-slot');
    const kind = el.getAttribute('data-slot-kind')?.toLowerCase();
    if (kind === 'text') {
      const text = fills[id];
      if (text != null && text !== '') el.textContent = text;
      return;
    }
    const url = fills[id];
    if (url == null || String(url).trim() === '') return;
    const tag = el.tagName.toLowerCase();
    if (tag === 'img') {
      el.setAttribute('src', url);
      return;
    }
    if (tag === 'video') {
      el.setAttribute('src', url);
      return;
    }
    if (tag === 'audio') {
      el.setAttribute('src', url);
      return;
    }
    el.style.backgroundImage = `url(${JSON.stringify(url)})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.style.minHeight = el.style.minHeight || '200px';
  });

  doc.querySelectorAll('[data-text-slot]').forEach((el) => {
    const id = el.getAttribute('data-text-slot');
    const text = fills[id];
    if (text != null && text !== '') el.textContent = text;
  });

  doc.querySelectorAll('[data-button-slot]').forEach((el) => {
    const id = el.getAttribute('data-button-slot');
    const text = fills[id];
    if (text != null && text !== '') el.textContent = text;
  });

  doc.querySelectorAll('style').forEach((styleEl) => {
    styleEl.textContent = scopeTemplateStyles(styleEl.textContent);
  });

  const headHtml = extractHeadFragment(doc);
  return headHtml + doc.body.innerHTML;
}

/** When the parser misses `.page` nodes (rare malformed fragments), count class="…page…" in the raw string. */
function countPageDivsFromString(html) {
  const s = String(html);
  return (s.match(/\bclass\s*=\s*["'][^"']*\bpage\b[^"']*["']/gi) || []).length;
}

export function countSlidesInHtml(html) {
  if (!html || !String(html).trim()) return 0;
  const doc = parseHtmlToDocument(html);
  const domPages = doc.querySelectorAll('.page');
  if (domPages.length > 0) return domPages.length;
  const fromRegex = countPageDivsFromString(html);
  if (fromRegex > 0) return fromRegex;
  const roots = getSlideRootElements(doc);
  return Math.max(1, roots.length);
}
