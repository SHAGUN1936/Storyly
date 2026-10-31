import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { NavigationProgress } from "@/components/navigation-progress";
import { Toasts } from "@/components/ui/toasts";
import { siteConfig } from "@/config/site";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className={inter.variable} style={{ colorScheme: "light" }}>
      <body>
        <a
          href="#main"
          className="sr-only z-[300] rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {/* Suspense is needed because the loader reads the URL search params */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AuthProvider user={user}>
          {children}
          <Toasts />
        </AuthProvider>
      </body>
    </html>
  );
}
