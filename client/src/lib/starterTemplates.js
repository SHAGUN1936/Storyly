/**
 * Starter templates: preset builderState snapshots that load into the Admin builder
 * (or anywhere normalizeBuilderState is used). Designed to be ready-to-publish with
 * minimal editing — just swap text & photos.
 */

import { defaultScheduledReveal, defaultTheme } from './visualTemplateBuilder.js';

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

export const STARTER_TEMPLATES = [
  /* ── 1. Birthday vibe ────────────────────────────────────── */
  {
    id: 'starter-birthday',
    name: 'Birthday Bash',
    category: 'Birthday',
    emoji: '🎂',
    description: 'A 4-page birthday story with countdown, photo memories and wishes.',
    accent: 'linear-gradient(135deg,#f43f5e,#d946ef)',
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
        audioUrl: 'https://cdn.pixabay.com/audio/2022/03/19/audio_270f49b83a.mp3',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('bd1', 'Cover', {}, [
          { type: 'heading', text: 'Happy Birthday! 🎂', textEffect: 'gradient', textGradientFrom: '#ffd166', textGradientTo: '#fb7185', enterAnimation: 'pop' },
          { type: 'text', text: 'A tiny surprise inside ✨', enterAnimation: 'fadeIn', enterDelayMs: 400 },
          { type: 'sticker', emoji: '🎉', size: 88, enterAnimation: 'bounce' },
          { type: 'button', label: 'Tap to begin →', navPage: 2, buttonStyle: 'float' },
        ]),
        page('bd2', 'Photos', {}, [
          { type: 'heading', text: 'Our memories', textEffect: 'glow', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 6, slotPrefix: 'bd', galleryAnimation: 'slideshow', photoDurationMs: 1500 },
          { type: 'button', label: 'Next ➡️', navPage: 3, buttonStyle: 'stable', showAfterGallery: true },
        ]),
        page('bd3', 'Wishes', {}, [
          { type: 'heading', text: 'Make a wish 🌟', textEffect: 'neon', enterAnimation: 'zoom' },
          { type: 'text', text: 'Eyes closed. Big smile. Blow out the candle.', enterAnimation: 'fadeIn' },
          { type: 'sticker', emoji: '🕯', size: 96, enterAnimation: 'bounce', enterDelayMs: 300 },
          { type: 'button', label: 'Open the message 💌', navPage: 4, buttonStyle: 'float' },
        ]),
        page('bd4', 'Message', {}, [
          { type: 'heading', text: 'From me to you 💖', textEffect: 'gradient', textGradientFrom: '#fb7185', textGradientTo: '#d946ef', enterAnimation: 'pop' },
          { type: 'text', text: 'Type your message here. Make it long. Make it real. They deserve every word.', enterAnimation: 'slideUp' },
          { type: 'sticker', emoji: '🥳', size: 80, enterAnimation: 'bounce' },
        ]),
      ],
    },
  },

  /* ── 2. Wedding ────────────────────────────────────────── */
  {
    id: 'starter-wedding',
    name: 'Wedding Invite',
    category: 'Wedding',
    emoji: '💍',
    description: 'Elegant 4-page wedding invite with date countdown, venue, dress code.',
    accent: 'linear-gradient(135deg,#fbcfe8,#a78bfa)',
    builderState: {
      version: 2,
      siteTitle: 'Save the date 💍',
      theme: theme({
        pageBackground: '#fff7f3',
        textColor: '#3b1d2e',
        headingColor: '#7c2d6f',
        buttonBackground: '#3b1d2e',
        buttonText: '#fff7f3',
        backgroundKind: 'gradient',
        gradientFrom: '#fff7f3',
        gradientTo: '#fbcfe8',
        gradientAngle: 160,
        fontFamily: '"Cormorant Garamond", serif',
        pageAnimation: 'drift',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('wd1', 'Save the date', {}, [
          { type: 'heading', text: 'Riya & Arjun', textEffect: 'shadow', enterAnimation: 'zoom', fontFamily: '"Great Vibes", cursive' },
          { type: 'text', text: 'together with our families', letterSpacingEm: 0.18, enterAnimation: 'fadeIn', enterDelayMs: 300 },
          { type: 'text', text: 'invite you to celebrate our wedding', enterAnimation: 'fadeIn', enterDelayMs: 600 },
          { type: 'button', label: 'See the details →', navPage: 2, buttonStyle: 'stable' },
        ]),
        page('wd2', 'When & where', {}, [
          { type: 'heading', text: 'When & Where', enterAnimation: 'slideUp', fontFamily: '"Cinzel", serif' },
          { type: 'text', text: 'Saturday · 14 February 2026', letterSpacingEm: 0.1 },
          { type: 'text', text: 'The Leela Palace · Bengaluru', letterSpacingEm: 0.05 },
          { type: 'sticker', emoji: '🌸', size: 64, enterAnimation: 'pop' },
          { type: 'button', label: 'Continue', navPage: 3, buttonStyle: 'stable' },
        ]),
        page('wd3', 'Dress code', {}, [
          { type: 'heading', text: 'Dress code', enterAnimation: 'fadeIn' },
          { type: 'text', text: 'Pastels & gold tones 🌷', enterAnimation: 'slideUp' },
          { type: 'sticker', emoji: '💐', size: 88, enterAnimation: 'bounce' },
          { type: 'button', label: 'RSVP →', navPage: 4, buttonStyle: 'float' },
        ]),
        page('wd4', 'RSVP', {}, [
          { type: 'heading', text: 'Will you be there? 💌', textEffect: 'gradient', textGradientFrom: '#a78bfa', textGradientTo: '#d946ef' },
          { type: 'text', text: 'Reply by 1 February with a yes or no. We hope you can make it.' },
          { type: 'sticker', emoji: '💍', size: 96, enterAnimation: 'pop' },
        ]),
      ],
    },
  },

  /* ── 3. Portfolio ────────────────────────────────────── */
  {
    id: 'starter-portfolio',
    name: 'Portfolio',
    category: 'Memories',
    emoji: '🎨',
    description: 'Personal portfolio: hello → projects → about → contact.',
    accent: 'linear-gradient(135deg,#0f172a,#7c3aed)',
    builderState: {
      version: 2,
      siteTitle: 'My Portfolio',
      theme: theme({
        pageBackground: '#0b0f1a',
        textColor: '#e2e8f0',
        headingColor: '#ffffff',
        buttonBackground: '#d946ef',
        buttonText: '#0b0f1a',
        backgroundKind: 'gradient',
        gradientFrom: '#0b0f1a',
        gradientTo: '#1e1b4b',
        gradientAngle: 135,
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        pageAnimation: 'slideUp',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('pf1', 'Hello', {}, [
          { type: 'text', text: 'Hi, I\'m', letterSpacingEm: 0.2 },
          { type: 'heading', text: 'Your Name', textEffect: 'gradient', textGradientFrom: '#d946ef', textGradientTo: '#06b6d4', enterAnimation: 'zoom', fontWeight: 800 },
          { type: 'text', text: 'Designer · Developer · Maker', enterAnimation: 'fadeIn', enterDelayMs: 400 },
          { type: 'button', label: 'See my work →', navPage: 2, buttonStyle: 'stable' },
        ]),
        page('pf2', 'Work', {}, [
          { type: 'heading', text: 'Recent work', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 4, slotPrefix: 'pf', galleryAnimation: 'fade' },
          { type: 'button', label: 'About me →', navPage: 3, buttonStyle: 'stable' },
        ]),
        page('pf3', 'About', {}, [
          { type: 'heading', text: 'About', enterAnimation: 'slideLeft' },
          { type: 'text', text: 'Short bio. Two sentences max. What you do and why it matters.', lineHeight: 1.6 },
          { type: 'button', label: 'Get in touch →', navPage: 4, buttonStyle: 'float' },
        ]),
        page('pf4', 'Contact', {}, [
          { type: 'heading', text: 'Let\'s talk 💬', textEffect: 'neon', textGradientFrom: '#06b6d4', textGradientTo: '#d946ef' },
          { type: 'text', text: 'you@example.com' },
          { type: 'sticker', emoji: '✨', size: 64, enterAnimation: 'pop' },
        ]),
      ],
    },
  },

  /* ── 4. Restaurant menu ────────────────────────────── */
  {
    id: 'starter-restaurant',
    name: 'Restaurant Menu',
    category: 'Memories',
    emoji: '🍽',
    description: 'Restaurant story: hero → menu highlights → location → reserve.',
    accent: 'linear-gradient(135deg,#fbbf24,#dc2626)',
    builderState: {
      version: 2,
      siteTitle: 'Our Menu 🍽',
      theme: theme({
        pageBackground: '#1a1208',
        textColor: '#fef3c7',
        headingColor: '#fbbf24',
        buttonBackground: '#dc2626',
        buttonText: '#fff7ed',
        backgroundKind: 'gradient',
        gradientFrom: '#1a1208',
        gradientTo: '#7c2d12',
        gradientAngle: 155,
        fontFamily: '"Playfair Display", Georgia, serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('rs1', 'Welcome', {}, [
          { type: 'heading', text: 'Bella Tavola', textEffect: 'gradient', textGradientFrom: '#fbbf24', textGradientTo: '#fb7185', enterAnimation: 'zoom' },
          { type: 'text', text: 'Modern Italian · Bengaluru', letterSpacingEm: 0.25 },
          { type: 'sticker', emoji: '🍝', size: 80, enterAnimation: 'bounce' },
          { type: 'button', label: 'See the menu →', navPage: 2, buttonStyle: 'stable' },
        ]),
        page('rs2', 'Highlights', {}, [
          { type: 'heading', text: 'Tonight\'s favourites', enterAnimation: 'slideUp' },
          { type: 'gallery', count: 6, slotPrefix: 'menu', galleryAnimation: 'lanes' },
          { type: 'button', label: 'Find us →', navPage: 3, buttonStyle: 'stable' },
        ]),
        page('rs3', 'Visit', {}, [
          { type: 'heading', text: 'Visit us', enterAnimation: 'fadeIn' },
          { type: 'text', text: '123 Indiranagar · Open daily 6–11 pm' },
          { type: 'sticker', emoji: '📍', size: 72, enterAnimation: 'pop' },
          { type: 'button', label: 'Reserve a table', navPage: 4, buttonStyle: 'float' },
        ]),
        page('rs4', 'Reserve', {}, [
          { type: 'heading', text: 'See you soon 🍷', textEffect: 'glow' },
          { type: 'text', text: 'WhatsApp +91 98765 43210 to book your table.' },
        ]),
      ],
    },
  },

  /* ── 5. Influencer link-in-bio ─────────────────────────── */
  {
    id: 'starter-influencer',
    name: 'Link in Bio',
    category: 'Friendship',
    emoji: '🪩',
    description: 'Influencer link-in-bio: hero → 4 link buttons → contact.',
    accent: 'linear-gradient(135deg,#f97316,#d946ef)',
    builderState: {
      version: 2,
      siteTitle: 'Links 🔗',
      theme: theme({
        pageBackground: '#0f0517',
        textColor: '#fae8ff',
        headingColor: '#ffffff',
        buttonBackground: '#ffffff',
        buttonText: '#0f0517',
        buttonRadius: 999,
        backgroundKind: 'gradient',
        gradientFrom: '#0f0517',
        gradientTo: '#7c3aed',
        gradientAngle: 200,
        fontFamily: '"Outfit", system-ui, sans-serif',
        pageAnimation: 'fade',
      }),
      scheduledReveal: defaultScheduledReveal(),
      pages: [
        page('in1', 'Hero', {}, [
          { type: 'heading', text: '@yourhandle', textEffect: 'gradient', textGradientFrom: '#f97316', textGradientTo: '#d946ef', enterAnimation: 'zoom', fontWeight: 800 },
          { type: 'text', text: 'Creator · Storyteller · Vibes' },
          { type: 'sticker', emoji: '🪩', size: 88, enterAnimation: 'bounce' },
          { type: 'button', label: '✨ My links', navPage: 2, buttonStyle: 'stable' },
        ]),
        page('in2', 'Links', {}, [
          { type: 'heading', text: 'My world 🌍', enterAnimation: 'slideUp' },
          { type: 'button', label: '📸 Instagram', navPage: 1, buttonStyle: 'stable' },
          { type: 'button', label: '🎬 YouTube', navPage: 1, buttonStyle: 'stable' },
          { type: 'button', label: '🛍 Shop', navPage: 1, buttonStyle: 'stable' },
          { type: 'button', label: '💌 Email me', navPage: 3, buttonStyle: 'float' },
        ]),
        page('in3', 'Contact', {}, [
          { type: 'heading', text: 'Let\'s collab 💖', textEffect: 'neon' },
          { type: 'text', text: 'Drop a line: hi@yourhandle.com' },
        ]),
      ],
    },
  },

  /* ── 6. Product launch ─────────────────────────────── */
  {
    id: 'starter-launch',
    name: 'Product Launch',
    category: 'Memories',
    emoji: '🚀',
    description: 'Startup launch: teaser → features → CTA.',
    accent: 'linear-gradient(135deg,#06b6d4,#7c3aed)',
    builderState: {
      version: 2,
      siteTitle: 'Launching soon 🚀',
      theme: theme({
        pageBackground: '#020617',
        textColor: '#e2e8f0',
        headingColor: '#ffffff',
        buttonBackground: '#06b6d4',
        buttonText: '#020617',
        backgroundKind: 'gradient',
        gradientFrom: '#020617',
        gradientTo: '#0e7490',
        gradientAngle: 145,
        fontFamily: '"Space Grotesk", system-ui, sans-serif',
        pageAnimation: 'slideUp',
      }),
      scheduledReveal: {
        ...defaultScheduledReveal(),
        enabled: false,
        title: 'Launching in',
        subtitleBefore: 'Something new is about to drop',
        messageAfter: '🚀 It\'s live!',
        effectAfter: 'confetti',
      },
      pages: [
        page('ln1', 'Teaser', {}, [
          { type: 'text', text: 'Coming this season', letterSpacingEm: 0.3, fontWeight: 600 },
          { type: 'heading', text: 'Something new is coming.', textEffect: 'gradient', textGradientFrom: '#06b6d4', textGradientTo: '#d946ef', enterAnimation: 'zoom' },
          { type: 'text', text: 'Quietly built. Loudly launched.', enterAnimation: 'fadeIn', enterDelayMs: 300 },
          { type: 'button', label: 'Tell me more →', navPage: 2, buttonStyle: 'stable' },
        ]),
        page('ln2', 'Why', {}, [
          { type: 'heading', text: 'Why you\'ll love it', enterAnimation: 'slideUp' },
          { type: 'text', text: '⚡ 10× faster than what you use today' },
          { type: 'text', text: '🎨 Designed for the way you actually work' },
          { type: 'text', text: '🪄 Zero learning curve' },
          { type: 'button', label: 'Get early access →', navPage: 3, buttonStyle: 'float' },
        ]),
        page('ln3', 'Signup', {}, [
          { type: 'heading', text: 'Be first in line', textEffect: 'glow', enterAnimation: 'pop' },
          { type: 'text', text: 'Drop your email and we\'ll send you the link the moment it goes live.' },
          { type: 'sticker', emoji: '🚀', size: 96, enterAnimation: 'bounce' },
        ]),
      ],
    },
  },
];
