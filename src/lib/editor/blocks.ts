// Blocks that can be added to a page from the editor's Insert panel.
// Plain HTML with inline styles, so they look right inside any template and keep the page's fonts.

export type BlockGroup = "Basics" | "Layout" | "Smart";

export type Block = {
  id: string;
  label: string;
  group: BlockGroup;
  html: string;
  /** The countdown needs its script added to the page. */
  countdown?: boolean;
};

/** Grey "Photo" placeholder until an image is chosen. */
const IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#e4e4e7"/><path d="M520 470l70-90 60 70 40-45 90 105H520z" fill="#a1a1aa"/><circle cx="560" cy="350" r="28" fill="#a1a1aa"/></svg>`,
  );

const INPUT =
  "padding:12px 14px;border:1px solid rgba(0,0,0,.18);border-radius:12px;font:inherit;background:#fff;color:#111";
const field = (name: string, placeholder: string, type = "text") =>
  `<label style="display:grid;gap:6px;font-size:14px">${name}<input name="${name}" type="${type}" placeholder="${placeholder}" style="${INPUT}"></label>`;

const box = (inner: string, style = "") =>
  `<div style="padding:24px;border:1px solid rgba(0,0,0,.1);border-radius:16px;${style}">${inner}</div>`;

const inAWeek = () => {
  const d = new Date(Date.now() + 7 * 864e5);
  d.setHours(18, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T18:00`;
};

const countdownUnit = (label: string) =>
  `<div style="min-width:72px;padding:14px 10px;border-radius:14px;background:rgba(0,0,0,.06);text-align:center"><div data-unit style="font-size:32px;font-weight:700;line-height:1">00</div><div style="margin-top:6px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.7">${label}</div></div>`;

export const BLOCKS: Block[] = [
  {
    id: "heading",
    label: "Heading",
    group: "Basics",
    html: `<h2 style="margin:0 0 12px;font-size:40px;line-height:1.15;font-weight:700">Add a heading</h2>`,
  },
  {
    id: "subheading",
    label: "Subheading",
    group: "Basics",
    html: `<h3 style="margin:0 0 8px;font-size:22px;line-height:1.3;font-weight:600">Add a subheading</h3>`,
  },
  {
    id: "text",
    label: "Paragraph",
    group: "Basics",
    html: `<p style="margin:0 0 16px;font-size:17px;line-height:1.7">Write something here. Double-click to edit this text.</p>`,
  },
  {
    id: "button",
    label: "Button",
    group: "Basics",
    html: `<a href="#" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#111;color:#fff;font-weight:600;text-decoration:none">Click here</a>`,
  },
  {
    id: "image",
    label: "Image",
    group: "Basics",
    html: `<img src="${IMAGE}" alt="Photo" style="display:block;width:100%;max-width:720px;height:auto;border-radius:16px;margin:0 auto">`,
  },
  {
    id: "quote",
    label: "Quote",
    group: "Basics",
    html: `<blockquote style="margin:24px auto;max-width:640px;padding-left:20px;border-left:3px solid currentColor;font-size:22px;line-height:1.5;font-style:italic">“A few words that matter.”</blockquote>`,
  },
  {
    id: "list",
    label: "List",
    group: "Basics",
    html: `<ul style="margin:0 0 16px;padding-left:22px;line-height:1.9"><li>First point</li><li>Second point</li><li>Third point</li></ul>`,
  },
  {
    id: "divider",
    label: "Divider",
    group: "Basics",
    html: `<hr style="margin:32px auto;max-width:720px;border:0;border-top:1px solid rgba(0,0,0,.15)">`,
  },
  { id: "spacer", label: "Spacer", group: "Basics", html: `<div style="height:64px"></div>` },

  {
    id: "section",
    label: "Section",
    group: "Layout",
    html: `<section style="padding:80px 24px;text-align:center"><div style="max-width:720px;margin:0 auto"><h2 style="margin:0 0 12px;font-size:36px;font-weight:700">New section</h2><p style="margin:0;font-size:17px;line-height:1.7;opacity:.8">Add your content here.</p></div></section>`,
  },
  {
    id: "two-columns",
    label: "Two columns",
    group: "Layout",
    html: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;max-width:960px;margin:32px auto;padding:0 24px">${box('<h3 style="margin:0 0 8px">Left</h3><p style="margin:0">Text for the left column.</p>')}${box('<h3 style="margin:0 0 8px">Right</h3><p style="margin:0">Text for the right column.</p>')}</div>`,
  },
  {
    id: "three-columns",
    label: "Three columns",
    group: "Layout",
    html: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;max-width:1080px;margin:32px auto;padding:0 24px">${["One", "Two", "Three"].map((t) => box(`<h3 style="margin:0 0 8px">${t}</h3><p style="margin:0">A short line of text.</p>`)).join("")}</div>`,
  },
  {
    id: "card",
    label: "Card",
    group: "Layout",
    html: box(
      `<h3 style="margin:0 0 8px;font-size:22px">Card title</h3><p style="margin:0;line-height:1.7">Some details about this.</p>`,
      "max-width:480px;margin:24px auto;background:#fff;color:#111;box-shadow:0 10px 30px rgba(0,0,0,.08)",
    ),
  },
  {
    id: "image-text",
    label: "Image + text",
    group: "Layout",
    html: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px;align-items:center;max-width:1000px;margin:48px auto;padding:0 24px"><img src="${IMAGE}" alt="Photo" style="width:100%;height:auto;border-radius:16px"><div><h2 style="margin:0 0 12px;font-size:32px">A moment to remember</h2><p style="margin:0;line-height:1.7">Tell the story behind this photo.</p></div></div>`,
  },

  {
    id: "countdown",
    label: "Countdown",
    group: "Smart",
    countdown: true,
    html: `<div data-storyly-countdown="${inAWeek()}" style="display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin:32px auto">${["Days", "Hours", "Minutes", "Seconds"].map(countdownUnit).join("")}</div>`,
  },
  {
    id: "event",
    label: "Event details",
    group: "Smart",
    html: box(
      `<p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.6">Save the date</p><h3 style="margin:0 0 16px;font-size:26px">Saturday, 12 December</h3><p style="margin:0 0 4px"><strong>Time:</strong> 7:00 PM onwards</p><p style="margin:0"><strong>Venue:</strong> Venue name, City</p>`,
      "max-width:520px;margin:32px auto;text-align:center",
    ),
  },
  {
    id: "map",
    label: "Map",
    group: "Smart",
    html: `<div data-storyly-map="India Gate, New Delhi" style="max-width:720px;margin:32px auto;border-radius:16px;overflow:hidden;aspect-ratio:16/10"><iframe src="https://www.google.com/maps?q=India%20Gate%2C%20New%20Delhi&output=embed" style="width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>`,
  },
  {
    id: "video",
    label: "Video",
    group: "Smart",
    html: `<div data-storyly-video="" style="max-width:720px;margin:32px auto;border-radius:16px;overflow:hidden;aspect-ratio:16/9;background:#111"><iframe src="" style="width:100%;height:100%;border:0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`,
  },
  {
    id: "gallery",
    label: "Gallery",
    group: "Smart",
    html: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:1000px;margin:32px auto;padding:0 24px">${[1, 2, 3, 4, 5, 6].map((i) => `<img src="${IMAGE}" alt="Photo ${i}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px">`).join("")}</div>`,
  },
  {
    id: "rsvp",
    label: "RSVP button",
    group: "Smart",
    html: `<div style="text-align:center;margin:32px auto"><a href="https://wa.me/?text=${encodeURIComponent("Yes, I'll be there!")}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 28px;border-radius:999px;background:#111;color:#fff;font-weight:600;text-decoration:none">RSVP on WhatsApp</a></div>`,
  },
  {
    id: "rsvp-form",
    label: "RSVP form",
    group: "Smart",
    html: `<form data-storyly-form="whatsapp" data-storyly-target="" data-storyly-intro="RSVP" style="display:grid;gap:12px;max-width:440px;margin:40px auto;padding:28px;border:1px solid rgba(0,0,0,.1);border-radius:20px;text-align:left"><h3 style="margin:0 0 4px;font-size:24px">Will you join us?</h3>${field("Name", "Your name")}${field("Guests", "How many of you?", "number")}<label style="display:grid;gap:6px;font-size:14px">Message<textarea name="Message" rows="3" placeholder="A note for us (optional)" style="${INPUT}"></textarea></label><button type="submit" style="margin-top:4px;padding:14px;border:0;border-radius:999px;background:#111;color:#fff;font-weight:600">Send RSVP</button><p data-storyly-done hidden style="margin:0;font-size:14px;text-align:center;opacity:.7">Thank you! Your reply is ready to send.</p></form>`,
  },
  {
    id: "music",
    label: "Music player",
    group: "Smart",
    html: `<button type="button" data-storyly-music="" aria-label="Play music" style="position:fixed;right:20px;bottom:20px;z-index:50;display:flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;background:#111;color:#fff;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25)"><span class="sl-off">♪ Play music</span><span class="sl-on">❚❚ Pause</span></button>`,
  },
  {
    id: "faq",
    label: "FAQ",
    group: "Layout",
    html: `<div style="max-width:720px;margin:48px auto;padding:0 24px"><h2 style="margin:0 0 16px;font-size:32px">Questions</h2>${["What should I wear?", "Is there parking?", "Can I bring a guest?"].map((q) => `<details style="border-bottom:1px solid rgba(0,0,0,.12);padding:16px 0"><summary style="cursor:pointer;font-weight:600;font-size:17px">${q}</summary><p style="margin:10px 0 0;line-height:1.7;opacity:.8">Write the answer here.</p></details>`).join("")}</div>`,
  },
  {
    id: "timeline",
    label: "Timeline",
    group: "Layout",
    html: `<div style="max-width:640px;margin:48px auto;padding:0 24px">${[
      ["How it began", "The first chapter of the story."],
      ["The big moment", "Something worth remembering."],
      ["Today", "Where the story is now."],
    ]
      .map(
        ([t, d], i) =>
          `<div style="display:grid;grid-template-columns:28px 1fr;gap:16px;padding-bottom:28px"><div style="display:flex;flex-direction:column;align-items:center"><span style="width:14px;height:14px;margin-top:6px;border-radius:999px;background:currentColor"></span>${i < 2 ? '<span style="flex:1;width:2px;margin-top:6px;background:currentColor;opacity:.2"></span>' : ""}</div><div><p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.6">Year</p><h3 style="margin:4px 0 6px;font-size:20px">${t}</h3><p style="margin:0;line-height:1.7;opacity:.8">${d}</p></div></div>`,
      )
      .join("")}</div>`,
  },
  {
    id: "social",
    label: "Social links",
    group: "Basics",
    html: `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:32px auto">${["Instagram", "WhatsApp", "Email"].map((n) => `<a href="#" target="_blank" rel="noopener" style="padding:10px 18px;border:1px solid currentColor;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;color:inherit">${n}</a>`).join("")}</div>`,
  },
];

/** "https://youtu.be/abc" or a watch link -> an embeddable link. Other links are used as they are. */
export function toEmbedUrl(url: string) {
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = u.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return /^https:\/\//.test(u) ? u : "";
}

export const mapEmbedUrl = (place: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(place.trim())}&output=embed`;
