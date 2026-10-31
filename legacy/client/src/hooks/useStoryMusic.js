import { useEffect } from 'react';
import { mountYouTubeAudio } from '../lib/youtubeAudio';

/**
 * useStoryMusic — drives the page's background music <audio data-story-music>:
 * plays the trimmed window [start, end], applies fade-in / fade-out via volume,
 * loops within the window (or stops), and starts on first user interaction when
 * autoplay-with-sound is blocked. Active only when `enabled` (i.e. NOT while
 * editing — like the games), so music doesn't blare in the editor.
 */
export function useStoryMusic(rootRef, markup, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const el = root.querySelector('[data-story-music]');
    if (!el) return undefined;

    // YouTube track → IFrame player (trim/fade/loop, autoplay on interaction).
    if (el.dataset.yt) {
      const d0 = el.dataset;
      const ctl = mountYouTubeAudio(el, {
        videoId: d0.yt, start: Number(d0.start) || 0, end: Number(d0.end) || 0,
        fadeIn: Number(d0.fadein) || 0, fadeOut: Number(d0.fadeout) || 0,
        loop: d0.loop === '1', volume: Number(d0.volume) || 0.8, autostart: true,
      });
      return () => ctl.destroy();
    }

    const audio = el;
    const d = audio.dataset;
    const start = Math.max(0, Number(d.start) || 0);
    const endRaw = Number(d.end) || 0;
    const fadeIn = Math.max(0, Number(d.fadein) || 0);
    const fadeOut = Math.max(0, Number(d.fadeout) || 0);
    const loop = d.loop === '1';
    const vol = Math.max(0, Math.min(1, Number(d.volume) || 0.8));

    let raf = 0;
    let stopped = false;
    let armed = false;

    const endTime = () => (endRaw > 0 ? endRaw : (audio.duration || Infinity));
    const seekStart = () => { try { audio.currentTime = start; } catch { /* not seekable yet */ } };

    const tick = () => {
      if (stopped) return;
      const end = endTime();
      const t = audio.currentTime;
      if (t >= end - 0.03) {
        if (loop) seekStart();
        else { try { audio.pause(); } catch { /* */ } audio.volume = 0; stopped = true; return; }
      }
      let v = vol;
      if (fadeIn > 0 && t < start + fadeIn) v = vol * Math.max(0, (t - start) / fadeIn);
      if (fadeOut > 0 && end !== Infinity && t > end - fadeOut) v = Math.min(v, vol * Math.max(0, (end - t) / fadeOut));
      audio.volume = Math.max(0, Math.min(1, v));
      raf = requestAnimationFrame(tick);
    };
    const startTick = () => { stopped = false; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };

    const onInteract = () => {
      if (!armed) return;
      armed = false;
      seekStart();
      audio.play().then(startTick).catch(() => {});
    };
    const arm = () => {
      armed = true;
      document.addEventListener('pointerdown', onInteract, { once: true });
      document.addEventListener('keydown', onInteract, { once: true });
      document.addEventListener('touchstart', onInteract, { once: true });
    };

    const begin = () => {
      audio.volume = fadeIn > 0 ? 0 : vol;
      const go = () => { seekStart(); audio.play().then(startTick).catch(arm); };
      if (audio.readyState >= 1) go();
      else audio.addEventListener('loadedmetadata', go, { once: true });
    };
    begin();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onInteract);
      document.removeEventListener('keydown', onInteract);
      document.removeEventListener('touchstart', onInteract);
      try { audio.pause(); } catch { /* */ }
    };
  }, [rootRef, markup, enabled]);
}
