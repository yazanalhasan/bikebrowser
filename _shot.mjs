import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 1280, height: 720 });
await p.goto('http://localhost:5173/game-rebuild', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__bikebrowserRebuildReady === true, null, { timeout: 20000 });
await p.evaluate(() => window.localStorage.removeItem('bikebrowser_layout_overrides'));
await p.waitForTimeout(900);
// zoom out to see the whole world composition
await p.evaluate(() => {
  const s = window.__bikebrowserRebuildGame.scene.getScene('NeighborhoodScene');
  const cam = s.cameras.main;
  cam.stopFollow();
  cam.setZoom(0.44);
  cam.centerOn(s.worldWidth/2, s.worldHeight/2);
});
await p.waitForTimeout(500);
await p.screenshot({ path: './_overview.png' });
await b.close();
console.log('shot saved');
