/**
 * densityChart — alternate chart-mode for LabRigBase's chart panel.
 *
 * LabRigBase exposes `getChartConfig` and renders a stress-strain curve.
 * MaterialLabScene flips to "Density" mode via the chart-header toggle
 * (subclass renders this); when active, the chart-area is replaced with
 * a 3-bar density+strength composite.
 *
 * This module exports a *renderer* function that takes the LabRigBase
 * chart geometry + the player's materialLog and draws the bars on a
 * graphics layer the scene supplies. Pure Phaser, no save imports.
 *
 * @param {Phaser.Scene} scene
 * @param {Phaser.GameObjects.Graphics} g
 * @param {object} cfg
 * @param {number} cfg.x — chart panel x
 * @param {number} cfg.y — chart panel y
 * @param {number} cfg.w
 * @param {number} cfg.h
 * @param {Array<{id:string, name:string, color:number, ultimateStrengthMPa:number}>} cfg.allMaterials
 * @param {Array<{id:string, massGrams:number}>} cfg.materialLog
 * @param {string[]} cfg.testedIds — material ids the player has load-tested
 * @returns {{ texts: Phaser.GameObjects.Text[] }} — text labels (caller must destroy)
 */
export function renderDensityChart(scene, g, cfg) {
  const { x, y, w, h, allMaterials, materialLog, testedIds } = cfg;
  const PAD = 28;
  const innerX = x + PAD + 6;
  const innerY = y + PAD - 4;
  const innerW = w - PAD - 18;
  const innerH = h - PAD - 28;

  // Clear & redraw panel surround.
  g.fillStyle(0x1c1d22, 1);
  g.fillRect(x, y, w, h);
  g.lineStyle(2, 0x4a4d55, 1);
  g.strokeRect(x, y, w, h);

  // Axes.
  g.lineStyle(2, 0xa4a8b3, 1);
  g.lineBetween(innerX, innerY + innerH, innerX + innerW, innerY + innerH);
  g.lineBetween(innerX, innerY, innerX, innerY + innerH);

  const texts = [];
  // Y axis label.
  texts.push(scene.add.text(x + 6, y + h / 2, 'density\n(g/cm³)', {
    fontSize: '9px', fontFamily: 'sans-serif', color: '#a4a8b3',
    align: 'center',
  }).setOrigin(0.5).setDepth(3).setRotation(-Math.PI / 2));

  // Y-axis scale ticks: 0 / 5 / 10 g/cm³.
  for (let i = 0; i <= 4; i++) {
    const ty = innerY + (i / 4) * innerH;
    g.lineStyle(1, 0x4a4a55, 0.4);
    g.lineBetween(innerX, ty, innerX + innerW, ty);
    const value = (10 * (4 - i) / 4).toFixed(1);
    texts.push(scene.add.text(innerX - 4, ty, value, {
      fontSize: '8px', fontFamily: 'monospace', color: '#a4a8b3',
    }).setOrigin(1, 0.5).setDepth(3));
  }

  // Bars.
  const barCount = allMaterials.length;
  const barW = innerW / (barCount * 1.5);
  allMaterials.forEach((m, idx) => {
    const cx = innerX + (idx + 0.5) * (innerW / barCount);
    const recorded = materialLog.find(r => r.id === m.id);
    const tested = testedIds.includes(m.id);

    if (!recorded) {
      // Empty outline + ? label.
      const emptyTop = innerY + innerH * 0.5;
      g.lineStyle(2, 0x4a4d55, 1);
      g.strokeRect(cx - barW / 2, emptyTop, barW, innerY + innerH - emptyTop);
      texts.push(scene.add.text(cx, emptyTop + (innerY + innerH - emptyTop) / 2, '?', {
        fontSize: '20px', fontFamily: 'sans-serif', color: '#4a4d55',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(3));
    } else {
      const density = recorded.massGrams / 10; // g/cm³
      const norm = Math.min(1, density / 10);
      const barH = norm * innerH;
      const barTop = innerY + innerH - barH;

      // Strength rating modulates fill alpha. Untested = pale outline,
      // tested = solid color.
      const ult = m.ultimateStrengthMPa || 0;
      const strengthFrac = Math.max(0, Math.min(1, ult / 600));
      const fillAlpha = tested ? (0.4 + strengthFrac * 0.6) : 0.3;

      g.fillStyle(m.color, fillAlpha);
      g.fillRect(cx - barW / 2, barTop, barW, barH);
      g.lineStyle(2, 0x111114, 1);
      g.strokeRect(cx - barW / 2, barTop, barW, barH);

      // Density label above bar.
      texts.push(scene.add.text(cx, barTop - 8, `${density.toFixed(2)}`, {
        fontSize: '10px', fontFamily: 'monospace', color: '#fbbf24',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(3));
    }

    // Material name below x-axis.
    texts.push(scene.add.text(cx, innerY + innerH + 10, shortLabel(m.name), {
      fontSize: '9px', fontFamily: 'sans-serif', color: '#e7e9ee',
    }).setOrigin(0.5).setDepth(3));
  });

  return { texts };
}

function shortLabel(name) {
  if (!name) return '?';
  return name.split(' ')[0];
}
