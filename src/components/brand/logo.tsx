// Storyly brand: a black rounded square holding a white bookmark, plus the wordmark.
// The same mark is the favicon (src/app/icon.svg) and public/storyly.svg; keep them in sync.
//   <LogoMark className="size-8" />
//   <LogoMark inverted />            white square, black bookmark (for dark backgrounds)
//   <LogoMark animated />            the bookmark gently drops in on a loop (loaders)
//   <StorylyLogo />                  mark + "Storyly"

import { cn } from "@/lib/utils";

export function LogoMark({
  inverted = false,
  animated = false,
  className,
}: {
  inverted?: boolean;
  animated?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label="Storyly"
    >
      <rect width="32" height="32" rx="8" fill={inverted ? "#FFFFFF" : "#09090B"} />
      <path
        d="M11 7h10v19l-5-4-5 4Z"
        fill={inverted ? "#09090B" : "#FFFFFF"}
        className={animated ? "animate-bookmark" : undefined}
      />
    </svg>
  );
}

export function StorylyLogo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark inverted={inverted} className="size-7" />
      <span className={cn("text-lg font-semibold tracking-tight", inverted ? "text-white" : "text-zinc-900")}>
        Storyly
      </span>
    </span>
  );
}
