/**
 * Decide how a local scene camera should frame its room.
 *
 * A window that can already hold the room scales it up so the garage fills
 * the screen. A phone does not shrink the room to a stamp: it stays at 1x
 * and the camera follows Zuzu, centered on any axis that has spare space.
 *
 * @param {{ camWidth: number, camHeight: number, worldWidth: number, worldHeight: number }} size
 * @returns {{ mode: 'fit' | 'follow', zoom: number }}
 */
export const MAX_FIT_ZOOM = 1.8;

export function localCameraFit({ camWidth, camHeight, worldWidth, worldHeight }) {
  const width = Math.max(1, camWidth);
  const height = Math.max(1, camHeight);
  const worldW = Math.max(1, worldWidth);
  const worldH = Math.max(1, worldHeight);
  const containZoom = Math.min(width / worldW, height / worldH);

  if (containZoom >= 1) {
    return {
      mode: 'fit',
      zoom: Math.min(containZoom, MAX_FIT_ZOOM),
    };
  }

  return { mode: 'follow', zoom: 1 };
}
