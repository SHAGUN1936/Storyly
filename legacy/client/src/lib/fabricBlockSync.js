/* ───────────────────────────────────────────────────────────────────
   fabricBlockSync — the SINGLE source of coordinate truth between a
   Fabric.js object (edit-time control proxy) and a builderState block.

   The Admin Builder stores each block center-anchored as:
     • xPct / yPct   — 0..100, percentage of the artboard (design) box
     • width/height  — explicit DESIGN px (or empty = auto-sized)
     • rotateDeg     — -180..180

   The Fabric canvas works in CANVAS px (its own pixel size, which equals
   the on-screen preview box). We bridge the two with a single scale:

       scale = canvasW / designW   (canvasH / designH is the same ratio,
                                     the preview keeps the artboard aspect)

   These helpers are PURE so the conversion can be reasoned about and unit
   tested in isolation; the React component only does DOM/Fabric plumbing.
   Crucially, the commit values produced here are fed into the SAME
   `updateBuilderBlockPositionPctSynced / SizeSynced / RotateSynced`
   functions the existing editor already uses — so the persisted data
   structure is byte-for-byte unchanged.
   ─────────────────────────────────────────────────────────────────── */

/** Geometry of the live HTML block (read from the preview DOM) expressed
 *  in CANVAS px, relative to the canvas's top-left. Center-origin. */
export function domRectToProxy(blockRect, canvasRect) {
  const left = blockRect.left - canvasRect.left;
  const top = blockRect.top - canvasRect.top;
  return {
    centerX: left + blockRect.width / 2,
    centerY: top + blockRect.height / 2,
    width: Math.max(1, blockRect.width),
    height: Math.max(1, blockRect.height),
  };
}

/** Fabric object → the values the existing commit functions expect.
 *  `dims` = { canvasW, canvasH, designW, designH }.
 *  Returns center in canvas px (for the move commit, which divides by
 *  canvasW/H to get %) and width/height back in DESIGN px (for the size
 *  commit, which stores design px). */
export function objectToCommit(obj, dims) {
  const { canvasW, canvasH, designW } = dims;
  const center = obj.getCenterPoint(); // canvas px, accounts for origin/scale
  const scale = canvasW > 0 && designW > 0 ? canvasW / designW : 1;
  const scaledW = obj.getScaledWidth();
  const scaledH = obj.getScaledHeight();
  return {
    // move: pass canvas-px center + canvas dims → existing code computes
    //       xPct = centerX / canvasW * 100 (identical to a drag release).
    moveX: center.x,
    moveY: center.y,
    refW: canvasW,
    refH: canvasH,
    // size: convert canvas px → design px so it lands in the same space
    //       the renderer measures against.
    designW: scale > 0 ? scaledW / scale : scaledW,
    designH: scale > 0 ? scaledH / scale : scaledH,
    // rotation: degrees, clamped to the same -180..180 range the UI uses.
    deg: clampDeg(Math.round(obj.angle || 0)),
  };
}

/** Group-aware variant: takes ABSOLUTE geometry already resolved from a
 *  Fabric transform matrix (works for a lone object OR a child inside an
 *  ActiveSelection, where left/top/scale/angle are group-relative and must
 *  be decomposed via calcTransformMatrix()+qrDecompose() first).
 *  geom = { centerX, centerY, scaledW, scaledH, angle } in CANVAS px/deg. */
export function geometryToCommit(geom, dims) {
  const { canvasW, designW } = dims;
  const scale = canvasW > 0 && designW > 0 ? canvasW / designW : 1;
  return {
    moveX: geom.centerX,
    moveY: geom.centerY,
    refW: dims.canvasW,
    refH: dims.canvasH,
    designW: scale > 0 ? geom.scaledW / scale : geom.scaledW,
    designH: scale > 0 ? geom.scaledH / scale : geom.scaledH,
    deg: clampDeg(Math.round(geom.angle || 0)),
  };
}

export function clampDeg(d) {
  let v = ((d % 360) + 360) % 360; // 0..359
  if (v > 180) v -= 360; // -180..180
  return v;
}

/** Snap a canvas-px value to a grid (in canvas px). 0/undefined = no snap. */
export function snap(value, gridPx) {
  if (!gridPx || gridPx <= 0) return value;
  return Math.round(value / gridPx) * gridPx;
}

/** The block "slot" string the rest of the editor uses: p{page+1}_b{index}. */
export function slotFor(pageIndex, blockIndex) {
  return `p${pageIndex + 1}_b${blockIndex}`;
}
