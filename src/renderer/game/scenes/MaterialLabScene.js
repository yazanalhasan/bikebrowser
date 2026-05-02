/**
 * MaterialLabScene — Mr. Chen's Universal Testing Machine (UTM) lab.
 *
 * Phase-2 of the Lab Rig System: thin subclass of LabRigBase. The base
 * owns selector / START / tween / readout / chart / quest hook / exit /
 * first-entry hint. This file contributes ONLY UTM-specific anatomy,
 * per-tick deformation, per-material failure animations, and copy.
 *
 * Closes bridge_collapse step `test_material` via the
 * `load_test_completed` observation when all three samples are tested.
 */

import LabRigBase from './LabRigBase.js';
import { MATERIALS, MATERIAL_IDS, getMaterial } from '../systems/materials/materialDatabase.js';
import {
  computeSharedStressStrainAxes,
  runTensileTest,
  detectFailurePoint,
} from '../systems/materials/materialTestingEngine.js';
import { saveGame } from '../systems/saveSystem.js';
import { loadLayout } from '../utils/loadLayout.js';
import { createScaleStation } from '../systems/lab/scaleStation.js';
import { createCalipers } from '../systems/lab/calipers.js';
import { createDensitySlate } from '../systems/lab/densitySlate.js';
import { renderDensityChart } from '../systems/lab/densityChart.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

// Sample-id → inventory item mapping. The scale enables a button only
// when the player owns the corresponding sample item.
// Canonical IDs (granted by quests/scenes that hand out the item):
//   mesquite_wood     → 'mesquite_wood_sample' (granted by bridge_collapse)
//   structural_steel  → 'steel_sample' (granted by ZuzuGarageScene workbench)
//   copper            → 'copper_ore_sample' (granted by ZuzuGarageScene)
// Aliases preserved so older saves and alternate grant paths still
// recognize the same conceptual material:
//   mesquite_sample / mesquite_branch — pre-canonicalization save state
//   steel_bracket — alternate workbench grant id
//   surface_copper / deep_copper — CopperMineScene-granted variants
const SAMPLE_ITEM_IDS = {
  mesquite_wood: ['mesquite_wood_sample', 'mesquite_sample', 'mesquite_branch'],
  structural_steel: ['steel_sample', 'steel_bracket'],
  copper: ['copper_ore_sample', 'surface_copper', 'deep_copper'],
};

const SCENE_KEY = 'MaterialLabScene';
const LAYOUT_KEY = 'materialLabLayout';

// Rig geometry.
const RIG_BASE_Y = 480;
const RIG_BASE_W = 180;
const RIG_BASE_H = 30;
const COLUMN_W = 10;
const COLUMN_H = 230;
const COLUMN_DX = 70;
const CROSSBEAM_Y = RIG_BASE_Y - COLUMN_H - 10;
const CROSSBEAM_W = 180;
const CROSSBEAM_H = 14;
const CROSSHEAD_HOME_Y = RIG_BASE_Y - 200;
const CROSSHEAD_W = 140;
const CROSSHEAD_H = 14;
const GRIP_W = 28;
const GRIP_H = 18;
const SPECIMEN_HOME_W = 18;

const COL_BASE = 0x3b3b40;
const COL_COLUMN = 0x6b6e74;
const COL_BEAM = 0x55585f;
const COL_GRIP = 0x2c2c30;

function hexToInt(hex) {
  if (hex == null) return 0xcccccc;
  if (typeof hex === 'number') return hex;
  const s = hex.startsWith('#') ? hex.slice(1) : hex;
  const v = parseInt(s, 16);
  return Number.isFinite(v) ? v : 0xcccccc;
}

export default class MaterialLabScene extends LabRigBase {
  constructor() { super(SCENE_KEY); }

  preload() {
    this.load.json(LAYOUT_KEY, 'layouts/material-lab.layout.json');
  }

  // ── Identity ────────────────────────────────────────────────────────
  getSceneKey() { return SCENE_KEY; }
  getRigTitle() { return 'MATERIALS LAB — UNIVERSAL TESTING MACHINE'; }
  getRigTitleEmoji() { return '🧪'; }
  getRigSubtitle() { return null; }
  getQuestId() { return 'bridge_collapse'; }
  getTestedStateKey() { return 'materialTestsCompleted'; }
  getCompletionObservation() { return 'load_test_completed'; }
  getExitSpawnName() { return 'fromMaterialLab'; }

  // ── Sample set ──────────────────────────────────────────────────────
  getSampleSet() {
    return MATERIAL_IDS.map((id) => {
      const m = MATERIALS[id];
      return {
        id, name: m.name,
        color: m.visual.color,
        secondaryColor: m.visual.grainColor,
        category: m.category,
      };
    });
  }

  runSampleTest(materialId) {
    return runTensileTest(materialId, { gaugeLengthMm: 50, crossSectionAreaMm2: 100 });
  }

  // ── Density instrument layout ───────────────────────────────────────
  // Keep the weighing/caliper/slate controls grouped below the chart so
  // they read as a separate density station and do not cover the UTM.
  _instrumentLayout() {
    const scale = this.layout.density_scale;
    const calipers = this.layout.density_calipers;
    const slate = this.layout.density_slate;
    const slatePanel = this.layout.density_slate_panel;
    return {
      scaleDisplayY: scale.displayY,
      scalePlatformY: scale.platformY,
      scaleX: scale.x,
      calipersX: calipers.x,
      calipersY: calipers.y,
      slateX: slate.x,
      slateY: slate.y,
      slatePanel,
    };
  }

  // ── createWorld: extend base to mount left-bay instruments after the
  //   selector / START / chart are built. ────────────────────────────────
  createWorld() {
    this.layout = loadLayout(this, LAYOUT_KEY);
    super.createWorld();
    this._mountLeftBayInstruments();
    this._buildSlowToggle();
  }

  // ── Apparatus ───────────────────────────────────────────────────────
  drawApparatus(ctx) {
    const L = ctx.layer;
    const rigX = this.layout.utm.x;
    L.add(this.add.rectangle(rigX, RIG_BASE_Y + RIG_BASE_H / 2, RIG_BASE_W, RIG_BASE_H, COL_BASE)
      .setStrokeStyle(2, 0x111114).setDepth(2));
    [-1, 1].forEach((s) => {
      L.add(this.add.circle(rigX + s * 70, RIG_BASE_Y + 8, 3, 0x9aa0aa).setDepth(3));
      L.add(this.add.circle(rigX + s * 70, RIG_BASE_Y + 22, 3, 0x9aa0aa).setDepth(3));
      L.add(this.add.rectangle(
        rigX + s * COLUMN_DX, RIG_BASE_Y - COLUMN_H / 2, COLUMN_W, COLUMN_H, COL_COLUMN,
      ).setStrokeStyle(1, 0x33363c).setDepth(1));
    });
    L.add(this.add.rectangle(rigX, CROSSBEAM_Y, CROSSBEAM_W, CROSSBEAM_H, COL_BEAM)
      .setStrokeStyle(2, 0x2c2e34).setDepth(2));
    L.add(this.add.rectangle(rigX, CROSSBEAM_Y - 14, 22, 18, 0x5a5d63).setDepth(2));
    L.add(this.add.circle(rigX, CROSSBEAM_Y - 14, 4, 0xfacc15).setDepth(3));

    // Movable crosshead + grips — refs needed by animateProgress.
    this._crossheadY = CROSSHEAD_HOME_Y;
    this._crosshead = this.add.rectangle(
      rigX, this._crossheadY, CROSSHEAD_W, CROSSHEAD_H, 0x8a8e96,
    ).setStrokeStyle(2, 0x33363c).setDepth(3);
    L.add(this._crosshead);
    this._upperGrip = this.add.rectangle(
      rigX, this._crossheadY + CROSSHEAD_H / 2 + GRIP_H / 2,
      GRIP_W, GRIP_H, COL_GRIP,
    ).setStrokeStyle(1, 0x111114).setDepth(3);
    L.add(this._upperGrip);
    this._lowerGrip = this.add.rectangle(
      rigX, RIG_BASE_Y - GRIP_H / 2, GRIP_W, GRIP_H, COL_GRIP,
    ).setStrokeStyle(1, 0x111114).setDepth(3);
    L.add(this._lowerGrip);
  }

  // ── Specimen ────────────────────────────────────────────────────────
  drawSpecimenForSample(materialId, ctx) {
    const mat = getMaterial(materialId);
    if (!mat) return;
    const rigX = this.layout.utm.x;
    const color = hexToInt(mat.visual.color);
    const grain = mat.visual.grainColor ? hexToInt(mat.visual.grainColor) : null;

    // Reset crosshead home.
    this._crossheadY = CROSSHEAD_HOME_Y;
    if (this._crosshead) this._crosshead.y = this._crossheadY;
    if (this._upperGrip) this._upperGrip.y = this._crossheadY + CROSSHEAD_H / 2 + GRIP_H / 2;

    const upperGripBottom = this._crossheadY + CROSSHEAD_H / 2 + GRIP_H;
    const lowerGripTop = RIG_BASE_Y - GRIP_H;
    const cy = (upperGripBottom + lowerGripTop) / 2;
    const h = lowerGripTop - upperGripBottom;
    this._specimenHomeW = SPECIMEN_HOME_W;

    this._specimenRect = this.add.rectangle(rigX, cy, SPECIMEN_HOME_W, h, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    ctx.specimenLayer.add(this._specimenRect);

    if (grain) {
      const g = this.add.graphics();
      g.lineStyle(1, grain, 0.7);
      for (let i = -2; i <= 2; i++) {
        g.lineBetween(rigX + i * 4, cy - h / 2 + 2, rigX + i * 4, cy + h / 2 - 2);
      }
      g.setDepth(2);
      this._specimenGrain = g;
      ctx.specimenLayer.add(g);
    } else {
      this._specimenGrain = null;
    }

    this._lastTeachingKey = null;
    this._setTeachingCallout(
      'Elastic: the sample should spring back until it reaches yield.',
      0x22c55e,
    );
  }

  // ── Per-tick deformation ────────────────────────────────────────────
  animateProgress(_progress01, sample, result, _ctx) {
    if (!this._specimenRect) return;
    const materialId = result?.summary?.materialId || result?.materialId;
    const mat = getMaterial(materialId);
    if (!mat) return;
    const fracStrain = mat.fractureStrain;

    // Crosshead pulls up proportional to current strain.
    const yOffset = (sample.strain / Math.max(1e-6, fracStrain)) * 30;
    const targetY = CROSSHEAD_HOME_Y - yOffset;
    if (this._crosshead) this._crosshead.y = targetY;
    if (this._upperGrip) this._upperGrip.y = targetY + CROSSHEAD_H / 2 + GRIP_H / 2;

    // Specimen height tracks the gap between grips; width thins per failure mode.
    this._applyDeformation(this._widthFactorFor(mat, sample, fracStrain));
    this._updateTeachingCallout(sample, result);
  }

  _widthFactorFor(mat, sample, fracStrain) {
    const t = sample.strain / Math.max(1e-6, fracStrain);
    if (mat.failureMode === 'ductile-necking') {
      // Steel: full width through 60%, then necks aggressively (~45% at fracture).
      if (t < 0.6) return 1;
      return 1 - 0.55 * ((t - 0.6) / 0.4);
    }
    if (mat.failureMode === 'ductile-stretch') {
      // Copper: thins uniformly along the whole length (~55% at fracture).
      return 1 - 0.45 * t;
    }
    // Wood (splinter): essentially holds width up to fracture.
    return 1 - 0.05 * t;
  }

  _applyDeformation(scaleX) {
    if (!this._specimenRect || !this._crosshead) return;
    const rigX = this.layout.utm.x;
    const upperGripBottom = this._crosshead.y + CROSSHEAD_H / 2 + GRIP_H;
    const lowerGripTop = RIG_BASE_Y - GRIP_H;
    const newH = lowerGripTop - upperGripBottom;
    const newY = (upperGripBottom + lowerGripTop) / 2;
    const newW = Math.max(2, this._specimenHomeW * scaleX);
    this._specimenRect.setPosition(rigX, newY);
    this._specimenRect.setSize(newW, Math.max(4, newH));

    if (this._specimenGrain) {
      this._specimenGrain.clear();
      const mat = getMaterial(this._activeSampleId);
      const grain = mat?.visual?.grainColor;
      if (grain) {
        this._specimenGrain.lineStyle(1, hexToInt(grain), 0.7);
        const half = newW / 2;
        const step = Math.max(2, newW / 4);
        for (let xo = -half + 2; xo <= half - 2; xo += step) {
          this._specimenGrain.lineBetween(
            rigX + xo, newY - newH / 2 + 2, rigX + xo, newY + newH / 2 - 2,
          );
        }
      }
    }
  }

  // ── Per-material failure animations ────────────────────────────────
  animateCompletion(result, ctx) {
    const materialId = result?.summary?.materialId || result?.materialId;
    const mat = getMaterial(materialId);
    if (!mat) return;
    const audioMgr = this.registry.get('audioManager');
    if (mat.failureMode === 'splinter') {
      this._animateSplinter(mat, ctx);
      audioMgr?.playSfx?.('ui_error');
    } else if (mat.failureMode === 'ductile-necking') {
      this._animateNeckSnap(mat, ctx);
      audioMgr?.playSfx?.('ui_error');
      this.cameras.main?.shake?.(150, 0.005);
    } else if (mat.failureMode === 'ductile-stretch') {
      this._animateStretchTear(mat, ctx);
      audioMgr?.playSfx?.('ui_error');
    }
  }

  /** Common helper: splits the specimen into two halves at the break point. */
  _splitSpecimen(color, ctx, { tiltTop = 0, tiltBot = 0 } = {}) {
    const sp = this._specimenRect;
    const cx = sp.x, cy = sp.y, sw = sp.width, sh = sp.height;
    sp.setVisible(false);
    if (this._specimenGrain) this._specimenGrain.setVisible(false);
    const top = this.add.rectangle(cx, cy - sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2).setRotation(tiltTop);
    const bot = this.add.rectangle(cx, cy + sh / 4, sw, sh / 2, color)
      .setStrokeStyle(1, 0x111114).setDepth(2).setRotation(tiltBot);
    ctx.effectsLayer.add(top); ctx.effectsLayer.add(bot);
    return { top, bot, cx, cy, sw, sh };
  }

  /** Mesquite — diagonal break + 8 splinters + dust. */
  _animateSplinter(mat, ctx) {
    if (!this._specimenRect) return;
    const wood = hexToInt(mat.visual.color);
    const grain = hexToInt(mat.visual.grainColor || mat.visual.color);
    const { top, bot, cx, cy, sh } = this._splitSpecimen(wood, ctx, { tiltTop: -0.15, tiltBot: 0.12 });

    this.tweens.add({ targets: top, y: cy - sh / 2 - 6, alpha: 0.9, duration: 400, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: bot, y: cy + sh / 2 + 6, alpha: 0.95, duration: 400, ease: 'Quad.easeOut' });

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.4;
      const dist = 30 + Math.random() * 30;
      const sp = this.add.rectangle(
        cx, cy, 3 + Math.random() * 3, 8 + Math.random() * 6,
        i % 2 === 0 ? wood : grain,
      ).setDepth(4).setRotation(Math.random() * Math.PI);
      ctx.effectsLayer.add(sp);
      this.tweens.add({
        targets: sp,
        x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist,
        rotation: sp.rotation + (Math.random() * 4 - 2),
        alpha: 0, duration: 700 + Math.random() * 200,
        ease: 'Quad.easeOut',
        onComplete: () => sp.destroy(),
      });
    }
    for (let i = 0; i < 3; i++) {
      const dust = this.add.circle(cx + (Math.random() - 0.5) * 10, cy, 6, 0xd6c19a, 0.6).setDepth(3);
      ctx.effectsLayer.add(dust);
      this.tweens.add({
        targets: dust, y: cy - 20 - Math.random() * 12, alpha: 0, scale: 1.6,
        duration: 600, onComplete: () => dust.destroy(),
      });
    }
  }

  /** Steel — clean horizontal break + white flash (camera shake handled in animateCompletion). */
  _animateNeckSnap(mat, ctx) {
    if (!this._specimenRect) return;
    const color = hexToInt(mat.visual.color);
    const { top, bot, cx, cy, sh } = this._splitSpecimen(color, ctx);

    const flash = this.add.circle(cx, cy, 14, 0xfffbeb, 0.85).setDepth(5);
    ctx.effectsLayer.add(flash);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 2.2, duration: 220,
      onComplete: () => flash.destroy(),
    });
    this.tweens.add({ targets: top, y: cy - sh / 2, duration: 350, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: bot, y: cy + sh / 2, duration: 350, ease: 'Quad.easeOut' });
  }

  /** Copper — both halves curl at the tear; soft, no shake. */
  _animateStretchTear(mat, ctx) {
    if (!this._specimenRect) return;
    const color = hexToInt(mat.visual.color);
    const { top, bot, cx, cy, sw, sh } = this._splitSpecimen(color, ctx);

    const topTip = this.add.rectangle(cx + 4, cy - 2, sw * 0.7, 4, color)
      .setStrokeStyle(1, 0x111114).setDepth(3).setRotation(0.4);
    const botTip = this.add.rectangle(cx - 4, cy + 2, sw * 0.7, 4, color)
      .setStrokeStyle(1, 0x111114).setDepth(3).setRotation(-0.4);
    ctx.effectsLayer.add(topTip); ctx.effectsLayer.add(botTip);

    this.tweens.add({ targets: top, y: cy - sh / 2 - 4, duration: 600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: bot, y: cy + sh / 2 + 4, duration: 600, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: topTip, y: cy - sh / 2 + 6, x: cx + 8, rotation: 1.0, duration: 700 });
    this.tweens.add({ targets: botTip, y: cy + sh / 2 - 6, x: cx - 8, rotation: -1.0, duration: 700 });
  }

  // ── Readout ─────────────────────────────────────────────────────────
  getReadoutFields(_progress01, sample, _summary) {
    if (!sample) {
      return [
        { label: 'Force', value: '0 N' },
        { label: 'Strain', value: '0.0%' },
        { label: 'Stress', value: '0 MPa' },
      ];
    }
    // Force = stress (MPa) × area (mm²); area = 100 mm².
    const force = (sample.stress || 0) * 100;
    return [
      { label: 'Force', value: `${Math.round(force).toLocaleString()} N` },
      { label: 'Strain', value: `${(sample.strain * 100).toFixed(1)}%` },
      { label: 'Stress', value: `${Math.round(sample.stress)} MPa` },
      { label: 'Phase', value: this._labelRegion(sample.region) },
    ];
  }

  getTestDurationMs() {
    return this._slowMode ? 7000 : 3500;
  }

  // ── Chart ───────────────────────────────────────────────────────────
  getChartConfig(result) {
    const comparisonCurves = this._getTestedMaterialCurves(result?.summary?.materialId || result?.materialId);
    const curveMax = this._getComparisonCurveMax(comparisonCurves);
    const sharedAxes = computeSharedStressStrainAxes(MATERIAL_IDS, {
      gaugeLengthMm: 50,
      crossSectionAreaMm2: 100,
    });
    const baseCfg = {
      title: comparisonCurves.length > 1 ? 'UTM COMPARISON' : 'STRESS vs STRAIN',
      xLabel: 'strain', yLabel: 'stress',
      xUnit: 'mm/mm', yUnit: 'MPa',
      regionColors: { elastic: 0x22c55e, plastic: 0xf59e0b, failure: 0xef4444 },
      comparisonCurves,
    };
    if (!result) {
      return {
        ...baseCfg,
        xMax: Math.max(sharedAxes.xMax, curveMax.x * 1.05),
        yMax: Math.max(sharedAxes.yMax, curveMax.y * 1.10),
      };
    }
    return {
      ...baseCfg,
      xMax: Math.max(sharedAxes.xMax, curveMax.x * 1.05),
      yMax: Math.max(sharedAxes.yMax, curveMax.y * 1.10),
    };
  }

  _getTestedMaterialCurves(activeMaterialId = null) {
    const state = this.registry.get('gameState') || {};
    const tested = Array.isArray(state.materialTestsCompleted)
      ? state.materialTestsCompleted
      : [];
    const ids = [...new Set(tested.filter(id => MATERIAL_IDS.includes(id)))];
    if (activeMaterialId && !ids.includes(activeMaterialId)) ids.push(activeMaterialId);
    return ids.map((id) => {
      const mat = getMaterial(id);
      const result = runTensileTest(id, { gaugeLengthMm: 50, crossSectionAreaMm2: 100 });
      return {
        id,
        label: mat?.name?.split(' ')[0] || id,
        color: hexToInt(mat?.visual?.color),
        curve: result?.curve || [],
        alpha: id === activeMaterialId ? 0.95 : 0.5,
        lineWidth: id === activeMaterialId ? 3 : 2,
      };
    }).filter(entry => entry.curve.length > 1);
  }

  _getComparisonCurveMax(curves) {
    return curves.reduce((acc, entry) => {
      entry.curve.forEach((point) => {
        acc.x = Math.max(acc.x, point.x || point.strain || 0);
        acc.y = Math.max(acc.y, point.y || point.stress || 0);
      });
      return acc;
    }, { x: 0, y: 0 });
  }

  getChartAnnotations(result) {
    if (!result || !Array.isArray(result.curve) || result.curve.length < 4) return null;
    const { yieldPoint, ultimatePoint } = detectFailurePoint(result.curve);
    const annotations = [];
    if (ultimatePoint) {
      annotations.push({
        xValue: ultimatePoint.strain, yValue: ultimatePoint.stress,
        label: `Ult ${Math.round(ultimatePoint.stress)} MPa`,
        color: 0xfbbf24,
      });
    }
    const mat = getMaterial(result.summary?.materialId || result.materialId);
    if (mat?.yieldStrengthMPa != null && yieldPoint && yieldPoint !== ultimatePoint) {
      annotations.push({
        xValue: yieldPoint.strain, yValue: yieldPoint.stress,
        label: `Yld ${Math.round(yieldPoint.stress)} MPa`,
        color: 0x60a5fa,
      });
    }
    return annotations.length ? annotations : null;
  }

  // ── Teaching layer ────────────────────────────────────────────────────────
  _buildSlowToggle() {
    const cfg = this.layout.slow_toggle;
    if (!cfg) return;
    this._slowMode = false;
    this._slowToggleBg = this.add.rectangle(cfg.x, cfg.y, cfg.w, cfg.h, 0x2c2e34)
      .setStrokeStyle(1, 0x4a4d55).setDepth(4)
      .setInteractive({ useHandCursor: true });
    this._slowToggleLabel = this.add.text(cfg.x, cfg.y, 'Slow replay: OFF', {
      fontSize: '10px', fontFamily: 'sans-serif', color: '#e7e9ee',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this._slowToggleBg.on('pointerdown', () => {
      if (this._testInProgress) return;
      this._slowMode = !this._slowMode;
      this._slowToggleLabel.setText(`Slow replay: ${this._slowMode ? 'ON' : 'OFF'}`);
      this._slowToggleBg.setFillStyle(this._slowMode ? 0x14532d : 0x2c2e34);
    });
  }

  _setTeachingCallout(text, color = 0x22c55e) {
    const cfg = this.layout.teaching_callout;
    if (!cfg) return;

    if (!this._teachingCalloutBg) {
      this._teachingCalloutBg = this.add.rectangle(cfg.x, cfg.y, cfg.w, 38, 0x111827, 0.9)
        .setStrokeStyle(2, color).setDepth(5);
      this._teachingCalloutText = this.add.text(cfg.x, cfg.y, '', {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#f8fafc',
        fontStyle: 'bold', align: 'center', wordWrap: { width: cfg.w - 18 },
      }).setOrigin(0.5).setDepth(6);
    }

    this._teachingCalloutBg.setStrokeStyle(2, color);
    this._teachingCalloutText.setText(text);
  }

  _updateTeachingCallout(sample, result) {
    if (!sample || !result?.curve) return;
    const { yieldPoint, ultimatePoint } = detectFailurePoint(result.curve);
    const materialId = result.summary?.materialId || result.materialId;
    const mat = getMaterial(materialId);
    const near = (a, b, tolerance) => Math.abs((a || 0) - (b || 0)) <= tolerance;

    let key = sample.region || 'elastic';
    let color = 0x22c55e;
    let text = 'Elastic: force removed now would mostly spring back.';

    if (yieldPoint && near(sample.strain, yieldPoint.strain, 0.002)) {
      key = 'yield';
      color = 0x60a5fa;
      text = 'Yield: permanent deformation starts here.';
    } else if (ultimatePoint && near(sample.strain, ultimatePoint.strain, 0.003)) {
      key = 'ultimate';
      color = 0xfbbf24;
      text = 'Ultimate strength: this is the peak load before failure takes over.';
    } else if (sample.region === 'plastic') {
      key = 'plastic';
      color = 0xf59e0b;
      text = `${mat?.name || 'Material'} is plastic now: its shape is changing for good.`;
    } else if (sample.region === 'failure') {
      key = 'failure';
      color = 0xef4444;
      text = this._failureCalloutFor(mat);
    }

    if (key === this._lastTeachingKey) return;
    this._lastTeachingKey = key;
    this._setTeachingCallout(text, color);
  }

  _failureCalloutFor(mat) {
    if (mat?.failureMode === 'splinter') return 'Failure: wood splinters suddenly after its fibers give way.';
    if (mat?.failureMode === 'ductile-necking') return 'Failure: steel necks down, then snaps at the thinnest point.';
    if (mat?.failureMode === 'ductile-stretch') return 'Failure: copper stretches a long way before tearing.';
    return 'Failure: the sample can no longer carry the load.';
  }

  _labelRegion(region) {
    if (region === 'plastic') return 'plastic';
    if (region === 'failure') return 'failure';
    return 'elastic';
  }

  // ── Quest dialogs ───────────────────────────────────────────────────
  _getUtmCompletionDialog() {
    return {
      speaker: 'Mr. Chen',
      text:
        'All three tested! Now we know which one to use. ' +
        'The data tells the story.\n\n' +
        '🪵 Mesquite splintered.\n' +
        '⚙️ Steel necked, then snapped.\n' +
        '🟠 Copper stretched and stretched.\n\n' +
        "Strength alone isn't enough — it's strength per weight that matters for a bridge.",
    };
  }

  getProgressDialog(materialId, _result, remaining) {
    const mat = getMaterial(materialId);
    return {
      speaker: 'Mr. Chen',
      text: `Good — ${mat?.name || materialId} tested. ${remaining} more to go.\n\n` +
        'The data is starting to tell a story.',
    };
  }

  getFirstEntryHint() {
    return {
      speaker: 'Mr. Chen',
      text:
        "Welcome to the Materials Lab!\n\n" +
        "This is the Universal Testing Machine — the UTM. " +
        "It pulls each sample apart until it fails, and the chart shows the story.\n\n" +
        "Pick a material from the panel, then press START TEST. " +
        "Test all three to see which is best for the bridge.",
    };
  }

  // ── Completion dialog: append "take the data back to Mr. Chen" + add
  //   structured journal entry on first all-tested completion. ──────────
  _emitCompletionDialog(result) {
    super._emitCompletionDialog(result);
    this._showComparisonPanel();
    // After base persists `load_test_completed`, append a structured
    // materialLog journal entry so the player can re-read it later.
    // Idempotent: don't double-append if the player re-runs the test.
    this._appendMaterialLogJournalOnce();
  }

  _markTestComplete(sampleId, result) {
    super._markTestComplete(sampleId, result);
    this._recordMaterialKnowledge(sampleId, result);
  }

  _recordMaterialKnowledge(sampleId, result) {
    const mat = getMaterial(sampleId);
    if (!mat || !result) return;
    const { yieldPoint, ultimatePoint, fracturePoint } = detectFailurePoint(result.curve || []);
    const state = this.registry.get('gameState') || {};
    const materialKnowledge = { ...(state.materialKnowledge || {}) };
    materialKnowledge[sampleId] = {
      tested: true,
      learnedFrom: SCENE_KEY,
      name: mat.name,
      category: mat.category,
      densityKgM3: mat.densityKgM3,
      elasticModulusGPa: result.summary?.elasticModulusGPa,
      yieldStrengthMPa: result.summary?.yieldStrengthMPa ?? null,
      ultimateStrengthMPa: result.summary?.ultimateStrengthMPa,
      fractureStrain: result.summary?.fractureStrain,
      maxForceN: Math.round(result.summary?.maxForceN || 0),
      strengthToWeightScore: result.scores?.strengthToWeightScore ?? null,
      failureMode: mat.failureMode,
      observedBehavior: this._materialBehaviorSummary(mat, result),
      yieldPoint: yieldPoint ? {
        strain: Number(yieldPoint.strain.toFixed(4)),
        stressMPa: Math.round(yieldPoint.stress),
      } : null,
      ultimatePoint: ultimatePoint ? {
        strain: Number(ultimatePoint.strain.toFixed(4)),
        stressMPa: Math.round(ultimatePoint.stress),
      } : null,
      fracturePoint: fracturePoint ? {
        strain: Number(fracturePoint.strain.toFixed(4)),
        stressMPa: Math.round(fracturePoint.stress),
      } : null,
      testedAt: Date.now(),
    };
    const updated = { ...state, materialKnowledge };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }

  _materialBehaviorSummary(mat, result) {
    const strength = Math.round((result.scores?.strengthScore || 0) * 100);
    const strengthToWeight = Math.round((result.scores?.strengthToWeightScore || 0) * 100);
    if (mat.failureMode === 'splinter') {
      return `Splinters suddenly; strength ${strength}%, strength-to-weight ${strengthToWeight}%.`;
    }
    if (mat.failureMode === 'ductile-necking') {
      return `Necks before snapping; strength ${strength}%, strength-to-weight ${strengthToWeight}%.`;
    }
    if (mat.failureMode === 'ductile-stretch') {
      return `Stretches dramatically before tearing; strength ${strength}%, strength-to-weight ${strengthToWeight}%.`;
    }
    return `Tested in the UTM; strength ${strength}%, strength-to-weight ${strengthToWeight}%.`;
  }

  /** Append a structured journal entry for this test session.
   *  Idempotent via state.observations.includes('materials_lab_journaled'). */
  _appendMaterialLogJournalOnce() {
    const state = this.registry.get('gameState') || {};
    const obs = Array.isArray(state.observations) ? state.observations : [];
    if (obs.includes('materials_lab_journaled')) return;
    const log = Array.isArray(state.materialLog) ? state.materialLog : [];
    if (log.length === 0) return; // Nothing to journal.

    const journal = Array.isArray(state.journal) ? state.journal : [];
    const now = Date.now();
    const isoDate = new Date(now).toISOString().slice(0, 10);
    const entry = {
      kind: 'materialLog',
      label: `Materials Test Lab — ${isoDate}`,
      rows: log.map(r => ({ ...r })),
      capturedAt: now,
    };
    const updated = {
      ...state,
      journal: [...journal, entry],
      observations: [...obs, 'materials_lab_journaled'],
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }

  // ── Append the "take it to Mr. Chen" line to the canonical dialog. ──
  getCompletionDialog() {
    const base = this._getUtmCompletionDialog();
    return {
      ...base,
      text: base.text +
        "\n\n📓 Take the data back to Mr. Chen — he'll want to see the numbers.",
    };
  }

  _showComparisonPanel() {
    const cfg = this.layout.comparison_panel;
    if (!cfg) return;
    if (this._comparisonPanel) this._comparisonPanel.destroy(true);

    const lines = [
      'Steel: strongest, but heavy.',
      'Copper: stretches, but weak and heavy.',
      'Mesquite: strong enough and light for the bridge.',
    ];
    const panel = this.add.container(0, 0).setDepth(8);
    panel.add(this.add.rectangle(cfg.x, cfg.y, cfg.w, cfg.h, 0x111827, 0.92)
      .setStrokeStyle(2, 0xfbbf24));
    panel.add(this.add.text(cfg.x, cfg.y - 18, 'Engineering takeaway', {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5));
    panel.add(this.add.text(cfg.x, cfg.y + 6, lines.join('\n'), {
      fontSize: '10px', fontFamily: 'sans-serif', color: '#f8fafc',
      align: 'center', lineSpacing: 2, wordWrap: { width: cfg.w - 18 },
    }).setOrigin(0.5));
    this._comparisonPanel = panel;
  }

  // ─── Alt chart mode: density bars ───────────────────────────────────
  getAlternateChartMode() {
    return {
      label: 'Density',
      isAvailable: () => {
        const state = this.registry.get('gameState') || {};
        return Array.isArray(state.materialLog) && state.materialLog.length > 0;
      },
    };
  }

  drawAlternateChart(g, geom) {
    const state = this.registry.get('gameState') || {};
    const log = Array.isArray(state.materialLog) ? state.materialLog : [];
    const tested = Array.isArray(state.materialTestsCompleted)
      ? state.materialTestsCompleted : [];
    const allMaterials = MATERIAL_IDS.map((id) => {
      const m = MATERIALS[id];
      return {
        id,
        name: m.name,
        color: hexToInt(m.visual.color),
        ultimateStrengthMPa: m.ultimateStrengthMPa,
      };
    });
    return renderDensityChart(this, g, {
      x: geom.x, y: geom.y, w: geom.w, h: geom.h,
      allMaterials,
      materialLog: log,
      testedIds: tested,
    });
  }

  // ─── Left-bay instrument mounting ───────────────────────────────────
  _mountLeftBayInstruments() {
    const layout = this._instrumentLayout();
    const state = this.registry.get('gameState') || {};
    const inv = Array.isArray(state.inventory) ? state.inventory : [];

    const samples = MATERIAL_IDS.map((id) => {
      const m = MATERIALS[id];
      const itemAliases = SAMPLE_ITEM_IDS[id] || [];
      const hasItem = itemAliases.some(alias => inv.includes(alias));
      return {
        id,
        name: m.name,
        color: hexToInt(m.visual.color),
        hasItem,
      };
    });

    // Scale station — buttons enabled only when player owns sample.
    this._scale = createScaleStation(this, {
      x: layout.scaleX,
      platformY: layout.scalePlatformY,
      displayY: layout.scaleDisplayY,
      samples,
      // computeMass: 10 cm³ uniform coupon × densityKgM3 → grams.
      // This is the ONE place that reads materialDatabase density for a
      // mass value; scaleStation never reads it directly.
      computeMass: (id) => {
        const m = MATERIALS[id];
        if (!m || !Number.isFinite(m.densityKgM3)) return 0;
        return (m.densityKgM3 * 10) / 1000; // 10 cm³ in m³ × kg/m³ → g
      },
      getRecorded: () => {
        const live = this.registry.get('gameState') || {};
        return Array.isArray(live.materialLog) ? live.materialLog : [];
      },
      onRecord: (entry) => this._recordMass(entry),
    });

    // Calipers / coupon — emits a Lab-Notes dialog and writes 'volume_known'.
    this._calipers = createCalipers(this, {
      x: layout.calipersX,
      y: layout.calipersY,
      onClick: () => this._onCalipersClick(),
    });

    // Density slate — opens a panel summarizing recorded measurements.
    this._slate = createDensitySlate(this, {
      x: layout.slateX,
      y: layout.slateY,
      panel: layout.slatePanel,
      getRecorded: () => {
        const live = this.registry.get('gameState') || {};
        return Array.isArray(live.materialLog) ? live.materialLog : [];
      },
      onAutoFill: (id, _name) => this._onSlateAutoFill(id),
    });

    // Also expose each as a proximity-prompt interactable so the player
    // can walk up and press E. Click-to-interact stays available too.
    this.addInteractable({
      x: layout.scaleX, y: layout.scaleDisplayY, radius: 70,
      icon: '⚖️', label: 'Scale',
      onInteract: () => { /* scale buttons handle their own clicks */ },
    });
    this.addInteractable({
      x: layout.calipersX, y: layout.calipersY, radius: 60,
      icon: '🧪', label: 'Coupons',
      onInteract: () => this._onCalipersClick(),
    });
    this.addInteractable({
      x: layout.slateX, y: layout.slateY, radius: 60,
      icon: '📋', label: 'Density Slate',
      onInteract: () => this._slate?.openPanel?.(),
    });
  }

  /** Push a measurement into state.materialLog and persist.
   *  When all 3 are recorded, also push 'masses_measured'. */
  _recordMass({ id, name, massGrams }) {
    const state = this.registry.get('gameState') || {};
    const log = Array.isArray(state.materialLog) ? state.materialLog : [];
    if (log.find(r => r.id === id)) return; // No double-record.

    const entry = { id, name, massGrams, recordedAt: Date.now() };
    const newLog = [...log, entry];
    const obs = Array.isArray(state.observations) ? state.observations : [];
    const newObs = [...obs];
    if (newLog.length >= MATERIAL_IDS.length && !newObs.includes('masses_measured')) {
      newObs.push('masses_measured');
    }
    const updated = { ...state, materialLog: newLog, observations: newObs };
    this.registry.set('gameState', updated);
    saveGame(updated);

    // If chart is in alt mode, re-render to reflect the new bar.
    if (this._chartMode === 'alt') {
      this.setChartMode('alt');
    }
  }

  /** Calipers click — Lab-Notes dialog + 'volume_known' observation. */
  _onCalipersClick() {
    const state = this.registry.get('gameState') || {};
    const obs = Array.isArray(state.observations) ? state.observations : [];
    if (!obs.includes('volume_known')) {
      const updated = { ...state, observations: [...obs, 'volume_known'] };
      this.registry.set('gameState', updated);
      saveGame(updated);
    }
    this.registry.set('dialogEvent', {
      speaker: 'Lab Notes',
      text:
        'All three coupons are machined to 10 cm³.\n\n' +
        'Density = mass ÷ volume.\n' +
        'So whatever the scale reads, divide by 10 to get g/cm³.',
      choices: null,
      step: null,
    });
  }

  /** Slate auto-fill — write derivedAnswers + 'densities_calculated'. */
  _onSlateAutoFill(id) {
    const state = this.registry.get('gameState') || {};
    const obs = Array.isArray(state.observations) ? state.observations : [];
    const newObs = obs.includes('densities_calculated')
      ? obs : [...obs, 'densities_calculated'];
    const updated = {
      ...state,
      derivedAnswers: { ...(state.derivedAnswers || {}), lightestMaterial: id },
      observations: newObs,
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }
}

// ── HMR ────────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, MaterialLabScene);
