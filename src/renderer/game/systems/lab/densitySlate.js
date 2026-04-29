/**
 * densitySlate - chalkboard summarizing measurements + auto-fill button.
 *
 * Reads state.materialLog through the caller supplied getRecorded callback.
 * The detail panel can be positioned by layout data so it does not cover the
 * player in the Material Lab.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x
 * @param {number} cfg.y
 * @param {{x:number,y:number,w:number,h:number}=} cfg.panel
 * @param {() => Array<{id:string, name:string, massGrams:number}>} cfg.getRecorded
 * @param {(id:string, name:string) => void} cfg.onAutoFill
 * @returns {{ destroy: () => void, openPanel: () => void }}
 */
export function createDensitySlate(scene, cfg) {
  const { x, y, getRecorded, onAutoFill } = cfg;
  const panelLayout = cfg.panel || {};

  const frame = scene.add.rectangle(x, y, 56, 44, 0x4a3528)
    .setStrokeStyle(3, 0x2a1e15).setDepth(3);
  const board = scene.add.rectangle(x, y, 50, 38, 0x1a2a1f).setDepth(4);
  const icon = scene.add.text(x, y, 'SLATE', {
    fontSize: '11px', fontFamily: 'sans-serif', color: '#fef3c7',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(5);
  const label = scene.add.text(x, y + 28, 'Density Slate', {
    fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(4);

  frame.setInteractive({ useHandCursor: true });
  board.setInteractive({ useHandCursor: true });

  let panel = null;

  function openPanel() {
    if (panel) closePanel();

    const panelW = panelLayout.w || 360;
    const panelH = panelLayout.h || 220;
    const px = panelLayout.x || scene.cameras.main.worldView.centerX;
    const py = panelLayout.y || scene.cameras.main.worldView.centerY;
    const left = px - panelW / 2;
    const top = py - panelH / 2;

    const bg = scene.add.rectangle(px, py, panelW, panelH, 0x14151a, 0.96)
      .setStrokeStyle(3, 0xfacc15).setDepth(20);
    const title = scene.add.text(px, top + 20, 'DENSITY SLATE', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#fef3c7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    const headerY = top + 52;
    const materialHeader = scene.add.text(left + 24, headerY, 'Material', headerStyle())
      .setOrigin(0, 0.5).setDepth(21);
    const massHeader = scene.add.text(left + 220, headerY, 'Mass', headerStyle())
      .setOrigin(0, 0.5).setDepth(21);
    const densityHeader = scene.add.text(left + 320, headerY, 'Density', headerStyle())
      .setOrigin(0, 0.5).setDepth(21);

    const rowTexts = [];
    const records = getRecorded();
    if (records.length === 0) {
      rowTexts.push(scene.add.text(px, py - 8, '(no measurements yet)', {
        fontSize: '13px', fontFamily: 'sans-serif', color: '#a4a8b3',
        fontStyle: 'italic',
      }).setOrigin(0.5).setDepth(21));
    } else {
      records.forEach((r, idx) => {
        const ry = headerY + 26 + idx * 25;
        const density = r.massGrams / 10;
        rowTexts.push(scene.add.text(left + 24, ry, displayName(r.name), {
          fontSize: '13px', fontFamily: 'sans-serif', color: '#e7e9ee',
        }).setOrigin(0, 0.5).setDepth(21));
        rowTexts.push(scene.add.text(left + 220, ry, `${r.massGrams.toFixed(2)} g`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#10b981',
        }).setOrigin(0, 0.5).setDepth(21));
        rowTexts.push(scene.add.text(left + 320, ry, `${density.toFixed(2)} g/cm3`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#fbbf24',
        }).setOrigin(0, 0.5).setDepth(21));
      });
    }

    const lightestY = top + panelH - 45;
    const lightestText = scene.add.text(left + 24, lightestY, 'Lightest per cm3:', {
      fontSize: '13px', fontFamily: 'sans-serif', color: '#e7e9ee',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(21);
    const blank = scene.add.text(left + 160, lightestY, '_______', {
      fontSize: '13px', fontFamily: 'monospace', color: '#fef3c7',
    }).setOrigin(0, 0.5).setDepth(21);

    let autoFillBtn = null;
    let autoFillLbl = null;
    if (records.length > 0) {
      const lightest = records.reduce(
        (a, b) => (a.massGrams <= b.massGrams ? a : b),
      );
      autoFillBtn = scene.add.rectangle(left + 380, lightestY, 86, 24, 0x2563eb)
        .setStrokeStyle(2, 0x1d4ed8).setDepth(21)
        .setInteractive({ useHandCursor: true });
      autoFillLbl = scene.add.text(left + 380, lightestY, 'Auto-fill', {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(22);
      autoFillBtn.on('pointerdown', () => {
        blank.setText(lightest.name);
        blank.setColor('#22c55e');
        onAutoFill(lightest.id, lightest.name);
      });
    }

    const closeBtn = scene.add.text(left + panelW - 18, top + 18, 'X', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => closePanel());

    panel = {
      objs: [
        bg, title, materialHeader, massHeader, densityHeader, ...rowTexts,
        lightestText, blank, autoFillBtn, autoFillLbl, closeBtn,
      ].filter(Boolean),
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

function headerStyle() {
  return {
    fontSize: '12px',
    fontFamily: 'sans-serif',
    color: '#a4a8b3',
    fontStyle: 'bold',
  };
}

function displayName(name) {
  if (name === 'Structural Steel (A36-like)') return 'Structural Steel';
  return name || 'Unknown';
}
