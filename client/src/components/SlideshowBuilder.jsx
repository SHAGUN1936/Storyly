import { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HtmlTemplateRenderer from './HtmlTemplateRenderer';
import ScheduledRevealLayer, { useScheduledRevealGate } from './ScheduledRevealLayer';
import { resolveSlideshowHtml } from '../lib/visualTemplateBuilder';

/**
 * Renders template.structure (slideshow): HTML mode or legacy slides JSON.
 * fills: { photo1: 'https://...', title1: 'text', ... }
 * themeOverrides: user-only partial theme (not stored on template) merged over builder theme
 */
export default function SlideshowBuilder({
  structure,
  fills = {},
  themeOverrides = {},
  className = '',
  editable = false,
  /** Only TemplateDetail slot preview: bypass "hide all pages until countdown" so the story stays visible while filling slots. */
  alwaysShowStoryDuringCountdown = false,
  onTextSlotCommit,
  dragMode = false,
  onBlockMoveCommit,
  activeIndex,
  onActiveIndexChange,
}) {
  const html = useMemo(
    () => resolveSlideshowHtml(structure, themeOverrides),
    [structure, themeOverrides]
  );

  const revealGate = useScheduledRevealGate(structure, alwaysShowStoryDuringCountdown);

  if (structure?.mode === 'html' && typeof html === 'string' && html.trim()) {
    return (
      <div
        className={`relative ${revealGate.hideStory ? 'min-h-[min(68vh,520px)]' : ''} ${className}`}
      >
        <ScheduledRevealLayer gate={revealGate} />
        {!revealGate.hideStory && (
          <HtmlTemplateRenderer
            html={html}
            fills={fills}
            structure={structure}
            className="w-full"
            editable={editable}
            onTextSlotCommit={onTextSlotCommit}
            dragMode={dragMode}
            onBlockMoveCommit={onBlockMoveCommit}
            activeIndex={activeIndex}
            onActiveIndexChange={onActiveIndexChange}
          />
        )}
        {revealGate.hideStory && (
          <div
            className="html-deck-root min-h-[min(68vh,520px)] w-full rounded-2xl border border-white/10 bg-zinc-950"
            aria-hidden
          />
        )}
      </div>
    );
  }
  return (
    <SlideshowSlidesView structure={structure} fills={fills} className={className} revealGate={revealGate} />
  );
}

function SlideshowSlidesView({ structure, fills = {}, className = '', revealGate }) {
  const [index, setIndex] = useState(0);
  const audioRef = useRef(null);
  const slides = structure?.slides || [];
  const theme = structure?.theme || {};
  const audioUrl =
    (structure?.audio?.slot && fills[structure.audio.slot]) ||
    structure?.audio?.defaultUrl ||
    '';

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const playMusic = useCallback(() => {
    if (!audioRef.current || !audioUrl) return;
    audioRef.current.src = audioUrl;
    audioRef.current.play().catch(() => {});
  }, [audioUrl]);

  const handleAction = (action) => {
    if (action === 'next') goNext();
    if (action === 'playMusic') playMusic();
  };

  const typeOk = !structure?.type || String(structure.type).toLowerCase() === 'slideshow';
  if (!structure || slides.length === 0 || !typeOk) {
    return (
      <div className="rounded-xl bg-white/5 p-6 text-center text-zinc-500 text-sm">
        This website has no slideshow structure. Use admin HTML with <code className="text-brand-400">data-slot</code>{' '}
        or legacy JSON with <code className="text-brand-400">slides</code>.
      </div>
    );
  }

  const bg = theme.background || 'linear-gradient(135deg, #1a1a2e, #16213e)';
  const color = theme.textColor || '#fff';
  const font = theme.fontFamily || 'system-ui, sans-serif';
  const currentSlide = slides[index];

  return (
    <div
      className={`relative max-h-[min(75vh,720px)] min-h-[420px] overflow-x-hidden overflow-y-auto rounded-2xl border border-white/10 ${className}`}
      style={{
        fontFamily: font,
        color,
        background: bg,
        minHeight: 420,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <ScheduledRevealLayer gate={revealGate} />
      {!revealGate?.hideStory && <audio ref={audioRef} preload="none" />}

      <AnimatePresence mode="wait">
        {!revealGate?.hideStory && currentSlide && (
          <motion.div
            key={currentSlide.id ?? `slide-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex min-h-[420px] flex-col items-center justify-center px-6 py-10 text-center"
          >
            {(currentSlide.items || []).map((item, j) => {
              const key = `${currentSlide.id ?? index}-${j}`;
              if (item.kind === 'title') {
                return (
                  <h2 key={key} className="mb-3 text-3xl font-bold drop-shadow-md md:text-4xl">
                    {item.text}
                  </h2>
                );
              }
              if (item.kind === 'text') {
                return (
                  <p key={key} className="mb-4 max-w-md text-lg opacity-95">
                    {item.text}
                  </p>
                );
              }
              if (item.kind === 'image') {
                const src = item.slot ? fills[item.slot] : item.url;
                const w = item.width || 250;
                const br = item.borderRadius ?? 15;
                if (!src) {
                  return (
                    <div
                      key={key}
                      className="mb-4 flex h-40 w-64 items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-sm text-white/50"
                    >
                      Image
                    </div>
                  );
                }
                return (
                  <img
                    key={key}
                    src={src}
                    alt=""
                    className="mb-4 max-w-full object-cover shadow-lg"
                    style={{ width: w, borderRadius: br }}
                  />
                );
              }
              if (item.kind === 'video') {
                const src = item.slot ? fills[item.slot] : item.url;
                const w = item.width || 320;
                const br = item.borderRadius ?? 15;
                if (!src) {
                  return (
                    <div
                      key={key}
                      className="mb-4 flex h-40 w-64 items-center justify-center rounded-xl border-2 border-dashed border-white/30 text-sm text-white/50"
                    >
                      Video
                    </div>
                  );
                }
                return (
                  <video
                    key={key}
                    src={src}
                    controls
                    playsInline
                    className="mb-4 max-w-full object-cover shadow-lg"
                    style={{ width: w, borderRadius: br }}
                  />
                );
              }
              if (item.kind === 'button') {
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleAction(item.action || 'next')}
                    className="mt-4 rounded-full bg-white/20 px-8 py-3 font-semibold backdrop-blur transition hover:bg-white/30"
                  >
                    {item.label}
                  </button>
                );
              }
              return null;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
