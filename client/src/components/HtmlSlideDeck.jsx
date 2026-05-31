import { useMemo, useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { applySlotFillsToHtml, countSlidesInHtml } from '../lib/htmlTemplate';
import { useDodgeButtons } from '../hooks/useDodgeButtons';
import { useResponsiveBreakpoint } from '../hooks/useResponsiveBreakpoint';

/**
 * Carousel: .slide / [data-page] — optional timer.
 * Page app: multiple .page — navigation via [data-nav-page="N"] (1-based) + overlay.
 *
 * Selection chrome (editable mode):
 *  - selectedSlot     : controlled `p{X}_b{Y}` of the highlighted block
 *  - onSelectionChange: fires on canvas click; receives slot or null
 *  - onResizeCommit   : (slot, width, height) on resize end
 *  - onRotateCommit   : (slot, deg) on rotate end
 *  - canSelect(slot)  : optional predicate; return false to ignore selection for that block
 */
/* While an element is being moved/resized/rotated live, kill its CSS
   transition AND loop animation (both animate transform) so they don't fight
   the inline styles we set every frame — that's what made the gestures feel
   jumpy. will-change promotes it to its own compositor layer for smoothness.
   On commit the markup regenerates and these inline styles vanish, so the
   animation resumes automatically. */
function freezeEl(el) {
  if (!el) return;
  el.style.setProperty('transition', 'none', 'important');
  el.style.setProperty('animation', 'none', 'important');
  el.style.willChange = 'left, top, transform, width, height';
}
function unfreezeEl(el) {
  if (!el) return;
  el.style.removeProperty('transition');
  el.style.removeProperty('animation');
  el.style.willChange = '';
}

export default function HtmlSlideDeck({
  html,
  fills,
  structure,
  className = '',
  editable = false,
  onTextSlotCommit,
  dragMode = false,
  onBlockMoveCommit,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange,
  selectedSlot,
  onSelectionChange,
  onResizeCommit,
  onRotateCommit,
  canSelect,
  /* When `embedded` is true the deck renders with no internal scroll
     viewport — the outer container becomes the sole scroll surface,
     fixing the "two scrollbars" UX in preview + wizard contexts. */
  embedded = false,
  /* Responsive engine: forced device breakpoint (editor preview) or null
     for automatic width-based selection on published pages. */
  previewBreakpoint = null,
}) {
  const markup = useMemo(() => applySlotFillsToHtml(html, fills), [html, fills]);
  const containerRef = useRef(null);
  // Activate the responsive artboard/overrides for the right device.
  useResponsiveBreakpoint(containerRef, markup, previewBreakpoint);
  const countedSlides = useMemo(() => countSlidesInHtml(html), [html]);
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(() => countedSlides);
  const [pageMode, setPageMode] = useState(false);
  /* `dragging` flips on while the admin is moving a block. The
     alignment grid overlay below renders only during a drag, so the
     idle canvas stays clean. Always works regardless of the active
     viewport (mobile / desktop) — the overlay is sized to the deck
     root which IS the viewport canvas. */
  const [dragging, setDragging] = useState(false);
  const [autoPlay, setAutoPlay] = useState(structure?.deck?.autoPlay !== false);
  /** Multi-page stories: advance after data-page-duration-ms on each .page (builder). */
  const [pageTimerEnabled, setPageTimerEnabled] = useState(structure?.deck?.pageTimerEnabled !== false);

  const autoMs = structure?.deck?.autoPlayMs ?? 3000;
  const activeIndex = Number.isInteger(controlledActiveIndex) ? controlledActiveIndex : internalActiveIndex;
  const setActiveIndex = (next) => {
    const resolved = typeof next === 'function' ? next(activeIndex) : next;
    const safe = Math.max(0, Math.min(resolved, Math.max(0, slideCount - 1)));
    if (onActiveIndexChange) onActiveIndexChange(safe);
    if (!Number.isInteger(controlledActiveIndex)) setInternalActiveIndex(safe);
  };
  const maxIdx = Math.max(0, slideCount - 1);

  useEffect(() => {
    setSlideCount(countedSlides);
    setActiveIndex((i) => Math.min(i, Math.max(0, countedSlides - 1)));
  }, [html, countedSlides]);

  useDodgeButtons(containerRef, [markup]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    root.querySelectorAll('.page').forEach((page, i) => {
      const active = i === activeIndex;
      page.querySelectorAll('.tpl-btn-dodge').forEach((btn) => {
        if (!active) {
          btn.style.transform = '';
          delete btn.dataset.dodgeX;
          delete btn.dataset.dodgeY;
        }
      });
    });
  }, [activeIndex, markup]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const pageEls = root.querySelectorAll('.page');
    const slideEls = root.querySelectorAll('.slide');
    const legacy = root.querySelectorAll('.slide, [data-page]');
    const usePages = pageEls.length > 1;
    setPageMode(usePages);
    const els = usePages ? pageEls : slideEls.length ? slideEls : legacy;
    const n = els.length || 1;
    setSlideCount(n);
    els.forEach((el, i) => {
      el.classList.toggle('active', i === activeIndex);
    });
  }, [activeIndex, markup]);

  useEffect(() => {
    if (!autoPlay || slideCount <= 1 || pageMode) return;
    const t = setInterval(() => {
      setActiveIndex((i) => {
        if (i >= maxIdx) return i;
        return i + 1;
      });
    }, autoMs);
    return () => clearInterval(t);
  }, [autoPlay, autoMs, slideCount, maxIdx, pageMode]);

  useEffect(() => {
    if (!pageMode || !pageTimerEnabled || slideCount <= 1) return;
    const root = containerRef.current;
    if (!root) return;
    const pageEls = root.querySelectorAll('.page');
    const el = pageEls[activeIndex];
    const raw = el?.getAttribute?.('data-page-duration-ms');
    const ms = raw ? parseInt(raw, 10) : 0;
    if (!Number.isFinite(ms) || ms < 500) return;
    const t = setTimeout(() => {
      setActiveIndex((i) => {
        if (i >= maxIdx) return 0;
        return i + 1;
      });
    }, ms);
    return () => clearTimeout(t);
  }, [activeIndex, markup, pageMode, pageTimerEnabled, slideCount, maxIdx]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const pageEls = root.querySelectorAll('.page');
    const scope = pageMode ? pageEls[activeIndex] : root;
    if (!scope) return;
    const wraps = scope.querySelectorAll('.tpl-g-single-wrap');
    if (!wraps.length) return;
    const cleanups = [];
    wraps.forEach((wrap) => {
      const items = [...wrap.querySelectorAll('.tpl-g-single')];
      if (!items.length) return;
      const cssMs = parseInt(String(wrap.style.getPropertyValue('--tpl-g-photo-ms') || '').replace('ms', ''), 10);
      const ms = Number.isFinite(cssMs) && cssMs > 0 ? cssMs : 1200;
      let idx = 0;
      const show = (i) => {
        items.forEach((el, j) => {
          el.style.opacity = j === i ? '1' : '0';
        });
      };
      show(0);
      const t = setInterval(() => {
        idx = (idx + 1) % items.length;
        show(idx);
      }, ms);
      cleanups.push(() => clearInterval(t));
    });
    return () => cleanups.forEach((fn) => fn());
  }, [activeIndex, markup, pageMode]);

  useEffect(() => {
    if (!pageMode) return;
    const root = containerRef.current;
    if (!root) return;
    const pageEls = root.querySelectorAll('.page');
    const page = pageEls[activeIndex];
    if (!page) return;
    const gatedButtons = page.querySelectorAll('[data-show-after-gallery]');
    if (!gatedButtons.length) return;
    const galleryEls = page.querySelectorAll('[data-gallery-total-ms]');
    let maxMs = 0;
    galleryEls.forEach((g) => {
      const ms = parseInt(g.getAttribute('data-gallery-total-ms') || '0', 10);
      if (Number.isFinite(ms) && ms > maxMs) maxMs = ms;
    });
    gatedButtons.forEach((b) => {
      b.style.opacity = '0';
      b.style.pointerEvents = 'none';
    });
    const t = setTimeout(() => {
      gatedButtons.forEach((b) => {
        b.style.opacity = '';
        b.style.pointerEvents = '';
      });
    }, maxMs || 0);
    return () => clearTimeout(t);
  }, [activeIndex, markup, pageMode]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onClick = (e) => {
      /* In drag mode the canvas is for editing — a click on a navigation
         button must select/edit it, NOT navigate the page. Let the selection
         handler take the click instead. */
      if (editable && dragMode) return;
      // Tap-to-play video card → open the clip fullscreen with sound.
      const vf = e.target.closest('[data-video-fullscreen]');
      if (vf) {
        e.preventDefault();
        const v = vf.querySelector('video');
        if (v) {
          const req = v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen || v.msRequestFullscreen;
          try { req && req.call(v); } catch { /* fullscreen may be blocked */ }
          v.muted = false;
          v.controls = true;
          v.play().catch(() => {});
        }
        return;
      }
      const nav = e.target.closest('[data-nav-page]');
      if (nav) {
        e.preventDefault();
        const p = parseInt(nav.getAttribute('data-nav-page'), 10);
        if (Number.isFinite(p) && p >= 1) {
          setActiveIndex(Math.min(p - 1, maxIdx));
        }
        return;
      }
      const btn = e.target.closest('[data-deck-action]');
      if (!btn) return;
      e.preventDefault();
      const a = btn.getAttribute('data-deck-action');
      if (a === 'next') setActiveIndex((i) => Math.min(i + 1, maxIdx));
      else if (a === 'prev') setActiveIndex((i) => Math.max(i - 1, 0));
      else if (a === 'restart' || a === 'reset') setActiveIndex(0);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [markup, maxIdx, editable, dragMode]);

  useEffect(() => {
    if (!editable) return;
    const root = containerRef.current;
    if (!root) return;
    const textEls = root.querySelectorAll('[data-text-slot]');
    const cleanups = [];
    textEls.forEach((el) => {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.style.cursor = 'text';
      const onBlur = () => {
        const slot = el.getAttribute('data-text-slot');
        const text = el.innerText ?? '';
        if (slot && onTextSlotCommit) onTextSlotCommit(slot, text);
      };
      el.addEventListener('blur', onBlur);
      cleanups.push(() => {
        el.removeEventListener('blur', onBlur);
        el.removeAttribute('contenteditable');
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [editable, markup, onTextSlotCommit]);

  useEffect(() => {
    if (!editable || !dragMode) return;
    const root = containerRef.current;
    if (!root) return;
    let moving = null;
    const DRAG_THRESHOLD = 4; // screen px the pointer must travel before it's a drag
    const onDown = (e) => {
      const el = e.target.closest('[data-block-slot]');
      if (!el) return;
      /* Measure against the element's actual OFFSET PARENT — the same box the
         CSS uses to resolve `top/left` percentages (the `.page-inner`). The
         canvas is rendered with `transform: scale(s)`, so getBoundingClientRect
         reports SCALED screen px while offsetWidth/Height are UNSCALED design
         px; we recover `s` and express drag coordinates in unscaled px. Using
         the offset parent (not the fixed artboard layer) means the % we commit
         maps back to the EXACT pixel on release, even when the page content is
         taller than the artboard. */
      const stage = el.offsetParent || root.querySelector('.tpl-viewport-design') || root;
      const stageRect = stage.getBoundingClientRect();
      const designW = stage.offsetWidth || stageRect.width || 1;
      const designH = stage.offsetHeight || stageRect.height || 1;
      const scale = stageRect.width > 0 ? stageRect.width / designW : 1;
      const r = el.getBoundingClientRect();
      /* A running loop motion (Float/Bounce/Drift…) offsets the element via the
         CSS `translate` property, which getBoundingClientRect includes. Subtract
         it so we anchor to the block's BASE centre — otherwise the commit lands
         off by the current bob and the block appears to jump up/down. (`translate`
         is in unscaled design px; scale/rotate don't move the centre.) */
      let tx = 0, ty = 0;
      try {
        const ct = window.getComputedStyle(el).translate;
        if (ct && ct !== 'none') {
          const p = ct.split(/\s+/).map(parseFloat);
          if (Number.isFinite(p[0])) tx = p[0];
          if (Number.isFinite(p[1])) ty = p[1];
        }
      } catch { /* ignore */ }
      // Current rendered CENTRE of the block, in unscaled design px (base, sans motion).
      const centerX = (r.left + r.width / 2 - stageRect.left) / scale - tx;
      const centerY = (r.top + r.height / 2 - stageRect.top) / scale - ty;
      /* Capture only — do NOT move or re-anchor the element yet. A plain
         click (mousedown→mouseup with no travel) must leave the block
         exactly where it is; we promote to an actual drag in onMove only
         once the pointer crosses DRAG_THRESHOLD. */
      moving = {
        el,
        slot: el.getAttribute('data-block-slot'),
        startClientX: e.clientX,
        startClientY: e.clientY,
        centerX,
        centerY,
        stageRect,
        scale,
        designW,
        designH,
        started: false,
      };
    };
    /* Re-anchor the element to its current centre with translate(-50%,-50%)
       so left/top now mean "centre" — called the instant a real drag begins
       so the block doesn't jump on grab. Existing rotation is preserved. */
    const beginDrag = (e) => {
      const { el, centerX, centerY } = moving;
      const deg = (/rotate\(([-\d.]+)deg\)/.exec(el.style.transform || '') || [])[1];
      freezeEl(el);
      el.style.position = 'absolute';
      el.style.display = 'inline-block';
      el.style.transformOrigin = 'center';
      el.style.setProperty('left', `${Math.round(centerX)}px`, 'important');
      el.style.setProperty('top', `${Math.round(centerY)}px`, 'important');
      el.style.setProperty('transform', `translate(-50%,-50%)${deg ? ` rotate(${deg}deg)` : ''}`, 'important');
      /* Re-measure the offset parent AFTER the block goes absolute: leaving
         the flow can change the container's height, and we want the commit %
         to use the post-drop height (which is what the re-render will use). */
      const sp = el.offsetParent;
      if (sp) {
        const spRect = sp.getBoundingClientRect();
        moving.stageRect = spRect;
        moving.designW = sp.offsetWidth || spRect.width || moving.designW;
        moving.designH = sp.offsetHeight || spRect.height || moving.designH;
        moving.scale = spRect.width > 0 ? spRect.width / moving.designW : moving.scale;
      }
      // Measure AFTER re-anchoring so the snap math uses the true box size.
      moving.elW = el.offsetWidth || 0;
      moving.elH = el.offsetHeight || 0;
      // Pointer-to-centre offset (design px), seeded from the grab point so
      // the block tracks the cursor with no initial jump.
      moving.offsetX = (moving.startClientX - moving.stageRect.left) / moving.scale - centerX;
      moving.offsetY = (moving.startClientY - moving.stageRect.top) / moving.scale - centerY;
      moving.started = true;
      setDragging(true);
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!moving) return;
      // Not a drag until the pointer actually travels past the threshold.
      if (!moving.started) {
        const travel = Math.abs(e.clientX - moving.startClientX) + Math.abs(e.clientY - moving.startClientY);
        if (travel < DRAG_THRESHOLD) return;
        beginDrag(e);
      }
      const { scale, stageRect, elW, elH } = moving;
      // Desired centre of the block, in design px — follows the cursor 1:1
      // (no grid snapping) for smooth, free movement.
      let cx = (e.clientX - stageRect.left) / scale - moving.offsetX;
      let cy = (e.clientY - stageRect.top) / scale - moving.offsetY;
      const W = moving.designW;
      const H = moving.designH;
      /* Clamp the CENTRE so the whole element stays inside the canvas — you
         can't drag a block off the page. (If a block is bigger than the
         canvas on an axis, just centre it there.) */
      const halfW = elW / 2;
      const halfH = elH / 2;
      cx = elW >= W ? W / 2 : Math.max(halfW, Math.min(W - halfW, cx));
      cy = elH >= H ? H / 2 : Math.max(halfH, Math.min(H - halfH, cy));
      // left/top now mean "centre" thanks to translate(-50%,-50%).
      moving.el.style.setProperty('left', `${Math.round(cx)}px`, 'important');
      moving.el.style.setProperty('top', `${Math.round(cy)}px`, 'important');
    };
    const onUp = () => {
      if (!moving) return;
      // Only commit when an actual drag happened — a plain click leaves the
      // block untouched (so clicking to select never nudges its position).
      if (moving.started) {
        // left/top hold the block's CENTRE in design px (see beginDrag).
        const x = parseInt(moving.el.style.left || '0', 10);
        const y = parseInt(moving.el.style.top || '0', 10);
        /* Pass the centre px AND the container dimensions it was measured
           against, so a %-based consumer (the admin editor) converts using
           the exact same box the renderer uses → the block stays put. Px-only
           consumers (user overlays) just use x/y. */
        if (moving.slot && onBlockMoveCommit) {
          onBlockMoveCommit(moving.slot, x, y, moving.designW, moving.designH);
        }
      }
      moving = null;
      setDragging(false);
    };
    root.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      root.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [editable, dragMode, markup, onBlockMoveCommit]);

  /** Countdown blocks: tick every second, update [data-cd-d|h|m|s] spans. */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const els = root.querySelectorAll('[data-countdown-target]');
    if (!els.length) return;
    const tick = () => {
      const now = Date.now();
      els.forEach((el) => {
        const target = el.getAttribute('data-countdown-target');
        if (!target) return;
        const t = Date.parse(target);
        if (!Number.isFinite(t)) return;
        const ms = Math.max(0, t - now);
        const totalSec = Math.floor(ms / 1000);
        const d = Math.floor(totalSec / 86400);
        const h = Math.floor((totalSec % 86400) / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        const pad = (n) => String(n).padStart(2, '0');
        const setText = (sel, val) => {
          const n = el.querySelector(sel);
          if (n) n.textContent = val;
        };
        setText('[data-cd-d]', String(d));
        setText('[data-cd-h]', pad(h));
        setText('[data-cd-m]', pad(m));
        setText('[data-cd-s]', pad(s));
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [markup]);

  /** ── Canvas selection chrome (editable) ──────────────────── */
  const [selBox, setSelBox] = useState(null); // { x, y, w, h, el, slot }
  const [transient, setTransient] = useState(null); // 'rotate' | 'resize-se' | 'resize-w' | 'resize-h'
  const [transientLabel, setTransientLabel] = useState('');

  const computeSelBox = useCallback(() => {
    if (!editable || !selectedSlot) { setSelBox(null); return; }
    const root = containerRef.current;
    if (!root) return;
    let el = null;
    try { el = root.querySelector(`[data-block-slot="${(window.CSS && CSS.escape) ? CSS.escape(selectedSlot) : selectedSlot}"]`); }
    catch { el = null; }
    if (!el) { setSelBox(null); return; }
    // Freeze the motion BEFORE measuring so the selection frame (and the
    // resize/rotate math built on it) tracks the block's still, base position.
    freezeEl(el);
    const rr = root.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setSelBox({
      x: r.left - rr.left + root.scrollLeft,
      y: r.top - rr.top + root.scrollTop,
      w: r.width,
      h: r.height,
      el,
      slot: selectedSlot,
    });
  }, [editable, selectedSlot]);

  useLayoutEffect(() => { computeSelBox(); }, [computeSelBox, markup, activeIndex]);

  /** Recompute on container resize (e.g. drawer open / window resize). */
  useEffect(() => {
    if (!editable || !selectedSlot) return;
    const root = containerRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => computeSelBox());
    ro.observe(root);
    if (selBox?.el) ro.observe(selBox.el);
    return () => ro.disconnect();
  }, [editable, selectedSlot, computeSelBox, selBox?.el]);

  /* Freeze the SELECTED element's loop motion while it's being edited — a
     bobbing/spinning element makes drag, resize and rotate land off (every
     measurement includes the live animation offset). It holds still while
     selected and resumes its motion the moment you deselect. */
  useEffect(() => {
    if (!editable || !selectedSlot) return;
    const root = containerRef.current;
    if (!root) return;
    let el = null;
    try { el = root.querySelector(`[data-block-slot="${(window.CSS && CSS.escape) ? CSS.escape(selectedSlot) : selectedSlot}"]`); }
    catch { el = null; }
    if (!el) return;
    freezeEl(el);
    return () => unfreezeEl(el);
  }, [editable, selectedSlot, markup]);

  /** Click selection: clicking a block selects; clicking empty space deselects. */
  useEffect(() => {
    if (!editable || !onSelectionChange) return;
    const root = containerRef.current;
    if (!root) return;
    const onClick = (e) => {
      // Clicks on our React-rendered handles should not propagate to here, but be defensive
      if (e.target.closest('.tpl-sel-handle')) return;
      const el = e.target.closest('[data-block-slot]');
      if (!el) {
        if (selectedSlot) onSelectionChange(null);
        return;
      }
      const slot = el.getAttribute('data-block-slot');
      if (canSelect && !canSelect(slot)) return;
      if (slot && slot !== selectedSlot) onSelectionChange(slot);
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [editable, onSelectionChange, selectedSlot, markup, canSelect]);

  /** Resize logic (bottom-right corner, side, bottom handles). */
  const startResize = useCallback((corner) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    const cur = selBox;
    if (!cur?.el || !selectedSlot) return;
    /* Same scale correction as drag: the element's width/height styles
       are in unscaled design px, but pointer deltas arrive in screen px.
       Recover the scale from the design layer and divide deltas by it so
       the element grows in step with the cursor. `offsetWidth/Height`
       give the unscaled (layout) dimensions to start from. */
    const stage = containerRef.current?.querySelector('.tpl-viewport-design');
    const stageRect = stage?.getBoundingClientRect();
    const scale = stage && stage.offsetWidth > 0 && stageRect ? stageRect.width / stage.offsetWidth : 1;
    const startX = e.clientX;
    const startY = e.clientY;
    freezeEl(cur.el); // smooth resize — no transition/animation fighting the live size
    const startW = cur.el.offsetWidth;
    const startH = cur.el.offsetHeight;
    setTransient(corner);
    const move = (ev) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      let nextW = startW;
      let nextH = startH;
      if (corner === 'resize-se') { nextW = Math.max(20, startW + dx); nextH = Math.max(20, startH + dy); }
      if (corner === 'resize-w')  { nextW = Math.max(20, startW + dx); }
      if (corner === 'resize-h')  { nextH = Math.max(20, startH + dy); }
      // Live update on the live DOM element so it feels instant (design px).
      // !important so it beats any per-device override rule during resize.
      try {
        cur.el.style.setProperty('width', `${Math.round(nextW)}px`, 'important');
        if (corner !== 'resize-w') cur.el.style.setProperty('height', `${Math.round(nextH)}px`, 'important');
      } catch {}
      /* Re-read the element's box so the overlay tracks it exactly —
         center-anchored blocks grow from their centre, so the frame's
         left/top shift too, not just its size. getBoundingClientRect
         forces a sync reflow, so this reflects the width we just set. */
      const rootEl = containerRef.current;
      const rr = rootEl?.getBoundingClientRect();
      const br = cur.el.getBoundingClientRect();
      setSelBox((prev) => {
        if (!prev) return prev;
        if (!rr) return { ...prev, w: nextW * scale, h: nextH * scale };
        return {
          ...prev,
          x: br.left - rr.left + rootEl.scrollLeft,
          y: br.top - rr.top + rootEl.scrollTop,
          w: br.width,
          h: br.height,
        };
      });
      setTransientLabel(`${Math.round(nextW)} × ${Math.round(nextH)}`);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setTransient(null);
      setTransientLabel('');
      unfreezeEl(cur.el);
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;
      const nextW = corner === 'resize-h' ? startW : Math.max(20, Math.round(startW + dx));
      const nextH = corner === 'resize-w' ? startH : Math.max(20, Math.round(startH + dy));
      if (onResizeCommit) onResizeCommit(selectedSlot, nextW, nextH);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [selBox, selectedSlot, onResizeCommit]);

  /** Rotate logic. Pulls initial rotation from inline transform if present. */
  const startRotate = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const cur = selBox;
    if (!cur?.el || !selectedSlot) return;
    const r = cur.el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const m = /rotate\(([-\d.]+)deg\)/.exec(cur.el.style.transform || '');
    const initialDeg = m ? Number(m[1]) : 0;
    const startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    freezeEl(cur.el); // smooth rotate — stop the loop animation fighting the live transform
    setTransient('rotate');
    const move = (ev) => {
      const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI;
      let deg = Math.round(initialDeg + (angle - startAngle));
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      deg = Math.max(-180, Math.min(180, deg));
      try {
        const existing = (cur.el.style.transform || '').replace(/rotate\([^)]*\)/, '').trim();
        cur.el.style.transform = `${existing} rotate(${deg}deg)`.trim();
        cur.el.style.transformOrigin = 'center';
      } catch {}
      setTransientLabel(`${deg > 0 ? '+' : ''}${deg}°`);
    };
    const up = (ev) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setTransient(null);
      setTransientLabel('');
      unfreezeEl(cur.el);
      const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI;
      let deg = Math.round(initialDeg + (angle - startAngle));
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      deg = Math.max(-180, Math.min(180, deg));
      if (onRotateCommit) onRotateCommit(selectedSlot, deg);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [selBox, selectedSlot, onRotateCommit]);

  if (!html || !String(html).trim()) {
    return (
      <div className={`rounded-xl bg-white/5 p-6 text-center text-zinc-500 text-sm ${className}`}>
        No HTML content in this website.
      </div>
    );
  }

  return (
    <div className={`html-slide-deck relative ${className}`}>
      <div
        ref={containerRef}
        className={`template-html-sandbox html-deck-root relative max-w-none w-full ${
          embedded
            ? 'min-h-[60vh] overflow-visible'
            : 'min-h-[360px] h-[min(72vh,680px)] overflow-x-hidden overflow-y-auto'
        } rounded-2xl border border-white/10 bg-black/50 text-left${editable && dragMode ? ' tpl-drag-mode' : ''}`}
        style={embedded
          ? { overflow: 'visible' }
          : {
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      {editable && selBox && (
        <div
          className="tpl-sel-frame"
          style={{ left: selBox.x - 2, top: selBox.y - 2, width: selBox.w + 4, height: selBox.h + 4 }}
        >
          {transient && transientLabel && (
            <div className="tpl-sel-tooltip">{transientLabel}</div>
          )}
          <button
            type="button"
            className="tpl-sel-handle tpl-sel-rotate"
            title="Rotate (hold Shift to snap 15°)"
            aria-label="Rotate"
            onPointerDown={startRotate}
          >↻</button>
          <button
            type="button"
            className="tpl-sel-handle tpl-sel-resize"
            title="Resize"
            aria-label="Resize"
            onPointerDown={startResize('resize-se')}
          >⤡</button>
          <button
            type="button"
            className="tpl-sel-handle tpl-sel-resize-w"
            title="Resize width"
            aria-label="Resize width"
            onPointerDown={startResize('resize-w')}
          >↔</button>
          <button
            type="button"
            className="tpl-sel-handle tpl-sel-resize-h"
            title="Resize height"
            aria-label="Resize height"
            onPointerDown={startResize('resize-h')}
          >↕</button>
        </div>
      )}
      {slideCount > 1 && !editable && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
            disabled={activeIndex <= 0}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-zinc-200 hover:bg-white/15 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-zinc-500">
            {activeIndex + 1} / {slideCount}
          </span>
          <button
            type="button"
            onClick={() => setActiveIndex((i) => Math.min(i + 1, maxIdx))}
            disabled={activeIndex >= maxIdx}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-zinc-200 hover:bg-white/15 disabled:opacity-40"
          >
            Next
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-zinc-200 hover:bg-white/15"
          >
            Restart
          </button>
          {!pageMode && (
            <label className="flex cursor-pointer items-center gap-2 text-zinc-500">
              <input
                type="checkbox"
                checked={autoPlay}
                onChange={(e) => setAutoPlay(e.target.checked)}
                className="rounded border-white/20"
              />
              Auto-play
            </label>
          )}
          {pageMode && (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-zinc-500">
                <input
                  type="checkbox"
                  checked={pageTimerEnabled}
                  onChange={(e) => setPageTimerEnabled(e.target.checked)}
                  className="rounded border-white/20"
                />
                Page timer
              </label>
              <span className="text-xs text-zinc-600">Buttons navigate; timer uses per-page seconds from the builder.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
