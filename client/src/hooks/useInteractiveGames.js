import { useEffect } from 'react';

/**
 * Wires up the interactive "fun" blocks (quiz, poll, games, …) rendered by
 * renderGame(). The markup is self-describing (classes + data-attributes); this
 * hook only attaches behaviour. It runs ONLY when `enabled` (the published
 * deck) — in the editor games stay inert so blocks remain selectable/movable.
 *
 * Each initialiser receives the game's root element and may return a cleanup.
 * Re-runs whenever `markup` changes (the DOM was rebuilt).
 */
const shuffle = (a) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const INITS = {
  trickyn(el) {
    const yes = el.querySelector('[data-yes]');
    const no = el.querySelector('[data-dodge]');
    const ok = el.querySelector('[data-success]');
    const btns = el.querySelector('.tpl-game-btns');
    const onYes = () => { if (btns) btns.setAttribute('hidden', ''); if (ok) ok.hidden = false; el.classList.add('tpl-game-won'); };
    const dodge = (e) => {
      if (e) { e.preventDefault?.(); }
      const dx = (Math.random() * 2 - 1) * 130;
      const dy = (Math.random() * 2 - 1) * 90;
      no.style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px)`;
    };
    yes?.addEventListener('click', onYes);
    no?.addEventListener('mouseenter', dodge);
    no?.addEventListener('click', dodge);
    no?.addEventListener('touchstart', dodge, { passive: false });
    return () => {
      yes?.removeEventListener('click', onYes);
      no?.removeEventListener('mouseenter', dodge);
      no?.removeEventListener('click', dodge);
      no?.removeEventListener('touchstart', dodge);
    };
  },

  reveal(el) {
    const cover = el.querySelector('[data-cover]');
    const on = () => el.classList.add('tpl-revealed');
    cover?.addEventListener('click', on);
    return () => cover?.removeEventListener('click', on);
  },

  quiz(el) {
    const opts = [...el.querySelectorAll('[data-opt]')];
    const fb = el.querySelector('[data-feedback]');
    let done = false;
    const onClick = (e) => {
      if (done) return;
      done = true;
      const btn = e.currentTarget;
      const correct = btn.hasAttribute('data-correct');
      opts.forEach((o) => { o.disabled = true; if (o.hasAttribute('data-correct')) o.classList.add('is-correct'); });
      if (!correct) btn.classList.add('is-wrong');
      if (fb) { fb.textContent = correct ? 'Correct! 🎉' : 'Oops — the right answer is highlighted.'; fb.classList.add(correct ? 'ok' : 'no'); }
    };
    opts.forEach((o) => o.addEventListener('click', onClick));
    return () => opts.forEach((o) => o.removeEventListener('click', onClick));
  },

  poll(el) {
    const opts = [...el.querySelectorAll('[data-opt]')];
    let voted = false;
    const render = () => {
      const total = opts.reduce((s, o) => s + (Number(o.dataset.votes) || 0), 0) || 1;
      opts.forEach((o) => {
        const pct = Math.round(((Number(o.dataset.votes) || 0) / total) * 100);
        const bar = o.querySelector('.tpl-poll-bar');
        const lbl = o.querySelector('.tpl-poll-pct');
        if (bar) bar.style.width = `${pct}%`;
        if (lbl) lbl.textContent = `${pct}%`;
      });
    };
    const onClick = (e) => {
      if (voted) return;
      voted = true;
      const o = e.currentTarget;
      o.dataset.votes = String((Number(o.dataset.votes) || 0) + 1);
      el.classList.add('tpl-poll-voted');
      o.classList.add('is-picked');
      render();
    };
    opts.forEach((o) => o.addEventListener('click', onClick));
    return () => opts.forEach((o) => o.removeEventListener('click', onClick));
  },

  memory(el) {
    const grid = el.querySelector('.tpl-memory');
    const cards = [...el.querySelectorAll('.tpl-mem-card')];
    const status = el.querySelector('[data-status]');
    if (grid) shuffle(cards).forEach((c) => grid.appendChild(c));
    let first = null, lock = false, matched = 0;
    const onClick = (e) => {
      const c = e.currentTarget;
      if (lock || c.classList.contains('is-up') || c.classList.contains('is-done')) return;
      c.classList.add('is-up');
      if (!first) { first = c; return; }
      if (first.dataset.emoji === c.dataset.emoji) {
        first.classList.add('is-done'); c.classList.add('is-done'); first = null; matched++;
        if (matched === cards.length / 2 && status) status.textContent = 'You matched them all! 🏆';
      } else {
        lock = true;
        const a = first; first = null;
        setTimeout(() => { a.classList.remove('is-up'); c.classList.remove('is-up'); lock = false; }, 700);
      }
    };
    cards.forEach((c) => c.addEventListener('click', onClick));
    return () => cards.forEach((c) => c.removeEventListener('click', onClick));
  },

  spot(el) {
    const cells = [...el.querySelectorAll('.tpl-spot-cell')];
    const status = el.querySelector('[data-status]');
    const emoji = el.dataset.emoji || '😀';
    const odd = el.dataset.odd || '😈';
    cells.forEach((c) => { c.removeAttribute('data-odd'); c.textContent = emoji; });
    const oi = Math.floor(Math.random() * cells.length);
    if (cells[oi]) { cells[oi].setAttribute('data-odd', ''); cells[oi].textContent = odd; }
    let done = false;
    const onClick = (e) => {
      if (done) return;
      const c = e.currentTarget;
      if (c.hasAttribute('data-odd')) { done = true; c.classList.add('is-found'); if (status) status.textContent = 'Found it! 🎉'; }
      else { c.classList.add('is-shake'); setTimeout(() => c.classList.remove('is-shake'), 400); if (status) status.textContent = 'Nope, keep looking 👀'; }
    };
    cells.forEach((c) => c.addEventListener('click', onClick));
    return () => cells.forEach((c) => c.removeEventListener('click', onClick));
  },

  wheel(el) {
    const wheel = el.querySelector('[data-wheel]');
    const spin = el.querySelector('[data-spin]');
    const result = el.querySelector('[data-result]');
    let segs = [];
    try { segs = JSON.parse(el.dataset.segments || '[]'); } catch { segs = []; }
    let angle = 0, spinning = false;
    const onSpin = () => {
      if (spinning || !segs.length || !wheel) return;
      spinning = true;
      if (result) result.textContent = '';
      const n = segs.length;
      const step = 360 / n;
      const pick = Math.floor(Math.random() * n);
      angle += 360 * 5 + (360 - (pick * step + step / 2));
      wheel.style.transition = 'transform 3.2s cubic-bezier(.17,.67,.32,1.34)';
      wheel.style.transform = `rotate(${angle}deg)`;
      const done = () => { spinning = false; if (result) result.textContent = `🎯 ${segs[pick]}`; wheel.removeEventListener('transitionend', done); };
      wheel.addEventListener('transitionend', done);
    };
    spin?.addEventListener('click', onSpin);
    return () => spin?.removeEventListener('click', onSpin);
  },

  giftbox(el) {
    const gift = el.querySelector('[data-gift]');
    const msg = el.querySelector('[data-msg]');
    const on = () => { el.classList.add('tpl-gift-open'); if (msg) msg.hidden = false; };
    gift?.addEventListener('click', on);
    return () => gift?.removeEventListener('click', on);
  },

  flip(el) {
    const card = el.querySelector('[data-flip]');
    const on = () => card.classList.toggle('is-flipped');
    card?.addEventListener('click', on);
    return () => card?.removeEventListener('click', on);
  },

  slot(el) {
    const reels = [...el.querySelectorAll('[data-reel]')];
    const spin = el.querySelector('[data-spin]');
    const result = el.querySelector('[data-result]');
    let syms = [];
    try { syms = JSON.parse(el.dataset.symbols || '[]'); } catch { syms = []; }
    if (!syms.length) syms = ['🍒', '🍋', '⭐'];
    let spinning = false;
    const timers = [];
    const onSpin = () => {
      if (spinning) return;
      spinning = true;
      if (result) result.textContent = '';
      const finals = reels.map(() => syms[Math.floor(Math.random() * syms.length)]);
      reels.forEach((r, i) => {
        let ticks = 0; const max = 12 + i * 6;
        const iv = setInterval(() => {
          r.textContent = syms[Math.floor(Math.random() * syms.length)];
          if (++ticks >= max) {
            clearInterval(iv);
            r.textContent = finals[i];
            if (i === reels.length - 1) {
              spinning = false;
              if (result) result.textContent = finals.every((s) => s === finals[0]) ? '🎉 JACKPOT!' : 'Spin again!';
            }
          }
        }, 80);
        timers.push(iv);
      });
    };
    spin?.addEventListener('click', onSpin);
    return () => { timers.forEach(clearInterval); spin?.removeEventListener('click', onSpin); };
  },

  puzzle(el) {
    // Jigsaw drag-and-drop: drag each scattered piece onto its matching slot.
    const root = el.querySelector('.tpl-jig');
    const status = el.querySelector('[data-status]');
    if (!root) return undefined;
    const slots = [...root.querySelectorAll('.tpl-jig-slot')];
    const pieces = [...root.querySelectorAll('.tpl-jig-piece')];
    const total = pieces.length;
    let placed = 0;
    let drag = null;

    const onDown = (e) => {
      const piece = e.currentTarget;
      if (piece.classList.contains('is-placed')) return;
      try { piece.setPointerCapture(e.pointerId); } catch { /* */ }
      drag = { piece, sx: e.clientX, sy: e.clientY };
      piece.classList.add('is-drag');
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!drag) return;
      drag.piece.style.transform = `translate(${e.clientX - drag.sx}px, ${e.clientY - drag.sy}px) scale(1.08)`;
    };
    const onUp = (e) => {
      if (!drag) return;
      const piece = drag.piece;
      drag = null;
      piece.classList.remove('is-drag');
      const slot = slots[Number(piece.dataset.piece)];
      const r = slot.getBoundingClientRect();
      const hit = !slot.childElementCount &&
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      piece.style.transform = '';
      if (hit) {
        slot.appendChild(piece);
        piece.classList.add('is-placed');
        placed += 1;
        if (placed === total) { root.classList.add('is-solved'); if (status) status.textContent = '🎉 Solved!'; }
      }
    };

    pieces.forEach((p) => p.addEventListener('pointerdown', onDown));
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      pieces.forEach((p) => p.removeEventListener('pointerdown', onDown));
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  },

  tapsong(el) {
    const btn = el.querySelector('[data-tapplay]');
    // YouTube song → IFrame player, toggled by the tap button.
    const yt = el.querySelector('[data-tapyt]');
    if (btn && yt) {
      let ctl = null;
      const toggle = () => {
        if (!ctl) {
          const d = yt.dataset;
          // mountYouTubeAudio is loaded lazily to avoid bundling for every page.
          import('../lib/youtubeAudio').then(({ mountYouTubeAudio }) => {
            ctl = mountYouTubeAudio(yt, {
              videoId: d.tapyt, start: Number(d.start) || 0, end: Number(d.end) || 0,
              fadeIn: Number(d.fadein) || 0, fadeOut: Number(d.fadeout) || 0,
              loop: d.loop === '1', volume: Number(d.volume) || 1, autostart: true,
            });
            el.classList.add('is-playing');
          });
        } else { ctl.toggle(); el.classList.toggle('is-playing'); }
      };
      btn.addEventListener('click', toggle);
      return () => { btn.removeEventListener('click', toggle); try { ctl && ctl.destroy(); } catch { /* */ } };
    }
    const audio = el.querySelector('[data-tapaudio]');
    if (!btn || !audio) return undefined;
    const d = audio.dataset;
    const start = Math.max(0, Number(d.start) || 0);
    const endRaw = Number(d.end) || 0;
    const fadeIn = Math.max(0, Number(d.fadein) || 0);
    const fadeOut = Math.max(0, Number(d.fadeout) || 0);
    const loop = d.loop !== '0';
    const vol = Math.max(0, Math.min(1, Number(d.volume) || 1));
    let raf = 0;
    const endTime = () => (endRaw > 0 ? endRaw : (audio.duration || Infinity));
    const tick = () => {
      const e = endTime();
      const t = audio.currentTime;
      if (t >= e - 0.03) {
        if (loop) { try { audio.currentTime = start; } catch { /* */ } }
        else { audio.pause(); el.classList.remove('is-playing'); cancelAnimationFrame(raf); return; }
      }
      let v = vol;
      if (fadeIn > 0 && t < start + fadeIn) v = vol * Math.max(0, (t - start) / fadeIn);
      if (fadeOut > 0 && e !== Infinity && t > e - fadeOut) v = Math.min(v, vol * Math.max(0, (e - t) / fadeOut));
      audio.volume = Math.max(0, Math.min(1, v));
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      audio.volume = fadeIn > 0 ? 0 : vol;
      try { audio.currentTime = start; } catch { /* */ }
      audio.play().then(() => { el.classList.add('is-playing'); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }).catch(() => {});
    };
    const toggle = () => { if (audio.paused) play(); else { audio.pause(); el.classList.remove('is-playing'); cancelAnimationFrame(raf); } };
    const onEnd = () => { el.classList.remove('is-playing'); cancelAnimationFrame(raf); };
    btn.addEventListener('click', toggle);
    audio.addEventListener('ended', onEnd);
    return () => { btn.removeEventListener('click', toggle); audio.removeEventListener('ended', onEnd); cancelAnimationFrame(raf); try { audio.pause(); } catch { /* */ } };
  },

  rps(el) {
    const btns = [...el.querySelectorAll('[data-rps]')];
    const result = el.querySelector('[data-result]');
    const E = { rock: '✊', paper: '✋', scissors: '✌️' };
    const beats = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const keys = ['rock', 'paper', 'scissors'];
    const onClick = (e) => {
      const you = e.currentTarget.dataset.rps;
      const comp = keys[Math.floor(Math.random() * 3)];
      const r = you === comp ? 'Draw 🤝' : beats[you] === comp ? 'You win! 🎉' : 'You lose 😅';
      if (result) result.textContent = `${E[you]} vs 🤖 ${E[comp]} — ${r}`;
    };
    btns.forEach((b) => b.addEventListener('click', onClick));
    return () => btns.forEach((b) => b.removeEventListener('click', onClick));
  },
};

export function useInteractiveGames(containerRef, markup, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    const root = containerRef.current;
    if (!root) return undefined;
    const cleanups = [];
    root.querySelectorAll('[data-game]').forEach((el) => {
      const fn = INITS[el.getAttribute('data-game')];
      if (!fn) return;
      try { const c = fn(el); if (typeof c === 'function') cleanups.push(c); } catch { /* a broken game must not break the page */ }
    });
    return () => cleanups.forEach((c) => c());
  }, [containerRef, markup, enabled]);
}
