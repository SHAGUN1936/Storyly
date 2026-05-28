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
