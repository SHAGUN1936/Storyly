// Loading indicators.
//   <Spinner />                                  small ring for buttons and inline areas (inherits text colour)
//   <PageLoader />                               the logo with its bookmark dropping in + "Loading…", for whole screens
//   <LoadingMark />                              just the logo + label, to place inside your own overlay
//   <PageLoader label="Loading your pages" fullScreen={false} />

import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-current/25 border-t-current",
        className,
      )}
    />
  );
}

/** The animated logo with its "Loading…" label. Shared by every full-area loader so they always match. */
export function LoadingMark({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <LogoMark animated className="size-12" />
      <p className="text-sm font-medium text-zinc-500">{label}…</p>
    </div>
  );
}

export function PageLoader({ label = "Loading", fullScreen = true }: { label?: string; fullScreen?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center", fullScreen ? "min-h-screen" : "py-24")}
    >
      <LoadingMark label={label} />
    </div>
  );
}
