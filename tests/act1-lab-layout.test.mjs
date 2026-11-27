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

test('the takeaway card is laid out from its own text', () => {
  assert.match(MATERIAL_LAB, /top \+ heading\.height \+ gap/,
    'the body must follow the heading it sits under');
  assert.match(MATERIAL_LAB, /Math\.max\(cfg\.h, padding \* 2 \+ heading\.height/,
    'the card must grow to whatever the text came to');
});

test('the takeaway card clears the way out of the lab', () => {
  // "⬅ Back to Garage" is drawn at y 582.
  const panel = LAB_LAYOUT.objects.comparison_panel;
  const bottom = panel.y + panel.h / 2;
  assert.ok(bottom < 572,
    `the takeaway card reaches y=${bottom}, into the Back to Garage label at 572`);
});

test('a lab rig takes the HUD while it is open, and gives it back', () => {
  assert.match(LAB_RIG, /registry\.set\('sceneOwnsHud', true\)/);
  assert.match(LAB_RIG, /shutdown.*sceneOwnsHud', false/s,
    'the flag must clear on shutdown or the HUD never comes back');
  assert.match(GAME_CONTAINER, /!overlayOpen && !sceneOwnsHud/,
    'the HUD column must honour the flag');
});
