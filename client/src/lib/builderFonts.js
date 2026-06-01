/**
 * Self-hosted Builder fonts (via @fontsource).
 *
 * Importing each package registers its @font-face rules in the app's CSS and
 * ships the woff2 files as same-origin assets (the browser fetches a font file
 * only when that family is actually used). This replaces the Google Fonts CDN
 * <link> approach, which silently failed when the CDN was blocked/unreachable —
 * so picked fonts never changed. Now every font in BUILDER_FONT_OPTIONS is
 * guaranteed available in BOTH the editor and the published page (both render
 * through the same app), with no network dependency on Google.
 *
 * Each `import '@fontsource/x'` loads the family's default (400) weight; the
 * browser faux-bolds headings when a heavier weight isn't present, which is
 * fine for the display/script fonts (they ship a single weight anyway).
 *
 * The font-family VALUES here must match the keys in GOOGLE_FONT_LINKS /
 * BUILDER_FONT_OPTIONS in visualTemplateBuilder.js.
 */

/* Clean / sans */
import '@fontsource/inter';
import '@fontsource/dm-sans';
import '@fontsource/outfit';
import '@fontsource/poppins';
import '@fontsource/montserrat';
import '@fontsource/raleway';
import '@fontsource/nunito';
import '@fontsource/quicksand';
import '@fontsource/space-grotesk';
import '@fontsource/fredoka';
import '@fontsource/comfortaa';

/* Elegant / serif */
import '@fontsource/playfair-display';
import '@fontsource/merriweather';
import '@fontsource/lora';
import '@fontsource/cormorant-garamond';
import '@fontsource/cinzel';
import '@fontsource/abril-fatface';

/* Bold / display */
import '@fontsource/bebas-neue';
import '@fontsource/oswald';
import '@fontsource/anton';
import '@fontsource/archivo-black';
import '@fontsource/bungee';
import '@fontsource/righteous';

/* Hand */
import '@fontsource/caveat';
import '@fontsource/permanent-marker';
import '@fontsource/shadows-into-light';
import '@fontsource/indie-flower';
import '@fontsource/kalam';
import '@fontsource/amatic-sc';

/* Script */
import '@fontsource/pacifico';
import '@fontsource/dancing-script';
import '@fontsource/satisfy';
import '@fontsource/great-vibes';
import '@fontsource/lobster';
import '@fontsource/sacramento';
import '@fontsource/yellowtail';
import '@fontsource/cookie';

/* Retro / neon / typewriter */
import '@fontsource/special-elite';
import '@fontsource/courier-prime';
import '@fontsource/press-start-2p';
import '@fontsource/monoton';
import '@fontsource/audiowide';
