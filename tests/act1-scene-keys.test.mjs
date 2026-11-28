/**
 * The scene keys in config.js are the keys the scenes actually use.
 *
 * Plan MUST 0.16. `createGameConfig` used to find the boot scene with
 * `s.name === targetScene`. A production build renames every class, so
 * the match always failed, the list was never reordered, and the garage
 * booted no matter what the save said — a child who stopped in the Dry
 * Wash always woke up in the garage, and the garage spawn overwrote
 * where they had been standing.
 *
 * The fix writes each key out as a string literal, which a minifier
 * cannot touch. That only holds while the literals are *right*, so this
 * reads the key each scene registers out of its own source and compares.
 *
 * `tests/e2e-prod/resume-saved-scene.smoke.spec.js` proves the
 * behaviour on a real build; this is the cheap guard that runs on every
 * commit.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const config = read('src/renderer/game/config.js');

/** [{ key, importPath }] straight out of SCENE_LIST. */
function sceneList() {
  const block = config.slice(config.indexOf('export const SCENE_LIST'));
  const body = block.slice(0, block.indexOf('];'));
  const out = [];
  for (const m of body.matchAll(/\{ key: '([^']+)', scene: (\w+) \}/g)) {
    out.push({ key: m[1], className: m[2] });
  }
  return out;
}

/** Where config.js imports a class from. */
function importPathOf(className) {
  const m = config.match(new RegExp(`import ${className} from '([^']+)'`));
  return m ? m[1] : null;
}

/**
 * The key a scene registers.
 *
 * Either `super({ key: 'X' })` directly, `super({ key: SCENE_KEY })`
 * with a const above it, or — for a LocalSceneBase subclass — the key
 * passed up through the base constructor.
 */
function registeredKey(src) {
  const direct = src.match(/super\(\{\s*key:\s*'([^']+)'/);
  if (direct) return direct[1];

  const viaConst = src.match(/super\(\{\s*key:\s*([A-Z_][A-Z0-9_]*)/);
  if (viaConst) {
    const name = viaConst[1];
    const def = src.match(new RegExp(`const ${name}\\s*=\\s*'([^']+)'`));
    if (def) return def[1];
  }

  // LocalSceneBase subclasses: `super(SCENE_KEY, ...)` or super('Key', ...)
  const base = src.match(/super\(\s*'([^']+)'/);
  if (base) return base[1];
  const baseConst = src.match(/super\(\s*([A-Z_][A-Z0-9_]*)/);
  if (baseConst) {
    const def = src.match(new RegExp(`const ${baseConst[1]}\\s*=\\s*'([^']+)'`));
    if (def) return def[1];
  }
  return null;
}

test('SCENE_LIST exists and still has every scene', () => {
  const list = sceneList();
  assert.ok(list.length >= 19, `only ${list.length} scenes parsed out of SCENE_LIST`);
  // The boot-order contract: the garage is first, the dev overlay last.
  assert.equal(list[0].key, 'ZuzuGarageScene');
  assert.equal(list[list.length - 1].key, 'LayoutEditorOverlayScene');
});

test('every key in the list is the key that scene registers', () => {
  const wrong = [];
  for (const { key, className } of sceneList()) {
    const path = importPathOf(className);
    assert.ok(path, `config.js has no import for ${className}`);
    const file = `src/renderer/game/${path.replace(/^\.\//, '')}`;
    assert.ok(existsSync(new URL(file, root)), `${file} is missing`);
    const actual = registeredKey(read(file));
    if (actual !== key) wrong.push(`${className}: list says "${key}", scene registers "${actual}"`);
  }
  assert.deepEqual(wrong, []);
});

test('the boot scene is found by key, never by class name', () => {
  // Code only. The comment above the fix quotes the old expression on
  // purpose, and a test that cannot tell prose from code would fail on
  // the explanation of the very bug it is guarding.
  const code = config
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
  // The exact shape of the bug: `s.name` is whatever the minifier chose.
  assert.doesNotMatch(code, /\.name === targetScene/);
  assert.doesNotMatch(code, /constructor\?\.name === targetScene/);
  assert.match(code, /SCENE_LIST\.findIndex\(\(entry\) => entry\.key === targetScene\)/);
});

test('the migration runs before the lookup, so a retired key still boots', () => {
  const order = config.indexOf('SCENE_KEY_MIGRATION[targetScene]');
  const lookup = config.indexOf('SCENE_LIST.findIndex');
  assert.ok(order > 0 && lookup > order,
    'a v6 GarageScene save must be mapped to ZuzuGarageScene before the list is searched');
});

test('a built bundle can still be driven by the acceptance test', () => {
  // Without a handle there is no way to ask a production build which
  // scene is live, and 0.16 can only be proven on a production build.
  const container = read('src/renderer/game/GameContainer.jsx');
  assert.match(container, /VITE_E2E_HANDLE === 'true'/);
  assert.match(container, /if \(E2E_HANDLE_ENABLED\) \{\s*\n\s*window\.__phaserGame = game;/);
});
