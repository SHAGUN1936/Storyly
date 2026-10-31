# Personalized Video Maker

Full-stack web app to create personalized videos from templates. Users sign up, pick a template (Love, Friendship, Birthday, Memories, Wedding), upload photos/videos and custom text, preview, then generate a video. Each video gets a unique share URL and QR code.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Auth:** JWT + Google OAuth
- **Storage:** Cloudinary
- **Video:** FFmpeg (fluent-ffmpeg)

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

Or manually:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Environment variables

**Server** – copy `server/.env.example` to `server/.env`:

- `PORT` – default 5000
- `MONGODB_URI` – MongoDB connection string (local `mongodb://127.0.0.1:27017/personalized-videos` or Atlas `mongodb+srv://...`)
- `DEV_ADMIN_BYPASS` – set to `true` in development so the admin API works without JWT (creates a dev admin user in MongoDB; do **not** use in production)
- `JWT_SECRET` – random secret for JWT
- `CLIENT_URL` – frontend URL (e.g. http://localhost:5173)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – for Google OAuth
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` – Cloudinary

**Client** – copy `client/.env.example` to `client/.env`:

- `VITE_GOOGLE_CLIENT_ID` – same Google Client ID (for GSI button)

### 3. MongoDB

The backend stores all data in **MongoDB** via Mongoose (`users`, `templates`, `generatedvideos` collections).

- **Local:** install MongoDB Community Server and start `mongod`, or use Docker: `docker run -d -p 27017:27017 mongo:7`.
- **Atlas:** create a cluster, add a database user, allow your IP, and paste the SRV URI into `MONGODB_URI` in `server/.env`.

With `DEV_ADMIN_BYPASS=true` (development only), the first admin request creates a dev `users` document with role `admin`. Otherwise, sign up and set `role: 'admin'` in the `users` collection for a real admin account.

### 4. FFmpeg

Install FFmpeg on your machine and ensure it’s on `PATH`. The server uses it for video generation.

### 5. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:5000  

Or run separately:

```bash
npm run server   # backend only
npm run client   # frontend only
```

## Features

- **Auth:** Email signup/login, Google OAuth, JWT (httpOnly cookie + response body)
- **Dashboard:** Templates by category (Love, Friendship, Birthday, Memories, Wedding)
- **Template flow:** Select template → upload media → add text → preview → generate video
- **Video generation:** FFmpeg builds the video; result is uploaded to Cloudinary
- **Sharing:** Unique URL per video; QR code and link from “My Videos”
- **Watch page:** Public page at `/watch/:slug` (no login)
- **Admin:** Create/edit templates, upload preview video, set JSON structure, publish, delete

## API overview

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/logout`
- `GET /api/templates` (optional `?category=`)
- `GET /api/templates/:id`
- `POST /api/videos/upload` (multipart), `POST /api/videos`, `POST /api/videos/:id/process`, `GET /api/videos/my`, `GET /api/videos/:id/qr`
- `GET /api/public/video/:slug`
- `GET /api/admin/templates`, `POST /api/admin/templates`, `PUT /api/admin/templates/:id`, `DELETE /api/admin/templates/:id`, `POST /api/admin/templates/:id/publish`

Protected routes use the `token` cookie or `Authorization: Bearer <token>`.
