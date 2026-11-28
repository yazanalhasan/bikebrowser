/**
 * The name of the place you are in, printed where nothing can cover it.
 *
 * Plan 0.12. Every scene drew its own title as a world object — centred
 * on the world's width, at depth 5. That is fine on a desktop window
 * showing the whole room and wrong everywhere else: on a 390px phone the
 * camera shows a slice, so "🏟️ Sports Fields" ended up 83% behind a
 * cottonwood, "🏜️ Desert Trail" ran under the HUD's icon rail, and a
 * child walking past could stand on the name of the place.
 *
 * A title is a heading, not scenery. This pins it to the screen, in the
 * band between the top-left buttons and the right-hand rail, in the
 * reserved UI depth band, and re-places it when the window changes.
 *
 * No scene imports; takes the scene it is given.
 */
import { HUD_RAIL_WIDTH, PANEL_TEXT_DEPTH } from '../systems/labelLayout.js';

/** Home and Back, plus a margin. Measured on the running HUD. */
export const HUD_TOP_LEFT_WIDTH = 110;

/** How far down the screen the heading sits. */
const TITLE_SCREEN_Y = 26;

/** Shrink rather than collide: the smallest the heading may go. */
const MIN_FONT_PX = 13;
const MAX_FONT_PX = 20;

/**
 * Add a screen-fixed scene heading.
 *
 * @param {Phaser.Scene} scene
 * @param {string} text  e.g. '🏜️ Dry Wash'
 * @param {{color?: string, stroke?: string}} [style]
 * @returns {Phaser.GameObjects.Text}
 */
export function addSceneTitle(scene, text, style = {}) {
  const label = scene.add.text(0, 0, text, {
    fontSize: `${MAX_FONT_PX}px`,
    fontFamily: 'sans-serif',
    fontStyle: 'bold',
    color: style.color || '#1f2937',
    stroke: style.stroke || '#ffffff',
    strokeThickness: 3,
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(PANEL_TEXT_DEPTH);

  const place = () => {
    const cam = scene.cameras.main;
    if (!cam) return;
    const ox = cam.width / 2;
    const oy = cam.height / 2;

    // The band the heading may use, in screen pixels.
    const left = HUD_TOP_LEFT_WIDTH;
    const right = cam.width - HUD_RAIL_WIDTH;
    const band = Math.max(80, right - left);

    // Fit, then centre in the band.
    let size = MAX_FONT_PX;
    label.setFontSize(`${size}px`);
    while (label.width > band && size > MIN_FONT_PX) {
      size -= 1;
      label.setFontSize(`${size}px`);
    }

    const screenX = left + band / 2;
    // scrollFactor 0 is not screen space: the camera still scales by
    // zoom about its own centre, so the screen position has to be
    // converted back into the coordinates Phaser will transform.
    label.setPosition(
      (screenX - ox) / cam.zoom + ox,
      (TITLE_SCREEN_Y - oy) / cam.zoom + oy,
    );
  };

  place();
  scene.scale.on('resize', place);
  scene.events.once('shutdown', () => scene.scale.off('resize', place));
  // The camera's zoom is set after create() in some scenes.
  scene.time.delayedCall(0, place);

  return label;
}
