/**
 * youtubeAudio — play a YouTube video as background/tap music via the IFrame
 * Player API, with trim window (start/end), fade in/out (volume), and loop.
 * The waveform can't be read (DRM), so trimming is numeric. Returns a small
 * controller; autoplay-with-sound is blocked by browsers, so when `autostart`
 * is set it also plays on the first user interaction.
 */
let apiPromise = null;
function loadAPI() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { prev && prev(); } catch { /* */ } resolve(window.YT); };
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  });
  return apiPromise;
}

export function mountYouTubeAudio(host, cfg = {}) {
  const start = Math.max(0, Number(cfg.start) || 0);
  const endRaw = Number(cfg.end) || 0;
  const fadeIn = Math.max(0, Number(cfg.fadeIn) || 0);
  const fadeOut = Math.max(0, Number(cfg.fadeOut) || 0);
  const loop = cfg.loop !== false;
  const vol = Math.max(0, Math.min(1, Number(cfg.volume == null ? 0.8 : cfg.volume)));

  let player = null;
  let raf = 0;
  let dead = false;
  let ready = false;
  let armed = false;
  let wantPlay = false;

  const inner = document.createElement('div');
  if (host) host.appendChild(inner);

  const endTime = () => {
    if (endRaw > 0) return endRaw;
    try { return player.getDuration() || Infinity; } catch { return Infinity; }
  };
  const setVol = (v) => { try { player.setVolume(Math.round(Math.max(0, Math.min(1, v)) * 100)); } catch { /* */ } };

  // Live config getter (so the editor's preview follows the cut as you drag).
  const cfgNow = () => {
    const c = cfg.getConfig ? cfg.getConfig() : null;
    const n = (v, dflt) => { const x = Number(v); return Number.isFinite(x) ? x : dflt; };
    if (!c) return { start, end: endRaw, fadeIn, fadeOut, loop, volume: vol };
    return {
      start: Math.max(0, n(c.start, start)),
      end: n(c.end, endRaw),
      fadeIn: Math.max(0, n(c.fadeIn, fadeIn)),
      fadeOut: Math.max(0, n(c.fadeOut, fadeOut)),
      loop: c.loop !== false,
      volume: Math.max(0, Math.min(1, n(c.volume, vol))),
    };
  };

  const tick = () => {
    if (dead || !player) return;
    let t = 0;
    try { t = player.getCurrentTime() || 0; } catch { /* */ }
    try { cfg.onTick && cfg.onTick(t); } catch { /* */ }
    const c = cfgNow();
    let dur = Infinity;
    try { dur = player.getDuration() || Infinity; } catch { /* */ }
    const e = c.end > 0 ? c.end : dur;
    if (t >= e - 0.2 || t < c.start - 0.1) {
      if (c.loop) { try { player.seekTo(c.start, true); } catch { /* */ } }
      else { try { player.pauseVideo(); } catch { /* */ } cancelAnimationFrame(raf); return; }
    }
    let v = c.volume;
    if (c.fadeIn > 0 && t < c.start + c.fadeIn) v = c.volume * Math.max(0, (t - c.start) / c.fadeIn);
    if (c.fadeOut > 0 && e !== Infinity && t > e - c.fadeOut) v = Math.min(v, c.volume * Math.max(0, (e - t) / c.fadeOut));
    setVol(v);
    raf = requestAnimationFrame(tick);
  };
  const startTick = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };

  const play = () => {
    wantPlay = true;
    if (!ready || dead) { armed = true; return; }
    const c = cfgNow();
    try { player.seekTo(c.start, true); setVol(c.fadeIn > 0 ? 0 : c.volume); player.playVideo(); } catch { /* */ }
  };
  const pause = () => { wantPlay = false; try { player.pauseVideo(); } catch { /* */ } cancelAnimationFrame(raf); };
  const seek = (t) => { try { player.seekTo(Math.max(0, Number(t) || 0), true); } catch { /* */ } };
  const toggle = () => {
    let state = -1;
    try { state = player.getPlayerState(); } catch { /* */ }
    if (state === 1) pause(); else play();
  };

  const onInteract = () => { if (armed) { armed = false; play(); } };
  const arm = () => {
    document.addEventListener('pointerdown', onInteract, { once: true });
    document.addEventListener('keydown', onInteract, { once: true });
    document.addEventListener('touchstart', onInteract, { once: true });
  };

  loadAPI().then((YT) => {
    if (dead || !YT) return;
    player = new YT.Player(inner, {
      videoId: cfg.videoId,
      host: 'https://www.youtube-nocookie.com',
      width: '200',
      height: '120',
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3, modestbranding: 1, rel: 0, playsinline: 1, start: Math.floor(start) },
      events: {
        onReady: () => {
          ready = true;
          let dur = 0;
          try { dur = player.getDuration() || 0; } catch { /* */ }
          try { cfg.onReady && cfg.onReady(dur); } catch { /* */ }
          setVol(fadeIn > 0 ? 0 : vol);
          if (cfg.autostart || wantPlay) { play(); arm(); }
        },
        onStateChange: (e) => { if (e.data === 1) startTick(); }, // 1 = playing
      },
    });
  });

  const destroy = () => {
    dead = true;
    cancelAnimationFrame(raf);
    document.removeEventListener('pointerdown', onInteract);
    document.removeEventListener('keydown', onInteract);
    document.removeEventListener('touchstart', onInteract);
    try { player && player.destroy && player.destroy(); } catch { /* */ }
  };

  return { play, pause, toggle, seek, destroy };
}
