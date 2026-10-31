import { useState } from 'react';
import { APP_INPUT_CLASS } from '../lib/uiClasses';

/**
 * Primary action: file upload → https URL. Optional collapsed "Paste URL" for power users.
 */
export default function MediaUploadField({
  label,
  accept,
  value,
  onChange,
  uploading = false,
  onFile,
  preview = 'auto',
}) {
  const [showUrl, setShowUrl] = useState(false);
  const isVideo =
    preview === 'video' ||
    (preview === 'auto' && typeof value === 'string' && /\.(mp4|webm|mov)(\?|$)/i.test(value));

  return (
    <div className="space-y-2">
      {label ? <span className="text-xs text-zinc-500">{label}</span> : null}
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500/20 px-3 py-2 text-xs font-medium text-brand-200 hover:bg-brand-500/30 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = '';
            }}
          />
        </label>
        {value ? (
          <button type="button" className="text-xs text-red-400/90 hover:underline" onClick={() => onChange('')}>
            Remove
          </button>
        ) : null}
      </div>
      {value ? (
        <div className="rounded-lg border border-white/10 overflow-hidden bg-black/30 max-w-sm">
          {isVideo ? (
            <video src={value} className="w-full max-h-36 object-cover" muted playsInline preload="metadata" />
          ) : (
            <img src={value} alt="" className="w-full max-h-36 object-cover" />
          )}
        </div>
      ) : null}
      <button
        type="button"
        className="text-[11px] text-zinc-500 hover:text-zinc-300 underline"
        onClick={() => setShowUrl((s) => !s)}
      >
        {showUrl ? 'Hide URL field' : 'Or paste URL (https)'}
      </button>
      {showUrl && (
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className={`font-mono text-xs ${APP_INPUT_CLASS}`}
          spellCheck={false}
        />
      )}
    </div>
  );
}
