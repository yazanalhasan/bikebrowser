import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';

import { ROUTE_EXEMPTIONS } from '../src/renderer/utils/uxSafety.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('the immersive game route is exempt from standard app chrome checks', () => {
  const route = '/play';
  assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_HOME_BUTTON'));
  assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_HEADER'));
  assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_NAV_CONTAINER'));
  assert.ok(ROUTE_EXEMPTIONS[route].includes('MUST_HAVE_MAIN_CONTENT'));
});

// ── /play3d is gone (plan 0.11, owner decision 2026-11-27) ────────────────

test('nothing exempts a route that no longer exists', () => {
  assert.equal(ROUTE_EXEMPTIONS['/play3d'], undefined);
});

test('the route, the page and the 3D tree are all gone', () => {
  assert.doesNotMatch(read('src/renderer/App.jsx'), /play3d|Game3DPage/);
  assert.equal(existsSync(new URL('src/renderer/pages/Game3DPage.jsx', root)), false);
  assert.equal(existsSync(new URL('src/renderer/game3d', root)), false);
});

test('the three.js stack is out of package.json', () => {
  const pkg = JSON.parse(read('package.json'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of ['three', '@react-three/fiber', '@react-three/drei', '@react-three/rapier']) {
    assert.equal(deps[name], undefined, `${name} is still a dependency`);
  }
  assert.equal(pkg.overrides?.three, undefined);
});

test('the build no longer carves out 3D chunks', () => {
  const vite = read('vite.config.js');
  assert.doesNotMatch(vite, /vendor-three|vendor-r3f|vendor-drei|vendor-rapier/);
});
