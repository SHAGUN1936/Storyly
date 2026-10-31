import { useState, useEffect } from 'react';
import {
  uid,
  normalizeBuilderState,
  defaultTheme,
  BUILDER_FONT_OPTIONS,
  BG_KIND_OPTIONS,
  PAGE_ANIM_OPTIONS,
} from '../lib/visualTemplateBuilder';
import { APP_INPUT_CLASS, APP_SELECT_CLASS } from '../lib/uiClasses';
import { videosAPI } from '../api/api';
import MediaUploadField from './MediaUploadField';

const SELECT_CLASS = APP_SELECT_CLASS;
const COMPACT_SELECT = `${APP_SELECT_CLASS} text-xs py-1.5 px-2`;

const BLOCK_TYPES = [
  { type: 'heading', label: 'Main heading' },
  { type: 'subheading', label: 'Subheading' },
  { type: 'text', label: 'Paragraph' },
  { type: 'image', label: 'Image slot' },
  { type: 'gif', label: 'GIF slot' },
  { type: 'video', label: 'Video slot' },
  { type: 'gallery', label: 'Photo gallery' },
  { type: 'button', label: 'Nav button' },
  { type: 'buttons', label: 'Two buttons' },
  { type: 'buttonSlot', label: 'Button (user edits label)' },
];

function emptyBlock(type) {
  switch (type) {
    case 'heading':
      return { type: 'heading', text: 'Title' };
    case 'subheading':
      return { type: 'subheading', text: 'Subtitle' };
    case 'text':
      return { type: 'text', text: 'Your text…' };
    case 'image':
      return { type: 'image', slotKey: 'img', label: 'Photo' };
    case 'gif':
      return { type: 'gif', slotKey: 'gif', label: 'GIF' };
    case 'video':
      return { type: 'video', slotKey: 'vid', label: 'Video' };
    case 'gallery':
      return { type: 'gallery', count: 4, slotPrefix: 'gal' };
    case 'button':
      return { type: 'button', label: 'Next ➡️', navPage: 2, buttonStyle: 'stable', buttonBg: '', buttonText: '' };
    case 'buttons':
      return {
        type: 'buttons',
        buttons: [
          { label: 'Yes ❤️', navPage: 1, buttonStyle: 'float', buttonBg: '', buttonText: '' },
          { label: 'No', navPage: 1, buttonStyle: 'stable', buttonBg: '', buttonText: '' },
        ],
      };
    case 'buttonSlot':
      return {
        type: 'buttonSlot',
        defaultLabel: 'OK',
        navPage: 2,
        labelHint: 'Button',
        buttonStyle: 'stable',
        buttonBg: '',
        buttonText: '',
      };
    default:
      return { type: 'text', text: '' };
  }
}

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
          placeholder="#RRGGBB"
          className="flex-1 min-w-0 px-2 py-1.5 rounded bg-white/5 border border-white/10 font-mono text-xs text-zinc-200"
          spellCheck={false}
        />
      </div>
    </label>
  );
}

const EMOJI_BAR = ['❤️', '✨', '🎉', '😊', '🔥', '💫', '🌸', '⭐', '💯', '🙏'];

export default function TemplateVisualBuilder({
  state,
  onChange,
  variant = 'default',
  activePageIndex: controlledPageIndex,
  onActivePageChange,
}) {
  const data = normalizeBuilderState(state);
  const theme = { ...defaultTheme(), ...(data.theme || {}) };
  const [uploading, setUploading] = useState(null);
  const [internalStudioPage, setInternalStudioPage] = useState(0);
  const studioPage =
    typeof controlledPageIndex === 'number' ? controlledPageIndex : internalStudioPage;
  const setStudioPage = onActivePageChange || setInternalStudioPage;
  const studioMode = variant === 'studio';

  const setTheme = (patch) => onChange({ ...data, theme: { ...theme, ...patch } });

  const uploadMedia = async (id, file, applyUrl) => {
    setUploading(id);
    try {
      const { url } = await videosAPI.uploadMedia(file);
      applyUrl(url);
    } catch (err) {
      window.alert(err.message || 'Upload failed. Sign in and try again.');
    } finally {
      setUploading(null);
    }
  };
  const setSiteTitle = (siteTitle) => onChange({ ...data, siteTitle });
  const setPage = (pi, page) => {
    const pages = [...data.pages];
    pages[pi] = page;
    onChange({ ...data, pages });
  };
  const addPage = () => {
    const n = data.pages.length + 1;
    onChange({
      ...data,
      pages: [
        ...data.pages,
        {
          id: uid(),
          pageTitle: `Page ${n}`,
          pageBackground: '',
          pageDurationMs: '',
          pageImageUrl: '',
          pageVideoUrl: '',
          textColor: '',
          headingColor: '',
          buttonBackground: '',
          buttonText: '',
          buttonRadius: '',
          fontFamily: '',
          pageAnimation: '',
          blocks: [{ type: 'text', text: 'Content for this page…' }],
        },
      ],
    });
    if (studioMode) setStudioPage(n - 1);
  };
  const removePage = (pi) => {
    if (data.pages.length <= 1) return;
    onChange({ ...data, pages: data.pages.filter((_, i) => i !== pi) });
  };
  const movePage = (pi, dir) => {
    const pages = [...data.pages];
    const j = pi + dir;
    if (j < 0 || j >= pages.length) return;
    [pages[pi], pages[j]] = [pages[j], pages[pi]];
    onChange({ ...data, pages });
  };

  const updateBlock = (pi, bi, block) => {
    const pages = [...data.pages];
    const blocks = [...pages[pi].blocks];
    blocks[bi] = block;
    pages[pi] = { ...pages[pi], blocks };
    onChange({ ...data, pages });
  };
  const addBlock = (pi, blockType) => {
    const pages = [...data.pages];
    pages[pi] = { ...pages[pi], blocks: [...pages[pi].blocks, emptyBlock(blockType)] };
    onChange({ ...data, pages });
  };
  const removeBlock = (pi, bi) => {
    const pages = [...data.pages];
    pages[pi] = {
      ...pages[pi],
      blocks: pages[pi].blocks.filter((_, i) => i !== bi),
    };
    onChange({ ...data, pages });
  };

  useEffect(() => {
    if (!studioMode) return;
    if (studioPage >= data.pages.length) {
      setStudioPage(Math.max(0, data.pages.length - 1));
    }
  }, [studioMode, studioPage, data.pages.length, setStudioPage]);

  const appendEmojiToPage = (pi, emoji) => {
    const page = data.pages[pi];
    if (!page) return;
    const blocks = [...(page.blocks || [])];
    const idx = blocks.findIndex((b) => b && (b.type === 'text' || b.type === 'heading'));
    if (idx >= 0) {
      const b = blocks[idx];
      blocks[idx] = { ...b, text: `${b.text || ''}${emoji}` };
      setPage(pi, { ...page, blocks });
    } else {
      setPage(pi, { ...page, blocks: [...blocks, { type: 'text', text: emoji }] });
    }
  };

  const renderButtonStyleControls = (block, pi, bi) => (
    <div className="space-y-1 mt-2">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-zinc-500">Button look:</span>
        <select
          value={block.buttonStyle || 'stable'}
          onChange={(e) => updateBlock(pi, bi, { ...block, buttonStyle: e.target.value })}
          className={COMPACT_SELECT}
        >
          <option value="stable">Stable (static)</option>
          <option value="float">Floating (animated)</option>
          <option value="dodge">Dodge (chhota nudge — click mushkil)</option>
        </select>
      </div>
      {block.buttonStyle === 'dodge' && (
        <p className="text-[11px] text-amber-400/90">
          Cursor paas aate hi thoda idhar‑udhar hilega; click pakadna mushkil — page change nahi hoga.
        </p>
      )}
    </div>
  );

  const renderButtonColorOverrides = (block, pi, bi) => (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <ColorInput
        label="Override button fill (optional)"
        value={block.buttonBg || ''}
        onChange={(v) => updateBlock(pi, bi, { ...block, buttonBg: v })}
      />
      <ColorInput
        label="Override button text (optional)"
        value={block.buttonText || ''}
        onChange={(v) => updateBlock(pi, bi, { ...block, buttonText: v })}
      />
    </div>
  );

  const renderRotateControls = (block, pi, bi) => (
    <label className="flex flex-col gap-1 text-xs text-zinc-500 mt-2">
      <span>Rotate ({Math.round(Number(block.rotateDeg) || 0)}deg)</span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={Number(block.rotateDeg) || 0}
        onChange={(e) => updateBlock(pi, bi, { ...block, rotateDeg: Number(e.target.value) || 0 })}
      />
    </label>
  );

  const renderMediaStyleControls = (block, pi, bi) => (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-zinc-500">
          Fit
          <select
            value={block.mediaFit || 'cover'}
            onChange={(e) => updateBlock(pi, bi, { ...block, mediaFit: e.target.value })}
            className={`mt-1 ${COMPACT_SELECT}`}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </label>
        <label className="text-xs text-zinc-500">
          Corners (px)
          <input
            type="number"
            min={0}
            max={80}
            value={block.mediaRadius ?? 12}
            onChange={(e) => updateBlock(pi, bi, { ...block, mediaRadius: Number(e.target.value) || 0 })}
            className="mt-1 w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
          />
        </label>
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-zinc-500">
        <input
          type="checkbox"
          checked={block.mediaShadow !== false}
          onChange={(e) => updateBlock(pi, bi, { ...block, mediaShadow: e.target.checked })}
        />
        Shadow
      </label>
    </div>
  );

  const renderBlockEditor = (block, pi, bi) => {
    const key = `${pi}-${bi}`;
    switch (block.type) {
      case 'heading':
      case 'subheading':
        return (
          <div key={key}>
            <input
              value={block.text}
              onChange={(e) => updateBlock(pi, bi, { ...block, text: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
            />
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      case 'text':
        return (
          <div key={key}>
            <textarea
              value={block.text}
              onChange={(e) => updateBlock(pi, bi, { ...block, text: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white"
            />
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      case 'image':
      case 'gif':
      case 'video':
        return (
          <div key={key}>
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Slot id (e.g. hero)"
                value={block.slotKey || ''}
                onChange={(e) => updateBlock(pi, bi, { ...block, slotKey: e.target.value })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
              />
              <input
                placeholder="Label"
                value={block.label || ''}
                onChange={(e) => updateBlock(pi, bi, { ...block, label: e.target.value })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
              />
            </div>
            {renderRotateControls(block, pi, bi)}
            {renderMediaStyleControls(block, pi, bi)}
          </div>
        );
      case 'gallery':
        return (
          <div key={key}>
            <div className="flex gap-2 flex-wrap">
              <label className="text-xs text-zinc-500">
                Photo count
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={block.count}
                  onChange={(e) => updateBlock(pi, bi, { ...block, count: Number(e.target.value) || 4 })}
                  className="ml-1 w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
                />
              </label>
              <input
                placeholder="Slot prefix"
                value={block.slotPrefix || ''}
                onChange={(e) => updateBlock(pi, bi, { ...block, slotPrefix: e.target.value })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs flex-1 min-w-[100px]"
              />
            </div>
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      case 'button':
        return (
          <div key={key} className="space-y-2">
            <div className="flex gap-2 flex-wrap">
              <input
                value={block.label}
                onChange={(e) => updateBlock(pi, bi, { ...block, label: e.target.value })}
                className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
                placeholder="Button text"
              />
              <label className="text-xs text-zinc-500 flex items-center gap-1">
                → Page
                <input
                  type="number"
                  min={1}
                  value={block.navPage ?? ''}
                  onChange={(e) =>
                    updateBlock(pi, bi, { ...block, navPage: e.target.value === '' ? null : Number(e.target.value) })
                  }
                  className="w-14 px-1 py-1 rounded bg-white/5 border border-white/10 text-xs"
                />
              </label>
            </div>
            <p className="text-[11px] text-zinc-600">
              That page opens after the tap — add headings, text, photos there in the page list below.
            </p>
            {renderButtonStyleControls(block, pi, bi)}
            {renderButtonColorOverrides(block, pi, bi)}
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      case 'buttons':
        return (
          <div key={key} className="space-y-3">
            {(block.buttons || []).map((b, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-black/20 p-2 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={b.label}
                    onChange={(e) => {
                      const buttons = [...(block.buttons || [])];
                      buttons[i] = { ...b, label: e.target.value };
                      updateBlock(pi, bi, { ...block, buttons });
                    }}
                    className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  className="w-14 px-1 py-1 rounded bg-white/5 border border-white/10 text-xs"
                  value={b.navPage ?? ''}
                  onChange={(e) => {
                    const buttons = [...(block.buttons || [])];
                    buttons[i] = { ...b, navPage: Number(e.target.value) || 1 };
                    updateBlock(pi, bi, { ...block, buttons });
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={b.buttonStyle || 'stable'}
                  onChange={(e) => {
                    const buttons = [...(block.buttons || [])];
                    buttons[i] = { ...b, buttonStyle: e.target.value };
                    updateBlock(pi, bi, { ...block, buttons });
                  }}
                  className={COMPACT_SELECT}
                >
                  <option value="stable">Stable</option>
                  <option value="float">Floating</option>
                  <option value="dodge">Dodge (can&apos;t catch)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ColorInput
                  label="Btn fill"
                  value={b.buttonBg || ''}
                  onChange={(v) => {
                    const buttons = [...(block.buttons || [])];
                    buttons[i] = { ...b, buttonBg: v };
                    updateBlock(pi, bi, { ...block, buttons });
                  }}
                />
                <ColorInput
                  label="Btn text"
                  value={b.buttonText || ''}
                  onChange={(v) => {
                    const buttons = [...(block.buttons || [])];
                    buttons[i] = { ...b, buttonText: v };
                    updateBlock(pi, bi, { ...block, buttons });
                  }}
                />
              </div>
            </div>
            ))}
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      case 'buttonSlot':
        return (
          <div key={key} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                placeholder="Default label"
                value={block.defaultLabel || ''}
                onChange={(e) => updateBlock(pi, bi, { ...block, defaultLabel: e.target.value })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
              />
              <input
                placeholder="Hint"
                value={block.labelHint || ''}
                onChange={(e) => updateBlock(pi, bi, { ...block, labelHint: e.target.value })}
                className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
              />
              <label className="col-span-2 text-xs text-zinc-500">
                Go to page
                <input
                  type="number"
                  min={1}
                  value={block.navPage ?? 2}
                  onChange={(e) => updateBlock(pi, bi, { ...block, navPage: Number(e.target.value) || 1 })}
                  className="ml-2 w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs"
                />
              </label>
            </div>
            {renderButtonStyleControls(block, pi, bi)}
            {renderButtonColorOverrides(block, pi, bi)}
            {renderRotateControls(block, pi, bi)}
          </div>
        );
      default:
        return null;
    }
  };

  const pageIndices = studioMode
    ? [Math.min(Math.max(0, studioPage), Math.max(0, data.pages.length - 1))]
    : data.pages.map((_, i) => i);

  return (
    <div className="space-y-6">
      {studioMode && (
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          <span className="text-xs font-medium text-zinc-500 mr-1">Pages</span>
          {data.pages.map((_, i) => (
            <button
              key={data.pages[i].id || i}
              type="button"
              onClick={() => setStudioPage(i)}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                studioPage === i ? 'bg-brand-500/35 text-white ring-1 ring-brand-400/50' : 'bg-white/10 text-zinc-400 hover:bg-white/15'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={addPage}
            className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-brand-300 hover:bg-white/15"
          >
            + Page
          </button>
        </div>
      )}

      {studioMode && (
        <div>
          <p className="text-xs text-zinc-500 mb-2">Quick emoji (adds to first text/heading on this page, or new line)</p>
          <div className="flex flex-wrap gap-1">
            {EMOJI_BAR.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => appendEmojiToPage(studioPage, e)}
                className="rounded-lg bg-white/10 px-2 py-1.5 text-lg leading-none hover:bg-white/20"
                aria-label={`Add ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-zinc-400 mb-1">Site title (browser tab)</label>
        <input
          value={data.siteTitle || ''}
          onChange={(e) => setSiteTitle(e.target.value)}
          className={`rounded-xl ${APP_INPUT_CLASS}`}
        />
      </div>

      <div className="rounded-2xl border border-brand-500/20 bg-black/25 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-brand-300">Background</h3>
        <p className="text-xs text-zinc-500">Choose a type first — only the matching controls appear below.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
            <span>Background type</span>
            <select
              value={theme.backgroundKind || 'solid'}
              onChange={(e) => setTheme({ backgroundKind: e.target.value })}
              className={SELECT_CLASS}
            >
              {BG_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {theme.backgroundKind === 'solid' && (
            <ColorInput
              className="sm:col-span-2"
              label="Solid color"
              value={theme.pageBackground}
              onChange={(v) => setTheme({ pageBackground: v })}
            />
          )}
          {theme.backgroundKind === 'gradient' && (
            <>
              <ColorInput label="Gradient start" value={theme.gradientFrom} onChange={(v) => setTheme({ gradientFrom: v })} />
              <ColorInput label="Gradient end" value={theme.gradientTo} onChange={(v) => setTheme({ gradientTo: v })} />
              <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
                <span>Angle (degrees)</span>
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={theme.gradientAngle ?? 135}
                  onChange={(e) => setTheme({ gradientAngle: Number(e.target.value) || 0 })}
                  className={APP_INPUT_CLASS}
                />
              </label>
            </>
          )}
          {theme.backgroundKind === 'image' && (
            <>
              <ColorInput
                label="Tint / fallback color"
                value={theme.pageBackground}
                onChange={(v) => setTheme({ pageBackground: v })}
              />
              <div className="sm:col-span-2">
                <MediaUploadField
                  label="Background image"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  value={theme.backgroundImageUrl || ''}
                  onChange={(url) => setTheme({ backgroundImageUrl: url })}
                  uploading={uploading === 'bgImage'}
                  onFile={(file) => uploadMedia('bgImage', file, (url) => setTheme({ backgroundImageUrl: url }))}
                  preview="image"
                />
              </div>
            </>
          )}
          {theme.backgroundKind === 'video' && (
            <>
              <ColorInput
                label="Color behind video (while loading)"
                value={theme.pageBackground}
                onChange={(v) => setTheme({ pageBackground: v })}
              />
              <div className="sm:col-span-2">
                <MediaUploadField
                  label="Background video"
                  accept="video/mp4,video/webm,video/quicktime"
                  value={theme.backgroundVideoUrl || ''}
                  onChange={(url) => setTheme({ backgroundVideoUrl: url })}
                  uploading={uploading === 'bgVideo'}
                  onFile={(file) => uploadMedia('bgVideo', file, (url) => setTheme({ backgroundVideoUrl: url }))}
                  preview="video"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {!studioMode && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addPage}
            className="rounded-lg bg-brand-500/25 px-3 py-1.5 text-sm text-brand-300 hover:bg-brand-500/35"
          >
            + Add page
          </button>
          <span className="text-xs text-zinc-500">
            {data.pages.length} page(s) — each page is one screen; buttons jump to another page.
          </span>
        </div>
      )}

      {pageIndices.map((pi) => {
        const page = data.pages[pi];
        return (
        <div
          key={page.id || pi}
          className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <span className="text-sm font-medium text-brand-300">Page {pi + 1}</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => movePage(pi, -1)}
                disabled={pi === 0}
                className="rounded px-2 py-0.5 text-xs bg-white/10 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => movePage(pi, 1)}
                disabled={pi === data.pages.length - 1}
                className="rounded px-2 py-0.5 text-xs bg-white/10 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removePage(pi)}
                disabled={data.pages.length <= 1}
                className="rounded px-2 py-0.5 text-xs bg-red-500/20 text-red-300 disabled:opacity-30"
              >
                Remove page
              </button>
            </div>
          </div>
          <input
            value={page.pageTitle || ''}
            onChange={(e) => setPage(pi, { ...page, pageTitle: e.target.value })}
            placeholder="Section title (shown in the user form)"
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
          />
          <label className="flex flex-col gap-1 text-xs text-zinc-500">
            <span>Auto go to next page after (seconds) — 0 = off</span>
            <input
              type="number"
              min={0}
              max={120}
              step={1}
              value={
                page.pageDurationMs === '' || page.pageDurationMs == null
                  ? ''
                  : Math.round(Number(page.pageDurationMs) / 1000)
              }
              onChange={(e) => {
                const v = e.target.value;
                setPage(pi, {
                  ...page,
                  pageDurationMs: v === '' ? '' : Math.min(120000, Math.max(0, Number(v) * 1000)),
                });
              }}
              placeholder="0"
              className={APP_INPUT_CLASS}
            />
          </label>
          <ColorInput
            label="This page only — background color (optional)"
            value={page.pageBackground || ''}
            onChange={(v) => setPage(pi, { ...page, pageBackground: v })}
          />
          <div className="space-y-4 rounded-xl border border-white/5 bg-black/20 p-3">
            <p className="text-xs font-medium text-zinc-400">Extra layer on this page (optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MediaUploadField
                label="Background image"
                accept="image/jpeg,image/png,image/gif,image/webp"
                value={page.pageImageUrl || ''}
                onChange={(url) => setPage(pi, { ...data.pages[pi], pageImageUrl: url })}
                uploading={uploading === `p${pi}-img`}
                onFile={(file) =>
                  uploadMedia(`p${pi}-img`, file, (url) =>
                    setPage(pi, { ...data.pages[pi], pageImageUrl: url })
                  )
                }
                preview="image"
              />
              <MediaUploadField
                label="Background video (over image)"
                accept="video/mp4,video/webm,video/quicktime"
                value={page.pageVideoUrl || ''}
                onChange={(url) => setPage(pi, { ...data.pages[pi], pageVideoUrl: url })}
                uploading={uploading === `p${pi}-vid`}
                onFile={(file) =>
                  uploadMedia(`p${pi}-vid`, file, (url) =>
                    setPage(pi, { ...data.pages[pi], pageVideoUrl: url })
                  )
                }
                preview="video"
              />
            </div>
          </div>
          <p className="text-[11px] text-zinc-600">
            Video plays over the image. Site-wide backdrop is in &quot;Background&quot; above.
          </p>

          <div className="rounded-xl border border-brand-500/20 bg-black/25 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-brand-300">Text, buttons &amp; motion (this page)</h4>
            <p className="text-[11px] text-zinc-600">
              Leave blank to use the site-wide defaults (colors &amp; font in the saved template). Set here only to
              override this page.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ColorInput
                label="Text color"
                value={page.textColor || ''}
                onChange={(v) => setPage(pi, { ...data.pages[pi], textColor: v })}
              />
              <ColorInput
                label="Heading color"
                value={page.headingColor || ''}
                onChange={(v) => setPage(pi, { ...data.pages[pi], headingColor: v })}
              />
              <ColorInput
                label="Button background"
                value={page.buttonBackground || ''}
                onChange={(v) => setPage(pi, { ...data.pages[pi], buttonBackground: v })}
              />
              <ColorInput
                label="Button text"
                value={page.buttonText || ''}
                onChange={(v) => setPage(pi, { ...data.pages[pi], buttonText: v })}
              />
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                <span>Button radius (px)</span>
                <input
                  type="number"
                  min={0}
                  max={48}
                  value={page.buttonRadius === '' || page.buttonRadius === undefined ? '' : page.buttonRadius}
                  placeholder={`Default: ${theme.buttonRadius ?? 24}`}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPage(pi, { ...data.pages[pi], buttonRadius: v === '' ? '' : Number(v) });
                  }}
                  className={APP_INPUT_CLASS}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500">
                <span>Page open animation</span>
                <select
                  value={page.pageAnimation || ''}
                  onChange={(e) => setPage(pi, { ...data.pages[pi], pageAnimation: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">— Site default —</option>
                  {PAGE_ANIM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-zinc-500 sm:col-span-2">
                <span>Font</span>
                <select
                  value={page.fontFamily || ''}
                  onChange={(e) => setPage(pi, { ...data.pages[pi], fontFamily: e.target.value })}
                  className={SELECT_CLASS}
                >
                  <option value="">— Site default —</option>
                  {BUILDER_FONT_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {(page.blocks || []).map((block, bi) => (
              <div key={`${pi}-${bi}`} className="rounded-lg border border-white/5 bg-white/5 p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-xs text-zinc-500 uppercase">{block.type}</span>
                  <button
                    type="button"
                    onClick={() => removeBlock(pi, bi)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove block
                  </button>
                </div>
                {renderBlockEditor(block, pi, bi)}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500 w-full">Add block:</span>
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                type="button"
                onClick={() => addBlock(pi, bt.type)}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/15"
              >
                + {bt.label}
              </button>
            ))}
          </div>
        </div>
        );
      })}
    </div>
  );
}
