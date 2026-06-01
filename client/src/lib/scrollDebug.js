/* ───────────────────────────────────────────────────────────────────
   TEMPORARY SCROLL DEBUG INSTRUMENT  —  remove once the mobile scroll
   bug is found. Import once from main.jsx.

   It answers, at runtime, the question "what is stopping single-finger
   scroll?" by logging every mechanism that can block it:

     • non-passive touchmove/touchstart/wheel listeners (WITH a stack
       trace at the moment they are registered — catches vendor code too)
     • any touchmove that ends up defaultPrevented (i.e. a handler called
       preventDefault) and the element it happened on
     • whether <body> is pinned (position:fixed) or <html>/<body> overflow
       is hidden — the scroll-lock state
     • the topmost element under the finger + the first ancestor whose
       touch-action / overflow / position would stop a single-finger pan
     • whether scrollY actually changed across the gesture

   Every line is prefixed with [scroll-debug] so it is easy to filter in
   remote consoles (e.g. Safari Web Inspector / chrome://inspect).
   ─────────────────────────────────────────────────────────────────── */

const TAG = '[scroll-debug]';

function styleSnapshot(el) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  return {
    position: cs.position,
    overflow: cs.overflow,
    overflowX: cs.overflowX,
    overflowY: cs.overflowY,
    touchAction: cs.touchAction,
    height: cs.height,
    inlinePosition: el.style.position || '(none)',
    inlineTop: el.style.top || '(none)',
    inlineOverflow: el.style.overflow || '(none)',
  };
}

function describe(el) {
  if (!el || el.nodeType !== 1) return String(el);
  const id = el.id ? `#${el.id}` : '';
  const cls = typeof el.className === 'string' && el.className
    ? `.${el.className.trim().split(/\s+/).slice(0, 4).join('.')}`
    : '';
  return `${el.tagName.toLowerCase()}${id}${cls}`;
}

/** Walk up from `el`, returning the first ancestor that would stop a
 *  single-finger vertical pan, plus the reason. */
function findBlocker(el) {
  let node = el;
  let depth = 0;
  while (node && node.nodeType === 1 && depth < 40) {
    const cs = getComputedStyle(node);
    const ta = cs.touchAction;
    if (ta === 'none' || ta === 'pinch-zoom' || ta === 'pan-x') {
      return { node, reason: `touch-action: ${ta}`, style: styleSnapshot(node) };
    }
    if (cs.position === 'fixed' && node !== document.body) {
      // A fixed ancestor isn't itself a blocker unless it also can't
      // scroll, but it's worth surfacing.
      const cantScroll = node.scrollHeight <= node.clientHeight;
      if (cantScroll && (cs.overflowY === 'hidden' || cs.overflowY === 'visible')) {
        return { node, reason: `position: fixed + overflowY:${cs.overflowY} (not scrollable)`, style: styleSnapshot(node) };
      }
    }
    node = node.parentElement;
    depth += 1;
  }
  return null;
}

function dumpState(label) {
  const html = document.documentElement;
  const body = document.body;
  // eslint-disable-next-line no-console
  console.log(`${TAG} ── state @ ${label} ──`, {
    scrollY: window.scrollY,
    docHeight: html.scrollHeight,
    viewport: window.innerHeight,
    canDocScroll: html.scrollHeight > window.innerHeight,
    html: styleSnapshot(html),
    body: styleSnapshot(body),
    bodyIsPinned: getComputedStyle(body).position === 'fixed',
  });
}

export function installScrollDebug() {
  if (typeof window === 'undefined' || window.__scrollDebugInstalled) return;
  window.__scrollDebugInstalled = true;

  // 1) Catch every non-passive touch/wheel listener AT REGISTRATION TIME,
  //    with a stack trace, so we can see exactly who installs a handler
  //    that is allowed to call preventDefault (incl. minified vendors).
  const BLOCKING = new Set(['touchstart', 'touchmove', 'wheel', 'mousewheel']);
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function patched(type, listener, options) {
    if (BLOCKING.has(type)) {
      const passive = options && typeof options === 'object' ? options.passive : undefined;
      // passive defaults to false for these on most desktop, true on some
      // mobile — `false`/`undefined` means the handler CAN block scroll.
      if (passive !== true) {
        const where = describe(this === window ? document.documentElement : this);
        // eslint-disable-next-line no-console
        console.warn(`${TAG} NON-PASSIVE "${type}" listener added on <${where}> (passive=${passive}) — CAN block scroll`);
        // eslint-disable-next-line no-console
        console.warn(`${TAG} ↳ registered from:`, new Error('listener registration stack').stack);
      }
    }
    return orig.call(this, type, listener, options);
  };

  // 2) Per-gesture tracking. A passive window listener can still READ
  //    defaultPrevented after the target handlers ran.
  let startY = 0;
  let startEl = null;

  window.addEventListener('touchstart', (e) => {
    const t = e.touches && e.touches[0];
    startY = window.scrollY;
    startEl = t ? document.elementFromPoint(t.clientX, t.clientY) : e.target;
    const blocker = findBlocker(startEl);
    // eslint-disable-next-line no-console
    console.log(`${TAG} touchstart fingers=${e.touches?.length} on`, describe(startEl),
      'top-element style:', styleSnapshot(startEl),
      blocker ? `\n  ⚠ BLOCKING ANCESTOR: ${describe(blocker.node)} → ${blocker.reason}` : '\n  (no css blocker in ancestor chain)');
    if (getComputedStyle(document.body).position === 'fixed') {
      // eslint-disable-next-line no-console
      console.warn(`${TAG} ⚠ <body> is position:fixed RIGHT NOW — a scroll lock is active`);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // eslint-disable-next-line no-console
    console.log(`${TAG} touchmove fingers=${e.touches?.length} defaultPrevented=${e.defaultPrevented} scrollYΔ=${window.scrollY - startY}`);
    if (e.defaultPrevented) {
      // eslint-disable-next-line no-console
      console.warn(`${TAG} ⚠ this touchmove was defaultPrevented → a JS handler is blocking native scroll. Target:`, describe(e.target));
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    // eslint-disable-next-line no-console
    console.log(`${TAG} touchend — net scrollYΔ=${window.scrollY - startY}`);
  }, { passive: true });

  // 3) On-demand full dump.
  window.__scrollDebug = () => dumpState('manual');

  dumpState('load');
  // eslint-disable-next-line no-console
  console.log(`${TAG} installed. Reproduce the bug, then read the warnings above. Call window.__scrollDebug() any time.`);
}
