/**
 * Motion Backgrounds library — config + presets.
 *
 * Stored in the template JSON at `theme.motionBg = { type, color1, color2,
 * speed }`. Rendered by <MotionBackground/> behind the deck (editor +
 * published page). Most types are pure CSS (cheap, responsive, GPU-friendly);
 * `particles` lazy-loads tsParticles only when chosen.
 */
export const MOTION_BG_PRESETS = [
  { id: 'none',      label: 'None',      icon: '∅' },
  { id: 'gradient',  label: 'Gradient',  icon: '🌈' },
  { id: 'particles', label: 'Particles', icon: '✦' },
  { id: 'shapes',    label: 'Shapes',    icon: '⬡' },
  { id: 'waves',     label: 'Waves',     icon: '🌊' },
  { id: 'galaxy',    label: 'Galaxy',    icon: '🌌' },
  { id: 'smoke',     label: 'Smoke',     icon: '💨' },
  { id: 'clouds',    label: 'Clouds',    icon: '☁' },
  { id: 'light',     label: 'Light',     icon: '🔦' },
  { id: 'aurora',    label: 'Aurora',    icon: '🌈' },
  { id: 'rain',      label: 'Rain',      icon: '🌧' },
  { id: 'bubbles',   label: 'Bubbles',   icon: '🫧' },
  { id: 'fireflies', label: 'Fireflies', icon: '🟡' },
  { id: 'snowfall',  label: 'Snowfall',  icon: '❄' },
];

const TYPES = new Set(MOTION_BG_PRESETS.map((p) => p.id));

export function normalizeMotionBg(raw) {
  if (!raw || typeof raw !== 'object') return { type: 'none', color1: '#8B5CF6', color2: '#EC4899', speed: 2 };
  return {
    type: TYPES.has(raw.type) ? raw.type : 'none',
    color1: typeof raw.color1 === 'string' && raw.color1 ? raw.color1 : '#8B5CF6',
    color2: typeof raw.color2 === 'string' && raw.color2 ? raw.color2 : '#EC4899',
    // 1 = calm, 2 = normal, 3 = lively. Maps to animation duration + density.
    speed: Number.isFinite(Number(raw.speed)) ? Math.max(1, Math.min(3, Math.round(Number(raw.speed)))) : 2,
  };
}
