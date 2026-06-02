// legacy-deep.audit.spec.js — Deeper interaction probe of /legacy-play.
// Dismisses the audio-unlock modal, advances the opening dialogue, then drives
// scene transitions directly to verify multiple legacy scenes actually RENDER
// playable content (not just register). Captures one screenshot per scene.

import { mkdirSync, writeFileSync } from 'node:fs';
import { test } from 'playwright/test';

const DIR = 'playtest_captures/legacy_vs_rebuild';

test('LEGACY deep scene reachability + render probe', async ({ page }) => {
  test.setTimeout(120000);
  mkdirSync(DIR, { recursive: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });

  await page.goto('/legacy-play', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  // Start Adventure splash
  await page.getByRole('button', { name: 'Start Adventure!' }).click({ timeout: 5000 }).catch(() => {});
  await page.waitForFunction(() => Boolean(window.__phaserGame), null, { timeout: 20000 });
  await page.waitForTimeout(1500);

  // Dismiss the "Tap to Start" audio-unlock modal (it's a full button overlay).
  await page.getByText('Tap to Start').click({ timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(800);

  // Advance the opening Zuzu dialogue (click "Continue ->" until gone).
  for (let i = 0; i < 8; i++) {
    const cont = page.getByRole('button', { name: /Continue/ });
    if (await cont.count().catch(() => 0)) {
      await cont.first().click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(400);
    } else break;
  }
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${DIR}/legacy_10_garage_dialogued.png`, fullPage: true });

  // Probe: directly start each major scene and record what renders.
  const targets = [
    'OverworldScene', 'WorldMapScene', 'MaterialLabScene', 'ThermalRigScene',
    'DryWashScene', 'CopperMineScene', 'DesertForagingScene', 'MountainScene',
    'LakeEdgeScene', 'CommunityPoolScene', 'DogParkScene', 'CognitiveQuestScene',
    'DesertTrailScene', 'SaltRiverScene', 'StreetBlockScene', 'SportsFieldsScene',
    'ExplainerScene',
  ];
  const results = [];
  let idx = 11;
  for (const key of targets) {
    const before = await page.evaluate((k) => {
      const g = window.__phaserGame;
      try {
        // Stop the currently active gameplay scenes, then start target.
        const active = g.scene.getScenes(true).map((s) => s.scene.key);
        for (const a of active) {
          if (a !== 'LayoutEditorOverlayScene') g.scene.stop(a);
        }
        g.scene.start(k);
        return { ok: true, prevActive: active };
      } catch (e) { return { ok: false, error: String(e).slice(0, 160) }; }
    }, key);
    await page.waitForTimeout(1800);
    const state = await page.evaluate((k) => {
      const g = window.__phaserGame;
      const s = g.scene.getScene(k);
      if (!s) return { exists: false };
      const active = Boolean(s.scene.isActive && s.scene.isActive());
      let childCount = 0; let textSamples = []; let interactive = 0;
      try {
        const list = s.children?.list || [];
        childCount = list.length;
        for (const o of list) {
          if (o.input && o.input.enabled) interactive++;
          if (o.type === 'Text' && o.text && textSamples.length < 12) {
            const t = String(o.text).trim();
            if (t) textSamples.push(t.slice(0, 60));
          }
        }
      } catch {}
      return { exists: true, active, childCount, interactive, textSamples };
    }, key);
    results.push({ key, start: before, ...state });
    const num = String(idx).padStart(2, '0');
    await page.screenshot({ path: `${DIR}/legacy_${num}_${key}.png`, fullPage: true });
    idx++;
  }

  writeFileSync(`${DIR}/legacy_deep_probe.json`,
    JSON.stringify({ results, consoleErrors: errors }, null, 2));
  // eslint-disable-next-line no-console
  console.log('[LEGACY DEEP] probed %d scenes, errors=%d', results.length, errors.length);
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`  ${r.key}: active=${r.active} children=${r.childCount} interactive=${r.interactive} startOk=${r.start.ok}`);
  }
});
