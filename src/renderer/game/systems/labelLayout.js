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

/**
 * Depths — a label layer above every character.
 *
 * Characters are y-sorted (`10 + y / 26` in Player.js), so in a tall room
 * the child's own depth reaches the high 30s. Labels at 11 and 12 were
 * therefore still drawn underneath them: the Materials Lab caption, Mrs.
 * Ramirez's talk prompt and the whole Mesquite caption all disappeared
 * behind a sprite. A character at the bottom of a 1200px room reaches a
 * depth of about 56, so the whole label stack starts above that.
 */
export const PLAYER_LABEL_DEPTH = 61;
export const NPC_LABEL_DEPTH = 62;
export const PROP_CAPTION_DEPTH = 63;
export const NPC_PROMPT_DEPTH = 64;
export const PROP_PROMPT_DEPTH = 65;
/**
 * A lab station's own buttons (RECORD, START TEST, the sample buttons).
 * They sit above every prompt: a prompt is a hint, a button is the thing
 * the child has to press, and the hint was covering it.
 */
export const LAB_BUTTON_DEPTH = 90;

/** A companion's own name and her "Talk" chip sit on top of all of it. */
export const COMPANION_LABEL_DEPTH = 66;
export const COMPANION_PROMPT_DEPTH = 67;

/**
 * The reserved UI band — panels, readouts, cards and their text.
 *
 * Plan 0.12. Everything above this line is still in the world: a
 * character y-sorts to 10–49, so an info panel at depth 0–8 is hidden
 * the moment the child stands on it. The Materials Lab takeaway card
 * was 91% behind Zuzu for exactly that reason, and the garage spawn
 * puts him on the card the moment he walks in.
 *
 * A panel's parts are ordered so a panel cannot cover its own words:
 *
 *   80  the card or readout background
 *   82  its heading and body text
 *   84  a control inside it
 *   90  a station's own button (RECORD, START TEST, the sample cards)
 *   92  a teaching callout's box
 *   94  the callout's text
 *
 * Depth is only half of it. The band stops a character drawing OVER a
 * panel; it does nothing about a panel landing on a name tag or on
 * another panel. Panels still have to be placed where the child does
 * not stand.
 */
export const UI_BAND_MIN = 80;
export const PANEL_BG_DEPTH = 80;
export const PANEL_TEXT_DEPTH = 82;
export const PANEL_CONTROL_DEPTH = 84;
export const STATION_BUTTON_DEPTH = 90;
export const CALLOUT_BG_DEPTH = 92;
export const CALLOUT_TEXT_DEPTH = 94;

/** A toast or hint strip sits above everything else on the canvas. */
export const TOAST_DEPTH = 100;

// ── Modal band ────────────────────────────────────────────────────────
// A modal owns the screen: a scrim over everything, the panel above the
// scrim, its controls above that. Nothing in the UI band may reach it.
//
// The Density Slate used depths 20-22, which is inside the WORLD, so the
// takeaway card (80) printed straight through its title and the chart
// covered its table — the child read 32% of a panel they had just asked
// for (review MUST 4).
export const SCRIM_DEPTH = 110;
export const MODAL_BG_DEPTH = 112;
export const MODAL_TEXT_DEPTH = 114;
export const MODAL_CONTROL_DEPTH = 116;

/**
 * The HUD's right-hand rail, in screen pixels.
 *
 * Ten 44px buttons down the right edge with an 8px margin, drawn in the
 * DOM on top of the canvas. Depth cannot help here — nothing in Phaser
 * is above the page — so a world label that lands under the rail has to
 * move. Measured on the running game at 1280x720 and 390x844; the rail
 * is the same size at both.
 */
export const HUD_RAIL_WIDTH = 56;

/**
 * Would a label at this screen position run under the rail?
 *
 * @param {number} screenRight right edge of the label, in screen px
 * @param {number} camWidth
 */
export function underHudRail(screenRight, camWidth) {
  return screenRight > camWidth - HUD_RAIL_WIDTH;
}

/**
 * A fixed sign in the world: a scene title, a house nameplate, a map
 * pin's name, an exit label.
 *
 * These were drawn at depth 2 to 12, which is inside the character
 * y-sort band (10-49), so a child standing near one hid it — 83% of
 * "COPPER MINE" at the mine's own spawn, 92% of "Enter" on the
 * overworld, 100% of "Ramirez House" behind its own roof. A sign
 * carries something the child needs, so it sits above every character;
 * their own name tag (61) still sits above the sign, and
 * `firstLabelClash` moves the tag when the two meet.
 *
 * WORLD_SIGN_ART_DEPTH is for the art a sign belongs to — a map pin's
 * circle and icon — so the pin travels with its name instead of being
 * left behind in the world.
 */
export const WORLD_SIGN_ART_DEPTH = 58;
export const WORLD_SIGN_DEPTH = 60;

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
