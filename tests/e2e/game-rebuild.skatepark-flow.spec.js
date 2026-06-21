import { test, expect } from 'playwright/test';

// Skate Park — Phase 4 (flow system + park metrics + reasoning quests).
async function ready(page) {
  await page.goto('/game-rebuild');
  await page.waitForFunction(() => window.__bikebrowserRebuildReady === true && Boolean(window.__GAME__));
  await expect(page.locator('canvas')).toBeVisible();
}

test('reasoning quests complete from run telemetry; flow + metrics compute', async ({ page }) => {
  test.setTimeout(40000);
  await ready(page);
  await page.evaluate(() => window.__GAME__.resetAct1());

  const result = await page.evaluate(() => {
    const sp = window.__bikebrowserRebuildGame.registry.get('act1Runtime').skateParkSystem;
    const before = sp.getState().questsComplete;
    // optimization: reach the flag with flow >= target
    const r1 = sp.recordRun({ reachedFlag: true, flowScore: 75 });
    // prediction: ride off both the ramp and the quarter pipe
    const r2 = sp.recordRun({ usedRamp: true, usedQuarter: true, rampDist: 220, quarterDist: 90 });
    // experimental: ride the steel rail and the concrete pad
    const r3 = sp.recordRun({ rodeSteel: true, rodeConcrete: true });
    const st = sp.getState();
    return {
      before,
      completed: [...r1.completed, ...r2.completed, ...r3.completed],
      questsComplete: st.questsComplete,
      totalQuests: st.quests.length,
      bestFlow: st.bestFlow,
      metrics: st.metrics,
      flowFrom: sp.constructor.flowFrom({ avgSpeed: 300, progress: 1, bails: 0 }),
    };
  });

  expect(result.before).toBe(0);
  expect(result.completed).toEqual(expect.arrayContaining(['sk_optimize_flow', 'sk_predict_distance', 'sk_experiment_friction']));
  expect(result.questsComplete, 'all three reasoning quests complete').toBe(3);
  expect(result.totalQuests).toBeGreaterThanOrEqual(3);
  expect(result.bestFlow).toBeGreaterThanOrEqual(75);
  // metrics extended (Phase 4)
  for (const k of ['flowScore', 'safety', 'creativity', 'popularity', 'physicsComplexity']) {
    expect(result.metrics[k], `metric ${k}`).not.toBeNull();
  }
  // flow formula rewards speed + progress + clean
  expect(result.flowFrom).toBeGreaterThan(60);
});

test('a partial design does NOT complete a quest (optimization needs the flag AND flow)', async ({ page }) => {
  test.setTimeout(20000);
  await ready(page);
  await page.evaluate(() => window.__GAME__.resetAct1());
  const ok = await page.evaluate(() => {
    const sp = window.__bikebrowserRebuildGame.registry.get('act1Runtime').skateParkSystem;
    const r = sp.recordRun({ reachedFlag: true, flowScore: 40 }); // flow too low
    return { completed: r.completed, optDone: sp.quests.find((q) => q.id === 'sk_optimize_flow').done };
  });
  expect(ok.completed).not.toContain('sk_optimize_flow');
  expect(ok.optDone).toBe(false);
});

test('the live Flow meter rises while riding', async ({ page }) => {
  test.setTimeout(30000);
  await ready(page);
  await page.evaluate(() => { window.__GAME__.setAudioSettings({ speechEnabled: false }); window.__bikebrowserRebuildGame.registry.events.emit('skate:start'); });
  await page.waitForFunction(() => window.__SKATE__?.active === true);
  await page.waitForTimeout(300);
  const flow0 = (await page.evaluate(() => window.__SKATE__)).flow;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(800);
  await page.keyboard.up('KeyD');
  const flow1 = (await page.evaluate(() => window.__SKATE__)).flow;
  expect(flow1, 'flow increases as the rider builds momentum + progress').toBeGreaterThan(flow0);
});
