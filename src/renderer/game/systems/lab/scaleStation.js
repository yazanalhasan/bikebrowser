/**
 * scaleStation — interactive scale + sample slot + Record button.
 *
 * Mounted in MaterialLabScene's left bay. Reads the player's inventory
 * to gate which sample buttons are enabled. On click:
 *   1. Animates the matching coupon onto the platform (240ms tween).
 *   2. Display reads `mass: X.XX g` (computed via the
 *      `recordMass(materialId)` callback the scene supplies — that
 *      callback is the one place that touches `materialDatabase` for
 *      density truth; this module never reads density directly).
 *   3. After 600ms a Record button appears.
 *   4. On Record: invokes `onRecord({ id, name, massGrams })` and
 *      replaces the button with a green ✓.
 *   5. Already-recorded materials skip step 3 — display shows the
 *      stored mass immediately on click.
 *
 * Pure Phaser. No React, no save-system imports — the consuming scene
 * owns persistence.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x — center x of the platform (e.g. 110)
 * @param {number} cfg.platformY
 * @param {number} cfg.displayY
 * @param {{id:string, name:string, color:number, hasItem:boolean}[]} cfg.samples
 * @param {(id:string) => number} cfg.computeMass — pure: returns grams
 * @param {() => Array<{id:string, massGrams:number}>} cfg.getRecorded
 * @param {(entry:{id:string, name:string, massGrams:number}) => void} cfg.onRecord
 * @returns {{ refresh: () => void, destroy: () => void }}
 */
export function createScaleStation(scene, cfg) {
  const {
    x, platformY, displayY, samples,
    computeMass, getRecorded, onRecord,
  } = cfg;

  // ── Scale base + platform ────────────────────────────────────────────
  const baseRect = scene.add.rectangle(x, platformY + 14, 80, 18, 0x444853)
    .setStrokeStyle(2, 0x222428).setDepth(2);
  const platform = scene.add.rectangle(x, platformY, 64, 6, 0x9aa0aa)
    .setStrokeStyle(1, 0x33363c).setDepth(3);
  const post = scene.add.rectangle(x, (platformY + displayY) / 2, 4, platformY - displayY, 0x6b6e74)
    .setDepth(2);

  // ── Display panel ────────────────────────────────────────────────────
  const display = scene.add.rectangle(x, displayY, 90, 28, 0x1c1d22)
    .setStrokeStyle(2, 0x4a4d55).setDepth(3);
  const displayText = scene.add.text(x, displayY, '— g', {
    fontSize: '12px', fontFamily: 'monospace', color: '#10b981',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(4);

  // ── "SCALE" label above display ──────────────────────────────────────
  scene.add.text(x, displayY - 22, 'SCALE', {
    fontSize: '9px', fontFamily: 'sans-serif', color: '#a4a8b3',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(3);

  // ── Sample buttons (3) ───────────────────────────────────────────────
  const BTN_Y = platformY + 40;
  const BTN_DX = 50;
  const buttons = samples.map((s, idx) => {
    const bx = x + (idx - 1) * BTN_DX;
    const enabled = !!s.hasItem;
    const bg = scene.add.rectangle(bx, BTN_Y, 42, 28, enabled ? s.color : 0x4b5563)
      .setStrokeStyle(2, enabled ? 0x111114 : 0x2a2c33)
      .setDepth(3)
      .setAlpha(enabled ? 1 : 0.55);
    const lbl = scene.add.text(bx, BTN_Y, shortName(s.name), {
      fontSize: '9px', fontFamily: 'sans-serif', color: '#ffffff',
      fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(4);

    if (enabled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => weighSample(s));
    }

    return { sample: s, bg, lbl, enabled };
  });

  // ── Coupon sprite (animated onto platform) ───────────────────────────
  let couponSprite = null;
  let recordButton = null;
  let recordCheck = null;
  let activeId = null;

  function clearCoupon() {
    if (couponSprite) { couponSprite.destroy(); couponSprite = null; }
  }
  function clearRecordButton() {
    if (recordButton) { recordButton.destroy(); recordButton = null; }
    if (recordCheck) { recordCheck.destroy(); recordCheck = null; }
  }

  function weighSample(s) {
    activeId = s.id;
    clearCoupon();
    clearRecordButton();

    // Spawn coupon offscreen and tween to platform.
    couponSprite = scene.add.rectangle(x, platformY + 60, 18, 14, s.color)
      .setStrokeStyle(1, 0x111114).setDepth(4).setAlpha(0);
    scene.tweens.add({
      targets: couponSprite,
      y: platformY - 4,
      alpha: 1,
      duration: 240,
      ease: 'Quad.easeOut',
    });

    const mass = computeMass(s.id);
    const massStr = `${mass.toFixed(2)} g`;

    // Existing record? Show stored mass immediately, no Record button.
    const existing = getRecorded().find(r => r.id === s.id);
    if (existing) {
      displayText.setText(massStr);
      // Show green ✓ next to display to indicate already-recorded.
      recordCheck = scene.add.text(x + 60, displayY, '✓', {
        fontSize: '16px', fontFamily: 'sans-serif', color: '#22c55e',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
      return;
    }

    // Animate display ticking up to mass.
    let t = 0;
    displayText.setText('0.00 g');
    scene.tweens.addCounter({
      from: 0, to: mass, duration: 500, ease: 'Quad.easeOut',
      onUpdate: (tw) => {
        t = tw.getValue();
        displayText.setText(`${t.toFixed(2)} g`);
      },
      onComplete: () => {
        displayText.setText(massStr);
        scene.time.delayedCall(100, () => showRecordButton(s, mass));
      },
    });
  }

  function showRecordButton(s, mass) {
    if (recordButton) recordButton.destroy();
    const ry = displayY + 38;
    const bg = scene.add.rectangle(x, ry, 86, 26, 0x16a34a)
      .setStrokeStyle(2, 0x065f46).setDepth(4)
      .setInteractive({ useHandCursor: true });
    const lbl = scene.add.text(x, ry, '✎ RECORD', {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    recordButton = scene.add.container(0, 0, [bg, lbl]).setDepth(4);
    bg.on('pointerdown', () => {
      onRecord({ id: s.id, name: s.name, massGrams: mass });
      // Replace with green check.
      recordButton.destroy();
      recordButton = null;
      recordCheck = scene.add.text(x, ry, '✓ recorded', {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#22c55e',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
    });
  }

  function refresh() {
    // Re-render which buttons are enabled based on current inventory.
    // Caller passes a fresh samples array via cfg.samples — this just
    // re-flows the visible state if needed. For simplicity we leave the
    // initial wiring; refresh() is called after a Record to clear the
    // transient ✓ overlay if the user clicks another button.
  }

  function destroy() {
    [baseRect, platform, post, display, displayText].forEach(o => o?.destroy?.());
    buttons.forEach(b => { b.bg.destroy(); b.lbl.destroy(); });
    clearCoupon();
    clearRecordButton();
  }

  return { refresh, destroy };
}

/** "Mesquite Wood" → "MESQ", "Structural Steel (A36-like)" → "STEEL", etc. */
function shortName(name) {
  if (!name) return '?';
  const s = name.split(' ')[0].toUpperCase();
  return s.length > 5 ? s.slice(0, 5) : s;
}
