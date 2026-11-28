/**
 * Labels step out from under the HUD.
 *
 * Plan 0.12. The HUD is DOM drawn on top of the canvas, so no Phaser
 * depth reaches above it: a world label that lands under the icon rail,
 * the d-pad or the chat button is simply unreadable, and on a 390px
 * phone the rail alone eats a seventh of the width. Moving the labels is
 * the only lever there is.
 *
 * Every label in the sign and name-tag bands is a candidate — those
 * depths already mean "text a child has to be able to read". Each one
 * keeps its authored position in `hudHomeX` and returns to it the moment
 * the HUD is no longer in the way, so nothing drifts permanently.
 *
 * Horizontal only: a name tag that jumps up and down as its character
 * walks reads as a glitch, while sliding sideways reads as the label
 * getting out of the way.
 *
 * No scene imports; takes the scene it is given.
 */
import { hudReservedRects } from '../ui/safeZones.js';
import {
  WORLD_SIGN_ART_DEPTH, COMPANION_PROMPT_DEPTH,
} from './labelLayout.js';

/** The depth range this pass looks after. */
const FIRST = WORLD_SIGN_ART_DEPTH;
const LAST = COMPANION_PROMPT_DEPTH;

const MARGIN = 4;

/**
 * Nudge every band label clear of the HUD. Call once per frame.
 *
 * @param {Phaser.Scene} scene
 */
export function dodgeHud(scene) {
  const cam = scene.cameras?.main;
  if (!cam) return;
  const rects = hudReservedRects(cam.width, cam.height);
  const ox = cam.width / 2;

  for (const obj of scene.children.list) {
    const depth = obj.depth ?? 0;
    if (depth < FIRST || depth > LAST) continue;
    collect(obj).forEach((text) => nudge(text, cam, ox, rects));
  }
}

/** A label, or the labels inside a container. */
function collect(obj) {
  if (obj.type === 'Text' || obj.type === 'BitmapText') return [obj];
  if (obj.type === 'Container') return (obj.list || []).flatMap(collect);
  return [];
}

function nudge(text, cam, ox, rects) {
  if (!text.visible || !text.displayWidth) return;

  // Work in deltas, not absolute positions. A label inside a container
  // ("Ramirez House" is) carries a LOCAL x, so computing a world
  // position from it and writing it back moves the label somewhere else
  // entirely. `getBounds()` is world space whatever the parent is, and a
  // shift applied to `x` moves the label by that much either way.
  let home = text.getData('hudHomeX');
  if (home == null) {
    home = text.x;
    text.setData('hudHomeX', home);
  }
  if (text.x !== home) text.setX(home);

  const b = text.getBounds();
  const sfx = text.scrollFactorX ?? 1;
  const sfy = text.scrollFactorY ?? 1;
  const oy = cam.height / 2;
  const toScreenX = (wx) => (wx - cam.scrollX * sfx - ox) * cam.zoom + ox;
  const top = (b.y - cam.scrollY * sfy - oy) * cam.zoom + oy;
  const bottom = (b.y + b.height - cam.scrollY * sfy - oy) * cam.zoom + oy;

  const left = toScreenX(b.x);
  const width = toScreenX(b.x + b.width) - left;

  const inTheWay = rects.filter((r) => bottom > r.y && top < r.y + r.h);
  const hits = (x) => inTheWay.some((r) => x < r.x + r.w && x + width > r.x);
  if (!hits(left)) return;

  // Try every edge of every blocking rect, nearest first, and take the
  // first landing spot that is clear of ALL of them and still on
  // screen. Shifting blindly away from one block is how a label that
  // was under the right-hand rail ended up under Home and Back
  // instead.
  const candidates = [];
  for (const r of inTheWay) {
    candidates.push(r.x - MARGIN - width);  // left of it
    candidates.push(r.x + r.w + MARGIN);    // right of it
  }
  candidates.sort((a, c) => Math.abs(a - left) - Math.abs(c - left));

  for (const x of candidates) {
    if (x < 0 || x + width > cam.width) continue;
    if (hits(x)) continue;
    text.setX(home + (x - left) / cam.zoom);
    return;
  }

  // No room sideways. That happens against the two full-width strips —
  // the scene heading across the top, and the d-pad and action button
  // across the bottom — where the only way out is up or down. The
  // heading hid "🌊 Deep Water" at Lake Edge; the bottom pair hid the
  // way out of the Sports Fields on a phone.
  let homeY = text.getData('hudHomeY');
  if (homeY == null) {
    homeY = text.y;
    text.setData('hudHomeY', homeY);
  }
  if (text.y !== homeY) text.setY(homeY);

  const height = bottom - top;
  const hitsY = (y) => rects.some((r) => (
    y < r.y + r.h && y + height > r.y
    && left < r.x + r.w && left + width > r.x));
  if (!hitsY(top)) return;

  const yCandidates = [];
  for (const r of rects) {
    if (left >= r.x + r.w || left + width <= r.x) continue;
    yCandidates.push(r.y - MARGIN - height);
    yCandidates.push(r.y + r.h + MARGIN);
  }
  yCandidates.sort((a, c) => Math.abs(a - top) - Math.abs(c - top));
  for (const y of yCandidates) {
    if (y < 0 || y + height > cam.height) continue;
    if (hitsY(y)) continue;
    text.setY(homeY + (y - top) / cam.zoom);
    return;
  }
  // Nowhere clear at all: leave it where the author put it rather than
  // move it under something else and call that a fix.
}
