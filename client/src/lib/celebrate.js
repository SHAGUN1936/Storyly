/**
 * Tiny celebration helper — wraps canvas-confetti with on-brand pastel
 * colors and sensible defaults so callers don't have to repeat the same
 * config. Three flavors:
 *
 *   celebrate()         → soft confetti burst from screen center (saves)
 *   celebrate('cheer')  → bigger triple-burst (signup, publish)
 *   celebrate('mint')   → teal-tinted, for success-y confirmations
 */
import confetti from 'canvas-confetti';

const COLORS_BRAND = ['#A78BFA', '#8B5CF6', '#EC4899', '#A78BFA', '#F472B6'];
const COLORS_MINT  = ['#14B8A6', '#2DD4BF', '#A78BFA', '#A78BFA'];

export default function celebrate(kind = 'default') {
  if (typeof window === 'undefined') return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  if (kind === 'cheer') {
    const burst = (originX) =>
      confetti({
        particleCount: 70,
        angle: originX < 0.5 ? 60 : 120,
        spread: 75,
        origin: { x: originX, y: 0.7 },
        colors: COLORS_BRAND,
        ticks: 220,
        scalar: 0.95,
        gravity: 0.9,
      });
    burst(0.2);
    setTimeout(() => burst(0.5), 140);
    setTimeout(() => burst(0.8), 280);
    return;
  }

  if (kind === 'mint') {
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: COLORS_MINT,
      ticks: 200,
      scalar: 0.85,
    });
    return;
  }

  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.55 },
    colors: COLORS_BRAND,
    ticks: 200,
    scalar: 0.9,
  });
}
