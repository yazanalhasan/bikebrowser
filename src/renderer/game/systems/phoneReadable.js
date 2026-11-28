/**
 * On a phone, nothing is drawn too small to read or too small to tap.
 *
 * Plan 0.5. The lab rigs are laid out in a design space and the camera
 * fits that space to the screen, so the size a child actually sees is
 * `fontSize * zoom` — and in portrait that zoom is just under 1. Every
 * 9, 10 and 11px label in the rig and its stations therefore landed
 * between 8.8 and 10.7 CSS px, under the plan's floor of 10 for labels
 * and 12 for anything that reads as a sentence. The slow-replay toggle
 * is 160x24 and the beaker is 30x36: fine under a mouse, a miss under
 * a finger.
 *
 * Rather than edit thirty call sites across five files (and miss the
 * next one), the scene raises its own floor: while a rig is in
 * portrait its text factory bumps any size that would land under the
 * floor, and a sweep after the world is built grows the hit area of
 * any control a finger would miss.
 *
 * It only ever makes things bigger. No art is resized, nothing moves,
 * and in landscape none of it runs.
 */
import Phaser from 'phaser';

/** The plan's floors, in CSS pixels. */
export const MIN_LABEL_PX = 10;
export const MIN_BODY_PX = 12;
export const MIN_TAP_PX = 44;

/** A sentence, rather than a label. */
const BODY_WORDS = 4;

/** The floor for a given string. */
export function floorFor(text) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  // An empty string at creation is a readout waiting to be filled —
  // the Force/Strain/Stress line and the teaching callout are both
  // created blank and set later, and judging them as "no words" left
  // them at the label floor while they went on to hold a sentence.
  if (words === 0) return MIN_BODY_PX;
  return words >= BODY_WORDS ? MIN_BODY_PX : MIN_LABEL_PX;
}

/**
 * Raise this scene's text floor for as long as it lives.
 *
 * Patches the scene's own GameObjectFactory, which Phaser creates per
 * scene, so nothing outside this scene is affected. The station
 * modules call `scene.add.text` too, which is the point — they are
 * covered without having to know about any of this.
 *
 * @param {Phaser.Scene} scene
 * @param {number} zoom the camera zoom the design space is fitted at
 */
export function enforceReadableText(scene, zoom) {
  if (!scene?.add?.text || scene._readableTextInstalled) return;
  if (!zoom || zoom <= 0) return;
  scene._readableTextInstalled = true;

  const original = scene.add.text.bind(scene.add);
  scene.add.text = (x, y, text, style, ...rest) => {
    const next = { ...(style || {}) };
    const current = parseFloat(next.fontSize ?? '12');
    if (Number.isFinite(current)) {
      const needed = Math.ceil(floorFor(text) / zoom);
      if (current < needed) next.fontSize = `${needed}px`;
    }
    return original(x, y, text, next, ...rest);
  };
}

/**
 * Grow the hit area of every control a finger would miss.
 *
 * Run after the world is built. The drawn object keeps its size; only
 * the area that answers a tap grows, centred on the object, so the
 * layout is untouched.
 *
 * @param {Phaser.Scene} scene
 * @param {number} zoom
 * @returns {number} how many controls were grown
 */
export function expandSmallTapTargets(scene, zoom) {
  if (!zoom || zoom <= 0) return 0;
  const need = MIN_TAP_PX / zoom;
  let grown = 0;

  const visit = (list) => {
    for (const obj of list) {
      if (obj.type === 'Container') { visit(obj.list || []); continue; }
      if (!obj.input || !obj.setInteractive) continue;
      const dw = obj.displayWidth || 0;
      const dh = obj.displayHeight || 0;
      if (dw < 4 || dh < 4) continue;          // a decorative hit area
      if (dw >= need && dh >= need) continue;

      const w = Math.max(dw, need);
      const h = Math.max(dh, need);
      // The hit rectangle is in the object's own local space, so it is
      // offset by the origin it was drawn with.
      const ox = (obj.originX ?? 0.5) * dw;
      const oy = (obj.originY ?? 0.5) * dh;
      const rect = new Phaser.Geom.Rectangle(ox - w / 2, oy - h / 2, w, h);

      // Mutate the live hit area. Two tidier-looking routes do nothing
      // on an object that is already interactive, and both were tried
      // here first: `setInteractive(rect, …)` goes through
      // `InputPlugin.enable`, which only re-enables the object and
      // drops the new hit area, and `input.setHitArea(obj, rect, …)`
      // left `input.hitArea` untouched as well. Both reported success.
      const area = obj.input.hitArea;
      if (area?.setTo) {
        area.setTo(rect.x, rect.y, rect.width, rect.height);
      } else {
        continue;
      }
      grown += 1;
    }
  };
  visit(scene.children.list);
  return grown;
}
