/** Structure to render a shared mini-site (slideshow) from API payload */

function parseStructureRaw(raw) {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

function isSlideshowStructure(s) {
  if (!s) return false;
  if (s.type && String(s.type).toLowerCase() !== 'slideshow') return false;
  if (Array.isArray(s.slides) && s.slides.length > 0) return true;
  if (s.mode === 'html' && typeof s.html === 'string' && s.html.trim()) return true;
  return false;
}

/**
 * Prefer job snapshot when it has slides; otherwise template (matches server — empty `{}` on job must not hide template slides).
 */
export function getSharePageStructure(video) {
  const fromJob = parseStructureRaw(video?.customizations?.structureSnapshot);
  const fromTpl = parseStructureRaw(video?.templateId?.structure);
  if (isSlideshowStructure(fromJob)) return fromJob;
  if (isSlideshowStructure(fromTpl)) return fromTpl;
  return fromJob || fromTpl || null;
}

export function isSlideshowShare(video) {
  const s = getSharePageStructure(video);
  return isSlideshowStructure(s);
}

export function isVideoShare(video) {
  return Boolean(video?.videoUrl && String(video.videoUrl).trim());
}
