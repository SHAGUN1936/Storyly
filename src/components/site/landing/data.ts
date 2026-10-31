// Fixed copy for the landing page sections. (FAQs, testimonials and numbers are edited in Admin → Website.)

import type { MiniDesign } from "./mini-pages";

/** "How it works": one card per step, with a short explanation and what you can do in it. */
export const STEPS = [
  {
    title: "Choose a template",
    text: "Browse designs made for weddings, birthdays, anniversaries, proposals and parties. Every one is a complete page, ready to fill in.",
    points: ["Filter by occasion", "Preview on phone and desktop", "Free and premium designs"],
  },
  {
    title: "Make it yours",
    text: "Open it in the editor and click anything to change it: names, dates, photos, fonts and colours. What you see is exactly what guests get.",
    points: ["Type straight onto the page", "Upload photos and videos", "Undo anything, any time"],
  },
  {
    title: "Add the finishing touches",
    text: "Bring it to life with entrance animations, a soundtrack, a live countdown, a map to the venue and a gallery. Then check how it looks on a phone.",
    points: ["Animations on open or on scroll", "Music, countdown, map, gallery", "Separate phone layout"],
  },
  {
    title: "Share it",
    text: "Publish in one click. You get a short link for WhatsApp and Instagram, and a QR code for printed cards. Edit later and the same link updates.",
    points: ["Short, clean link", "QR code for print", "Change it after sharing"],
  },
];

// Each occasion deep-links into the Marketplace and shows a sample design
export const OCCASIONS: Array<{ name: string; text: string; href: string; design: MiniDesign }> = [
  { name: "Weddings", text: "Save-the-dates, invitations, RSVPs", href: "/marketplace/wedding", design: "wedding" },
  { name: "Birthdays", text: "Invites, wishes and recaps", href: "/marketplace/birthday", design: "birthday" },
  { name: "Invitations", text: "For any gathering", href: "/marketplace/invitation", design: "invite" },
  {
    name: "Anniversaries",
    text: "Years together, beautifully told",
    href: "/marketplace/wedding",
    design: "anniversary",
  },
  { name: "Proposals", text: "Ask the big question", href: "/marketplace/wedding", design: "couple" },
  { name: "Thank-yous", text: "Gratitude after the big day", href: "/marketplace/celebration", design: "thanks" },
];
