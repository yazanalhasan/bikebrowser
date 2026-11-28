/**
 * Everything a child reads on a phone is big enough to read. Plan 0.5.
 *
 * Measured at 390x844: the explainer's instruction line was 9.8 CSS px,
 * PATCH was 4.9, Silent Leak's answers 7.3, and every one of the
 * Materials Lab's thirty texts was under 8 with a median of 4.9. The
 * cause is the same each time — an 800- or 1280-wide layout
 * contain-fitted onto a 390px screen — and the plan's answer is a phone
 * column, not a smaller copy of the desktop.
 *
 * The floor: 12 CSS px for body text, 10 for labels, 44 for anything
 * you tap. A font size in the source is not a measurement, so this
 * reads the rendered height off the live object and multiplies by the
 * camera zoom, exactly as the screen does.
 */
import { test, expect } from 'playwright/test';

import { waitForGameBoot } from './helpers/gameBoot.js';
import { setViewport, dismissDialogs } from './helpers/overlapAudit.js';

const PHONE = { width: 390, height: 844 };

/** Labels may be 10; anything that reads as a sentence must be 12. */
const MIN_LABEL_PX = 10;
const MIN_BODY_PX = 12;
const BODY_WORDS = 4;

/** A tap target this small is a miss, not a button. */
const MIN_TAP_PX = 44;

const ACT1_SAVE = {
  version: 7,
  player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
  inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube',
    'mesquite_wood', 'copper_ore', 'steel_scrap'],
  completedQuests: ['flat_tire_repair'],
  activeQuest: null,
  zuzubucks: 295,
  hasSeenOnboarding: true,
  materials: { mesquite_wood: 3, copper_ore: 2, steel_scrap: 1 },
  milestones: {},
};

async function boot(page) {
  await page.addInitScript((save) => {
    localStorage.setItem('bikebrowser_game_save', JSON.stringify(save));
  }, ACT1_SAVE);
  await waitForGameBoot(page);
  await setViewport(page, PHONE);
  await page.waitForTimeout(1200);
}

async function goTo(page, sceneKey) {
  await page.waitForFunction(() => window.__phaserGame?.scene?.scenes
    ?.some((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key)), null, { timeout: 20_000 });
  await page.evaluate((key) => {
    const game = window.__phaserGame;
    const live = game.scene.scenes.find((s) => s.scene.isActive() && !/Overlay/.test(s.scene.key));
    (live || game.scene).scene?.start?.(key) ?? game.scene.start(key);
  }, sceneKey);
  await page.waitForTimeout(2500);
  await dismissDialogs(page);
  const active = await page.evaluate(() => window.__phaserGame.scene.scenes
    .filter((s) => s.scene.isActive()).map((s) => s.scene.key));
  expect(active, `could not reach ${sceneKey}`).toContain(sceneKey);
}

/** Every visible text, with its height in CSS pixels. */
async function measureText(page, label) {
  return page.evaluate(({ MIN_LABEL, MIN_BODY, WORDS, LABEL }) => {
    const game = window.__phaserGame;
    const out = [];
    const visible = (o) => {
      if (!o.visible || o.alpha <= 0.05) return false;
      for (let p = o.parentContainer; p; p = p.parentContainer) {
        if (!p.visible || p.alpha <= 0.05) return false;
      }
      return true;
    };
    for (const scene of game.scene.scenes.filter((s) => s.scene.isActive())) {
      const zoom = scene.cameras.main.zoom;
      const walk = (list) => {
        for (const o of list) {
          if (!visible(o)) continue;
          if (o.type === 'Container') { walk(o.list || []); continue; }
          if (o.type !== 'Text' && o.type !== 'BitmapText') continue;
          const text = String(o.text || '').trim();
          if (!text) continue;
          // The rendered line height, as it lands on glass.
          const px = (o.style?.fontSize ? parseFloat(o.style.fontSize) : o.height) * zoom;
          const words = text.split(/\s+/).length;
          const floor = words >= WORDS ? MIN_BODY : MIN_LABEL;
          if (px + 0.05 < floor) {
            out.push(`[${LABEL}] ${scene.scene.key}: "${text.slice(0, 40).replace(/\n/g, ' ')}" `
              + `is ${px.toFixed(1)} CSS px (floor ${floor})`);
          }
        }
      };
      walk(scene.children.list);
    }
    return out;
  }, { MIN_LABEL: MIN_LABEL_PX, MIN_BODY: MIN_BODY_PX, WORDS: BODY_WORDS, LABEL: label });
}

/** Every control a child taps, with its size in CSS pixels. */
async function measureTaps(page, label) {
  return page.evaluate(({ MIN, LABEL }) => {
    const game = window.__phaserGame;
    const out = [];
    for (const scene of game.scene.scenes.filter((s) => s.scene.isActive())) {
      const zoom = scene.cameras.main.zoom;
      const walk = (list) => {
        for (const o of list) {
          if (!o.visible || o.alpha <= 0.05) continue;
          if (o.type === 'Container') { walk(o.list || []); continue; }
          if (!o.input) continue;
          // The HIT AREA, not the paint. A small icon with a generous
          // hit area is a fine touch target; a big picture with a
          // 20px hit area is not. Phaser stores an explicit hit area
          // on `input.hitArea`, and falls back to the display size.
          const hit = o.input.hitArea;
          const w = ((hit?.width ?? o.displayWidth) || 0) * zoom;
          const h = ((hit?.height ?? o.displayHeight) || 0) * zoom;
          if (w < 4 || h < 4) continue;   // decorative hit areas
          if (w + 0.5 < MIN || h + 0.5 < MIN) {
            const what = o.text ? `"${String(o.text).slice(0, 24)}"` : o.type;
            out.push(`[${LABEL}] ${scene.scene.key}: ${what} is ${w.toFixed(0)}x${h.toFixed(0)} `
              + `CSS px (floor ${MIN})`);
          }
        }
      };
      walk(scene.children.list);
    }
    return out;
  }, { MIN: MIN_TAP_PX, LABEL: label });
}

test('the Materials Lab is readable on a phone', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page);
  await goTo(page, 'MaterialLabScene');
  expect(await measureText(page, 'lab idle')).toEqual([]);
});

test('the Thermal Rig is readable on a phone', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page);
  await goTo(page, 'ThermalRigScene');
  expect(await measureText(page, 'thermal idle')).toEqual([]);
});

test('the lab can be worked by touch on a phone', async ({ page }) => {
  test.setTimeout(180_000);
  await boot(page);
  await goTo(page, 'MaterialLabScene');
  expect(await measureTaps(page, 'lab taps')).toEqual([]);
});

test('the world scenes a child reads are legible on a phone', async ({ page }) => {
  test.setTimeout(240_000);
  await boot(page);
  const found = [];
  for (const key of ['ZuzuGarageScene', 'StreetBlockScene', 'DryWashScene', 'WorldMapScene']) {
    await goTo(page, key);
    found.push(...await measureText(page, key));
  }
  expect(found).toEqual([]);
});
