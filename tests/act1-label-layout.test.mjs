/**
 * Labels must not land on each other.
 *
 * Zuzu's name tag sat ~25 world px below his soles because Player.js
 * measured the feet from the physics hitbox while the pixel-art sheet is
 * anchored on its own feet baseline. A prop's caption sat 24 px BELOW the
 * prop, which is exactly where a character's tag lands when they walk up —
 * and the caption only becomes visible when they do, so "Flat Tire"
 * printed across "Zuzu" every time.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ATLAS_FEET_OFFSET, VECTOR_FEET_OFFSET, LABEL_GAP,
  PROP_CAPTION_OFFSET, PROP_PROMPT_OFFSET, NAME_LABEL_LEAD_PX,
  feetOffset, nameTagOffset, labelsOverlap, labelBox, firstLabelClash,
} from '../src/renderer/game/systems/labelLayout.js';

// Measured in the running game: 13px bold text in a 1.5x camera.
const TAG = { width: 46, height: 18 };
const CAPTION = { width: 62, height: 15 };

test('the pixel-art avatar stands on its own y', () => {
  // createZuzu anchors on the sheet's feet baseline, so the soles are at
  // the container y. Measuring from the hitbox put the shadow under his
  // feet and dropped the tag into the other labels on Home Street.
  assert.equal(feetOffset(true), ATLAS_FEET_OFFSET);
  assert.equal(ATLAS_FEET_OFFSET, 0);
  assert.equal(feetOffset(false), VECTOR_FEET_OFFSET);
});

test('the name tag sits just under whichever feet the avatar has', () => {
  assert.equal(nameTagOffset(true), LABEL_GAP);
  assert.equal(nameTagOffset(false), VECTOR_FEET_OFFSET + LABEL_GAP);
  assert.ok(LABEL_GAP < 16, 'a bigger gap floats the tag off the character');
});

test('prop labels live above the prop, caption over prompt', () => {
  assert.ok(PROP_CAPTION_OFFSET < 0, 'the caption must not sit below the prop');
  assert.ok(PROP_PROMPT_OFFSET < 0, 'the prompt must not sit below the prop');
  assert.ok(PROP_CAPTION_OFFSET < PROP_PROMPT_OFFSET,
    'the caption belongs above the prompt, not on it');
});

test("a prop's caption and prompt do not touch each other", () => {
  const caption = labelBox(0, PROP_CAPTION_OFFSET - CAPTION.height / 2, CAPTION.width, CAPTION.height);
  const prompt = labelBox(0, PROP_PROMPT_OFFSET - 9, 70, 18);
  assert.equal(labelsOverlap(caption, prompt), false);
});

test('standing on a prop does not print its caption across the name tag', () => {
  // The child walks onto the prop: same x, soles on the prop's y.
  const propX = 418, propY = 300;
  const caption = labelBox(propX, propY + PROP_CAPTION_OFFSET - CAPTION.height / 2,
    CAPTION.width, CAPTION.height);
  const tag = labelBox(propX, propY + nameTagOffset(true) - TAG.height / 2,
    TAG.width, TAG.height);
  assert.equal(labelsOverlap(caption, tag), false,
    `caption ${JSON.stringify(caption)} hits tag ${JSON.stringify(tag)}`);
});

test('the old layout is what the test is guarding against', () => {
  // Proof the test can fail: the caption where it used to be (+24) lands on
  // the tag. If this ever stops overlapping, the test above proves nothing.
  const propX = 418, propY = 300;
  const oldCaption = labelBox(propX, propY + 24 - CAPTION.height / 2, CAPTION.width, CAPTION.height);
  const tag = labelBox(propX, propY + nameTagOffset(true) - TAG.height / 2, TAG.width, TAG.height);
  assert.equal(labelsOverlap(oldCaption, tag), true);
});

test('the caption arrives before the interact prompt', () => {
  assert.ok(NAME_LABEL_LEAD_PX > 0,
    'the name should reach the child before the prompt does');
});

test('labelsOverlap only reports real contact', () => {
  const a = labelBox(0, 0, 40, 10);
  assert.equal(labelsOverlap(a, labelBox(0, 10, 40, 10)), false, 'edge to edge is not contact');
  assert.equal(labelsOverlap(a, labelBox(0, 9, 40, 10)), true);
  assert.equal(labelsOverlap(a, labelBox(41, 0, 40, 10)), false);
});

// ── a walking tag yields to a fixed sign ───────────────────────────────────

test('a name tag that lands on a sign gives way', () => {
  // "Workshop" and "E Trailside" are drawn where the scene wants them; the
  // child walks wherever they like. The sign is telling them something.
  const sign = labelBox(850, 274, 56, 16);
  const tag = labelBox(845, 272, 46, 18);
  assert.equal(firstLabelClash(tag, [sign]), sign);
});

test('a tag standing clear of everything stays up', () => {
  const sign = labelBox(850, 274, 56, 16);
  assert.equal(firstLabelClash(labelBox(600, 400, 46, 18), [sign]), null);
  assert.equal(firstLabelClash(labelBox(600, 400, 46, 18), []), null);
});

test('a tag is never compared with itself', () => {
  const tag = labelBox(100, 100, 46, 18);
  assert.equal(firstLabelClash(tag, [tag]), null);
});

test('two walking tags do not both vanish', () => {
  // Zuzu's tag yields first; Lina's is then checked against what is still
  // showing, so a pile of two never clears the screen of both names.
  const zuzu = labelBox(500, 300, 46, 18);
  const lina = labelBox(505, 302, 40, 18);
  const fixed = [];
  const shown = [];

  for (const tag of [zuzu, lina]) {
    const clear = !firstLabelClash(tag, fixed) && !firstLabelClash(tag, shown);
    if (clear) shown.push(tag);
  }
  assert.deepEqual(shown, [zuzu], 'the first tag should survive, the second yield');
});
