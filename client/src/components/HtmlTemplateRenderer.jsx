import { useMemo, useRef, useEffect } from 'react';
import { applySlotFillsToHtml, countSlidesInHtml } from '../lib/htmlTemplate';
import HtmlSlideDeck from './HtmlSlideDeck';
import { useDodgeButtons } from '../hooks/useDodgeButtons';

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
}) {
  const slideCount = useMemo(() => countSlidesInHtml(html), [html]);
  const markup = useMemo(() => applySlotFillsToHtml(html, fills), [html, fills]);
  const singlePageRef = useRef(null);
  useDodgeButtons(singlePageRef, [markup]);
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

  if (slideCount > 1) {
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
      className={`template-html-sandbox html-template-root max-w-none min-h-[320px] max-h-[min(75vh,720px)] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/80 p-4 text-left ${className}`}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
