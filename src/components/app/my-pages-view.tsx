"use client";

// My pages: filter tabs (All / Drafts / Published / Liked), search, and a card per page
// with Share (link + QR), View and Delete.

import { FileText, Heart, ImageOff, Search, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteMyPage } from "@/app/(app)/(user)/_actions/pages";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/form-controls";
import { useLikedTemplates } from "@/hooks/use-liked-templates";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { ShareDialog } from "./share-dialog";
import { TemplateCard } from "./template-card";

export type MyPageItem = {
  id: string;
  status: "draft" | "pending" | "processing" | "completed" | "failed";
  title: string;
  category: string;
  recipientName: string;
  thumbnailUrl: string;
  shareSlug: string;
  createdAt: string;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "drafts", label: "Drafts" },
  { id: "published", label: "Published" },
  { id: "liked", label: "Liked templates" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

const STATUS_LABEL: Record<MyPageItem["status"], string> = {
  draft: "Draft",
  pending: "Waiting",
  processing: "Processing",
  completed: "Published",
  failed: "Failed",
};

export function MyPagesView({ items }: { items: MyPageItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { liked } = useLikedTemplates();
  const [query, setQuery] = useState("");
  const [sharing, setSharing] = useState<MyPageItem | null>(null);

  const filter: Filter = FILTERS.some((f) => f.id === params.get("filter")) ? (params.get("filter") as Filter) : "all";

  function pickFilter(next: Filter) {
    router.replace(next === "all" ? pathname : `${pathname}?filter=${next}`, { scroll: false });
  }

  const counts = {
    all: items.length,
    drafts: items.filter((p) => p.status === "draft").length,
    published: items.filter((p) => p.status === "completed").length,
    liked: liked.length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (p) =>
        (filter === "all" ||
          (filter === "drafts" && p.status === "draft") ||
          (filter === "published" && p.status === "completed")) &&
        (!q || [p.title, p.category, p.recipientName].some((f) => f.toLowerCase().includes(q))),
    );
  }, [items, filter, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-zinc-200 sm:flex-row sm:items-end sm:justify-between">
        <nav className="flex flex-wrap gap-x-6" aria-label="Filter pages">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => pickFilter(f.id)}
              aria-current={f.id === filter ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
                f.id === filter
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-900",
              )}
            >
              {f.label} <span className="ml-1 text-zinc-400">{counts[f.id]}</span>
            </button>
          ))}
        </nav>
        {filter !== "liked" && (
          <div className="relative mb-3 sm:w-64">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages"
              aria-label="Search pages"
              className="pl-9"
            />
          </div>
        )}
      </div>

      {filter === "liked" ? (
        liked.length ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {liked.map((t) => (
              <TemplateCard key={`${t.sourceType}-${t.id}`} template={t} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            icon={<Heart />}
            title="No liked templates"
            text="Tap the heart on any template in the Studio to keep it here."
            action={<ButtonLink href="/studio">Browse templates</ButtonLink>}
          />
        )
      ) : visible.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((page) => (
            <PageCard key={page.id} page={page} onShare={() => setSharing(page)} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-8"
          icon={<FileText />}
          title={items.length ? "No pages match" : "You haven't made a page yet"}
          text={items.length ? "Try another filter or clear your search." : "Pick a template in the Studio to start."}
          action={!items.length && <ButtonLink href="/studio">Start a page</ButtonLink>}
        />
      )}

      {sharing && <ShareDialog page={sharing} onClose={() => setSharing(null)} />}
    </div>
  );
}

function PageCard({ page, onShare }: { page: MyPageItem; onShare: () => void }) {
  const [deleting, startDelete] = useTransition();
  const [asking, setAsking] = useState(false);
  const published = page.status === "completed";

  function handleDelete() {
    setAsking(false);
    startDelete(async () => {
      await deleteMyPage(page.id);
      toast.success("Page deleted");
    });
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs",
        deleting && "pointer-events-none opacity-50",
      )}
    >
      <div className="relative aspect-video bg-zinc-100">
        {page.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={page.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-400">
            <ImageOff size={24} aria-hidden />
          </div>
        )}
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium",
            published ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700",
          )}
        >
          {STATUS_LABEL[page.status]}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">{page.category || "Page"}</p>
        <h3 className="mt-1 truncate font-semibold text-zinc-900">{page.title}</h3>
        <p className="mt-1 truncate text-sm text-zinc-500">
          {page.recipientName ? `For ${page.recipientName} · ` : ""}
          {new Date(page.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <div className="mt-4 flex items-center gap-2">
          {published ? (
            <>
              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                <Share2 size={14} aria-hidden /> Share
              </button>
              <Link
                href={`/watch/${page.shareSlug}`}
                target="_blank"
                className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                View
              </Link>
            </>
          ) : (
            <span className="text-sm text-zinc-500">Editing returns with the new editor</span>
          )}
          <button
            type="button"
            onClick={() => setAsking(true)}
            aria-label={`Delete ${page.title}`}
            className="ml-auto flex size-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-red-600"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={asking}
        title="Delete this page?"
        message={`"${page.title}" will be removed and its share link will stop working.`}
        onCancel={() => setAsking(false)}
        onConfirm={handleDelete}
      />
    </article>
  );
}
