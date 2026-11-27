/**
 * Where name tags and captions sit, in one place.
 *
 * Three label families share the same patch of screen: the player's name
 * tag, an NPC's name tag, and a prop's caption plus its interact prompt.
 * They were each positioned by a magic number in their own file, and they
 * collided — "Flat Tire" printed across "Zuzu" the moment Zuzu walked up to
 * the bike, and Zuzu's own tag sat 24 px below his soles because Player.js
 * measured the feet from the physics hitbox while the art is anchored on
 * its own feet baseline.
 *
 * No scene imports; pure numbers and geometry so the layout can be tested.
 */

// ── Characters ─────────────────────────────────────────────────────────────

/**
 * Soles relative to the container's y.
 *
 * The pixel-art sheets are anchored on their feet baseline (see
 * `createZuzu`), so the soles land on the container y exactly. The older
 * vector fallback draws from the hitbox and keeps its legacy offset.
 */
export const ATLAS_FEET_OFFSET = 0;
export const VECTOR_FEET_OFFSET = 24;

/** Gap between the soles and the top of the name tag. */
export const LABEL_GAP = 10;

/** @param {boolean} usesAtlasAvatar */
export function feetOffset(usesAtlasAvatar) {
  return usesAtlasAvatar ? ATLAS_FEET_OFFSET : VECTOR_FEET_OFFSET;
}

/** @param {boolean} usesAtlasAvatar */
export function nameTagOffset(usesAtlasAvatar) {
  return feetOffset(usesAtlasAvatar) + LABEL_GAP;
}

// ── Props ──────────────────────────────────────────────────────────────────

/**
 * Both prop labels go ABOVE the prop, caption over prompt.
 *
 * The caption used to sit at +24, directly where a character's name tag
 * lands when they walk up to the prop — which is exactly when the caption
 * becomes visible.
 */
export const PROP_CAPTION_OFFSET = -42;
export const PROP_PROMPT_OFFSET = -24;

/** How much closer than the caption the player must be for the prompt. */
export const NAME_LABEL_LEAD_PX = 34;

// ── Geometry ───────────────────────────────────────────────────────────────

/**
 * Do two label boxes share any pixels?
 *
 * @param {{x: number, y: number, width: number, height: number}} a
 * @param {{x: number, y: number, width: number, height: number}} b
 */
export function labelsOverlap(a, b) {
  return a.x < b.x + b.width
    && b.x < a.x + a.width
    && a.y < b.y + b.height
    && b.y < a.y + a.height;
}

/**
 * A label box around a centred, origin-0.5 text.
 *
 * @param {number} centerX
 * @param {number} topY top edge (labels are placed by their top in Phaser
 *   once origin y is 0.5 — pass the measured top)
 * @param {number} width
 * @param {number} height
 */
export function labelBox(centerX, topY, width, height) {
  return { x: centerX - width / 2, y: topY, width, height };
}

/**
 * The first label box that touches `box`, or null.
 *
 * Used for the one case nudging cannot solve: the child can stand anywhere,
 * so their name tag will eventually cross a fixed sign ("Workshop", "E
 * Trailside"). The sign carries information the child needs; their own name
 * does not, so the tag is the one that yields.
 *
 * @param {{x:number,y:number,width:number,height:number}} box
 * @param {Array<{x:number,y:number,width:number,height:number}>} others
 */
export function firstLabelClash(box, others) {
  for (const other of others) {
    if (other === box) continue;
    if (labelsOverlap(box, other)) return other;
  }
  return null;
}
