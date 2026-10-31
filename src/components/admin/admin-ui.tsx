// Building blocks for admin pages: page title, and the "start from the current website" box.

import { Card } from "@/components/ui/card";

export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-zinc-600">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

/**
 * Shown when a list has no saved items yet: the website is showing its starting content,
 * and the admin can copy it in to edit it.
 */
export function StartingContentNotice({ what, importAction }: { what: string; importAction: () => Promise<void> }) {
  return (
    <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-dashed bg-white">
      <div>
        <p className="font-medium text-zinc-900">The website is showing its starting {what}</p>
        <p className="mt-1 text-sm text-zinc-600">
          Copy them here to edit, reorder or hide them. Or add your own below; once you save one, only saved {what} are
          shown.
        </p>
      </div>
      <form action={importAction}>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-lg bg-zinc-900 px-3.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Copy starting {what}
        </button>
      </form>
    </Card>
  );
}
