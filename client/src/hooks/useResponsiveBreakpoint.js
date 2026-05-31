import { useEffect } from 'react';
import { breakpointForWidth } from '../lib/visualTemplateBuilder';

/**
 * Drives the active responsive breakpoint on a rendered template.
 *
 * The renderer (visualBuilderToHtml) emits a `.visual-template-root` with
 * `data-responsive="1"` and per-breakpoint CSS scoped to `[data-bp="…"]`.
 * This hook sets that `data-bp` attribute so the right artboard + block
 * overrides activate:
 *   • `forced` set  → the editor's preview selection (mobile/tablet/desktop),
 *                     regardless of how small the canvas is.
 *   • `forced` null → published/auto: pick the breakpoint from the host's
 *                     own width (container-query style) and keep it in sync
 *                     on resize, so a saved design adapts on every device.
 *
 * Legacy (non-responsive) templates have no `data-responsive` root, so this
 * is a no-op for them — their original rendering is untouched.
 *
 * @param {{current: HTMLElement|null}} containerRef host element wrapping the markup
 * @param {string} markup the dangerouslySetInnerHTML string (re-runs when it changes)
 * @param {('mobile'|'tablet'|'desktop'|null|undefined)} forced optional forced breakpoint
 */
export function useResponsiveBreakpoint(containerRef, markup, forced) {
  useEffect(() => {
    const host = containerRef?.current;
    if (!host) return undefined;
    const root = host.querySelector('.visual-template-root[data-responsive="1"]');
    if (!root) return undefined; // legacy template — nothing to drive

    const apply = () => {
      const bp = forced || breakpointForWidth(host.getBoundingClientRect().width);
      if (root.getAttribute('data-bp') !== bp) root.setAttribute('data-bp', bp);
    };
    apply();

    if (forced || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(apply);
    ro.observe(host);
    return () => ro.disconnect();
  }, [containerRef, markup, forced]);
}
