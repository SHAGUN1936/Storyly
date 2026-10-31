// White card with a hairline border. The basic surface of the site.
//   <Card>…</Card>                    padded
//   <Card padding="none">…</Card>     for images that run edge to edge

import { cn } from "@/lib/utils";

const paddings = { none: "", sm: "p-5", md: "p-6 sm:p-8" };

export function Card({
  padding = "md",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { padding?: keyof typeof paddings }) {
  return (
    <div className={cn("rounded-3xl border border-zinc-200 bg-white", paddings[padding], className)} {...props}>
      {children}
    </div>
  );
}

/** Small square holding a lucide icon, used at the top of feature cards. */
export function IconBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-900 [&_svg]:size-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
