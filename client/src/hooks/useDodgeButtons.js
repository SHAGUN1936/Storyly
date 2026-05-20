import { useEffect } from 'react';

function distPointToRect(px, py, rect) {
  const cx = Math.max(rect.left, Math.min(px, rect.right));
  const cy = Math.max(rect.top, Math.min(py, rect.bottom));
  return Math.hypot(px - cx, py - cy);
}

/**
 * Buttons with class `tpl-btn-dodge` start shifting while the pointer is still *outside* the hitbox
 * (outer ring), so the cursor often never lands on them. Clicks are still blocked (navigation).
 * Attach to the same DOM root that wraps `dangerouslySetInnerHTML` markup.
 */
export function useDodgeButtons(containerRef, deps) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;

    const getBoundsEl = (btn) => {
      const page = btn.closest('.page');
      if (page) return page;
      return btn.closest('.visual-template-root') || root;
    };

    const isBtnActiveInDeck = (btn) => {
      const page = btn.closest('.page');
      if (!page) return true;
      return page.classList.contains('active');
    };

    const onMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      root.querySelectorAll('.tpl-btn-dodge').forEach((btn) => {
        if (!isBtnActiveInDeck(btn)) return;

        const rect = btn.getBoundingClientRect();
        if (rect.width < 2 && rect.height < 2) return;

        const dist = distPointToRect(clientX, clientY, rect);
        /**
         * React while cursor is still *approaching* (before it sits on the button).
         * dist = distance from pointer to nearest edge/corner of the button (0 = inside).
         */
        const OUTER = 118;
        if (dist >= OUTER) return;

        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        const vx = cx - clientX;
        const vy = cy - clientY;
        const len = Math.hypot(vx, vy) || 1;
        /** Stronger nudge as cursor gets closer — still capped below */
        let nudge = 11;
        if (dist < 22) nudge = 22;
        else if (dist < 48) nudge = 17;
        else if (dist < 78) nudge = 14;
        const stepX = (vx / len) * nudge;
        const stepY = (vy / len) * nudge;

        let ox = parseFloat(btn.dataset.dodgeX || '0');
        let oy = parseFloat(btn.dataset.dodgeY || '0');
        if (Number.isNaN(ox)) ox = 0;
        if (Number.isNaN(oy)) oy = 0;
        ox += stepX;
        oy += stepY;

        /** Stay near original layout — enough room to sidestep the pointer */
        const MAX_SHIFT = 48;
        ox = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, ox));
        oy = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, oy));

        btn.style.transform = `translate(${ox}px, ${oy}px)`;
        btn.dataset.dodgeX = String(ox);
        btn.dataset.dodgeY = String(oy);

        const bounds = getBoundsEl(btn);
        if (!bounds) return;

        requestAnimationFrame(() => {
          const br = btn.getBoundingClientRect();
          const pr = bounds.getBoundingClientRect();
          let ax = 0;
          let ay = 0;
          if (br.left < pr.left) ax += pr.left - br.left + 6;
          if (br.right > pr.right) ax -= br.right - pr.right + 6;
          if (br.top < pr.top) ay += pr.top - br.top + 6;
          if (br.bottom > pr.bottom) ay -= br.bottom - pr.bottom + 6;
          if (ax !== 0 || ay !== 0) {
            ox += ax;
            oy += ay;
            ox = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, ox));
            oy = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, oy));
            btn.style.transform = `translate(${ox}px, ${oy}px)`;
            btn.dataset.dodgeX = String(ox);
            btn.dataset.dodgeY = String(oy);
          }
        });
      });
    };

    const onClickCapture = (e) => {
      const dodge = e.target?.closest?.('.tpl-btn-dodge');
      if (dodge && root.contains(dodge) && isBtnActiveInDeck(dodge)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    /** Finger down: react before drag, so the tap often misses the button */
    window.addEventListener('touchstart', onMove, { passive: true });
    root.addEventListener('click', onClickCapture, true);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchstart', onMove);
      root.removeEventListener('click', onClickCapture, true);
    };
  }, deps);
}
