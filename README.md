# Storyly: cinematic invitations & story pages

One Next.js app (website + API together). Users pick a template, personalise it (photos, text, music), and share it as a page with a link and QR code.

Everything (website, API, admin panel and template editor) runs from this one app, with one `.env`.

## Run it

```bash
npm install      # first time only
npm run dev      # then open http://localhost:3001
```

Copy `.env.example` to `.env` and fill it in first. To deploy, add the same keys in the host's settings (e.g. Vercel → Environment Variables).

| Command                              | What it does                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`                        | Development server on port 3001 (updates as you edit)                         |
| `npm run build` then `npm start`     | Production mode                                                               |
| `npm run typecheck` / `npm run lint` | Check for type / code-style errors                                            |
| `npm run db:studio`                  | Browse the database in the browser                                            |

## Tech

TypeScript · Next.js 15 (App Router, Server Actions, Route Handlers) · React 19 · Tailwind CSS 4 · Prisma 6 + MongoDB · Zod 4 · jose (login cookie) · bcryptjs · motion · sonner (toasts) · Cloudinary (uploads) · FFmpeg (video templates)

## Admin panel

Sign in with an admin account and open **/admin**:

- **Website → FAQs, Testimonials, Numbers**: edit the home page content (add, edit, reorder, hide, delete).
  Until something is saved, the site shows built-in starting content; "Copy starting …" loads it for editing.
- **Settings**: support email, phone, address and social links (only filled-in links appear in the footer).
- **Templates**: create one (starter, pasted HTML or uploaded website) and design it in the full-screen editor at `/editor/<id>`: pages, popups, click actions, blocks, animations, phone layout.

Admins are users whose `role` is `admin` in the database.

## Where things are

```
prisma/schema.prisma        Database collections (names match the existing MongoDB data, don't rename)
src/config/                 Brand details (site.ts) and menus (nav.ts)        ← edit these first
src/lib/
  constants.ts              Categories, upload limits
  validators.ts             Form/request rules (Zod)
  structure.ts              Template JSON rules (no raw HTML, builderState required)
  auth.ts, session.ts       Login cookie, current user, requireUser/requireAdmin
  http.ts                   Helpers for API routes: route(), apiUser(), readJson(), HttpError
  action.ts                 Helpers for server actions
  cloudinary.ts, ffmpeg.ts  Uploads and video rendering
src/server/                 Business logic (templates, pages, music); API routes call these
src/lib/site-content.ts     Website copy the admin edits (with starting defaults)
src/app/
  (site)/                   Public pages: landing, about, help, marketplace, builder…
  (auth)/                   Login, signup and their server actions
  (app)/                    Signed-in pages (studio, my pages, account, admin…)
  api/                      JSON API used by the editor (templates, pages, uploads, music…)
src/components/
  ui/                       Reusable building blocks: Button, GlassCard, inputs, backgrounds…
  site/                     Website pieces: header, footer, info pages, landing sections
  auth/                     Login/signup screen, Google button, useAuth()
  brand/                    Logo
src/middleware.ts           Sends logged-out visitors on signed-in pages to /login
```

## API

All routes return JSON; errors look like `{ "message": "..." }`.

| Route                                                                                                 | What                                                      |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `GET /api/templates?category=`                                                                        | Browse grid (official + community templates)              |
| `GET /api/templates/[id]?source=BuilderTemplate`                                                      | One template                                              |
| `GET/POST /api/pages`, `POST /api/pages/draft`                                                        | My pages, start a page, save a draft                      |
| `GET/PATCH/DELETE /api/pages/[id]`                                                                    | One of my pages                                           |
| `POST /api/pages/[id]/process`                                                                        | Publish (web pages instantly, video templates via FFmpeg) |
| `GET /api/pages/[id]/share`                                                                           | Share link + QR code                                      |
| `GET /api/share/[slug]`                                                                               | Public published page                                     |
| `POST /api/uploads`                                                                                   | Upload a photo/video (form field `media`)                 |
| `GET/POST /api/builder-templates`, `PATCH/DELETE /api/builder-templates/[id]`                         | Builder's own templates                                   |
| `GET/POST /api/admin/templates`, `PATCH/DELETE /api/admin/templates/[id]`                             | Admin templates (multipart form)                          |
| `GET /api/music/search?q=&source=itunes\|archive`, `/api/music/resolve?id=`, `/api/music/stream?url=` | Music Engine                                              |
| `GET /api/health`                                                                                     | App + database check                                      |

Old addresses `/api/videos/*` are now `/api/pages/*` ("video" was the old name for a user's page).
