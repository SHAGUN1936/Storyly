import { useMemo, useRef, useEffect } from 'react';
import { applySlotFillsToHtml, countSlidesInHtml } from '../lib/htmlTemplate';
import HtmlSlideDeck from './HtmlSlideDeck';
import { useDodgeButtons } from '../hooks/useDodgeButtons';
import { useResponsiveBreakpoint } from '../hooks/useResponsiveBreakpoint';

export default function HtmlTemplateRenderer({
  html,
  fills = {},
  structure,
  className = '',
  editable = false,
  onTextSlotCommit,
  dragMode = false,
  onBlockMoveCommit,
  activeIndex,
  onActiveIndexChange,
  selectedSlot,
  onSelectionChange,
  onResizeCommit,
  onRotateCommit,
  canSelect,
  /* Forwarded to HtmlSlideDeck — flatten the inner scroll surface in
     preview + wizard contexts so the outer page is the single scroller. */
  embedded = false,
  /* Responsive engine: forced device breakpoint (editor preview) or null
     for automatic width-based selection on published pages. */
  previewBreakpoint = null,
}) {
  const slideCount = useMemo(() => countSlidesInHtml(html), [html]);
  const markup = useMemo(() => applySlotFillsToHtml(html, fills), [html, fills]);
  const singlePageRef = useRef(null);
  useDodgeButtons(singlePageRef, [markup]);
  // Single-page templates: drive data-bp here (the deck path does its own).
  useResponsiveBreakpoint(singlePageRef, markup, previewBreakpoint);
  useEffect(() => {
    if (!editable) return;
    const root = singlePageRef.current;
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

  /* Route to the full deck for multi-page decks AND for ANY editable canvas —
     the deck carries all the editing chrome (block selection, drag-to-move,
     resize/rotate handles), so single-page websites are fully editable too.
     Published single-page pages still use the lightweight renderer below. */
  if (slideCount > 1 || editable) {
    return (
      <HtmlSlideDeck
        html={html}
        fills={fills}
        structure={structure}
        className={className}
        editable={editable}
        onTextSlotCommit={onTextSlotCommit}
        dragMode={dragMode}
        onBlockMoveCommit={onBlockMoveCommit}
        activeIndex={activeIndex}
        onActiveIndexChange={onActiveIndexChange}
        selectedSlot={selectedSlot}
        onSelectionChange={onSelectionChange}
        onResizeCommit={onResizeCommit}
        onRotateCommit={onRotateCommit}
        canSelect={canSelect}
        embedded={embedded}
        previewBreakpoint={previewBreakpoint}
      />
    );
  }

  if (!html || !String(html).trim()) {
    return (
      <div className={`rounded-xl bg-white/5 p-6 text-center text-zinc-500 text-sm ${className}`}>
        No HTML content in this website.
      </div>
    );
  }

  return (
    <div
      ref={singlePageRef}
      className={`template-html-sandbox html-template-root max-w-none ${
        embedded
          ? 'min-h-[40vh] overflow-visible'
          : 'min-h-[320px] max-h-[min(75vh,720px)] overflow-x-hidden overflow-y-auto'
      } rounded-2xl border border-white/10 bg-zinc-900/80 p-4 text-left ${className}`}
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
  );
}
