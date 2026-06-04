// discovery-fun-qa.spec.js — independent Fun verification of the Discovery
// Registry rework. Player input only; read-only state for verification.
// Tests: proximity discovery (NO E), first-discovery [J] tutorial, HUD legend,
// City Gate -> Salt River consequence, registry, motivation/variety.
import { test, expect } from 'playwright/test';
import fs from 'fs';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/discovery_fun';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(220000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }

function world(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); if (!s) return null; return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label })) }; }); }
function discovery(p) { return p.evaluate(() => { try { const a = window.__GAME__.getAct1State(); const d = a.discovery || {}; return { count: (d.discovered || []).length, known: d.discovered || [], regions: (d.regions || []).map(r => ({ id: r.id, discovered: r.discovered })), widerMapUnlocked: d.widerMapUnlocked, unlocks: d.unlocks || d.discoveryUnlocks || a.discoveryUnlocks || null, raw_keys: Object.keys(a) }; } catch (e) { return { err: String(e) }; } }); }
function fb(p) { return p.evaluate(() => { try { const f = window.__GAME__.getFeedbackState(); return f?.last ? { kind: f.last.kind, message: f.last.message } : null; } catch { return null; } }); }
function saltRiverState(p) { return p.evaluate(() => { try { const a = window.__GAME__.getAct1State(); const blob = JSON.stringify(a).toLowerCase(); return { saltMentioned: blob.includes('salt'), revealedFlag: a.discovery?.unlocks?.saltRiverRevealed ?? a.discoveryUnlocks?.saltRiverRevealed ?? a.discovery?.saltRiverRevealed ?? null }; } catch { return null; } }); }

async function walkNear(p, t, stopDist, maxSteps, sampleCb) {
  let last = null, stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await world(p); if (!w) return false;
    const dx = t.x - w.player.x, dy = t.y - w.player.y;
    const dist = Math.hypot(dx, dy);
    if (sampleCb) await sampleCb(dist, i);
    if (dist < stopDist) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 4) stuck++; else stuck = 0;
    last = w.player;
    const ks = [];
    if (stuck >= 4) ks.push(['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4]);
    else if (stuck >= 2) ks.push(Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'));
    else { if (Math.abs(dx) > 18) ks.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft'); if (Math.abs(dy) > 18) ks.push(dy > 0 ? 'ArrowDown' : 'ArrowUp'); }
    for (const k of ks) await p.keyboard.down(k);
    await p.waitForTimeout(110);
    for (const k of ks) await p.keyboard.up(k);
  }
  return false;
}

test('discovery registry FUN verification (player)', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await page.getByText(/Play BikeBrowser|Act 1/i).last().click({ timeout: 6000 });
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  await page.waitForFunction(() => { const g = window.__bikebrowserRebuildGame; return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player)); }, null, { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ position: { x: 300, y: 300 } }).catch(() => {});
  await shot(page, '00-loaded-HUD');

  const w0 = await world(page);
  const byId = Object.fromEntries((w0?.zones || []).map((z) => [z.id, z]));
  note('zones', { ids: Object.keys(byId), labels: (w0?.zones || []).map(z => z.label) });
  note('discovery_initial', await discovery(page));
  note('salt_initial', await saltRiverState(page));

  // Identify discovery/exploration targets (city gate, vista, salt, overlook, etc.)
  const targets = (w0?.zones || []).filter(z => /gate|vista|salt|overlook|expedition|city|discover|landmark/i.test(z.id + ' ' + (z.label || '')));
  note('discovery_targets', { targets: targets.map(t => ({ id: t.id, label: t.label })) });

  // EXPLORATION + DISCOVERABILITY: approach the first target by PROXIMITY (no E),
  // sampling discovery count to catch a proximity-triggered discovery + tutorial.
  let firstFired = null;
  if (targets.length) {
    const t = byId[targets[0].id];
    const beforeCount = (await discovery(page)).count;
    await walkNear(page, t, 40, 90, async (dist, i) => {
      const d = await discovery(page);
      if (d.count > beforeCount && !firstFired) {
        firstFired = { atDistance: Math.round(dist), step: i, feedback: await fb(page), count: d.count };
        await shot(page, '10-first-discovery-proximity');
      }
    });
    note('exploration_first_target', { id: targets[0].id, beforeCount, firstFired, after: await discovery(page), feedback: await fb(page) });
    await shot(page, '11-after-approach-1');
  }

  // DISCOVERABILITY: press J to open registry (does a tutorial teach this on first discovery?)
  await page.keyboard.press('j'); await page.waitForTimeout(900);
  await shot(page, '20-registry-J');
  note('registry_open', { discovery: await discovery(page) });
  await page.keyboard.press('j'); await page.waitForTimeout(300);

  // CONSEQUENCE: specifically discover the City Gate (by proximity) and check Salt River reveal.
  const gate = (w0?.zones || []).find(z => /city.?gate|^gate|city/i.test(z.id) || /city gate/i.test(z.label || ''));
  if (gate) {
    note('salt_before_gate', await saltRiverState(page));
    await walkNear(page, byId[gate.id], 36, 110, null);
    await page.waitForTimeout(600);
    note('gate_discovered', { id: gate.id, feedback: await fb(page), discovery: await discovery(page) });
    await shot(page, '30-city-gate');
    note('salt_after_gate', await saltRiverState(page));
    // did a Salt River expedition zone appear?
    const w1 = await world(page);
    note('zones_after_gate', { ids: (w1?.zones || []).map(z => z.id), new: (w1?.zones || []).map(z => z.id).filter(id => !byId[id]) });
  } else {
    note('no_city_gate_zone', {});
  }

  // MOTIVATION/VARIETY: approach a 2nd discovery target by proximity.
  if (targets.length > 1) {
    const t2 = byId[targets[1].id];
    const before = (await discovery(page)).count;
    await walkNear(page, t2, 38, 90, null);
    await page.waitForTimeout(500);
    note('exploration_second_target', { id: targets[1].id, before, after: await discovery(page), feedback: await fb(page) });
    await shot(page, '40-second-discovery');
  }

  // Final registry view
  await page.keyboard.press('j'); await page.waitForTimeout(800); await shot(page, '50-registry-final');
  note('discovery_final', await discovery(page));
  note('errors', { errors: errors.slice(0, 30) });
  fs.writeFileSync(`${SHOT}/discovery_fun.json`, JSON.stringify(log, null, 2));
  console.log('DISCOVERY_FUN_DONE');
  expect(Boolean(w0)).toBeTruthy();
});
