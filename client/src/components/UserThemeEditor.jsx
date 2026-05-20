import { useState } from 'react';
import {
  BG_KIND_OPTIONS,
  BUILDER_FONT_OPTIONS,
  PAGE_ANIM_OPTIONS,
} from '../lib/visualTemplateBuilder';
import { APP_INPUT_CLASS, APP_SELECT_CLASS } from '../lib/uiClasses';
import { videosAPI } from '../api/api';
import MediaUploadField from './MediaUploadField';

function ColorInput({ label, value, onChange, className = '' }) {
  const v = value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';
  return (
    <label className={`flex flex-col gap-1 text-xs text-zinc-500 ${className}`}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB — leave empty to keep design"
          className={`flex-1 min-w-0 px-2 py-1.5 rounded font-mono text-xs ${APP_INPUT_CLASS}`}
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function mergeJobLookPatch(prev, patch) {
  const next = { ...prev };
  Object.entries(patch).forEach(([k, val]) => {
    if (k === 'pagePatches') {
      if (val === null || val === undefined) delete next.pagePatches;
      else next.pagePatches = val;
      return;
    }
    if (val === '' || val === null || val === undefined) delete next[k];
    else next[k] = val;
  });
  return next;
}

/**
 * Same look controls as the admin visual builder; values merge into the published job only.
 * `pages` = normalized builder pages (for titles + per-page background rows).
 */
export default function UserThemeEditor({ pages = [], value, onChange }) {
  const o = value || {};
  const patch = (p) => onChange(mergeJobLookPatch(o, p));
  const bgKind = o.backgroundKind;
  const pageList = Array.isArray(pages) ? pages : [];
  const [uploading, setUploading] = useState(null);

  const uploadMedia = async (id, file, applyUrl) => {
    setUploading(id);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      applyUrl(url);
    } catch (err) {
      window.alert(err.message || 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const setPagePatch = (pi, partial) => {
    const n = pageList.length;
    const arr = Array.from({ length: n }, (_, i) => {
      const prev = o.pagePatches?.[i];
      return prev && typeof prev === 'object' ? { ...prev } : {};
    });
    const merged = { ...arr[pi], ...partial };
    [
      'pageBackground',
      'pageImageUrl',
      'pageVideoUrl',
      'textColor',
      'headingColor',
      'buttonBackground',
      'buttonText',
      'buttonRadius',
      'fontFamily',
      'pageAnimation',
    ].forEach((key) => {
      if (merged[key] === '') delete merged[key];
    });
    arr[pi] = merged;
    const cleaned = arr.map((row) => (Object.keys(row).length ? row : {}));
    patch({ pagePatches: cleaned });
  };

  const pagePatch = (pi) => (o.pagePatches?.[pi] && typeof o.pagePatches[pi] === 'object' ? o.pagePatches[pi] : {});

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-black/40 p-5 space-y-6 shadow-lg">
      <div className="border-b border-white/10 pb-4">
        <h4 className="text-base font-semibold text-white tracking-tight">Page design</h4>
        <p className="text-xs text-zinc-500 mt-1">Optional overrides — leave fields empty to keep the gallery design.</p>
      </div>

      <div className="space-y-3">
        <label className="block text-xs text-zinc-500">
          <span className="text-zinc-400">Browser tab title (optional)</span>
          <input
            type="text"
            value={o.siteTitle ?? ''}
            onChange={(e) => patch({ siteTitle: e.target.value })}
            placeholder="Same as template if empty"
            className={`mt-1 ${APP_INPUT_CLASS}`}
            maxLength={120}
          />
        </label>
      </div>

      <div className="space-y-4 rounded-xl border border-white/10 bg-black/25 p-4">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-400/90">Background</h5>
        <p className="text-xs text-zinc-600">Pick a type — only matching upload and color fields show.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
            <span>Background type</span>
            <select
              value={bgKind ?? ''}
              onChange={(e) => patch({ backgroundKind: e.target.value || undefined })}
              className={APP_SELECT_CLASS}
            >
              <option value="">— Same as design —</option>
              {BG_KIND_OPTIONS.map((x) => (
                <option key={x.value} value={x.value}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          {bgKind === 'solid' && (
            <ColorInput
              className="sm:col-span-2"
              label="Solid color"
              value={o.pageBackground ?? ''}
              onChange={(v) => patch({ pageBackground: v })}
            />
          )}
          {bgKind === 'gradient' && (
            <>
              <ColorInput label="Gradient start" value={o.gradientFrom ?? ''} onChange={(v) => patch({ gradientFrom: v })} />
              <ColorInput label="Gradient end" value={o.gradientTo ?? ''} onChange={(v) => patch({ gradientTo: v })} />
              <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
                <span>Angle (°)</span>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={o.gradientAngle ?? ''}
                  onChange={(e) => patch({ gradientAngle: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className={APP_INPUT_CLASS}
                />
              </label>
            </>
          )}
          {bgKind === 'image' && (
            <>
              <ColorInput
                label="Tint / fallback"
                value={o.pageBackground ?? ''}
                onChange={(v) => patch({ pageBackground: v })}
              />
              <div className="sm:col-span-2">
                <MediaUploadField
                  label="Background image"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  value={o.backgroundImageUrl ?? ''}
                  onChange={(url) => patch({ backgroundImageUrl: url })}
                  uploading={uploading === 'u-bg-img'}
                  onFile={(file) =>
                    uploadMedia('u-bg-img', file, (url) => patch({ backgroundImageUrl: url }))
                  }
                  preview="image"
                />
              </div>
            </>
          )}
          {bgKind === 'video' && (
            <>
              <ColorInput
                label="Behind video"
                value={o.pageBackground ?? ''}
                onChange={(v) => patch({ pageBackground: v })}
              />
              <div className="sm:col-span-2">
                <MediaUploadField
                  label="Background video"
                  accept="video/mp4,video/webm,video/quicktime"
                  value={o.backgroundVideoUrl ?? ''}
                  onChange={(url) => patch({ backgroundVideoUrl: url })}
                  uploading={uploading === 'u-bg-vid'}
                  onFile={(file) =>
                    uploadMedia('u-bg-vid', file, (url) => patch({ backgroundVideoUrl: url }))
                  }
                  preview="video"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h5 className="text-xs font-semibold uppercase tracking-wider text-brand-400/90">Per-page overrides</h5>
        <p className="text-xs text-zinc-600">Layer, text, and buttons per page — empty = keep gallery design.</p>
        {pageList.map((page, pi) => (
          <div
            key={page.id || pi}
            className="rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-4"
          >
            <p className="text-sm font-medium text-zinc-300">
              Page {pi + 1}
              {page.pageTitle ? (
                <span className="text-zinc-500 font-normal"> — {page.pageTitle}</span>
              ) : null}
            </p>
            <ColorInput
              label="Background color (optional)"
              value={pagePatch(pi).pageBackground ?? ''}
              onChange={(v) => setPagePatch(pi, { pageBackground: v })}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MediaUploadField
                label="Background image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                value={pagePatch(pi).pageImageUrl ?? ''}
                onChange={(url) => setPagePatch(pi, { pageImageUrl: url })}
                uploading={uploading === `u-p${pi}-img`}
                onFile={(file) =>
                  uploadMedia(`u-p${pi}-img`, file, (url) => setPagePatch(pi, { pageImageUrl: url }))
                }
                preview="image"
              />
              <MediaUploadField
                label="Background video (over image)"
                accept="video/mp4,video/webm,video/quicktime"
                value={pagePatch(pi).pageVideoUrl ?? ''}
                onChange={(url) => setPagePatch(pi, { pageVideoUrl: url })}
                uploading={uploading === `u-p${pi}-vid`}
                onFile={(file) =>
                  uploadMedia(`u-p${pi}-vid`, file, (url) => setPagePatch(pi, { pageVideoUrl: url }))
                }
                preview="video"
              />
            </div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-3 space-y-3">
              <p className="text-xs font-medium text-zinc-400">Text &amp; buttons (this page)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ColorInput
                  label="Text color"
                  value={pagePatch(pi).textColor ?? ''}
                  onChange={(v) => setPagePatch(pi, { textColor: v })}
                />
                <ColorInput
                  label="Heading color"
                  value={pagePatch(pi).headingColor ?? ''}
                  onChange={(v) => setPagePatch(pi, { headingColor: v })}
                />
                <ColorInput
                  label="Button background"
                  value={pagePatch(pi).buttonBackground ?? ''}
                  onChange={(v) => setPagePatch(pi, { buttonBackground: v })}
                />
                <ColorInput
                  label="Button text"
                  value={pagePatch(pi).buttonText ?? ''}
                  onChange={(v) => setPagePatch(pi, { buttonText: v })}
                />
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                  <span>Button radius (px)</span>
                  <input
                    type="number"
                    min={0}
                    max={48}
                    value={pagePatch(pi).buttonRadius ?? ''}
                    onChange={(e) =>
                      setPagePatch(pi, {
                        buttonRadius: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className={APP_INPUT_CLASS}
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-500">
                  <span>Page animation</span>
                  <select
                    value={pagePatch(pi).pageAnimation ?? ''}
                    onChange={(e) => setPagePatch(pi, { pageAnimation: e.target.value })}
                    className={APP_SELECT_CLASS}
                  >
                    <option value="">— Same as design —</option>
                    {PAGE_ANIM_OPTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
                  <span>Font</span>
                  <select
                    value={pagePatch(pi).fontFamily ?? ''}
                    onChange={(e) => setPagePatch(pi, { fontFamily: e.target.value })}
                    className={APP_SELECT_CLASS}
                  >
                    <option value="">— Same as design —</option>
                    {BUILDER_FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChange({})}
        className="text-sm text-zinc-500 hover:text-white border border-white/10 rounded-lg px-4 py-2 w-full sm:w-auto transition"
      >
        Clear all customizations
      </button>
    </div>
  );
}
