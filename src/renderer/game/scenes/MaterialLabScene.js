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
import { runTensileTest, detectFailurePoint } from '../systems/materials/materialTestingEngine.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

const SCENE_KEY = 'MaterialLabScene';

// Rig geometry.
const RIG_X = 220;
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

  // ── Apparatus ───────────────────────────────────────────────────────
  drawApparatus(ctx) {
    const L = ctx.layer;
    L.add(this.add.rectangle(RIG_X, RIG_BASE_Y + RIG_BASE_H / 2, RIG_BASE_W, RIG_BASE_H, COL_BASE)
      .setStrokeStyle(2, 0x111114).setDepth(2));
    [-1, 1].forEach((s) => {
      L.add(this.add.circle(RIG_X + s * 70, RIG_BASE_Y + 8, 3, 0x9aa0aa).setDepth(3));
      L.add(this.add.circle(RIG_X + s * 70, RIG_BASE_Y + 22, 3, 0x9aa0aa).setDepth(3));
      L.add(this.add.rectangle(
        RIG_X + s * COLUMN_DX, RIG_BASE_Y - COLUMN_H / 2, COLUMN_W, COLUMN_H, COL_COLUMN,
      ).setStrokeStyle(1, 0x33363c).setDepth(1));
    });
    L.add(this.add.rectangle(RIG_X, CROSSBEAM_Y, CROSSBEAM_W, CROSSBEAM_H, COL_BEAM)
      .setStrokeStyle(2, 0x2c2e34).setDepth(2));
    L.add(this.add.rectangle(RIG_X, CROSSBEAM_Y - 14, 22, 18, 0x5a5d63).setDepth(2));
    L.add(this.add.circle(RIG_X, CROSSBEAM_Y - 14, 4, 0xfacc15).setDepth(3));

    // Movable crosshead + grips — refs needed by animateProgress.
    this._crossheadY = CROSSHEAD_HOME_Y;
    this._crosshead = this.add.rectangle(
      RIG_X, this._crossheadY, CROSSHEAD_W, CROSSHEAD_H, 0x8a8e96,
    ).setStrokeStyle(2, 0x33363c).setDepth(3);
    L.add(this._crosshead);
    this._upperGrip = this.add.rectangle(
      RIG_X, this._crossheadY + CROSSHEAD_H / 2 + GRIP_H / 2,
      GRIP_W, GRIP_H, COL_GRIP,
    ).setStrokeStyle(1, 0x111114).setDepth(3);
    L.add(this._upperGrip);
    this._lowerGrip = this.add.rectangle(
      RIG_X, RIG_BASE_Y - GRIP_H / 2, GRIP_W, GRIP_H, COL_GRIP,
    ).setStrokeStyle(1, 0x111114).setDepth(3);
    L.add(this._lowerGrip);
  }

  // ── Specimen ────────────────────────────────────────────────────────
  drawSpecimenForSample(materialId, ctx) {
    const mat = getMaterial(materialId);
    if (!mat) return;
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

    this._specimenRect = this.add.rectangle(RIG_X, cy, SPECIMEN_HOME_W, h, color)
      .setStrokeStyle(1, 0x111114).setDepth(2);
    ctx.specimenLayer.add(this._specimenRect);

    if (grain) {
      const g = this.add.graphics();
      g.lineStyle(1, grain, 0.7);
      for (let i = -2; i <= 2; i++) {
        g.lineBetween(RIG_X + i * 4, cy - h / 2 + 2, RIG_X + i * 4, cy + h / 2 - 2);
      }
      g.setDepth(2);
      this._specimenGrain = g;
      ctx.specimenLayer.add(g);
    } else {
      this._specimenGrain = null;
    }
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
    const upperGripBottom = this._crosshead.y + CROSSHEAD_H / 2 + GRIP_H;
    const lowerGripTop = RIG_BASE_Y - GRIP_H;
    const newH = lowerGripTop - upperGripBottom;
    const newY = (upperGripBottom + lowerGripTop) / 2;
    const newW = Math.max(2, this._specimenHomeW * scaleX);
    this._specimenRect.setPosition(RIG_X, newY);
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
            RIG_X + xo, newY - newH / 2 + 2, RIG_X + xo, newY + newH / 2 - 2,
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
    ];
  }

  // ── Chart ───────────────────────────────────────────────────────────
  getChartConfig(result) {
    const baseCfg = {
      title: 'STRESS vs STRAIN',
      xLabel: 'strain', yLabel: 'stress',
      xUnit: 'mm/mm', yUnit: 'MPa',
      regionColors: { elastic: 0x22c55e, plastic: 0xf59e0b, failure: 0xef4444 },
    };
    if (!result) {
      const mat = getMaterial(this._activeSampleId);
      return {
        ...baseCfg,
        xMax: (mat?.fractureStrain ?? 0.20) * 1.05,
        yMax: (mat?.ultimateStrengthMPa ?? 500) * 1.10,
      };
    }
    return {
      ...baseCfg,
      xMax: (result.summary?.fractureStrain || 0.10) * 1.05,
      yMax: (result.summary?.ultimateStrengthMPa || 100) * 1.10,
    };
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

  // ── Quest dialogs ───────────────────────────────────────────────────
  getCompletionDialog() {
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
}

// ── HMR ────────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, MaterialLabScene);
