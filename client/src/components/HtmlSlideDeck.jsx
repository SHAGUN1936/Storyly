import { useMemo, useRef, useState, useEffect } from 'react';
import { applySlotFillsToHtml, countSlidesInHtml } from '../lib/htmlTemplate';
import { useDodgeButtons } from '../hooks/useDodgeButtons';

/**
 * Carousel: .slide / [data-page] — optional timer.
 * Page app: multiple .page — navigation via [data-nav-page="N"] (1-based) + overlay.
 */
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
}) {
  const markup = useMemo(() => applySlotFillsToHtml(html, fills), [html, fills]);
  const containerRef = useRef(null);
  const countedSlides = useMemo(() => countSlidesInHtml(html), [html]);
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [slideCount, setSlideCount] = useState(() => countedSlides);
  const [pageMode, setPageMode] = useState(false);
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
  }, [markup, maxIdx]);

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
    const onDown = (e) => {
      const el = e.target.closest('[data-block-slot]');
      if (!el) return;
      const box = root.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      moving = {
        el,
        slot: el.getAttribute('data-block-slot'),
        offsetX: e.clientX - r.left,
        offsetY: e.clientY - r.top,
        box,
      };
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!moving) return;
      const x = e.clientX - moving.box.left - moving.offsetX;
      const y = e.clientY - moving.box.top - moving.offsetY;
      moving.el.style.position = 'absolute';
      moving.el.style.left = `${Math.round(x)}px`;
      moving.el.style.top = `${Math.round(y)}px`;
    };
    const onUp = () => {
      if (!moving) return;
      const x = parseInt(moving.el.style.left || '0', 10);
      const y = parseInt(moving.el.style.top || '0', 10);
      if (moving.slot && onBlockMoveCommit) onBlockMoveCommit(moving.slot, x, y);
      moving = null;
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

  if (!html || !String(html).trim()) {
    return (
      <div className={`rounded-xl bg-white/5 p-6 text-center text-zinc-500 text-sm ${className}`}>
        No HTML content in this website.
      </div>
    );
  }

  return (
    <div className={`html-slide-deck ${className}`}>
      <div
        ref={containerRef}
        className="template-html-sandbox html-deck-root relative max-w-none w-full min-h-[360px] h-[min(72vh,680px)] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/10 bg-black/50 text-left"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
        }}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: markup }}
      />
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
