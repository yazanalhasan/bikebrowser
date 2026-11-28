/**
 * The retired scenes cannot be reached, started, or saved. Plan MUST 0.15.
 *
 * The bug a child hit: walk west out of the Dry Wash after building the
 * bridge and you crossed into NeighborhoodScene — Graphics primitives, no
 * Act 1 art — whose "Go Home" opened the equally retired GarageScene,
 * which sent you back to the neighborhood. There was no way out, and
 * walking around in there wrote `scene: 'NeighborhoodScene'` into the
 * save, so reloading put the child straight back.
 *
 * Four ways in, so four things to hold shut:
 *   1. the west edge of the Dry Wash          (the live path)
 *   2. the adjacency table it read            (the data behind it)
 *   3. the scene registration in config       (started by key)
 *   4. a save that names a retired key        (any version, including v7)
 *
 * `tests/e2e/no-legacy-art.smoke.spec.js` proves it in the running game;
 * this is the cheap version that runs on every commit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const has = (p) => existsSync(new URL(p, root));

const RETIRED = ['GarageScene', 'NeighborhoodScene'];

// ── 1. the live path ───────────────────────────────────────────────────────

test('the Dry Wash west edge goes to the world map', () => {
  const scene = read('src/renderer/game/scenes/DryWashScene.js');
  assert.match(scene, /if \(edge === 'west'\)/,
    'the west edge is no longer special-cased');
  assert.match(scene, /transitionTo\(this, 'WorldMapScene', 'fromDryWash'\)/,
    'west must take the same door as the south exit zone');
  // And it must not fall through to the generic handler afterwards.
  const sensor = scene.slice(scene.indexOf("if (edge === 'west')"));
  assert.match(sensor.slice(0, 220), /return;/,
    'the west branch must return instead of also running a seamless transition');
});

test('no scene file mentions a retired scene by key', () => {
  const sources = [
    'src/renderer/game/scenes/DryWashScene.js',
    'src/renderer/game/scenes/OverworldScene.js',
    'src/renderer/game/scenes/LocalSceneBase.js',
    'src/renderer/game/systems/seamlessTraversal.js',
    'src/renderer/game/systems/sceneAmbience.js',
    'src/renderer/game/audio/audioManifest.js',
  ];
  const offenders = [];
  for (const file of sources) {
    const src = read(file);
    for (const key of RETIRED) {
      // 'ZuzuGarageScene' contains 'GarageScene', so match the whole word.
      const hits = src.match(new RegExp(`(?<![A-Za-z])${key}(?![A-Za-z])`, 'g')) || [];
      // A comment explaining why it is gone is allowed; a line of code is not.
      const code = src
        .split('\n')
        .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
        .join('\n')
        .match(new RegExp(`(?<![A-Za-z])${key}(?![A-Za-z])`, 'g')) || [];
      if (code.length) offenders.push(`${file}: ${key} x${code.length} (${hits.length} total)`);
    }
  }
  assert.deepEqual(offenders, []);
});

// ── 2. the data behind it ─────────────────────────────────────────────────

test('the adjacency table points at no retired scene', async () => {
  const { SCENE_ADJACENCY } = await import(
    new URL('src/renderer/game/systems/seamlessTraversal.js', root)
  );
  const targets = Object.values(SCENE_ADJACENCY)
    .flatMap((edges) => Object.values(edges).map((e) => e.to));
  for (const key of RETIRED) {
    assert.equal(targets.includes(key), false, `an edge still leads to ${key}`);
  }
  assert.equal(Object.keys(SCENE_ADJACENCY).some((k) => RETIRED.includes(k)), false,
    'a retired scene still has edges of its own');
});

// ── 3. started by key ─────────────────────────────────────────────────────

test('the scene files and their editor bases are deleted', () => {
  for (const p of [
    'src/renderer/game/scenes/GarageScene.js',
    'src/renderer/game/scenes/NeighborhoodScene.js',
    'src/renderer/game/editor-scenes/GarageSceneBase.js',
    'src/renderer/game/editor-scenes/NeighborhoodSceneBase.js',
    'public/layouts/neighborhood.layout.json',
  ]) {
    assert.equal(has(p), false, `${p} is still here`);
  }
});

test('config registers neither of them', () => {
  const config = read('src/renderer/game/config.js');
  for (const key of RETIRED) {
    assert.doesNotMatch(config, new RegExp(`import ${key} from`),
      `config still imports ${key}`);
    assert.doesNotMatch(config, new RegExp(`^  ${key},$`, 'm'),
      `config still puts ${key} in ALL_SCENES`);
  }
  // The key map stays: it is how an old save finds its way to a live scene.
  assert.match(config, /SCENE_KEY_MIGRATION/);
});

// ── 4. a save that names a retired key ────────────────────────────────────

test('a save naming a retired scene loads into the live one, at every version',
  async () => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    };
    const { loadGame } = await import(
      new URL('src/renderer/game/systems/saveSystem.js', root)
    );
    const version = Number(
      /const CURRENT_VERSION = ([0-9]+)/.exec(
        read('src/renderer/game/systems/saveSystem.js'),
      )[1],
    );
    const live = { GarageScene: 'ZuzuGarageScene', NeighborhoodScene: 'OverworldScene' };

    for (let v = 1; v <= version; v += 1) {
      for (const [retired, expected] of Object.entries(live)) {
        store.set('bikebrowser_game_save', JSON.stringify({
          version: v,
          player: { x: 100, y: 200, scene: retired },
          inventory: [], completedQuests: [], activeQuest: null,
        }));
        assert.equal(loadGame().player.scene, expected,
          `a v${v} save in ${retired} must load into ${expected}`);
      }
    }
  });

test('the save written while the bug was live is the one that must migrate', async () => {
  // Not a version bump away — the current version, with the retired key
  // written into it by the bug itself. Migrating inside the v2->v3 step
  // (which is where this lived) let every one of these through.
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
  const { loadGame } = await import(
    new URL('src/renderer/game/systems/saveSystem.js', root)
  );
  store.set('bikebrowser_game_save', JSON.stringify({
    version: 7,
    player: { x: 1180, y: 520, scene: 'NeighborhoodScene' },
    completedQuests: ['bridge_collapse'],
    activeQuest: null,
    inventory: ['tire_lever'],
  }));
  const loaded = loadGame();
  assert.equal(loaded.player.scene, 'OverworldScene');
  assert.deepEqual(loaded.completedQuests, ['bridge_collapse'],
    'the migration must not drop the progress the child earned');
});
