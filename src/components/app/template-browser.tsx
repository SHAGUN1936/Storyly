"use client";

// Category chips + search over the template grid. Filtering happens in the browser,
// so switching category or typing is instant. The chosen category is kept in the URL.

import { LayoutTemplate, Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/form-controls";
import type { TemplateCardData } from "@/lib/template-card";
import { Reveal } from "@/components/ui/motion";
import { cn, stagger } from "@/lib/utils";
import { EmptyState } from "./empty-state";
import { TemplateCard } from "./template-card";

export function TemplateBrowser({ templates }: { templates: TemplateCardData[] }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [query, setQuery] = useState("");

  const categories = useMemo(() => ["All", ...new Set(templates.map((t) => t.category).filter(Boolean))], [templates]);
  const category = categories.includes(params.get("category") ?? "") ? params.get("category")! : "All";

  function pickCategory(next: string) {
    const search = new URLSearchParams(params);
    if (next === "All") search.delete("category");
    else search.set("category", next);
    // Filtering happens here in the browser; only the address bar changes (no server request)
    window.history.replaceState(null, "", `${pathname}${search.size ? `?${search}` : ""}`);
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return templates.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (!q || [t.name, t.description, t.category].some((field) => field.toLowerCase().includes(q))),
    );
  }, [templates, category, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-3 shadow-lg shadow-zinc-900/5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={c === category}
              onClick={() => pickCategory(c)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                c === category
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
            className="pl-9"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<LayoutTemplate />}
          title={templates.length ? "No templates match" : "No templates yet"}
          text={templates.length ? "Try another category or clear your search." : "New templates are on their way."}
        />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((t, i) => (
            <Reveal key={`${t.sourceType}-${t.id}`} delay={stagger(i % 5, 0.06)}>
              <TemplateCard template={t} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
