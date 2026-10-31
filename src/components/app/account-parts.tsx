"use client";

// Browser-side bits of the Account page: the side menu that tracks the section in view,
// the liked-templates count (likes are stored in this browser), and "Connect Google".

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { linkGoogle } from "@/app/(app)/(user)/_actions/account";
import { GoogleButton } from "@/components/auth/google-button";
import { useLikedTemplates } from "@/hooks/use-liked-templates";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Sign-in & security" },
  { id: "pages", label: "Recent pages" },
];

/** Space under the sticky header where a section counts as "current". */
const OFFSET = 140;

export function AccountNav() {
  const [active, setActive] = useState("profile");

  // The current section is the last one whose top has passed under the header.
  // At the very bottom of the page the last section wins, even if it is short.
  useEffect(() => {
    function update() {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (atBottom) return setActive(SECTIONS[SECTIONS.length - 1]!.id);
      let current = SECTIONS[0]!.id;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= OFFSET) current = s.id;
      }
      setActive(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <nav aria-label="Account sections" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={cn(
                "block rounded-lg border-l-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                active === s.id
                  ? "border-zinc-900 bg-white text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LikedCount() {
  const { liked } = useLikedTemplates();
  return <>{liked.length}</>;
}

/** Links the user's Google account (same email) so they can sign in with Google too. */
export function ConnectGoogle() {
  const router = useRouter();
  async function handle(credential: string) {
    const result = await linkGoogle(credential);
    if (!result?.ok) return toast.error(result?.message ?? "Could not connect Google");
    toast.success(result.message);
    router.refresh();
  }
  return <GoogleButton onCredential={handle} />;
}
