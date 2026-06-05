// phase1-engineering.spec.js — complete the engineering loop the *correct* way:
// collect -> predict -> test -> design (fail then succeed) -> repair -> unlock.
// Captures success-path feedback + the notebook Tests tab.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1';
test.setTimeout(120000);

const out = [];
const rec = (l, d) => out.push({ label: l, data: d });
async function call(page, m, ...a) {
  return page.evaluate(({ m, a }) => {
    try { const f = window.__GAME__?.[m]; if (!f) return { __missing: m };
      return JSON.parse(JSON.stringify(f(...a) ?? null)); } catch (e) { return { __error: String(e) }; }
  }, { m, a });
}
async function fb(page) {
  return page.evaluate(() => { const f = window.__GAME__?.getFeedbackState?.(); return f?.last ? { kind: f.last.kind, message: f.last.message } : null; });
}

test('Phase 1 engineering loop — success path', async ({ page }) => {
  await page.goto('/game-rebuild', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.__GAME__), null, { timeout: 20000 });
  await page.waitForTimeout(2000);

  // Collect candidate materials + mesquite via the in-world interaction handlers.
  rec('collect_materials', await call(page, 'handleInteraction', 'collect_materials'));
  rec('collect_materials_fb', await fb(page));
  rec('collect_mesquite', await call(page, 'handleInteraction', 'collect_mesquite'));
  rec('inventory', (await call(page, 'getInventoryState'))?.items);

  // Predict before testing (engineering loop step: predict)
  rec('predict_steel', await call(page, 'predictMaterial', 'steel', true, 'high', 'Steel is metal, should hold.'));
  rec('predict_scrap', await call(page, 'predictMaterial', 'balsa', false, 'medium', 'Balsa looks light and weak, probably fails.'));

  // Test in UTM (resolves predictions)
  const utm = {};
  for (const m of ['steel', 'balsa', 'bamboo', 'carbon_fiber']) {
    utm[m] = await call(page, 'testMaterial', m); utm[m + '_fb'] = await fb(page);
  }
  rec('utm', utm);
  await page.screenshot({ path: `${SHOT}/30-utm-success.png` });

  // Design bridge — first a weak deck (should be rejected), then all-safe.
  rec('design_weak', await call(page, 'designBridge', { deck: 'balsa', support: 'steel', brace: 'carbon_fiber' }));
  rec('design_weak_fb', await fb(page));
  rec('design_safe', await call(page, 'designBridge', { deck: 'steel', support: 'steel', brace: 'carbon_fiber' }));
  rec('design_safe_fb', await fb(page));
  await page.screenshot({ path: `${SHOT}/31-bridge-design.png` });

  // Repair + cross + unlock the wider map
  rec('repair', await call(page, 'repairBridge'));
  rec('repair_fb', await fb(page));
  rec('unlockWiderMap', await call(page, 'unlockWiderMap'));
  rec('unlockWiderMap_fb', await fb(page));
  await page.screenshot({ path: `${SHOT}/32-bridge-repaired.png` });

  // Engineering loop + reasoning grade after a full, corrected run
  const st = await call(page, 'getAct1State');
  rec('engineeringLoop', st?.engineeringLoop);
  rec('reasoning', st?.reasoning);
  rec('act1Complete', st?.act1Complete);
  rec('materialTests_tested', st?.materialTests?.tested);

  // Open notebook -> Tests tab to see the player-facing test record.
  await page.locator('canvas').first().click({ timeout: 2000 }).catch(() => page.mouse.click(400, 300));
  await page.keyboard.press('n'); await page.waitForTimeout(800);
  await page.getByText('Tests', { exact: false }).first().click({ timeout: 2000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOT}/33-notebook-tests.png` });

  fs.writeFileSync(`${SHOT}/phase1_engineering.json`, JSON.stringify(out, null, 2));
  expect(Boolean(st)).toBeTruthy();
});
