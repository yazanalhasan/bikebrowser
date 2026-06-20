import { test, expect } from 'playwright/test';

// Phase 3 — Load Testing & Stress Visualization: engine correctness + player
// reachability. The structural engine is exercised via the debug API (like other
// rebuild specs' setup); the load-test walkthrough is stepped by REAL keyboard.
const captureDir = 'playtest_captures/game_rebuild_loadtest';

async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

test.describe('Phase 3 — load testing & stress visualization', () => {
  test('the safe bridge holds the monsoon; a concrete brace fails in tension', async ({ page }) => {
    test.setTimeout(45_000);
    await ready(page);

    const r = await page.evaluate(() => {
      const g = window.__GAME__;
      // concrete first so the final state reflects the safe (passing) run.
      const concrete = g.runLoadTest({ deck: 'bamboo', support: 'steel', brace: 'concrete' });
      const safe = g.runLoadTest({ deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' });
      const lt = g.getAct1State().loadTest;
      return {
        safeOk: safe.ok,
        safeTarget: safe.passedTarget,
        concreteOk: concrete.ok,
        concreteFailedAt: concrete.failedAt,
        completed: lt.completed,
        scenarioCount: Array.isArray(lt.scenarios) ? lt.scenarios.length : 0,
      };
    });
    expect(r.scenarioCount, 'five progressive load scenarios').toBe(5);
    expect(r.safeOk, 'the safe bridge holds every scenario').toBe(true);
    expect(r.safeTarget, 'the safe bridge passes the monsoon target').toBe(true);
    expect(r.concreteOk, 'a concrete brace fails the load test').toBe(false);
    expect(r.concreteFailedAt, 'concrete fails in a tension member').toBeTruthy();
    expect(r.completed, 'the system records completion after the safe run').toBe(true);

    // Reachable + payoff: open the load test and step every load by REAL keyboard.
    await page.evaluate(() => window.__bikebrowserRebuildGame.scene
      .getScene('NeighborhoodScene').registry.events
      .emit('loadTest:start', { deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' }));
    await page.waitForFunction(() => window.__LOAD_TEST__ && window.__LOAD_TEST__.active === true, null, { timeout: 8000 });

    const { mkdirSync } = await import('node:fs');
    mkdirSync(captureDir, { recursive: true });

    const verdicts = [];
    for (let i = 0; i < 5; i += 1) {
      const st = await page.evaluate(() => ({
        id: window.__LOAD_TEST__.scenarioId,
        verdict: window.__LOAD_TEST__.verdict,
      }));
      verdicts.push(st);
      if (i === 4) await page.screenshot({ path: `${captureDir}/monsoon_hold.png`, fullPage: true });
      await page.keyboard.press('KeyE');
      await page.waitForTimeout(140);
    }

    expect(verdicts.map((v) => v.verdict).every((v) => v === 'hold'), 'safe bridge holds every load').toBe(true);
    expect(verdicts[0].id, 'starts at the lightest load').toBe('person');
    expect(verdicts[4].id, 'reaches the monsoon flood').toBe('monsoon_flood');

    // Stepping past the last load closes the scene.
    await page.waitForFunction(() => window.__LOAD_TEST__.active === false, null, { timeout: 5000 });
  });
});
