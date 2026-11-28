/**
 * Fit a fixed-design overlay scene to whatever viewport it lands in.
 *
 * The explainer and the cognitive-quest overlays are authored in an 800x600
 * design space and were drawn straight into it with no camera work at all.
 * On a 1280x720 window that put the panel in the top-left corner with the
 * street showing beside it; at 1024x484 the answers and Continue were off
 * the bottom; on a 390x844 phone half the panel was off-screen. This is the
 * very first quest a child plays.
 *
 * Both overlays are `launch`ed in parallel over a paused game scene, so the
 * camera must stay transparent — the dimming is a drawn rectangle, and it
 * has to cover the whole viewport rather than the design rect, or the game
 * shows around the edges once the design space is centred.
 *
 * No scene imports.
 */

/** The coordinate space the overlay layouts are authored in. */
export const OVERLAY_DESIGN_WIDTH = 800;
export const OVERLAY_DESIGN_HEIGHT = 600;

/**
 * Never blow the panel up past this. A 4K window would otherwise render a
 * 720px-wide card at 3x and it would read as broken rather than large.
 */
export const OVERLAY_MAX_ZOOM = 1.6;

/**
 * Zoom that shows the whole design space, and the world rect that covers
 * the full viewport at that zoom.
 *
 * @param {{ camWidth: number, camHeight: number,
 *           designWidth?: number, designHeight?: number }} size
 * @returns {{ zoom: number, centerX: number, centerY: number,
 *             cover: { x: number, y: number, width: number, height: number } }}
 */
export function overlayCameraFit({
  camWidth, camHeight,
  designWidth = OVERLAY_DESIGN_WIDTH,
  designHeight = OVERLAY_DESIGN_HEIGHT,
}) {
  // A null or undefined design size means "the landscape one".
  designWidth = designWidth || OVERLAY_DESIGN_WIDTH;
  designHeight = designHeight || OVERLAY_DESIGN_HEIGHT;
  const width = Math.max(1, camWidth);
  const height = Math.max(1, camHeight);
  const dw = Math.max(1, designWidth);
  const dh = Math.max(1, designHeight);

  // Contain: the whole panel is visible on every screen.
  const zoom = Math.min(Math.min(width / dw, height / dh), OVERLAY_MAX_ZOOM);

  const centerX = dw / 2;
  const centerY = dh / 2;

  // What the camera can see, in design units, centred on the panel. The dim
  // is drawn to this so it reaches the edges of the screen at any aspect.
  const viewW = width / zoom;
  const viewH = height / zoom;

  return {
    zoom,
    centerX,
    centerY,
    cover: {
      x: centerX - viewW / 2,
      y: centerY - viewH / 2,
      width: viewW,
      height: viewH,
    },
  };
}

/**
 * Apply the fit to a Phaser camera and return it.
 *
 * Kept separate from the maths so the maths stays testable without Phaser.
 */
export function applyOverlayCameraFit(scene, design = null) {
  const cam = scene.cameras?.main;
  if (!cam) return null;
  // A scene on a phone passes its portrait design size, which is close to
  // the screen's own shape, so the fit is about 1:1 instead of 0.49.
  const fit = overlayCameraFit({
    camWidth: cam.width,
    camHeight: cam.height,
    designWidth: design?.designWidth,
    designHeight: design?.designHeight,
  });
  cam.setZoom(fit.zoom);
  cam.centerOn(fit.centerX, fit.centerY);
  return fit;
}

/**
 * Stretch a dim rectangle back over the whole viewport.
 *
 * The dim is sized in design units, so it goes stale the moment the window
 * changes shape: rotating a phone with the explainer open left the game
 * showing above and below the dim. Call this from the scene's resize hook.
 *
 * @param {object} rect a Phaser Rectangle, or null
 * @param {{ cover: { x: number, y: number, width: number, height: number } }} fit
 */
export function stretchOverlayDim(rect, fit) {
  if (!rect || !fit || typeof rect.setSize !== 'function') return;
  // Phaser reuses the scene object across visits, so a cached handle can
  // outlive the display object it points at. A destroyed one has no scene.
  if (!rect.scene) return;
  rect.setSize(fit.cover.width, fit.cover.height);
  rect.setPosition(
    fit.cover.x + fit.cover.width / 2,
    fit.cover.y + fit.cover.height / 2,
  );
}
