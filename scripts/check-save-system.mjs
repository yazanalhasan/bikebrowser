#!/usr/bin/env node
/**
 * Smoke test for the game save system.
 *
 * Validates:
 *   1. defaultSave shape has all required fields
 *   2. hasSave() returns false when no save exists
 *   3. saveGame() + loadGame() round-trip preserves data
 *   4. hasSave() returns true after saving
 *   5. resetGame() clears the game save
 *   6. hasSave() returns false after reset
 *   7. Learning progress key is NOT affected by resetGame()
 *
 * Runs in Node with a minimal localStorage shim — no browser needed.
 */

import { readFileSync } from 'node:fs';

// ── Minimal localStorage shim ──────────────────────────────────────
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// ── Import save system (ESM) ──────────────────────────────────────
const { loadGame, saveGame, resetGame, hasSave } = await import(
  '../src/renderer/game/systems/saveSystem.js'
);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// Read straight out of saveSystem.js: a hard-coded copy of this number
// is what left this gate red and ignored for several save versions.
const CURRENT_VERSION = Number(
  /const CURRENT_VERSION = (\d+)/.exec(
    readFileSync(new URL('../src/renderer/game/systems/saveSystem.js', import.meta.url), 'utf8'),
  )[1],
);

console.log('\n── Save System Smoke Tests ──\n');

// 1. Default save shape
const def = loadGame();
assert(def.version === CURRENT_VERSION, `defaultSave version is ${CURRENT_VERSION}`);
assert(def.player?.scene === 'ZuzuGarageScene', 'default scene is ZuzuGarageScene');
assert(def.player?.x === 400 && def.player?.y === 350, 'default spawn position 400,350');
assert(Array.isArray(def.inventory) && def.inventory.length > 0, 'default inventory is non-empty');
assert(Array.isArray(def.completedQuests) && def.completedQuests.length === 0, 'completedQuests starts empty');
assert(def.activeQuest === null, 'activeQuest starts null');
assert(Array.isArray(def.upgrades) && def.upgrades.length === 0, 'upgrades starts empty');
assert(def.zuzubucks === 0, 'zuzubucks starts at 0');
assert(def.reputation === 0, 'reputation starts at 0');
assert(def.hasSeenOnboarding === false, 'hasSeenOnboarding starts false');
assert(Array.isArray(def.journal) && def.journal.length > 0, 'journal has initial entry');

// 2. hasSave with no save
assert(hasSave() === false, 'hasSave() returns false when no save exists');

// 3. Save + load round-trip
const modified = {
  ...def,
  zuzubucks: 42,
  completedQuests: ['flat_tire_repair'],
  hasSeenOnboarding: true,
  player: { x: 100, y: 200, scene: 'StreetBlockScene' },
};
saveGame(modified);
const loaded = loadGame();
assert(loaded.zuzubucks === 42, 'round-trip preserves zuzubucks');
assert(loaded.completedQuests.includes('flat_tire_repair'), 'round-trip preserves completedQuests');
assert(loaded.hasSeenOnboarding === true, 'round-trip preserves hasSeenOnboarding');
assert(loaded.player.scene === 'StreetBlockScene', 'round-trip preserves player scene');

// 4. hasSave after saving
assert(hasSave() === true, 'hasSave() returns true after save');

// 5. Simulate learning progress stored under different key
const LEARNING_KEY = 'bikebrowser_learning_progress';
localStorage.setItem(LEARNING_KEY, JSON.stringify({
  version: 1,
  topics: { flat_tire: { state: 'completed', updatedAt: Date.now(), activities: [] } },
  stats: { videosWatched: 3, questsCompleted: 1, topicsStarted: 1, topicsCompleted: 1 },
}));

// 6. Reset game
const fresh = resetGame();
assert(hasSave() === false, 'hasSave() returns false after reset');
assert(fresh.zuzubucks === 0, 'resetGame returns fresh state with 0 zuzubucks');
assert(fresh.completedQuests.length === 0, 'resetGame returns fresh state with no quests');
assert(fresh.hasSeenOnboarding === false, 'resetGame restores hasSeenOnboarding to false');
assert(fresh.player.scene === 'ZuzuGarageScene', 'resetGame restores starting scene');

// 6b. Retired scene keys are rewritten on load, at every version (MUST 0.15)
//
// Saves written while the Dry Wash west-edge bug was live are at the
// CURRENT version and name NeighborhoodScene. Migrating the key only
// inside the v2->v3 step let every one of those through, so the child
// reopened the retired scene and walking out of it wrote the key back.
const RETIRED = { GarageScene: 'ZuzuGarageScene', NeighborhoodScene: 'OverworldScene' };
for (let version = 1; version <= CURRENT_VERSION; version += 1) {
  for (const [retired, live] of Object.entries(RETIRED)) {
    localStorage.setItem('bikebrowser_game_save', JSON.stringify({
      ...def, version, player: { x: 100, y: 200, scene: retired },
    }));
    const out = loadGame();
    assert(out.player.scene === live,
      `v${version} save in ${retired} loads into ${live} (got ${out.player.scene})`);
  }
}
resetGame();

// 7. Learning progress survives reset
const learningAfter = JSON.parse(localStorage.getItem(LEARNING_KEY));
assert(learningAfter !== null, 'learning progress key still exists after resetGame');
assert(learningAfter.topics?.flat_tire?.state === 'completed', 'learning topic state preserved after resetGame');
assert(learningAfter.stats?.questsCompleted === 1, 'learning stats preserved after resetGame');

// ── Summary ────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
process.exit(failed > 0 ? 1 : 0);
