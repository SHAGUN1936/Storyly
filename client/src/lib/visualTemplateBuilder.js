/**
 * Visual template builder → HTML (data-slot, data-page, data-nav-page).
 * Stored copy: structure.builderState for re-opening in the admin UI.
 */
import { normalizeMotionBg } from './motionBackgrounds.js';

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
  // CRITICAL: convert any double quotes to single quotes. These values are
  // interpolated into a double-quoted inline attribute (style="..."), and a
  // font-family like `"Lobster", cursive` would otherwise close the style
  // attribute at the first `"`, silently dropping font-family (and everything
  // after it). Single quotes are valid for CSS font names and safe here.
  return s.replace(/"/g, "'").slice(0, 220);
}

function placeholderDataUri(label) {
  const text = encodeURIComponent(String(label || 'Add media'));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 360'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#374151'/><stop offset='100%' stop-color='#111827'/></linearGradient><filter id='b'><feGaussianBlur stdDeviation='16'/></filter></defs><rect width='600' height='360' fill='url(#g)'/><circle cx='120' cy='90' r='90' fill='#ffffff22' filter='url(#b)'/><circle cx='480' cy='280' r='120' fill='#8B5CF622' filter='url(#b)'/><text x='300' y='190' font-size='28' fill='#e5e7eb' text-anchor='middle' font-family='system-ui, sans-serif'>${text}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

export function uid() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultTheme() {
  return {
    pageBackground: '#0B0F19',
    textColor: '#F5F7FB',
    headingColor: '#FFFFFF',
    buttonBackground: '#FFFFFF',
    buttonText: '#0B0F19',
    buttonRadius: 999,
    fontFamily: '"Space Grotesk", "Inter", system-ui, -apple-system, Segoe UI, sans-serif',
    /** solid | gradient | image | video */
    backgroundKind: 'gradient',
    gradientFrom: '#1E1B4B',
    gradientTo: '#7C3AED',
    gradientAngle: 135,
    /** When true (+ gradient bg), the background slowly flows — "motion theme". */
    bgMotion: false,
    backgroundImageUrl: '',
    backgroundVideoUrl: '',
    /** none | fade | slideUp | zoom | drift */
    pageAnimation: 'fade',
    /** Site-wide background music (https URL). Picked from MUSIC_LIBRARY or pasted. */
    audioUrl: '',
    /** Motion Backgrounds library — animated layer behind the design.
     *  { type, color1, color2, speed }. type 'none' = off. */
    motionBg: { type: 'none', color1: '#8B5CF6', color2: '#EC4899', speed: 2 },
  };
}

/** ── Canva-style additions ──────────────────────────────────────── */

/** Instagram-style image filters → CSS filter string. */
export const FILTER_PRESETS = [
  { value: 'none',     label: 'Original' },
  { value: 'vivid',    label: 'Vivid' },
  { value: 'mono',     label: 'B&W' },
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

/** Per-block LOOP animations (continuous). These animate the individual
 *  `translate` / `scale` / `rotate` CSS properties (or box-shadow for glow)
 *  — NOT the `transform` shorthand — so they compose cleanly with a block's
 *  center-anchor + rotation (`transform`) AND its entrance animation. */
export const LOOP_ANIM_PRESETS = [
  { value: 'none',      label: 'None' },
  { value: 'float',     label: 'Float' },
  { value: 'pulse',     label: 'Pulse' },
  { value: 'bounce',    label: 'Bounce' },
  { value: 'shake',     label: 'Shake' },
  { value: 'wiggle',    label: 'Wiggle' },
  { value: 'heartbeat', label: 'Heartbeat' },
  { value: 'spin',      label: 'Spin' },
  { value: 'glow',      label: 'Glow' },
  { value: 'drift',     label: 'Drift (roam screen)' },
  { value: 'swing',     label: 'Swing' },
  { value: 'tada',      label: 'Tada' },
  { value: 'jelly',     label: 'Jelly' },
  { value: 'wobble',    label: 'Wobble' },
  { value: 'flip',      label: 'Flip' },
  { value: 'rubber',    label: 'Rubber' },
  { value: 'orbit',     label: 'Orbit' },
];

/** Animated background-effect overlays — floating particle layers that drift
 *  across the whole page (a "live wallpaper" on top of the gradient/photo). */
export const PAGE_EFFECT_PRESETS = [
  { value: 'none',     label: 'None',     emojis: [] },
  { value: 'hearts',   label: 'Hearts',   emojis: ['💖','💕','💗','💞','🩷'] },
  { value: 'confetti', label: 'Confetti', emojis: ['🎉','🎊','✨','🎈','⭐'] },
  { value: 'sparkles', label: 'Sparkles', emojis: ['✨','💫','⭐','🌟','🪄'] },
  { value: 'snow',     label: 'Snow',     emojis: ['❄','🌨','❅','✲','•'] },
  { value: 'bubbles',  label: 'Bubbles',  emojis: ['🫧','○','◦','⚬','◯'] },
  { value: 'petals',   label: 'Petals',   emojis: ['🌸','🌺','🌷','🌼','🍃'] },
  { value: 'stars',    label: 'Stars',    emojis: ['⭐','🌟','✨','💫','🌠'] },
  { value: 'music',    label: 'Music',    emojis: ['🎵','🎶','♪','♫','🎼'] },
  { value: 'leaves',   label: 'Leaves',   emojis: ['🍂','🍁','🍃','🌿','🍀'] },
  { value: 'rain',     label: 'Rain',     emojis: ['💧','🌧','〵','│','ʼ'] },
  { value: 'fire',     label: 'Embers',   emojis: ['🔥','✨','🌟','💥','⚡'] },
  { value: 'balloons', label: 'Balloons', emojis: ['🎈','🎈','🩷','💙','💛'] },
  { value: 'butterflies', label: 'Butterflies', emojis: ['🦋','🦋','🌸','✨','🍃'] },
  { value: 'money',    label: 'Money',    emojis: ['💵','💸','🤑','💰','🪙'] },
  { value: 'party',    label: 'Party',    emojis: ['🥳','🎉','🎊','🪩','🎈'] },
  { value: 'spooky',   label: 'Spooky',   emojis: ['👻','🦇','🕸','🎃','💀'] },
  { value: 'magic',    label: 'Magic',    emojis: ['🪄','✨','🔮','💫','⭐'] },
  { value: 'food',     label: 'Food',     emojis: ['🍕','🍔','🍩','🍦','🧁'] },
  { value: 'ocean',    label: 'Ocean',    emojis: ['🐠','🐟','🫧','🌊','🐚'] },
  { value: 'spring',   label: 'Spring',   emojis: ['🌷','🌼','🌸','🐝','🦋'] },
];
const PAGE_EFFECT_SET = new Set(PAGE_EFFECT_PRESETS.map((e) => e.value));

/** Photo/video frame shapes — mask the media into a shape (like a sticker
 *  frame). Percentage-based clip-paths so they scale on every device. */
export const MEDIA_SHAPE_PRESETS = [
  { value: 'none',     label: 'Square' },
  { value: 'rounded',  label: 'Rounded' },
  { value: 'squircle', label: 'Squircle' },
  { value: 'circle',   label: 'Circle' },
  { value: 'heart',    label: 'Heart' },
  { value: 'star',     label: 'Star' },
  { value: 'hexagon',  label: 'Hexagon' },
  { value: 'diamond',  label: 'Diamond' },
  { value: 'triangle', label: 'Triangle' },
];
const MEDIA_SHAPE_SET = new Set(MEDIA_SHAPE_PRESETS.map((s) => s.value));

/** CSS for a media frame shape. Returns '' for 'none'. The heart uses a shared
 *  SVG clipPath (objectBoundingBox units) injected once into the document. */
function mediaShapeCss(shape) {
  switch (shape) {
    case 'rounded':  return 'border-radius:18%;';
    case 'squircle': return 'border-radius:42%;';
    case 'circle':   return 'border-radius:50%;';
    case 'diamond':  return 'clip-path:polygon(50% 0,100% 50%,50% 100%,0 50%);';
    case 'hexagon':  return 'clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);';
    case 'triangle': return 'clip-path:polygon(50% 0,100% 100%,0 100%);';
    case 'star':     return 'clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);';
    case 'heart':    return 'clip-path:url(#tpl-clip-heart);';
    default:         return '';
  }
}

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
  { id: 'sample-a', name: 'Lo-fi Chill',   mood: 'chill',    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_d1718ab41b.mp3' },
  { id: 'sample-b', name: 'Happy Pop',     mood: 'happy',    url: 'https://cdn.pixabay.com/audio/2022/03/19/audio_270f49b83a.mp3' },
  { id: 'sample-c', name: 'Cinematic',     mood: 'epic',     url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c6ff1eee.mp3' },
  { id: 'sample-d', name: 'Acoustic Love', mood: 'romantic', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_3bce5d65a5.mp3' },
];

/** https URL only, for CSS url() */
export function escapeCssUrl(val) {
  const s = String(val ?? '').trim();
  // Reject anything that could break out of a CSS url('…') inside an HTML
  // attribute — quotes especially (they were silently corrupting the style).
  if (!s || /[;{}<>"']/.test(s)) return '';
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
  // ── Extra Instagram-style display / script / handwriting / typewriter / neon ──
  '"Lobster", cursive':                        'https://fonts.googleapis.com/css2?family=Lobster&display=swap',
  '"Sacramento", cursive':                     'https://fonts.googleapis.com/css2?family=Sacramento&display=swap',
  '"Yellowtail", cursive':                     'https://fonts.googleapis.com/css2?family=Yellowtail&display=swap',
  '"Cookie", cursive':                         'https://fonts.googleapis.com/css2?family=Cookie&display=swap',
  '"Shadows Into Light", cursive':             'https://fonts.googleapis.com/css2?family=Shadows+Into+Light&display=swap',
  '"Indie Flower", cursive':                   'https://fonts.googleapis.com/css2?family=Indie+Flower&display=swap',
  '"Kalam", cursive':                          'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap',
  '"Amatic SC", cursive':                      'https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap',
  '"Special Elite", cursive':                  'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap',
  '"Courier Prime", monospace':                'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap',
  '"Monoton", cursive':                        'https://fonts.googleapis.com/css2?family=Monoton&display=swap',
  '"Audiowide", cursive':                      'https://fonts.googleapis.com/css2?family=Audiowide&display=swap',
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
    // Per-block fonts must be loaded too, else a font picked on a single
    // text element never actually applies (silently falls back).
    (p.blocks || []).forEach((b) => add(b?.fontFamily));
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
  { value: '"Shadows Into Light", cursive',                  label: 'Shadows',           group: 'Hand' },
  { value: '"Indie Flower", cursive',                        label: 'Indie Flower',      group: 'Hand' },
  { value: '"Kalam", cursive',                               label: 'Kalam',             group: 'Hand' },
  { value: '"Amatic SC", cursive',                           label: 'Amatic',            group: 'Hand' },
  { value: '"Lobster", cursive',                             label: 'Lobster',           group: 'Script' },
  { value: '"Sacramento", cursive',                          label: 'Sacramento',        group: 'Script' },
  { value: '"Yellowtail", cursive',                          label: 'Yellowtail',        group: 'Script' },
  { value: '"Cookie", cursive',                              label: 'Cookie',            group: 'Script' },
  { value: '"Special Elite", cursive',                       label: 'Typewriter',        group: 'Retro' },
  { value: '"Courier Prime", monospace',                     label: 'Courier',           group: 'Retro' },
  { value: '"Press Start 2P", cursive',                      label: 'Press Start 2P',    group: 'Retro' },
  { value: '"Monoton", cursive',                             label: 'Neon',              group: 'Retro' },
  { value: '"Audiowide", cursive',                           label: 'Audiowide',         group: 'Retro' },
];

/** ── Text effects ─────────────────────────────────────────── */
export const TEXT_EFFECT_PRESETS = [
  { value: 'none',       label: 'None' },
  { value: 'gradient',   label: 'Gradient' },
  { value: 'neon',       label: 'Neon' },
  { value: 'glow',       label: 'Glow' },
  { value: 'shadow',     label: 'Shadow' },
  { value: 'stroke',     label: 'Outline' },
  { value: '3d',         label: '3D' },
  { value: 'reflection', label: 'Reflection' },
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
  /* Typography knobs the editor + starters set. These were previously
     ignored, which is why headings rendered at the browser default and
     "eyebrow" caps looked like body text — applying them gives a real
     type hierarchy (small caps eyebrow → big heading → readable body). */
  const fs = Number(block?.fontSize);
  if (Number.isFinite(fs) && fs > 0) css += `font-size:${Math.max(8, Math.min(220, Math.round(fs)))}px;`;
  const tt = block?.textTransform;
  if (tt === 'uppercase' || tt === 'lowercase' || tt === 'capitalize') css += `text-transform:${tt};`;
  const al = block?.align;
  if (al === 'left' || al === 'center' || al === 'right') css += `text-align:${al};`;
  const mw = Number(block?.maxWidth);
  if (Number.isFinite(mw) && mw > 0) css += `max-width:${Math.round(mw)}px;margin-left:auto;margin-right:auto;`;
  /* Per-block font family (panel sets it; was previously ignored). */
  if (typeof block?.fontFamily === 'string' && block.fontFamily) css += `font-family:${escapeCss(block.fontFamily)};`;
  /* Border + corner radius (curve ↔ square) — wrap with padding so a
     border doesn't hug the glyphs. */
  const bw = Number(block?.borderWidth);
  if (Number.isFinite(bw) && bw > 0) {
    css += `border:${Math.min(40, Math.round(bw))}px solid ${escapeCss(block?.borderColor || '#ffffff')};padding:6px 14px;`;
  }
  const cr = Number(block?.cornerRadius);
  if (Number.isFinite(cr) && cr >= 0) css += `border-radius:${Math.min(400, Math.round(cr))}px;`;
  /* Per-block colour comes BEFORE the effect switch so gradient/neon/
     stroke can still override it with their own fill. */
  if (typeof block?.color === 'string' && block.color) css += `color:${escapeCss(block.color)};`;
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
    case 'stroke': {
      // Outline / text stroke. Width editable via `strokeWidth` (default 2px).
      const sw = Number(block?.strokeWidth);
      const w = Number.isFinite(sw) ? Math.max(0.5, Math.min(12, sw)) : 2;
      css += `-webkit-text-stroke:${w}px ${c1};color:transparent;paint-order:stroke fill;`;
      break;
    }
    case '3d':
      // Layered shadows give an extruded 3D look (depth toward bottom-right).
      css += `text-shadow:1px 1px 0 rgba(0,0,0,0.22),2px 2px 0 rgba(0,0,0,0.20),3px 3px 0 rgba(0,0,0,0.18),4px 4px 0 rgba(0,0,0,0.16),5px 5px 0 rgba(0,0,0,0.14),6px 8px 12px rgba(0,0,0,0.35);`;
      break;
    case 'reflection':
      // Mirror image fading below the text (webkit/blink — all mobile browsers).
      css += `-webkit-box-reflect:below 2px linear-gradient(transparent 55%, rgba(255,255,255,0.28));`;
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

/**
 * Viewport presets — the design-time canvas dimensions a template is
 * authored against. Block positions are absolute pixels relative to
 * this size; the renderer uniformly scales the canvas to fit any user
 * device while preserving layout.
 */
export const VIEWPORT_PRESETS = {
  mobile:  { width: 390,  height: 844, label: 'Mobile',  emoji: '📱' },
  desktop: { width: 1280, height: 720, label: 'Desktop', emoji: '🖥️' },
};

export function resolveViewport(viewport) {
  if (viewport && VIEWPORT_PRESETS[viewport]) return { name: viewport, ...VIEWPORT_PRESETS[viewport] };
  return { name: 'desktop', ...VIEWPORT_PRESETS.desktop };
}

/**
 * Device breakpoints (responsive engine v3). Each breakpoint has its own
 * artboard whose ASPECT matches the device class, so a design never
 * letterboxes into a thin strip — a portrait phone gets a portrait
 * artboard, a desktop a landscape one. `maxWidth`/`minWidth` are the CSS
 * cut-points (#9: mobile <768, tablet 768–1024, desktop >1024); `width`/
 * `height` are the design-canvas dimensions used when that breakpoint is
 * active. The active breakpoint is chosen at render time (by the renderer
 * component, via the `data-bp` attribute on `.visual-template-root`) so
 * the same engine powers both the editor's forced preview and the
 * published page's automatic, width-driven selection.
 */
export const BREAKPOINT_ORDER = ['mobile', 'tablet', 'desktop'];
export const BREAKPOINT_PRESETS = {
  mobile:  { maxWidth: 767,                width: 390,  height: 844,  label: 'Mobile',  emoji: '📱' },
  tablet:  { minWidth: 768, maxWidth: 1024, width: 834,  height: 1112, label: 'Tablet',  emoji: '📲' },
  desktop: { minWidth: 1025,               width: 1280, height: 720,  label: 'Desktop', emoji: '🖥️' },
};

/** Default responsive config — enabled, with each breakpoint seeded to its
 *  preset artboard. `base` records which breakpoint the block base fields
 *  represent (everything else is stored as deltas against it). */
export function defaultResponsiveConfig(base = 'desktop') {
  const safeBase = BREAKPOINT_ORDER.includes(base) ? base : 'desktop';
  return {
    enabled: true,
    base: safeBase,
    breakpoints: {
      mobile:  { width: BREAKPOINT_PRESETS.mobile.width,  height: BREAKPOINT_PRESETS.mobile.height },
      tablet:  { width: BREAKPOINT_PRESETS.tablet.width,  height: BREAKPOINT_PRESETS.tablet.height },
      desktop: { width: BREAKPOINT_PRESETS.desktop.width, height: BREAKPOINT_PRESETS.desktop.height },
    },
  };
}

/** Normalize a persisted responsive config. Returns null when responsive
 *  is disabled or absent (legacy v2 templates) so the renderer falls back
 *  to the original single-artboard scaling — byte-for-byte unchanged. */
export function normalizeResponsiveConfig(raw) {
  if (!raw || typeof raw !== 'object' || raw.enabled !== true) return null;
  const def = defaultResponsiveConfig(raw.base);
  const breakpoints = {};
  for (const k of BREAKPOINT_ORDER) {
    const b = (raw.breakpoints && raw.breakpoints[k]) || def.breakpoints[k];
    breakpoints[k] = {
      width:  Math.max(120, Math.min(4000, Math.round(Number(b.width))  || def.breakpoints[k].width)),
      height: Math.max(120, Math.min(4000, Math.round(Number(b.height)) || def.breakpoints[k].height)),
    };
  }
  return { enabled: true, base: def.base, breakpoints };
}

/** Resolve which breakpoint a given display width falls into (#9). */
export function breakpointForWidth(width) {
  const w = Number(width) || 0;
  if (w <= BREAKPOINT_PRESETS.mobile.maxWidth) return 'mobile';
  if (w <= BREAKPOINT_PRESETS.tablet.maxWidth) return 'tablet';
  return 'desktop';
}

export function defaultVisualBuilderState() {
  return {
    version: 2,
    siteTitle: 'Untitled Storyly page',
    /* Design canvas — see VIEWPORT_PRESETS. New templates start on the
       desktop (1280×720) canvas because that's the bigger working
       surface; the admin can flip to mobile in the toolbar for stories. */
    viewport: 'desktop',
    /* Responsive engine v3: new designs are responsive by default — the
       base fields describe the desktop artboard; mobile/tablet inherit it
       until the author tweaks them. Legacy templates load without this
       field and keep the original single-artboard behaviour. */
    responsive: defaultResponsiveConfig('desktop'),
    theme: defaultTheme(),
    scheduledReveal: defaultScheduledReveal(),
    pages: [
      // ── Page 1: Cover ───────────────────────────────────────
      // A polished invitation-style cover: eyebrow → big headline
      // → subtitle → hero photo slot → primary CTA.
      {
        id: uid(),
        pageTitle: 'Cover',
        pageBackground: '',
        blocks: [
          {
            type: 'heading',
            text: 'SAVE THE DATE',
            align: 'center',
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            marginTop: 40,
            marginBottom: 14,
          },
          {
            type: 'heading',
            text: 'Your Title Here',
            align: 'center',
            fontSize: 44,
            fontWeight: 800,
            lineHeight: 1.05,
            marginBottom: 14,
          },
          {
            type: 'text',
            text: 'A short, beautiful subtitle that sets the mood for your story.',
            align: 'center',
            fontSize: 16,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.85)',
            maxWidth: 380,
            marginInline: 'auto',
            marginBottom: 24,
          },
          {
            type: 'image',
            slot: 'cover_hero',
            aspectRatio: '1/1',
            radius: 24,
            maxWidth: 280,
            marginInline: 'auto',
            marginBottom: 28,
          },
          {
            type: 'button',
            label: 'Open the story',
            navPage: 2,
            buttonStyle: 'stable',
            align: 'center',
            paddingX: 24,
            paddingY: 12,
          },
        ],
      },

      // ── Page 2: Gallery ─────────────────────────────────────
      // Heading + responsive 6-photo grid + continue CTA.
      {
        id: uid(),
        pageTitle: 'Gallery',
        pageBackground: '',
        blocks: [
          {
            type: 'heading',
            text: 'Moments',
            align: 'center',
            fontSize: 36,
            fontWeight: 800,
            marginTop: 32,
            marginBottom: 8,
          },
          {
            type: 'text',
            text: 'Tap any tile to swap in your own photo.',
            align: 'center',
            fontSize: 14,
            color: 'rgba(255,255,255,0.75)',
            marginBottom: 24,
          },
          {
            type: 'gallery',
            count: 6,
            columns: 2,
            gap: 12,
            radius: 18,
            slotPrefix: 'g1',
            marginInline: 20,
            marginBottom: 28,
          },
          {
            type: 'button',
            label: 'Read the message',
            navPage: 3,
            buttonStyle: 'stable',
            align: 'center',
            paddingX: 24,
            paddingY: 12,
            marginBottom: 32,
          },
        ],
      },

      // ── Page 3: Message + Share ─────────────────────────────
      // Heart accent + heading + heartfelt message + share CTA.
      {
        id: uid(),
        pageTitle: 'Message',
        pageBackground: '',
        blocks: [
          {
            type: 'text',
            text: '♥',
            align: 'center',
            fontSize: 56,
            color: '#EC4899',
            marginTop: 56,
            marginBottom: 12,
            lineHeight: 1,
          },
          {
            type: 'heading',
            text: 'With love',
            align: 'center',
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 16,
          },
          {
            type: 'text',
            text: 'Write a personal message here. Keep it short, warm, and from the heart. This is the moment that stays with your guests.',
            align: 'center',
            fontSize: 16,
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.88)',
            maxWidth: 380,
            marginInline: 'auto',
            marginBottom: 32,
          },
          {
            type: 'button',
            label: 'Share this page',
            navPage: 1,
            buttonStyle: 'stable',
            align: 'center',
            paddingX: 24,
            paddingY: 12,
          },
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
const LOOP_ANIM_SET = new Set(['none','float','pulse','bounce','shake','wiggle','heartbeat','spin','glow','drift','swing','tada','jelly','wobble','flip','rubber','orbit']);
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
    loopAnimation: LOOP_ANIM_SET.has(block?.loopAnimation) ? block.loopAnimation : 'none',
    /** Border + corner radius (curve ↔ square). Empty string = unset. */
    borderWidth: Number.isFinite(Number(block?.borderWidth)) && block?.borderWidth !== '' ? Math.max(0, Math.min(40, Math.round(Number(block.borderWidth)))) : (block?.borderWidth === '' || block?.borderWidth == null ? '' : block.borderWidth),
    borderColor: typeof block?.borderColor === 'string' ? block.borderColor : '',
    cornerRadius: Number.isFinite(Number(block?.cornerRadius)) && block?.cornerRadius !== '' ? Math.max(0, Math.min(400, Math.round(Number(block.cornerRadius)))) : (block?.cornerRadius === '' || block?.cornerRadius == null ? '' : block.cornerRadius),
    enterDelayMs: Number.isFinite(enterDelay) ? Math.max(0, Math.min(3000, enterDelay)) : 0,
    /** Per-element opacity (0–1). Default 1 (fully visible). */
    opacity: Number.isFinite(Number(block?.opacity)) ? Math.max(0, Math.min(1, Number(block.opacity))) : 1,
    /** Video playback: 'inline' (default) or 'lightbox' (tap → fullscreen). */
    videoMode: block?.videoMode === 'lightbox' ? 'lightbox' : 'inline',
    /** Photo/video frame shape (mask). Default 'none' (square). */
    mediaShape: MEDIA_SHAPE_SET.has(block?.mediaShape) ? block.mediaShape : 'none',
    /** Transient: true while a freshly uploaded media block is in flight. */
    uploading: block?.uploading === true,
    /** Editor-only metadata: not rendered, controls UX. */
    locked: block?.locked === true,
    hidden: block?.hidden === true,
    /** Layers panel: custom display name + group membership (flat groupId).
        Blocks sharing a groupId form a group (move/lock/hide/select together). */
    name: typeof block?.name === 'string' ? block.name.slice(0, 60) : '',
    groupId: typeof block?.groupId === 'string' && block.groupId ? block.groupId : '',
    /** Image adjustments: percentages where 100 = no change. */
    brightness: Number.isFinite(bright) ? Math.max(0, Math.min(300, bright)) : 100,
    contrast:   Number.isFinite(contrast) ? Math.max(0, Math.min(300, contrast)) : 100,
    saturation: Number.isFinite(sat) ? Math.max(0, Math.min(300, sat)) : 100,
    /** Exposure: a second multiplicative light control (100 = no change). */
    exposure:   Number.isFinite(Number(block?.exposure)) ? Math.max(0, Math.min(300, Number(block.exposure))) : 100,
    /** Gaussian blur in px (0 = none). */
    blur:       Number.isFinite(Number(block?.blur)) ? Math.max(0, Math.min(30, Number(block.blur))) : 0,
    /** Responsive v3: per-breakpoint position/size deltas vs the base. */
    responsive: normalizeBlockResponsive(block?.responsive),
  };
}

/** Per-breakpoint block overrides. Each breakpoint stores only the fields
 *  that differ from the base (deltas), so anything omitted falls back to
 *  the base layout. Returns null when there are no overrides. */
function normalizeBlockResponsive(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const out = {};
  for (const bp of BREAKPOINT_ORDER) {
    const d = raw[bp];
    if (!d || typeof d !== 'object') continue;
    const o = {};
    const xPct = Number(d.xPct);
    const yPct = Number(d.yPct);
    const w = Number(d.width);
    const h = Number(d.height);
    const deg = Number(d.rotateDeg);
    const size = Number(d.size);
    if (Number.isFinite(xPct)) o.xPct = +Math.max(0, Math.min(100, xPct)).toFixed(3);
    if (Number.isFinite(yPct)) o.yPct = +Math.max(0, Math.min(100, yPct)).toFixed(3);
    if (Number.isFinite(w) && w > 0) o.width = Math.max(8, Math.min(2000, Math.round(w)));
    if (Number.isFinite(h) && h > 0) o.height = Math.max(8, Math.min(2000, Math.round(h)));
    if (Number.isFinite(size) && size > 0) o.size = Math.max(20, Math.min(240, Math.round(size)));
    if (Number.isFinite(deg)) o.rotateDeg = Math.max(-180, Math.min(180, Math.round(deg)));
    if (d.anchor === 'center' || d.anchor === 'topLeft') o.anchor = d.anchor;
    if (d.hidden === true) o.hidden = true;
    if (Object.keys(o).length) out[bp] = o;
  }
  return Object.keys(out).length ? out : null;
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

/** Extract an 11-char YouTube video id from any common URL form (or '' ). */
export function parseYouTubeId(url) {
  if (typeof url !== 'string') return '';
  const s = url.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : '';
}

/** Story music config — stored at theme.music. trimEnd 0 = play to end.
 *  Migrates legacy `theme.audioUrl` into music.url when music is unset.
 *  `youtubeId` (when set) means the track plays via the YouTube IFrame player. */
export function normalizeMusic(raw, fallbackUrl) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const num = (v, def, min, max) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
  const url = typeof m.url === 'string' && m.url ? m.url : (typeof fallbackUrl === 'string' ? fallbackUrl : '');
  const youtubeId = (typeof m.youtubeId === 'string' && /^[\w-]{11}$/.test(m.youtubeId)) ? m.youtubeId : parseYouTubeId(url);
  return {
    url,
    youtubeId,
    title: typeof m.title === 'string' ? m.title.slice(0, 120) : '',
    trimStart: num(m.trimStart, 0, 0, 86400),
    trimEnd: num(m.trimEnd, 0, 0, 86400),
    fadeIn: num(m.fadeIn, 0, 0, 30),
    fadeOut: num(m.fadeOut, 0, 0, 30),
    loop: m.loop !== false,
    volume: num(m.volume, 0.8, 0, 1),
  };
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
  // Background music engine config (migrates legacy audioUrl → music.url).
  theme.music = normalizeMusic(rawTheme.music, theme.audioUrl);
  const scheduledReveal = normalizeScheduledReveal(raw.scheduledReveal);
  let pages = raw.pages;
  /* Persist + normalize the viewport (defaults to 'desktop' for legacy
     templates that pre-date this field). */
  const viewport = raw.viewport && VIEWPORT_PRESETS[raw.viewport] ? raw.viewport : 'desktop';
  /* Responsive config is null for legacy templates (engine stays in the
     original single-artboard mode); a normalized object for v3 designs. */
  const responsive = normalizeResponsiveConfig(raw.responsive);
  if (!Array.isArray(pages) || pages.length === 0) {
    return { ...base, siteTitle: raw.siteTitle || base.siteTitle, viewport, responsive, theme, scheduledReveal };
  }

  pages = pages.map((p) => ({
    id: p.id || uid(),
    pageTitle: p.pageTitle || 'Page',
    /** Auto-advance to next page after N ms (0 / empty = off). Used in preview & published deck. */
    pageDurationMs:
      p.pageDurationMs === '' || p.pageDurationMs === undefined || p.pageDurationMs === null
        ? ''
        : Math.min(120000, Math.max(0, Number(p.pageDurationMs) || 0)),
    /** Which one-tap theme preset is applied to THIS page (for editor highlight). */
    themeId: typeof p.themeId === 'string' ? p.themeId : '',
    pageBackground: typeof p.pageBackground === 'string' ? p.pageBackground : '',
    pageImageUrl: typeof p.pageImageUrl === 'string' ? p.pageImageUrl : '',
    pageVideoUrl: typeof p.pageVideoUrl === 'string' ? p.pageVideoUrl : '',
    /** Animated background effect overlay (floating particles). */
    pageEffect: PAGE_EFFECT_SET.has(p.pageEffect) ? p.pageEffect : 'none',
    /** Per-page Motion Background ({ type, color1, color2, speed }). */
    motionBg: normalizeMotionBg(p.motionBg),
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
    viewport,
    responsive,
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

/** Button variants (Canva-style). */
export const BUTTON_VARIANT_PRESETS = [
  { value: 'solid',    label: 'Solid' },
  { value: 'outline',  label: 'Outline' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'ghost',    label: 'Ghost' },
];

function buttonInlineStyle(block, theme) {
  const bg = block.buttonBg || theme.buttonBackground;
  const fg = block.buttonText || theme.buttonText;
  const rr = Number(block.buttonRadius);
  const radius = Number.isFinite(rr) ? Math.max(0, Math.min(999, Math.round(rr))) : (Number(theme.buttonRadius) || 24);
  const variant = ['solid', 'outline', 'gradient', 'ghost'].includes(block.buttonVariant) ? block.buttonVariant : 'solid';
  let css = `border-radius:${radius}px;`;
  // Per-button padding (size) + typography.
  const px = Number(block.paddingX);
  const py = Number(block.paddingY);
  if (Number.isFinite(px)) css += `padding-left:${Math.max(0, Math.min(120, px))}px;padding-right:${Math.max(0, Math.min(120, px))}px;`;
  if (Number.isFinite(py)) css += `padding-top:${Math.max(0, Math.min(80, py))}px;padding-bottom:${Math.max(0, Math.min(80, py))}px;`;
  if (typeof block.fontFamily === 'string' && block.fontFamily) css += `font-family:${escapeCss(block.fontFamily)};`;
  const fs = Number(block.fontSize);
  if (Number.isFinite(fs) && fs > 0) css += `font-size:${Math.max(8, Math.min(120, Math.round(fs)))}px;`;
  // Style variant.
  if (variant === 'outline') {
    css += `background:transparent;color:${escapeCss(bg)};border:2px solid ${escapeCss(bg)};`;
  } else if (variant === 'ghost') {
    css += `background:transparent;color:${escapeCss(fg)};border:0;`;
  } else if (variant === 'gradient') {
    const bg2 = block.buttonBg2 || '#7c3aed';
    css += `background:linear-gradient(120deg,${escapeCss(bg)},${escapeCss(bg2)});color:${escapeCss(fg)};border:0;`;
  } else {
    css += `background:${escapeCss(bg)};color:${escapeCss(fg)};`;
  }
  return css;
}

function layerStyle(block) {
  const deg = Number(block?.rotateDeg);
  const rotate = Number.isFinite(deg) ? Math.max(-180, Math.min(180, deg)) : 0;
  /* Position is preferentially stored as percentages of the design
     canvas (xPct/yPct, 0-100), so "centered on desktop" stays
     "centered on mobile" when the admin flips the viewport — the
     percent values don't move, the canvas pixel dimensions do.
     Legacy templates that pre-date percent storage still render via
     the px fallback (x/y) below. */
  /* Detect a real stored position. Treat empty string / null as "no
     position" — NOT 0. (normalizeBuilderState stores unset coords as '',
     and Number('') === 0, which would otherwise pin every flow block to
     the top-left corner instead of letting it centre in the flex stack.) */
  const num = (v) => (v === '' || v == null ? NaN : Number(v));
  const xPct = num(block?.xPct);
  const yPct = num(block?.yPct);
  let pos = '';
  if (Number.isFinite(xPct) && Number.isFinite(yPct)) {
    pos = `position:absolute;left:${xPct}%;top:${yPct}%;`;
  } else {
    const x = num(block?.x);
    const y = num(block?.y);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      pos = `position:absolute;left:${Math.round(x)}px;top:${Math.round(y)}px;`;
    }
  }
  /* New blocks store their CENTRE point as the position anchor (with
     anchor:'center'), so a block centred on the grid stays centred in
     BOTH viewports — its size relative to the canvas differs between
     desktop/mobile, but its centre point doesn't. translate(-50%,-50%)
     pulls the box back by half its own size onto that point. Legacy
     blocks (no anchor flag) keep their original top-left anchoring.
     Applies to both percentage (admin) and pixel (user-overlay) coords. */
  const centerAnchored = pos !== '' && block?.anchor === 'center';
  const delay = Number(block?.enterDelayMs);
  const delayCss = Number.isFinite(delay) && delay > 0 ? `animation-delay:${Math.min(3000, Math.max(0, delay))}ms;` : '';
  const tf = `${centerAnchored ? 'translate(-50%,-50%)' : ''}${
    rotate ? `${centerAnchored ? ' ' : ''}rotate(${rotate}deg)` : ''
  }`.trim();
  // Per-element opacity (0–1). Only emitted when reduced, so default blocks
  // stay fully opaque. Applies to EVERY block type.
  const op = Number(block?.opacity);
  const opacityCss = Number.isFinite(op) && op >= 0 && op < 1 ? `opacity:${+op.toFixed(3)};` : '';
  return `${tf ? `transform:${tf};transform-origin:center;` : ''}${pos}${delayCss}${opacityCss}${
    rotate || pos ? 'display:inline-block;' : ''
  }`;
}

/** CSS class string for per-block entrance animation. Returns '' for 'none' or missing. */
function enterAnimClass(block) {
  const a = block?.enterAnimation;
  if (!a || a === 'none' || !ENTER_ANIM_SET.has(a)) return '';
  return ` tpl-enter tpl-enter-${a}`;
}

/** CSS class for a per-block continuous loop animation (composes with the
 *  block's transform + entrance because loops animate individual transform
 *  properties / box-shadow, not the `transform` shorthand). */
function loopAnimClass(block) {
  const a = block?.loopAnimation;
  if (!a || a === 'none' || !LOOP_ANIM_SET.has(a)) return '';
  return ` tpl-loop tpl-loop-${a}`;
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
  const e = Number(block?.exposure);
  const bl = Number(block?.blur);
  if (Number.isFinite(b) && b !== 100) parts.push(`brightness(${Math.max(0, Math.min(300, b))}%)`);
  if (Number.isFinite(e) && e !== 100) parts.push(`brightness(${Math.max(0, Math.min(300, e))}%)`);
  if (Number.isFinite(c) && c !== 100) parts.push(`contrast(${Math.max(0, Math.min(300, c))}%)`);
  if (Number.isFinite(s) && s !== 100) parts.push(`saturate(${Math.max(0, Math.min(300, s))}%)`);
  if (Number.isFinite(bl) && bl > 0) parts.push(`blur(${Math.max(0, Math.min(30, bl))}px)`);
  /* Frame border/outline. For rectangular / rounded / circle frames a real CSS
     border works; for clipped silhouettes (heart, star, …) a CSS border gets
     clipped away, so we trace the shape with 4-direction drop-shadows instead. */
  const shape = block?.mediaShape || 'none';
  const isClip = shape === 'heart' || shape === 'star' || shape === 'hexagon' || shape === 'diamond' || shape === 'triangle';
  const bw = Number(block?.borderWidth);
  const hasBorder = Number.isFinite(bw) && bw > 0;
  const bc = escapeCss(block?.borderColor || '#ffffff');
  let borderCss = '';
  if (hasBorder) {
    if (isClip) {
      const o = Math.max(1, Math.min(6, Math.round(bw)));
      parts.push(`drop-shadow(${o}px 0 0 ${bc})`, `drop-shadow(-${o}px 0 0 ${bc})`, `drop-shadow(0 ${o}px 0 ${bc})`, `drop-shadow(0 -${o}px 0 ${bc})`);
    } else {
      borderCss = `border:${Math.min(40, Math.round(bw))}px solid ${bc};box-sizing:border-box;`;
    }
  }
  const filterCss = parts.length ? `filter:${parts.join(' ')};` : '';
  // Frame shape (clip-path / strong radius) comes LAST so it wins over the
  // default border-radius for masked frames.
  const shapeCss = mediaShapeCss(shape);
  return `${defaults};object-fit:${fit};border-radius:${radius}px;box-shadow:${shadow};${borderCss}${filterCss}${rotate}${shapeCss}`;
}

function renderBlock(block, pageIndex, blockIndex, theme) {
  const sid = (suffix) => slotId(pageIndex, suffix);
  const bslot = `p${pageIndex + 1}_b${blockIndex}`;
  /* A block uses EITHER a continuous loop OR a one-shot entrance (both
     drive `animation`, so they can't share one element). Loop wins when
     set. Combining both arrives with the Timeline phase (wrapper layers). */
  const loopCls = loopAnimClass(block);
  const eA = loopCls || enterAnimClass(block);

  /* While a freshly added photo/video is still uploading, render a frosted
     placeholder box with a spinner exactly where the media will land, so the
     user can see something is coming. Replaced by the real media on upload. */
  if (block.uploading && (block.type === 'image' || block.type === 'gif' || block.type === 'video')) {
    const sz = sizeStyle(block) || 'width:240px;height:160px;';
    return `<div data-block-slot="${bslot}" data-slot-label="Uploading"${eA ? ` class="tpl-uploading ${eA.trim()}"` : ' class="tpl-uploading"'} style="${layerStyle(block)}${sz}"><span class="tpl-uploading-spin"></span><span class="tpl-uploading-label">Uploading…</span></div>`;
  }

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
      const vurl = escapeHtml(block.defaultUrl || '');
      /* 'lightbox' → show a tap-to-play card that opens the clip fullscreen;
         'inline' (default) → a normal inline video with controls. */
      if (block.videoMode === 'lightbox' && block.defaultUrl) {
        return `<div data-block-slot="${bslot}" data-slot-label="${escapeHtml(block.label || 'Video')}" data-video-fullscreen${eA ? ` class="tpl-video-card ${eA.trim()}"` : ' class="tpl-video-card"'} style="${layerStyle(block)}${sizeStyle(block) || 'width:280px;height:170px;'}${mediaShapeCss(block.mediaShape)}"><video src="${vurl}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:${block.mediaFit === 'contain' ? 'contain' : 'cover'};border-radius:${Math.max(0, Math.min(80, Number(block.mediaRadius) || 14))}px;"></video><span class="tpl-video-play" aria-hidden="true">▶</span></div>`;
      }
      return `<video data-block-slot="${bslot}" data-slot="${sid(block.slotKey || `vid_${blockIndex}`)}" data-slot-label="${escapeHtml(block.label || 'Video')}"${eA ? ` class="${eA.trim()}"` : ''} src="${vurl}" poster="${escapeHtml(placeholderDataUri('Add video'))}" controls style="${mediaStyle(block, dflt)}" playsinline></video>`;
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
    case 'trickyn':
    case 'reveal':
    case 'quiz':
    case 'poll':
    case 'memory':
    case 'spot':
    case 'wheel':
    case 'giftbox':
    case 'flip':
    case 'slot':
    case 'puzzle':
    case 'rps':
    case 'tapsong':
      return renderGame(block, bslot, eA);
    default:
      return '';
  }
}

/** Interactive "fun" blocks (quiz, poll, games, …). The markup is fully
 *  self-describing via classes / data-attributes; behaviour is wired by
 *  useInteractiveGames in the published deck (NOT in the editor, where blocks
 *  must stay selectable). Each renders sensible content from its config so it
 *  also previews correctly in the editor. */
const GAME_LABEL = { trickyn: 'Question', reveal: 'Reveal', quiz: 'Quiz', poll: 'Poll', memory: 'Memory', spot: 'Spot', wheel: 'Wheel', giftbox: 'Gift', flip: 'Flip Card', slot: 'Slot', puzzle: 'Puzzle', rps: 'RPS', tapsong: 'Tap to Play' };
const GAME_FX_SET = new Set(['glow', 'glass', 'neon']);
/** Per-block theme → CSS variables + optional surface background/image. */
function gameThemeCss(block) {
  let s = '';
  const add = (k, v) => { if (typeof v === 'string' && v.trim()) s += `${k}:${escapeCss(v)};`; };
  add('--g-accent', block.gameAccent);
  add('--g-accent2', block.gameAccent2);
  add('--g-text', block.gameTextColor);
  add('--g-card', block.gameCardColor);
  if (typeof block.gameFont === 'string' && block.gameFont) s += `--g-font:${escapeCss(block.gameFont)};`;
  if (block.gameShape === 'square') s += '--g-radius:6px;--g-card-radius:6px;';
  else if (block.gameShape === 'rounded') s += '--g-radius:18px;--g-card-radius:16px;';
  else if (block.gameShape === 'pill') s += '--g-radius:999px;--g-card-radius:16px;';
  const img = escapeCssUrl(block.gameImageUrl);
  if (typeof block.gameBg === 'string' && block.gameBg.trim()) s += `background:${escapeCss(block.gameBg)};`;
  if (img) s += `background-image:url(${JSON.stringify(img)});background-size:cover;background-position:center;`;
  if ((typeof block.gameBg === 'string' && block.gameBg.trim()) || img) s += 'padding:20px;border-radius:22px;';
  return s;
}
function gameFxClass(block) { return GAME_FX_SET.has(block.gameFx) ? ` tpl-gfx-${block.gameFx}` : ''; }
function gameWrap(type, bslot, eA, block, inner, extraAttr = '') {
  return `<div data-block-slot="${bslot}" data-game="${type}" data-slot-label="${GAME_LABEL[type] || 'Game'}" class="tpl-game tpl-game-${type}${gameFxClass(block)}${eA}"${extraAttr} style="${layerStyle(block)}${gameThemeCss(block)}">${inner}</div>`;
}
function renderGame(block, bslot, eA) {
  const t = block.type;
  const list = (v, fb) => (Array.isArray(v) && v.length ? v : fb).map((s) => String(s));
  if (t === 'trickyn') {
    const q = escapeHtml(block.question || 'Do you love me? 💕');
    const yes = escapeHtml(block.yesText || 'Yes 🥰');
    const no = escapeHtml(block.noText || 'No');
    const ok = escapeHtml(block.successText || "Yay! I knew it! 💖");
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-game-q">${q}</div>
       <div class="tpl-game-btns"><button type="button" data-yes class="tpl-game-btn tpl-game-yes">${yes}</button><button type="button" data-dodge class="tpl-game-btn tpl-game-no">${no}</button></div>
       <div class="tpl-game-success" data-success hidden>${ok}</div>`);
  }
  if (t === 'reveal') {
    const cover = escapeHtml(block.coverText || 'Tap to reveal 🎁');
    const msg = escapeHtml(block.message || 'Surprise! 🎉');
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-reveal"><div class="tpl-reveal-msg">${msg}</div><div class="tpl-reveal-cover" data-cover>${cover}</div></div>`);
  }
  if (t === 'quiz') {
    const q = escapeHtml(block.question || 'Pick the right answer:');
    const opts = list(block.options, ['Option A', 'Option B', 'Option C']);
    const correct = Math.max(0, Math.min(opts.length - 1, Number(block.correctIndex) || 0));
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-game-q">${q}</div>
       <div class="tpl-quiz-opts">${opts.map((o, i) => `<button type="button" class="tpl-quiz-opt" data-opt${i === correct ? ' data-correct' : ''}>${escapeHtml(o)}</button>`).join('')}</div>
       <div class="tpl-quiz-feedback" data-feedback></div>`);
  }
  if (t === 'poll') {
    const q = escapeHtml(block.question || 'What do you think?');
    const opts = list(block.options, ['Yes', 'No', 'Maybe']);
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-game-q">${q}</div>
       <div class="tpl-poll">${opts.map((o) => `<button type="button" class="tpl-poll-opt" data-opt data-votes="0"><span class="tpl-poll-bar"></span><span class="tpl-poll-label">${escapeHtml(o)}</span><span class="tpl-poll-pct"></span></button>`).join('')}</div>`);
  }
  if (t === 'memory') {
    const base = list(block.emojis, ['🍎', '⭐', '🎈', '🌸', '🐱', '🍩']).slice(0, 8);
    const cards = [...base, ...base];   // pairs; runtime shuffles on the published page
    const isUrl = (s) => /^(https?:|data:)/i.test(s);
    const face = (e) => (isUrl(e)
      ? `<span class="tpl-mem-face"><img class="tpl-mem-img" src="${escapeHtml(e)}" alt="" /></span>`
      : `<span class="tpl-mem-face">${escapeHtml(e)}</span>`);
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-memory" style="grid-template-columns:repeat(${Math.ceil(Math.sqrt(cards.length))},1fr)">${cards.map((e) => `<button type="button" class="tpl-mem-card" data-emoji="${escapeHtml(e)}">${face(e)}</button>`).join('')}</div>
       <div class="tpl-game-status" data-status>Find the matching pairs!</div>`);
  }
  if (t === 'spot') {
    const emoji = escapeHtml(block.emoji || '😀');
    const odd = escapeHtml(block.odd || '😈');
    const count = Math.max(6, Math.min(40, Number(block.count) || 20));
    const oddIdx = Math.floor(count / 2);
    const cols = Math.ceil(Math.sqrt(count));
    const cells = Array.from({ length: count }, (_, i) =>
      i === oddIdx
        ? `<button type="button" class="tpl-spot-cell" data-odd>${odd}</button>`
        : `<button type="button" class="tpl-spot-cell">${emoji}</button>`).join('');
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-spot" style="grid-template-columns:repeat(${cols},1fr)">${cells}</div>
       <div class="tpl-game-status" data-status>Spot the different one! 🔍</div>`,
      ` data-emoji="${emoji}" data-odd="${odd}"`);
  }
  if (t === 'wheel') {
    const segs = list(block.segments, ['Prize 🎁', 'Again', 'Win! 🏆', 'Oops', 'Lucky ⭐', 'Try']).slice(0, 8);
    const n = segs.length;
    const palette = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#06B6D4', '#A855F7'];
    const step = 360 / n;
    const stops = segs.map((_, i) => `${escapeCss(palette[i % palette.length])} ${(i * step).toFixed(2)}deg ${((i + 1) * step).toFixed(2)}deg`).join(',');
    const labels = segs.map((s, i) =>
      `<span class="tpl-wheel-label" style="transform:rotate(${(i * step + step / 2).toFixed(2)}deg)"><span>${escapeHtml(s)}</span></span>`).join('');
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-wheel-wrap"><div class="tpl-wheel" data-wheel style="background:conic-gradient(${stops})">${labels}</div><div class="tpl-wheel-pin"></div></div>
       <button type="button" class="tpl-game-btn" data-spin>Spin 🎡</button>
       <div class="tpl-game-status" data-result></div>`,
      ` data-segments="${escapeHtml(JSON.stringify(segs))}"`);
  }
  if (t === 'giftbox') {
    const msg = escapeHtml(block.message || "🎉 You're invited!");
    const box = escapeHtml(block.boxEmoji || '🎁');
    return gameWrap(t, bslot, eA, block,
      `<button type="button" class="tpl-gift" data-gift><span class="tpl-gift-box">${box}</span><span class="tpl-gift-hint">Tap to open</span></button>
       <div class="tpl-gift-msg" data-msg hidden>${msg}</div>`);
  }
  if (t === 'flip') {
    const front = escapeHtml(block.front || 'Tap me 👆');
    const back = escapeHtml(block.back || 'Surprise! 🎉');
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-flip" data-flip><div class="tpl-flip-inner"><div class="tpl-flip-front">${front}</div><div class="tpl-flip-back">${back}</div></div></div>
       <div class="tpl-game-status">Tap to flip</div>`);
  }
  if (t === 'slot') {
    const syms = list(block.symbols, ['🍒', '🍋', '🔔', '⭐', '7️⃣', '🍀']).slice(0, 8);
    const first = escapeHtml(syms[0] || '🍒');
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-slot">${[0, 1, 2].map(() => `<span class="tpl-slot-reel" data-reel>${first}</span>`).join('')}</div>
       <button type="button" class="tpl-game-btn" data-spin>Spin 🎰</button>
       <div class="tpl-game-status" data-result></div>`,
      ` data-symbols="${escapeHtml(JSON.stringify(syms))}"`);
  }
  if (t === 'puzzle') {
    // Jigsaw: pieces scattered in a tray → drag each into the matching frame slot.
    const cols = 3;
    const tot = cols * cols;
    const img = escapeCssUrl(block.puzzleImageUrl);
    const pieceStyle = (i) => (img
      ? `background-image:url(${JSON.stringify(img)});background-size:${cols * 100}%;background-position:${(i % cols) * 50}% ${Math.floor(i / cols) * 50}%;`
      : '');
    // Deterministic scatter for the tray order + a little tilt on each piece.
    const order = [...Array(tot).keys()];
    for (let i = order.length - 1; i > 0; i--) { const j = (i * 7 + 3) % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
    const slots = Array.from({ length: tot }, (_, i) => `<div class="tpl-jig-slot" data-slot="${i}"></div>`).join('');
    const pieces = order.map((i) => `<div class="tpl-jig-piece" data-piece="${i}" style="${pieceStyle(i)}--rot:${((i * 37) % 11) - 5}deg">${img ? '' : i + 1}</div>`).join('');
    const guide = img ? `<div class="tpl-jig-guide" style="background-image:url(${JSON.stringify(img)})"></div>` : '';
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-jig" data-cols="${cols}">
         <div class="tpl-jig-board">${guide}<div class="tpl-jig-grid">${slots}</div></div>
         <div class="tpl-jig-tray">${pieces}</div>
       </div>
       <div class="tpl-game-status" data-status>🧩 Drag the pieces into the frame!</div>`);
  }
  if (t === 'rps') {
    const q = escapeHtml(block.question || 'Rock · Paper · Scissors');
    const moves = [['rock', '✊'], ['paper', '✋'], ['scissors', '✌️']];
    return gameWrap(t, bslot, eA, block,
      `<div class="tpl-game-q">${q}</div>
       <div class="tpl-rps">${moves.map(([k, e]) => `<button type="button" class="tpl-rps-btn" data-rps="${k}">${e}</button>`).join('')}</div>
       <div class="tpl-game-status" data-result>Choose your move!</div>`);
  }
  if (t === 'tapsong') {
    const label = block.label ? `<span class="tpl-tap-label">${escapeHtml(block.label)}</span>` : '';
    const inner = escapeCssUrl(block.tapImage)
      ? `<img class="tpl-tap-img" src="${escapeHtml(block.tapImage)}" alt="" />`
      : `<span class="tpl-tap-emoji">${escapeHtml(block.icon || '🎵')}</span>`;
    // Per-button song: a trimmed/faded music config (block.music) or a plain url.
    const m = block.music && (block.music.youtubeId || escapeCssUrl(block.music.url))
      ? block.music
      : (escapeCssUrl(block.songUrl) ? { url: block.songUrl, trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0, loop: true, volume: 1 } : null);
    const mAttrs = m ? `data-start="${m.trimStart || 0}" data-end="${m.trimEnd || 0}" data-fadein="${m.fadeIn || 0}" data-fadeout="${m.fadeOut || 0}" data-loop="${m.loop !== false ? 1 : 0}" data-volume="${m.volume == null ? 1 : m.volume}"` : '';
    const audioEl = !m
      ? ''
      : (m.youtubeId
        ? `<div data-tapyt="${escapeHtml(m.youtubeId)}" ${mAttrs} style="position:fixed;left:-9999px;top:0;width:200px;height:120px;opacity:0;pointer-events:none;overflow:hidden"></div>`
        : `<audio data-tapaudio src="${escapeHtml(m.url)}" ${mAttrs} preload="none"></audio>`);
    return gameWrap(t, bslot, eA, block,
      `<button type="button" class="tpl-tap" data-tapplay>
         <span class="tpl-tap-icon">${inner}<span class="tpl-tap-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></span>
         ${label}
       </button>
       ${audioEl}`);
  }
  return '';
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
    const b = escapeCss(theme.gradientTo || '#7C3AED');
    const ang = Math.min(360, Math.max(0, Number(theme.gradientAngle) || 135));
    if (theme.bgMotion) {
      /* Motion theme — a slowly flowing gradient (Instagram-chat style). */
      return `background:linear-gradient(${ang}deg, ${a}, ${b}, ${a});background-size:220% 220%;animation:tpl-bg-flow 16s ease infinite;`;
    }
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
  overflow:hidden; position:relative; box-sizing:border-box;
  font-family:system-ui,sans-serif; color:#e5e7eb;
  width:100%;
}
@keyframes tpl-bg-flow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
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
  width:100%; height:100%;
}

/* ── Viewport-fit shell ────────────────────────────────────────
 * Block positions inside a template are absolute pixels relative
 * to the design canvas (--design-w x --design-h). The fit shell
 * scales the canvas uniformly to fill its container while
 * preserving the design aspect — so a template authored at 390x844
 * looks identical on a 320px phone, an 768px tablet, or a 1280px
 * laptop. Uses container queries (widely supported in evergreen
 * browsers) — no JS resize observer needed.
 */
.visual-template-root .tpl-viewport-fit {
  position:relative; z-index:1;
  width:100%; aspect-ratio: var(--design-aspect, 9/16);
  margin:0 auto; container-type:size; container-name: vp;
  overflow:hidden;
}
.visual-template-root .tpl-viewport-design {
  position:absolute; top:50%; left:50%;
  width: var(--design-w, 390px); height: var(--design-h, 844px);
  /* Unitless scale derived from container size / design size — both
     numerator and denominator are lengths, so the division collapses
     to a unitless ratio. We take the smaller of the width-ratio and
     height-ratio so the deck fits inside the container ("contain"
     semantics) without overflow. */
  transform: translate(-50%, -50%) scale(min(calc(100cqw / var(--design-w, 390px)), calc(100cqh / var(--design-h, 844px))));
  transform-origin: center center;
  will-change: transform;
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
/* Background effect overlay — drifting emoji particles ("live wallpaper").
   Sits above the gradient/photo but BEHIND the content. */
.visual-template-root .tpl-fx {
  position:absolute; inset:0; z-index:0; overflow:hidden; pointer-events:none;
}
.visual-template-root .tpl-fx span {
  position:absolute; top:-12%; line-height:1; will-change:transform,top,bottom,opacity;
  animation-name: tpl-fx-fall; animation-timing-function: linear; animation-iteration-count: infinite;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.12));
}
.visual-template-root .tpl-fx.tpl-fx-rise span {
  top:auto; bottom:-12%; animation-name: tpl-fx-rise;
}
@keyframes tpl-fx-fall {
  0%   { top:-12%;  transform: translateX(0)     rotate(0deg);   opacity:0; }
  10%  { opacity:0.9; }
  90%  { opacity:0.9; }
  100% { top:112%;  transform: translateX(28px)  rotate(180deg); opacity:0; }
}
@keyframes tpl-fx-rise {
  0%   { bottom:-12%; transform: translateX(0)    scale(0.9); opacity:0; }
  10%  { opacity:0.9; }
  90%  { opacity:0.9; }
  100% { bottom:112%; transform: translateX(-28px) scale(1.1); opacity:0; }
}
/* Uploading placeholder — frosted box + spinner where the media will appear. */
.visual-template-root .tpl-uploading {
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  background:rgba(255,255,255,0.14); backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
  border:1.5px dashed rgba(255,255,255,0.5); border-radius:16px; color:#fff;
  min-width:140px; min-height:110px; box-sizing:border-box;
}
.visual-template-root .tpl-uploading-spin {
  width:32px; height:32px; border-radius:50%;
  border:3px solid rgba(255,255,255,0.35); border-top-color:#fff;
  animation: tpl-spin 0.8s linear infinite;
}
.visual-template-root .tpl-uploading-label { font-size:12px; letter-spacing:0.06em; opacity:0.9; }
@keyframes tpl-spin { to { transform: rotate(360deg); } }
/* Tap-to-play video card (lightbox mode). */
.visual-template-root .tpl-video-card {
  position:relative; display:inline-block; cursor:pointer; overflow:hidden; border-radius:16px;
  box-shadow:0 10px 26px rgba(0,0,0,0.28);
}
.visual-template-root .tpl-video-card .tpl-video-play {
  position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
  width:54px; height:54px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  background:rgba(0,0,0,0.5); color:#fff; font-size:20px; padding-left:4px; backdrop-filter:blur(4px);
  transition:transform 0.2s ease, background 0.2s ease;
}
.visual-template-root .tpl-video-card:hover .tpl-video-play { transform:translate(-50%,-50%) scale(1.08); background:rgba(0,0,0,0.65); }
.visual-template-root .page-inner {
  position:relative; z-index:1; width:100%; padding:32px 24px; box-sizing:border-box;
  /* justify-content: center vertically centers the page content so a
     fresh template doesn't pile every block at the top — gives it the
     polished designed look out of the box. The author can still bias
     toward the top by adding marginTop to the first block. */
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:14px;
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
/* Entrance keyframes animate the INDIVIDUAL translate / scale / rotate
   properties (not the transform shorthand) so they COMPOSE with each block's
   own inline transform (translate(-50%,-50%) centre-anchor + tilt) instead of
   replacing it. Using the transform shorthand here + animation-fill-mode:both
   used to wipe the centring and leave the element shifted by half its size
   once the entrance had played (visible the moment editing was turned off). */
@keyframes tpl-en-fade      { from { opacity:0 } to { opacity:1 } }
@keyframes tpl-en-slideUp   { from { opacity:0; translate: 0 28px } to { opacity:1; translate: 0 0 } }
@keyframes tpl-en-slideDown { from { opacity:0; translate: 0 -28px } to { opacity:1; translate: 0 0 } }
@keyframes tpl-en-slideLeft { from { opacity:0; translate: 28px 0 } to { opacity:1; translate: 0 0 } }
@keyframes tpl-en-slideRight{ from { opacity:0; translate: -28px 0 } to { opacity:1; translate: 0 0 } }
@keyframes tpl-en-zoom      { from { opacity:0; scale: 0.86 } to { opacity:1; scale: 1 } }
@keyframes tpl-en-pop {
  0%   { opacity:0; scale: 0.7; }
  60%  { opacity:1; scale: 1.08; }
  100% { opacity:1; scale: 1; }
}
@keyframes tpl-en-bounce {
  0%   { opacity:0; translate: 0 -30px; }
  50%  { opacity:1; translate: 0 8px; }
  70%  { translate: 0 -4px; }
  100% { translate: 0 0; }
}
@keyframes tpl-en-tilt {
  0%   { opacity:0; rotate: -12deg; scale: 0.9; }
  100% { opacity:1; rotate: 0deg; scale: 1; }
}

/* Per-block LOOP animations. These animate the individual translate /
   scale / rotate properties (or box-shadow for glow), which COMPOSE with
   the block's own transform (center-anchor + tilt) instead of overriding it. */
.visual-template-root .tpl-loop { animation-iteration-count: infinite; }
.visual-template-root .tpl-loop-float     { animation: tpl-lp-float 3s ease-in-out infinite; }
.visual-template-root .tpl-loop-pulse     { animation: tpl-lp-pulse 2s ease-in-out infinite; }
.visual-template-root .tpl-loop-bounce    { animation: tpl-lp-bounce 1.6s cubic-bezier(.5,.05,.5,.95) infinite; }
.visual-template-root .tpl-loop-shake     { animation: tpl-lp-shake 1.4s ease-in-out infinite; }
.visual-template-root .tpl-loop-wiggle    { animation: tpl-lp-wiggle 1.4s ease-in-out infinite; }
.visual-template-root .tpl-loop-heartbeat { animation: tpl-lp-heart 1.6s ease-in-out infinite; }
.visual-template-root .tpl-loop-spin      { animation: tpl-lp-spin 6s linear infinite; }
.visual-template-root .tpl-loop-glow      { animation: tpl-lp-glow 2.4s ease-in-out infinite; }
.visual-template-root .tpl-loop-drift     { animation: tpl-lp-drift 16s ease-in-out infinite; }
.visual-template-root .tpl-loop-swing     { animation: tpl-lp-swing 2.4s ease-in-out infinite; transform-origin: top center; }
.visual-template-root .tpl-loop-tada      { animation: tpl-lp-tada 2.2s ease-in-out infinite; }
.visual-template-root .tpl-loop-jelly     { animation: tpl-lp-jelly 1.6s ease-in-out infinite; }
.visual-template-root .tpl-loop-wobble    { animation: tpl-lp-wobble 1.8s ease-in-out infinite; }
.visual-template-root .tpl-loop-flip      { animation: tpl-lp-flip 3s ease-in-out infinite; }
.visual-template-root .tpl-loop-rubber    { animation: tpl-lp-rubber 1.8s ease-in-out infinite; }
.visual-template-root .tpl-loop-orbit     { animation: tpl-lp-orbit 5s linear infinite; }
@keyframes tpl-lp-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -10px } }
@keyframes tpl-lp-pulse { 0%,100% { scale: 1 } 50% { scale: 1.06 } }
@keyframes tpl-lp-bounce { 0%,100% { translate: 0 0 } 50% { translate: 0 -14px } }
@keyframes tpl-lp-shake { 0%,100% { translate: 0 0 } 20% { translate: -4px 0 } 40% { translate: 4px 0 } 60% { translate: -3px 0 } 80% { translate: 3px 0 } }
@keyframes tpl-lp-wiggle { 0%,100% { rotate: 0deg } 25% { rotate: -4deg } 75% { rotate: 4deg } }
@keyframes tpl-lp-heart { 0%,100% { scale: 1 } 14% { scale: 1.12 } 28% { scale: 1 } 42% { scale: 1.12 } 70% { scale: 1 } }
@keyframes tpl-lp-spin { to { rotate: 360deg } }
@keyframes tpl-lp-glow { 0%,100% { box-shadow: 0 0 6px rgba(168,139,250,0.45) } 50% { box-shadow: 0 0 22px 4px rgba(168,139,250,0.9) } }
/* Drift — element roams continuously around the canvas (like floating
   background emojis), with a gentle tilt so the motion feels alive. */
@keyframes tpl-lp-drift {
  0%   { translate: 0 0;        rotate: 0deg; }
  20%  { translate: 70px -40px; rotate: 6deg; }
  40%  { translate: -50px 50px; rotate: -5deg; }
  60%  { translate: 60px 60px;  rotate: 4deg; }
  80%  { translate: -70px -30px;rotate: -6deg; }
  100% { translate: 0 0;        rotate: 0deg; }
}
@keyframes tpl-lp-swing { 0%,100% { rotate: 0deg } 25% { rotate: 7deg } 75% { rotate: -7deg } }
@keyframes tpl-lp-tada {
  0%,100% { scale: 1; rotate: 0deg } 10% { scale: .9; rotate: -3deg }
  30%,50%,70% { scale: 1.12; rotate: 3deg } 40%,60% { scale: 1.12; rotate: -3deg } 80% { scale: 1; rotate: 0deg }
}
@keyframes tpl-lp-jelly {
  0%,100% { scale: 1 1 } 30% { scale: 1.18 .82 } 45% { scale: .85 1.15 } 60% { scale: 1.08 .92 } 75% { scale: .96 1.04 }
}
@keyframes tpl-lp-wobble {
  0%,100% { translate: 0 0; rotate: 0deg } 15% { translate: -16px 0; rotate: -5deg } 30% { translate: 12px 0; rotate: 4deg }
  45% { translate: -9px 0; rotate: -3deg } 60% { translate: 6px 0; rotate: 2deg } 75% { translate: -3px 0; rotate: -1deg }
}
@keyframes tpl-lp-flip { 0%,40%,100% { transform: perspective(420px) rotateY(0deg) } 70% { transform: perspective(420px) rotateY(180deg) } }
@keyframes tpl-lp-rubber {
  0%,100% { scale: 1 1 } 30% { scale: 1.25 .75 } 40% { scale: .75 1.25 } 55% { scale: 1.15 .85 } 70% { scale: .95 1.05 }
}
@keyframes tpl-lp-orbit {
  0% { translate: 0 0 } 25% { translate: 14px -14px } 50% { translate: 0 -20px } 75% { translate: -14px -14px } 100% { translate: 0 0 }
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

/* Effects that float UP from the bottom (vs. falling from the top). */
const RISE_FX = new Set(['hearts', 'bubbles', 'sparkles', 'stars', 'music', 'fire', 'balloons', 'butterflies', 'party', 'magic', 'ocean', 'spring']);

/** Build the animated background-effect overlay for a page — a layer of
 *  drifting emoji particles ("live wallpaper"). Positions/timings are
 *  deterministic (derived from the index) so the markup is stable across
 *  re-renders (no flicker while editing). */
function renderPageEffect(page) {
  const fx = page?.pageEffect;
  if (!fx || fx === 'none' || !PAGE_EFFECT_SET.has(fx)) return '';
  const preset = PAGE_EFFECT_PRESETS.find((e) => e.value === fx);
  if (!preset || !preset.emojis.length) return '';
  const N = 16;
  const riseCls = RISE_FX.has(fx) ? ' tpl-fx-rise' : '';
  let spans = '';
  for (let i = 0; i < N; i++) {
    const e = preset.emojis[i % preset.emojis.length];
    const left = (i * 61) % 100;        // spread across the width
    const size = 14 + ((i * 37) % 22);  // 14–35px
    const dur = 9 + ((i * 53) % 12);    // 9–20s
    const delay = (i * 29) % 14;        // staggered start (negative → mid-flight)
    spans += `<span style="left:${left}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:-${delay}s;">${escapeHtml(e)}</span>`;
  }
  return `<div class="tpl-fx${riseCls}" aria-hidden="true">${spans}</div>`;
}

/** Per-page Motion Background, rendered AS HTML inside the page (a
 *  `.page-bg-motion` layer at z-0, behind `.page-inner` which is z-1 — exactly
 *  like `.page-bg-media`). Pure CSS so it works inside injected markup, on
 *  every page independently, with no React layering / transparency hacks. */
function renderPageMotionBg(page) {
  const m = normalizeMotionBg(page?.motionBg);
  if (m.type === 'none') return '';
  const c1 = escapeCss(m.color1);
  const c2 = escapeCss(m.color2);
  const dur = ({ 1: '30s', 2: '18s', 3: '10s' })[m.speed] || '18s';
  const wrap = (inner, extra = '') =>
    `<div class="page-bg-motion" style="position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;${extra}" aria-hidden="true">${inner}</div>`;

  if (m.type === 'gradient') {
    return wrap(`<div class="mbg-gradient mbg-anim" style="--c1:${c1};--c2:${c2};animation-duration:${dur}"></div>`);
  }
  if (m.type === 'shapes') {
    const b = [[12, 18, 220, 0], [70, 12, 300, -4], [78, 66, 260, -9], [22, 74, 240, -13], [46, 40, 200, -6]];
    return wrap(b.map(([l, t, s, d], i) => `<span class="mbg-shape mbg-anim" style="left:${l}%;top:${t}%;width:${s}px;height:${s}px;background:${i % 2 ? c2 : c1};animation-duration:${dur};animation-delay:${d}s"></span>`).join(''));
  }
  if (m.type === 'smoke') {
    const b = [[12, 18, 300, 0], [70, 12, 420, -4], [78, 66, 360, -9], [22, 74, 330, -13]];
    return wrap(b.map(([l, t, s, d], i) => `<span class="mbg-smoke mbg-anim" style="left:${l}%;top:${t}%;width:${s}px;height:${s}px;background:${i % 2 ? c2 : c1};animation-duration:${dur};animation-delay:${d}s"></span>`).join(''));
  }
  if (m.type === 'clouds') {
    return wrap([0, 1, 2, 3].map((i) => `<span class="mbg-cloud mbg-anim" style="top:${10 + i * 22}%;width:${200 + (i % 2) * 120}px;height:${90 + (i % 2) * 30}px;animation-duration:${dur};animation-delay:${-i * 5}s"></span>`).join(''));
  }
  if (m.type === 'galaxy') {
    return wrap(
      `<div class="mbg-stars mbg-anim" style="animation-duration:${dur}"></div><div class="mbg-stars mbg-stars-2 mbg-anim" style="animation-duration:${dur}"></div><div class="mbg-galaxy-core" style="background:radial-gradient(circle, ${c2}33, transparent 60%)"></div>`,
      `background:radial-gradient(120% 120% at 50% 40%, ${c1}22, transparent 70%)`,
    );
  }
  if (m.type === 'waves') {
    return wrap(`<svg class="mbg-waves" viewBox="0 0 1440 320" preserveAspectRatio="none"><path class="mbg-anim mbg-wave-a" fill="${c1}" fill-opacity="0.45" d="M0,160 C320,260 520,60 720,140 C920,220 1120,80 1440,160 L1440,320 L0,320 Z" style="animation-duration:${dur}"></path><path class="mbg-anim mbg-wave-b" fill="${c2}" fill-opacity="0.4" d="M0,200 C300,120 560,280 760,200 C1000,110 1180,250 1440,190 L1440,320 L0,320 Z" style="animation-duration:${dur}"></path></svg>`);
  }
  if (m.type === 'light') {
    return wrap(`<div class="mbg-light mbg-anim" style="--c1:${c1};--c2:${c2};animation-duration:${dur}"></div>`);
  }
  if (m.type === 'particles') {
    // CSS dot field (tsParticles JS can't run inside injected markup).
    let dots = '';
    for (let i = 0; i < 16; i++) {
      const l = (i * 61) % 100;
      const t = (i * 37) % 100;
      const s = 3 + (i % 3) * 2;
      dots += `<span class="mbg-dot mbg-anim" style="left:${l}%;top:${t}%;width:${s}px;height:${s}px;background:${i % 2 ? c2 : c1};animation-duration:${dur};animation-delay:-${i}s"></span>`;
    }
    return wrap(dots);
  }
  if (m.type === 'aurora') {
    return wrap(`<div class="mbg-aurora mbg-anim" style="--c1:${c1};--c2:${c2};animation-duration:${dur}"></div><div class="mbg-aurora mbg-aurora-2 mbg-anim" style="--c1:${c2};--c2:${c1};animation-duration:${dur}"></div>`,
      `background:radial-gradient(120% 90% at 50% 110%, ${c1}22, transparent 70%)`);
  }
  if (m.type === 'rain') {
    let drops = '';
    for (let i = 0; i < 28; i++) {
      const l = (i * 53) % 100;
      const h = 12 + (i % 4) * 6;
      drops += `<span class="mbg-raindrop mbg-anim" style="left:${l}%;height:${h}px;background:linear-gradient(${c2},transparent);animation-duration:calc(${dur} / 6);animation-delay:-${(i % 10) * 0.4}s"></span>`;
    }
    return wrap(drops);
  }
  if (m.type === 'bubbles') {
    let b = '';
    for (let i = 0; i < 14; i++) {
      const l = (i * 67) % 100;
      const s = 14 + (i % 5) * 12;
      b += `<span class="mbg-bubble mbg-anim" style="left:${l}%;width:${s}px;height:${s}px;border-color:${i % 2 ? c2 : c1};animation-duration:${dur};animation-delay:-${i * 0.8}s"></span>`;
    }
    return wrap(b);
  }
  if (m.type === 'fireflies') {
    let f = '';
    for (let i = 0; i < 18; i++) {
      const l = (i * 59) % 100;
      const t = (i * 43) % 100;
      f += `<span class="mbg-firefly mbg-anim" style="left:${l}%;top:${t}%;background:${i % 2 ? c2 : c1};box-shadow:0 0 8px 2px ${i % 2 ? c2 : c1};animation-duration:${dur};animation-delay:-${i * 0.6}s"></span>`;
    }
    return wrap(f);
  }
  if (m.type === 'snowfall') {
    let s = '';
    for (let i = 0; i < 24; i++) {
      const l = (i * 61) % 100;
      const sz = 4 + (i % 4) * 3;
      s += `<span class="mbg-snow mbg-anim" style="left:${l}%;width:${sz}px;height:${sz}px;animation-duration:calc(${dur} / 2);animation-delay:-${(i % 8) * 0.7}s"></span>`;
    }
    return wrap(s);
  }
  return '';
}

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
    media = `<div class="page-bg-media page-bg-img" style="background-image:url('${im}')"></div>`;
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

  const fxLayer = renderPageEffect(page);
  const motionLayer = renderPageMotionBg(page);
  return `<div class="page${active}${animExtra}" id="page${pi + 1}" data-page data-page-title="${title}"${durAttr}${pageStyle}>
${motionLayer}
${media}
${fxLayer}
<div class="page-inner" style="${innerStyle}">
${blocksHtml}
</div>
</div>`;
}

/** CSS declarations for one block's per-breakpoint delta (position, size,
 *  transform, visibility). `!important` so it wins over the base inline
 *  style. Returns '' when the delta has nothing renderable. */
function blockDeltaDecls(block, d) {
  if (d.hidden === true) return 'display:none !important;';
  const parts = [];
  if (Number.isFinite(Number(d.xPct))) parts.push(`left:${Number(d.xPct)}%`);
  if (Number.isFinite(Number(d.yPct))) parts.push(`top:${Number(d.yPct)}%`);
  if (Number.isFinite(Number(d.width))  && Number(d.width)  > 0) parts.push(`width:${Math.round(Number(d.width))}px`);
  if (Number.isFinite(Number(d.height)) && Number(d.height) > 0) parts.push(`height:${Math.round(Number(d.height))}px`);
  // Stickers are sized by font-size, not width/height.
  if (Number.isFinite(Number(d.size)) && Number(d.size) > 0) parts.push(`font-size:${Math.round(Number(d.size))}px`);
  /* Rebuild the transform so the override keeps the block's anchor +
     rotation. Falls back to the base block's anchor/rotation when the
     delta doesn't specify them. */
  const anchor = d.anchor || block.anchor;
  const degRaw = Number.isFinite(Number(d.rotateDeg)) ? Number(d.rotateDeg) : Number(block.rotateDeg);
  const center = anchor === 'center';
  const deg = Number.isFinite(degRaw) ? degRaw : 0;
  const tf = `${center ? 'translate(-50%,-50%)' : ''}${deg ? `${center ? ' ' : ''}rotate(${deg}deg)` : ''}`.trim();
  if (tf) parts.push(`transform:${tf}`);
  return parts.length ? parts.map((p) => `${p} !important`).join(';') + ';' : '';
}

/** Generate the responsive stylesheet: (1) reshape the artboard per
 *  breakpoint so each device gets an aspect that matches it, and (2) apply
 *  each block's per-breakpoint deltas. All rules are scoped to the active
 *  breakpoint via `[data-bp="…"]` on the root (set by the renderer
 *  component). Returns '' for legacy (non-responsive) templates, leaving
 *  the original single-artboard output untouched. */
function responsiveOverrideCss(normalized) {
  const r = normalized.responsive;
  if (!r || !r.enabled) return '';
  const rules = [];
  for (const bp of BREAKPOINT_ORDER) {
    const d = r.breakpoints[bp];
    /* `!important` is required: the root carries the base artboard vars as
       an INLINE style (the no-JS fallback), and inline beats a stylesheet
       rule unless the rule is important. Custom properties honour it. */
    rules.push(
      `.visual-template-root[data-bp="${bp}"]{--design-w:${d.width}px !important;--design-h:${d.height}px !important;--design-aspect:${d.width}/${d.height} !important;}`
    );
  }
  normalized.pages.forEach((page, pi) => {
    (page.blocks || []).forEach((block, bi) => {
      const ov = block.responsive;
      if (!ov || typeof ov !== 'object') return;
      const slot = `p${pi + 1}_b${bi}`;
      for (const bp of BREAKPOINT_ORDER) {
        const d = ov[bp];
        if (!d || typeof d !== 'object') continue;
        const decls = blockDeltaDecls(block, d);
        if (decls) rules.push(`.visual-template-root[data-bp="${bp}"] [data-block-slot="${slot}"]{${decls}}`);
      }
    });
  });
  return rules.join('\n');
}

export function visualBuilderToHtml(state) {
  const normalized = normalizeBuilderState(state);
  const pages = normalized.pages || [];
  const siteTitle = escapeHtml(normalized.siteTitle || 'Page');
  const theme = normalized.theme || defaultTheme();
  const vp = resolveViewport(normalized.viewport);
  const responsive = normalized.responsive;

  const baseCss = buildThemeCss(theme);
  const responsiveCss = responsiveOverrideCss(normalized);

  const rootVid =
    theme.backgroundKind === 'video' && escapeCssUrl(theme.backgroundVideoUrl)
      ? `<div class="tpl-root-video"><video src="${escapeHtml(theme.backgroundVideoUrl)}" autoplay muted loop playsinline></video></div>`
      : '';

  /* Background music — a controlled element driven by useStoryMusic (trim /
     fade / loop / volume). No `autoplay`/`loop` attrs: the runtime starts it
     (on load or first interaction) and handles the trim window + fades. */
  const mus = theme.music && (theme.music.youtubeId || escapeCssUrl(theme.music.url)) ? theme.music : null;
  const musAttrs = mus ? `data-start="${mus.trimStart}" data-end="${mus.trimEnd}" data-fadein="${mus.fadeIn}" data-fadeout="${mus.fadeOut}" data-loop="${mus.loop ? 1 : 0}" data-volume="${mus.volume}"` : '';
  let rootAudio = '';
  if (mus && mus.youtubeId) {
    // Hidden, off-screen host — useStoryMusic mounts the YouTube IFrame player here.
    rootAudio = `<div data-story-music data-yt="${escapeHtml(mus.youtubeId)}" ${musAttrs} style="position:fixed;left:-9999px;top:0;width:200px;height:120px;opacity:0;pointer-events:none;overflow:hidden"></div>`;
  } else if (mus) {
    rootAudio = `<audio data-story-music src="${escapeHtml(mus.url)}" ${musAttrs} preload="auto" playsinline style="display:none"></audio>`;
  }

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
  <style>${baseCss}${responsiveCss ? `\n${responsiveCss}` : ''}</style>
</head>
<body data-deck-mode="pages">
<div class="visual-template-root" data-viewport="${vp.name}"${
    responsive && responsive.enabled ? ` data-responsive="1" data-bp="${responsive.base}"` : ''
  } style="--design-w:${vp.width}px;--design-h:${vp.height}px;--design-aspect:${vp.width}/${vp.height};">
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><clipPath id="tpl-clip-heart" clipPathUnits="objectBoundingBox"><path d="M0.5,1 C0.5,1 0,0.72 0,0.3 C0,0.12 0.16,0 0.3,0 C0.41,0 0.5,0.09 0.5,0.2 C0.5,0.09 0.59,0 0.7,0 C0.84,0 1,0.12 1,0.3 C1,0.72 0.5,1 0.5,1 Z"/></clipPath></defs></svg>
${rootVid}
${rootAudio}
<div class="tpl-viewport-fit"><div class="tpl-viewport-design">
<div class="tpl-pages-stack">
${bodyInner}
</div>
</div></div>
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
  if (!structure) return '';
  /* Accept either legacy html-mode templates OR the new JSON-mode
     templates that carry only a `builderState` tree. The render
     pipeline below works identically once builderState is in hand —
     only the legacy `html` shortcut is mode-gated. */
  const hasBuilderState = structure.builderState && typeof structure.builderState === 'object';
  if (!hasBuilderState) {
    return structure.mode === 'html' ? (structure.html || '') : '';
  }
  if (hasBuilderState) {
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
  /* Convert the drop position to PERCENTAGES of the active design
     canvas so the same block stays at the same relative position when
     the admin toggles between mobile and desktop viewports. `x`/`y` are
     the block's CENTRE point (the canvas drag handler commits the centre,
     not the corner), stored alongside anchor:'center' so the renderer
     pulls the box back onto that point with translate(-50%,-50%) — this
     is what keeps "centred on the grid" identical across viewports.
     Clear any legacy `x`/`y` px values so percentages are the only
     source of truth going forward. */
  const vp = resolveViewport(normalized.viewport);
  let xPct = '';
  let yPct = '';
  if (Number.isFinite(x) && vp.width > 0) {
    xPct = +Math.max(0, Math.min(100, (x / vp.width) * 100)).toFixed(3);
  }
  if (Number.isFinite(y) && vp.height > 0) {
    yPct = +Math.max(0, Math.min(100, (y / vp.height) * 100)).toFixed(3);
  }
  blocks[blockIndex] = { ...block, xPct, yPct, x: '', y: '', anchor: 'center' };
  const pages = [...normalized.pages];
  pages[pageIndex] = { ...page, blocks };
  return { ...normalized, pages };
}

/* ── Per-device editing ────────────────────────────────────────────────
 * The admin editor can design each device (mobile/tablet/desktop) on its
 * own. Edits made while previewing the BASE device write to the block's
 * base fields; edits on any other device write a per-breakpoint override
 * into `block.responsive[device]`. The renderer applies those overrides
 * via `[data-bp="…"]` rules, so the preview/published page shows exactly
 * what was designed for each device. */
function deviceArtboardDims(n, device) {
  const r = n.responsive;
  if (r?.enabled && device && r.breakpoints?.[device]) return r.breakpoints[device];
  return resolveViewport(n.viewport);
}
function isBaseDevice(n, device) {
  const r = n.responsive;
  return !r?.enabled || !device || device === r.base;
}
function editBlockForDevice(state, blockSlotRaw, device, applyBase, applyDelta) {
  const n = normalizeBuilderState(state);
  const m = /^p(\d+)_b(\d+)$/.exec(String(blockSlotRaw || '').trim());
  if (!m) return n;
  const pageIndex = Number(m[1]) - 1;
  const blockIndex = Number(m[2]);
  const page = n.pages[pageIndex];
  if (!page) return n;
  const blocks = [...(page.blocks || [])];
  const block = blocks[blockIndex];
  if (!block) return n;
  if (isBaseDevice(n, device)) {
    blocks[blockIndex] = applyBase(block);
  } else {
    const responsive = { ...(block.responsive || {}) };
    responsive[device] = { ...(responsive[device] || {}), ...applyDelta(block) };
    blocks[blockIndex] = { ...block, responsive };
  }
  const pages = [...n.pages];
  pages[pageIndex] = { ...page, blocks };
  return { ...n, pages };
}

/** Move a block (centre x/y in the active device's artboard px) for a device. */
export function updateBuilderBlockPositionForDevice(state, blockSlotRaw, xRaw, yRaw, device) {
  const n = normalizeBuilderState(state);
  const dims = deviceArtboardDims(n, device);
  const x = Number(xRaw);
  const y = Number(yRaw);
  const xPct = Number.isFinite(x) && dims.width > 0 ? +Math.max(0, Math.min(100, (x / dims.width) * 100)).toFixed(3) : '';
  const yPct = Number.isFinite(y) && dims.height > 0 ? +Math.max(0, Math.min(100, (y / dims.height) * 100)).toFixed(3) : '';
  return editBlockForDevice(
    state,
    blockSlotRaw,
    device,
    (block) => ({ ...block, xPct, yPct, x: '', y: '', anchor: 'center' }),
    () => ({ xPct, yPct, anchor: 'center' }),
  );
}

/** Resize a block (w/h in device artboard px) for a device. Stickers store `size`. */
export function updateBuilderBlockSizeForDevice(state, blockSlotRaw, wRaw, hRaw, device) {
  const w = Number(wRaw);
  const h = Number(hRaw);
  const isSticker = (block) => block?.type === 'sticker';
  const stickerSize = Math.max(20, Math.min(240, Math.round(Math.max(Number.isFinite(w) ? w : 0, Number.isFinite(h) ? h : 0))));
  return editBlockForDevice(
    state,
    blockSlotRaw,
    device,
    (block) => (isSticker(block)
      ? { ...block, size: stickerSize }
      : { ...block, width: w, height: h }),
    (block) => (isSticker(block)
      ? { size: stickerSize }
      : { width: w, height: h }),
  );
}

/** Rotate a block (degrees) for a device. */
export function updateBuilderBlockRotateForDevice(state, blockSlotRaw, degRaw, device) {
  const deg = Math.max(-180, Math.min(180, Math.round(Number(degRaw) || 0)));
  return editBlockForDevice(
    state,
    blockSlotRaw,
    device,
    (block) => ({ ...block, rotateDeg: deg }),
    () => ({ rotateDeg: deg }),
  );
}

/* ── Auto-sync editing (single responsive design) ──────────────────────
 * Every edit writes the ONE base design and clears any per-device override,
 * so a change made while previewing ANY device applies to ALL devices,
 * adapted per screen. Position is stored as a relative % (centre stays
 * centred on every aspect); sizes are scaled from the previewed device's
 * artboard to the base artboard so an element keeps its relative size
 * across devices. `dimsDevice` is the device currently being previewed. */
function setBlockBase(state, blockSlotRaw, patch) {
  const n = normalizeBuilderState(state);
  const m = /^p(\d+)_b(\d+)$/.exec(String(blockSlotRaw || '').trim());
  if (!m) return n;
  const pageIndex = Number(m[1]) - 1;
  const blockIndex = Number(m[2]);
  const page = n.pages[pageIndex];
  if (!page) return n;
  const blocks = [...(page.blocks || [])];
  const block = blocks[blockIndex];
  if (!block) return n;
  // Clear per-device overrides so the design is truly one synced layout.
  blocks[blockIndex] = { ...block, ...patch, responsive: null };
  const pages = [...n.pages];
  pages[pageIndex] = { ...page, blocks };
  return { ...n, pages };
}

/** Auto-align — arrange every element on a page into a clean, centered
 *  vertical stack. Each block is horizontally centered (xPct 50) and the
 *  blocks are spread evenly down the canvas, top to bottom, so nothing piles
 *  in a corner. Rotation is reset and per-device overrides are cleared so the
 *  layout is identical on mobile / tablet / desktop. Sizes the user set are
 *  kept. Undoable like any other edit. */
export function autoAlignBuilderPage(state, pageIndex) {
  return arrangeBuilderPage(state, pageIndex, 'spread');
}

/**
 * Arrange every element on a page into a clean, screen-relative layout.
 * Positions are written as percentages (xPct/yPct), so the layout adapts to
 * every screen size, and per-device overrides are cleared (one synced design).
 *
 * Full layouts (set both axes, reset rotation):
 *   center → centred vertical cluster   ·  spread → evenly top→bottom
 *   stack  → stacked from the top       ·  grid   → tidy grid
 * Quick aligns (one axis, keep the rest):
 *   left / hcenter / right  ·  top / vmiddle / bottom
 */
export function arrangeBuilderPage(state, pageIndex, mode = 'spread') {
  const n = normalizeBuilderState(state);
  const pi = Number.isFinite(Number(pageIndex)) ? Number(pageIndex) : 0;
  const page = n.pages[pi];
  if (!page) return n;
  const src = page.blocks || [];
  const count = src.length;
  if (!count) return n;

  const M = 12;                 // safe margin from each edge (%)
  const span = 100 - 2 * M;     // usable band
  const round = (v) => +Number(v).toFixed(2);
  const base = (b) => ({ ...b, x: '', y: '', anchor: 'center', responsive: null });

  let blocks;

  const keepNum = (v, fb) => (Number.isFinite(Number(v)) && v !== '' ? Number(v) : fb);

  // ── Quick single-axis aligns (keep the other axis) ──
  if (mode === 'left' || mode === 'hcenter' || mode === 'right') {
    const xPct = mode === 'left' ? M + 6 : mode === 'right' ? 100 - M - 6 : 50;
    blocks = src.map((b) => ({ ...base(b), xPct, yPct: keepNum(b.yPct, 50), rotateDeg: b.rotateDeg }));
  } else if (mode === 'top' || mode === 'vmiddle' || mode === 'bottom') {
    const yPct = mode === 'top' ? M + 6 : mode === 'bottom' ? 100 - M - 6 : 50;
    blocks = src.map((b) => ({ ...base(b), xPct: keepNum(b.xPct, 50), yPct, rotateDeg: b.rotateDeg }));

  // ── Grid ──
  } else if (mode === 'grid') {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    blocks = src.map((b, i) => {
      const r = Math.floor(i / cols);
      const rowStart = r * cols;
      const inRow = Math.min(cols, count - rowStart);
      const c = i - rowStart;
      const xPct = inRow === 1 ? 50 : round(M + (span * c) / (inRow - 1));
      const yPct = rows === 1 ? 50 : round(M + (span * r) / (rows - 1));
      return { ...base(b), xPct, yPct, rotateDeg: 0 };
    });

  // ── Vertical layouts: center / stack / spread ──
  } else {
    const gap = Math.min(15, span / Math.max(1, count));   // tight cluster gap (%)
    let top = M;
    let bottom = 100 - M;
    if (mode === 'stack') { top = M; bottom = Math.min(100 - M, M + gap * (count - 1)); }
    else if (mode === 'center') {
      const half = (gap * (count - 1)) / 2;
      top = Math.max(M, 50 - half);
      bottom = Math.min(100 - M, 50 + half);
    }
    blocks = src.map((b, i) => {
      const yPct = count <= 1 ? 50 : round(top + ((bottom - top) * i) / (count - 1));
      return { ...base(b), xPct: 50, yPct, rotateDeg: 0 };
    });
  }

  const pages = [...n.pages];
  pages[pi] = { ...page, blocks };
  return { ...n, pages };
}

/** Commit a dragged position as an explicit centre PERCENTAGE (0–100) of the
 *  element's actual containing box. The canvas measures the drop against the
 *  same box the CSS uses to resolve `top/left` %, so the block lands exactly
 *  where it was released — no vertical drift when the page content overflows
 *  the artboard. Clears per-device overrides (one synced layout). */
export function updateBuilderBlockPositionPctSynced(state, blockSlotRaw, xPctRaw, yPctRaw) {
  const xp = Number(xPctRaw);
  const yp = Number(yPctRaw);
  const xPct = Number.isFinite(xp) ? +Math.max(0, Math.min(100, xp)).toFixed(3) : '';
  const yPct = Number.isFinite(yp) ? +Math.max(0, Math.min(100, yp)).toFixed(3) : '';
  return setBlockBase(state, blockSlotRaw, { xPct, yPct, x: '', y: '', anchor: 'center' });
}

/** Bring one block to the FRONT (end of its page's array = top of z-order).
 *  Used so a freshly-moved element sits above whatever it was dragged over,
 *  not behind it. Returns the new index of the block so the caller can keep
 *  the selection on it. No-op for grouped blocks (groups keep their order). */
export function bringBlockToFrontBySlot(state, blockSlotRaw) {
  const n = normalizeBuilderState(state);
  const m = /^p(\d+)_b(\d+)$/.exec(String(blockSlotRaw || '').trim());
  if (!m) return n;
  const pi = Number(m[1]) - 1;
  const bi = Number(m[2]);
  const page = n.pages[pi];
  if (!page) return n;
  const blocks = page.blocks || [];
  if (bi < 0 || bi >= blocks.length) return n;
  if (blocks[bi].groupId) return n;                 // don't tear a group apart
  if (bi === blocks.length - 1) return n;           // already front-most
  const next = [...blocks.slice(0, bi), ...blocks.slice(bi + 1), blocks[bi]];
  const pages = [...n.pages];
  pages[pi] = { ...page, blocks: next };
  return { ...n, pages };
}

export function updateBuilderBlockPositionSynced(state, blockSlotRaw, xRaw, yRaw, dimsDevice) {
  const n = normalizeBuilderState(state);
  const dims = deviceArtboardDims(n, dimsDevice);
  const x = Number(xRaw);
  const y = Number(yRaw);
  const xPct = Number.isFinite(x) && dims.width > 0 ? +Math.max(0, Math.min(100, (x / dims.width) * 100)).toFixed(3) : '';
  const yPct = Number.isFinite(y) && dims.height > 0 ? +Math.max(0, Math.min(100, (y / dims.height) * 100)).toFixed(3) : '';
  return setBlockBase(state, blockSlotRaw, { xPct, yPct, x: '', y: '', anchor: 'center' });
}

export function updateBuilderBlockSizeSynced(state, blockSlotRaw, wRaw, hRaw, dimsDevice) {
  const n = normalizeBuilderState(state);
  const active = deviceArtboardDims(n, dimsDevice);
  const base = deviceArtboardDims(n, n.responsive?.base);
  // Scale the resize from the previewed artboard to the base artboard so the
  // element holds its relative size on every device.
  const factor = active.width > 0 ? base.width / active.width : 1;
  const w = Number(wRaw) * factor;
  const h = Number(hRaw) * factor;
  const m = /^p(\d+)_b(\d+)$/.exec(String(blockSlotRaw || '').trim());
  if (!m) return n;
  const block = n.pages[Number(m[1]) - 1]?.blocks?.[Number(m[2])];
  if (block?.type === 'sticker') {
    const size = Math.max(20, Math.min(240, Math.round(Math.max(w, h))));
    return setBlockBase(state, blockSlotRaw, { size });
  }
  return setBlockBase(state, blockSlotRaw, {
    width: Math.max(8, Math.min(2000, Math.round(w))),
    height: Math.max(8, Math.min(2000, Math.round(h))),
  });
}

export function updateBuilderBlockRotateSynced(state, blockSlotRaw, degRaw) {
  const deg = Math.max(-180, Math.min(180, Math.round(Number(degRaw) || 0)));
  return setBlockBase(state, blockSlotRaw, { rotateDeg: deg });
}
