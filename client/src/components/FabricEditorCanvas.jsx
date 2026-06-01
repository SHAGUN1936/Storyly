import { useEffect, useRef, useState } from 'react';
import { geometryToCommit, slotFor } from '../lib/fabricBlockSync';

/**
 * FabricEditorCanvas — a Fabric.js control layer for the Admin Builder.
 *
 * A transparent <canvas> overlaid on the live HTML preview. Every block on
 * the ACTIVE page gets an invisible-but-hit-testable Fabric proxy; Fabric
 * supplies selection / resize / rotate handles, multi-select, smart guides,
 * keyboard ops and an align/distribute toolbar. On gesture-end we convert
 * proxy geometry back into the SAME builderState fields the legacy editor
 * commits — data model + end-user render path untouched, fully reversible.
 *
 * Phases: 1) proxies + drag/resize/rotate/select/delete/duplicate.
 *         2) group transforms (matrix-decomposed) + inline text edit.
 *         3) edge/centre alignment + equal-spacing distribution.
 *         4) multiple simultaneous guides + persistent multi-select +
 *            align/distribute toolbar.
 *
 * Fabric is dynamically imported (loads only when the editor mounts).
 */
const TEXT_TYPES = new Set(['heading', 'subheading', 'text', 'paragraph']);
const SNAP_PX = 6;

export default function FabricEditorCanvas({
  previewRef, blocks, pageIndex, designW, designH, selectedIndex, enabled,
  onSelect, onMoveCommit, onResizeCommit, onRotateCommit, onDuplicate, onDelete, onReorder,
}) {
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const FabricRef = useRef(null);
  const proxiesRef = useRef([]);
  const syncingRef = useRef(false);
  const editingRef = useRef(false);
  const selIdxRef = useRef([]);            // current selected block indices
  const guidesRef = useRef({ vs: [], hs: [] });
  const spacingRef = useRef([]);
  const roRef = useRef(null);

  const [guides, setGuides] = useState({ vs: [], hs: [] });
  const [spacing, setSpacing] = useState([]);
  const [editing, setEditing] = useState(false);
  const [selCount, setSelCount] = useState(0);

  const cb = useRef({});
  cb.current = { onSelect, onMoveCommit, onResizeCommit, onRotateCommit, onDuplicate, onDelete, onReorder, designW, designH, pageIndex };

  const arrEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  const setGuidesIfChanged = (vs, hs) => {
    if (arrEq(guidesRef.current.vs, vs) && arrEq(guidesRef.current.hs, hs)) return;
    guidesRef.current = { vs, hs };
    setGuides({ vs, hs });
  };
  const setSpacingIfChanged = (arr) => {
    const a = arr || [];
    const prev = spacingRef.current;
    const same = prev.length === a.length && prev.every((p, i) => p.left === a[i].left && p.top === a[i].top && p.label === a[i].label);
    if (same) return;
    spacingRef.current = a;
    setSpacing(a);
  };
  const clearGuides = () => { setGuidesIfChanged([], []); setSpacingIfChanged([]); };

  /** Absolute geometry of a proxy (composes any parent ActiveSelection). */
  const absGeom = (o) => {
    const d = FabricRef.current.util.qrDecompose(o.calcTransformMatrix());
    const w = o.width * Math.abs(d.scaleX);
    const h = o.height * Math.abs(d.scaleY);
    return { cx: d.translateX, cy: d.translateY, w, h, left: d.translateX - w / 2, top: d.translateY - h / 2, right: d.translateX + w / 2, bottom: d.translateY + h / 2, angle: d.angle };
  };

  /* ── Boot Fabric once ─────────────────────────────────────────── */
  useEffect(() => {
    if (!enabled) return undefined;
    let disposed = false;
    let cleanupKeys = () => {};

    (async () => {
      let fabric;
      try { fabric = await import('fabric'); } catch { return; }
      if (disposed || !canvasElRef.current) return;
      FabricRef.current = fabric;
      const { Canvas } = fabric;

      const canvas = new Canvas(canvasElRef.current, {
        selection: true, preserveObjectStacking: true, renderOnAddRemove: false,
        backgroundColor: 'transparent', uniformScaling: false, stopContextMenu: true, fireRightClick: false,
      });
      fabricRef.current = canvas;

      const activeIndices = () => {
        const a = canvas.getActiveObject();
        if (!a) return [];
        const objs = a.type === 'activeselection' && a.getObjects ? a.getObjects() : [a];
        return objs.map((o) => o.blockIndex).filter((i) => i != null);
      };
      const emitSelect = () => {
        if (syncingRef.current) return;
        const idxs = activeIndices();
        selIdxRef.current = idxs;
        setSelCount(idxs.length);
        cb.current.onSelect?.(idxs.length ? idxs[0] : null);
      };
      canvas.on('selection:created', emitSelect);
      canvas.on('selection:updated', emitSelect);
      canvas.on('selection:cleared', () => {
        clearGuides();
        if (syncingRef.current) return;
        selIdxRef.current = [];
        setSelCount(0);
        cb.current.onSelect?.(null);
      });

      // ── Smart snapping: multi-line edge/centre alignment + equal-spacing ──
      canvas.on('object:moving', (e) => {
        const o = e.target;
        if (!o) return;
        const W = canvas.getWidth();
        const H = canvas.getHeight();
        if (o.type === 'activeselection') { clearGuides(); return; }

        const bb = o.getBoundingRect();
        const peers = proxiesRef.current.filter((p) => p && p !== o).map((p) => p.getBoundingRect());
        const linesX = [0, W / 2, W];
        const linesY = [0, H / 2, H];
        peers.forEach((r) => {
          linesX.push(r.left, r.left + r.width / 2, r.left + r.width);
          linesY.push(r.top, r.top + r.height / 2, r.top + r.height);
        });
        const mvX = { left: bb.left, center: bb.left + bb.width / 2, right: bb.left + bb.width };
        const mvY = { top: bb.top, center: bb.top + bb.height / 2, bottom: bb.top + bb.height };

        // best delta per axis (closest), plus ALL lines we're within range of
        const resolve = (edges, lines) => {
          let best = null;
          const hit = new Set();
          for (const key of Object.keys(edges)) {
            for (const g of lines) {
              const d = g - edges[key];
              if (Math.abs(d) < SNAP_PX) {
                hit.add(Math.round(g));
                if (best == null || Math.abs(d) < Math.abs(best.delta)) best = { guide: g, delta: d };
              }
            }
          }
          return { best, lines: [...hit] };
        };
        const rx = resolve(mvX, linesX);
        const ry = resolve(mvY, linesY);

        // equal-spacing distribution (conservative; yields to edge-align)
        const ROW_TOL = Math.max(8, bb.height * 0.4);
        const COL_TOL = Math.max(8, bb.width * 0.4);
        const badges = [];
        let spDX = null;
        let spDY = null;
        {
          const row = peers.filter((r) => Math.abs((r.top + r.height / 2) - mvY.center) < ROW_TOL);
          const L = row.filter((r) => r.left + r.width <= mvX.left).sort((a, b) => (b.left + b.width) - (a.left + a.width))[0];
          const R = row.filter((r) => r.left >= mvX.right).sort((a, b) => a.left - b.left)[0];
          if (L && R) {
            const target = (L.left + L.width + R.left) / 2;
            const d = target - mvX.center;
            if (Math.abs(d) < SNAP_PX * 2) {
              spDX = d;
              const gap = Math.round(((R.left - (L.left + L.width)) - bb.width) / 2);
              badges.push({ left: (L.left + L.width + (mvX.left + d)) / 2, top: mvY.center, label: `${gap}` });
              badges.push({ left: ((mvX.right + d) + R.left) / 2, top: mvY.center, label: `${gap}` });
            }
          }
        }
        {
          const col = peers.filter((r) => Math.abs((r.left + r.width / 2) - mvX.center) < COL_TOL);
          const A = col.filter((r) => r.top + r.height <= mvY.top).sort((a, b) => (b.top + b.height) - (a.top + a.height))[0];
          const B = col.filter((r) => r.top >= mvY.bottom).sort((a, b) => a.top - b.top)[0];
          if (A && B) {
            const target = (A.top + A.height + B.top) / 2;
            const d = target - mvY.center;
            if (Math.abs(d) < SNAP_PX * 2) {
              spDY = d;
              const gap = Math.round(((B.top - (A.top + A.height)) - bb.height) / 2);
              badges.push({ left: mvX.center, top: (A.top + A.height + (mvY.top + d)) / 2, label: `${gap}` });
              badges.push({ left: mvX.center, top: ((mvY.bottom + d) + B.top) / 2, label: `${gap}` });
            }
          }
        }

        // Snap ONLY to meaningful targets (edge/centre alignment, equal
        // spacing). No blanket grid snap — that nudged every drop to the
        // nearest grid line, so an element visibly shifted a little once the
        // handles were removed. Now it stays exactly where you place it.
        const c = o.getCenterPoint();
        const nx = rx.best ? c.x + rx.best.delta : (spDX != null ? c.x + spDX : c.x);
        const ny = ry.best ? c.y + ry.best.delta : (spDY != null ? c.y + spDY : c.y);
        if (nx !== c.x || ny !== c.y) o.setPositionByOrigin({ x: nx, y: ny }, 'center', 'center');

        setGuidesIfChanged(rx.best ? rx.lines : [], ry.best ? ry.lines : []);
        setSpacingIfChanged((spDX != null && !rx.best) || (spDY != null && !ry.best) ? badges : []);
      });

      canvas.on('mouse:up', () => clearGuides());

      canvas.on('object:modified', (e) => {
        if (syncingRef.current) return;
        clearGuides();
        const o = e.target;
        if (!o) return;
        const dims = { canvasW: canvas.getWidth(), canvasH: canvas.getHeight(), designW: cb.current.designW, designH: cb.current.designH };
        const action = e.action || 'drag';
        const targets = o.type === 'activeselection' && o.getObjects ? o.getObjects() : [o];
        targets.forEach((t) => {
          if (t.blockIndex == null) return;
          const d = fabric.util.qrDecompose(t.calcTransformMatrix());
          const v = geometryToCommit({ centerX: d.translateX, centerY: d.translateY, scaledW: t.width * Math.abs(d.scaleX), scaledH: t.height * Math.abs(d.scaleY), angle: d.angle }, dims);
          const slot = slotFor(cb.current.pageIndex, t.blockIndex);
          cb.current.onMoveCommit?.(slot, v.moveX, v.moveY, v.refW, v.refH);
          if (/scal/i.test(action)) cb.current.onResizeCommit?.(slot, v.designW, v.designH);
          if (/rotat/i.test(action)) cb.current.onRotateCommit?.(slot, v.deg);
        });
      });

      canvas.on('mouse:dblclick', (e) => {
        const o = e.target;
        if (!o || !o.editableText || o.blockIndex == null) return;
        const host = previewRef.current;
        if (!host) return;
        const slot = slotFor(cb.current.pageIndex, o.blockIndex);
        const blockEl = host.querySelector(`[data-block-slot="${slot}"]`);
        if (!blockEl) return;
        const target = blockEl.matches('[data-text-slot]') ? blockEl : blockEl.querySelector('[data-text-slot]') || blockEl;
        editingRef.current = true;
        setEditing(true);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        requestAnimationFrame(() => {
          try {
            target.focus?.();
            const r = document.createRange();
            r.selectNodeContents(target);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(r);
          } catch { /* ignore */ }
          const done = () => { target.removeEventListener('blur', done); editingRef.current = false; setEditing(false); };
          target.addEventListener('blur', done);
        });
      });

      const onKey = (ev) => {
        if (editingRef.current) return;
        const a = canvas.getActiveObject();
        if (!a) return;
        const t = ev.target;
        if (t && t.matches && t.matches('input, textarea, select, [contenteditable], [contenteditable="true"]')) return;
        const objs = a.type === 'activeselection' && a.getObjects ? a.getObjects() : [a];
        if (ev.key === 'Delete' || ev.key === 'Backspace') {
          ev.preventDefault();
          objs.map((o) => o.blockIndex).filter((i) => i != null).sort((x, y) => y - x).forEach((i) => cb.current.onDelete?.(i));
        } else if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'd' || ev.key === 'D')) {
          ev.preventDefault();
          if (a.blockIndex != null) cb.current.onDuplicate?.(a.blockIndex);
        } else if (ev.key.startsWith('Arrow')) {
          ev.preventDefault();
          const step = ev.shiftKey ? 10 : 1;
          const dx = ev.key === 'ArrowLeft' ? -step : ev.key === 'ArrowRight' ? step : 0;
          const dy = ev.key === 'ArrowUp' ? -step : ev.key === 'ArrowDown' ? step : 0;
          objs.forEach((o) => {
            if (o.blockIndex == null) return;
            const c = o.getCenterPoint();
            const x = c.x + dx;
            const y = c.y + dy;
            o.setPositionByOrigin({ x, y }, 'center', 'center');
            o.setCoords();
            cb.current.onMoveCommit?.(slotFor(cb.current.pageIndex, o.blockIndex), x, y, canvas.getWidth(), canvas.getHeight());
          });
          canvas.requestRenderAll();
        }
      };
      document.addEventListener('keydown', onKey);
      cleanupKeys = () => document.removeEventListener('keydown', onKey);

      const ro = new ResizeObserver(() => resizeAndSync());
      if (previewRef.current) ro.observe(previewRef.current);
      roRef.current = ro;
      resizeAndSync();
    })();

    return () => {
      disposed = true;
      cleanupKeys();
      roRef.current?.disconnect();
      roRef.current = null;
      try { fabricRef.current?.dispose(); } catch { /* ignore */ }
      fabricRef.current = null;
      proxiesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  /* ── Re-sync on block / page / selection / size change ── */
  useEffect(() => {
    if (!enabled) return undefined;
    // Reconcile the internal multi-selection with the controlled prop:
    // a genuinely new external selection resets to single; if the prop is
    // already part of the current multi, keep the multi intact.
    if (selectedIndex == null) selIdxRef.current = [];
    else if (!selIdxRef.current.includes(selectedIndex)) selIdxRef.current = [selectedIndex];
    const raf = requestAnimationFrame(() => resizeAndSync());
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, blocks, pageIndex, selectedIndex, designW, designH]);

  function resizeAndSync() {
    const canvas = fabricRef.current;
    const fabric = FabricRef.current;
    const host = previewRef.current;
    if (!canvas || !fabric || !host) return;
    if (editingRef.current) return;
    const hostRect = host.getBoundingClientRect();
    const W = Math.round(hostRect.width);
    const H = Math.round(hostRect.height);
    if (W < 2 || H < 2) return;
    if (canvas.getWidth() !== W || canvas.getHeight() !== H) canvas.setDimensions({ width: W, height: H });

    syncingRef.current = true;
    const { Rect, ActiveSelection } = fabric;
    const scale = designW > 0 ? W / designW : 1;
    const canvasRect = canvas.upperCanvasEl.getBoundingClientRect();
    const next = [];

    canvas.discardActiveObject();
    (blocks || []).forEach((block, i) => {
      if (block?.hidden) return;
      const slot = slotFor(pageIndex, i);
      const el = host.querySelector(`[data-block-slot="${slot}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const centerX = r.left + r.width / 2 - canvasRect.left;
      const centerY = r.top + r.height / 2 - canvasRect.top;
      const w = Math.max(8, (el.offsetWidth || r.width) * scale);
      const h = Math.max(8, (el.offsetHeight || r.height) * scale);
      const angle = Number(block.rotateDeg) || 0;

      let obj = proxiesRef.current[i];
      if (!obj) {
        obj = new Rect({
          originX: 'center', originY: 'center',
          fill: 'rgba(139,92,246,0.001)', stroke: 'transparent', strokeWidth: 0,
          hasBorders: true, hasControls: true,
          borderColor: '#8B5CF6', cornerColor: '#8B5CF6', cornerStrokeColor: '#FFFFFF',
          cornerSize: 12, cornerStyle: 'circle', transparentCorners: false,
          borderScaleFactor: 2, lockScalingFlip: true, objectCaching: false, padding: 2,
        });
        canvas.add(obj);
      }
      obj.set({ width: w, height: h, scaleX: 1, scaleY: 1, angle, left: centerX, top: centerY });
      obj.blockIndex = i;
      obj.slot = slot;
      obj.editableText = TEXT_TYPES.has(block.type);
      obj.setCoords();
      next[i] = obj;
    });

    proxiesRef.current.forEach((obj, i) => {
      if (obj && next[i] !== obj) { try { canvas.remove(obj); } catch { /* ignore */ } }
    });
    proxiesRef.current = next;

    // Re-establish the selection (single or persistent multi).
    const sel = selIdxRef.current.map((i) => next[i]).filter(Boolean);
    if (sel.length > 1) {
      const as = new ActiveSelection(sel, { canvas });
      canvas.setActiveObject(as);
      setSelCount(sel.length);
    } else if (sel.length === 1) {
      canvas.setActiveObject(sel[0]);
      setSelCount(1);
    } else {
      setSelCount(0);
    }
    canvas.requestRenderAll();
    requestAnimationFrame(() => { syncingRef.current = false; });
  }

  /** Align / distribute the current multi-selection, then commit positions. */
  function applyAlign(mode) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const idxs = selIdxRef.current.filter((i) => proxiesRef.current[i]);
    if (idxs.length < 2) return;
    const items = idxs.map((i) => ({ o: proxiesRef.current[i], g: absGeom(proxiesRef.current[i]) }));
    const W = canvas.getWidth();
    const H = canvas.getHeight();
    const minL = Math.min(...items.map((it) => it.g.left));
    const maxR = Math.max(...items.map((it) => it.g.right));
    const minT = Math.min(...items.map((it) => it.g.top));
    const maxB = Math.max(...items.map((it) => it.g.bottom));
    const midX = (minL + maxR) / 2;
    const midY = (minT + maxB) / 2;

    const commit = (it, cx, cy) => cb.current.onMoveCommit?.(it.o.slot, cx, cy, W, H);

    if (mode === 'left') items.forEach((it) => commit(it, minL + it.g.w / 2, it.g.cy));
    else if (mode === 'centerH') items.forEach((it) => commit(it, midX, it.g.cy));
    else if (mode === 'right') items.forEach((it) => commit(it, maxR - it.g.w / 2, it.g.cy));
    else if (mode === 'top') items.forEach((it) => commit(it, it.g.cx, minT + it.g.h / 2));
    else if (mode === 'middleV') items.forEach((it) => commit(it, it.g.cx, midY));
    else if (mode === 'bottom') items.forEach((it) => commit(it, it.g.cx, maxB - it.g.h / 2));
    else if (mode === 'distH' && items.length >= 3) {
      const sorted = [...items].sort((a, b) => a.g.cx - b.g.cx);
      const totalW = sorted.reduce((s, it) => s + it.g.w, 0);
      const gap = (maxR - minL - totalW) / (sorted.length - 1);
      let cursor = minL;
      sorted.forEach((it) => { commit(it, cursor + it.g.w / 2, it.g.cy); cursor += it.g.w + gap; });
    } else if (mode === 'distV' && items.length >= 3) {
      const sorted = [...items].sort((a, b) => a.g.cy - b.g.cy);
      const totalH = sorted.reduce((s, it) => s + it.g.h, 0);
      const gap = (maxB - minT - totalH) / (sorted.length - 1);
      let cursor = minT;
      sorted.forEach((it) => { commit(it, it.g.cx, cursor + it.g.h / 2); cursor += it.g.h + gap; });
    }
    // builderState commits → re-sync re-selects from the unchanged selIdxRef.
  }

  if (!enabled) return null;
  const Btn = ({ onClick, label, title }) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="px-2 py-1 rounded-md text-[12px] font-bold text-slate-100 bg-white/10 hover:bg-brand-500 hover:text-white transition">
      {label}
    </button>
  );
  const z = (dir) => () => { if (selIdxRef.current.length === 1) cb.current.onReorder?.(selIdxRef.current[0], dir); };
  return (
    // `touchAction: none` lets finger drags drive Fabric (move/resize/rotate)
    // instead of scrolling the page — the key to touch editing on mobile.
    <div className="absolute inset-0 z-20" style={{ pointerEvents: editing ? 'none' : 'auto', touchAction: 'none' }} aria-hidden>
      <canvas ref={canvasElRef} />
      {guides.vs.map((x) => (
        <div key={`v${x}`} className="pointer-events-none absolute top-0 bottom-0" style={{ left: x, width: 1, background: '#8B5CF6', boxShadow: '0 0 4px rgba(139,92,246,0.8)' }} />
      ))}
      {guides.hs.map((y) => (
        <div key={`h${y}`} className="pointer-events-none absolute left-0 right-0" style={{ top: y, height: 1, background: '#8B5CF6', boxShadow: '0 0 4px rgba(139,92,246,0.8)' }} />
      ))}
      {spacing.map((b, i) => (
        <div key={i} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded px-1 text-[10px] font-bold leading-tight"
          style={{ left: b.left, top: b.top, background: '#F43F5E', color: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
          {b.label}
        </div>
      ))}
      {/* Toolbar pinned to the BOTTOM so it never covers the element's
          contextual options bar (which floats at the top). Single selection →
          z-order; multi → align + distribute. */}
      {selCount >= 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex flex-wrap items-center justify-center gap-1 rounded-xl bg-slate-900/90 backdrop-blur px-2 py-1.5 shadow-2xl border border-white/10" style={{ pointerEvents: 'auto', maxWidth: '95%' }}>
          {selCount === 1 && onReorder && (
            <>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1 hidden sm:inline">Layer</span>
              <Btn onClick={z('backmost')} label="⤓⤓" title="Send to back" />
              <Btn onClick={z('back')} label="↧" title="Send backward" />
              <Btn onClick={z('forward')} label="↥" title="Bring forward" />
              <Btn onClick={z('front')} label="⤒⤒" title="Bring to front" />
            </>
          )}
          {selCount >= 2 && (
            <>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 px-1 hidden sm:inline">Align</span>
              <Btn onClick={() => applyAlign('left')} label="⇤" title="Align left" />
              <Btn onClick={() => applyAlign('centerH')} label="↔" title="Align centre (horizontal)" />
              <Btn onClick={() => applyAlign('right')} label="⇥" title="Align right" />
              <span className="w-px h-4 bg-white/15 mx-0.5" />
              <Btn onClick={() => applyAlign('top')} label="⤒" title="Align top" />
              <Btn onClick={() => applyAlign('middleV')} label="↕" title="Align middle (vertical)" />
              <Btn onClick={() => applyAlign('bottom')} label="⤓" title="Align bottom" />
              {selCount >= 3 && <span className="w-px h-4 bg-white/15 mx-0.5" />}
              {selCount >= 3 && <Btn onClick={() => applyAlign('distH')} label="⇿" title="Distribute horizontally" />}
              {selCount >= 3 && <Btn onClick={() => applyAlign('distV')} label="⇳" title="Distribute vertically" />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
