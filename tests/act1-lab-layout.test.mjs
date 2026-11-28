/**
 * The Materials Lab's own text.
 *
 * Four overlaps a child saw in the first lab visit:
 *   - "Structural Steel (A36-like)" wrapped to two lines and ran through
 *     the category word ("metal") pinned below it at a fixed offset.
 *   - Each station's generic prop caption was a second copy of the sign the
 *     station already prints, landing on the chart's axis label and on the
 *     neighbouring station's note.
 *   - The scale's "SCALE" sign sits exactly where an interact prompt goes.
 *   - "Engineering takeaway" and the three lines under it were both pinned
 *     to fixed offsets inside a fixed-height card, so they met in the
 *     middle; the card also sat on "⬅ Back to Garage".
 *   - The React quest card sat across the Force / Strain / Stress readout.
 *
 * These live in scene files, which import Phaser and cannot be loaded here,
 * so this reads the source. A layout rule that is only a comment is a rule
 * that comes back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const LAB_RIG = read('src/renderer/game/scenes/LabRigBase.js');
const MATERIAL_LAB = read('src/renderer/game/scenes/MaterialLabScene.js');
const LOCAL_SCENE = read('src/renderer/game/scenes/LocalSceneBase.js');
const GAME_CONTAINER = read('src/renderer/game/GameContainer.jsx');
const LAB_LAYOUT = JSON.parse(read('public/layouts/material-lab.layout.json'));

test('a sample card stacks the category under the measured name', () => {
  assert.match(LAB_RIG, /nameTxt\.y \+ nameTxt\.height/,
    'the category must follow the name it is under, not a fixed +28');
  assert.doesNotMatch(LAB_RIG, /SELECTOR_X \+ 38, sy \+ 28/,
    'the fixed category offset is back');
});

test('the lab stations do not print a second copy of their own sign', () => {
  // Scale, Coupons and Density Slate each draw their own label.
  const captions = MATERIAL_LAB.match(/showNameLabel: false/g) || [];
  assert.equal(captions.length, 3,
    `expected all 3 lab stations to suppress the generic caption, found ${captions.length}`);
});

test("the scale's prompt hangs below its display", () => {
  // scaleStation draws "SCALE" at displayY - 22, which is where the prompt
  // would otherwise be.
  assert.match(MATERIAL_LAB, /promptOffset: 34/);
  assert.match(LOCAL_SCENE, /promptOffset = PROP_PROMPT_OFFSET/,
    'addInteractable must accept the override');
  assert.match(LOCAL_SCENE, /this\.add\.text\(x, y \+ promptOffset/,
    'the prompt must use the override, not the constant');
});

test('the takeaway owns the screen instead of hunting for a gap', () => {
  // It used to be a world card placed by layout coordinates, and it
  // spent three rounds moving from one collision to the next: over
  // "Structural Steel" at 1280 (40%), over the coupons station under
  // the chart (81%), over "Back to Garage" at 375x667 (100%). An
  // 800x600 bench holding a selector, a chart, a readout, a machine
  // and an instrument row has no 350x58 hole in it.
  const modal = read('src/renderer/game/systems/lab/labModal.js');
  assert.match(MATERIAL_LAB, /showLabModal\(this, \{/,
    'the takeaway must be a modal');
  assert.match(modal, /cam\.worldView/,
    'a modal sizes itself from the camera, not from a design canvas');
  assert.match(modal, /SCRIM_DEPTH/,
    'and covers the screen behind it, so nothing can print through it');
  assert.match(modal, /MIN_TAP_PX/,
    'its close control has to be reachable by a finger');
});

test('a dismissed takeaway can be brought back', () => {
  // A conclusion a child closes must not need three more tests to
  // re-read it.
  assert.match(MATERIAL_LAB, /_showTakeawayButton\(\)/);
  assert.match(MATERIAL_LAB, /onClose: \(\) => \{\s*\n\s*this\._takeawayModal = null;\s*\n\s*this\._showTakeawayButton\(\);/,
    'closing the modal must leave the reopen button behind');
});

test('the way out of a rig is the HUD control, not a world label', () => {
  // The rigs hide the d-pad, so a walk-in exit zone is no way out at
  // all on a phone (review MUST 1) — and a second "Back to Garage"
  // painted into the world sat under the takeaway at 375x667.
  assert.match(LAB_RIG, /this\.leaveScene = \(\) =>/,
    'a rig must name its own way out for the HUD');
  assert.match(LAB_RIG, /this\.leaveSceneLabel = 'Back to Garage'/);
  const exitCall = LAB_RIG.slice(LAB_RIG.indexOf('this.addExit({'));
  const exitBlock = exitCall.slice(0, exitCall.indexOf('});'));
  assert.ok(!/label:/.test(exitBlock),
    'the rig exit must not draw a world label that duplicates the HUD control');
  assert.match(GAME_CONTAINER, /data-testid="leave-scene"/,
    'the HUD must draw the control');
  assert.match(GAME_CONTAINER, /sceneOwnsHud && \(\s*\n\s*<button/,
    'and only for a scene that owns the HUD');
});

test('a lab rig takes the HUD while it is open, and gives it back', () => {
  assert.match(LAB_RIG, /registry\.set\('sceneOwnsHud', true\)/);
  assert.match(LAB_RIG, /shutdown.*sceneOwnsHud', false/s,
    'the flag must clear on shutdown or the HUD never comes back');
  assert.match(GAME_CONTAINER, /!overlayOpen && !sceneOwnsHud/,
    'the HUD column must honour the flag');
});
