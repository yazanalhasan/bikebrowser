/**
 * Decide how a local scene camera should frame its room.
 *
 * **The room always fills the screen width.** That is the whole rule, and it
 * is what the owner asked for (2026-11-26): no dark or brown side bands on a
 * landscape window, and a phone that shows the whole room across rather than
 * a zoomed-in slice of it.
 *
 * What used to happen, and why it was wrong:
 *
 * - The old fit was a *contain* fit — `min(w/worldW, h/worldH)` — so a
 *   1280x720 window showed the 800x600 garage at zoom 1.2, which is 960px
 *   wide, leaving 320px of empty band. Home Street left 251px.
 * - Below zoom 1 it gave up entirely and pinned zoom to 1, so a 390px-wide
 *   phone showed 390px of an 800px-wide room: the workbench, both labs, the
 *   notebook and the door were all off-screen, with a dead band under the
 *   room behind the D-pad.
 *
 * Filling the width means the vertical axis is whatever is left over:
 *
 * - If the room is taller than the view (`followY`), the camera follows Zuzu
 *   vertically, clamped to the world so it never shows past the walls.
 * - If the room is shorter than the view, it is centred and nothing moves.
 *
 * @param {{ camWidth: number, camHeight: number, worldWidth: number,
 *           worldHeight: number, mode?: 'cover'|'contain' }} size
 * @returns {{ zoom: number, followY: boolean, viewWidth: number, viewHeight: number,
 *             fillsWidth: boolean }}
 */

/**
 * Upper bound on zoom. Only bites on very large displays — a 4K window would
 * otherwise blow an 800px room up past 4x. When it bites, the room is centred
 * horizontally and thin side bands come back; that is the one case where
 * bands are preferable to the alternative.
 */
export const MAX_FIT_ZOOM = 3;

export function localCameraFit({
  camWidth, camHeight, worldWidth, worldHeight, mode = 'cover',
}) {
  const width = Math.max(1, camWidth);
  const height = Math.max(1, camHeight);
  const worldW = Math.max(1, worldWidth);
  const worldH = Math.max(1, worldHeight);

  const widthZoom = width / worldW;

  // `contain` is for rooms that are really a control panel — the Materials
  // Lab and the Thermal Lab. Filling the width there crops the room
  // vertically and makes the camera chase Zuzu, so the material list and the
  // START TEST button are never on screen at the same time and the child has
  // to walk the room to reach a button. Those scenes show everything at once
  // and never follow.
  const zoom = mode === 'contain'
    ? Math.min(Math.min(widthZoom, height / worldH), MAX_FIT_ZOOM)
    : Math.min(widthZoom, MAX_FIT_ZOOM);

  const viewWidth = width / zoom;
  const viewHeight = height / zoom;

  return {
    mode,
    zoom,
    // Only follow when the room is genuinely taller than what fits, and
    // never in contain mode — there the whole room is on screen by
    // construction.
    followY: mode !== 'contain' && viewHeight < worldH,
    viewWidth,
    viewHeight,
    fillsWidth: mode !== 'contain' && zoom === widthZoom,
    // True when the entire room is visible on both axes.
    showsWholeRoom: viewWidth >= worldW - 1e-9 && viewHeight >= worldH - 1e-9,
  };
}

/**
 * Where the camera should be CENTRED for a given fit.
 *
 * Centre, not scroll, on purpose. Phaser's `camera.scrollX` is the left edge
 * of the *unzoomed* viewport, and zoom pivots about the viewport midpoint —
 * so at zoom 1.92 `setScroll(0, …)` does not put world x=0 at the left edge,
 * it puts the room 883px off the left of a 1920px canvas. (That is exactly
 * the bug this helper was written to fix: the room was scaled correctly and
 * positioned wrongly, so only ~1038px of it landed on screen.) `centerOn`
 * does the conversion for us, so the camera is driven by the one number that
 * means the same thing at every zoom.
 *
 * `focusX` / `focusY` are the player's position; pass the room centre when
 * there is no player yet.
 *
 * @returns {{ centerX: number, centerY: number }} world-space view centre
 */
export function localCameraCenter({
  fit, worldWidth, worldHeight, focusX, focusY,
}) {
  const worldW = Math.max(1, worldWidth);
  const worldH = Math.max(1, worldHeight);
  const clamp = (v, lo, hi) => (hi < lo ? (lo + hi) / 2 : Math.min(Math.max(v, lo), hi));

  const halfW = fit.viewWidth / 2;
  const halfH = fit.viewHeight / 2;

  // When the view is at least as big as the room on an axis, centre the room
  // on that axis. Otherwise track the player, stopping at the walls.
  const centerX = fit.viewWidth >= worldW
    ? worldW / 2
    : clamp(focusX, halfW, worldW - halfW);
  const centerY = fit.viewHeight >= worldH
    ? worldH / 2
    : clamp(focusY, halfH, worldH - halfH);

  return { centerX, centerY };
}
