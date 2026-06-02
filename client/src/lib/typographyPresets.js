/**
 * 100 one-click typography presets for text blocks.
 *
 * Each preset is a partial patch over a text block, using ONLY fields the
 * renderer understands (see `textEffectStyle` in visualTemplateBuilder.js):
 *   fontFamily, fontWeight, letterSpacingEm, lineHeight, textTransform,
 *   color, textEffect, textGradientFrom, textGradientTo, strokeWidth.
 *
 * Every fontFamily here is one of the 44 self-hosted @fontsource families, so
 * presets always render with the intended type — no FOUT / missing fonts.
 *
 * Applying merges over RESET_PATCH (below) so switching presets never leaves a
 * stale gradient / outline / tracking behind.
 */

// Self-hosted font shorthands ------------------------------------------------
const F = {
  cinzel: '"Cinzel", serif',
  cormorant: '"Cormorant Garamond", serif',
  playfair: '"Playfair Display", Georgia, serif',
  abril: '"Abril Fatface", serif',
  lora: '"Lora", Georgia, serif',
  merri: '"Merriweather", Georgia, serif',
  fredoka: '"Fredoka", system-ui, sans-serif',
  comfortaa: '"Comfortaa", system-ui, sans-serif',
  quicksand: '"Quicksand", system-ui, sans-serif',
  caveat: '"Caveat", cursive',
  indie: '"Indie Flower", cursive',
  shadows: '"Shadows Into Light", cursive',
  kalam: '"Kalam", cursive',
  pacifico: '"Pacifico", cursive',
  cookie: '"Cookie", cursive',
  lobster: '"Lobster", cursive',
  amatic: '"Amatic SC", cursive',
  space: '"Space Grotesk", system-ui, sans-serif',
  outfit: '"Outfit", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  dmsans: '"DM Sans", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  raleway: '"Raleway", system-ui, sans-serif',
  nunito: '"Nunito", system-ui, sans-serif',
  oswald: '"Oswald", sans-serif',
  anton: '"Anton", sans-serif',
  archivo: '"Archivo Black", sans-serif',
  bebas: '"Bebas Neue", sans-serif',
  bungee: '"Bungee", cursive',
  righteous: '"Righteous", cursive',
  greatvibes: '"Great Vibes", cursive',
  dancing: '"Dancing Script", cursive',
  sacramento: '"Sacramento", cursive',
  satisfy: '"Satisfy", cursive',
  yellowtail: '"Yellowtail", cursive',
  marker: '"Permanent Marker", cursive',
  pressstart: '"Press Start 2P", cursive',
  monoton: '"Monoton", cursive',
  audiowide: '"Audiowide", cursive',
  courier: '"Courier Prime", monospace',
};

// Effect builders ------------------------------------------------------------
const grad = (a, b) => ({ textEffect: 'gradient', textGradientFrom: a, textGradientTo: b, color: a });
const neon = (a, b) => ({ textEffect: 'neon', textGradientFrom: a, textGradientTo: b, color: a });
const glow = (color, c1, c2) => ({ textEffect: 'glow', color, textGradientFrom: c1, textGradientTo: c2 || c1 });
const stroke = (c, w = 2) => ({ textEffect: 'stroke', textGradientFrom: c, strokeWidth: w });
const three = { textEffect: '3d' };
const UP = 'uppercase';

let _n = 0;
const mk = (category, label, fontFamily, patch = {}) => ({ id: `tp${++_n}`, category, label, patch: { fontFamily, ...patch } });

export const TYPOGRAPHY_CATEGORIES = [
  'Luxury', 'Cute', 'Modern', 'Romantic', 'Wedding', 'Birthday', 'Gaming', 'Cyberpunk', 'Minimal',
];

/* Fields wiped before each preset is applied, so presets switch cleanly. */
export const RESET_PATCH = {
  textEffect: 'none', textTransform: 'none', letterSpacingEm: 0,
  strokeWidth: '', textGradientFrom: '', textGradientTo: '',
};

export const TYPOGRAPHY_PRESETS = [
  // ── Luxury ──────────────────────────────────────────────────────────────
  mk('Luxury', 'Golden Serif', F.cinzel, { textTransform: UP, letterSpacingEm: 0.18, fontWeight: 600, ...grad('#F5D67A', '#B8860B') }),
  mk('Luxury', 'Cormorant Light', F.cormorant, { fontWeight: 300, letterSpacingEm: 0.08, color: '#EBDCB8' }),
  mk('Luxury', 'Playfair Bold', F.playfair, { fontWeight: 800, color: '#FFFFFF', textEffect: 'shadow' }),
  mk('Luxury', 'Couture Caps', F.cinzel, { textTransform: UP, letterSpacingEm: 0.26, fontWeight: 700, color: '#D4AF37' }),
  mk('Luxury', 'Abril Editorial', F.abril, { color: '#F3E9D2' }),
  mk('Luxury', 'Velvet Glow', F.playfair, { fontWeight: 600, ...glow('#E8C9A0', '#C9A24B') }),
  mk('Luxury', 'Monogram Gold', F.cinzel, { textTransform: UP, letterSpacingEm: 0.3, ...grad('#FFF6D5', '#C9A24B') }),
  mk('Luxury', 'Champagne', F.cormorant, { fontWeight: 500, letterSpacingEm: 0.12, color: '#EAD7A0' }),
  mk('Luxury', 'Noir Caps', F.bebas, { textTransform: UP, letterSpacingEm: 0.2, color: '#FFFFFF', textEffect: 'shadow' }),
  mk('Luxury', 'Gilded', F.playfair, { fontWeight: 700, ...grad('#FCEFC7', '#BF953F') }),
  mk('Luxury', 'Estate Serif', F.lora, { fontWeight: 600, letterSpacingEm: 0.04, color: '#E6D2A8' }),

  // ── Cute ────────────────────────────────────────────────────────────────
  mk('Cute', 'Bubbly Pink', F.fredoka, { fontWeight: 600, color: '#FF7AA2' }),
  mk('Cute', 'Marshmallow', F.comfortaa, { fontWeight: 700, ...glow('#FFC1DD', '#FF8FC0') }),
  mk('Cute', 'Candy Pop', F.fredoka, { fontWeight: 700, ...grad('#FF8FB1', '#FFD36E') }),
  mk('Cute', 'Doodle', F.indie, { color: '#FF6F91' }),
  mk('Cute', 'Sweet Script', F.caveat, { fontWeight: 700, color: '#F8718E' }),
  mk('Cute', 'Jelly Mint', F.quicksand, { fontWeight: 700, ...grad('#7AE7C7', '#FFC4E1') }),
  mk('Cute', 'Sticker', F.shadows, { color: '#6C63FF' }),
  mk('Cute', 'Sunny 3D', F.fredoka, { fontWeight: 600, color: '#FFB703', ...three }),
  mk('Cute', 'Cupcake', F.pacifico, { color: '#FF85A1' }),
  mk('Cute', 'Crayon', F.kalam, { fontWeight: 700, color: '#FF6F61' }),
  mk('Cute', 'Pastel Pop', F.comfortaa, { fontWeight: 600, color: '#B197FC' }),

  // ── Modern ──────────────────────────────────────────────────────────────
  mk('Modern', 'Neo Grotesk', F.space, { fontWeight: 700, letterSpacingEm: -0.01, color: '#FFFFFF' }),
  mk('Modern', 'Outfit Bold', F.outfit, { fontWeight: 800, color: '#FFFFFF' }),
  mk('Modern', 'Mono Caps', F.space, { textTransform: UP, letterSpacingEm: 0.18, fontWeight: 600, color: '#E5E7EB' }),
  mk('Modern', 'Gradient Pop', F.poppins, { fontWeight: 800, ...grad('#6366F1', '#EC4899') }),
  mk('Modern', 'Tight Display', F.montserrat, { fontWeight: 900, letterSpacingEm: -0.02, color: '#FFFFFF' }),
  mk('Modern', 'Editorial Sans', F.inter, { fontWeight: 700, color: '#F3F4F6' }),
  mk('Modern', 'Oswald Stack', F.oswald, { textTransform: UP, letterSpacingEm: 0.05, fontWeight: 600, color: '#FFFFFF' }),
  mk('Modern', 'Archivo Heavy', F.archivo, { color: '#FFFFFF', textEffect: 'shadow' }),
  mk('Modern', 'Bebas Headline', F.bebas, { textTransform: UP, letterSpacingEm: 0.04, color: '#FFFFFF' }),
  mk('Modern', 'Cool Gradient', F.dmsans, { fontWeight: 800, ...grad('#22D3EE', '#3B82F6') }),
  mk('Modern', 'Minimal Bold', F.inter, { fontWeight: 800, letterSpacingEm: -0.01, color: '#FFFFFF' }),

  // ── Romantic ────────────────────────────────────────────────────────────
  mk('Romantic', 'Love Letter', F.greatvibes, { color: '#FF6B8A' }),
  mk('Romantic', 'Dancing Heart', F.dancing, { fontWeight: 700, ...glow('#F472B6', '#FB7185') }),
  mk('Romantic', 'Sweetheart', F.sacramento, { color: '#EC4899' }),
  mk('Romantic', 'Tender', F.satisfy, { color: '#FB7185' }),
  mk('Romantic', 'Amour Gradient', F.dancing, { fontWeight: 700, ...grad('#FB7185', '#F472B6') }),
  mk('Romantic', 'Whisper', F.sacramento, { color: '#F9A8D4' }),
  mk('Romantic', 'Rose', F.yellowtail, { color: '#E11D48' }),
  mk('Romantic', 'Eternal', F.greatvibes, { ...grad('#FDA4AF', '#F43F5E') }),
  mk('Romantic', 'Soft Serif', F.cormorant, { fontWeight: 500, color: '#FBCFE8' }),
  mk('Romantic', 'Cherish', F.satisfy, { ...glow('#FF8FAB', '#F472B6') }),
  mk('Romantic', 'Adore', F.pacifico, { color: '#F472B6' }),

  // ── Wedding ─────────────────────────────────────────────────────────────
  mk('Wedding', 'Eternal Vows', F.greatvibes, { color: '#C9A24B' }),
  mk('Wedding', 'Classic Cinzel', F.cinzel, { textTransform: UP, letterSpacingEm: 0.2, color: '#FFFFFF' }),
  mk('Wedding', 'Blush Script', F.sacramento, { color: '#E8B4B8' }),
  mk('Wedding', 'Golden Vows', F.greatvibes, { ...grad('#F5D67A', '#B8860B') }),
  mk('Wedding', 'Cormorant Elegant', F.cormorant, { fontWeight: 500, letterSpacingEm: 0.06, color: '#F3E9D2' }),
  mk('Wedding', 'Save the Date', F.cinzel, { textTransform: UP, letterSpacingEm: 0.25, color: '#D4AF37' }),
  mk('Wedding', 'Lace', F.dancing, { fontWeight: 600, color: '#D8A7B1' }),
  mk('Wedding', 'Ivory Serif', F.playfair, { fontWeight: 600, color: '#F7F1E3' }),
  mk('Wedding', 'Champagne Toast', F.cormorant, { fontWeight: 600, ...grad('#FCEFC7', '#BF953F') }),
  mk('Wedding', 'Forever', F.greatvibes, { ...glow('#FFFFFF', '#E6C77E') }),
  mk('Wedding', 'Monogram Caps', F.cinzel, { textTransform: UP, letterSpacingEm: 0.3, ...grad('#FFF6D5', '#C9A24B') }),

  // ── Birthday ────────────────────────────────────────────────────────────
  mk('Birthday', 'Party Time', F.fredoka, { fontWeight: 700, ...grad('#FF6B6B', '#FFD93D') }),
  mk('Birthday', 'Confetti', F.bungee, { color: '#FF5DA2' }),
  mk('Birthday', 'Balloon Pop', F.righteous, { color: '#FF7A00', ...three }),
  mk('Birthday', 'Lobster Fun', F.lobster, { color: '#F94144' }),
  mk('Birthday', 'Cheer', F.pacifico, { color: '#FF477E' }),
  mk('Birthday', 'Sprinkle', F.fredoka, { fontWeight: 700, ...grad('#A78BFA', '#F472B6') }),
  mk('Birthday', 'Marker', F.marker, { color: '#06D6A0' }),
  mk('Birthday', 'Hooray', F.bungee, { ...grad('#FFB703', '#FB5607') }),
  mk('Birthday', 'Sweet Sixteen', F.caveat, { fontWeight: 700, color: '#FF70A6' }),
  mk('Birthday', 'Funfair', F.righteous, { ...grad('#4CC9F0', '#F72585') }),
  mk('Birthday', 'Candle Glow', F.fredoka, { fontWeight: 600, ...glow('#FFD166', '#FF9F1C') }),

  // ── Gaming ──────────────────────────────────────────────────────────────
  mk('Gaming', 'Pixel Quest', F.pressstart, { color: '#39FF14' }),
  mk('Gaming', 'Arcade Neon', F.audiowide, { ...neon('#00E5FF', '#0091FF') }),
  mk('Gaming', 'Power Up', F.bungee, { ...grad('#F72585', '#7209B7') }),
  mk('Gaming', 'Boss Level', F.anton, { textTransform: UP, letterSpacingEm: 0.04, ...stroke('#FFFFFF', 2) }),
  mk('Gaming', 'Retro 8-bit', F.pressstart, { color: '#FFD500' }),
  mk('Gaming', 'Joystick', F.audiowide, { ...neon('#FF00E5', '#00E5FF') }),
  mk('Gaming', 'High Score', F.righteous, { color: '#FFE600', ...three }),
  mk('Gaming', 'Player One', F.pressstart, { color: '#00FFB2' }),
  mk('Gaming', 'Turbo', F.anton, { textTransform: UP, ...grad('#FF512F', '#DD2476') }),
  mk('Gaming', 'HUD Glow', F.audiowide, { ...glow('#00E5FF', '#0091FF') }),
  mk('Gaming', 'Champion', F.archivo, { textTransform: UP, color: '#FFD700', textEffect: 'shadow' }),

  // ── Cyberpunk ───────────────────────────────────────────────────────────
  mk('Cyberpunk', 'Neon Grid', F.monoton, { ...neon('#FF2A6D', '#05D9E8') }),
  mk('Cyberpunk', 'Synthwave', F.audiowide, { ...grad('#FF2A6D', '#05D9E8') }),
  mk('Cyberpunk', 'Hologram', F.audiowide, { ...neon('#05D9E8', '#39FF14') }),
  mk('Cyberpunk', 'Glitch', F.bebas, { textTransform: UP, letterSpacingEm: 0.1, color: '#FF2A6D', ...stroke('#05D9E8', 1.5) }),
  mk('Cyberpunk', 'Matrix', F.courier, { ...glow('#00FF9F', '#00B36B') }),
  mk('Cyberpunk', 'Cyber Caps', F.oswald, { textTransform: UP, letterSpacingEm: 0.2, ...glow('#05D9E8', '#0091FF') }),
  mk('Cyberpunk', 'Vaporwave', F.monoton, { ...grad('#B967FF', '#05D9E8') }),
  mk('Cyberpunk', 'Circuit', F.audiowide, { ...neon('#FEE715', '#FF6B00') }),
  mk('Cyberpunk', 'Override', F.anton, { textTransform: UP, ...neon('#FF2A6D', '#7700FF') }),
  mk('Cyberpunk', 'Night City', F.monoton, { ...neon('#FF2A6D', '#7700FF') }),
  mk('Cyberpunk', 'Data Stream', F.courier, { letterSpacingEm: 0.1, color: '#05D9E8' }),

  // ── Minimal ─────────────────────────────────────────────────────────────
  mk('Minimal', 'Whisper Caps', F.inter, { fontWeight: 300, textTransform: UP, letterSpacingEm: 0.3, color: 'rgba(255,255,255,0.82)' }),
  mk('Minimal', 'Thin Line', F.inter, { fontWeight: 200, letterSpacingEm: 0.02, color: '#FFFFFF' }),
  mk('Minimal', 'Mono Label', F.space, { fontWeight: 500, textTransform: UP, letterSpacingEm: 0.25, color: '#E5E7EB' }),
  mk('Minimal', 'Editorial', F.cormorant, { fontWeight: 400, color: '#E5E7EB' }),
  mk('Minimal', 'Quiet', F.dmsans, { fontWeight: 400, letterSpacingEm: 0.01, color: '#D1D5DB' }),
  mk('Minimal', 'Spaced', F.montserrat, { fontWeight: 400, textTransform: UP, letterSpacingEm: 0.35, color: '#FFFFFF' }),
  mk('Minimal', 'Clean Serif', F.lora, { fontWeight: 400, color: '#E5E7EB' }),
  mk('Minimal', 'Understated', F.outfit, { fontWeight: 300, color: '#FFFFFF' }),
  mk('Minimal', 'Fine Print', F.inter, { fontWeight: 400, textTransform: UP, letterSpacingEm: 0.05, color: '#9CA3AF' }),
  mk('Minimal', 'Bare', F.inter, { fontWeight: 500, color: '#FFFFFF' }),
  mk('Minimal', 'Lowercase', F.dmsans, { fontWeight: 400, textTransform: 'lowercase', letterSpacingEm: 0.02, color: '#E5E7EB' }),
  mk('Minimal', 'Hairline', F.raleway, { fontWeight: 200, textTransform: UP, letterSpacingEm: 0.2, color: '#FFFFFF' }),
];
