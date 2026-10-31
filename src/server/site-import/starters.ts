// Ready-made designs an admin can start a template from (Admin → Templates → New template).
// Each is a complete page whose personal parts are already marked with data-storyly-slot.

import "server-only";

/** Neutral "add your photo" placeholder, embedded so starters work without uploads. */
const PHOTO_PLACEHOLDER =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#e7e2d9"/><g fill="none" stroke="#a89f8f" stroke-width="10"><rect x="300" y="390" width="200" height="160" rx="18"/><circle cx="400" cy="470" r="42"/></g><text x="400" y="620" text-anchor="middle" font-family="Georgia,serif" font-size="34" fill="#8a816f">Add your photo</text></svg>`,
  ).toString("base64");

const WEDDING = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wedding Invitation</title>
<style>
  :root { --ink:#2b2620; --muted:#7a6f60; --gold:#b08d57; --paper:#faf7f2; }
  * { box-sizing:border-box; margin:0; }
  body { font-family: Georgia, "Times New Roman", serif; background:var(--paper); color:var(--ink); }
  .rise { opacity:0; transform:translateY(16px); animation:rise .9s ease forwards; }
  .d1 { animation-delay:.15s } .d2 { animation-delay:.3s } .d3 { animation-delay:.45s } .d4 { animation-delay:.6s }
  @keyframes rise { to { opacity:1; transform:none } }
  header { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:48px 24px; }
  .eyebrow { font-family: system-ui, sans-serif; letter-spacing:.35em; text-transform:uppercase; font-size:12px; color:var(--gold); }
  h1 { font-weight:400; font-size:clamp(44px, 9vw, 96px); line-height:1.05; margin:20px 0; }
  .rule { width:64px; height:1px; background:var(--gold); margin:8px auto 24px; }
  .when { font-size:20px; } .where { color:var(--muted); margin-top:6px; }
  .photo { width:min(440px, 86vw); aspect-ratio:4/5; object-fit:cover; display:block; margin:0 auto; border:10px solid #fff; box-shadow:0 20px 50px rgba(43,38,32,.15); }
  section { max-width:640px; margin:0 auto; padding:72px 24px; text-align:center; }
  section p { font-size:19px; line-height:1.7; color:#4a4339; }
  .events { display:grid; gap:16px; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); margin-top:32px; text-align:left; }
  .event { background:#fff; border:1px solid #ece5d8; padding:24px; }
  .event h3 { font-weight:400; font-size:22px; } .event p { font-size:15px; margin-top:6px; color:var(--muted); }
  .rsvp { display:inline-block; margin-top:36px; padding:14px 32px; background:var(--ink); color:#fff; text-decoration:none; font-family:system-ui,sans-serif; letter-spacing:.15em; font-size:13px; text-transform:uppercase; }
  footer { text-align:center; padding:48px 24px 64px; color:var(--muted); font-size:15px; }
</style>
</head>
<body>
  <header>
    <p class="eyebrow rise" data-storyly-slot="invite-line">Together with their families</p>
    <h1 class="rise d1" data-storyly-slot="couple-names">Bride &amp; Groom</h1>
    <div class="rule rise d2"></div>
    <p class="when rise d2" data-storyly-slot="wedding-date">Saturday, 12 December 2026</p>
    <p class="where rise d3" data-storyly-slot="venue">The Palace Gardens, Jaipur</p>
  </header>
  <img class="photo rise d4" src="${PHOTO_PLACEHOLDER}" alt="Couple photo" data-storyly-slot="couple-photo">
  <section>
    <p data-storyly-slot="message">We would be honoured to have you with us as we begin our new journey together. Your blessings mean the world to us.</p>
    <div class="events">
      <div class="event"><h3 data-storyly-slot="event-1-name">Haldi</h3><p data-storyly-slot="event-1-details">11 December · 10:00 AM</p></div>
      <div class="event"><h3 data-storyly-slot="event-2-name">Wedding</h3><p data-storyly-slot="event-2-details">12 December · 7:00 PM</p></div>
    </div>
    <a class="rsvp" href="#" data-storyly-slot="rsvp-label">Kindly RSVP</a>
  </section>
  <footer data-storyly-slot="sign-off">With love, both our families</footer>
</body>
</html>`;

const BIRTHDAY = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Birthday Celebration</title>
<style>
  * { box-sizing:border-box; margin:0; }
  body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background:#111; color:#fff; }
  .pop { opacity:0; transform:scale(.96); animation:pop .7s cubic-bezier(.2,.7,.2,1) forwards; }
  .d1 { animation-delay:.12s } .d2 { animation-delay:.24s } .d3 { animation-delay:.36s }
  @keyframes pop { to { opacity:1; transform:none } }
  header { min-height:100vh; display:grid; place-items:center; text-align:center; padding:48px 24px;
    background: radial-gradient(circle at 20% 20%, #ff6b6b33, transparent 40%), radial-gradient(circle at 80% 30%, #ffd93d33, transparent 40%), radial-gradient(circle at 50% 90%, #6bcBff33, transparent 45%), #111; }
  .tag { display:inline-block; padding:8px 16px; border:1px solid #ffffff40; border-radius:999px; font-size:13px; letter-spacing:.2em; text-transform:uppercase; }
  h1 { font-size:clamp(48px, 11vw, 120px); line-height:.95; margin:24px 0 16px; font-weight:800; letter-spacing:-.03em; }
  .sub { font-size:20px; color:#ffffffb3; }
  .photo { width:min(420px, 84vw); aspect-ratio:1; object-fit:cover; border-radius:28px; display:block; margin:-80px auto 0; position:relative; box-shadow:0 30px 60px #0008; }
  section { max-width:620px; margin:0 auto; padding:72px 24px; text-align:center; }
  section p { font-size:20px; line-height:1.65; color:#ffffffcc; }
  .details { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-top:36px; }
  .detail { background:#1c1c1c; border:1px solid #2a2a2a; border-radius:18px; padding:20px; }
  .detail small { display:block; color:#ffffff80; font-size:12px; letter-spacing:.15em; text-transform:uppercase; }
  .detail strong { display:block; margin-top:6px; font-size:18px; }
  footer { text-align:center; padding:40px 24px 64px; color:#ffffff80; }
</style>
</head>
<body>
  <header>
    <div>
      <span class="tag pop" data-storyly-slot="occasion">You're invited</span>
      <h1 class="pop d1" data-storyly-slot="headline">Your name turns 25!</h1>
      <p class="sub pop d2" data-storyly-slot="tagline">Let's celebrate with cake, music and good company.</p>
    </div>
  </header>
  <img class="photo pop d3" src="${PHOTO_PLACEHOLDER}" alt="Birthday photo" data-storyly-slot="photo">
  <section>
    <p data-storyly-slot="message">Come for the cake, stay for the dance floor. It wouldn't be the same without you!</p>
    <div class="details">
      <div class="detail"><small>Date</small><strong data-storyly-slot="date">Sat, 20 June</strong></div>
      <div class="detail"><small>Time</small><strong data-storyly-slot="time">7:30 PM</strong></div>
      <div class="detail"><small>Place</small><strong data-storyly-slot="place">The Rooftop, Mumbai</strong></div>
    </div>
  </section>
  <footer data-storyly-slot="sign-off">See you there!</footer>
</body>
</html>`;

const BLANK = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New page</title>
<style>
  * { box-sizing:border-box; }
  body { margin:0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color:#18181b; background:#fff; }
</style>
</head>
<body>
  <section style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:48px 24px;text-align:center">
    <h1 data-storyly-slot="title" data-storyly-label="Title" style="margin:0;font-size:56px;line-height:1.1">Your title here</h1>
    <p data-storyly-slot="message" data-storyly-label="Message" style="margin:0;max-width:560px;font-size:18px;line-height:1.7;opacity:.75">Start designing: add blocks from the Insert panel.</p>
  </section>
</body>
</html>`;

export const STARTERS = [
  {
    id: "blank",
    name: "Blank page",
    category: "Memories",
    description: "An empty page with a title and a message, to design from scratch in the editor.",
    html: BLANK,
  },
  {
    id: "wedding-classic",
    name: "Classic Wedding Invitation",
    category: "Wedding",
    description: "An elegant invitation with the couple's names, date, venue, photo and event schedule.",
    html: WEDDING,
  },
  {
    id: "birthday-night",
    name: "Birthday Night",
    category: "Birthday",
    description: "A bold birthday invite with a headline, photo and the date, time and place.",
    html: BIRTHDAY,
  },
] as const;

export type StarterId = (typeof STARTERS)[number]["id"];
