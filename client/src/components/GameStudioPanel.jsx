import { useState, useRef, useEffect } from 'react';
import { BUILDER_FONT_OPTIONS } from '../lib/visualTemplateBuilder';

const EMOJI_PALETTE = ['🍎', '⭐', '🎈', '🌸', '🐱', '🍩', '🎁', '🌈', '🍕', '🐶', '⚽', '🎵', '💖', '🔥', '🌙', '🦄', '🍓', '🌺', '🎮', '🚀', '🐰', '🍔', '🎸', '👑'];

/**
 * GameStudioPanel — edits the config of an interactive / game block:
 * content + a full 🎨 style section (theme, colors, font, shape, effect,
 * background, image). `onChange(patch)` is the shared updateSelectedBlock.
 */
export const GAME_TYPES = ['trickyn', 'reveal', 'quiz', 'poll', 'memory', 'spot', 'wheel', 'giftbox', 'flip', 'slot', 'puzzle', 'rps', 'tapsong'];

const INPUT = 'w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-brand-400';

/* One-click game themes (accent colors + text + font + shape + effect). */
const GAME_THEMES = [
  { id: 'default', label: '💜 Default', patch: { gameAccent: '#8B5CF6', gameAccent2: '#EC4899', gameTextColor: '', gameCardColor: '', gameFont: '', gameShape: 'pill', gameFx: 'none', gameBg: '' } },
  { id: 'romantic', label: '💕 Romantic', patch: { gameAccent: '#FB7185', gameAccent2: '#F472B6', gameTextColor: '#ffffff', gameFont: '"Dancing Script", cursive', gameShape: 'pill', gameFx: 'glow' } },
  { id: 'neon', label: '⚡ Neon', patch: { gameAccent: '#05D9E8', gameAccent2: '#FF2A6D', gameTextColor: '#eafcff', gameFont: '"Audiowide", cursive', gameShape: 'rounded', gameFx: 'neon' } },
  { id: 'birthday', label: '🎂 Birthday', patch: { gameAccent: '#FFB703', gameAccent2: '#FB5607', gameTextColor: '#ffffff', gameFont: '"Fredoka", system-ui, sans-serif', gameShape: 'pill', gameFx: 'glow' } },
  { id: 'elegant', label: '🥂 Elegant', patch: { gameAccent: '#C9A24B', gameAccent2: '#8B6F2E', gameTextColor: '#F3E9D2', gameFont: '"Cinzel", serif', gameShape: 'square', gameFx: 'none' } },
  { id: 'cyber', label: '🤖 Cyber', patch: { gameAccent: '#A855F7', gameAccent2: '#22D3EE', gameTextColor: '#ffffff', gameFont: '"Space Grotesk", system-ui, sans-serif', gameShape: 'rounded', gameFx: 'glass' } },
];

const SHAPES = [{ v: 'pill', l: 'Pill' }, { v: 'rounded', l: 'Rounded' }, { v: 'square', l: 'Square' }];
const FX = [{ v: 'none', l: 'None' }, { v: 'glow', l: 'Glow' }, { v: 'glass', l: 'Glass' }, { v: 'neon', l: 'Neon' }];

function Swatch({ label, value, fallback, onChange }) {
  return (
    <label className="flex items-center justify-between gap-2 text-[11px] text-slate-300">
      <span>{label}</span>
      <span className="relative h-7 w-9 overflow-hidden rounded-lg border border-white/15">
        <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 -m-2 h-[160%] w-[160%] cursor-pointer" />
      </span>
    </label>
  );
}

function Chips({ options, value, onPick }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onPick(o.v)} aria-pressed={value === o.v}
          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${value === o.v ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-400">{label}</span>
      <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={INPUT} />
    </label>
  );
}

/* List editor that keeps a RAW local string so newlines work while typing.
   It commits the parsed (trimmed, non-empty) array to storage on every change,
   but only re-syncs from props when the field is NOT focused (e.g. you picked a
   different block) — otherwise pressing Enter would be swallowed instantly. */
function ListField({ label, items, onChange, hint }) {
  const ref = useRef(null);
  const [text, setText] = useState(() => (Array.isArray(items) ? items : []).join('\n'));
  useEffect(() => {
    if (document.activeElement !== ref.current) setText((Array.isArray(items) ? items : []).join('\n'));
  }, [items]);
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-slate-400">{label} <span className="text-slate-600">{hint}</span></span>
      <textarea
        ref={ref}
        rows={4}
        value={text}
        onChange={(e) => { setText(e.target.value); onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)); }}
        className={INPUT}
      />
    </label>
  );
}

/* Memory card items — emoji palette + photo upload + removable chips.
   Each item is an emoji OR an image URL; both become a matching pair. */
function MemoryItemsEditor({ items, onChange, onUploadImage }) {
  const list = Array.isArray(items) ? items : [];
  const isUrl = (s) => /^(https?:|data:)/i.test(s);
  const add = (v) => { if (list.length >= 8 || list.includes(v)) return; onChange([...list, v]); };
  const removeAt = (i) => onChange(list.filter((_, j) => j !== i));
  const [busy, setBusy] = useState(false);
  const onFile = async (file) => {
    if (!file || !onUploadImage) return;
    setBusy(true);
    const url = await onUploadImage(file);
    setBusy(false);
    if (url) add(url);
  };
  return (
    <div className="space-y-2">
      <span className="block text-[11px] text-slate-400">Cards <span className="text-slate-600">(each item = one matching pair · max 8)</span></span>
      {/* current items */}
      <div className="flex flex-wrap gap-1.5">
        {list.map((it, i) => (
          <span key={`${it}-${i}`} className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-slate-800 text-xl">
            {isUrl(it) ? <img src={it} alt="" className="h-full w-full object-cover" /> : it}
            <button type="button" onClick={() => removeAt(i)} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">×</button>
          </span>
        ))}
        {!list.length && <span className="text-[11px] text-slate-600">No cards yet — add emojis or photos below.</span>}
      </div>
      {/* emoji palette */}
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-900/60 p-1.5">
        {EMOJI_PALETTE.map((e) => (
          <button key={e} type="button" onClick={() => add(e)} disabled={list.length >= 8}
            className="flex h-7 w-7 items-center justify-center rounded text-lg transition hover:bg-white/15 disabled:opacity-30">{e}</button>
        ))}
      </div>
      {/* add photo */}
      <label className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-brand-400 hover:bg-white/5 ${list.length >= 8 ? 'pointer-events-none opacity-40' : ''}`}>
        {busy ? '⏳ Uploading…' : '🖼️ Add photo'}
        <input type="file" accept="image/*" className="hidden" disabled={list.length >= 8 || busy}
          onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
  );
}

export default function GameStudioPanel({ block, onChange, onUploadImage, onOpenMusicEditor }) {
  const [busy, setBusy] = useState(false);
  if (!block || !GAME_TYPES.includes(block.type)) return null;
  const t = block.type;
  const opts = Array.isArray(block.options) ? block.options : [];

  return (
    <div className="space-y-2 rounded-xl border border-brand-400/20 bg-brand-500/[0.06] p-3">
      <h5 className="text-[11px] font-extrabold uppercase tracking-widest text-brand-200">🎮 Game settings</h5>

      {t === 'trickyn' && (<>
        <Field label="Question" value={block.question} onChange={(v) => onChange({ question: v })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Yes button" value={block.yesText} onChange={(v) => onChange({ yesText: v })} />
          <Field label="No button" value={block.noText} onChange={(v) => onChange({ noText: v })} />
        </div>
        <Field label="When they say Yes" value={block.successText} onChange={(v) => onChange({ successText: v })} />
        <p className="text-[10px] text-slate-500">The “No” button runs away when chased. 😈</p>
      </>)}

      {t === 'reveal' && (<>
        <Field label="Cover text" value={block.coverText} onChange={(v) => onChange({ coverText: v })} />
        <Field label="Hidden message" value={block.message} onChange={(v) => onChange({ message: v })} />
      </>)}

      {t === 'quiz' && (<>
        <Field label="Question" value={block.question} onChange={(v) => onChange({ question: v })} />
        <ListField label="Options" hint="(one per line)" items={opts} onChange={(v) => onChange({ options: v, correctIndex: Math.min(block.correctIndex || 0, Math.max(0, v.length - 1)) })} />
        <label className="block">
          <span className="mb-1 block text-[11px] text-slate-400">Correct answer</span>
          <select value={block.correctIndex || 0} onChange={(e) => onChange({ correctIndex: Number(e.target.value) })} className={INPUT}>
            {opts.map((o, i) => <option key={i} value={i}>{o || `Option ${i + 1}`}</option>)}
          </select>
        </label>
      </>)}

      {t === 'poll' && (<>
        <Field label="Question" value={block.question} onChange={(v) => onChange({ question: v })} />
        <ListField label="Options" hint="(one per line)" items={opts} onChange={(v) => onChange({ options: v })} />
      </>)}

      {t === 'memory' && (
        <MemoryItemsEditor items={block.emojis} onChange={(v) => onChange({ emojis: v.slice(0, 8) })} onUploadImage={onUploadImage} />
      )}

      {t === 'spot' && (<>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Common emoji" value={block.emoji} onChange={(v) => onChange({ emoji: v })} />
          <Field label="Odd one" value={block.odd} onChange={(v) => onChange({ odd: v })} />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] text-slate-400">How many ({block.count || 20})</span>
          <input type="range" min={6} max={40} value={block.count || 20} onChange={(e) => onChange({ count: Number(e.target.value) })} className="w-full" />
        </label>
      </>)}

      {t === 'wheel' && (
        <ListField label="Wheel segments" hint="(one per line · up to 8)" items={block.segments} onChange={(v) => onChange({ segments: v.slice(0, 8) })} />
      )}

      {t === 'giftbox' && (<>
        <Field label="Box emoji" value={block.boxEmoji} onChange={(v) => onChange({ boxEmoji: v })} />
        <Field label="Hidden message" value={block.message} onChange={(v) => onChange({ message: v })} />
      </>)}

      {t === 'flip' && (<>
        <Field label="Front" value={block.front} onChange={(v) => onChange({ front: v })} />
        <Field label="Back" value={block.back} onChange={(v) => onChange({ back: v })} />
      </>)}

      {t === 'slot' && (
        <ListField label="Symbols" hint="(one per line)" items={block.symbols} onChange={(v) => onChange({ symbols: v.slice(0, 8) })} />
      )}

      {t === 'puzzle' && (
        <div className="space-y-2">
          <span className="block text-[11px] text-slate-400">Photo <span className="text-slate-600">(optional — leave empty for number tiles)</span></span>
          {block.puzzleImageUrl && <img src={block.puzzleImageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />}
          <div className="flex gap-2">
            <label className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 px-3 py-2 text-[11px] font-semibold text-slate-200 transition hover:border-brand-400 hover:bg-white/5 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              {busy ? '⏳ Uploading…' : '🖼️ Upload photo'}
              <input type="file" accept="image/*" className="hidden" disabled={busy}
                onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && onUploadImage) { setBusy(true); const url = await onUploadImage(f); setBusy(false); if (url) onChange({ puzzleImageUrl: url }); } }} />
            </label>
            {block.puzzleImageUrl && <button type="button" onClick={() => onChange({ puzzleImageUrl: '' })} className="rounded-lg bg-white/10 px-2 py-1 text-[11px] text-slate-300 hover:bg-white/20">remove</button>}
          </div>
        </div>
      )}

      {t === 'rps' && (
        <Field label="Title" value={block.question} onChange={(v) => onChange({ question: v })} />
      )}

      {t === 'tapsong' && (<>
        <Field label="Icon (emoji)" value={block.icon} onChange={(v) => onChange({ icon: v })} />
        <Field label="Label (optional)" value={block.label} onChange={(v) => onChange({ label: v })} />
        <div className="space-y-1">
          <span className="block text-[11px] text-slate-400">Photo <span className="text-slate-600">(optional — shown instead of the icon)</span></span>
          <div className="flex items-center gap-2">
            {block.tapImage && <img src={block.tapImage} alt="" className="h-10 w-10 rounded-full object-cover" />}
            <label className="cursor-pointer rounded-lg border border-dashed border-white/20 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-brand-400 hover:bg-white/5">🖼️ Upload
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && onUploadImage) { setBusy(true); const u = await onUploadImage(f); setBusy(false); if (u) onChange({ tapImage: u }); } }} /></label>
            {block.tapImage && <button type="button" onClick={() => onChange({ tapImage: '' })} className="text-[11px] text-rose-300 hover:text-rose-200">remove</button>}
          </div>
        </div>
        <div className="space-y-1.5">
          <span className="block text-[11px] text-slate-400">Song <span className="text-slate-600">(plays when this button is tapped)</span></span>
          {(block.music?.url || block.songUrl) && (
            <p className="truncate rounded-lg bg-white/5 px-2 py-1 text-[11px] text-slate-200">🎵 {block.music?.title || 'Selected track'}</p>
          )}
          <button type="button" onClick={() => onOpenMusicEditor?.()}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-500 to-pink-500 px-3 py-2 text-[12px] font-bold text-white hover:opacity-95">
            🎵 {block.music?.url || block.songUrl ? 'Edit song (search · trim · fade)' : 'Choose a song'}
          </button>
          <div className="flex gap-2">
            <input value={block.songUrl || ''} onChange={(e) => onChange({ songUrl: e.target.value, music: undefined })} placeholder="…or paste a URL" className={`${INPUT} flex-1`} />
            <label className="flex cursor-pointer items-center rounded-lg border border-dashed border-white/20 px-3 py-2 text-[11px] font-semibold text-slate-200 hover:border-brand-400 hover:bg-white/5">{busy ? '⏳' : '⬆'}
              <input type="file" accept="audio/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f && onUploadImage) { setBusy(true); const u = await onUploadImage(f); setBusy(false); if (u) onChange({ songUrl: u, music: undefined }); } }} /></label>
          </div>
        </div>
      </>)}

      {/* ── 🎨 Style ── */}
      <div className="mt-1 border-t border-white/10 pt-2">
        <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-200">🎨 Theme</p>
        <div className="flex flex-wrap gap-1.5">
          {GAME_THEMES.map((th) => (
            <button key={th.id} type="button" onClick={() => onChange(th.patch)}
              className="rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200 transition hover:bg-brand-500 hover:text-white">
              {th.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Swatch label="Accent 1" value={block.gameAccent} fallback="#8B5CF6" onChange={(v) => onChange({ gameAccent: v })} />
          <Swatch label="Accent 2" value={block.gameAccent2} fallback="#EC4899" onChange={(v) => onChange({ gameAccent2: v })} />
          <Swatch label="Text" value={block.gameTextColor} fallback="#ffffff" onChange={(v) => onChange({ gameTextColor: v })} />
          <Swatch label="Surface" value={block.gameCardColor} fallback="#334155" onChange={(v) => onChange({ gameCardColor: v })} />
        </div>

        <div className="mt-3">
          <span className="mb-1 block text-[11px] text-slate-400">Font</span>
          <select value={block.gameFont || ''} onChange={(e) => onChange({ gameFont: e.target.value })} className={INPUT}>
            <option value="">Default (inherit)</option>
            {BUILDER_FONT_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><span className="mb-1 block text-[11px] text-slate-400">Shape</span><Chips options={SHAPES} value={block.gameShape || 'pill'} onPick={(v) => onChange({ gameShape: v })} /></div>
          <div><span className="mb-1 block text-[11px] text-slate-400">Effect</span><Chips options={FX} value={block.gameFx || 'none'} onPick={(v) => onChange({ gameFx: v })} /></div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <Swatch label="Background" value={block.gameBg} fallback="#111827" onChange={(v) => onChange({ gameBg: v })} />
            {block.gameBg && <button type="button" onClick={() => onChange({ gameBg: '' })} className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/20">clear</button>}
          </div>
          <Field label="Background image URL" value={block.gameImageUrl} onChange={(v) => onChange({ gameImageUrl: v })} placeholder="https://…/photo.jpg" />
        </div>
      </div>
    </div>
  );
}
