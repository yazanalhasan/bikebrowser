/**
 * A challenge pays once, keeps its id between visits, and reopens after a
 * wrong answer. Plan item 0.4.
 *
 * The id was built from `this._challenges.length`, and that array is only
 * emptied in the constructor — Phaser reuses the scene object, so the
 * second visit to the mine numbered the same three challenges `_3`.._5`,
 * none matched a solved marker, all three reopened, and each paid again.
 * Twenty Zuzubucks a lap for as many laps as a child cared to walk.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { challengeIdFor, slugify } from '../src/renderer/game/systems/challengeIds.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ── the id names the challenge, not its position ───────────────────────────

test('the id comes from the challenge itself', () => {
  const id = challengeIdFor('CopperMineScene', { label: 'Conductivity Test' });
  assert.equal(id, 'challenge_CopperMineScene_conductivity_test');
});

test('the same challenge gets the same id however many are registered', () => {
  const first = challengeIdFor('CopperMineScene', { label: 'Load Calculation' });
  const again = challengeIdFor('CopperMineScene', { label: 'Load Calculation' });
  assert.equal(first, again);
});

test('two challenges in one scene never collide', () => {
  const ids = ['Conductivity Test', 'Load Calculation', 'Depth Check']
    .map((label) => challengeIdFor('CopperMineScene', { label }));
  assert.equal(new Set(ids).size, 3);
});

test('an explicit id wins over the label', () => {
  assert.equal(
    challengeIdFor('SaltRiverScene', { id: 'flow_rate', label: 'Something else' }),
    'challenge_SaltRiverScene_flow_rate',
  );
});

test('a challenge with only a question still gets a stable id', () => {
  const config = { question: 'How much does the cart hold?' };
  assert.equal(challengeIdFor('CopperMineScene', config),
    challengeIdFor('CopperMineScene', config));
});

test('slugify keeps ids readable and safe', () => {
  assert.equal(slugify('Structural Steel (A36-like)'), 'structural_steel_a36_like');
  assert.equal(slugify('  Mixed   CASE  '), 'mixed_case');
  assert.equal(slugify(''), '');
});

// ── the scene does its half ────────────────────────────────────────────────

test('the challenge list is emptied on every entry, not just construction', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.match(base, /_resetChallenges\(\)\s*\{\s*\n\s*this\._challenges = \[\];/);
  assert.match(base, /this\._resetChallenges\(\);\s*\n\s*this\.setupChallenges\(\);/);
});

test('the id is built from the config, never from the array length', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.match(base, /const challengeId = challengeIdFor\(this\.getSceneKey\(\), config\)/);
  // the positional id survives only to migrate old saves
  const positional = base.match(/`challenge_\$\{this\.getSceneKey\(\)\}_\$\{this\._challenges\.length\}`/g) || [];
  assert.equal(positional.length, 1, 'the positional id should only be the legacy one');
  assert.match(base, /const legacyId = `challenge_/);
});

test('solving twice pays nothing the second time', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  const resolve = base.slice(base.indexOf('resolveChallenge(challengeId, choiceIndex) {'));
  const body = resolve.slice(0, resolve.indexOf('\n  }'));
  assert.match(body, /solvedChallenges\?\.includes\(challengeId\)/);
  assert.match(body, /return;/);
  // and the early return comes before any reward maths
  assert.ok(body.indexOf('solvedChallenges?.includes(challengeId)') < body.indexOf('reward'),
    'the already-solved check must come before the payout');
});

test('a solved challenge says so instead of asking again', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.match(base, /You already worked this one out/);
});

test('an old positional solved marker is carried over', () => {
  const base = read('src/renderer/game/scenes/BaseSubScene.js');
  assert.match(base, /_migrateLegacyChallengeId\(legacyId, challengeId\)/);
  const fn = base.slice(base.indexOf('_migrateLegacyChallengeId(legacyId, challengeId) {'));
  const body = fn.slice(0, fn.indexOf('\n  }'));
  assert.match(body, /solved\.filter\(\(id\) => id !== legacyId\)/);
  assert.match(body, /saveGame\(updated\)/, 'the rewrite has to persist');
});
