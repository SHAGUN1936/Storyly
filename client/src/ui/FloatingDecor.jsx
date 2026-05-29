import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { STICKER_LIBRARY } from './CartoonStickers';

/**
 * Floating decorative emojis (and optionally cartoon SVG stickers) that
 * drift around with varied paths, sizes, and animation styles.
 *
 * Lives behind content (pointer-events: none). Each render produces a
 * deterministic-pseudo-random layout so things stay stable while still
 * looking organic.
 *
 * Density: 'subtle' (5), 'normal' (10), 'heavy' (18).
 *
 * `mixStickers` (default true) injects cartoon stickers from CartoonStickers
 * for ~25% of items so the field feels like a sticker layer, not just text.
 *
 * `size` is the BASE size — actual items are ±0.5x → ±1.8x to deliver real
 * size variety (small, medium, large mixed in).
 *
 * Animation style for each item is one of: drift, bobSpin, pulse, wiggle —
 * picked deterministically per item.
 */
const DEFAULT_EMOJI = ['✨', '🪩', '💖', '🎂', '💍', '🎉', '💌', '🎵', '⭐', '💫', '🌟', '💞', '🎈', '🎀', '🥂', '🦋'];

export default function FloatingDecor({
  items,
  density = 'normal',
  opacity = 0.18,
  className = '',
  size = 36,
  mixStickers = true,
}) {
  const count =
    density === 'subtle' ? 5
    : density === 'heavy' ? 18
    : 10;
  const emojiPool = items?.length ? items : DEFAULT_EMOJI;

  const seeds = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random per-item — stable across re-renders.
      const r = (salt, mul = 1) => {
        const x = Math.sin(i * 9999 + salt * 73 + 31) * 10000;
        return (x - Math.floor(x)) * mul;
      };
      const sizeRoll = r(1);              // 0..1 — variance
      // Real size variety: 50% small, 30% medium, 20% large
      const sizeMul =
        sizeRoll < 0.5 ? 0.55 + r(2, 0.25)
        : sizeRoll < 0.8 ? 0.95 + r(2, 0.3)
        : 1.5 + r(2, 0.6);
      // Use cartoon stickers by default — they read as "logo" art rather
      // than text glyphs. `mixStickers={false}` still falls back to
      // emoji-only (used by the giant background layer in Layout/Landing).
      const useSticker = mixStickers;
      const animStyle = Math.floor(r(4, 4)); // 0..3
      arr.push({
        idx: i,
        useSticker,
        StickerComp: STICKER_LIBRARY[Math.floor(r(5, STICKER_LIBRARY.length))],
        emoji: emojiPool[Math.floor(r(6, emojiPool.length))],
        left: 4 + r(7, 92),
        top:  4 + r(8, 92),
        sizeMul,
        animStyle,
        drift:    60 + r(9,  120),
        duration: 12 + r(10, 22),
        delay:    r(11, 8),
        baseRot:  -25 + r(12, 50),
      });
    }
    return arr;
  }, [count, emojiPool, mixStickers]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {seeds.map((s) => {
        const px = Math.round(size * s.sizeMul);

        // Pick animation by style index
        const animateBy = (() => {
          switch (s.animStyle) {
            case 1: // bobSpin — vertical bob + slow rotation
              return {
                y: [0, -s.drift * 0.6, s.drift * 0.4, 0],
                rotate: [s.baseRot, s.baseRot + 360],
              };
            case 2: // pulse — scale + slight x-drift
              return {
                scale: [1, 1.18, 0.95, 1],
                x: [0, s.drift * 0.35, -s.drift * 0.25, 0],
                rotate: [s.baseRot, s.baseRot + 12, s.baseRot - 6, s.baseRot],
              };
            case 3: // wiggle — heavy rotation back-and-forth + small drift
              return {
                rotate: [s.baseRot - 20, s.baseRot + 20, s.baseRot - 20],
                y: [0, -s.drift * 0.25, s.drift * 0.2, 0],
              };
            default: // drift — current behavior, free-floating
              return {
                y: [0, -s.drift, s.drift * 0.6, 0],
                x: [0, s.drift * 0.5, -s.drift * 0.4, 0],
                rotate: [s.baseRot, s.baseRot + 18, s.baseRot - 12, s.baseRot],
              };
          }
        })();

        return (
          <motion.span
            key={s.idx}
            className="absolute select-none"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              fontSize: px,
              opacity,
              filter: 'saturate(1.2)',
              lineHeight: 1,
            }}
            initial={{ y: 0, x: 0, rotate: s.baseRot, scale: 1 }}
            animate={animateBy}
            transition={{
              duration: s.duration,
              delay: s.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {s.useSticker
              ? <s.StickerComp size={px} />
              : s.emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
