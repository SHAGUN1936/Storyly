import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

/**
 * tsParticles motion background. Code-split (only imported when the user picks
 * the "Particles" background) so the heavy engine never enters the main bundle.
 * Performance-tuned: capped particle count, fps limit, pause when blurred /
 * off-screen, retina-aware.
 */
let enginePromise = null;
function ensureEngine() {
  if (!enginePromise) enginePromise = initParticlesEngine((engine) => loadSlim(engine));
  return enginePromise;
}

export default function ParticlesBg({ color1 = '#8B5CF6', color2 = '#EC4899', speed = 2 }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    ensureEngine().then(() => { if (alive) setReady(true); });
    return () => { alive = false; };
  }, []);

  const options = useMemo(() => {
    const count = speed >= 3 ? 80 : speed === 2 ? 55 : 32;
    return {
      fullScreen: { enable: false },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      background: { color: 'transparent' },
      particles: {
        number: { value: count, density: { enable: true, width: 800, height: 800 } },
        color: { value: [color1, color2] },
        links: { enable: true, color: color1, distance: 130, opacity: 0.22, width: 1 },
        move: { enable: true, speed: speed * 0.7, outModes: { default: 'out' } },
        opacity: { value: 0.6 },
        size: { value: { min: 1, max: 3 } },
      },
    };
  }, [color1, color2, speed]);

  if (!ready) return null;
  return <Particles id="tpl-motion-particles" options={options} className="absolute inset-0 w-full h-full" />;
}
