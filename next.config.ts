import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This folder is the project root (there are other package-lock.json files higher up on this PC).
  outputFileTracingRoot: __dirname,
  // Lets a build run next to the dev server with its own output folder (NEXT_DIST_DIR=.next-build)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Hide the small "N" Next.js badge shown in development
  devIndicators: false,
  // Server-only packages that ship native binaries; keep them out of the bundle.
  serverExternalPackages: ["fluent-ffmpeg", "@ffmpeg-installer/ffmpeg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Old addresses that people may have bookmarked
  async redirects() {
    return [
      { source: "/landing", destination: "/", permanent: true },
      { source: "/liked", destination: "/my-videos?filter=liked", permanent: false },
    ];
  },
  experimental: {
    // Photo/video uploads go through server actions and route handlers
    serverActions: { bodySizeLimit: "100mb" },
  },
};

export default nextConfig;
