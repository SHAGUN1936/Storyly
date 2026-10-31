"use client";

// Templates the user has liked, saved in this browser (same storage key as the old app,
// so earlier likes carry over). All components using the hook stay in sync.
//   const { liked, isLiked, toggle } = useLikedTemplates();

import { useCallback, useSyncExternalStore } from "react";
import type { TemplateCardData } from "@/lib/template-card";

const STORAGE_KEY = "storyly-liked-templates";
const CHANGE_EVENT = "storyly:liked-changed";
const EMPTY: TemplateCardData[] = [];

// Old entries used `_id`; keep whatever else they stored and normalise the id.
type StoredEntry = Partial<TemplateCardData> & { _id?: string };

let cache: { raw: string | null; list: TemplateCardData[] } = { raw: null, list: EMPTY };

function read(): TemplateCardData[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.list;
  let list: TemplateCardData[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      list = (parsed as StoredEntry[])
        .map((e) => ({
          id: e.id ?? e._id ?? "",
          name: e.name ?? "Template",
          category: e.category ?? "",
          description: e.description ?? "",
          thumbnailUrl: e.thumbnailUrl ?? "",
          previewVideoUrl: e.previewVideoUrl ?? "",
          sourceType: e.sourceType === "BuilderTemplate" ? ("BuilderTemplate" as const) : ("Template" as const),
        }))
        .filter((e) => e.id);
    }
  } catch {
    // Corrupt storage: treat as empty
  }
  cache = { raw, list };
  return list;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useLikedTemplates() {
  const liked = useSyncExternalStore(subscribe, read, () => EMPTY);

  const toggle = useCallback((template: TemplateCardData) => {
    const current = read();
    const next = current.some((t) => t.id === template.id)
      ? current.filter((t) => t.id !== template.id)
      : [template, ...current];
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch {
      // Storage full or blocked: nothing we can do
    }
  }, []);

  const isLiked = useCallback((id: string) => liked.some((t) => t.id === id), [liked]);

  return { liked, isLiked, toggle };
}
