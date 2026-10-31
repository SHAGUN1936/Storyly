# Storyly: cinematic invitations & story pages

One Next.js app (website + API together). Users pick a template, personalise it (photos, text, music), and share it as a page with a link and QR code.

> **Migration status:** being moved from the old Vite + Express app (now in `legacy/`) to Next.js in phases.
>
> - **Phase 1 (done):** project setup, database, all API routes, login/signup/Google, landing and public pages.
> - **Phase 2:** studio (dashboard), my pages, account, receipts, share page `/watch/[slug]`.
> - **Phase 3:** template editor (Fabric canvas, music engine), admin panel, builder tools.
>
> Screens not moved yet show a "being moved" card. The old app still runs from `legacy/` if needed.

## Run it

```bash
npm install      # first time only
npm run dev      # then open http://localhost:3001
```

Copy `.env.example` to `.env` and fill it in first (the database URL is the same MongoDB the old app used).

| Command                              | What it does                                                                  |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `npm run dev`                        | Development server on port 3001 (updates as you edit)                         |
| `npm run build` then `npm start`     | Production mode                                                               |
| `npm run typecheck` / `npm run lint` | Check for type / code-style errors                                            |
| `npm run db:studio`                  | Browse the database in the browser                                            |
| `npm run db:seed`                    | Create/update the admin login from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` |

## Tech

TypeScript · Next.js 15 (App Router, Server Actions, Route Handlers) · React 19 · Tailwind CSS 4 · Prisma 6 + MongoDB · Zod 4 · jose (login cookie) · bcryptjs · motion · sonner (toasts) · Cloudinary (uploads) · FFmpeg (video templates)

## Admin panel

Sign in with an admin account and open **/admin**:

- **Website → FAQs, Testimonials, Numbers**: edit the home page content (add, edit, reorder, hide, delete).
  Until something is saved, the site shows built-in starting content; "Copy starting …" loads it for editing.
- **Settings**: support email, phone, address and social links (only filled-in links appear in the footer).
- **Templates**: the visual builder arrives in phase 3.

Create or reset the admin login: set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `.env`, then `npm run db:seed`.

## Where things are

```
prisma/schema.prisma        Database collections (names match the existing MongoDB data, don't rename)
prisma/seed.ts              Admin login
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
legacy/                     The old Vite client + Express server (reference until migration ends)
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
