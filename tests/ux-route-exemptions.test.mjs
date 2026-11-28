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

test('nothing still routes /play3d', () => {
  // A redirect and a prod-routing check outlived the route itself. The
  // redirect made /play3d serve the app shell, so the dead route looked
  // alive from outside; the check then asserted it did.
  // Rules only — a comment saying why the route went is worth keeping.
  const rules = read('public/_redirects')
    .split('\n')
    .filter((l) => l.trim() && !l.trim().startsWith('#'));
  assert.deepEqual(rules.filter((l) => /play3d/.test(l)), []);
  assert.doesNotMatch(read('scripts/check-production-routing.mjs'), /play3d/);
});

test('the 3D asset tree and its Pages function are gone', () => {
  // Scaffolding for a screen that no longer exists: an empty manifest
  // plus a worker whose only job was serving that tree.
  for (const p of [
    'public/game3d-assets',
    'functions/game3d-assets',
    'public/game3d-assets/manifests/proof-of-life.manifest.json',
    'functions/game3d-assets/[[path]].js',
  ]) {
    assert.equal(existsSync(new URL(p, root)), false, `${p} is still here`);
  }
});

test('a dead asset URL answers 404, not the app shell', () => {
  // Deleting the files is not enough on its own. `/* /index.html 200`
  // catches every unknown path, so /game3d-assets/manifests/... kept
  // answering 200 with HTML — a JSON fetch gets a page instead of a
  // file, and the dead path looks alive from outside. Pages takes the
  // first matching rule, so the 404 has to sit above the catch-all.
  const lines = read('public/_redirects')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const guard = lines.findIndex((l) => l.startsWith('/game3d-assets/*'));
  const catchAll = lines.findIndex((l) => l.startsWith('/*'));
  assert.notEqual(guard, -1, 'no rule 404s the removed asset tree');
  assert.match(lines[guard], /404$/, 'the rule must answer 404');
  assert.ok(guard < catchAll, 'the 404 rule must come before the catch-all');
});

test('the build no longer carves out 3D chunks', () => {
  const vite = read('vite.config.js');
  assert.doesNotMatch(vite, /vendor-three|vendor-r3f|vendor-drei|vendor-rapier/);
});
