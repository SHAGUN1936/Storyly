// Button look, shared by <Button>, <ButtonLink> and any element that should look like a button.
// Lives outside button.tsx so server components can use it too:
//   <Link href="/" className={buttonClasses({ variant: "secondary", size: "sm" })}>Home</Link>

import { cn } from "@/lib/utils";

const variants = {
  /** Main action: near-black */
  primary: "bg-zinc-900 text-white shadow-xs hover:bg-zinc-800",
  /** Brand accent, for the one key action in a section */
  brand: "bg-brand-600 text-white shadow-xs hover:bg-brand-700",
  /** Outlined white button */
  secondary: "border border-zinc-200 bg-white text-zinc-900 shadow-xs hover:border-zinc-300 hover:bg-zinc-50",
  /** Text-only, for low-priority actions */
  ghost: "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900",
  /** On dark backgrounds */
  inverted: "bg-white text-zinc-900 hover:bg-zinc-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition duration-150 active:scale-[.97]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}
