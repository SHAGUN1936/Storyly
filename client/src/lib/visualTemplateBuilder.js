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
    /** Site-wide background music (https URL). Picked from MUSIC_LIBRARY or pasted. */
    audioUrl: '',
  };
}

/** ── Canva-style additions ──────────────────────────────────────── */

/** Instagram-style image filters → CSS filter string. */
export const FILTER_PRESETS = [
  { value: 'none',     label: 'Original' },
  { value: 'vivid',    label: 'Vivid' },
  { value: 'mono',     label: 'Mono' },
  { value: 'warm',     label: 'Warm' },
  { value: 'cool',     label: 'Cool' },
  { value: 'vintage',  label: 'Vintage' },
  { value: 'dramatic', label: 'Dramatic' },
  { value: 'mute',     label: 'Mute' },
  { value: 'sepia',    label: 'Sepia' },
  { value: 'noir',     label: 'Noir' },
  { value: 'blur',     label: 'Blur' },
];

export function cssFilterFor(name) {
  switch (name) {
    case 'vivid':    return 'saturate(1.45) contrast(1.1) brightness(1.05)';
    case 'mono':     return 'grayscale(1) contrast(1.05)';
    case 'warm':     return 'sepia(0.25) saturate(1.25) hue-rotate(-12deg)';
    case 'cool':     return 'saturate(1.15) hue-rotate(8deg) brightness(1.02)';
    case 'vintage':  return 'sepia(0.5) saturate(0.85) contrast(0.95) brightness(0.96)';
    case 'dramatic': return 'contrast(1.35) saturate(1.15) brightness(0.96)';
    case 'mute':     return 'saturate(0.65) brightness(1.02)';
    case 'sepia':    return 'sepia(1)';
    case 'noir':     return 'grayscale(1) contrast(1.3) brightness(0.95)';
    case 'blur':     return 'blur(3px)';
    case 'none':
    default:         return '';
  }
}

/** Per-block entrance animations (overrides page-level). */
export const ENTER_ANIM_PRESETS = [
  { value: 'none',       label: 'None' },
  { value: 'fadeIn',     label: 'Fade in' },
  { value: 'slideUp',    label: 'Slide up' },
  { value: 'slideDown',  label: 'Slide down' },
  { value: 'slideLeft',  label: 'Slide left' },
  { value: 'slideRight', label: 'Slide right' },
  { value: 'zoom',       label: 'Zoom' },
  { value: 'pop',        label: 'Pop' },
  { value: 'bounce',     label: 'Bounce' },
  { value: 'tilt',       label: 'Tilt in' },
];

/** Curated emoji sticker presets used in the picker. */
export const STICKER_PRESETS = [
  '🎉','🎂','💖','💕','✨','🪩','💫','⭐','🌟','🥳','💌','💍','🌸','🌷','🌺','🌈','🎈','🎁',
  '👀','😎','🥰','😘','🫶','🙌','👑','🔥','💯','🏆','📸','🎵','🎶','🍰','🍓','🍹','🍾','🥂',
  '🌙','☀','🪐','🌊','🦋','🦄','🐰','🐶','🐱','🍀','💐','💎','💝','💞','💓','💗','💜','🧡',
];

/** Basic shapes (rendered as inline SVG). */
export const SHAPE_PRESETS = [
  { value: 'rect',    label: 'Rectangle' },
  { value: 'circle',  label: 'Circle' },
  { value: 'pill',    label: 'Pill' },
  { value: 'heart',   label: 'Heart' },
  { value: 'star',    label: 'Star' },
  { value: 'blob',    label: 'Blob' },
  { value: 'speech',  label: 'Speech bubble' },
];

/** Curated, royalty-free or CC-0 friendly samples (small clips). */
export const MUSIC_LIBRARY = [
  { id: 'sample-a', name: 'Lo-fi Chill',  mood: 'chill',  url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_d1718ab41b.mp3' },
  { id: 'sample-b', name: 'Happy Pop',    mood: 'happy',  url: 'https://cdn.pixabay.com/audio/2022/03/19/audio_270f49b83a.mp3' },
  { id: 'sample-c', name: 'Cinematic',    mood: 'epic',   url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1eee.mp3' },
  { id: 'sample-d', name: 'Acoustic Love', mood: 'romantic', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_3bce5d65a5.mp3' },
];

/** https URL only, for CSS url() */
export function escapeCssUrl(val) {
  const s = String(val ?? '').trim();
  if (!s || /[;{}<>]/.test(s)) return '';
  if (!/^https:\/\//i.test(s)) return '';
  return s.slice(0, 900);
}

const GOOGLE_FONT_LINKS = {
  '"Inter", system-ui, sans-serif':            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
  '"DM Sans", system-ui, sans-serif':          'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap',
  '"Playfair Display", Georgia, serif':        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&display=swap',
  '"Merriweather", Georgia, serif':            'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
  '"Lora", Georgia, serif':                    'https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap',
  '"Quicksand", system-ui, sans-serif':        'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap',
  '"Nunito", system-ui, sans-serif':           'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;700;800&display=swap',
  '"Space Grotesk", system-ui, sans-serif':    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
  '"Outfit", system-ui, sans-serif':           'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap',
  '"Poppins", system-ui, sans-serif':          'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap',
  '"Montserrat", system-ui, sans-serif':       'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap',
  '"Raleway", system-ui, sans-serif':          'https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&display=swap',
  '"Bebas Neue", sans-serif':                  'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  '"Oswald", sans-serif':                      'https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap',
  '"Anton", sans-serif':                       'https://fonts.googleapis.com/css2?family=Anton&display=swap',
  '"Archivo Black", sans-serif':               'https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap',
  '"Caveat", cursive':                         'https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap',
  '"Pacifico", cursive':                       'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
  '"Dancing Script", cursive':                 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&display=swap',
  '"Satisfy", cursive':                        'https://fonts.googleapis.com/css2?family=Satisfy&display=swap',
  '"Great Vibes", cursive':                    'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
  '"Permanent Marker", cursive':               'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap',
  '"Press Start 2P", cursive':                 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  '"Bungee", cursive':                         'https://fonts.googleapis.com/css2?family=Bungee&display=swap',
  '"Righteous", cursive':                      'https://fonts.googleapis.com/css2?family=Righteous&display=swap',
  '"Fredoka", system-ui, sans-serif':          'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&display=swap',
  '"Comfortaa", system-ui, sans-serif':        'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap',
  '"Abril Fatface", serif':                    'https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap',
  '"Cormorant Garamond", serif':               'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap',
  '"Cinzel", serif':                           'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap',
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
  { value: 'system-ui, -apple-system, Segoe UI, sans-serif', label: 'System UI',         group: 'Clean' },
  { value: '"Inter", system-ui, sans-serif',                 label: 'Inter',             group: 'Clean' },
  { value: '"DM Sans", system-ui, sans-serif',               label: 'DM Sans',           group: 'Clean' },
  { value: '"Outfit", system-ui, sans-serif',                label: 'Outfit',            group: 'Clean' },
  { value: '"Poppins", system-ui, sans-serif',               label: 'Poppins',           group: 'Clean' },
  { value: '"Montserrat", system-ui, sans-serif',            label: 'Montserrat',        group: 'Clean' },
  { value: '"Raleway", system-ui, sans-serif',               label: 'Raleway',           group: 'Clean' },
  { value: '"Nunito", system-ui, sans-serif',                label: 'Nunito',            group: 'Clean' },
  { value: '"Quicksand", system-ui, sans-serif',             label: 'Quicksand',         group: 'Clean' },
  { value: '"Space Grotesk", system-ui, sans-serif',         label: 'Space Grotesk',     group: 'Clean' },
  { value: '"Fredoka", system-ui, sans-serif',               label: 'Fredoka',           group: 'Clean' },
  { value: '"Comfortaa", system-ui, sans-serif',             label: 'Comfortaa',         group: 'Clean' },
  { value: '"Playfair Display", Georgia, serif',             label: 'Playfair Display',  group: 'Elegant' },
  { value: '"Merriweather", Georgia, serif',                 label: 'Merriweather',      group: 'Elegant' },
  { value: '"Lora", Georgia, serif',                         label: 'Lora',              group: 'Elegant' },
  { value: '"Cormorant Garamond", serif',                    label: 'Cormorant',         group: 'Elegant' },
  { value: '"Cinzel", serif',                                label: 'Cinzel',            group: 'Elegant' },
  { value: '"Abril Fatface", serif',                         label: 'Abril Fatface',     group: 'Elegant' },
  { value: 'Georgia, "Times New Roman", serif',              label: 'Georgia',           group: 'Elegant' },
  { value: '"Bebas Neue", sans-serif',                       label: 'Bebas Neue',        group: 'Bold' },
  { value: '"Oswald", sans-serif',                           label: 'Oswald',            group: 'Bold' },
  { value: '"Anton", sans-serif',                            label: 'Anton',             group: 'Bold' },
  { value: '"Archivo Black", sans-serif',                    label: 'Archivo Black',     group: 'Bold' },
  { value: '"Bungee", cursive',                              label: 'Bungee',            group: 'Bold' },
  { value: '"Righteous", cursive',                           label: 'Righteous',         group: 'Bold' },
  { value: '"Caveat", cursive',                              label: 'Caveat',            group: 'Hand' },
  { value: '"Pacifico", cursive',                            label: 'Pacifico',          group: 'Hand' },
  { value: '"Dancing Script", cursive',                      label: 'Dancing Script',    group: 'Hand' },
  { value: '"Satisfy", cursive',                             label: 'Satisfy',           group: 'Hand' },
  { value: '"Great Vibes", cursive',                         label: 'Great Vibes',       group: 'Hand' },
  { value: '"Permanent Marker", cursive',                    label: 'Permanent Marker',  group: 'Hand' },
  { value: '"Press Start 2P", cursive',                      label: 'Press Start 2P',    group: 'Retro' },
];

/** ── Text effects ─────────────────────────────────────────── */
export const TEXT_EFFECT_PRESETS = [
  { value: 'none',       label: 'None' },
  { value: 'gradient',   label: 'Gradient' },
  { value: 'neon',       label: 'Neon' },
  { value: 'glow',       label: 'Glow' },
  { value: 'shadow',     label: 'Drop shadow' },
  { value: 'stroke',     label: 'Outline' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'blink',      label: 'Blink' },
];

const TEXT_EFFECT_SET = new Set(TEXT_EFFECT_PRESETS.map((p) => p.value));

/** Build CSS for a text-effect (returns combined style + optional extra class). */
export function textEffectStyle(block) {
  const fx = TEXT_EFFECT_SET.has(block?.textEffect) ? block.textEffect : 'none';
  const c1 = escapeCss(block?.textGradientFrom || '#f97316');
  const c2 = escapeCss(block?.textGradientTo   || '#d946ef');
  const ls = Number(block?.letterSpacingEm);
  const lh = Number(block?.lineHeight);
  const fw = Number(block?.fontWeight);
  let css = '';
  if (Number.isFinite(ls)) css += `letter-spacing:${Math.max(-0.1, Math.min(0.5, ls))}em;`;
  if (Number.isFinite(lh)) css += `line-height:${Math.max(0.8, Math.min(2.4, lh))};`;
  if (Number.isFinite(fw)) css += `font-weight:${Math.max(100, Math.min(900, fw))};`;
  switch (fx) {
    case 'gradient':
      css += `background-image:linear-gradient(120deg,${c1},${c2});-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;`;
      break;
    case 'neon':
      css += `color:${c1};text-shadow:0 0 4px #fff,0 0 8px ${c1},0 0 18px ${c2},0 0 36px ${c2};`;
      break;
    case 'glow':
      css += `text-shadow:0 0 12px ${c1},0 0 24px ${c2};`;
      break;
    case 'shadow':
      css += `text-shadow:0 6px 18px rgba(0,0,0,0.45);`;
      break;
    case 'stroke':
      css += `-webkit-text-stroke:2px ${c1};color:transparent;paint-order:stroke fill;`;
      break;
    default:
      break;
  }
  return css;
}

/** Class name for animated text effects (typewriter/blink). */
export function textEffectClass(block) {
  const fx = block?.textEffect;
  if (fx === 'typewriter') return 'tpl-tx-type';
  if (fx === 'blink')      return 'tpl-tx-blink';
  return '';
}

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

const ENTER_ANIM_SET = new Set(['none','fadeIn','slideUp','slideDown','slideLeft','slideRight','zoom','pop','bounce','tilt']);
const FILTER_SET = new Set(['none','vivid','mono','warm','cool','vintage','dramatic','mute','sepia','noir','blur']);

function migrateLayerStyle(block) {
  const rotate = Number(block?.rotateDeg);
  const mediaRadius = Number(block?.mediaRadius);
  const x = Number(block?.x);
  const y = Number(block?.y);
  const enterDelay = Number(block?.enterDelayMs);
  const bright = Number(block?.brightness);
  const contrast = Number(block?.contrast);
  const sat = Number(block?.saturation);
  const w = Number(block?.width);
  const h = Number(block?.height);
  return {
    ...block,
    rotateDeg: Number.isFinite(rotate) ? Math.max(-180, Math.min(180, rotate)) : 0,
    x: Number.isFinite(x) ? x : '',
    y: Number.isFinite(y) ? y : '',
    /** Explicit pixel size — set by on-canvas resize handles. Empty means "auto / use defaults". */
    width:  Number.isFinite(w) && w > 0 ? Math.max(8, Math.min(2000, Math.round(w))) : (block?.width === '' ? '' : (block?.width == null ? '' : block.width)),
    height: Number.isFinite(h) && h > 0 ? Math.max(8, Math.min(2000, Math.round(h))) : (block?.height === '' ? '' : (block?.height == null ? '' : block.height)),
    mediaFit: block?.mediaFit === 'contain' || block?.mediaFit === 'fill' ? block.mediaFit : 'cover',
    mediaRadius: Number.isFinite(mediaRadius) ? Math.max(0, Math.min(80, mediaRadius)) : 12,
    mediaShadow: block?.mediaShadow === false ? false : true,
    galleryDefaults: block?.galleryDefaults && typeof block.galleryDefaults === 'object' ? block.galleryDefaults : {},
    laneDurationSec: Number.isFinite(Number(block?.laneDurationSec)) ? Math.max(4, Math.min(60, Number(block.laneDurationSec))) : 14,
    imageFilter: FILTER_SET.has(block?.imageFilter) ? block.imageFilter : 'none',
    enterAnimation: ENTER_ANIM_SET.has(block?.enterAnimation) ? block.enterAnimation : 'none',
    enterDelayMs: Number.isFinite(enterDelay) ? Math.max(0, Math.min(3000, enterDelay)) : 0,
    /** Editor-only metadata: not rendered, controls UX. */
    locked: block?.locked === true,
    hidden: block?.hidden === true,
    /** Image adjustments: percentages where 100 = no change. */
    brightness: Number.isFinite(bright) ? Math.max(0, Math.min(300, bright)) : 100,
    contrast:   Number.isFinite(contrast) ? Math.max(0, Math.min(300, contrast)) : 100,
    saturation: Number.isFinite(sat) ? Math.max(0, Math.min(300, sat)) : 100,
  };
}

/** Inline width/height CSS for blocks with an explicit size set. */
function sizeStyle(block) {
  const w = Number(block?.width);
  const h = Number(block?.height);
  let s = '';
  if (Number.isFinite(w) && w > 0) s += `width:${Math.round(w)}px;`;
  if (Number.isFinite(h) && h > 0) s += `height:${Math.round(h)}px;`;
  return s;
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
  const delay = Number(block?.enterDelayMs);
  const delayCss = Number.isFinite(delay) && delay > 0 ? `animation-delay:${Math.min(3000, Math.max(0, delay))}ms;` : '';
  return `${rotate ? `transform:rotate(${rotate}deg);transform-origin:center;` : ''}${pos}${delayCss}${
    rotate || pos ? 'display:inline-block;' : ''
  }`;
}

/** CSS class string for per-block entrance animation. Returns '' for 'none' or missing. */
function enterAnimClass(block) {
  const a = block?.enterAnimation;
  if (!a || a === 'none' || !ENTER_ANIM_SET.has(a)) return '';
  return ` tpl-enter tpl-enter-${a}`;
}

function mediaStyle(block, defaults) {
  const fit = block?.mediaFit === 'contain' || block?.mediaFit === 'fill' ? block.mediaFit : 'cover';
  const rad = Number(block?.mediaRadius);
  const radius = Number.isFinite(rad) ? Math.max(0, Math.min(80, rad)) : 12;
  const shadow = block?.mediaShadow === false ? 'none' : '0 10px 26px rgba(0,0,0,0.28)';
  const rotate = layerStyle(block);
  const presetFilter = cssFilterFor(block?.imageFilter);
  const parts = [];
  if (presetFilter) parts.push(presetFilter);
  const b = Number(block?.brightness);
  const c = Number(block?.contrast);
  const s = Number(block?.saturation);
  if (Number.isFinite(b) && b !== 100) parts.push(`brightness(${Math.max(0, Math.min(300, b))}%)`);
  if (Number.isFinite(c) && c !== 100) parts.push(`contrast(${Math.max(0, Math.min(300, c))}%)`);
  if (Number.isFinite(s) && s !== 100) parts.push(`saturate(${Math.max(0, Math.min(300, s))}%)`);
  const filterCss = parts.length ? `filter:${parts.join(' ')};` : '';
  return `${defaults};object-fit:${fit};border-radius:${radius}px;box-shadow:${shadow};${filterCss}${rotate}`;
}

function renderBlock(block, pageIndex, blockIndex, theme) {
  const sid = (suffix) => slotId(pageIndex, suffix);
  const bslot = `p${pageIndex + 1}_b${blockIndex}`;
  const eA = enterAnimClass(block);

  switch (block.type) {
    case 'heading': {
      const tFx = textEffectStyle(block);
      const tCls = textEffectClass(block);
      const cls = (eA + (tCls ? ` ${tCls}` : '')).trim();
      return `<h1 data-block-slot="${bslot}" data-text-slot="${sid(`h_${blockIndex}`)}" data-slot-label="Heading"${cls ? ` class="${cls}"` : ''} style="${layerStyle(block)}${sizeStyle(block)}${tFx}">${escapeHtml(block.text)}</h1>`;
    }
    case 'subheading': {
      const tFx = textEffectStyle(block);
      const tCls = textEffectClass(block);
      const cls = (eA + (tCls ? ` ${tCls}` : '')).trim();
      return `<div data-block-slot="${bslot}"${eA ? ` class="${eA.trim()}"` : ''} style="${layerStyle(block)}${sizeStyle(block)}"><h2 data-text-slot="${sid(`h2_${blockIndex}`)}" data-slot-label="Subheading"${cls ? ` class="${cls}"` : ''} style="${tFx}">${escapeHtml(block.text)}</h2>${
        block.songUrl ? `<audio src="${escapeHtml(block.songUrl)}" controls style="margin-top:8px;max-width:280px"></audio>` : ''
      }</div>`;
    }
    case 'text': {
      const tFx = textEffectStyle(block);
      const tCls = textEffectClass(block);
      const cls = (eA + (tCls ? ` ${tCls}` : '')).trim();
      return `<p data-block-slot="${bslot}" data-text-slot="${sid(`t_${blockIndex}`)}" data-slot-label="Text"${cls ? ` class="${cls}"` : ''} style="${layerStyle(block)}${sizeStyle(block)}${tFx}">${escapeHtml(block.text).replace(/\n/g, '<br/>')}</p>`;
    }
    case 'image': {
      const dflt = sizeStyle(block) ? `${sizeStyle(block)}margin:8px 0` : 'max-width:280px;margin:8px 0';
      return `<img data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `img_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'Image')}"${eA ? ` class="${eA.trim()}"` : ''} src="${escapeHtml(block.defaultUrl || placeholderDataUri('Add photo'))}" alt="" style="${mediaStyle(block, dflt)}" />`;
    }
    case 'gif': {
      const dflt = sizeStyle(block) ? `${sizeStyle(block)}margin:8px 0` : 'max-width:280px;margin:8px 0';
      return `<img data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `gif_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'GIF')}"${eA ? ` class="${eA.trim()}"` : ''} src="${escapeHtml(block.defaultUrl || placeholderDataUri('Add GIF'))}" alt="" style="${mediaStyle(block, dflt)}" />`;
    }
    case 'video': {
      const dflt = sizeStyle(block) ? `${sizeStyle(block)}margin:8px 0` : 'max-width:320px;margin:8px 0';
      return `<video data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `vid_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'Video')}"${eA ? ` class="${eA.trim()}"` : ''} src="${escapeHtml(block.defaultUrl || '')}" poster="${escapeHtml(placeholderDataUri('Add video'))}" controls style="${mediaStyle(block, dflt)}" playsinline></video>`;
    }
    case 'sticker': {
      const size = Math.min(240, Math.max(20, Number(block.size) || 64));
      const e = escapeHtml(block.emoji || '✨');
      return `<span data-block-slot="${bslot}" data-slot-label="Sticker" class="tpl-sticker${eA}" style="font-size:${size}px;line-height:1;${layerStyle(block)}">${e}</span>`;
    }
    case 'shape': {
      const kind = SHAPE_PRESETS.find((s) => s.value === block.shapeKind)?.value || 'rect';
      const w = Math.min(800, Math.max(20, Number(block.width) || 140));
      const h = Math.min(800, Math.max(20, Number(block.height) || 140));
      const fill = escapeCss(block.fillColor || '#d946ef');
      const stroke = escapeCss(block.strokeColor || 'transparent');
      const strokeW = Math.min(20, Math.max(0, Number(block.strokeWidth) || 0));
      const op = Math.min(1, Math.max(0, Number.isFinite(Number(block.opacity)) ? Number(block.opacity) : 1));
      const svg = renderShapeSvg(kind, w, h, fill, stroke, strokeW);
      return `<span data-block-slot="${bslot}" data-slot-label="Shape" class="tpl-shape${eA}" style="display:inline-block;opacity:${op};${layerStyle(block)}">${svg}</span>`;
    }
    case 'countdown': {
      const tISO = typeof block.targetISO === 'string' ? block.targetISO.slice(0, 32) : '';
      const title = escapeHtml(block.title || 'Countdown to');
      const style = ['minimal','card','mega'].includes(block.style) ? block.style : 'card';
      const accent = escapeCss(block.accentColor || '#d946ef');
      const safeTarget = tISO ? tISO.replace(/"/g, '') : '';
      // Render labelled slots; HtmlSlideDeck will tick them every second.
      const cell = (lbl, key) =>
        `<div class="tpl-cd-cell"><span class="tpl-cd-num" data-cd-${key}>--</span><span class="tpl-cd-lbl">${lbl}</span></div>`;
      const body = `${cell('Days','d')}${cell('Hrs','h')}${cell('Min','m')}${cell('Sec','s')}`;
      return `<div data-block-slot="${bslot}" data-slot-label="Countdown" data-countdown-target="${escapeHtml(safeTarget)}" class="tpl-countdown tpl-cd-${style}${eA}" style="--tpl-cd-accent:${accent};${layerStyle(block)}"><div class="tpl-cd-title">${title}</div><div class="tpl-cd-grid">${body}</div></div>`;
    }
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
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-lanes${eA}" style="${layerStyle(block)};--tpl-g-size:${size}px;--tpl-g-lane-ms:${laneSec}s">
  <div class="tpl-g-lane tpl-g-lane-left">${left || imgs.join('')}${left || imgs.join('')}</div>
  <div class="tpl-g-lane tpl-g-lane-right">${right || imgs.join('')}${right || imgs.join('')}</div>
</div>`;
      }
      if (anim === 'autoVertical') {
        const up = imgs.filter((_, i) => i % 2 === 0).join('');
        const down = imgs.filter((_, i) => i % 2 === 1).join('');
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-vscroll${eA}" data-gallery-total-ms="${n * photoMs}" style="${layerStyle(block)};--tpl-g-size:${size}px;--tpl-g-lane-ms:${laneSec}s">
  <div class="tpl-g-vlane tpl-g-vlane-up">${up || imgs.join('')}${up || imgs.join('')}</div>
  <div class="tpl-g-vlane tpl-g-vlane-down">${down || imgs.join('')}${down || imgs.join('')}</div>
</div>`;
      }
      if (anim === 'slideshow') {
        const totalMs = n * photoMs;
        const single = imgs.map((im) => im.replace(`tpl-g-${anim}`, 'tpl-g-single')).join('');
        return `<div data-block-slot="${bslot}" class="gallery tpl-g-single-wrap${eA}" data-gallery-total-ms="${totalMs}" style="${layerStyle(block)};--tpl-g-photo-ms:${photoMs}ms;--tpl-g-count:${n}">
${single}
</div>`;
      }
      return `<div data-block-slot="${bslot}" class="gallery${eA}" style="display:flex;flex-wrap:wrap;justify-content:center;${layerStyle(block)}">${imgs.join('')}</div>`;
    }
    case 'button': {
      const target = block.navPage != null && block.navPage !== '' ? Number(block.navPage) : null;
      const np = target != null && !Number.isNaN(target) ? target : pageIndex + 2;
      const st = buttonInlineStyle(block, theme);
      const cls = buttonClass(block.buttonStyle);
      const showAfterGallery = block.showAfterGallery ? ' data-show-after-gallery="1"' : '';
      return `<button data-block-slot="${bslot}" type="button" class="${cls}${eA}" style="${st};${layerStyle(block)}" data-nav-page="${np}"${showAfterGallery}>${escapeHtml(block.label || 'Next')}</button>`;
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
      return `<div data-block-slot="${bslot}" class="btn-row${eA}" style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:12px;${layerStyle(block)}">${rows.join(' ')}</div>`;
    }
    case 'buttonSlot': {
      const target = block.navPage != null ? Number(block.navPage) : pageIndex + 2;
      const st = buttonInlineStyle(block, theme);
      const cls = buttonClass(block.buttonStyle);
      return `<button data-block-slot="${bslot}" type="button" class="${cls}${eA}" style="${st};${layerStyle(block)}" data-button-slot="${sid(`btn_${blockIndex}`)}" data-nav-page="${target}" data-slot-label="${escapeHtml(block.labelHint || 'Button')}">${escapeHtml(block.defaultLabel || 'OK')}</button>`;
    }
    default:
      return '';
  }
}

function renderShapeSvg(kind, w, h, fill, stroke, strokeW) {
  const s = strokeW > 0 ? `stroke="${stroke}" stroke-width="${strokeW}"` : '';
  if (kind === 'circle') {
    const r = Math.min(w, h) / 2 - strokeW;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><circle cx="${w/2}" cy="${h/2}" r="${r}" fill="${fill}" ${s} /></svg>`;
  }
  if (kind === 'pill') {
    const r = h / 2;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${strokeW/2}" y="${strokeW/2}" width="${w-strokeW}" height="${h-strokeW}" rx="${r}" ry="${r}" fill="${fill}" ${s} /></svg>`;
  }
  if (kind === 'heart') {
    return `<svg width="${w}" height="${h}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21s-7-4.35-7-10.5C5 7.46 7.46 5 10.5 5 12 5 13.36 5.7 14.2 6.86 15.04 5.7 16.4 5 17.9 5 20.95 5 23.4 7.46 23.4 10.5 23.4 16.65 16.4 21 16.4 21H12z" fill="${fill}" ${s} transform="translate(-2,0)" /></svg>`;
  }
  if (kind === 'star') {
    return `<svg width="${w}" height="${h}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="${fill}" ${s} /></svg>`;
  }
  if (kind === 'blob') {
    return `<svg width="${w}" height="${h}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><path d="M44.5,-58.8C57.4,-50.3,67.1,-36.8,71.5,-21.7C75.9,-6.6,75,9.9,68.5,23.2C62,36.4,49.9,46.4,36.6,55.7C23.3,65,8.7,73.5,-7.7,75.6C-24.2,77.7,-42.5,73.5,-54.1,62.6C-65.7,51.6,-70.4,33.9,-71.3,17.3C-72.2,0.8,-69.2,-14.7,-61.6,-27.5C-54,-40.3,-41.8,-50.4,-28.4,-58.2C-15,-66,-0.5,-71.5,12.7,-71.2C25.9,-71,40.6,-67.2,44.5,-58.8Z" transform="translate(100 100)" fill="${fill}" ${s} /></svg>`;
  }
  if (kind === 'speech') {
    return `<svg width="${w}" height="${h}" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><path d="M20,20 H180 a20,20 0 0 1 20,20 V100 a20,20 0 0 1 -20,20 H80 L50,150 V120 H20 a20,20 0 0 1 -20,-20 V40 a20,20 0 0 1 20,-20 z" fill="${fill}" ${s} /></svg>`;
  }
  // rect default
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${strokeW/2}" y="${strokeW/2}" width="${w-strokeW}" height="${h-strokeW}" rx="16" ry="16" fill="${fill}" ${s} /></svg>`;
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

/* ── Per-block entrance animations ───────────────────────────── */
.visual-template-root .page.active .tpl-enter { animation-duration: 0.7s; animation-fill-mode: both; animation-timing-function: ease; }
.visual-template-root .page.active .tpl-enter-fadeIn     { animation-name: tpl-en-fade; }
.visual-template-root .page.active .tpl-enter-slideUp    { animation-name: tpl-en-slideUp; }
.visual-template-root .page.active .tpl-enter-slideDown  { animation-name: tpl-en-slideDown; }
.visual-template-root .page.active .tpl-enter-slideLeft  { animation-name: tpl-en-slideLeft; }
.visual-template-root .page.active .tpl-enter-slideRight { animation-name: tpl-en-slideRight; }
.visual-template-root .page.active .tpl-enter-zoom       { animation-name: tpl-en-zoom; }
.visual-template-root .page.active .tpl-enter-pop        { animation-name: tpl-en-pop; animation-duration: 0.55s; animation-timing-function: cubic-bezier(.34,1.56,.64,1); }
.visual-template-root .page.active .tpl-enter-bounce     { animation-name: tpl-en-bounce; animation-duration: 0.9s; }
.visual-template-root .page.active .tpl-enter-tilt       { animation-name: tpl-en-tilt; animation-duration: 0.7s; }
@keyframes tpl-en-fade      { from { opacity:0 } to { opacity:1 } }
@keyframes tpl-en-slideUp   { from { opacity:0; transform: translateY(28px) } to { opacity:1; transform: translateY(0) } }
@keyframes tpl-en-slideDown { from { opacity:0; transform: translateY(-28px) } to { opacity:1; transform: translateY(0) } }
@keyframes tpl-en-slideLeft { from { opacity:0; transform: translateX(28px) } to { opacity:1; transform: translateX(0) } }
@keyframes tpl-en-slideRight{ from { opacity:0; transform: translateX(-28px) } to { opacity:1; transform: translateX(0) } }
@keyframes tpl-en-zoom      { from { opacity:0; transform: scale(0.86) } to { opacity:1; transform: scale(1) } }
@keyframes tpl-en-pop {
  0%   { opacity:0; transform: scale(0.7); }
  60%  { opacity:1; transform: scale(1.08); }
  100% { opacity:1; transform: scale(1); }
}
@keyframes tpl-en-bounce {
  0%   { opacity:0; transform: translateY(-30px); }
  50%  { opacity:1; transform: translateY(8px); }
  70%  { transform: translateY(-4px); }
  100% { transform: translateY(0); }
}
@keyframes tpl-en-tilt {
  0%   { opacity:0; transform: rotate(-12deg) scale(0.9); }
  100% { opacity:1; transform: rotate(0) scale(1); }
}

/* ── Stickers ─────────────────────────────────────────────────── */
.visual-template-root .tpl-sticker {
  user-select: none; cursor: grab;
  text-shadow: 0 4px 16px rgba(0,0,0,0.18);
}

/* When dragMode is on (parent toggles class), all blocks show a grab cursor */
.html-deck-root .template-html-sandbox.tpl-drag-mode [data-block-slot] { cursor: grab; }
.html-deck-root .template-html-sandbox.tpl-drag-mode [data-block-slot]:active { cursor: grabbing; }

/* ── Text effects (typewriter / blink) ─────────────────────── */
.visual-template-root .tpl-tx-type {
  display: inline-block; overflow: hidden; white-space: nowrap;
  border-right: 2px solid currentColor;
  width: 0; max-width: 100%;
}
.visual-template-root .page.active .tpl-tx-type {
  animation: tpl-tx-type 2.6s steps(40, end) forwards, tpl-tx-caret 0.8s step-end infinite;
}
@keyframes tpl-tx-type { from { width: 0 } to { width: 100% } }
@keyframes tpl-tx-caret { 50% { border-color: transparent } }

.visual-template-root .tpl-tx-blink { animation: tpl-tx-blink 1.4s steps(2,end) infinite; }
@keyframes tpl-tx-blink { 50% { opacity: 0.25 } }

/* ── Shapes ───────────────────────────────────────────────────── */
.visual-template-root .tpl-shape svg { display: block; }

/* ── Countdown ────────────────────────────────────────────────── */
.visual-template-root .tpl-countdown { display: inline-block; text-align: center; padding: 14px 18px; }
.visual-template-root .tpl-cd-title { font-size: 13px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.8; margin-bottom: 8px; }
.visual-template-root .tpl-cd-grid { display: inline-grid; grid-auto-flow: column; gap: 8px; }
.visual-template-root .tpl-cd-cell { display: flex; flex-direction: column; align-items: center; min-width: 60px; padding: 10px 8px; border-radius: 14px; }
.visual-template-root .tpl-cd-num { font-size: 28px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; color: var(--tpl-cd-accent,#d946ef); }
.visual-template-root .tpl-cd-lbl { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.7; margin-top: 4px; }
.visual-template-root .tpl-cd-card .tpl-cd-cell { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); }
.visual-template-root .tpl-cd-mega .tpl-cd-num { font-size: 44px; }
.visual-template-root .tpl-cd-mega .tpl-cd-cell { min-width: 84px; padding: 14px 12px; background: var(--tpl-cd-accent,#d946ef); color: #fff; }
.visual-template-root .tpl-cd-mega .tpl-cd-num { color: #fff; }
.visual-template-root .tpl-cd-minimal .tpl-cd-cell { padding: 4px 8px; min-width: 44px; }
.visual-template-root .tpl-cd-minimal .tpl-cd-num { font-size: 22px; }
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
    .map((b, bi) => (b?.hidden ? '' : renderBlock(b, pi, bi, pt)))
    .filter(Boolean)
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
  const filterCss = page.pageFilter && page.pageFilter !== 'none' ? cssFilterFor(page.pageFilter) : '';
  const innerStyle = `color:${escapeCss(pt.textColor)};font-family:${escapeCss(pt.fontFamily)};--tpl-h:${escapeCss(headCol)}${filterCss ? `;filter:${filterCss}` : ''}`;
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

  const rootAudio = escapeCssUrl(theme.audioUrl)
    ? `<audio src="${escapeHtml(theme.audioUrl)}" autoplay loop playsinline style="display:none"></audio>`
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
${rootAudio}
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
  /** User-overlay extension: per-page CSS filter applied to .page-inner */
  'pageFilter',
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
    /** Append user-added overlay blocks (stickers, text, GIFs, photos) on top of the admin template. */
    if (Array.isArray(patch.extraBlocks) && patch.extraBlocks.length > 0) {
      const extra = patch.extraBlocks.map(migrateBlock);
      next.blocks = [...(next.blocks || []), ...extra];
    }
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
