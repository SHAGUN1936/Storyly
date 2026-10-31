"use client";

// "Sign out" as a complete form. While it works, a full-screen "Signing out…" cover blocks other
// clicks; then the sign-in page confirms with a toast (see AuthScreen).
//   <SignOutButton className={buttonClasses({ variant: "secondary", size: "sm" })} />

import { LogOut } from "lucide-react";
import { createPortal, useFormStatus } from "react-dom";
import { logout } from "@/app/(auth)/actions";
import { LoadingMark, Spinner } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

function Inner({ className, icon, role }: { className?: string; icon?: boolean; role?: string }) {
  const { pending } = useFormStatus();
  return (
    <>
      {pending &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[200] flex animate-fade-in items-center justify-center bg-white/80 backdrop-blur-sm"
          >
            <LoadingMark label="Signing out" />
          </div>,
          document.body,
        )}
      <button
        type="submit"
        role={role}
        disabled={pending}
        aria-busy={pending}
        className={cn(className, "disabled:opacity-70")}
      >
        {pending ? <Spinner className="size-4" /> : icon && <LogOut size={16} aria-hidden />}
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}

export function SignOutButton({
  className,
  formClassName,
  icon = false,
  role,
}: {
  className?: string;
  formClassName?: string;
  /** Show the log-out icon before the label. */
  icon?: boolean;
  role?: string;
}) {
  return (
    <form action={logout} className={formClassName}>
      <Inner className={className} icon={icon} role={role} />
    </form>
  );
}
