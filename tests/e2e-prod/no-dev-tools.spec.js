// No developer tools in what a child runs.
//
// Found during the MUST 1 fix, not from review.md: the production build
// had LayoutEditorOverlayScene running. It registers with active:true,
// so it was live in every session, listening for F2 — and F2 opens an
// editor that drags the scene's furniture around and writes a layout
// JSON. It also logged [pause-storm-debug] lines to the console.
//
// Two things to hold: it must not RUN (the safety half), and it must
// not be in the BUNDLE (the half a scene-list check cannot see — a
// static import keeps the class whatever the list says, which is how
// the first version of this fix still shipped it).
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'playwright/test';

import { activeScenes, boot } from './helpers/touchOnly.js';

const BUILD_DIR = path.resolve('build/assets');

/** Every JS chunk of the build under test. */
function bundleChunks() {
  return readdirSync(BUILD_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => ({ file: f, text: readFileSync(path.join(BUILD_DIR, f), 'utf8') }));
}

test('the dev layout editor is not running in the built game', async ({ page }) => {
  await boot(page);

  const scenes = await activeScenes(page);
  expect(scenes, 'no dev overlay among the running scenes')
    .not.toContain('LayoutEditorOverlayScene');

  const known = await page.evaluate(() => window.__phaserGame.scene.scenes
    .map((s) => s.scene.key));
  expect(known, 'the editor is not even registered')
    .not.toContain('LayoutEditorOverlayScene');

  // And F2 does nothing. A child with a keyboard presses every key.
  await page.keyboard.press('F2');
  await page.waitForTimeout(600);
  expect(await activeScenes(page), 'F2 opened nothing')
    .not.toContain('LayoutEditorOverlayScene');
});

test('the dev layout editor is not in the shipped bundle', () => {
  const chunks = bundleChunks();
  expect(chunks.length, 'found build chunks to search').toBeGreaterThan(0);

  // Strings that only exist inside the editor module.
  for (const needle of ['pause-storm-debug', 'LayoutEditorOverlayScene']) {
    const hits = chunks.filter((c) => c.text.includes(needle)).map((c) => c.file);
    expect(hits, `"${needle}" must not be in any chunk`).toEqual([]);
  }
});

// The build under test carries VITE_E2E_HANDLE, which adds window
// handles and nothing else. This proves the flag is the only difference
// — and that the handles are flag-gated rather than unconditional, so a
// real build cannot be driven from the console.
test('the test handles are behind the flag, not unconditional', () => {
  const chunks = bundleChunks();
  const guarded = chunks.filter((c) => c.text.includes('__bbGoto'));
  expect(guarded.length, 'this build has the handles (flag is on)').toBeGreaterThan(0);

  const src = readFileSync('src/renderer/game/GameContainer.jsx', 'utf8');
  const install = src.indexOf('window.__bbGoto');
  const guard = src.indexOf('if (E2E_HANDLE_ENABLED) {');
  expect(guard, 'the handle install site is guarded').toBeGreaterThan(-1);
  expect(install, 'and the guard comes first').toBeGreaterThan(guard);
  expect(src).toMatch(
    /const E2E_HANDLE_ENABLED\s*=\s*\n?\s*import\.meta\.env\.DEV\s*\|\|\s*import\.meta\.env\.VITE_E2E_HANDLE === 'true'/,
  );
});
