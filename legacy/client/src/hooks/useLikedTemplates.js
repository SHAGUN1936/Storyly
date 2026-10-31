import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'storyly-liked-templates';
const CHANGE_EVENT = 'storyly:liked-changed';

function loadLiked() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLiked(list) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Notify other instances of this hook in the same tab — `storage` only
    // fires on OTHER tabs, so we dispatch our own event for same-tab sync.
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* storage blocked — ignore */
  }
}

/* Keep a lean copy of the template's structure with the like, so a liked
   template stays fully usable even after the admin deletes or unpublishes
   it. We drop the bulky pre-rendered `html` (the renderer rebuilds it from
   `builderState`) to stay well under the localStorage quota. */
function snapshotStructure(structure) {
  if (!structure || typeof structure !== 'object' || Array.isArray(structure)) {
    return structure || null;
  }
  const { html, ...rest } = structure;
  return rest;
}

/**
 * Read a liked template's stored snapshot by id. Used by the customizer to
 * fall back to the user's own copy when the live admin template is gone
 * (deleted / unpublished). Returns null if not liked or not snapshotted.
 */
export function getLikedTemplateSnapshot(id) {
  if (!id) return null;
  const entry = loadLiked().find((t) => (t._id || t.id) === id);
  if (!entry || !entry.structure) return null;
  return {
    _id: entry._id,
    name: entry.name,
    category: entry.category,
    description: entry.description,
    thumbnailUrl: entry.thumbnailUrl,
    sourceType: entry.sourceType || 'Template',
    structure: entry.structure,
  };
}

/**
 * Client-side liked-templates store. Backed by localStorage so likes
 * persist across reloads without any backend changes.
 *
 * Multiple instances of this hook on the same page stay in sync — saving
 * fires a custom event that every mounted instance listens for, plus the
 * native `storage` event keeps things in sync across browser tabs.
 *
 * Stored entries are SHALLOW COPIES of the template (id, name, category,
 * description, thumbnail, preview video, duration) so the Liked page can
 * render cards without re-fetching the live templates list.
 *
 * Returns:
 *  - liked:   Array of stored templates (newest first)
 *  - count:   Number of liked templates
 *  - isLiked: (id) => boolean
 *  - toggle:  (template) => void — add if absent, remove if present
 *  - clear:   () => void — wipe the list
 */
export default function useLikedTemplates() {
  const [liked, setLiked] = useState(loadLiked);

  useEffect(() => {
    const handler = () => setLiked(loadLiked());
    window.addEventListener('storage', handler);
    window.addEventListener(CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener(CHANGE_EVENT, handler);
    };
  }, []);

  const isLiked = useCallback(
    (id) => liked.some((t) => (t._id || t.id) === id),
    [liked]
  );

  const toggle = useCallback((template) => {
    if (!template) return;
    const id = template._id || template.id;
    if (!id) return;
    const next = liked.some((t) => (t._id || t.id) === id)
      ? liked.filter((t) => (t._id || t.id) !== id)
      : [
          {
            _id: template._id,
            name: template.name,
            category: template.category,
            description: template.description,
            thumbnailUrl: template.thumbnailUrl,
            previewVideoUrl: template.previewVideoUrl,
            duration: template.duration,
            /* Track the source so the Liked page can show only admin
               "basic" templates, never user/builder-made ones. */
            sourceType: template.sourceType || 'Template',
            /* Full structure snapshot (sans html) so the liked template
               stays usable/editable even after the admin deletes it. */
            structure: snapshotStructure(template.structure),
            likedAt: Date.now(),
          },
          ...liked,
        ];
    setLiked(next);
    saveLiked(next);
  }, [liked]);

  const clear = useCallback(() => {
    setLiked([]);
    saveLiked([]);
  }, []);

  return { liked, count: liked.length, isLiked, toggle, clear };
}
