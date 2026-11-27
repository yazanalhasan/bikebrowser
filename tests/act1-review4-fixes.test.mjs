/**
 * Regression tests for the fourth review pass (2026-11-27).
 *
 * The reviewer's note was that the previous tests only covered
 * `systems/questDialog.js` while most of what was broken lived in scene
 * code. So these drive the camera and the quest-board paths directly, and
 * walk the whole quest corpus for text problems rather than sampling it.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  localCameraFit, localCameraCenter,
} from '../src/renderer/game/utils/localCameraFit.js';
import {
  dialogForStep, questOfferDialog, offerPhrase, acceptQuestOffer, NARRATOR,
} from '../src/renderer/game/systems/questDialog.js';
import { getNextQuestForNPC } from '../src/renderer/game/data/questBoard.js';
import QUESTS from '../src/renderer/game/data/quests.js';
import { getNpcProfile } from '../src/renderer/game/data/npcProfiles.js';
import { MATERIALS } from '../src/renderer/game/systems/materials/materialDatabase.js';
import {
  SCENE_OBSTACLES, checkObstacleCondition,
} from '../src/renderer/game/data/obstacles.js';
import {
  overlayCameraFit, stretchOverlayDim,
  OVERLAY_DESIGN_WIDTH, OVERLAY_DESIGN_HEIGHT, OVERLAY_MAX_ZOOM,
} from '../src/renderer/game/utils/overlayCameraFit.js';

const GARAGE = { worldWidth: 800, worldHeight: 600 };
const STREET = { worldWidth: 1000, worldHeight: 700 };
const PHONE = { camWidth: 390, camHeight: 844 };

// ── MUST 4a: the phone camera must actually move ───────────────────────────

/** What `LocalSceneBase._fitLocalCamera` decides from a fit. */
const cameraModeFor = (fit) => ((fit.followX || fit.followY) ? 'follow' : 'fit');

test('MUST4a: a portrait phone puts the camera in follow mode', () => {
  for (const [name, world] of [['garage', GARAGE], ['street', STREET]]) {
    const fit = localCameraFit({ ...PHONE, ...world });
    assert.equal(fit.followX, true, `${name}: the room overflows horizontally`);
    assert.equal(fit.followY, false, `${name}: and fits vertically`);
    // The old rule was `followY ? 'follow' : 'fit'`, which gave 'fit' here —
    // the update loop never re-framed and Zuzu walked off the screen.
    assert.equal(cameraModeFor(fit), 'follow', `${name}: must follow`);
  }
});

test('MUST4a: walking right on a phone moves the camera', () => {
  const fit = localCameraFit({ ...PHONE, ...STREET });
  const at = (x) => localCameraCenter({
    fit, worldWidth: STREET.worldWidth, worldHeight: STREET.worldHeight,
    focusX: x, focusY: 350,
  }).centerX;
  assert.ok(at(700) > at(300), 'the view centre tracks the player');
});

test('MUST4a: Zuzu stays on screen at both walls on a phone', () => {
  for (const world of [GARAGE, STREET]) {
    const fit = localCameraFit({ ...PHONE, ...world });
    for (let x = 0; x <= world.worldWidth; x += 25) {
      const { centerX } = localCameraCenter({
        fit, worldWidth: world.worldWidth, worldHeight: world.worldHeight,
        focusX: x, focusY: 300,
      });
      const left = centerX - fit.viewWidth / 2;
      const right = left + fit.viewWidth;
      assert.ok(x >= left - 1e-9 && x <= right + 1e-9,
        `player at ${x} must be inside the view [${left}, ${right}]`);
      assert.ok(left >= -1e-9 && right <= world.worldWidth + 1e-9,
        `view must stay inside the room at x=${x}`);
    }
  }
});

test('MUST4a: a landscape screen is unchanged', () => {
  const fit = localCameraFit({ camWidth: 1280, camHeight: 720, ...STREET });
  assert.equal(fit.fillsWidth, true);
  assert.equal(cameraModeFor(fit), 'follow', 'still follows vertically');
});

// ── MUST 2: the switch/park path has to be reachable ───────────────────────

test('MUST2: an NPC can still offer while another quest runs', () => {
  const state = {
    completedQuests: ['flat_tire_repair', 'chain_repair', 'desert_healer'],
    activeQuest: { id: 'toxic_knowledge', stepIndex: 1 },
  };
  // The plain call is unchanged: nothing is offered while busy.
  assert.equal(getNextQuestForNPC('mr_chen', state), null);
  // The switch path asks the other question, and must get an answer.
  const offer = getNextQuestForNPC('mr_chen', state, { ignoreActive: true });
  assert.ok(offer, 'Mr. Chen has something to offer');
  assert.equal(offer, 'food_chain_tracker');
});

test('MUST2: the offer reads as a swap and parks the other quest', () => {
  const state = {
    completedQuests: ['flat_tire_repair', 'chain_repair', 'desert_healer'],
    activeQuest: { id: 'toxic_knowledge', stepIndex: 4 },
  };
  const dialog = questOfferDialog(
    { id: 'food_chain_tracker', title: QUESTS.food_chain_tracker.title },
    'Mr. Chen',
    { id: 'toxic_knowledge', title: QUESTS.toxic_knowledge.title },
  );
  assert.match(dialog.choices[0].label, /switch/i);
  assert.equal(dialog.questOffer.swapsFrom, 'toxic_knowledge');

  const after = acceptQuestOffer(state, 'food_chain_tracker',
    (s, id) => ({ ...s, activeQuest: { id, stepIndex: 0 } }));
  assert.equal(after.activeQuest.id, 'food_chain_tracker');
  assert.equal(after.pausedQuests.toxic_knowledge, 4, 'parked at the step it reached');
});

test('MUST2: an NPC never offers the quest already running', () => {
  const state = {
    completedQuests: ['flat_tire_repair'],
    activeQuest: { id: 'desert_healer', stepIndex: 2 },
  };
  assert.notEqual(
    getNextQuestForNPC('mrs_ramirez', state, { ignoreActive: true }),
    'desert_healer',
  );
});

// ── MUST 3: nobody names themselves, offers included ───────────────────────

test('MUST3: an offer never contains the asking NPC\'s name', () => {
  for (const [questId, quest] of Object.entries(QUESTS)) {
    const name = quest.giver && getNpcProfile(quest.giver)?.name;
    if (!name) continue;
    const dialog = questOfferDialog({ id: questId, title: quest.title }, name);
    assert.equal(
      dialog.text.includes(name), false,
      `${questId}: offer says "${dialog.text}" but the speaker is ${name}`,
    );
  }
});

test('MUST3: a title naming the giver becomes a first-person ask', () => {
  assert.equal(
    offerPhrase("Fix Mrs. Ramirez's Flat Tire", 'Mrs. Ramirez'),
    'Can you help me fix my flat tire?',
  );
  assert.equal(
    offerPhrase("Fix Mr. Chen's Slipped Chain", 'Mr. Chen'),
    'Can you help me fix my slipped chain?',
  );
  // A title that does not name them is quoted as before.
  assert.match(offerPhrase('Toxic Knowledge', 'Mrs. Ramirez'), /"Toxic Knowledge"/);
});

test('MUST3: the go-back line names the person and guesses no pronoun', () => {
  const away = dialogForStep({ type: 'dialogue', text: 'x' },
    { activeQuest: { id: 'desert_healer' } }, 'Mrs. Ramirez', { giverPresent: false });
  assert.match(away.text, /tell Mrs\. Ramirez/);
  assert.doesNotMatch(away.text, /\b(them|they|her|him|she|he)\b/i);
  assert.equal(away.speaker, NARRATOR);
});

// ── MUST 6: every bridge figure must match the lab table ───────────────────

/** Percentages the load test can legitimately produce. */
const LAB_PERCENTS = new Set(
  Object.values(MATERIALS)
    .filter((m) => Number.isFinite(m.ultimateStrengthMPa))
    .map((m) => Math.round((m.ultimateStrengthMPa / 600) * 100)),
);

test('MUST6: no bridge step quotes a percentage the lab does not produce', () => {
  const quest = QUESTS.bridge_collapse;
  const bad = [];
  const check = (where, text) => {
    for (const match of String(text || '').matchAll(/(\d+)\s*%/g)) {
      const pct = Number(match[1]);
      if (!LAB_PERCENTS.has(pct)) bad.push(`${where}: ${pct}%`);
    }
  };
  for (const step of quest.steps || []) {
    check(`${step.id} text`, step.text);
    for (const choice of step.choices || []) check(`${step.id} choice`, choice.label);
  }
  assert.deepEqual(bad, [],
    'these figures disagree with the load test:\n  ' + bad.join('\n  '));
});

test('MUST6: the tradeoff lesson states the real strengths', () => {
  const step = QUESTS.bridge_collapse.steps.find((s) => s.id === 'tradeoff_lesson');
  assert.ok(step);
  assert.match(step.text, /75%/, 'steel');
  assert.match(step.text, /17%/, 'mesquite');
  assert.match(step.text, /42%/, 'copper');
  // Copper is NOT the weakest by the table — mesquite is.
  assert.doesNotMatch(step.text, /Copper[^\n]*weakest/i);
});

test('MUST6: the final choice follows the strength-per-weight story', () => {
  const step = QUESTS.bridge_collapse.steps.find((s) => s.id === 'quiz_choice');
  assert.ok(step);
  const rated = step.choices.filter((c) => c.materialId);
  assert.ok(rated.length >= 2);
  const perWeight = (c) => {
    const m = MATERIALS[c.materialId];
    return m.ultimateStrengthMPa / (m.densityKgM3 / 1000);
  };
  const best = rated.reduce((a, b) => (perWeight(a) >= perWeight(b) ? a : b));
  const correct = step.choices.find((c) => c.correct);
  assert.equal(correct.materialId, best.materialId,
    `correct is "${correct.label}" but "${best.label}" has the best strength per weight`);
});

// ── SHOULDs ────────────────────────────────────────────────────────────────

test('SHOULD: a treatment cannot be applied away from the patient', () => {
  // "Apply the healing salve to help Mrs. Ramirez's arm" used to complete
  // alone in the desert, nowhere near the arm.
  for (const [questId, stepId] of [
    ['desert_healer', 'use_salve'],
    ['desert_infection', 'treat_infection'],
  ]) {
    const step = QUESTS[questId].steps.find((s) => s.id === stepId);
    assert.ok(step, `${questId}/${stepId} exists`);
    assert.equal(step.requiresGiver, true, `${stepId} must need the patient`);

    const away = dialogForStep(step, { activeQuest: { id: questId, stepIndex: 0 } },
      'Mrs. Ramirez', { giverPresent: false });
    assert.equal(away.step, null, `${stepId} must not be completable away`);
    assert.equal(away.objective, true);
  }
});

test('SHOULD: ordinary use_item steps still work anywhere', () => {
  // A tyre lever acts on an object, not a person.
  const step = QUESTS.flat_tire_repair.steps.find((s) => s.id === 'use_lever');
  assert.notEqual(step.requiresGiver, true);
  const away = dialogForStep(step, { activeQuest: { id: 'flat_tire_repair', stepIndex: 0 } },
    'Mrs. Ramirez', { giverPresent: false });
  assert.ok(away.step, 'still completable at the bike');
});

test('SHOULD: the heat hazard accepts either protection', () => {
  const heat = SCENE_OBSTACLES.StreetBlockScene.obstacles
    .find((o) => o.id === 'heat_zone');
  assert.equal(heat.passCondition.type, 'itemAny');
  for (const item of ['sun_balm', 'protective_coating']) {
    assert.equal(
      checkObstacleCondition(heat, { inventory: [item] }).passed, true,
      `${item} must get the child across`,
    );
  }
  assert.equal(
    checkObstacleCondition(heat, { inventory: [] }).passed, false,
    'and nothing still blocks',
  );
});

// ── POLISH #1: the overlays must fit every screen ──────────────────────────

test('POLISH1: the explainer panel fits on every screen', () => {
  // Authored at 800x600 and drawn straight into it: at 1280x720 the panel
  // sat top-left with the street beside it, at 1024x484 the answers and
  // Continue were off the bottom, and half of it was off a phone.
  for (const [w, h] of [[1280, 720], [1024, 484], [1920, 1080], [390, 844]]) {
    const fit = overlayCameraFit({ camWidth: w, camHeight: h });
    const shownW = OVERLAY_DESIGN_WIDTH * fit.zoom;
    const shownH = OVERLAY_DESIGN_HEIGHT * fit.zoom;
    assert.ok(shownW <= w + 1e-6, `${w}x${h}: panel ${shownW} wider than the screen`);
    assert.ok(shownH <= h + 1e-6, `${w}x${h}: panel ${shownH} taller than the screen`);
  }
});

test('POLISH1: the overlay is centred, so nothing hangs off one edge', () => {
  for (const [w, h] of [[1280, 720], [1024, 484], [390, 844]]) {
    const fit = overlayCameraFit({ camWidth: w, camHeight: h });
    assert.equal(fit.centerX, OVERLAY_DESIGN_WIDTH / 2);
    assert.equal(fit.centerY, OVERLAY_DESIGN_HEIGHT / 2);
  }
});

test('POLISH1: the dim covers the whole viewport at every aspect', () => {
  for (const [w, h] of [[1280, 720], [1024, 484], [1920, 1080], [390, 844]]) {
    const fit = overlayCameraFit({ camWidth: w, camHeight: h });
    // `cover` is the viewport in design units; it must reach past the design
    // space on whichever axis has spare room, or the game shows around it.
    assert.ok(fit.cover.width >= OVERLAY_DESIGN_WIDTH - 1e-6
      || fit.cover.height >= OVERLAY_DESIGN_HEIGHT - 1e-6,
    `${w}x${h}: dim does not reach the edges`);
    assert.ok(fit.cover.width * fit.zoom >= w - 1e-6, `${w}x${h}: dim too narrow`);
    assert.ok(fit.cover.height * fit.zoom >= h - 1e-6, `${w}x${h}: dim too short`);
  }
});

test('POLISH1: a huge display does not blow the card up absurdly', () => {
  const fit = overlayCameraFit({ camWidth: 3840, camHeight: 2160 });
  assert.equal(fit.zoom, OVERLAY_MAX_ZOOM);
});

/** The least Phaser Rectangle the dim-stretcher needs. */
function fakeRect() {
  return {
    scene: {},
    width: 0, height: 0, x: 0, y: 0,
    setSize(w, h) { this.width = w; this.height = h; },
    setPosition(x, y) { this.x = x; this.y = y; },
  };
}

test('POLISH1: the dim grows when the window is resized under it', () => {
  // The dim is sized in design units, so it went stale the moment the shape
  // changed: open the explainer on a landscape window, turn the phone, and
  // the game showed above and below the dim.
  const rect = fakeRect();
  stretchOverlayDim(rect, overlayCameraFit({ camWidth: 1280, camHeight: 720 }));
  const landscape = { w: rect.width, h: rect.height };

  const tall = overlayCameraFit({ camWidth: 390, camHeight: 844 });
  stretchOverlayDim(rect, tall);
  assert.ok(rect.height > landscape.h, 'the dim did not grow taller');
  assert.ok(rect.height * tall.zoom >= 844 - 1e-6, 'the dim still falls short of the screen');
  assert.equal(rect.y, tall.cover.y + tall.cover.height / 2);
});

test('POLISH1: a destroyed dim handle is left alone', () => {
  // Phaser reuses the scene object across visits, so `_dimRect` can point at
  // a corpse while a resize comes in.
  const dead = fakeRect();
  dead.scene = null;
  stretchOverlayDim(dead, overlayCameraFit({ camWidth: 800, camHeight: 600 }));
  assert.equal(dead.width, 0);
  assert.doesNotThrow(() => stretchOverlayDim(null, null));
});
