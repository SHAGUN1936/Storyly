import { cn } from "@/lib/utils";

/**
 * Placeholder block with a moving shine, shown while data loads.
 * Give it the size and shape of the real content: <Skeleton className="h-6 w-40 rounded-lg" />
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-xl bg-[linear-gradient(110deg,var(--color-zinc-100)_8%,var(--color-zinc-50)_18%,var(--color-zinc-100)_33%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
