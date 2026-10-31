"use client";

// Admin menu on phones and tablets: a hamburger in the top bar that opens a side drawer
// with every admin page, the website link and sign out.

import { ExternalLink, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { StorylyLogo } from "@/components/brand/logo";
import { buttonClasses } from "@/components/ui/button-styles";
import { Drawer } from "@/components/ui/drawer";
import { AdminNav } from "./admin-nav";

export function AdminMobileMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="-ml-2 flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
      >
        <Menu size={22} />
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="left"
        title={<StorylyLogo />}
        footer={
          <div className="space-y-3">
            <p className="truncate text-xs text-zinc-500">{email}</p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                target="_blank"
                className={buttonClasses({ variant: "secondary", size: "sm", className: "w-full" })}
              >
                Website <ExternalLink size={14} aria-hidden />
              </Link>
              <SignOutButton className={buttonClasses({ size: "sm", className: "w-full" })} />
            </div>
          </div>
        }
      >
        <AdminNav onNavigate={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
