// phase2-retry.spec.js — fair, focused retry of Ecology Loop + Discovery + Map.
// Player input only; read-only verification (prompt text, feedback, hooks).
import { test, expect } from 'playwright/test';
import fs from 'fs';
const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase2_retry';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(200000);
const log = [];
const note = (a, x = {}) => log.push({ a, ...x });
async function shot(p, n) { await p.screenshot({ path: `${SHOT}/${n}.png` }).catch(() => {}); }

function readWorld(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); if (!s) return null; return { player: { x: Math.round(s.player.x), y: Math.round(s.player.y) }, zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label })) }; }); }
const promptText = (p) => p.evaluate(() => { const s = (window.__bikebrowserRebuildGame?.scene?.scenes || []).find((x) => x.prompt && x.player); return s?.prompt?.visible ? s.prompt.text : null; });
const feedback = (p) => p.evaluate(() => { try { const f = window.__GAME__.getFeedbackState(); return f?.last ? { kind: f.last.kind, message: f.last.message } : null; } catch { return null; } });
const eco = (p) => p.evaluate(() => window.__ECOLOGY__ || null);
const discovery = (p) => p.evaluate(() => { try { const d = window.__GAME__.getAct1State().discovery; return { count: d.discovered.length, known: d.discovered }; } catch { return null; } });
async function holdKey(p, key, ms) { await p.keyboard.down(key); await p.waitForTimeout(ms); await p.keyboard.up(key); await p.waitForTimeout(30); }
async function nearestId(p) { return p.evaluate(() => { const g = window.__bikebrowserRebuildGame; const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player); return s?.interactions?.nearest?.(s.player)?.id ?? null; }); }
// Holds each axis PROPORTIONAL to distance (the player moves ~160px/s; fixed
// micro-steps spent all their wall-clock in readWorld round-trips and timed out).
async function walkTo(p, t, maxSteps = 110) {
  if (!t) return false; let last = null, stuck = 0;
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(p); if (!w) return false;
    const dx = t.x - w.player.x, dy = t.y - w.player.y;
    if (Math.hypot(dx, dy) < 44) return true;
    if (t.id && (await nearestId(p)) === t.id) return true;
    if (last && Math.hypot(w.player.x - last.x, w.player.y - last.y) < 5) stuck++; else stuck = 0; last = w.player;
    if (stuck >= 4) { await holdKey(p, ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][i % 4], 200); continue; }
    if (stuck >= 2) { await holdKey(p, Math.abs(dx) <= Math.abs(dy) ? (dx >= 0 ? 'ArrowRight' : 'ArrowLeft') : (dy >= 0 ? 'ArrowDown' : 'ArrowUp'), 220); continue; }
    if (Math.abs(dx) > 18) await holdKey(p, dx > 0 ? 'ArrowRight' : 'ArrowLeft', Math.min(240, Math.max(55, Math.abs(dx) * 1.9)));
    if (Math.abs(dy) > 18) await holdKey(p, dy > 0 ? 'ArrowDown' : 'ArrowUp', Math.min(240, Math.max(55, Math.abs(dy) * 1.9)));
  }
  const w = await readWorld(p); return w ? Math.hypot(t.x - w.player.x, t.y - w.player.y) < 66 : false;
}

test('phase2 retry: ecology, discovery, map', async ({ page }) => {
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
  const byId = Object.fromEntries(((await readWorld(page))?.zones || []).map((z) => [z.id, z]));

  // ---- DISCOVERY by interaction (press E at a region) ----
  note('discovery_before', await discovery(page));
  if (await walkTo(page, byId.dry_wash)) {
    note('dry_wash_prompt', { prompt: await promptText(page) });
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    note('dry_wash_after', { feedback: await feedback(page), discovery: await discovery(page) });
    await shot(page, '10-drywash-E');
  }

  // ---- ECOLOGY: try garden directly, then prerequisite path ----
  if (await walkTo(page, byId.ecology_garden)) {
    note('garden_prompt_direct', { prompt: await promptText(page) });
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    note('garden_direct', { eco: await eco(page), feedback: await feedback(page) });
    await shot(page, '20-garden-direct');
    await page.keyboard.press(' '); await page.waitForTimeout(500);
    note('garden_direct_space', { eco: await eco(page), feedback: await feedback(page) });
  }
  // prerequisite: observe desert helpers, then collect, test, then garden again
  if (await walkTo(page, byId.ecology_patch)) {
    note('patch_prompt', { prompt: await promptText(page) });
    await page.keyboard.press('e'); await page.waitForTimeout(700);
    note('patch_after', { feedback: await feedback(page) });
    await shot(page, '21-patch-E');
  }
  // also do bike+materials+UTM (some loops gate on quest progress) — light setup
  for (const id of ['bike', 'materials_table']) { if (await walkTo(page, byId[id])) { await page.keyboard.press('e'); await page.waitForTimeout(500); await page.keyboard.press('e'); await page.waitForTimeout(300); } }
  // retry garden after prerequisites
  if (await walkTo(page, byId.ecology_garden)) {
    note('garden_prompt_retry', { prompt: await promptText(page) });
    await page.keyboard.press('e'); await page.waitForTimeout(800);
    const e1 = await eco(page);
    note('garden_retry', { eco: e1, feedback: await feedback(page) });
    await shot(page, '22-garden-retry');
    if (e1?.active) {
      for (let k = 0; k < 12; k++) {
        const b = await eco(page); if (!b?.active && k > 0) break;
        await page.keyboard.press(k % 3 === 1 ? 'ArrowRight' : 'e'); await page.waitForTimeout(500);
        await shot(page, `23-garden-step${k}`);
        note('garden_step', { k, eco: await eco(page), feedback: await feedback(page) });
      }
    }
  }

  // ---- MAP via notebook Map tab (mouse click) ----
  await page.keyboard.press('n'); await page.waitForTimeout(800); await shot(page, '30-notebook-open');
  // notebook panel tabs sit along the top of the panel (right side of screen).
  const vp = page.viewportSize() || { width: 1280, height: 720 };
  for (const [fx, label] of [[0.84, 'Clues'], [0.88, 'Tests'], [0.92, 'Map']]) {
    await page.mouse.click(Math.round(vp.width * fx), Math.round(vp.height * 0.05));
    await page.waitForTimeout(500);
    await shot(page, `31-notebook-${label}`);
  }
  await page.keyboard.press('n');

  note('errors', { errors: errors.slice(0, 30) });
  fs.writeFileSync(`${SHOT}/phase2_retry.json`, JSON.stringify(log, null, 2));
  console.log('PHASE2_RETRY_DONE');
  expect(Boolean(byId.ecology_garden)).toBeTruthy();
});
