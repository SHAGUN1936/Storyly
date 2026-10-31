import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { StorylyLogo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-styles";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" } };

// Every admin page: top bar, sidebar menu, content. Only admins get past requireAdmin().
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950 text-white">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <AdminMobileMenu email={admin.email} />
            <Link href="/admin" className="flex items-center gap-3">
              <StorylyLogo inverted />
              <span className="rounded-md border border-white/20 px-1.5 py-0.5 text-xs font-medium text-zinc-300">
                Admin
              </span>
            </Link>
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <Link
              href="/"
              target="_blank"
              className={buttonClasses({
                variant: "ghost",
                size: "sm",
                className: "text-zinc-300 hover:bg-white/10 hover:text-white",
              })}
            >
              View website <ExternalLink size={14} aria-hidden />
            </Link>
            <span className="text-sm text-zinc-400">{admin.email}</span>
            <SignOutButton className={buttonClasses({ variant: "inverted", size: "sm" })} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-10 lg:py-10">
        <AdminSidebar />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
