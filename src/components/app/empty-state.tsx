// "Nothing here yet" box with an icon, a line of help and an optional action.

import { IconBadge } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  text,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <IconBadge>{icon}</IconBadge>
      <p className="mt-4 font-semibold text-zinc-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-zinc-600">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
