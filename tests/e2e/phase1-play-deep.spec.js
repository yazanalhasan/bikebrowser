// phase1-play-deep.spec.js — TEMPORARY round-2 player audit.
// Plays like a child: starts at Home, clicks Play, then WALKS the character
// (arrow keys) to each interactive object and presses E — capturing exactly
// what appears on screen. Hunts: Implemented-but-not Reachable/Understandable/Fun.
import { test, expect } from 'playwright/test';
import fs from 'fs';

const SHOT = 'C:/Users/admin/Documents/executive-brain/artifacts/qa_audit/screenshots/phase1_r2';
fs.mkdirSync(SHOT, { recursive: true });
test.setTimeout(240000);

const log = [];

async function readWorld(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const s = g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player);
    if (!s) return null;
    const active = g.scene.scenes.filter((x) => x.scene?.isActive?.()).map((x) => x.scene.key);
    return {
      activeScenes: active,
      player: { x: Math.round(s.player.x), y: Math.round(s.player.y) },
      zones: s.interactions.zones.map((z) => ({ id: z.id, x: z.x, y: z.y, label: z.label, action: z.action || null, dialogueId: z.dialogueId || null })),
    };
  });
}
async function feedback(page) {
  return page.evaluate(() => {
    const f = window.__GAME__?.getFeedbackState?.();
    return f?.last ? { kind: f.last.kind, message: f.last.message } : null;
  });
}
async function objectivesDone(page) {
  return page.evaluate(() => {
    try { return window.__GAME__.getQuestState().completedObjectives?.length ?? 0; } catch { return -1; }
  });
}
// Detect any visible dialogue/modal text the player would read.
async function dialogueText(page) {
  return page.evaluate(() => {
    const g = window.__bikebrowserRebuildGame;
    const dlg = g?.scene?.scenes?.find((x) => /dialog/i.test(x.scene?.key || '') && x.scene?.isActive?.());
    if (!dlg) return null;
    // collect visible Text game objects
    const texts = [];
    dlg.children?.list?.forEach((c) => { if (c.type === 'Text' && c.text) texts.push(c.text); });
    return texts.join(' | ').slice(0, 400) || '(dialogue scene active, no text read)';
  });
}

async function walkTo(page, target, maxSteps = 40) {
  for (let i = 0; i < maxSteps; i++) {
    const w = await readWorld(page);
    if (!w) return false;
    const dx = target.x - w.player.x;
    const dy = target.y - w.player.y;
    if (Math.hypot(dx, dy) < 56) return true;
    const keys = [];
    if (Math.abs(dx) > 24) keys.push(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(dy) > 24) keys.push(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    for (const k of keys) await page.keyboard.down(k);
    await page.waitForTimeout(140);
    for (const k of keys) await page.keyboard.up(k);
  }
  const w = await readWorld(page);
  return w ? Math.hypot(target.x - w.player.x, target.y - w.player.y) < 90 : false;
}

test('round-2 deep player walkthrough', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // 1) Start at Home, click the primary game card like a kid (no post-nav innerText).
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  let clickedLabel = null;
  for (const re of [/Play BikeBrowser/i, /Act 1/i, /BikeBrowserWorld/i]) {
    const el = page.getByText(re).last(); // card sits below the header
    if (await el.count().catch(() => 0)) {
      clickedLabel = (await el.innerText().catch(() => re.source));
      await el.click({ timeout: 3000 }).catch(() => {});
      break;
    }
  }
  await page.waitForTimeout(4000);
  const landedUrl = page.url();
  log.push({ step: 'home_play_click', clickedLabel, landedUrl, isGameRebuild: landedUrl.includes('/game-rebuild') });
  await page.screenshot({ path: `${SHOT}/50-after-home-play.png` }).catch(() => {});

  // If we didn't land on the rebuild, go directly so we can still audit reachability of systems.
  if (!page.url().includes('/game-rebuild')) {
    await page.goto('/game-rebuild', { waitUntil: 'domcontentloaded' });
  }
  await page.waitForFunction(() => Boolean(window.__GAME__) && Boolean(window.__bikebrowserRebuildGame), null, { timeout: 20000 });
  // Wait until the scene with zones + player actually exists.
  await page.waitForFunction(() => {
    const g = window.__bikebrowserRebuildGame;
    return Boolean(g?.scene?.scenes?.find((x) => x.interactions?.zones?.length && x.player));
  }, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.locator('canvas').first().click({ timeout: 3000, position: { x: 300, y: 300 } }).catch(() => {});

  const world0 = await readWorld(page);
  log.push({ step: 'world_initial', world: world0 });

  // 2) Walk to each zone in a child-plausible order and press E.
  const order = ['bike', 'dry_wash', 'materials_table', 'utm', 'bridge_plan', 'bridge_repair', 'ecology_patch', 'chemistry_station', 'mr_chen', 'wash_neighbor', 'spanish_neighbor', 'arabic_mentor', 'wider_gate'];
  const zones = world0?.zones || [];
  const byId = Object.fromEntries(zones.map((z) => [z.id, z]));
  const sequence = [...order.filter((id) => byId[id]), ...zones.map((z) => z.id).filter((id) => !order.includes(id))];

  let idx = 60;
  for (const id of sequence) {
    const z = byId[id];
    if (!z) continue;
    const before = await objectivesDone(page);
    const reached = await walkTo(page, z);
    // capture the on-screen [E] prompt the player sees when near
    const prompt = await page.evaluate(() => {
      const g = window.__bikebrowserRebuildGame;
      const s = g?.scene?.scenes?.find((x) => x.prompt && x.player);
      return s?.prompt?.visible ? s.prompt.text : null;
    });
    await page.keyboard.press('e');
    await page.waitForTimeout(700);
    const dlg = await dialogueText(page);
    const fb = await feedback(page);
    const after = await objectivesDone(page);
    await page.screenshot({ path: `${SHOT}/${idx}-${id}.png` });
    log.push({ step: 'interact', id, label: z.label, action: z.action, dialogueId: z.dialogueId, reached, promptSeen: prompt, dialogueText: dlg, feedback: fb, objectivesBefore: before, objectivesAfter: after, fired: after > before || Boolean(fb) });
    // close any dialogue before moving on
    await page.keyboard.press('e'); await page.waitForTimeout(150);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    idx++;
  }

  // 3) Snapshot the notebook the player can open, plus final reachable state.
  await page.keyboard.press('n'); await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOT}/90-notebook.png` });
  await page.keyboard.press('n');

  const finalQuests = await page.evaluate(() => { try { return window.__GAME__.getQuestState(); } catch { return null; } });
  log.push({ step: 'final', completedObjectives: finalQuests?.completedObjectives, active: finalQuests?.activeQuestId, errors: errors.slice(0, 30) });

  fs.writeFileSync(`${SHOT}/play_deep.json`, JSON.stringify(log, null, 2));
  console.log('DEEP_DONE zones=' + zones.length);
  expect(zones.length).toBeGreaterThan(0);
});
