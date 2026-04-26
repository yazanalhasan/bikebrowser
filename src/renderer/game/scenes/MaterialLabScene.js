/**
 * MaterialLabScene — Mr. Chen's Universal Testing Machine (UTM) lab.
 *
 * The player runs tensile tests on three real materials, watches them
 * physically deform and fail, and sees a live stress-strain chart. Closes
 * bridge_collapse step 11 (`test_material` → `load_test_completed`).
 *
 * Components:
 *   - Visible UTM rig (base, columns, crosshead, grips, specimen)
 *   - Material selector (3 slots — wood, steel, copper)
 *   - START TEST button — animates the curve over ~3.5s
 *   - Live stress-strain chart with elastic / plastic / failure coloring
 *   - Per-material failure animations (splinter / neck / stretch)
 *   - 3-material loop → quest observation event when all tested
 *   - Exit zone back to ZuzuGarageScene
 */

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import { MATERIALS, MATERIAL_IDS, getMaterial } from '../systems/materials/materialDatabase.js';
import { runTensileTest, detectFailurePoint } from '../systems/materials/materialTestingEngine.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

const SCENE_KEY = 'MaterialLabScene';

// World — fits in 800×600 viewport, no camera scroll.
const WORLD_W = 800;
const WORLD_H = 600;

// UTM rig anchors / dimensions.
const RIG_X = 220;                 // center of rig along x
const RIG_BASE_Y = 480;            // top edge of base
const RIG_BASE_W = 180;
const RIG_BASE_H = 30;
const COLUMN_W = 10;
const COLUMN_H = 230;
const COLUMN_DX = 70;              // half-distance between columns
const CROSSBEAM_Y = RIG_BASE_Y - COLUMN_H - 10;
const CROSSBEAM_W = 180;
const CROSSBEAM_H = 14;
const CROSSHEAD_HOME_Y = RIG_BASE_Y - 200;
const CROSSHEAD_W = 140;
const CROSSHEAD_H = 14;
const GRIP_W = 28;
const GRIP_H = 18;
const SPECIMEN_HOME_H = 110;       // initial specimen height
const SPECIMEN_HOME_W = 18;

// Animation tuning.
const TEST_DURATION_MS = 3500;

// Chart layout (right side of scene).
const CHART_X = 460;
const CHART_Y = 110;
const CHART_W = 310;
const CHART_H = 280;
const CHART_PAD = 28;

// Hex color helpers.
const COL_BASE = 0x3b3b40;
const COL_COLUMN = 0x6b6e74;
const COL_BEAM = 0x55585f;
const COL_GRIP = 0x2c2c30;
const COL_BG = 0x2a2a32;
const COL_FLOOR = 0x35353f;
const COL_GRID = 0x4a4a55;
const COL_PANEL = 0x1c1d22;
const COL_PANEL_EDGE = 0x4a4d55;
const COL_TEXT = '#e7e9ee';
const COL_TEXT_DIM = '#a4a8b3';
const COL_ELASTIC = 0x22c55e;      // green
const COL_PLASTIC = 0xf59e0b;      // amber
const COL_FAILURE = 0xef4444;      // red

function hexToInt(hex) {
  if (!hex) return 0xcccccc;
  const s = hex.startsWith('#') ? hex.slice(1) : hex;
  return parseInt(s, 16);
}

export default class MaterialLabScene extends LocalSceneBase {
  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getWorldSize() { return { width: WORLD_W, height: WORLD_H }; }

  /** Build the scene visuals. Called by LocalSceneBase.create(). */
  createWorld() {
    const state = this.registry.get('gameState') || {};

    // Restore tested-materials progress from save.
    const prior = Array.isArray(state.materialTestsCompleted) ? state.materialTestsCompleted : [];
    this._testedMaterials = new Set(prior);

    this._currentMaterialId = MATERIAL_IDS[0];
    this._testInProgress = false;
    this._chartPoints = [];

    this._drawBackground();
    this._drawRig();
    this._drawSpecimen(this._currentMaterialId);
    this._drawReadout();
    this._drawMaterialSelector();
    this._drawStartButton();
    this._drawChart(null);
    this._drawTitle();

    // Exit zone — bottom of scene back to garage.
    this.addExit({
      x: WORLD_W / 2, y: WORLD_H - 18,
      width: 200, height: 28,
      targetScene: 'ZuzuGarageScene',
      targetSpawn: 'fromMaterialLab',
      label: '⬅ Back to Garage',
    });

    // First-entry hint dialog from Mr. Chen.
    if (!state.hasSeenMaterialLab) {
      this.time.delayedCall(450, () => {
        this.registry.set('dialogEvent', {
          speaker: 'Mr. Chen',
          text:
            "Welcome to the Materials Lab!\n\n" +
            "This is the Universal Testing Machine — the UTM. " +
            "It pulls each sample apart until it fails, and the chart shows the story.\n\n" +
            "Pick a material from the panel, then press START TEST. " +
            "Test all three to see which is best for the bridge.",
          choices: null, step: null,
        });
        const s2 = this.registry.get('gameState') || {};
        const updated = { ...s2, hasSeenMaterialLab: true };
        this.registry.set('gameState', updated);
        saveGame(updated);
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Drawing
  // ───────────────────────────────────────────────────────────────────────

  _drawBackground() {
    // Floor / wall fill
    this.add.rectangle(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, COL_BG);

    // Faint grid for "lab floor" feel
    const grid = this.add.graphics();
    grid.lineStyle(1, COL_GRID, 0.25);
    for (let x = 0; x <= WORLD_W; x += 40) grid.lineBetween(x, 60, x, WORLD_H - 40);
    for (let y = 60; y <= WORLD_H - 40; y += 40) grid.lineBetween(0, y, WORLD_W, y);

    // Floor strip near the rig base
    this.add.rectangle(WORLD_W / 2, WORLD_H - 30, WORLD_W, 50, COL_FLOOR).setDepth(0);
  }

  _drawTitle() {
    // Top header bar
    this.add.rectangle(WORLD_W / 2, 24, WORLD_W, 48, 0x14151a).setDepth(2);
    this.add.text(WORLD_W / 2, 22, '🧪  MATERIALS LAB — UNIVERSAL TESTING MACHINE', {
      fontSize: '14px', fontFamily: 'sans-serif', color: COL_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }

  /** Draw the static UTM rig anatomy. Crosshead/grips track in instance refs. */
  _drawRig() {
    // Heavy steel base
    this.add.rectangle(RIG_X, RIG_BASE_Y + RIG_BASE_H / 2, RIG_BASE_W, RIG_BASE_H, COL_BASE)
      .setStrokeStyle(2, 0x111114).setDepth(2);
    // Bolts on base
    [-1, 1].forEach((s) => {
      this.add.circle(RIG_X + s * 70, RIG_BASE_Y + 8, 3, 0x9aa0aa).setDepth(3);
      this.add.circle(RIG_X + s * 70, RIG_BASE_Y + 22, 3, 0x9aa0aa).setDepth(3);
    });

    // Two vertical columns
    [-1, 1].forEach((s) => {
      this.add.rectangle(RIG_X + s * COLUMN_DX, RIG_BASE_Y - COLUMN_H / 2, COLUMN_W, COLUMN_H,
        COL_COLUMN).setStrokeStyle(1, 0x33363c).setDepth(1);
    });

    // Top crossbeam (fixed)
    this.add.rectangle(RIG_X, CROSSBEAM_Y, CROSSBEAM_W, CROSSBEAM_H, COL_BEAM)
      .setStrokeStyle(2, 0x2c2e34).setDepth(2);

    // Crosshead (movable). Drawn at home y; tween will mutate y.
    this._crossheadY = CROSSHEAD_HOME_Y;
    this._crosshead = this.add.rectangle(RIG_X, this._crossheadY, CROSSHEAD_W, CROSSHEAD_H,
      0x8a8e96).setStrokeStyle(2, 0x33363c).setDepth(3);

    // Upper grip — attaches to crosshead bottom.
    this._upperGrip = this.add.rectangle(
      RIG_X, this._crossheadY + CROSSHEAD_H / 2 + GRIP_H / 2,
      GRIP_W, GRIP_H, COL_GRIP
    ).setStrokeStyle(1, 0x111114).setDepth(3);

    // Lower grip — sits on top of base.
    this._lowerGrip = this.add.rectangle(
      RIG_X, RIG_BASE_Y - GRIP_H / 2,
      GRIP_W, GRIP_H, COL_GRIP
    ).setStrokeStyle(1, 0x111114).setDepth(3);

    // Hydraulic / actuator hint above crossbeam (decorative).
    this.add.rectangle(RIG_X, CROSSBEAM_Y - 14, 22, 18, 0x5a5d63).setDepth(2);
    this.add.circle(RIG_X, CROSSBEAM_Y - 14, 4, 0xfacc15).setDepth(3);
  }

  /** Draw / re-draw the specimen between the grips with the material's color. */
  _drawSpecimen(materialId) {
    const mat = getMaterial(materialId);
    const color = hexToInt(mat?.visual?.color);
    const grain = mat?.visual?.grainColor ? hexToInt(mat.visual.grainColor) : null;

    if (this._specimen) this._specimen.destroy();
    if (this._specimenGrain) { this._specimenGrain.destroy(); this._specimenGrain = null; }

    // Specimen vertical center is between upper grip bottom and lower grip top.
    const upperGripBottom = this._crossheadY + CROSSHEAD_H / 2 + GRIP_H;
    const lowerGripTop = RIG_BASE_Y - GRIP_H;
    const cx = RIG_X;
    const cy = (upperGripBottom + lowerGripTop) / 2;
    const h = lowerGripTop - upperGripBottom;

    // Track home dimensions for scaling during the test.
    this._specimenHomeY = cy;
    this._specimenHomeH = h;
    this._specimenHomeW = SPECIMEN_HOME_W;

    this._specimen = this.add.rectangle(cx, cy, SPECIMEN_HOME_W, h, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);

    // Wood grain striations.
    if (grain) {
      const g = this.add.graphics();
      g.lineStyle(1, grain, 0.7);
      for (let i = -2; i <= 2; i++) {
        g.lineBetween(cx + i * 4, cy - h / 2 + 2, cx + i * 4, cy + h / 2 - 2);
      }
      g.setDepth(2);
      this._specimenGrain = g;
    }

    // Reset visual scale state.
    this._specimenScaleX = 1;
    this._specimenScaleY = 1;
  }

  _drawReadout() {
    // Backing panel above the rig.
    this.add.rectangle(RIG_X, 70, 280, 36, COL_PANEL)
      .setStrokeStyle(2, COL_PANEL_EDGE).setDepth(2);
    this._readoutText = this.add.text(RIG_X, 70, 'Force: 0 N    Strain: 0.0%    Stress: 0 MPa', {
      fontSize: '11px', fontFamily: 'monospace', color: '#10b981',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }

  _updateReadout(force, strain, stress) {
    if (!this._readoutText) return;
    const f = Math.round(force).toLocaleString();
    const eps = (strain * 100).toFixed(1);
    const sig = Math.round(stress);
    this._readoutText.setText(`Force: ${f} N    Strain: ${eps}%    Stress: ${sig} MPa`);
  }

  /** Material selector slots — one chip per material. */
  _drawMaterialSelector() {
    const panelX = 60;
    const panelY = 110;
    const slotH = 60;
    const slotW = 160;
    const slotGap = 8;

    this.add.text(panelX + slotW / 2, panelY - 16, 'MATERIALS', {
      fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    this._materialSlots = [];
    MATERIAL_IDS.forEach((id, idx) => {
      const mat = getMaterial(id);
      const sy = panelY + idx * (slotH + slotGap);
      const slotBg = this.add.rectangle(panelX + slotW / 2, sy + slotH / 2, slotW, slotH,
        COL_PANEL).setStrokeStyle(2, COL_PANEL_EDGE).setDepth(2)
        .setInteractive({ useHandCursor: true });

      // Color chip
      const chip = this.add.rectangle(panelX + 18, sy + slotH / 2, 22, 36,
        hexToInt(mat.visual.color)).setStrokeStyle(1, 0x111114).setDepth(3);

      // Name
      const nameTxt = this.add.text(panelX + 38, sy + 12, mat.name, {
        fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT,
        fontStyle: 'bold', wordWrap: { width: slotW - 50 },
      }).setDepth(3);

      // Category line
      this.add.text(panelX + 38, sy + 28, mat.category, {
        fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      }).setDepth(3);

      // Tested check (depth, separate so we can toggle).
      const check = this.add.text(panelX + slotW - 18, sy + slotH / 2, '✓', {
        fontSize: '18px', fontFamily: 'sans-serif', color: '#22c55e',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4)
        .setVisible(this._testedMaterials.has(id));

      slotBg.on('pointerdown', () => this._selectMaterial(id));

      this._materialSlots.push({ id, slotBg, chip, nameTxt, check });
    });

    this._refreshSlotHighlight();
  }

  _refreshSlotHighlight() {
    if (!this._materialSlots) return;
    for (const slot of this._materialSlots) {
      const isActive = slot.id === this._currentMaterialId;
      slot.slotBg.setStrokeStyle(isActive ? 3 : 2,
        isActive ? 0xfbbf24 : COL_PANEL_EDGE);
      slot.check.setVisible(this._testedMaterials.has(slot.id));
    }
  }

  _selectMaterial(materialId) {
    if (this._testInProgress) return;
    if (!getMaterial(materialId)) return;
    this._currentMaterialId = materialId;
    // Reset crosshead and specimen.
    this._crossheadY = CROSSHEAD_HOME_Y;
    this._crosshead.y = this._crossheadY;
    this._upperGrip.y = this._crossheadY + CROSSHEAD_H / 2 + GRIP_H / 2;
    this._drawSpecimen(materialId);
    this._updateReadout(0, 0, 0);
    this._chartPoints = [];
    this._drawChart(null);
    this._refreshSlotHighlight();
  }

  /** START TEST button. */
  _drawStartButton() {
    const bx = 140;
    const by = 410;
    const bw = 160;
    const bh = 44;
    this._startBtnBg = this.add.rectangle(bx, by, bw, bh, 0x16a34a)
      .setStrokeStyle(3, 0x065f46).setDepth(3)
      .setInteractive({ useHandCursor: true });
    this._startBtnLabel = this.add.text(bx, by, '▶ START TEST', {
      fontSize: '14px', fontFamily: 'sans-serif', color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    this._startBtnBg.on('pointerdown', () => this._runTest(this._currentMaterialId));
    this._startBtnBg.on('pointerover', () => {
      if (!this._testInProgress) this._startBtnBg.setFillStyle(0x22c55e);
    });
    this._startBtnBg.on('pointerout', () => {
      if (!this._testInProgress) this._startBtnBg.setFillStyle(0x16a34a);
    });

    // Helper text
    this.add.text(bx, by + 32, 'Pulls the specimen apart\nuntil it fails.', {
      fontSize: '10px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      align: 'center',
    }).setOrigin(0.5).setDepth(3);
  }

  _setStartButtonEnabled(enabled) {
    if (!this._startBtnBg) return;
    this._startBtnBg.setFillStyle(enabled ? 0x16a34a : 0x4b5563);
    this._startBtnLabel.setText(enabled ? '▶ START TEST' : '⏳ Testing...');
    if (enabled) this._startBtnBg.setInteractive({ useHandCursor: true });
    else this._startBtnBg.disableInteractive();
  }

  // ───────────────────────────────────────────────────────────────────────
  // Chart
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Draw / redraw the chart. If `progressCurve` is null, just paints axes.
   * Else paints axes + the curve up to the current progress point with
   * region coloring.
   */
  _drawChart(progressCurve) {
    if (!this._chartG) {
      this._chartG = this.add.graphics().setDepth(2);
    }
    const g = this._chartG;
    g.clear();

    // Panel
    g.fillStyle(COL_PANEL, 1);
    g.fillRect(CHART_X, CHART_Y, CHART_W, CHART_H);
    g.lineStyle(2, COL_PANEL_EDGE, 1);
    g.strokeRect(CHART_X, CHART_Y, CHART_W, CHART_H);

    // Title (one-time)
    if (!this._chartTitle) {
      this._chartTitle = this.add.text(CHART_X + CHART_W / 2, CHART_Y - 14,
        'STRESS vs STRAIN', {
          fontSize: '12px', fontFamily: 'sans-serif', color: COL_TEXT,
          fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(3);
    }

    const innerX = CHART_X + CHART_PAD;
    const innerY = CHART_Y + CHART_PAD - 4;
    const innerW = CHART_W - CHART_PAD - 12;
    const innerH = CHART_H - CHART_PAD - 28;

    // Determine domain. If we have a curve, use its bounds; else use the
    // currently selected material's anticipated bounds for axis labels.
    const mat = getMaterial(this._currentMaterialId);
    const domStrain = (progressCurve && progressCurve.length)
      ? Math.max(progressCurve[progressCurve.length - 1].strain, mat.fractureStrain)
      : mat.fractureStrain;
    const domStress = (progressCurve && progressCurve.length)
      ? Math.max(...progressCurve.map((p) => p.stress), mat.ultimateStrengthMPa)
      : mat.ultimateStrengthMPa;
    const xMax = domStrain * 1.05;
    const yMax = domStress * 1.10;

    // Axes
    g.lineStyle(2, 0xa4a8b3, 1);
    g.lineBetween(innerX, innerY + innerH, innerX + innerW, innerY + innerH); // x
    g.lineBetween(innerX, innerY, innerX, innerY + innerH);                    // y

    // Grid ticks
    g.lineStyle(1, COL_GRID, 0.6);
    for (let i = 1; i <= 4; i++) {
      const tx = innerX + (i / 4) * innerW;
      g.lineBetween(tx, innerY, tx, innerY + innerH);
      const ty = innerY + (i / 4) * innerH;
      g.lineBetween(innerX, ty, innerX + innerW, ty);
    }

    // Axis labels (recreated every redraw — small text count, cheap).
    if (this._chartAxisLabels) this._chartAxisLabels.forEach((t) => t.destroy());
    this._chartAxisLabels = [];
    const xLabel = this.add.text(CHART_X + CHART_W / 2, CHART_Y + CHART_H - 8,
      `strain (mm/mm), max ${xMax.toFixed(2)}`, {
        fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      }).setOrigin(0.5).setDepth(3);
    this._chartAxisLabels.push(xLabel);
    const yLabel = this.add.text(CHART_X + 6, CHART_Y + CHART_H / 2,
      `stress (MPa)\nmax ${Math.round(yMax)}`, {
        fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
        align: 'center',
      }).setOrigin(0.5).setDepth(3).setRotation(-Math.PI / 2);
    this._chartAxisLabels.push(yLabel);

    if (!progressCurve || progressCurve.length < 2) {
      // No curve yet — just helpful "press START" hint.
      const hint = this.add.text(CHART_X + CHART_W / 2, CHART_Y + CHART_H / 2,
        'Press START TEST to begin', {
          fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
        }).setOrigin(0.5).setDepth(3);
      this._chartAxisLabels.push(hint);
      return;
    }

    // Plot the curve, region-colored.
    const toScreen = (p) => ({
      x: innerX + (p.strain / xMax) * innerW,
      y: innerY + innerH - (p.stress / yMax) * innerH,
    });

    let prevColor = null;
    for (let i = 1; i < progressCurve.length; i++) {
      const a = progressCurve[i - 1];
      const b = progressCurve[i];
      const region = b.region || 'elastic';
      const color =
        region === 'elastic' ? COL_ELASTIC :
        region === 'plastic' ? COL_PLASTIC : COL_FAILURE;
      if (color !== prevColor) {
        g.lineStyle(2.5, color, 1);
        prevColor = color;
      }
      const pa = toScreen(a);
      const pb = toScreen(b);
      g.lineBetween(pa.x, pa.y, pb.x, pb.y);
    }

    // Markers — yield + ultimate. Recreate label objects each redraw to
    // keep code simple; they're a couple of text nodes.
    const fp = detectFailurePoint(progressCurve);
    if (fp.ultimatePoint && progressCurve.length >= 4) {
      const u = toScreen(fp.ultimatePoint);
      g.fillStyle(0xfbbf24, 1);
      g.fillCircle(u.x, u.y, 3);
      const ulabel = this.add.text(u.x + 4, u.y - 10,
        `Ult ${Math.round(fp.ultimatePoint.stress)} MPa`, {
          fontSize: '9px', fontFamily: 'sans-serif', color: '#fbbf24',
          fontStyle: 'bold',
        }).setDepth(4);
      this._chartAxisLabels.push(ulabel);
    }
    if (mat.yieldStrengthMPa != null && fp.yieldPoint && progressCurve.length >= 4) {
      const y0 = toScreen(fp.yieldPoint);
      g.fillStyle(0x60a5fa, 1);
      g.fillCircle(y0.x, y0.y, 3);
      const ylabel = this.add.text(y0.x + 4, y0.y - 10,
        `Yld ${Math.round(fp.yieldPoint.stress)} MPa`, {
          fontSize: '9px', fontFamily: 'sans-serif', color: '#60a5fa',
          fontStyle: 'bold',
        }).setDepth(4);
      this._chartAxisLabels.push(ylabel);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Test simulation
  // ───────────────────────────────────────────────────────────────────────

  _runTest(materialId) {
    if (this._testInProgress) return;
    const mat = getMaterial(materialId);
    if (!mat) return;

    // Pre-compute the curve.
    const result = runTensileTest(materialId, { gaugeLengthMm: 50, crossSectionAreaMm2: 100 });
    if (!result || !result.curve || result.curve.length === 0) return;
    const curve = result.curve;
    const fracStrain = mat.fractureStrain;

    this._testInProgress = true;
    this._setStartButtonEnabled(false);
    this._chartPoints = [];

    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx?.('ui_click');

    // Drive the test by tweening an index counter through the curve.
    this.tweens.addCounter({
      from: 0,
      to: curve.length - 1,
      duration: TEST_DURATION_MS,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => {
        const idx = Math.min(curve.length - 1, Math.max(0, Math.floor(tween.getValue())));
        const sample = curve[idx];

        // Visual deformation. strain → stretch height, neck/stretch → width.
        const stretch = 1 + sample.strain;
        const widthFactor = this._widthFactorFor(mat, sample, fracStrain);
        this._applySpecimenDeformation(stretch, widthFactor);

        // Move the crosshead up proportional to current strain.
        const yOffset = (sample.strain / fracStrain) * 30;
        const targetY = CROSSHEAD_HOME_Y - yOffset;
        this._crosshead.y = targetY;
        this._upperGrip.y = targetY + CROSSHEAD_H / 2 + GRIP_H / 2;

        // Force = stress (MPa) × area (mm²). Area = 100 mm² (from options).
        const force = sample.stress * 100;
        this._updateReadout(force, sample.strain, sample.stress);

        // Append to chart progress curve.
        this._chartPoints.push(sample);
        // Throttle chart redraws — every 3 ticks.
        if (this._chartPoints.length % 3 === 0 || idx === curve.length - 1) {
          this._drawChart(this._chartPoints);
        }
      },
      onComplete: () => {
        this._drawChart(curve);
        this._animateFailure(materialId);
        // After failure animation, mark tested and emit completion.
        this.time.delayedCall(800, () => {
          this._markTestComplete(materialId);
          this._setStartButtonEnabled(true);
          this._testInProgress = false;
        });
      },
    });
  }

  /** Compute width-scale factor based on material failure mode and curve sample. */
  _widthFactorFor(mat, sample, fracStrain) {
    const t = sample.strain / fracStrain;             // 0..1 progress
    if (mat.failureMode === 'ductile-necking') {
      // Steel: stays full width through elastic, then necks aggressively
      // in last 30% (matches plastic→failure transition).
      if (t < 0.6) return 1;
      const k = (t - 0.6) / 0.4;
      return 1 - 0.55 * k; // down to ~45% width at fracture
    }
    if (mat.failureMode === 'ductile-stretch') {
      // Copper: thins uniformly along the whole length.
      return 1 - 0.45 * t;
    }
    // Wood: holds width essentially up to fracture.
    return 1 - 0.05 * t;
  }

  /** Apply visual deformation to the specimen (height stretch + width thin). */
  _applySpecimenDeformation(stretchY, scaleX) {
    if (!this._specimen) return;
    const cx = RIG_X;
    const upperGripBottom = this._crosshead.y + CROSSHEAD_H / 2 + GRIP_H;
    const lowerGripTop = RIG_BASE_Y - GRIP_H;
    const newH = lowerGripTop - upperGripBottom;
    const newY = (upperGripBottom + lowerGripTop) / 2;
    const newW = Math.max(2, this._specimenHomeW * scaleX);
    this._specimen.setPosition(cx, newY);
    this._specimen.setSize(newW, Math.max(4, newH));
    if (this._specimenGrain) {
      this._specimenGrain.clear();
      const mat = getMaterial(this._currentMaterialId);
      const grain = mat?.visual?.grainColor;
      if (grain) {
        this._specimenGrain.lineStyle(1, hexToInt(grain), 0.7);
        const half = newW / 2;
        const step = Math.max(2, newW / 4);
        for (let xo = -half + 2; xo <= half - 2; xo += step) {
          this._specimenGrain.lineBetween(cx + xo, newY - newH / 2 + 2,
            cx + xo, newY + newH / 2 - 2);
        }
      }
    }
    this._specimenScaleY = stretchY;
    this._specimenScaleX = scaleX;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Failure animations — splinter, neck-snap, stretch-tear
  // ───────────────────────────────────────────────────────────────────────

  _animateFailure(materialId) {
    const mat = getMaterial(materialId);
    if (!mat) return;

    const audioMgr = this.registry.get('audioManager');
    if (mat.failureMode === 'splinter') {
      this._failSplinter();
      audioMgr?.playSfx?.('ui_error');
    } else if (mat.failureMode === 'ductile-necking') {
      this._failNecking();
      audioMgr?.playSfx?.('ui_error');
      this.cameras.main?.shake?.(150, 0.005);
    } else if (mat.failureMode === 'ductile-stretch') {
      this._failStretch();
      audioMgr?.playSfx?.('ui_error');
    }
  }

  /** Mesquite — diagonal break + flying splinters. */
  _failSplinter() {
    if (!this._specimen) return;
    const mat = getMaterial(this._currentMaterialId);
    const wood = hexToInt(mat.visual.color);
    const grain = hexToInt(mat.visual.grainColor || mat.visual.color);
    const cx = this._specimen.x;
    const cy = this._specimen.y;
    const sw = this._specimen.width;
    const sh = this._specimen.height;

    // Hide the specimen — we'll replace with two halves at a slight angle.
    this._specimen.setVisible(false);
    if (this._specimenGrain) this._specimenGrain.setVisible(false);

    const top = this.add.rectangle(cx, cy - sh / 4, sw, sh / 2, wood)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    const bot = this.add.rectangle(cx, cy + sh / 4, sw, sh / 2, wood)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    top.setRotation(-0.15);
    bot.setRotation(0.12);

    this.tweens.add({
      targets: top, y: cy - sh / 2 - 6, alpha: 0.9, duration: 400, ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: bot, y: cy + sh / 2 + 6, alpha: 0.95, duration: 400, ease: 'Quad.easeOut',
    });

    // Splinters
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
      const dist = 30 + Math.random() * 30;
      const sp = this.add.rectangle(cx, cy, 3 + Math.random() * 3, 8 + Math.random() * 6,
        i % 2 === 0 ? wood : grain).setDepth(4).setRotation(Math.random() * Math.PI);
      this.tweens.add({
        targets: sp,
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        rotation: sp.rotation + (Math.random() * 4 - 2),
        alpha: 0,
        duration: 700 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => sp.destroy(),
      });
    }

    // Dust puff
    for (let i = 0; i < 3; i++) {
      const dust = this.add.circle(cx + (Math.random() - 0.5) * 10, cy, 6, 0xd6c19a, 0.6)
        .setDepth(3);
      this.tweens.add({
        targets: dust,
        y: cy - 20 - Math.random() * 12,
        alpha: 0,
        scale: 1.6,
        duration: 600,
        onComplete: () => dust.destroy(),
      });
    }
  }

  /** Steel — clean horizontal break across the necked region. */
  _failNecking() {
    if (!this._specimen) return;
    const mat = getMaterial(this._currentMaterialId);
    const color = hexToInt(mat.visual.color);
    const cx = this._specimen.x;
    const cy = this._specimen.y;
    const sw = this._specimen.width;
    const sh = this._specimen.height;

    // Hide and replace with two halves separating along a clean horizontal cut.
    this._specimen.setVisible(false);

    const top = this.add.rectangle(cx, cy - sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    const bot = this.add.rectangle(cx, cy + sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);

    // Tiny "snap" flash at break point.
    const flash = this.add.circle(cx, cy, 14, 0xfffbeb, 0.85).setDepth(5);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 2.2, duration: 220, onComplete: () => flash.destroy(),
    });

    this.tweens.add({
      targets: top, y: cy - sh / 2, duration: 350, ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: bot, y: cy + sh / 2, duration: 350, ease: 'Quad.easeOut',
    });
  }

  /** Copper — both halves curl at the tear; dramatic stretch. */
  _failStretch() {
    if (!this._specimen) return;
    const mat = getMaterial(this._currentMaterialId);
    const color = hexToInt(mat.visual.color);
    const cx = this._specimen.x;
    const cy = this._specimen.y;
    const sw = Math.max(4, this._specimen.width);
    const sh = this._specimen.height;

    this._specimen.setVisible(false);

    // Two tapered halves — represent each as a thin rectangle that we
    // tween further apart, plus a curled "tip" rectangle at each break edge.
    const top = this.add.rectangle(cx, cy - sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    const bot = this.add.rectangle(cx, cy + sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);

    const topTip = this.add.rectangle(cx + 4, cy - 2, sw * 0.7, 4, color)
      .setStrokeStyle(1, 0x111114).setDepth(3).setRotation(0.4);
    const botTip = this.add.rectangle(cx - 4, cy + 2, sw * 0.7, 4, color)
      .setStrokeStyle(1, 0x111114).setDepth(3).setRotation(-0.4);

    this.tweens.add({
      targets: top, y: cy - sh / 2 - 4, duration: 600, ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: bot, y: cy + sh / 2 + 4, duration: 600, ease: 'Sine.easeOut',
    });
    this.tweens.add({
      targets: topTip, y: cy - sh / 2 + 6, x: cx + 8, rotation: 1.0, duration: 700,
    });
    this.tweens.add({
      targets: botTip, y: cy + sh / 2 - 6, x: cx - 8, rotation: -1.0, duration: 700,
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // Test completion + quest hook
  // ───────────────────────────────────────────────────────────────────────

  _markTestComplete(materialId) {
    this._testedMaterials.add(materialId);
    const state = this.registry.get('gameState') || {};
    const updated = {
      ...state,
      materialTestsCompleted: Array.from(this._testedMaterials),
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
    this._refreshSlotHighlight();

    // If all 3 tested → emit completion / quest dialog.
    if (this._testedMaterials.size >= MATERIAL_IDS.length) {
      this._emitTestCompletedIfQuestActive();
    } else {
      // Casual progress dialog
      const remaining = MATERIAL_IDS.length - this._testedMaterials.size;
      this.registry.set('dialogEvent', {
        speaker: 'Mr. Chen',
        text: `Good — ${getMaterial(materialId).name} tested. ` +
          `${remaining} more to go.\n\nThe data is starting to tell a story.`,
        choices: null, step: null,
      });
    }
  }

  /**
   * If the active quest is bridge_collapse on the test_material step, emit
   * the completion dialog so LocalSceneBase.advanceFromDialog handles the
   * step advance. Otherwise emit a casual completion dialog.
   */
  _emitTestCompletedIfQuestActive() {
    const state = this.registry.get('gameState') || {};
    const aq = state.activeQuest;

    // Be defensive — we don't have direct access to QUESTS here for the
    // step's id, but the bridge_collapse layout has test_material at the
    // observe step that wants 'load_test_completed'. The dialogEvent shape
    // simply needs to be a real dialog; advanceFromDialog reads activeQuest
    // off state and calls advanceQuest(state) which checks the step's
    // requiredObservation against `state.observations`. To make sure that
    // check passes, mark the observation as completed before opening the
    // dialog.
    if (aq?.id === 'bridge_collapse') {
      const observations = Array.isArray(state.observations) ? state.observations : [];
      if (!observations.includes('load_test_completed')) {
        const updated = {
          ...state,
          observations: [...observations, 'load_test_completed'],
        };
        this.registry.set('gameState', updated);
        saveGame(updated);
      }
      this.registry.set('dialogEvent', {
        speaker: 'Mr. Chen',
        text:
          'All three tested! Now we know which one to use. ' +
          'The data tells the story.\n\n' +
          '🪵 Mesquite splintered.\n' +
          '⚙️ Steel necked, then snapped.\n' +
          '🟠 Copper stretched and stretched.\n\n' +
          "Strength alone isn't enough — it's strength per weight that matters for a bridge.",
        choices: null,
        step: state.activeQuest,
      });
    } else {
      this.registry.set('dialogEvent', {
        speaker: 'Mr. Chen',
        text:
          'Three for three! Each material failed in its own way:\n' +
          '🪵 Mesquite splintered, ⚙️ steel necked, 🟠 copper stretched.\n\n' +
          'Come back any time you want to test more.',
        choices: null, step: null,
      });
    }
  }
}

// ── HMR ────────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, MaterialLabScene);
