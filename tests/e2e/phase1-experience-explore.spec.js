// phase1-experience-explore.spec.js — TEMPORARY QA exploration harness.
// Boots each candidate game route, screenshots it, and reports which route
// exposes the Act1 Phase-1 runtime debug API (window.__GAME__) and Phaser.
// Output: screenshots + a JSON probe written to the EB qa_audit folder.

import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT_DIR = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1';
fs.mkdirSync(SHOT_DIR, { recursive: true });

// /legacy-play, /play, /play3d removed 2026-06-21 (quarantined prototypes) — probe
// only the live routes so this doesn't spend its budget on redirects/timeouts.
const ROUTES = ['/', '/game-rebuild'];

test('probe routes for Phase 1 runtime', async ({ page }) => {
  const probe = [];
  for (const route of ROUTES) {
    const entry = { route, errors: [] };
    page.removeAllListeners('pageerror');
    page.on('pageerror', (e) => entry.errors.push(e.message));
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      // Try clicking a Start/Continue/Play button if present.
      for (const name of ['Start Adventure!', 'Continue Adventure', 'Start', 'Play', 'Start Game']) {
        try { await page.getByRole('button', { name }).first().click({ timeout: 1500 }); break; } catch {}
      }
      await page.waitForTimeout(3500);
      entry.title = await page.title();
      entry.url = page.url();
      entry.hasGAME = await page.evaluate(() => Boolean(window.__GAME__));
      entry.hasPhaser = await page.evaluate(() => Boolean(window.__phaserGame));
      entry.gameKeys = await page.evaluate(() =>
        window.__GAME__ ? Object.keys(window.__GAME__).slice(0, 80) : null);
      entry.activeScenes = await page.evaluate(() => {
        const g = window.__phaserGame;
        if (!g?.scene?.scenes) return null;
        return g.scene.scenes.filter((s) => s.scene?.isActive?.()).map((s) => s.scene.key);
      });
      // Capture visible top-level text the player would see.
      entry.bodyText = (await page.evaluate(() => document.body?.innerText || ''))
        .replace(/\s+/g, ' ').trim().slice(0, 600);
      const safe = route.replace(/\W+/g, '_') || 'root';
      await page.screenshot({ path: `${SHOT_DIR}/route${safe}.png`, fullPage: false });
    } catch (e) {
      entry.fatal = String(e).slice(0, 300);
    }
    probe.push(entry);
  }
  fs.writeFileSync(`${SHOT_DIR}/route_probe.json`, JSON.stringify(probe, null, 2));
  console.log('ROUTE_PROBE\n' + JSON.stringify(probe, null, 2));
  expect(probe.length).toBe(ROUTES.length);
});
