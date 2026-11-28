/**
 * The two overlays a child meets first are readable on a phone.
 *
 * Plan item 0.5. At 390x844 the 800x600 design space was contain-fitted at
 * 0.4875 — the narrow side decides, so 550 px of height was thrown away
 * and the text came out at 4.9 to 9.8 CSS px. The fix is a second set of
 * coordinates authored for a tall screen, not a smaller copy of the
 * landscape one.
 *
 * The lab rigs (Materials Lab, Thermal Rig) are NOT covered here and are
 * still the landscape layout on a phone. That is the rest of 0.5.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { overlayCameraFit } from '../src/renderer/game/utils/overlayCameraFit.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const layout = (name) => JSON.parse(read(`public/layouts/${name}.layout.json`));

const PHONE = { w: 390, h: 844 };
const OVERLAYS = ['flat-tire-explainer', 'cognitive-flat-tire'];

/** Smallest font the scene draws, in design px, read from its source. */
const SMALLEST_FONT = {
  'flat-tire-explainer': 13, // the PATCH tile label
  'cognitive-flat-tire': 15, // the option labels
};

test('both overlays carry a portrait layout', () => {
  for (const name of OVERLAYS) {
    const data = layout(name);
    assert.ok(data.portrait?.objects, `${name} has no portrait block`);
    assert.ok(data.portrait.designWidth > 0 && data.portrait.designHeight > 0);
    assert.ok(data.portrait.designHeight > data.portrait.designWidth,
      `${name}'s portrait space is not taller than it is wide`);
  }
});

test('the portrait space is close to a phone, so the fit is about 1:1', () => {
  for (const name of OVERLAYS) {
    const d = layout(name).portrait;
    const fit = overlayCameraFit({
      camWidth: PHONE.w, camHeight: PHONE.h,
      designWidth: d.designWidth, designHeight: d.designHeight,
    });
    assert.ok(fit.zoom > 0.9, `${name} fits a phone at ${fit.zoom.toFixed(2)}, still shrinking`);
  }
});

test('nothing renders under 10 CSS px on a phone', () => {
  for (const name of OVERLAYS) {
    const d = layout(name).portrait;
    const fit = overlayCameraFit({
      camWidth: PHONE.w, camHeight: PHONE.h,
      designWidth: d.designWidth, designHeight: d.designHeight,
    });
    const smallest = SMALLEST_FONT[name] * fit.zoom;
    assert.ok(smallest >= 10,
      `${name}'s smallest text is ${smallest.toFixed(1)} CSS px on a phone`);
  }
});

test('the landscape layout also clears 10 px in a short window', () => {
  // 1024x484 fits the 800x600 space at 0.807, which is where a 10px label
  // came out at 8.1.
  const fit = overlayCameraFit({ camWidth: 1024, camHeight: 484 });
  assert.ok(SMALLEST_FONT['flat-tire-explainer'] * fit.zoom >= 10);
});

test('touch targets are at least 44 px on a phone', () => {
  const explainer = layout('flat-tire-explainer').portrait;
  const fitE = overlayCameraFit({
    camWidth: PHONE.w, camHeight: PHONE.h,
    designWidth: explainer.designWidth, designHeight: explainer.designHeight,
  });
  const patch = explainer.objects.patch;
  assert.ok(patch.w * fitE.zoom >= 44 && patch.h * fitE.zoom >= 44,
    `the PATCH tile is ${Math.round(patch.w * fitE.zoom)}x${Math.round(patch.h * fitE.zoom)}`);

  const quiz = layout('cognitive-flat-tire').portrait;
  const fitQ = overlayCameraFit({
    camWidth: PHONE.w, camHeight: PHONE.h,
    designWidth: quiz.designWidth, designHeight: quiz.designHeight,
  });
  for (const key of ['option_nail', 'option_valve', 'option_wear', 'continue']) {
    const box = quiz.objects[key];
    assert.ok(box.h * fitQ.zoom >= 44, `${key} is ${Math.round(box.h * fitQ.zoom)} px tall`);
  }
});

test('the stacked cards do not overlap each other', () => {
  const quiz = layout('cognitive-flat-tire').portrait.objects;
  const cards = ['option_nail', 'option_valve', 'option_wear'].map((k) => quiz[k]);
  for (let i = 1; i < cards.length; i += 1) {
    const above = cards[i - 1].y + cards[i - 1].h / 2;
    const below = cards[i].y - cards[i].h / 2;
    assert.ok(below >= above, `cards ${i - 1} and ${i} overlap`);
  }
  // and everything stays inside the panel
  const panel = quiz.panel;
  const last = cards[cards.length - 1];
  assert.ok(last.y + last.h / 2 <= panel.y + panel.h / 2);
  assert.ok(quiz.continue.y + quiz.continue.h / 2 <= panel.y + panel.h / 2);
});

test('the explainer rows do not overlap on a phone', () => {
  const o = layout('flat-tire-explainer').portrait.objects;
  const patchBottom = o.patch.y + o.patch.h / 2;
  assert.ok(o.instruction.y > patchBottom,
    'the instruction box sat across the PATCH tile at 1280; it must not here either');
  assert.ok(o.feedback.y > o.instruction.y);
  assert.ok(o.feedback.y <= o.panel.y + o.panel.h / 2);
});

test('turning the phone swaps the layout, not just the zoom', () => {
  for (const file of [
    'src/renderer/game/scenes/ExplainerScene.js',
    'src/renderer/game/scenes/CognitiveQuestScene.js',
  ]) {
    const src = read(file);
    assert.match(src, /loadResponsiveLayout\(this/);
    assert.match(src, /scene\.restart\(/, `${file} never rebuilds on rotation`);
    assert.match(src, /cam\.height > cam\.width/);
  }
  // and the explainer keeps the child's place across that restart
  assert.match(read('src/renderer/game/scenes/ExplainerScene.js'),
    /stepIndex: this\._stepIndex/);
});

test('the touch controls get out of the way of an overlay', () => {
  const container = read('src/renderer/game/GameContainer.jsx');
  assert.match(container,
    /!anyPanelOpen && !overlayOpen && \(\s*\n\s*<VirtualJoystick/);
});
