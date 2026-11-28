/**
 * Act 1 art helpers — the single way scenes put production art on screen.
 *
 * Scenes name an art slot (a texture key from `act1ArtRegistry.js`) and this
 * module resolves the anchor, depth and scale. Scenes never hard-code a file
 * path or a sprite origin, so re-cutting art is a data change (arc.md §4:
 * "visual tokens come from data so the licensed-asset import dispatch can
 * swap tokens without code changes").
 *
 * Pixel-art rule: textures are authored at their intended on-screen size, so
 * the default scale is 1 and nothing is resampled. When a call site needs a
 * different size (a layout that carries its own `size`), pass `maxPx` or
 * `displayHeight` and the helper picks a scale; `snap` keeps that scale on a
 * clean fraction so pixels stay square.
 */

import { ACT1_ART, ACT1_CHARACTER_SHEETS } from './act1ArtRegistry.js';
import { DEPTHS } from '../art/artConfig.js';

/**
 * Depth for a ground-standing sprite, matching the local scenes' Y-sort
 * convention so props interleave correctly with the player and NPCs: further
 * down the screen = in front.
 *
 * This deliberately mirrors `computeDepth` in systems/depthSort.js (base 10,
 * y/26, capped at 49) rather than the artConfig DEPTHS bands, which belong to
 * the newer src/game rendering stack. Returning a DEPTHS.props value here
 * would put every prop above the player, who sits at ~10-49 too.
 */
const SCENE_DEPTH_BASE = 10;
const SCENE_DEPTH_MAX = 49;

export function groundDepth(y) {
  return SCENE_DEPTH_BASE + Math.min(SCENE_DEPTH_MAX - SCENE_DEPTH_BASE, y / 26);
}

const warned = new Set();

function warnMissing(scene, key, where) {
  const id = `${key}@${where}`;
  if (warned.has(id)) return;
  warned.add(id);
  // Loud on purpose: a missing Act 1 texture means a placeholder is back.
  console.error(
    `[act1Art] texture "${key}" is not loaded (${where}). `
    + 'Did the scene call preloadAct1Art() in preload()?',
  );
}

/** True when the texture is loaded and usable. */
export function hasArt(scene, key) {
  return Boolean(key) && Boolean(scene?.textures?.exists?.(key));
}

/**
 * Resolve the scale for a sprite given the record and sizing options.
 * Returns 1 when no sizing option is supplied (authored size wins).
 */
function resolveScale(rec, opts) {
  const { maxPx, displayHeight, displayWidth, scale, snap = true } = opts;
  if (typeof scale === 'number') return scale;

  let s = 1;
  if (typeof displayHeight === 'number' && rec.height) s = displayHeight / rec.height;
  else if (typeof displayWidth === 'number' && rec.width) s = displayWidth / rec.width;
  else if (typeof maxPx === 'number') {
    const longest = Math.max(rec.width, rec.height);
    if (longest > 0) s = maxPx / longest;
  } else {
    return 1;
  }

  if (!snap || !Number.isFinite(s) || s <= 0) return s;
  // Keep pixels square-ish: snap to 1/4 steps, and to whole numbers above 1.
  if (s >= 1) return Math.max(1, Math.round(s));
  const snapped = Math.round(s * 4) / 4;
  return snapped > 0 ? snapped : s;
}

/**
 * Add an Act 1 art sprite.
 *
 * @param {Phaser.Scene} scene
 * @param {string} key    texture key from ACT1_ART
 * @param {number} x
 * @param {number} y      for 'ground' anchors this is the sprite's base line
 * @param {object} [opts]
 * @param {number} [opts.depth]          explicit depth; otherwise derived
 * @param {number} [opts.maxPx]          scale so the longest side is this many px
 * @param {number} [opts.displayHeight]  scale to this height
 * @param {number} [opts.displayWidth]   scale to this width
 * @param {number} [opts.scale]          explicit scale (wins over the above)
 * @param {boolean} [opts.snap=true]     snap the computed scale to keep pixels square
 * @param {number} [opts.alpha]
 * @param {boolean} [opts.flipX]
 * @param {'ground'|'icon'} [opts.anchor] override the registry anchor
 * @returns {Phaser.GameObjects.Image|null}
 */
export function addArt(scene, key, x, y, opts = {}) {
  const rec = ACT1_ART[key];
  if (!rec) {
    warnMissing(scene, key, 'not in ACT1_ART');
    return null;
  }
  if (!hasArt(scene, key)) {
    warnMissing(scene, key, 'texture missing');
    return null;
  }

  const img = scene.add.image(x, y, key);
  const anchor = opts.anchor || rec.anchor;
  if (anchor === 'ground') img.setOrigin(0.5, 1);
  else img.setOrigin(0.5, 0.5);

  const s = resolveScale(rec, opts);
  if (s !== 1) img.setScale(s);

  if (typeof opts.alpha === 'number') img.setAlpha(opts.alpha);
  if (opts.flipX) img.setFlipX(true);

  // Default depth keeps a ground prop in the scene's Y-sort band so it
  // interleaves with the player; icons sit just above the world.
  const depth = typeof opts.depth === 'number'
    ? opts.depth
    : anchor === 'ground' ? groundDepth(y) : SCENE_DEPTH_MAX + 1;
  img.setDepth(depth);

  return img;
}

/**
 * Frame to tile for a ground texture.
 *
 * A few of the delivered grounds carry a transparent border (the dry-wash and
 * salt-river plates are inset by 2-7 px). Tiled as-is, that border repeats as
 * a visible grid of gaps across the scene. The registry records the border as
 * `trim`, and this registers a once-per-texture frame cropped to the opaque
 * region so the texture repeats cleanly. Returns undefined for the common
 * case of a texture with no border, which tiles the full image.
 */
function tiledFrame(scene, key) {
  const rec = ACT1_ART[key];
  const trim = rec && rec.trim;
  if (!trim || !trim.some((n) => n > 0)) return undefined;

  const texture = scene.textures.get(key);
  if (!texture) return undefined;
  const name = 'tiled';
  if (!texture.has(name)) {
    const [l, t, r, b] = trim;
    const w = rec.width - l - r;
    const h = rec.height - t - b;
    if (w <= 0 || h <= 0) return undefined;
    texture.add(name, 0, l, t, w, h);
  }
  return name;
}

/**
 * Tile a seamless ground texture over a rectangle.
 *
 * @param {Phaser.Scene} scene
 * @param {string} key
 * @param {number} x top-left x
 * @param {number} y top-left y
 * @param {number} w
 * @param {number} h
 * @param {object} [opts]
 * @returns {Phaser.GameObjects.TileSprite|null}
 */
export function addGround(scene, key, x, y, w, h, opts = {}) {
  if (!hasArt(scene, key)) {
    warnMissing(scene, key, 'ground texture missing');
    return null;
  }
  const frame = tiledFrame(scene, key);
  const tile = scene.add.tileSprite(x, y, w, h, key, frame).setOrigin(0, 0);
  tile.setDepth(typeof opts.depth === 'number' ? opts.depth : DEPTHS.ground);
  if (typeof opts.alpha === 'number') tile.setAlpha(opts.alpha);
  if (typeof opts.scrollFactor === 'number') tile.setScrollFactor(opts.scrollFactor);
  return tile;
}

/**
 * Stretch a backdrop image to cover a rectangle. Used for the big 1920x1080
 * wall / water / sky plates, which are paintings rather than tiles.
 */
export function addBackdrop(scene, key, x, y, w, h, opts = {}) {
  if (!hasArt(scene, key)) {
    warnMissing(scene, key, 'backdrop texture missing');
    return null;
  }
  const img = scene.add.image(x, y, key).setOrigin(0, 0);
  img.setDisplaySize(w, h);
  img.setDepth(typeof opts.depth === 'number' ? opts.depth : DEPTHS.ground);
  if (typeof opts.alpha === 'number') img.setAlpha(opts.alpha);
  if (typeof opts.scrollFactor === 'number') img.setScrollFactor(opts.scrollFactor);
  return img;
}

/** Character sheet frame index for a row/col of a 4x4 sheet. */
export function sheetFrame(sheetSlot, row, col = 0) {
  const sheet = ACT1_CHARACTER_SHEETS[sheetSlot];
  if (!sheet) return 0;
  return row * sheet.cols + col;
}

/**
 * Origin that puts a character sheet's feet baseline exactly on the sprite's
 * y. The sheets place feet at y=91 in a 96px frame.
 */
export function characterOriginY(sheetSlot) {
  const sheet = ACT1_CHARACTER_SHEETS[sheetSlot];
  if (!sheet) return 1;
  return sheet.feetY / sheet.frameHeight;
}

export { ACT1_ART, ACT1_CHARACTER_SHEETS };
