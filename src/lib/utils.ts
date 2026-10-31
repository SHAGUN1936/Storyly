import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and lets later Tailwind classes win: cn("px-2", isBig && "px-4") -> "px-4" */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Reads a MongoDB id from the URL. Returns null for anything that is not a valid id. */
export function toId(value: string | null | undefined) {
  return value && /^[a-f\d]{24}$/i.test(value) ? value : null;
}

/** True for links that point at an image file (jpg, png, gif, webp). */
export function isImageUrl(url: unknown) {
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(String(url ?? ""));
}

/** First name for greetings: "Sam Lee" -> "Sam" */
export function firstName(name: string | null | undefined) {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/** Animation delay for the i-th item of a grid, so items appear one after another: <Reveal delay={stagger(i)}> */
export function stagger(index: number, step = 0.08) {
  return index * step;
}
