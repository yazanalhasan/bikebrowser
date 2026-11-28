/**
 * Scene Safe Zones — defines reserved UI overlay regions.
 *
 * The game HUD renders floating React overlays on top of the Phaser canvas.
 * Scene builders must place important interactables OUTSIDE these reserved
 * zones so they remain visible and clickable.
 *
 * Zone layout (approximate, in pixels from edge):
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │ TL_ZONE (nav+quest)    │         │  TR_ZONE (btns)  │
 *   │ 140×110                │         │  260×110         │
 *   ├────────────────────────┤  TOP    ├──────────────────┤
 *   │                        │  STRIP  │                  │
 *   │                        │  110px  │                  │
 *   ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼─────────┼─ ─ ─ ─ ─ ─ ─ ─ ┤
 *   │                                                     │
 *   │              GAMEPLAY SAFE ZONE                     │
 *   │                                                     │
 *   ├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
 *   │ BL_ZONE (d-pad)       │         │  BR_ZONE (action)│
 *   │ 180×200               │         │  90×90           │
 *   └─────────────────────────────────────────────────────┘
 *
 * Usage in a scene:
 *   import { getSafeZone, isInSafeZone } from '../ui/safeZones.js';
 *   const safe = getSafeZone(width, height);
 *   // Place workbench at safe.playArea.left + offset, safe.playArea.top + offset
 */

/** Reserved overlay sizes (px from edge). */
const UI_ZONES = {
  // Top-left: Home/Back buttons + quest tracker + Zuzubucks
  topLeft: { width: 150, height: 110 },
  // Top-right: HUD button cluster (quest board, shop, inventory, notebook, audio, pause)
  topRight: { width: 280, height: 110 },
  // Bottom-left: virtual d-pad
  bottomLeft: { width: 180, height: 200 },
  // Bottom-right: action/interact button
  bottomRight: { width: 90, height: 90 },
  // General top strip (minimum clearance for any UI)
  topStrip: 110,
  // General bottom strip (minimum clearance for touch controls)
  bottomStrip: 80,
};

/**
 * Compute the gameplay-safe rectangle for a given scene size.
 * Objects placed inside this rectangle will not be covered by overlays.
 *
 * @param {number} sceneWidth
 * @param {number} sceneHeight
 * @returns {{ playArea: {left,top,right,bottom,width,height,centerX,centerY}, zones: object }}
 */
export function getSafeZone(sceneWidth, sceneHeight) {
  const left = UI_ZONES.topLeft.width + 10;
  const top = UI_ZONES.topStrip + 10;
  const right = sceneWidth - UI_ZONES.topRight.width - 10;
  const bottom = sceneHeight - UI_ZONES.bottomStrip - 10;

  return {
    playArea: {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      centerX: (left + right) / 2,
      centerY: (top + bottom) / 2,
    },
    zones: UI_ZONES,
    // Wall insets (where walls are drawn)
    walls: { top: 50, left: 50, right: sceneWidth - 50, bottom: sceneHeight },
  };
}


/**
 * The HUD's reserved rectangles, in SCREEN pixels, for a given camera.
 *
 * The zone table above describes the HUD as four corner blocks, which it
 * no longer is: the buttons moved into a vertical rail down the right
 * edge (ten 44px buttons from y=56), and the chat button sits on its own
 * in the bottom-right. Plan 0.12 needs the real boxes, because world
 * labels have to be kept out of them — depth cannot help when the thing
 * on top is the page itself.
 *
 * Measured on the running HUD at 1280x720 and 390x844; the HUD does not
 * scale with the viewport, so these are absolute.
 *
 * @param {number} camWidth
 * @param {number} camHeight
 * @returns {Array<{x:number,y:number,w:number,h:number,name:string}>}
 */
export function hudReservedRects(camWidth, camHeight) {
  return [
    // Home / Back, the goals chip and the quest card.
    { x: 0, y: 0, w: UI_ZONES.topLeft.width, h: UI_ZONES.topLeft.height, name: 'top-left' },
    // The icon rail.
    {
      x: camWidth - HUD_RAIL_PX, y: 40,
      w: HUD_RAIL_PX, h: Math.max(0, camHeight - 140),
      name: 'rail',
    },
    // The d-pad.
    {
      x: 0, y: camHeight - UI_ZONES.bottomLeft.height,
      w: UI_ZONES.bottomLeft.width, h: UI_ZONES.bottomLeft.height, name: 'd-pad',
    },
    // The chat / action button.
    {
      x: camWidth - UI_ZONES.bottomRight.width, y: camHeight - UI_ZONES.bottomRight.height,
      w: UI_ZONES.bottomRight.width, h: UI_ZONES.bottomRight.height, name: 'action',
    },
    // The scene heading. Not HUD — it is drawn in Phaser — but it is
    // screen-fixed in the same way, and a world label that drifts under
    // it is just as unreadable: "🌊 Deep Water" at Lake Edge was 46%
    // behind the title.
    {
      x: UI_ZONES.topLeft.width, y: 0,
      w: Math.max(0, camWidth - UI_ZONES.topLeft.width - HUD_RAIL_PX), h: 46,
      name: 'heading',
    },
  ];
}

/** Width of the right-hand icon rail, in screen pixels. */
export const HUD_RAIL_PX = 56;

/**
 * Check whether a point is inside the gameplay-safe area.
 * @param {number} x
 * @param {number} y
 * @param {number} sceneWidth
 * @param {number} sceneHeight
 * @returns {boolean}
 */
export function isInSafeZone(x, y, sceneWidth, sceneHeight) {
  const { playArea } = getSafeZone(sceneWidth, sceneHeight);
  return x >= playArea.left && x <= playArea.right &&
         y >= playArea.top && y <= playArea.bottom;
}

/**
 * Draw debug rectangles showing reserved UI zones.
 * Call from scene.create() during development.
 *
 * @param {Phaser.Scene} scene
 */
export function drawDebugZones(scene) {
  const { width, height } = scene.scale;
  const g = scene.add.graphics().setDepth(999).setAlpha(0.25);

  // Top-left (red)
  g.fillStyle(0xff0000);
  g.fillRect(0, 0, UI_ZONES.topLeft.width, UI_ZONES.topLeft.height);

  // Top-right (blue)
  g.fillStyle(0x0000ff);
  g.fillRect(width - UI_ZONES.topRight.width, 0, UI_ZONES.topRight.width, UI_ZONES.topRight.height);

  // Bottom-left (green)
  g.fillStyle(0x00ff00);
  g.fillRect(0, height - UI_ZONES.bottomLeft.height, UI_ZONES.bottomLeft.width, UI_ZONES.bottomLeft.height);

  // Bottom-right (yellow)
  g.fillStyle(0xffff00);
  g.fillRect(width - UI_ZONES.bottomRight.width, height - UI_ZONES.bottomRight.height,
    UI_ZONES.bottomRight.width, UI_ZONES.bottomRight.height);

  // Safe play area (white outline)
  const safe = getSafeZone(width, height);
  g.lineStyle(2, 0xffffff, 0.6);
  g.strokeRect(safe.playArea.left, safe.playArea.top,
    safe.playArea.width, safe.playArea.height);

  return g;
}
