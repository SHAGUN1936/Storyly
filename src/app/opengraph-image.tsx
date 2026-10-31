import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

// The preview card shown when a Storyly link is shared on WhatsApp, Instagram, X…

export const alt = `${siteConfig.name}: ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "radial-gradient(60% 70% at 20% 0%, #3f3f46, #09090b 70%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <svg width="64" height="64" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#FFFFFF" />
          <path d="M11 7h10v19l-5-4-5 4Z" fill="#09090B" />
        </svg>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>
          Pages people&nbsp;<span style={{ color: "#71717a" }}>remember.</span>
        </div>
        <div style={{ marginTop: 28, fontSize: 32, color: "#a1a1aa", maxWidth: 900 }}>
          Invitations, wedding websites and celebration pages, shared with one link or QR code.
        </div>
      </div>
    </div>,
    size,
  );
}
