/**
 * densitySlate - chalkboard summarizing measurements + auto-fill button.
 *
 * Reads state.materialLog through the caller supplied getRecorded callback.
 *
 * The open panel is a MODAL. It used to be a world-space card at depths
 * 20-22, placed by layout coordinates chosen to miss the player — which
 * meant everything in the UI band (80+) printed straight through it: the
 * takeaway card covered its title by 68%, the chart covered its table,
 * and a child who tapped the slate read a third of it (review MUST 4).
 *
 * A thing the child asked to see gets the whole screen: a scrim that
 * swallows taps, the panel centred in the camera view and sized to fit
 * the smallest phone, and a close control a finger can hit.
 *
 * @param {Phaser.Scene} scene
 * @param {object} cfg
 * @param {number} cfg.x
 * @param {number} cfg.y
 * @param {{x:number,y:number,w:number,h:number}=} cfg.panel — legacy, ignored
 *   for placement; the modal centres itself on the camera.
 * @param {() => Array<{id:string, name:string, massGrams:number}>} cfg.getRecorded
 * @param {(id:string, name:string) => void} cfg.onAutoFill
 * @param {() => void} [cfg.onOpen] — scene hook: hide what the modal replaces
 * @param {() => void} [cfg.onClose]
 * @returns {{ destroy: () => void, openPanel: () => void, isOpen: () => boolean }}
 */

import {
  MODAL_BG_DEPTH, MODAL_CONTROL_DEPTH, MODAL_TEXT_DEPTH, PANEL_TEXT_DEPTH,
  SCRIM_DEPTH,
} from '../labelLayout.js';
import { MIN_TAP_PX } from '../phoneReadable.js';

export function createDensitySlate(scene, cfg) {
  const { x, y, getRecorded, onAutoFill, onOpen, onClose } = cfg;

  const frame = scene.add.rectangle(x, y, 56, 44, 0x4a3528)
    .setStrokeStyle(3, 0x2a1e15).setDepth(3);
  const board = scene.add.rectangle(x, y, 50, 38, 0x1a2a1f).setDepth(4);
  const icon = scene.add.text(x, y, 'SLATE', {
    fontSize: '11px', fontFamily: 'sans-serif', color: '#fef3c7',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(PANEL_TEXT_DEPTH);
  // Below the board, clear of the coupons caption 77px above (plan
  // 0.12.5), and in the UI band so nothing in the world covers it.
  const label = scene.add.text(x, y + 30, 'Density Slate', {
    fontSize: '10px', fontFamily: 'sans-serif', color: '#a4a8b3',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(PANEL_TEXT_DEPTH);

  frame.setInteractive({ useHandCursor: true });
  board.setInteractive({ useHandCursor: true });

  let panel = null;

  /** The camera view, in world units — where a screen-fixed panel goes. */
  function viewBox() {
    const cam = scene.cameras.main;
    const v = cam.worldView;
    return { cx: v.centerX, cy: v.centerY, w: v.width, h: v.height, zoom: cam.zoom };
  }

  function openPanel() {
    if (panel) closePanel();
    onOpen?.();

    const view = viewBox();
    // Fit the smallest phone with room to spare, and never grow past
    // what the table needs.
    const panelW = Math.min(440, view.w - 24);
    const records = getRecorded();
    const rows = Math.max(records.length, 1);
    const panelH = Math.min(view.h - 24, 150 + rows * 28);
    const px = view.cx;
    const py = view.cy;
    const left = px - panelW / 2;
    const top = py - panelH / 2;
    // Three columns that hold at 376px as well as at 440.
    const colMaterial = left + 16;
    const colMass = left + panelW * 0.52;
    const colDensity = left + panelW * 0.74;

    // The scrim: a modal owns the screen, and a tap that lands beside
    // the panel must not reach a lab control behind it.
    const scrim = scene.add.rectangle(view.cx, view.cy, view.w, view.h, 0x05070c, 0.72)
      .setDepth(SCRIM_DEPTH)
      .setInteractive({ useHandCursor: false });
    scrim.on('pointerdown', () => closePanel());

    const bg = scene.add.rectangle(px, py, panelW, panelH, 0x14151a, 0.98)
      .setStrokeStyle(3, 0xfacc15).setDepth(MODAL_BG_DEPTH)
      .setInteractive();          // swallow taps meant for the panel
    const title = scene.add.text(px, top + 22, 'DENSITY SLATE', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#fef3c7',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(MODAL_TEXT_DEPTH);

    const headerY = top + 56;
    const materialHeader = scene.add.text(colMaterial, headerY, 'Material', headerStyle())
      .setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH);
    const massHeader = scene.add.text(colMass, headerY, 'Mass', headerStyle())
      .setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH);
    const densityHeader = scene.add.text(colDensity, headerY, 'Density', headerStyle())
      .setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH);

    const rowTexts = [];
    if (records.length === 0) {
      rowTexts.push(scene.add.text(px, py - 4, '(no measurements yet)', {
        fontSize: '13px', fontFamily: 'sans-serif', color: '#a4a8b3',
        fontStyle: 'italic',
      }).setOrigin(0.5).setDepth(MODAL_TEXT_DEPTH));
    } else {
      records.forEach((r, idx) => {
        const ry = headerY + 28 + idx * 26;
        const density = r.massGrams / 10;
        rowTexts.push(scene.add.text(colMaterial, ry, displayName(r.name), {
          fontSize: '13px', fontFamily: 'sans-serif', color: '#e7e9ee',
        }).setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH));
        rowTexts.push(scene.add.text(colMass, ry, `${r.massGrams.toFixed(2)} g`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#10b981',
        }).setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH));
        rowTexts.push(scene.add.text(colDensity, ry, `${density.toFixed(2)} g/cm3`, {
          fontSize: '13px', fontFamily: 'monospace', color: '#fbbf24',
        }).setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH));
      });
    }

    const lightestY = top + panelH - 38;
    const lightestText = scene.add.text(colMaterial, lightestY, 'Lightest per cm3:', {
      fontSize: '13px', fontFamily: 'sans-serif', color: '#e7e9ee',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH);
    const blank = scene.add.text(colMaterial + 118, lightestY, '_______', {
      fontSize: '13px', fontFamily: 'monospace', color: '#fef3c7',
    }).setOrigin(0, 0.5).setDepth(MODAL_TEXT_DEPTH);

    let autoFillBtn = null;
    let autoFillLbl = null;
    if (records.length > 0) {
      const lightest = records.reduce(
        (a, b) => (a.massGrams <= b.massGrams ? a : b),
      );
      const tap = MIN_TAP_PX / Math.max(view.zoom, 0.01);
      autoFillBtn = scene.add.rectangle(
        left + panelW - 60, lightestY, Math.max(96, tap), Math.max(28, tap * 0.7), 0x2563eb,
      ).setStrokeStyle(2, 0x1d4ed8).setDepth(MODAL_CONTROL_DEPTH)
        .setInteractive({ useHandCursor: true });
      autoFillLbl = scene.add.text(left + panelW - 60, lightestY, 'Auto-fill', {
        fontSize: '12px', fontFamily: 'sans-serif', color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(MODAL_CONTROL_DEPTH + 1);
      autoFillBtn.on('pointerdown', () => {
        blank.setText(lightest.name);
        blank.setColor('#22c55e');
        onAutoFill(lightest.id, lightest.name);
      });
    }

    // A close control a finger can hit. It was a bare "X" glyph whose
    // box came to 36-40 CSS px on a phone (review SHOULD): now a round
    // button that is at least 44 CSS px however the camera is zoomed.
    const closeD = Math.max(40, MIN_TAP_PX / Math.max(view.zoom, 0.01));
    const closeBtn = scene.add.circle(
      left + panelW - closeD / 2 - 6, top + closeD / 2 + 6, closeD / 2, 0x7f1d1d,
    ).setStrokeStyle(2, 0xef4444).setDepth(MODAL_CONTROL_DEPTH)
      .setInteractive({ useHandCursor: true });
    const closeLbl = scene.add.text(closeBtn.x, closeBtn.y, 'X', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#fecaca',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(MODAL_CONTROL_DEPTH + 1);
    closeBtn.on('pointerdown', () => closePanel());

    panel = {
      objs: [
        scrim, bg, title, materialHeader, massHeader, densityHeader, ...rowTexts,
        lightestText, blank, autoFillBtn, autoFillLbl, closeBtn, closeLbl,
      ].filter(Boolean),
    };
  }

  function closePanel() {
    if (!panel) return;
    panel.objs.forEach(o => o?.destroy?.());
    panel = null;
    onClose?.();
  }

  frame.on('pointerdown', openPanel);
  board.on('pointerdown', openPanel);
  icon.setInteractive({ useHandCursor: true }).on('pointerdown', openPanel);
  label.setInteractive({ useHandCursor: true }).on('pointerdown', openPanel);

  return {
    destroy() {
      [frame, board, icon, label].forEach(o => o?.destroy?.());
      closePanel();
    },
    openPanel,
    isOpen: () => Boolean(panel),
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
