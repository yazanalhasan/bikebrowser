// touchOnly.js — drive the built game the way a child on a phone does.
//
// This is the backbone of the 0.17 lifecycle suite. Two rules it exists
// to enforce, both learned the hard way:
//
//   * Touch only. A mouse click works on things a finger cannot reach,
//     and a keypress works on things that have no on-screen control at
//     all. The Materials Lab soft-lock (review MUST 1) was invisible to
//     every test I had written because they all used the keyboard.
//
//   * Against the built bundle. The 0.16 boot bug only existed after
//     minification. A green dev-server run is not acceptance.
//
// The one test-only flag is VITE_E2E_HANDLE, which adds window handles
// (__phaserGame, __approvedTextureKeys, __bbGoto) and changes no game
// behaviour. tests/e2e-prod/no-test-hooks.spec.js builds with the flag
// OFF and proves those handles are absent from what ships.

import { expect } from 'playwright/test';

/** The phone sizes the owner's review uses, portrait. */
export const PHONES = [
  { name: '360x740', width: 360, height: 740 },
  { name: '375x667', width: 375, height: 667 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 },
];

/** Every size a lifecycle spec runs at, portrait and landscape. */
export const VIEWPORTS = [
  { name: '1280x720', width: 1280, height: 720, phone: false },
  ...PHONES.map((p) => ({ ...p, phone: true })),
  ...PHONES.map((p) => ({
    name: `${p.height}x${p.width}-landscape`,
    width: p.height,
    height: p.width,
    phone: true,
  })),
];

/** Minimum tap target on a phone, in CSS px, and the text floors. */
export const MIN_TAP_CSS_PX = 44;
export const MIN_BODY_CSS_PX = 12;
export const MIN_LABEL_CSS_PX = 10;

/**
 * A real touch at a point in CSS pixels. Not a click: Playwright's
 * `click` dispatches mouse events, which the game also answers, so a
 * control that only works with a mouse would pass.
 */
export async function tapAt(page, x, y) {
  await page.touchscreen.tap(Math.round(x), Math.round(y));
}

/** Tap the centre of a DOM element, by touch. */
export async function tapElement(page, locator) {
  const box = await locator.boundingBox();
  expect(box, 'element has a box to tap').not.toBeNull();
  await tapAt(page, box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Boot the built game to the title screen and into play.
 *
 * Touch only, including the splash button — if "Start Adventure!" could
 * not be tapped, nothing else would matter.
 */
export async function boot(page, { route = '/play', timeout = 40_000 } = {}) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });

  const title = await page.title();
  if (!/bikebrowser/i.test(title)) {
    throw new Error(
      `Wrong app on the preview server: page title is "${title}". `
      + 'Another app is on the port (:5173 belongs to one on this box). '
      + 'Set BB_PREVIEW_PORT to a free port.',
    );
  }

  // Wait for the splash to render before looking for its button.
  // `count()` does not auto-wait, and at domcontentloaded React has not
  // mounted yet: the first version of this helper read zero buttons,
  // tapped nothing, and then sat for 40s waiting for a game that was
  // never started. An absence that never errors on its own, again.
  const start = page.getByRole('button', { name: 'Start Adventure!' });
  const cont = page.getByRole('button', { name: /Continue Adventure/ });
  const splash = start.or(cont).first();
  await splash.waitFor({ state: 'visible', timeout: 20_000 });
  await tapElement(page, splash);

  await page.waitForFunction(() => Boolean(window.__phaserGame), null, { timeout });
  await page.waitForFunction(
    () => window.__phaserGame.scene.scenes.some((s) => s.scene?.isActive?.()),
    null,
    { timeout },
  );
  // One frame with the HUD mounted.
  await page.waitForTimeout(400);
}

/** The scene keys Phaser currently has running. */
export async function activeScenes(page) {
  return page.evaluate(() => window.__phaserGame.scene.getScenes(true)
    .map((s) => s.scene.key));
}

/** Wait until `key` is one of the running scenes. */
export async function waitForScene(page, key, timeout = 10_000) {
  await page.waitForFunction(
    (want) => window.__phaserGame.scene.getScenes(true)
      .some((s) => s.scene.key === want),
    key,
    { timeout },
  );
  await page.waitForTimeout(300);
}

/**
 * Open every scene to a lifecycle spec without playing the whole act.
 *
 * Act 1 gates later scenes on reputation, and the point of a lifecycle
 * spec is the scene's own states, not the unlock ladder (which
 * tests/e2e has its own cover for). This seeds a state with the act's
 * progress already made, then jumps through the game's real transition.
 */
export async function unlockEverything(page) {
  await page.evaluate(() => {
    const game = window.__phaserGame;
    const state = game.registry.get('gameState') || {};
    game.registry.set('gameState', {
      ...state,
      reputation: Math.max(state.reputation || 0, 500),
      zuzubucks: Math.max(state.zuzubucks || 0, 500),
    });
  });
}

/**
 * Go to a scene by key, via the game's own transitionTo.
 *
 * @returns {Promise<void>} resolves once the scene is running.
 */
export async function goToScene(page, key, spawn = 'default') {
  await unlockEverything(page);
  const ok = await page.evaluate(
    ([k, s]) => window.__bbGoto(k, s),
    [key, spawn],
  );
  expect(ok, `__bbGoto reached a live scene to leave for ${key}`).toBe(true);
  await waitForScene(page, key);
}

/** Boot and land in `key`, touch only. */
export async function bootToScene(page, key, spawn = 'default') {
  await boot(page);
  await dismissDialogs(page);
  if (!(await activeScenes(page)).includes(key)) {
    await goToScene(page, key, spawn);
  }
  await dismissDialogs(page);
}

/**
 * Close any dialog, toast or first-entry hint that is in the way, by
 * touch. Returns the texts that were dismissed, so a lifecycle spec can
 * assert it actually saw the lines it expected.
 */
export async function dismissDialogs(page, { max = 12, settle = 1600 } = {}) {
  const seen = [];
  // Wait for a dialog that has not arrived yet. A scene's first-entry
  // hint is written ~600ms in, so a dismiss that ran the instant the
  // scene started saw nothing, returned, and left Mr. Chen's welcome
  // sitting over the rig for the whole of a five-state audit — every
  // state measured the same covered screen.
  await page.locator('[data-testid="dialog-box"]')
    .first()
    .waitFor({ state: 'visible', timeout: settle })
    .catch(() => {});
  for (let i = 0; i < max; i += 1) {
    const box = page.locator('[data-testid="dialog-box"]');
    const close = page.getByRole('button', { name: /^(Close|Got it|Continue|OK|Next)$/i });
    if (await box.count()) {
      const text = (await box.first().innerText().catch(() => '')).trim();
      if (text) seen.push(text);
    }
    if (await close.count()) {
      await tapElement(page, close.first());
      await page.waitForTimeout(250);
      continue;
    }
    // A dialog with no named button advances on a tap in its own body.
    if (await box.count()) {
      await tapElement(page, box.first());
      await page.waitForTimeout(250);
      continue;
    }
    break;
  }
  return seen;
}

/**
 * World coordinates -> page coordinates, as a string of JS to inject.
 *
 * Phaser zooms a camera about its MIDPOINT:
 *   screen = (world - scroll*scrollFactor - camW/2) * zoom + camX + camW/2
 * and then the canvas may be letterboxed or scaled by CSS on top.
 *
 * Dropping the midpoint term is correct at zoom 1 and wrong by
 * (camW/2)(zoom-1) at any other zoom — the Materials Lab runs at 1.2,
 * where it put every tap 128px to the right of what it aimed at.
 */
export const WORLD_TO_PAGE = `(scene, cam) => {
  const game = window.__phaserGame;
  const canvas = game.canvas;
  const r = canvas.getBoundingClientRect();
  const kx = r.width / canvas.width;
  const ky = r.height / canvas.height;
  const hw = cam.width / 2;
  const hh = cam.height / 2;
  return (wx, wy, sfx, sfy) => ({
    x: r.x + (((wx - cam.scrollX * sfx - hw) * cam.zoom) + cam.x + hw) * kx,
    y: r.y + (((wy - cam.scrollY * sfy - hh) * cam.zoom) + cam.y + hh) * ky,
  });
}`;

/** The same, as a factor: how many page px one game px is. */
export const PAGE_SCALE = `(cam) => {
  const canvas = window.__phaserGame.canvas;
  const r = canvas.getBoundingClientRect();
  return { x: (r.width / canvas.width) * cam.zoom, y: (r.height / canvas.height) * cam.zoom };
}`;

/** Where a world object is on the screen right now, in CSS pixels. */
export async function screenRectOf(page, sceneKey, pick) {
  return page.evaluate(([key, src, w2p, pscale]) => {
    // eslint-disable-next-line no-new-func
    const chooser = new Function('scene', `return (${src})(scene);`);
    const scene = window.__phaserGame.scene.getScenes(true)
      .find((s) => s.scene.key === key);
    if (!scene) return null;
    const obj = chooser(scene);
    if (!obj) return null;
    const cam = scene.cameras.main;
    const b = obj.getBounds ? obj.getBounds() : null;
    if (!b) return null;
    const sfx = obj.scrollFactorX ?? 1;
    const sfy = obj.scrollFactorY ?? 1;
    // eslint-disable-next-line no-new-func
    const toPage = new Function('return (' + w2p + ');')()(scene, cam);
    // eslint-disable-next-line no-new-func
    const k = new Function('return (' + pscale + ');')()(cam);
    const tl = toPage(b.x, b.y, sfx, sfy);
    return { x: tl.x, y: tl.y, width: b.width * k.x, height: b.height * k.y };
  }, [sceneKey, pick.toString(), WORLD_TO_PAGE, PAGE_SCALE]);
}

/** Screenshot a lifecycle state into qa/lifecycle/<scene>/<viewport>/. */
export async function shot(page, scene, viewport, nn, state) {
  const name = `${String(nn).padStart(2, '0')}-${state}`;
  await page.screenshot({
    path: `qa/lifecycle/${scene}/${viewport}/${name}.png`,
    animations: 'disabled',
  });
  return name;
}
