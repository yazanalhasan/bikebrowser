/**
 * densitySlate — chalkboard summarizing measurements + auto-fill button.
 *
 * Reads `state.materialLog` directly (the player's view of truth — never
 * `materialDatabase` density values). On click, opens an in-scene panel:
 *
 *   ┌───────────────────────────────────────┐
 *   │ DENSITY SLATE                         │
 *   │ Material   Mass    ÷ 10 cm³           │
 *   │ Mesquite   8.50 g   0.85 g/cm³        │
 *   │ Steel     78.50 g   7.85 g/cm³        │
 *   │ Copper    89.60 g   8.96 g/cm³        │
 *   │                                       │
 *   │ Lightest per cm³: ___  [auto-fill]    │
 *   └───────────────────────────────────────┘
 *
 * Auto-fill writes `state.derivedAnswers.lightestMaterial` and pushes
 * `densities_calculated` to `state.observations`.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x
 * @param {number} cfg.y
 * @param {() => Array<{id:string, name:string, massGrams:number}>} cfg.getRecorded
 * @param {(id:string, name:string) => void} cfg.onAutoFill
 * @returns {{ destroy: () => void }}
 */
export function createDensitySlate(scene, cfg) {
  const { x, y, getRecorded, onAutoFill } = cfg;

  // Slate icon (chalkboard rectangle + frame).
  const frame = scene.add.rectangle(x, y, 56, 44, 0x4a3528)
    .setStrokeStyle(3, 0x2a1e15).setDepth(3);
  const board = scene.add.rectangle(x, y, 50, 38, 0x1a2a1f).setDepth(4);
  const icon = scene.add.text(x, y, '📋', { fontSize: '20px' })
    .setOrigin(0.5).setDepth(5);
  const label = scene.add.text(x, y + 28, 'Density Slate', {
    fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(4);

  frame.setInteractive({ useHandCursor: true });
  board.setInteractive({ useHandCursor: true });

  // ── Detail panel (hidden until clicked) ──────────────────────────────
  let panel = null;

  function openPanel() {
    if (panel) closePanel();
    const panelW = 320, panelH = 200;
    const px = scene.scale.width / 2;
    const py = scene.scale.height / 2;
    const bg = scene.add.rectangle(px, py, panelW, panelH, 0x14151a, 0.96)
      .setStrokeStyle(3, 0xfacc15).setDepth(20);
    const title = scene.add.text(px, py - panelH / 2 + 18, '📋 DENSITY SLATE', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#fef3c7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    const records = getRecorded();
    const headerY = py - panelH / 2 + 44;
    scene.add.text(px - 110, headerY, 'Material', {
      fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);
    scene.add.text(px + 0, headerY, 'Mass', {
      fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);
    scene.add.text(px + 60, headerY, '÷ 10 cm³', {
      fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);

    const rowTexts = [];
    if (records.length === 0) {
      rowTexts.push(scene.add.text(px, py - 10, '(no measurements yet)', {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#a4a8b3',
        fontStyle: 'italic',
      }).setOrigin(0.5).setDepth(21));
    } else {
      records.forEach((r, idx) => {
        const ry = headerY + 18 + idx * 18;
        const density = r.massGrams / 10;
        rowTexts.push(scene.add.text(px - 110, ry, r.name, {
          fontSize: '11px', fontFamily: 'sans-serif', color: '#e7e9ee',
        }).setOrigin(0, 0.5).setDepth(21));
        rowTexts.push(scene.add.text(px + 0, ry, `${r.massGrams.toFixed(2)} g`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#10b981',
        }).setOrigin(0, 0.5).setDepth(21));
        rowTexts.push(scene.add.text(px + 60, ry, `${density.toFixed(2)} g/cm³`, {
          fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24',
        }).setOrigin(0, 0.5).setDepth(21));
      });
    }

    // ── Lightest auto-fill ──────────────────────────────────────────────
    const lightestY = py + panelH / 2 - 50;
    const lightestText = scene.add.text(px - 100, lightestY, 'Lightest per cm³:', {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#e7e9ee',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);
    const blank = scene.add.text(px + 0, lightestY, '_______', {
      fontSize: '12px', fontFamily: 'monospace', color: '#fef3c7',
    }).setOrigin(0, 0.5).setDepth(21);

    let autoFillBtn, autoFillLbl;
    if (records.length > 0) {
      const lightest = records.reduce(
        (a, b) => (a.massGrams <= b.massGrams ? a : b),
      );
      autoFillBtn = scene.add.rectangle(px + 90, lightestY, 78, 22, 0x2563eb)
        .setStrokeStyle(2, 0x1d4ed8).setDepth(21)
        .setInteractive({ useHandCursor: true });
      autoFillLbl = scene.add.text(px + 90, lightestY, 'Auto-fill', {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(22);
      autoFillBtn.on('pointerdown', () => {
        blank.setText(lightest.name);
        blank.setColor('#22c55e');
        onAutoFill(lightest.id, lightest.name);
      });
    }

    // ── Close button ────────────────────────────────────────────────────
    const closeBtn = scene.add.text(px + panelW / 2 - 14, py - panelH / 2 + 14, '✕', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => closePanel());

    panel = {
      objs: [bg, title, ...rowTexts, lightestText, blank, closeBtn,
             autoFillBtn, autoFillLbl].filter(Boolean),
    };
  }

  function closePanel() {
    if (!panel) return;
    panel.objs.forEach(o => o?.destroy?.());
    panel = null;
  }

  frame.on('pointerdown', openPanel);
  board.on('pointerdown', openPanel);
  icon.setInteractive({ useHandCursor: true }).on('pointerdown', openPanel);

  return {
    destroy() {
      [frame, board, icon, label].forEach(o => o?.destroy?.());
      closePanel();
    },
    openPanel,
  };
}
