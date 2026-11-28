/**
 * Plan 0.6, 0.7 and 0.8 — the data-level MUSTs.
 *
 * 0.6 One success line served two different items, so a child who crossed
 *     the Scorching Pavement with the Protective Coating they had just
 *     crafted was told about sun balm.
 * 0.7 The river quiz marked "2 m/s upstream" correct and never offered the
 *     true answer. The current is stronger than the fish, so the fish
 *     still drifts downstream.
 * 0.8 Three lines were too blunt for a child.
 *
 * The ephedra mechanic and its text are out of scope by owner decision
 * (2026-11-27), so `data/plantEffects.js` is excluded here deliberately.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

import { SCENE_OBSTACLES, checkObstacleCondition } from '../src/renderer/game/data/obstacles.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const heatZone = SCENE_OBSTACLES.StreetBlockScene.obstacles.find((o) => o.id === 'heat_zone');

// ── 0.6 the line matches the item ──────────────────────────────────────────

test('the hazard reports which item let the child through', () => {
  const withBalm = checkObstacleCondition(heatZone, { inventory: ['sun_balm'] });
  assert.equal(withBalm.passed, true);
  assert.equal(withBalm.matchedItem, 'sun_balm');

  const withCoating = checkObstacleCondition(heatZone, { inventory: ['protective_coating'] });
  assert.equal(withCoating.passed, true);
  assert.equal(withCoating.matchedItem, 'protective_coating');

  const withNeither = checkObstacleCondition(heatZone, { inventory: [] });
  assert.equal(withNeither.passed, false);
  assert.equal(withNeither.matchedItem, null);
});

test('each item has its own success line, and the coating line says coating', () => {
  const lines = heatZone.successMessageByItem;
  assert.ok(lines, 'the hazard needs a line per item');
  assert.match(lines.sun_balm, /sun balm/i);
  assert.match(lines.protective_coating, /coating/i);
  assert.doesNotMatch(lines.protective_coating, /sun balm/i,
    'crossing with the coating must not mention sun balm');
});

test('the system picks the line by the item used', () => {
  const sys = read('src/renderer/game/systems/obstacleSystem.js');
  assert.match(sys, /function successLineFor\(obstacle, itemId\)/);
  assert.match(sys, /text: successLineFor\(obstacle, check\.matchedItem\)/);
  // an obstacle with a single solution keeps working
  assert.match(sys, /return obstacle\?\.successMessage \|\| '';/);
});

// ── 0.7 every quiz agrees with its own maths ──────────────────────────────

test('the river quiz answers its own question', () => {
  const src = read('src/renderer/game/systems/sideQuestSystem.js');
  const quiz = src.slice(src.indexOf('If the river flows at 3 meters per second'));
  const block = quiz.slice(0, quiz.indexOf('explanation'));
  // 3 m/s downstream current - 1 m/s swum against it = 2 m/s downstream
  assert.match(block, /\{ label: '2 m\/s downstream', correct: true \}/);
  assert.doesNotMatch(block, /\{ label: '2 m\/s upstream', correct: true \}/);
  // the wrong direction is still offered, as the thing to learn
  assert.match(block, /\{ label: '2 m\/s upstream', correct: false \}/);
});

test('every side-quest quiz has exactly one correct answer', () => {
  const src = read('src/renderer/game/systems/sideQuestSystem.js');
  const quizzes = src.split("type: 'quiz'").slice(1);
  assert.ok(quizzes.length >= 5, `only found ${quizzes.length} quizzes`);
  for (const quiz of quizzes) {
    const block = quiz.slice(0, quiz.indexOf(']') + 1);
    const correct = block.match(/correct: true/g) || [];
    assert.equal(correct.length, 1,
      `a quiz has ${correct.length} correct answers: ${block.slice(0, 80)}`);
  }
});

// ── 0.8 words a child can hear ─────────────────────────────────────────────

const BANNED = [
  [/\bkill you\b/i, 'tells a child something will kill them'],
  [/\bpoisoner\b/i, 'calls someone a poisoner'],
  [/water is running out/i, 'reads as running out of water'],
];

function dataFiles() {
  const dir = 'src/renderer/game/data';
  const base = new URL(`../${dir}/`, import.meta.url);
  const out = [];
  for (const entry of readdirSync(base, { withFileTypes: true })) {
    if (entry.isDirectory()) continue;
    if (!entry.name.endsWith('.js')) continue;
    // Owner decision 2026-11-27: the ephedra mechanic and its text stay.
    if (entry.name === 'plantEffects.js') continue;
    out.push(`${dir}/${entry.name}`);
  }
  return out;
}

test('no quest or obstacle text uses the blunt phrasings', () => {
  const found = [];
  for (const file of dataFiles()) {
    const src = read(file);
    for (const [pattern, why] of BANNED) {
      const line = src.split('\n').findIndex((l) => pattern.test(l));
      if (line >= 0) found.push(`${file}:${line + 1} ${why}`);
    }
  }
  assert.deepEqual(found, []);
});

test('the replacements still teach the same thing', () => {
  const quests = read('src/renderer/game/data/quests.js');
  assert.match(quests, /sip steadily/);
  assert.match(quests, /safe range/);
  assert.match(quests, /Knowing the right amount is what makes[\s\S]{0,40}medicine safe/);
  const obstacles = read('src/renderer/game/data/obstacles.js');
  assert.match(obstacles, /Sip your water and find some shade/);
});

test('the ephedra text is left exactly as the owner asked', () => {
  // Not a style check — a guard that this file was not swept up by the
  // rewrite. It still says what it said.
  const plant = read('src/renderer/game/data/plantEffects.js');
  assert.ok(plant.length > 0);
  assert.match(plant, /ephedra/i);
});
