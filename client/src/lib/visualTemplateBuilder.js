/**
 * Visual template builder → HTML (data-slot, data-page, data-nav-page).
 * Stored copy: structure.builderState for re-opening in the admin UI.
 */

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Safe subset for CSS values (hex, rgb, named colors) — blocks obvious injection */
function escapeCss(val) {
  const s = String(val ?? '').trim();
  if (!s) return 'inherit';
  if (/[;{}<>]/.test(s)) return 'inherit';
  return s.slice(0, 220);
}

function placeholderDataUri(label) {
  const text = encodeURIComponent(String(label || 'Add media'));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#374151'/><stop offset='100%' stop-color='#111827'/></linearGradient><filter id='b'><feGaussianBlur stdDeviation='16'/></filter></defs><rect width='600' height='360' fill='url(#g)'/><circle cx='120' cy='90' r='90' fill='#ffffff22' filter='url(#b)'/><circle cx='480' cy='280' r='120' fill='#a855f722' filter='url(#b)'/><text x='300' y='190' font-size='28' fill='#e5e7eb' text-anchor='middle' font-family='system-ui, sans-serif'>${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

export function uid() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultTheme() {
  return {
    pageBackground: '#111827',
    textColor: '#f9fafb',
    headingColor: '',
    buttonBackground: '#ffffff',
    buttonText: '#111827',
    buttonRadius: 24,
    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
    /** solid | gradient | image | video */
    backgroundKind: 'solid',
    gradientFrom: '#111827',
    gradientTo: '#4f46e5',
    gradientAngle: 135,
    backgroundImageUrl: '',
    backgroundVideoUrl: '',
    /** none | fade | slideUp | zoom | drift */
    pageAnimation: 'none',
  };
}

/** https URL only, for CSS url() */
export function escapeCssUrl(val) {
  const s = String(val ?? '').trim();
  if (!s || /[;{}<>]/.test(s)) return '';
  if (!/^https:\/\//i.test(s)) return '';
  return s.slice(0, 900);
}

const GOOGLE_FONT_LINKS = {
  '"Inter", system-ui, sans-serif':
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  '"DM Sans", system-ui, sans-serif':
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&display=swap',
  '"Playfair Display", Georgia, serif':
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
  '"Merriweather", Georgia, serif':
    'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
  '"Lora", Georgia, serif': 'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap',
  '"Quicksand", system-ui, sans-serif':
    'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap',
  '"Nunito", system-ui, sans-serif': 'https://fonts.googleapis.com/css2?family=Nunito:wght@500;700&display=swap',
};

export function googleFontLinkForTheme(theme) {
  const ff = theme?.fontFamily;
  if (!ff) return '';
  return GOOGLE_FONT_LINKS[ff] || '';
}

/** Collect Google Fonts needed for global theme + each page’s effective look */
export function googleFontLinksForBuilderState(normalized) {
  const g = normalized?.theme || defaultTheme();
  const families = new Set();
  const add = (ff) => {
    if (ff && GOOGLE_FONT_LINKS[ff]) families.add(ff);
  };
  add(g.fontFamily);
  (normalized?.pages || []).forEach((p) => {
    add(effectivePageTheme(p, g).fontFamily);
  });
  const hrefs = [...families].map((ff) => GOOGLE_FONT_LINKS[ff]).filter(Boolean);
  return [...new Set(hrefs)];
}

/** Merge global theme with per-page typography (empty page field = inherit global). */
export function effectivePageTheme(page, globalTheme) {
  const g = { ...defaultTheme(), ...globalTheme };
  const keys = [
    'textColor',
    'headingColor',
    'buttonBackground',
    'buttonText',
    'buttonRadius',
    'fontFamily',
    'pageAnimation',
  ];
  const out = { ...g };
  keys.forEach((k) => {
    const pv = page[k];
    if (pv === undefined || pv === null) return;
    if (k === 'buttonRadius') {
      if (pv === '' || pv === false) return;
      const n = Number(pv);
      if (!Number.isNaN(n)) out[k] = n;
      return;
    }
    if (String(pv).trim() === '') return;
    out[k] = pv;
  });
  return out;
}

/** Shared with admin builder + user “my page look” panel */
export const BUILDER_FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, Segoe UI, sans-serif', label: 'System UI' },
  { value: '"Inter", system-ui, sans-serif', label: 'Inter' },
  { value: '"DM Sans", system-ui, sans-serif', label: 'DM Sans' },
  { value: '"Playfair Display", Georgia, serif', label: 'Playfair Display' },
  { value: '"Merriweather", Georgia, serif', label: 'Merriweather' },
  { value: '"Lora", Georgia, serif', label: 'Lora' },
  { value: '"Quicksand", system-ui, sans-serif', label: 'Quicksand' },
  { value: '"Nunito", system-ui, sans-serif', label: 'Nunito' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia (system)' },
  { value: '"Segoe UI", Roboto, sans-serif', label: 'Segoe / Roboto' },
];

export const BG_KIND_OPTIONS = [
  { value: 'solid', label: 'Solid color' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'image', label: 'Image (URL)' },
  { value: 'video', label: 'Video (URL)' },
];

export const PAGE_ANIM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade' },
  { value: 'slideUp', label: 'Slide up' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'drift', label: 'Drift' },
];

/** Instagram-style countdown: at target local time, show celebration message + effect */
export function defaultScheduledReveal() {
  return {
    enabled: false,
    /** datetime-local value e.g. 2026-03-26T00:00 — interpreted as viewer's local time */
    targetLocal: '',
    title: 'Countdown',
    subtitleBefore: 'Something special is coming…',
    messageAfter: '🎉 Happy Birthday! 🎂',
    /** none | pulse | bounce | glow | shake | confetti */
    effectAfter: 'pulse',
    /** If true, visitors see only fullscreen countdown until target time; then story. Admin preview still shows story for editing. */
    hideStoryUntilReveal: false,
  };
}

export function defaultVisualBuilderState() {
  return {
    version: 2,
    siteTitle: 'My Storyly page',
    theme: defaultTheme(),
    scheduledReveal: defaultScheduledReveal(),
    pages: [
      {
        id: uid(),
        pageTitle: 'Page 1 — Welcome',
        pageBackground: '',
        blocks: [
          { type: 'heading', text: '🎉 Happy Birthday 🎂' },
          { type: 'text', text: 'Ek chhota sa surprise hai 💖' },
          { type: 'button', label: 'Aage Jao ➡️', navPage: 2, buttonStyle: 'stable' },
        ],
      },
      {
        id: uid(),
        pageTitle: 'Page 2 — Photos',
        pageBackground: '',
        blocks: [
          { type: 'heading', text: 'Memories 📸' },
          { type: 'gallery', count: 4, slotPrefix: 'g1' },
          { type: 'button', label: 'Next ➡️', navPage: 3, buttonStyle: 'float' },
        ],
      },
      {
        id: uid(),
        pageTitle: 'Page 3 — Message',
        pageBackground: '',
        blocks: [
          { type: 'heading', text: '💌 Message' },
          { type: 'text', text: 'Your message here…' },
        ],
      },
    ],
  };
}

function normalizeButtonStyle(s) {
  if (s === 'float' || s === 'dodge') return s;
  return 'stable';
}

function migrateLayerStyle(block) {
  const rotate = Number(block?.rotateDeg);
  const mediaRadius = Number(block?.mediaRadius);
  const x = Number(block?.x);
  const y = Number(block?.y);
  return {
    ...block,
    rotateDeg: Number.isFinite(rotate) ? Math.max(-180, Math.min(180, rotate)) : 0,
    x: Number.isFinite(x) ? x : '',
    y: Number.isFinite(y) ? y : '',
    mediaFit: block?.mediaFit === 'contain' || block?.mediaFit === 'fill' ? block.mediaFit : 'cover',
    mediaRadius: Number.isFinite(mediaRadius) ? Math.max(0, Math.min(80, mediaRadius)) : 12,
    mediaShadow: block?.mediaShadow === false ? false : true,
    galleryDefaults: block?.galleryDefaults && typeof block.galleryDefaults === 'object' ? block.galleryDefaults : {},
    laneDurationSec: Number.isFinite(Number(block?.laneDurationSec)) ? Math.max(4, Math.min(60, Number(block.laneDurationSec))) : 14,
  };
}

function migrateBlock(b) {
  if (!b || typeof b !== 'object') return { type: 'text', text: '' };
  const t = b.type;
  if (t === 'button' || t === 'buttonSlot') {
    return migrateLayerStyle({ ...b, buttonStyle: normalizeButtonStyle(b.buttonStyle) });
  }
  if (t === 'buttons') {
    const buttons = (b.buttons || []).map((x) => ({
      ...x,
      buttonStyle: normalizeButtonStyle(x.buttonStyle),
    }));
    return migrateLayerStyle({ ...b, buttons });
  }
  return migrateLayerStyle(b);
}

function normalizeScheduledReveal(sr) {
  const d = defaultScheduledReveal();
  if (!sr || typeof sr !== 'object') return d;
  const eff = sr.effectAfter;
  return {
    ...d,
    enabled: Boolean(sr.enabled),
    targetLocal: typeof sr.targetLocal === 'string' ? sr.targetLocal.slice(0, 32) : '',
    title: typeof sr.title === 'string' ? sr.title.slice(0, 80) : d.title,
    subtitleBefore: typeof sr.subtitleBefore === 'string' ? sr.subtitleBefore.slice(0, 200) : d.subtitleBefore,
    messageAfter: typeof sr.messageAfter === 'string' ? sr.messageAfter.slice(0, 300) : d.messageAfter,
    effectAfter: ['none', 'pulse', 'bounce', 'glow', 'shake', 'confetti'].includes(eff) ? eff : d.effectAfter,
    hideStoryUntilReveal: Boolean(sr.hideStoryUntilReveal),
  };
}

/** Merge older saved state with defaults (theme, button styles, page backgrounds). */
export function normalizeBuilderState(raw) {
  const base = defaultVisualBuilderState();
  if (!raw || typeof raw !== 'object') return base;

  const baseDef = defaultTheme();
  const rawTheme = raw.theme && typeof raw.theme === 'object' ? raw.theme : {};
  const theme = { ...baseDef, ...rawTheme };
  // Saved drafts sometimes store "" for colors; don't let that wipe defaults (preview looked empty).
  Object.keys(baseDef).forEach((k) => {
    if (theme[k] === '' && baseDef[k] !== '' && baseDef[k] != null) {
      theme[k] = baseDef[k];
    }
  });
  const scheduledReveal = normalizeScheduledReveal(raw.scheduledReveal);
  let pages = raw.pages;
  if (!Array.isArray(pages) || pages.length === 0) {
    return { ...base, siteTitle: raw.siteTitle || base.siteTitle, theme, scheduledReveal };
  }

  pages = pages.map((p) => ({
    id: p.id || uid(),
    pageTitle: p.pageTitle || 'Page',
    /** Auto-advance to next page after N ms (0 / empty = off). Used in preview & published deck. */
    pageDurationMs:
      p.pageDurationMs === '' || p.pageDurationMs === undefined || p.pageDurationMs === null
        ? ''
        : Math.min(120000, Math.max(0, Number(p.pageDurationMs) || 0)),
    pageBackground: typeof p.pageBackground === 'string' ? p.pageBackground : '',
    pageImageUrl: typeof p.pageImageUrl === 'string' ? p.pageImageUrl : '',
    pageVideoUrl: typeof p.pageVideoUrl === 'string' ? p.pageVideoUrl : '',
    textColor: typeof p.textColor === 'string' ? p.textColor : '',
    headingColor: typeof p.headingColor === 'string' ? p.headingColor : '',
    buttonBackground: typeof p.buttonBackground === 'string' ? p.buttonBackground : '',
    buttonText: typeof p.buttonText === 'string' ? p.buttonText : '',
    buttonRadius: p.buttonRadius === '' || p.buttonRadius === undefined || p.buttonRadius === null ? '' : Number(p.buttonRadius),
    fontFamily: typeof p.fontFamily === 'string' ? p.fontFamily : '',
    pageAnimation: typeof p.pageAnimation === 'string' ? p.pageAnimation : '',
    blocks: (p.blocks || []).map(migrateBlock),
  }));

  return {
    version: 2,
    siteTitle: raw.siteTitle || base.siteTitle,
    theme,
    scheduledReveal,
    pages,
  };
}

function slotId(pageIndex, rest) {
  return `p${pageIndex + 1}_${rest}`;
}

function buttonClass(style) {
  if (style === 'float') return 'tpl-btn tpl-btn-float';
  if (style === 'dodge') return 'tpl-btn tpl-btn-dodge';
  return 'tpl-btn tpl-btn-stable';
}

function buttonInlineStyle(block, theme) {
  const bg = block.buttonBg || theme.buttonBackground;
  const fg = block.buttonText || theme.buttonText;
  const r = Number(theme.buttonRadius) || 24;
  return `background:${escapeCss(bg)};color:${escapeCss(fg)};border-radius:${r}px`;
}

function layerStyle(block) {
  const deg = Number(block?.rotateDeg);
  const rotate = Number.isFinite(deg) ? Math.max(-180, Math.min(180, deg)) : 0;
  const x = Number(block?.x);
  const y = Number(block?.y);
  const pos =
    Number.isFinite(x) && Number.isFinite(y)
      ? `position:absolute;left:${Math.round(x)}px;top:${Math.round(y)}px;`
      : '';
  return `${rotate ? `transform:rotate(${rotate}deg);transform-origin:center;` : ''}${pos}${
    rotate || pos ? 'display:inline-block;' : ''
  }`;
}

function mediaStyle(block, defaults) {
  const fit = block?.mediaFit === 'contain' || block?.mediaFit === 'fill' ? block.mediaFit : 'cover';
  const rad = Number(block?.mediaRadius);
  const radius = Number.isFinite(rad) ? Math.max(0, Math.min(80, rad)) : 12;
  const shadow = block?.mediaShadow === false ? 'none' : '0 10px 26px rgba(0,0,0,0.28)';
  const rotate = layerStyle(block);
  return `${defaults};object-fit:${fit};border-radius:${radius}px;box-shadow:${shadow};${rotate}`;
}

function renderBlock(block, pageIndex, blockIndex, theme) {
  const sid = (suffix) => slotId(pageIndex, suffix);
  const bslot = `p${pageIndex + 1}_b${blockIndex}`;

  switch (block.type) {
    case 'heading':
      return `<h1 data-block-slot="${bslot}" data-text-slot="${sid(`h_${blockIndex}`)}" data-slot-label="Heading" style="${layerStyle(block)}">${escapeHtml(block.text)}</h1>`;
    case 'subheading':
      return `<div data-block-slot="${bslot}" style="${layerStyle(block)}"><h2 data-text-slot="${sid(`h2_${blockIndex}`)}" data-slot-label="Subheading">${escapeHtml(block.text)}</h2>${
        block.songUrl ? `<audio src="${escapeHtml(block.songUrl)}" controls style="margin-top:8px;max-width:280px"></audio>` : ''
      }</div>`;
    case 'text':
      return `<p data-block-slot="${bslot}" data-text-slot="${sid(`t_${blockIndex}`)}" data-slot-label="Text" style="${layerStyle(block)}">${escapeHtml(block.text).replace(/\n/g, '<br/>')}</p>`;
    case 'image':
      return `<img data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `img_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'Image')}" src="${escapeHtml(block.defaultUrl || placeholderDataUri('Add photo'))}" alt="" style="${mediaStyle(block, 'max-width:280px;margin:8px 0')}" />`;
    case 'gif':
      return `<img data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `gif_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'GIF')}" src="${escapeHtml(block.defaultUrl || placeholderDataUri('Add GIF'))}" alt="" style="${mediaStyle(block, 'max-width:280px;margin:8px 0')}" />`;
    case 'video':
      return `<video data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `vid_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'Video')}" src="${escapeHtml(block.defaultUrl || '')}" poster="${escapeHtml(placeholderDataUri('Add video'))}" controls style="${mediaStyle(block, 'max-width:320px;margin:8px 0')}" playsinline></video>`;
    case 'gallery': {
      const n = Math.min(12, Math.max(1, Number(block.count) || 4));
      const prefix = block.slotPrefix || `gal${pageIndex}`;
      const anim = block.galleryAnimation || 'fade';
      const photoMs = Math.min(8000, Math.max(500, Number(block.photoDurationMs) || 1200));
      const size = n >= 10 ? 64 : n >= 8 ? 76 : n >= 6 ? 88 : 110;
      const laneSec = Math.max(4, Math.min(60, Number(block.laneDurationSec) || 14));
      const galleryDefaults = block.galleryDefaults && typeof block.galleryDefaults === 'object' ? block.galleryDefaults : {};
      const imgs = [];
      for (let i = 0; i < n; i++) {
        const key = `${prefix}_${i}`;
        const src = galleryDefaults[key] || placeholderDataUri(`Photo ${i + 1}`);
        imgs.push(
          `<img class="tpl-g-item tpl-g-${anim}" data-slot="${sid(key)}" data-slot-label="Photo ${i + 1}" src="${escapeHtml(src)}" alt="" style="width:${size}px;height:${size}px;margin:6px;border-radius:10px;object-fit:cover" />`
        );
      }
      if (anim === 'lanes') {
        const left = imgs.filter((_, i) => i % 2 === 0).join('');
        const right = imgs.filter((_, i) => i % 2 === 1).join('');
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-lanes" style="${layerStyle(block)};--tpl-g-size:${size}px;--tpl-g-lane-ms:${laneSec}s">
  <div class="tpl-g-lane tpl-g-lane-left">${left || imgs.join('')}${left || imgs.join('')}</div>
  <div class="tpl-g-lane tpl-g-lane-right">${right || imgs.join('')}${right || imgs.join('')}</div>
</div>`;
      }
      if (anim === 'autoVertical') {
        const up = imgs.filter((_, i) => i % 2 === 0).join('');
        const down = imgs.filter((_, i) => i % 2 === 1).join('');
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-vscroll" data-gallery-total-ms="${n * photoMs}" style="${layerStyle(block)};--tpl-g-size:${size}px;--tpl-g-lane-ms:${laneSec}s">
  <div class="tpl-g-vlane tpl-g-vlane-up">${up || imgs.join('')}${up || imgs.join('')}</div>
  <div class="tpl-g-vlane tpl-g-vlane-down">${down || imgs.join('')}${down || imgs.join('')}</div>
</div>`;
      }
      if (anim === 'slideshow') {
        const totalMs = n * photoMs;
        const single = imgs.map((im) => im.replace(`tpl-g-${anim}`, 'tpl-g-single')).join('');
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-single-wrap" data-gallery-total-ms="${totalMs}" style="${layerStyle(block)};--tpl-g-photo-ms:${photoMs}ms;--tpl-g-count:${n}">
${single}
</div>`;
      }
      return `<div data-block-slot="${bslot}" class="gallery" style="display:flex;flex-wrap:wrap;justify-content:center;${layerStyle(block)}">${imgs.join('')}</div>`;
    }
    case 'button': {
      const target = block.navPage != null && block.navPage !== '' ? Number(block.navPage) : null;
      const np = target != null && !Number.isNaN(target) ? target : pageIndex + 2;
      const st = buttonInlineStyle(block, theme);
      const cls = buttonClass(block.buttonStyle);
      const showAfterGallery = block.showAfterGallery ? ' data-show-after-gallery="1"' : '';
      return `<button data-block-slot="${bslot}" type="button" class="${cls}" style="${st};${layerStyle(block)}" data-nav-page="${np}"${showAfterGallery}>${escapeHtml(block.label || 'Next')}</button>`;
    }
    case 'buttons': {
      const rows = (block.buttons || []).map((b) => {
        const target = b.navPage != null ? Number(b.navPage) : pageIndex + 2;
        const np = Number.isFinite(target) ? target : pageIndex + 2;
        const st = buttonInlineStyle(
          { buttonBg: b.buttonBg, buttonText: b.buttonText, buttonStyle: b.buttonStyle },
          theme
        );
        const cls = buttonClass(b.buttonStyle);
        return `<button type="button" class="${cls}" style="${st}" data-nav-page="${np}">${escapeHtml(b.label)}</button>`;
      });
      return `<div data-block-slot="${bslot}" class="btn-row" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:12px;${layerStyle(block)}">${rows.join(' ')}</div>`;
    }
    case 'buttonSlot': {
      const target = block.navPage != null ? Number(block.navPage) : pageIndex + 2;
      const st = buttonInlineStyle(block, theme);
      const cls = buttonClass(block.buttonStyle);
      return `<button data-block-slot="${bslot}" type="button" class="${cls}" style="${st};${layerStyle(block)}" data-button-slot="${sid(`btn_${blockIndex}`)}" data-nav-page="${target}" data-slot-label="${escapeHtml(block.labelHint || 'Button')}">${escapeHtml(block.defaultLabel || 'OK')}</button>`;
    }
    default:
      return '';
  }
}

function buildRootBackground(theme) {
  const kind = theme.backgroundKind || 'solid';
  const fb = escapeCss(theme.pageBackground || '#111827');
  if (kind === 'gradient') {
    const a = escapeCss(theme.gradientFrom || '#111827');
    const b = escapeCss(theme.gradientTo || '#4f46e5');
    const ang = Math.min(360, Math.max(0, Number(theme.gradientAngle) || 135));
    return `background:linear-gradient(${ang}deg, ${a}, ${b});`;
  }
  if (kind === 'image') {
    const u = escapeCssUrl(theme.backgroundImageUrl);
    if (!u) return `background:${fb};`;
    return `background-color:${fb};background-image:url(${JSON.stringify(u)});background-size:cover;background-position:center;`;
  }
  if (kind === 'video') {
    return `background:${fb};`;
  }
  return `background:${fb};`;
}

function buildThemeCss(theme) {
  const rootBg = buildRootBackground(theme);

  return `
.visual-template-root {
  margin:0; ${rootBg}
  overflow-x:hidden; overflow-y:auto; min-height:clamp(320px,65vh,720px); position:relative; box-sizing:border-box;
  font-family:system-ui,sans-serif; color:#e5e7eb;
}
.visual-template-root .page-inner { box-sizing:border-box; }
.visual-template-root .page-inner h1,
.visual-template-root .page-inner h2 { color: var(--tpl-h, inherit); }
.visual-template-root .tpl-root-video {
  position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none;
}
.visual-template-root .tpl-root-video video {
  width:100%; height:100%; object-fit:cover;
}
.visual-template-root .tpl-pages-stack {
  position:relative; z-index:1;
  min-height:clamp(320px,65vh,720px);
}
.visual-template-root .page {
  position:absolute; inset:0; display:none; flex-direction:column; align-items:center; justify-content:flex-start;
  text-align:center; padding:0; box-sizing:border-box;
  overflow-x:hidden; overflow-y:auto; -webkit-overflow-scrolling:touch;
}
.visual-template-root .page.active { display:flex; }
.visual-template-root .page-bg-media {
  position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none;
}
.visual-template-root .page-bg-media video {
  width:100%; height:100%; object-fit:cover;
}
.visual-template-root .page-bg-media.page-bg-img {
  background-size:cover; background-position:center;
}
.visual-template-root .page-inner {
  position:relative; z-index:1; width:100%; padding:24px 20px; box-sizing:border-box;
  display:flex; flex-direction:column; align-items:center; justify-content:flex-start;
  min-height:100%;
}
.visual-template-root .page.tpl-p-anim-fade.active .page-inner { animation: tpl-page-fade 0.65s ease forwards; }
.visual-template-root .page.tpl-p-anim-slideUp.active .page-inner { animation: tpl-page-slide 0.55s ease forwards; }
.visual-template-root .page.tpl-p-anim-zoom.active .page-inner { animation: tpl-page-zoom 0.5s ease forwards; }
.visual-template-root .page.tpl-p-anim-drift.active .page-inner { animation: tpl-page-drift 0.7s ease forwards; }
@keyframes tpl-page-fade { from { opacity:0 } to { opacity:1 } }
@keyframes tpl-page-slide { from { opacity:0; transform: translateY(18px) } to { opacity:1; transform: translateY(0) } }
@keyframes tpl-page-zoom { from { opacity:0; transform: scale(0.96) } to { opacity:1; transform: scale(1) } }
@keyframes tpl-page-drift { from { opacity:0.85; transform: translateY(6px) } to { opacity:1; transform: translateY(0) } }
@keyframes tpl-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.visual-template-root .tpl-btn {
  padding:12px 25px; margin-top:16px; border:none; cursor:pointer;
  font-weight:600; transition:transform 0.2s, box-shadow 0.2s;
  box-sizing:border-box;
}
.visual-template-root .tpl-btn-float {
  animation: tpl-float 2.6s ease-in-out infinite;
  box-shadow: 0 10px 28px rgba(0,0,0,0.28);
}
.visual-template-root .tpl-btn-stable:hover { transform:scale(1.05); }
.visual-template-root .tpl-btn-float:hover { transform: translateY(-2px) scale(1.03); }
.visual-template-root .tpl-btn-dodge {
  position: relative;
  z-index: 3;
  animation: none;
  box-shadow: 0 4px 14px rgba(0,0,0,0.18);
  will-change: transform;
  cursor: default;
}
.visual-template-root .tpl-btn-dodge:hover {
  filter: brightness(1.03);
}
.visual-template-root .tpl-g-item { box-shadow: 0 8px 18px rgba(0,0,0,0.24); }
.visual-template-root .tpl-g-fade { animation: tpl-g-fade 0.7s ease both; }
.visual-template-root .tpl-g-zoom { animation: tpl-g-zoom 0.7s ease both; }
.visual-template-root .tpl-g-slide { animation: tpl-g-slide 0.7s ease both; }
.visual-template-root .tpl-g-lanes {
  display:grid; grid-template-rows:1fr 1fr; gap:8px; width:min(92vw,340px); margin:8px auto;
}
.visual-template-root .tpl-g-lane { overflow:hidden; max-width:340px; display:flex; flex-direction:row; flex-wrap:nowrap; }
.visual-template-root .tpl-g-lane .tpl-g-item { width:var(--tpl-g-size,110px); height:var(--tpl-g-size,110px); margin:0 4px; flex:0 0 auto; }
.visual-template-root .tpl-g-lane-left { animation: tpl-lane-left var(--tpl-g-lane-ms,14s) linear infinite; }
.visual-template-root .tpl-g-lane-right { animation: tpl-lane-right var(--tpl-g-lane-ms,14s) linear infinite; }
.visual-template-root .tpl-g-vscroll {
  display:grid; grid-template-columns:1fr 1fr; gap:8px; width:min(92vw,340px); margin:8px auto; max-height:420px; overflow:hidden;
}
.visual-template-root .tpl-g-vlane { display:flex; flex-direction:column; }
.visual-template-root .tpl-g-vlane .tpl-g-item { width:100%; height:var(--tpl-g-size,110px); margin:4px 0; }
.visual-template-root .tpl-g-vlane-up { animation: tpl-vlane-up var(--tpl-g-lane-ms,12s) linear infinite; }
.visual-template-root .tpl-g-vlane-down { animation: tpl-vlane-down var(--tpl-g-lane-ms,12s) linear infinite; }
.visual-template-root .tpl-g-single-wrap {
  position:relative; width:min(92vw,320px); height:min(58vh,320px); margin:10px auto; overflow:hidden; border-radius:14px;
}
.visual-template-root .tpl-g-single-wrap .tpl-g-single {
  position:absolute; inset:0; width:100%; height:100%; margin:0; opacity:0;
  animation-name: tpl-single;
  animation-duration: calc(var(--tpl-g-photo-ms) * var(--tpl-g-count));
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(1) { animation-delay: calc(var(--tpl-g-photo-ms) * 0); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(2) { animation-delay: calc(var(--tpl-g-photo-ms) * 1); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(3) { animation-delay: calc(var(--tpl-g-photo-ms) * 2); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(4) { animation-delay: calc(var(--tpl-g-photo-ms) * 3); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(5) { animation-delay: calc(var(--tpl-g-photo-ms) * 4); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(6) { animation-delay: calc(var(--tpl-g-photo-ms) * 5); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(7) { animation-delay: calc(var(--tpl-g-photo-ms) * 6); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(8) { animation-delay: calc(var(--tpl-g-photo-ms) * 7); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(9) { animation-delay: calc(var(--tpl-g-photo-ms) * 8); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(10) { animation-delay: calc(var(--tpl-g-photo-ms) * 9); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(11) { animation-delay: calc(var(--tpl-g-photo-ms) * 10); }
.visual-template-root .tpl-g-single-wrap .tpl-g-single:nth-child(12) { animation-delay: calc(var(--tpl-g-photo-ms) * 11); }
@keyframes tpl-g-fade { from { opacity:0.2 } to { opacity:1 } }
@keyframes tpl-g-zoom { from { opacity:0.2; transform: scale(0.92) } to { opacity:1; transform: scale(1) } }
@keyframes tpl-g-slide { from { opacity:0.2; transform: translateY(12px) } to { opacity:1; transform: translateY(0) } }
/* Use -50% with duplicated content => seamless infinite marquee loop */
@keyframes tpl-lane-left { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes tpl-lane-right { from { transform: translateX(-50%) } to { transform: translateX(0) } }
@keyframes tpl-vlane-up { from { transform: translateY(0) } to { transform: translateY(-50%) } }
@keyframes tpl-vlane-down { from { transform: translateY(-50%) } to { transform: translateY(0) } }
@keyframes tpl-single {
  0% { opacity:0 }
  8% { opacity:1 }
  92% { opacity:1 }
  100% { opacity:0 }
}
`;
}

/**
 * Full HTML document with .page sections (button navigation). Scripts omitted — use data-nav-page.
 */
const ANIM_CLASS = {
  none: '',
  fade: 'tpl-anim-fade',
  slideUp: 'tpl-anim-slideUp',
  zoom: 'tpl-anim-zoom',
  drift: 'tpl-anim-drift',
};

function renderPageHtml(page, pi, globalTheme) {
  const pt = effectivePageTheme(page, globalTheme);
  const active = pi === 0 ? ' active' : '';
  const blocksHtml = (page.blocks || [])
    .map((b, bi) => renderBlock(b, pi, bi, pt))
    .join('\n');
  const title = escapeHtml(page.pageTitle || `Page ${pi + 1}`);
  const vi = escapeCssUrl(page.pageVideoUrl);
  const im = escapeCssUrl(page.pageImageUrl);
  let media = '';
  if (vi) {
    media = `<div class="page-bg-media"><video src="${escapeHtml(page.pageVideoUrl)}" autoplay muted loop playsinline></video></div>`;
  } else if (im) {
    media = `<div class="page-bg-media page-bg-img" style="background-image:url(${JSON.stringify(im)})"></div>`;
  }
  const pb = page.pageBackground?.trim();
  const pageStyle =
    pb && !vi && !im ? ` style="background:${escapeCss(pb)}"` : pb && (vi || im) ? ` style="background:${escapeCss(pb)}"` : '';

  const headCol = pt.headingColor?.trim() ? pt.headingColor : pt.textColor;
  const innerStyle = `color:${escapeCss(pt.textColor)};font-family:${escapeCss(pt.fontFamily)};--tpl-h:${escapeCss(headCol)}`;
  const animKey = pt.pageAnimation && ANIM_CLASS[pt.pageAnimation] !== undefined ? pt.pageAnimation : 'none';
  const animExtra = animKey !== 'none' ? ` tpl-p-anim-${animKey}` : '';
  const dur = Number(page.pageDurationMs);
  const durAttr =
    Number.isFinite(dur) && dur > 0 ? ` data-page-duration-ms="${Math.min(120000, Math.floor(dur))}"` : '';

  return `<div class="page${active}${animExtra}" id="page${pi + 1}" data-page data-page-title="${title}"${durAttr}${pageStyle}>
${media}
<div class="page-inner" style="${innerStyle}">
${blocksHtml}
</div>
</div>`;
}

export function visualBuilderToHtml(state) {
  const normalized = normalizeBuilderState(state);
  const pages = normalized.pages || [];
  const siteTitle = escapeHtml(normalized.siteTitle || 'Page');
  const theme = normalized.theme || defaultTheme();

  const baseCss = buildThemeCss(theme);

  const rootVid =
    theme.backgroundKind === 'video' && escapeCssUrl(theme.backgroundVideoUrl)
      ? `<div class="tpl-root-video"><video src="${escapeHtml(theme.backgroundVideoUrl)}" autoplay muted loop playsinline></video></div>`
      : '';

  const bodyInner = pages.map((page, pi) => renderPageHtml(page, pi, theme)).join('\n');

  const fontHrefs = googleFontLinksForBuilderState(normalized);
  const fontLink =
    fontHrefs.length > 0
      ? `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />${fontHrefs.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}" />`).join('')}`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${siteTitle}</title>
  ${fontLink}
  <style>${baseCss}</style>
</head>
<body data-deck-mode="pages">
<div class="visual-template-root">
${rootVid}
<div class="tpl-pages-stack">
${bodyInner}
</div>
</div>
</body>
</html>`;
}

const OVERRIDE_TOP_KEYS = new Set(['pagePatches', 'siteTitle']);

function pickThemeOverrides(overrides) {
  if (!overrides || typeof overrides !== 'object') return {};
  const out = {};
  Object.entries(overrides).forEach(([k, v]) => {
    if (OVERRIDE_TOP_KEYS.has(k)) return;
    if (v === '' || v === null || v === undefined) return;
    out[k] = v;
  });
  return out;
}

const PAGE_PATCH_KEYS = [
  'pageDurationMs',
  'pageBackground',
  'pageImageUrl',
  'pageVideoUrl',
  'textColor',
  'headingColor',
  'buttonBackground',
  'buttonText',
  'buttonRadius',
  'fontFamily',
  'pageAnimation',
];

function mergePagePatches(pages, pagePatches) {
  if (!Array.isArray(pagePatches) || pagePatches.length === 0) return pages;
  return pages.map((p, i) => {
    const patch = pagePatches[i];
    if (!patch || typeof patch !== 'object') return p;
    const next = { ...p };
    PAGE_PATCH_KEYS.forEach((key) => {
      const val = patch[key];
      if (val === '' || val === null || val === undefined) return;
      next[key] = val;
    });
    return next;
  });
}

/** Prefer regenerating from saved builder state + optional user-only theme tweaks. */
export function resolveSlideshowHtml(structure, themeOverrides = {}) {
  if (!structure || structure.mode !== 'html') return structure?.html || '';
  if (structure.builderState && typeof structure.builderState === 'object') {
    const base = normalizeBuilderState(structure.builderState);
    const patch = pickThemeOverrides(themeOverrides);
    const mergedTheme = { ...base.theme, ...patch };
    let pages = base.pages;
    if (Array.isArray(themeOverrides.pagePatches)) {
      pages = mergePagePatches(base.pages, themeOverrides.pagePatches);
    }
    const st = typeof themeOverrides.siteTitle === 'string' && themeOverrides.siteTitle.trim()
      ? themeOverrides.siteTitle.trim().slice(0, 120)
      : base.siteTitle;
    return visualBuilderToHtml(
      normalizeBuilderState({ ...structure.builderState, siteTitle: st, theme: mergedTheme, pages })
    );
  }
  return structure.html || '';
}

export function validateBuilderState(state) {
  const n = normalizeBuilderState(state);
  if (!n?.pages?.length) return 'Add at least one page.';
  return null;
}

/**
 * Update heading/subheading/text block by generated text-slot id.
 * Slot format: p{page}_{h|h2|t}_{blockIndex}
 */
export function updateBuilderTextBySlot(state, slotIdRaw, nextTextRaw) {
  const normalized = normalizeBuilderState(state);
  const slotId = String(slotIdRaw || '').trim();
  const m = /^p(\d+)_(h2|h|t)_(\d+)$/.exec(slotId);
  if (!m) return normalized;

  const pageIndex = Number(m[1]) - 1;
  const blockIndex = Number(m[3]);
  if (!Number.isInteger(pageIndex) || !Number.isInteger(blockIndex)) return normalized;
  if (pageIndex < 0 || pageIndex >= normalized.pages.length) return normalized;

  const typeKey = m[2];
  const expectedType = typeKey === 'h' ? 'heading' : typeKey === 'h2' ? 'subheading' : 'text';
  const pages = [...normalized.pages];
  const page = pages[pageIndex];
  const blocks = [...(page.blocks || [])];
  const block = blocks[blockIndex];
  if (!block || block.type !== expectedType) return normalized;

  blocks[blockIndex] = { ...block, text: String(nextTextRaw ?? '') };
  pages[pageIndex] = { ...page, blocks };
  return { ...normalized, pages };
}

/** Update block position by block slot id p{page}_b{block} */
export function updateBuilderBlockPositionBySlot(state, blockSlotRaw, xRaw, yRaw) {
  const normalized = normalizeBuilderState(state);
  const m = /^p(\d+)_b(\d+)$/.exec(String(blockSlotRaw || '').trim());
  if (!m) return normalized;
  const pageIndex = Number(m[1]) - 1;
  const blockIndex = Number(m[2]);
  if (!Number.isInteger(pageIndex) || !Number.isInteger(blockIndex)) return normalized;
  const page = normalized.pages[pageIndex];
  if (!page) return normalized;
  const blocks = [...(page.blocks || [])];
  const block = blocks[blockIndex];
  if (!block) return normalized;
  const x = Number(xRaw);
  const y = Number(yRaw);
  blocks[blockIndex] = { ...block, x: Number.isFinite(x) ? Math.round(x) : '', y: Number.isFinite(y) ? Math.round(y) : '' };
  const pages = [...normalized.pages];
  pages[pageIndex] = { ...page, blocks };
  return { ...normalized, pages };
}
