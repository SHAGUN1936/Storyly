/**
 * Starter templates — preset builderState snapshots that load into the
 * Admin builder. Each starter pairs with one of the user-facing
 * categories (Birthday / Love / Wedding / Friendship / Memories) so the
 * picker → category → editor flow is consistent.
 *
 * Design rules for new starters:
 *   • Each page = a small focused stack (eyebrow → heading → support
 *     text → optional media → CTA). The .page-inner flex layout in
 *     visualTemplateBuilder is `justify-content: center; gap: 14px` so
 *     stack blocks render vertically centered on the canvas with
 *     consistent spacing — no per-block `marginTop` jitter required.
 *   • Use only block fields the renderer + editor both understand:
 *     `type`, `text`, `align`, `enterAnimation`, `enterDelayMs`,
 *     `textEffect`, `textGradientFrom/To`, `emoji`, `size`,
 *     `label`, `navPage`, `buttonStyle`, `slotPrefix`, `count`,
 *     `columns`, `gap`, `radius`. NO custom marginTop / marginBottom.
 *   • `accent` is the always-on fallback gradient if the Unsplash
 *     `image` thumb fails to load (the Admin card uses an onError
 *     handler to hide the broken <img>).
 */

import { defaultScheduledReveal, defaultTheme, defaultResponsiveConfig } from './visualTemplateBuilder.js';

function theme(overrides) {
  return { ...defaultTheme(), ...overrides };
}

function page(id, title, pageOverrides, blocks) {
  return {
    id,
    pageTitle: title,
    pageBackground: '',
    blocks,
    ...pageOverrides,
  };
}

const RAW_STARTERS = [
  /* ── Birthday ─────────────────────────────────────────────── */
  {
    id: 'starter-birthday',
    name: 'Birthday Bash',
    category: 'Birthday',
    emoji: '🎂',
    description: 'A 4-page birthday story — countdown, photo memories, wishes.',
    accent: 'linear-gradient(135deg,#f43f5e,#d946ef)',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=500&q=70&auto=format&fit=crop',
    builderState: {
      version: 2,
      siteTitle: 'Happy Birthday 🎂',
      theme: theme({
        pageBackground: '#1f0a2b',
        textColor: '#fff5f7',
        headingColor: '#ffd166',
        buttonBackground: '#ffd166',
        buttonText: '#1f0a2b',
        backgroundKind: 'gradient',
        gradientFrom: '#1f0a2b',
        gradientTo: '#d946ef',
        gradientAngle: 145,
        fontFamily: '"Fredoka", system-ui, sans-serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('bd1', 'Cover', {}, [
          { type: 'text', text: 'A LITTLE SURPRISE INSIDE', align: 'center' },
          { type: 'heading', text: 'Happy Birthday', align: 'center', textEffect: 'gradient', textGradientFrom: '#ffd166', textGradientTo: '#fb7185', enterAnimation: 'pop' },
          { type: 'sticker', emoji: '🎉', size: 88, enterAnimation: 'bounce' },
          { type: 'text', text: 'Made just for you — open it slowly.', align: 'center', enterAnimation: 'fadeIn', enterDelayMs: 350 },
          { type: 'button', label: 'Tap to begin →', navPage: 2, buttonStyle: 'float', align: 'center' },
        ]),
        page('bd2', 'Memories', {}, [
          { type: 'heading', text: 'Our favorite moments', align: 'center', textEffect: 'glow', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 4, slotPrefix: 'bd', columns: 2, gap: 10, radius: 16 },
          { type: 'button', label: 'Make a wish →', navPage: 3, buttonStyle: 'stable', align: 'center' },
        ]),
        page('bd3', 'Wish', {}, [
          { type: 'sticker', emoji: '🕯️', size: 92, enterAnimation: 'bounce' },
          { type: 'heading', text: 'Make a wish', align: 'center', textEffect: 'neon', enterAnimation: 'zoom' },
          { type: 'text', text: 'Eyes closed. Big smile. Blow it out.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'button', label: 'Read the message →', navPage: 4, buttonStyle: 'float', align: 'center' },
        ]),
        page('bd4', 'Message', {}, [
          { type: 'sticker', emoji: '💌', size: 80, enterAnimation: 'pop' },
          { type: 'heading', text: 'From me to you', align: 'center', textEffect: 'gradient', textGradientFrom: '#fb7185', textGradientTo: '#d946ef', enterAnimation: 'pop' },
          { type: 'text', text: 'Type your message here. Make it real. They deserve every word.', align: 'center', enterAnimation: 'slideUp' },
        ]),
      ],
    },
  },

  /* ── Love ─────────────────────────────────────────────────── */
  {
    id: 'starter-love',
    name: 'For You',
    category: 'Love',
    emoji: '💖',
    description: 'A heartfelt 3-page love note — eyebrow, message, share.',
    accent: 'linear-gradient(135deg,#fb7185,#a78bfa)',
    image: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=500&q=70&auto=format&fit=crop',
    builderState: {
      version: 2,
      siteTitle: 'For You 💖',
      theme: theme({
        pageBackground: '#1a0820',
        textColor: '#fdf2f8',
        headingColor: '#fbcfe8',
        buttonBackground: '#fbcfe8',
        buttonText: '#1a0820',
        backgroundKind: 'gradient',
        gradientFrom: '#1a0820',
        gradientTo: '#9d174d',
        gradientAngle: 155,
        fontFamily: '"Playfair Display", Georgia, serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('lv1', 'Cover', {}, [
          { type: 'text', text: 'FOR THE ONE WHO HOLDS MY HEART', align: 'center' },
          { type: 'heading', text: 'Just you.', align: 'center', textEffect: 'gradient', textGradientFrom: '#fbcfe8', textGradientTo: '#fb7185', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '💖', size: 80, enterAnimation: 'pop' },
          { type: 'button', label: 'Open the letter →', navPage: 2, buttonStyle: 'float', align: 'center' },
        ]),
        page('lv2', 'Letter', {}, [
          { type: 'heading', text: 'Some things I want you to know', align: 'center', textEffect: 'glow', enterAnimation: 'slideUp' },
          { type: 'text', text: 'Write the letter that you keep meaning to write. The little things. The big things. All of it.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '🌹', size: 64, enterAnimation: 'bounce', enterDelayMs: 300 },
          { type: 'button', label: 'Almost done →', navPage: 3, buttonStyle: 'stable', align: 'center' },
        ]),
        page('lv3', 'Forever', {}, [
          { type: 'heading', text: 'Forever and a day', align: 'center', textEffect: 'gradient', textGradientFrom: '#fbcfe8', textGradientTo: '#a78bfa', enterAnimation: 'pop' },
          { type: 'text', text: 'Wherever you go, this is here. Read it again whenever you need to.', align: 'center', enterAnimation: 'slideUp' },
          { type: 'sticker', emoji: '🌙', size: 72, enterAnimation: 'bounce' },
        ]),
      ],
    },
  },

  /* ── Wedding ──────────────────────────────────────────────── */
  {
    id: 'starter-wedding',
    name: 'Wedding Invite',
    category: 'Wedding',
    emoji: '💍',
    description: 'A 4-page invitation — save the date, ceremony, RSVP.',
    accent: 'linear-gradient(135deg,#fbcfe8,#a78bfa)',
    image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=70&auto=format&fit=crop',
    builderState: {
      version: 2,
      siteTitle: 'Save the Date 💍',
      theme: theme({
        pageBackground: '#fdf2f8',
        textColor: '#3b0764',
        headingColor: '#7c2d70',
        buttonBackground: '#a78bfa',
        buttonText: '#fdf2f8',
        backgroundKind: 'gradient',
        gradientFrom: '#fdf2f8',
        gradientTo: '#e9d5ff',
        gradientAngle: 160,
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('wd1', 'Save the date', {}, [
          { type: 'text', text: 'SAVE THE DATE', align: 'center' },
          { type: 'heading', text: 'Ananya & Rohan', align: 'center', textEffect: 'glow', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '💐', size: 72, enterAnimation: 'pop' },
          { type: 'text', text: 'We\'re getting married — and we\'d love for you to be there.', align: 'center', enterAnimation: 'fadeIn', enterDelayMs: 300 },
          { type: 'button', label: 'See the details →', navPage: 2, buttonStyle: 'stable', align: 'center' },
        ]),
        page('wd2', 'Ceremony', {}, [
          { type: 'heading', text: 'The ceremony', align: 'center', enterAnimation: 'slideUp' },
          { type: 'text', text: 'Saturday, the twenty-fifth of October.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'text', text: '4:00 PM · The Banyan Garden, Goa', align: 'center', enterAnimation: 'fadeIn', enterDelayMs: 200 },
          { type: 'sticker', emoji: '💍', size: 64, enterAnimation: 'bounce' },
          { type: 'button', label: 'How to reach →', navPage: 3, buttonStyle: 'stable', align: 'center' },
        ]),
        page('wd3', 'Reception', {}, [
          { type: 'heading', text: 'And then we dance', align: 'center', textEffect: 'gradient', textGradientFrom: '#7c2d70', textGradientTo: '#a78bfa', enterAnimation: 'pop' },
          { type: 'text', text: 'Sit-down dinner, live music, and the longest hugs of our lives.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '🥂', size: 64, enterAnimation: 'bounce' },
          { type: 'button', label: 'RSVP →', navPage: 4, buttonStyle: 'float', align: 'center' },
        ]),
        page('wd4', 'RSVP', {}, [
          { type: 'heading', text: 'Will you be there?', align: 'center', enterAnimation: 'zoom' },
          { type: 'text', text: 'Tap below to let us know. We can\'t wait to see you.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '💌', size: 72, enterAnimation: 'pop' },
          { type: 'button', label: 'Yes, I\'ll be there', buttonStyle: 'float', align: 'center' },
        ]),
      ],
    },
  },

  /* ── Friendship ───────────────────────────────────────────── */
  {
    id: 'starter-friendship',
    name: 'Squad Goals',
    category: 'Friendship',
    emoji: '🫶',
    description: 'A playful 4-page tribute for your best friends — inside jokes, photos, feels.',
    accent: 'linear-gradient(135deg,#fde68a,#fb7185,#a78bfa)',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&q=70&auto=format&fit=crop',
    builderState: {
      version: 2,
      siteTitle: 'Squad Goals 🫶',
      theme: theme({
        pageBackground: '#0f172a',
        textColor: '#fffbeb',
        headingColor: '#fde68a',
        buttonBackground: '#fde68a',
        buttonText: '#0f172a',
        backgroundKind: 'gradient',
        gradientFrom: '#0f172a',
        gradientTo: '#7c3aed',
        gradientAngle: 150,
        fontFamily: '"Fredoka", system-ui, sans-serif',
        pageAnimation: 'slideUp',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('fr1', 'Cover', {}, [
          { type: 'text', text: 'THE OFFICIAL SQUAD PAGE', align: 'center' },
          { type: 'heading', text: 'My favorite humans', align: 'center', textEffect: 'gradient', textGradientFrom: '#fde68a', textGradientTo: '#fb7185', enterAnimation: 'pop' },
          { type: 'sticker', emoji: '🫶', size: 92, enterAnimation: 'bounce' },
          { type: 'text', text: 'Six chaotic angels. One ridiculous group chat.', align: 'center', enterAnimation: 'fadeIn', enterDelayMs: 350 },
          { type: 'button', label: 'Meet them →', navPage: 2, buttonStyle: 'float', align: 'center' },
        ]),
        page('fr2', 'Roll call', {}, [
          { type: 'heading', text: 'The roll call', align: 'center', textEffect: 'glow', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 6, slotPrefix: 'fr', columns: 3, gap: 8, radius: 14 },
          { type: 'button', label: 'Greatest hits →', navPage: 3, buttonStyle: 'stable', align: 'center' },
        ]),
        page('fr3', 'Highlights', {}, [
          { type: 'heading', text: 'Greatest hits', align: 'center', textEffect: 'neon', enterAnimation: 'zoom' },
          { type: 'text', text: '🎤 The karaoke night nobody remembers', align: 'center' },
          { type: 'text', text: '🏖️ The beach trip we said would be chill', align: 'center' },
          { type: 'text', text: '🍕 The 3am pizza tradition', align: 'center' },
          { type: 'button', label: 'Wrap it up →', navPage: 4, buttonStyle: 'float', align: 'center' },
        ]),
        page('fr4', 'Forever', {}, [
          { type: 'sticker', emoji: '🥹', size: 88, enterAnimation: 'bounce' },
          { type: 'heading', text: 'You\'re stuck with me', align: 'center', textEffect: 'gradient', textGradientFrom: '#fde68a', textGradientTo: '#fb7185', enterAnimation: 'pop' },
          { type: 'text', text: 'Through every mood, every move, every chapter. Always.', align: 'center', enterAnimation: 'slideUp' },
        ]),
      ],
    },
  },

  /* ── Memories ─────────────────────────────────────────────── */
  {
    id: 'starter-memories',
    name: 'Our Memories',
    category: 'Memories',
    emoji: '📸',
    description: 'A nostalgic 4-page memory book — photos, captions, a closing letter.',
    accent: 'linear-gradient(135deg,#fda4af,#a78bfa,#60a5fa)',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=500&q=70&auto=format&fit=crop',
    builderState: {
      version: 2,
      siteTitle: 'Our Memories 📸',
      theme: theme({
        pageBackground: '#1e1b4b',
        textColor: '#fdf2f8',
        headingColor: '#fbcfe8',
        buttonBackground: '#fbcfe8',
        buttonText: '#1e1b4b',
        backgroundKind: 'gradient',
        gradientFrom: '#1e1b4b',
        gradientTo: '#831843',
        gradientAngle: 160,
        fontFamily: '"Playfair Display", Georgia, serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('mm1', 'Cover', {}, [
          { type: 'text', text: 'ONCE UPON A TIME', align: 'center' },
          { type: 'heading', text: 'Our story so far', align: 'center', textEffect: 'gradient', textGradientFrom: '#fbcfe8', textGradientTo: '#a78bfa', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '✨', size: 72, enterAnimation: 'pop' },
          { type: 'text', text: 'A little scrapbook for the moments that matter.', align: 'center', enterAnimation: 'fadeIn', enterDelayMs: 400 },
          { type: 'button', label: 'Open the book →', navPage: 2, buttonStyle: 'float', align: 'center' },
        ]),
        page('mm2', 'Adventures', {}, [
          { type: 'heading', text: 'The adventures', align: 'center', textEffect: 'glow', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 4, slotPrefix: 'mm', columns: 2, gap: 12, radius: 18 },
          { type: 'button', label: 'Next chapter →', navPage: 3, buttonStyle: 'stable', align: 'center' },
        ]),
        page('mm3', 'Letter', {}, [
          { type: 'sticker', emoji: '💌', size: 80, enterAnimation: 'pop' },
          { type: 'heading', text: 'A letter to you', align: 'center', textEffect: 'gradient', textGradientFrom: '#fbcfe8', textGradientTo: '#fda4af', enterAnimation: 'zoom' },
          { type: 'text', text: 'Write the words you never quite found the time to say. The little ones, the big ones — all of them.', align: 'center', enterAnimation: 'fadeIn' },
          { type: 'button', label: 'See the closing →', navPage: 4, buttonStyle: 'float', align: 'center' },
        ]),
        page('mm4', 'Forever', {}, [
          { type: 'sticker', emoji: '🌙', size: 88, enterAnimation: 'bounce' },
          { type: 'heading', text: 'To be continued…', align: 'center', textEffect: 'neon', enterAnimation: 'pop' },
          { type: 'text', text: 'Here\'s to the next chapter, and every page after that.', align: 'center', enterAnimation: 'slideUp' },
        ]),
      ],
    },
  },
];

/* Give each block a polished type hierarchy so a starter loads looking
   like a finished, designed page — not a flat stack of same-size text.
   Eyebrows (the all-caps line) become small letter-spaced caps, headings
   get a big bold display size, body copy gets a comfy reading size +
   measure. Existing fields on a block always win (spread last). */
function styleBlock(b) {
  if (!b || typeof b !== 'object') return b;
  if (b.type === 'heading') {
    return { fontSize: 36, fontWeight: 800, lineHeight: 1.14, ...b };
  }
  if (b.type === 'text') {
    const t = typeof b.text === 'string' ? b.text : '';
    const isEyebrow = t.length > 0 && t === t.toUpperCase() && /[A-Z]/.test(t);
    return isEyebrow
      ? { fontSize: 12.5, textTransform: 'uppercase', letterSpacingEm: 0.22, fontWeight: 700, ...b }
      : { fontSize: 16.5, lineHeight: 1.7, maxWidth: 300, ...b };
  }
  return b;
}

/* Ship every starter mobile-first and responsive-ready so it loads as a
   polished, centred portrait story by default (these are invitation/story
   designs — portrait is their natural shape). Content uses flow layout, so
   it stays beautifully aligned on EVERY device automatically; the admin can
   then switch device + tweak per-device from there. */
export const STARTER_TEMPLATES = RAW_STARTERS.map((t) => ({
  ...t,
  builderState: {
    viewport: 'mobile',
    responsive: defaultResponsiveConfig('mobile'),
    ...t.builderState,
    pages: (t.builderState.pages || []).map((p) => ({
      ...p,
      blocks: (p.blocks || []).map(styleBlock),
    })),
  },
}));
