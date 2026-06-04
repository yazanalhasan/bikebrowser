import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.BIKEBROWSER_BASE_URL || 'http://localhost:5173/game-rebuild';
const outDir = path.resolve(process.env.BIKEBROWSER_CAPTURE_DIR || 'project_audit/act1_prop_clarity_mission/runtime_evidence/after');
mkdirSync(outDir, { recursive: true });

async function frame(page, x, y) {
  await page.evaluate(({ x, y }) => {
    const scene = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
    scene.player.setPosition(x, y);
    scene.cameras.main.centerOn(x, y);
    scene.registry.set('playerPosition', { x, y });
  }, { x, y });
  await page.waitForTimeout(100);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(baseUrl);
  await page.waitForFunction(() =>
    window.BIKEBROWSER_READY === true &&
    Boolean(window.BIKEBROWSER_TEST_BRIDGE?.isReady?.()) &&
    Boolean(window.__GAME__)
  );

  await frame(page, 305, 506);
  await page.screenshot({ path: path.join(outDir, '01_act1_start.png'), fullPage: true });

  await page.evaluate(() => window.__GAME__.handleInteraction('bike_check'));
  await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook());
  await frame(page, 650, 430);
  await page.screenshot({ path: path.join(outDir, '02_bike_repair_notebook.png'), fullPage: true });
  await page.evaluate(() => window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene').toggleNotebook());

  await page.evaluate(() => window.__GAME__.handleInteraction('dry_wash'));
  await frame(page, 1190, 574);
  await page.screenshot({ path: path.join(outDir, '03_bridge_discovery.png'), fullPage: true });

  await page.evaluate(() => {
    window.__GAME__.handleInteraction('collect_materials');
    ['mesquite', 'steel', 'copper_brace', 'weak_scrap'].forEach((id) => window.__GAME__.testMaterial(id));
  });
  await frame(page, 742, 408);
  await page.screenshot({ path: path.join(outDir, '04_material_testing.png'), fullPage: true });

  await page.evaluate(() => window.__GAME__.runChemistryRecipe('sealant_patch'));
  await frame(page, 820, 444);
  await page.screenshot({ path: path.join(outDir, '06_chemistry_interaction.png'), fullPage: true });

  await page.evaluate(() => {
    window.__GAME__.completeBridgePlan('tested_triangle_plan');
    window.__GAME__.repairBridge();
    window.__GAME__.unlockWiderMap();
  });
  await frame(page, 1484, 514);
  await page.screenshot({ path: path.join(outDir, '08_bridge_repaired_map_unlock.png'), fullPage: true });

  console.log(`captured Act 1 prop replacement evidence to ${path.relative(process.cwd(), outDir)}`);
} finally {
  await browser.close();
}
