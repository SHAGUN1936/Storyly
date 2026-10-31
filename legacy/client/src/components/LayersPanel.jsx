import { useMemo, useState } from 'react';

/**
 * LayersPanel — a Canva-style layer manager for the Admin builder.
 *
 * Works on the ACTIVE page's flat `blocks` array. Z-order = array index
 * (higher index = nearer the front), so the panel shows the FRONT-MOST layer
 * at the TOP (reversed display), like Canva/Figma.
 *
 * Groups are modelled as a flat `block.groupId` shared by members (no nested
 * containers — keeps slots/indices and the render path untouched). Consecutive
 * blocks with the same groupId collapse into one group row.
 *
 * All mutations are delegated to the parent so builderState stays the single
 * source of truth and the canvas (HTML deck + Fabric overlay) stays in sync.
 *
 * Props:
 *  blocks            : normalized block array for the active page
 *  selectedIndices   : array of selected block indices (multi-select)
 *  onSelectIndices   : (indices:number[]) => void
 *  onReorderRows     : (descriptors:{indices:number[]}[]) => void  // top→bottom order
 *  onRename          : (index:number, name:string) => void
 *  onToggleField     : (indices:number[], field:'hidden'|'locked') => void
 *  onDuplicate       : (indices:number[]) => void
 *  onDelete          : (indices:number[]) => void
 *  onGroup           : (indices:number[]) => void
 *  onUngroup         : (groupId:string) => void
 */
const TYPE_ICON = {
  text: 'T', heading: 'H', subheading: 'h', paragraph: '¶',
  image: '🖼', gif: '🎞', video: '🎬', button: '🔘', buttons: '🔘',
  gallery: '🖼', sticker: '⭐', shape: '⬛', countdown: '⏱', divider: '—',
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

function labelOf(b, i) {
  if (b.name) return b.name;
  if ((b.type === 'text' || b.type === 'heading' || b.type === 'subheading' || b.type === 'paragraph') && b.text) {
    return `"${String(b.text).slice(0, 20)}"`;
  }
  if (b.type === 'button' && b.label) return `"${String(b.label).slice(0, 18)}"`;
  if (b.type === 'sticker' && b.emoji) return `Sticker ${b.emoji}`;
  return `${cap(b.type)} ${i + 1}`;
}

export default function LayersPanel({
  blocks = [],
  selectedIndices = [],
  onSelectIndices,
  onReorderRows,
  onRename,
  onToggleField,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
}) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [editing, setEditing] = useState(null);   // { index, value }
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const [anchorKey, setAnchorKey] = useState(null);

  const selSet = useMemo(() => new Set(selectedIndices), [selectedIndices]);

  /* Build rows: group consecutive same-groupId blocks into one group row. */
  const rows = useMemo(() => {
    const out = [];
    const seen = new Set();
    blocks.forEach((b, i) => {
      if (b.groupId) {
        if (seen.has(b.groupId)) return;
        seen.add(b.groupId);
        const indices = blocks.reduce((acc, bb, j) => (bb.groupId === b.groupId ? [...acc, j] : acc), []);
        out.push({ key: `g:${b.groupId}`, kind: 'group', groupId: b.groupId, indices });
      } else {
        out.push({ key: `b:${i}`, kind: 'block', index: i, indices: [i] });
      }
    });
    return out;
  }, [blocks]);

  // Front-most on top (Canva convention).
  const display = useMemo(() => [...rows].reverse(), [rows]);

  const selectedGroupId = useMemo(() => {
    // The single group fully covered by the current selection (enables Ungroup).
    const gids = new Set();
    selectedIndices.forEach((i) => { const g = blocks[i]?.groupId; if (g) gids.add(g); });
    return gids.size === 1 ? [...gids][0] : null;
  }, [selectedIndices, blocks]);

  const canGroup = selectedIndices.length >= 2;
  const canUngroup = !!selectedGroupId;

  const pick = (row, e) => {
    const idxs = row.indices;
    if (e.shiftKey && anchorKey) {
      const a = display.findIndex((d) => d.key === anchorKey);
      const b = display.findIndex((d) => d.key === row.key);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const union = new Set();
        for (let k = lo; k <= hi; k++) display[k].indices.forEach((x) => union.add(x));
        onSelectIndices?.([...union].sort((x, y) => x - y));
        return;
      }
    }
    if (e.metaKey || e.ctrlKey) {
      const set = new Set(selectedIndices);
      const allIn = idxs.every((x) => set.has(x));
      idxs.forEach((x) => (allIn ? set.delete(x) : set.add(x)));
      onSelectIndices?.([...set].sort((x, y) => x - y));
      setAnchorKey(row.key);
      return;
    }
    onSelectIndices?.(idxs);
    setAnchorKey(row.key);
  };

  const drop = (targetKey) => {
    if (!dragKey || dragKey === targetKey) { setDragKey(null); setOverKey(null); return; }
    const from = display.findIndex((d) => d.key === dragKey);
    const to = display.findIndex((d) => d.key === targetKey);
    setDragKey(null); setOverKey(null);
    if (from < 0 || to < 0) return;
    const next = [...display];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorderRows?.(next.map((d) => ({ indices: d.indices })));
  };

  const commitName = () => {
    if (editing) { onRename?.(editing.index, editing.value.trim()); setEditing(null); }
  };

  /* Forward/back buttons — reorder one step. Works on touch where the
     HTML5 drag-and-drop above does not fire. */
  const moveRow = (key, dir) => {
    const di = display.findIndex((d) => d.key === key);
    const tj = dir === 'up' ? di - 1 : di + 1;
    if (di < 0 || tj < 0 || tj >= display.length) return;
    const next = [...display];
    const [m] = next.splice(di, 1);
    next.splice(tj, 0, m);
    onReorderRows?.(next.map((d) => ({ indices: d.indices })));
  };

  const Reorder = ({ rowKey }) => {
    const di = display.findIndex((d) => d.key === rowKey);
    return (
      <div className="-my-1 flex flex-col">
        <button type="button" title="Bring forward" disabled={di <= 0}
          onClick={(e) => { e.stopPropagation(); moveRow(rowKey, 'up'); }}
          className="h-3.5 w-4 text-[9px] leading-none text-slate-400 transition hover:text-white disabled:opacity-20">▲</button>
        <button type="button" title="Send backward" disabled={di >= display.length - 1}
          onClick={(e) => { e.stopPropagation(); moveRow(rowKey, 'down'); }}
          className="h-3.5 w-4 text-[9px] leading-none text-slate-400 transition hover:text-white disabled:opacity-20">▼</button>
      </div>
    );
  };

  const IconBtn = ({ title, onClick, children, danger }) => (
    <button
      type="button"
      title={title}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] transition ${
        danger ? 'text-rose-300 hover:bg-rose-500/30' : 'text-slate-300 hover:bg-white/15'
      }`}
    >{children}</button>
  );

  const rowSelected = (idxs) => idxs.some((i) => selSet.has(i));
  const rowFullySelected = (idxs) => idxs.length > 0 && idxs.every((i) => selSet.has(i));

  if (!blocks.length) {
    return <p className="px-1 py-6 text-center text-[11px] text-slate-500">No layers yet — add an element to the canvas.</p>;
  }

  const Controls = ({ idxs, anyHidden, anyLocked, isGroup, groupId }) => (
    <div className="flex items-center gap-0.5 opacity-70 transition group-hover/row:opacity-100">
      <IconBtn title={anyHidden ? 'Show' : 'Hide'} onClick={() => onToggleField?.(idxs, 'hidden')}>{anyHidden ? '🙈' : '👁'}</IconBtn>
      <IconBtn title={anyLocked ? 'Unlock' : 'Lock'} onClick={() => onToggleField?.(idxs, 'locked')}>{anyLocked ? '🔒' : '🔓'}</IconBtn>
      <IconBtn title="Duplicate" onClick={() => onDuplicate?.(idxs)}>⧉</IconBtn>
      {isGroup && <IconBtn title="Ungroup" onClick={() => onUngroup?.(groupId)}>⛓️‍💥</IconBtn>}
      <IconBtn title="Delete" danger onClick={() => onDelete?.(idxs)}>🗑</IconBtn>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Selection / group toolbar */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {selectedIndices.length > 1 ? `${selectedIndices.length} selected` : 'Layers'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!canGroup}
            onClick={() => onGroup?.(selectedIndices)}
            className="rounded-md px-2 py-1 text-[11px] font-bold text-slate-100 transition enabled:hover:bg-brand-500 enabled:hover:text-white disabled:opacity-30"
          >⧉ Group</button>
          <button
            type="button"
            disabled={!canUngroup}
            onClick={() => onUngroup?.(selectedGroupId)}
            className="rounded-md px-2 py-1 text-[11px] font-bold text-slate-100 transition enabled:hover:bg-white/15 disabled:opacity-30"
          >Ungroup</button>
        </div>
      </div>

      <div className="space-y-1">
        {display.map((row) => {
          const isOver = overKey === row.key && dragKey && dragKey !== row.key;
          const dndProps = {
            draggable: true,
            onDragStart: () => setDragKey(row.key),
            onDragEnd: () => { setDragKey(null); setOverKey(null); },
            onDragOver: (e) => { e.preventDefault(); if (overKey !== row.key) setOverKey(row.key); },
            onDrop: (e) => { e.preventDefault(); drop(row.key); },
          };

          if (row.kind === 'group') {
            const isCol = collapsed.has(row.groupId);
            const anyHidden = row.indices.some((i) => blocks[i]?.hidden);
            const anyLocked = row.indices.some((i) => blocks[i]?.locked);
            const sel = rowSelected(row.indices);
            return (
              <div key={row.key} className={isOver ? 'rounded-lg ring-2 ring-brand-400/70' : ''}>
                <div
                  {...dndProps}
                  onClick={(e) => pick(row, e)}
                  className={`group/row flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1.5 transition ${
                    sel ? 'bg-brand-500/20 ring-1 ring-brand-400' : 'bg-slate-800/50 hover:bg-slate-800/80'
                  }`}
                >
                  <span className="cursor-grab select-none text-slate-500" title="Drag to reorder">⋮⋮</span>
                  <Reorder rowKey={row.key} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCollapsed((p) => { const n = new Set(p); n.has(row.groupId) ? n.delete(row.groupId) : n.add(row.groupId); return n; }); }}
                    className="h-5 w-5 rounded text-[10px] text-slate-300 hover:bg-white/15"
                  >{isCol ? '▸' : '▾'}</button>
                  <span className="flex-1 truncate text-[11px] font-bold text-slate-100">📁 Group · {row.indices.length}</span>
                  <Controls idxs={row.indices} anyHidden={anyHidden} anyLocked={anyLocked} isGroup groupId={row.groupId} />
                </div>
                {!isCol && (
                  <div className="ml-3 mt-1 space-y-1 border-l border-white/10 pl-2">
                    {[...row.indices].reverse().map((i) => {
                      const b = blocks[i];
                      const childSel = selSet.has(i);
                      return (
                        <div
                          key={`gc:${i}`}
                          onClick={(e) => { e.stopPropagation(); pick({ key: `b:${i}`, indices: [i] }, e); }}
                          className={`group/row flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition ${
                            childSel ? 'bg-brand-500/20 text-white ring-1 ring-brand-400/60' : 'text-slate-300 hover:bg-slate-800/70'
                          } ${b?.hidden ? 'opacity-40' : ''}`}
                        >
                          <span className="w-4 text-center text-[10px] text-slate-400">{b?.type === 'sticker' && b?.emoji ? b.emoji : (TYPE_ICON[b?.type] || '▫')}</span>
                          <span className="flex-1 truncate">{labelOf(b, i)}</span>
                          <Controls idxs={[i]} anyHidden={b?.hidden} anyLocked={b?.locked} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // ── standalone block row ──
          const i = row.index;
          const b = blocks[i];
          const sel = selSet.has(i);
          const isEditing = editing?.index === i;
          return (
            <div
              key={row.key}
              {...dndProps}
              onClick={(e) => pick(row, e)}
              className={`group/row flex cursor-pointer items-center gap-1 rounded-lg px-1.5 py-1.5 transition ${
                isOver ? 'ring-2 ring-brand-400/70' : ''
              } ${sel ? 'bg-brand-500/20 ring-1 ring-brand-400' : 'bg-slate-800/40 hover:bg-slate-800/70'} ${b?.hidden ? 'opacity-40' : ''}`}
            >
              <span className="cursor-grab select-none text-slate-500" title="Drag to reorder">⋮⋮</span>
              <Reorder rowKey={row.key} />
              <span className="w-4 text-center text-[11px] text-slate-400">{b?.type === 'sticker' && b?.emoji ? b.emoji : (TYPE_ICON[b?.type] || '▫')}</span>
              {isEditing ? (
                <input
                  autoFocus
                  value={editing.value}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditing({ index: i, value: e.target.value })}
                  onBlur={commitName}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditing(null); }}
                  className="flex-1 rounded border border-brand-400/60 bg-slate-900 px-1.5 py-0.5 text-[11px] text-white outline-none"
                />
              ) : (
                <span
                  className={`flex-1 truncate text-[11px] font-semibold ${sel ? 'text-white' : 'text-slate-300'}`}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditing({ index: i, value: b?.name || '' }); }}
                  title="Double-click to rename"
                >
                  {labelOf(b, i)}
                </span>
              )}
              {!isEditing && (
                <div className="flex items-center gap-0.5 opacity-70 transition group-hover/row:opacity-100">
                  <IconBtn title="Rename" onClick={() => setEditing({ index: i, value: b?.name || '' })}>✎</IconBtn>
                  <IconBtn title={b?.hidden ? 'Show' : 'Hide'} onClick={() => onToggleField?.([i], 'hidden')}>{b?.hidden ? '🙈' : '👁'}</IconBtn>
                  <IconBtn title={b?.locked ? 'Unlock' : 'Lock'} onClick={() => onToggleField?.([i], 'locked')}>{b?.locked ? '🔒' : '🔓'}</IconBtn>
                  <IconBtn title="Duplicate" onClick={() => onDuplicate?.([i])}>⧉</IconBtn>
                  <IconBtn title="Delete" danger onClick={() => onDelete?.([i])}>🗑</IconBtn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
