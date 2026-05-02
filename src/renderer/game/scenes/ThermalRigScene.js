/**
 * ThermalRigScene — Mrs. Ramirez's Thermal Expansion Lab.
 *
 * First consumer of LabRigBase. The player heats steel, copper, and
 * aluminum rods and watches them stretch. Closes heat_failure quest's
 * `observe_expansion` step (`thermal_expansion_observed`).
 *
 * Subclass scope is intentionally tiny — every lifecycle bone (selector,
 * START button, tween, chart, progress dialog, first-entry hint, exit
 * zone, observation hook) is in LabRigBase.
 */

import LabRigBase from './LabRigBase.js';
import {
  THERMAL_RODS,
  THERMAL_ROD_IDS,
  getThermalRod,
} from '../systems/materials/thermalRigDatabase.js';
import { runThermalTest } from '../systems/materials/thermalRigEngine.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

const SCENE_KEY = 'ThermalRigScene';

// Apparatus geometry — rod lays HORIZONTAL across the rig (left → right).
const RIG_X = 220;             // center x
const RIG_Y = 320;             // rod's vertical centerline
const ROD_BASE_PX_PER_MM = 3;  // 100 mm rod → 300 px wide
const ROD_HEIGHT_PX = 16;
const SUPPORT_W = 28;
const SUPPORT_H = 70;
const BASE_W = 380;
const BASE_H = 18;

// Tint endpoints — base color → red-hot at 200°C.
const HOT_COLOR_HEX = 0xff5500;
const FULL_HOT_TEMP_C = 200;

function hexToInt(hex) {
  if (hex == null) return 0xcccccc;
  if (typeof hex === 'number') return hex;
  const s = hex.startsWith('#') ? hex.slice(1) : hex;
  const v = parseInt(s, 16);
  return Number.isFinite(v) ? v : 0xcccccc;
}

// Linear interpolate between two 24-bit colors. t in [0,1].
function lerpColor(aInt, bInt, t) {
  const tt = Math.max(0, Math.min(1, t));
  const ar = (aInt >> 16) & 0xff, ag = (aInt >> 8) & 0xff, ab = aInt & 0xff;
  const br = (bInt >> 16) & 0xff, bg = (bInt >> 8) & 0xff, bb = bInt & 0xff;
  const r = Math.round(ar + (br - ar) * tt);
  const g = Math.round(ag + (bg - ag) * tt);
  const b = Math.round(ab + (bb - ab) * tt);
  return (r << 16) | (g << 8) | b;
}

export default class ThermalRigScene extends LabRigBase {
  constructor() {
    super(SCENE_KEY);
  }

  // ── Identity ──────────────────────────────────────────────────────
  getSceneKey() { return SCENE_KEY; }
  getRigTitle() { return 'THERMAL EXPANSION LAB'; }
  getRigSubtitle() { return 'how much does each metal stretch when heated?'; }
  getRigTitleEmoji() { return '🌡️'; }
  getQuestId() { return 'heat_failure'; }
  getExitSpawnName() { return 'fromThermalRig'; }

  // ── Sample set ────────────────────────────────────────────────────
  getSampleSet() {
    return THERMAL_ROD_IDS.map((id) => {
      const r = THERMAL_RODS[id];
      return {
        id,
        name: r.name,
        color: r.color,
        category: `α ${(r.alphaPerK * 1e6).toFixed(1)} ×10⁻⁶/K`,
      };
    });
  }

  runSampleTest(rodId) {
    return runThermalTest(rodId);
  }

  // ── Apparatus ─────────────────────────────────────────────────────
  drawApparatus(ctx) {
    const layer = ctx.layer;

    // Heavy concrete-gray base under the rig.
    const base = this.add.rectangle(RIG_X, RIG_Y + 70, BASE_W, BASE_H, 0x3b3b40)
      .setStrokeStyle(2, 0x111114).setDepth(2);
    layer.add(base);

    // Bolts on the base.
    [-1, 1].forEach((s) => {
      const dot = this.add.circle(RIG_X + s * 150, RIG_Y + 70, 3, 0x9aa0aa).setDepth(3);
      layer.add(dot);
    });

    // Two ceramic insulator supports — light cream, with a darker mount block.
    const leftMount = this.add.rectangle(RIG_X - 130, RIG_Y + 30, SUPPORT_W + 6, 12, 0x55585f)
      .setStrokeStyle(1, 0x33363c).setDepth(2);
    const rightMount = this.add.rectangle(RIG_X + 130, RIG_Y + 30, SUPPORT_W + 6, 12, 0x55585f)
      .setStrokeStyle(1, 0x33363c).setDepth(2);
    layer.add(leftMount); layer.add(rightMount);

    const leftCeramic = this.add.rectangle(RIG_X - 130, RIG_Y, SUPPORT_W, SUPPORT_H, 0xede4ce)
      .setStrokeStyle(1, 0x8b7d56).setDepth(2);
    const rightCeramic = this.add.rectangle(RIG_X + 130, RIG_Y, SUPPORT_W, SUPPORT_H, 0xede4ce)
      .setStrokeStyle(1, 0x8b7d56).setDepth(2);
    layer.add(leftCeramic); layer.add(rightCeramic);

    // V-cradle notches on the supports (where the rod rests).
    [-1, 1].forEach((s) => {
      const notch = this.add.triangle(
        RIG_X + s * 130, RIG_Y - SUPPORT_H / 2 + 4,
        -10, 6,
        10, 6,
        0, -4,
        0xc8b896,
      ).setDepth(3);
      layer.add(notch);
    });

    // Furnace flame icon under the rod's midsection.
    const flameBox = this.add.rectangle(RIG_X, RIG_Y + 40, 60, 24, 0x14151a)
      .setStrokeStyle(2, 0x4a4d55).setDepth(2);
    layer.add(flameBox);
    this._flameText = this.add.text(RIG_X, RIG_Y + 40, '🔥', { fontSize: '22px' })
      .setOrigin(0.5).setDepth(4);
    layer.add(this._flameText);

    // Temperature dial graphic on the right.
    const dial = this.add.circle(RIG_X + 175, RIG_Y - 10, 22, 0x14151a)
      .setStrokeStyle(2, 0x4a4d55).setDepth(2);
    layer.add(dial);
    const dialFace = this.add.text(RIG_X + 175, RIG_Y - 10, '🌡️', {
      fontSize: '18px',
    }).setOrigin(0.5).setDepth(3);
    layer.add(dialFace);
    this._dialText = this.add.text(RIG_X + 175, RIG_Y + 18, '25°C', {
      fontSize: '10px', fontFamily: 'monospace', color: '#10b981',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
    layer.add(this._dialText);

    // Cache base width for reuse during specimen draw.
    this._rodBasePxPerMm = ROD_BASE_PX_PER_MM;
  }

  // ── Specimen (rod) ────────────────────────────────────────────────
  drawSpecimenForSample(rodId, ctx) {
    const rod = getThermalRod(rodId);
    if (!rod) return;

    const widthPx = (rod.lengthMm || 100) * ROD_BASE_PX_PER_MM;
    const baseColor = hexToInt(rod.color);

    this._rodBaseWidthPx = widthPx;
    this._rodBaseColor = baseColor;

    const rect = this.add.rectangle(RIG_X, RIG_Y, widthPx, ROD_HEIGHT_PX, baseColor)
      .setStrokeStyle(1, 0x111114).setDepth(3);
    ctx.specimenLayer.add(rect);

    this._rodRect = rect;

    // Reset readout to home temperature.
    if (this._dialText) this._dialText.setText('25°C');
    if (this._flameText) this._flameText.setAlpha(0.6);

    // Reset any heat-haze emitted last test.
    this._hazeEls = [];
  }

  // ── Per-tick deformation + heating ────────────────────────────────
  animateProgress(_progress01, sample, _result, ctx) {
    if (!this._rodRect) return;
    const tempC = sample.x;       // tempC
    const deltaMm = sample.deltaMm || 0;

    // 1. Stretch — rod's drawn width grows with thermal expansion.
    const baseW = this._rodBaseWidthPx;
    const newW = baseW * (1 + (deltaMm / 100));
    this._rodRect.displayWidth = newW;

    // 2. Tint toward red-hot as temperature climbs.
    const t = Math.min(1, Math.max(0, tempC / FULL_HOT_TEMP_C));
    const tint = lerpColor(this._rodBaseColor, HOT_COLOR_HEX, t);
    this._rodRect.fillColor = tint;

    // 3. Heat haze + flame intensity.
    if (this._flameText) {
      this._flameText.setAlpha(0.6 + 0.4 * t);
      this._flameText.setScale(0.95 + 0.15 * t);
    }
    if (this._dialText) {
      this._dialText.setText(`${tempC.toFixed(0)}°C`);
      // Color drift cool-green → warm-amber → red.
      const c = t < 0.5
        ? '#10b981'
        : (t < 0.85 ? '#f59e0b' : '#ef4444');
      this._dialText.setColor(c);
    }

    // Spawn a haze puff every few ticks once warm.
    if (t > 0.25 && Math.random() < 0.15 + 0.4 * t) {
      this._spawnHazePuff(ctx, t);
    }
  }

  _spawnHazePuff(ctx, intensity) {
    const x = RIG_X + (Math.random() - 0.5) * (this._rodBaseWidthPx * 0.6);
    const y = RIG_Y - 8;
    const r = 4 + Math.random() * 5;
    const color = intensity > 0.7 ? 0xffb04a : 0xfde68a;
    const puff = this.add.circle(x, y, r, color, 0.45);
    puff.setDepth(4);
    ctx.effectsLayer.add(puff);
    this.tweens.add({
      targets: puff,
      y: y - 28 - Math.random() * 14,
      alpha: 0,
      scale: 1.3 + Math.random() * 0.6,
      duration: 600 + Math.random() * 300,
      onComplete: () => puff.destroy(),
    });
  }

  // ── Completion (gentle conclusion) ────────────────────────────────
  animateCompletion(result, ctx) {
    // Cool the flame visually.
    if (this._flameText) {
      this.tweens.add({
        targets: this._flameText,
        alpha: 0.6,
        scale: 0.95,
        duration: 700,
      });
    }

    // Drift the rod color partway back over 1s. We tween a counter and
    // recompute the lerped fillColor each frame.
    if (this._rodRect && this._rodBaseColor != null) {
      const startColor = this._rodRect.fillColor;
      const endColor = lerpColor(this._rodBaseColor, HOT_COLOR_HEX, 0.25);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 1000,
        onUpdate: (tw) => {
          const tt = tw.getValue();
          const c = lerpColor(startColor, endColor, tt);
          if (this._rodRect && this._rodRect.scene) {
            this._rodRect.fillColor = c;
          }
        },
      });
    }

    // Numeric label "ΔL = 0.42 mm" floats up + fades.
    const totalDeltaMm = result?.summary?.totalDeltaMm ?? 0;
    const label = this.add.text(RIG_X, RIG_Y - 28,
      `ΔL = ${totalDeltaMm.toFixed(2)} mm`, {
        fontSize: '13px', fontFamily: 'monospace', color: '#fde68a',
        fontStyle: 'bold', stroke: '#1c1d22', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(6);
    ctx.effectsLayer.add(label);
    this.tweens.add({
      targets: label,
      y: RIG_Y - 60,
      alpha: 0,
      duration: 1600,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });

    // Ambient sfx — reuse an existing UI cue (no new audio assets).
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx?.('ui_success');
  }

  // ── Readout ───────────────────────────────────────────────────────
  getReadoutFields(_progress01, sample, _summary) {
    if (!sample) {
      return [
        { label: 'Temperature', value: '25.0 °C' },
        { label: 'Length', value: '100.00 mm' },
        { label: 'ΔL', value: '+0.00 mm' },
      ];
    }
    const tempC = sample.x ?? 25;
    const lenMm = sample.lengthMm ?? 100;
    const dMm = sample.deltaMm ?? sample.y ?? (lenMm - 100);
    const sign = dMm >= 0 ? '+' : '';
    return [
      { label: 'Temperature', value: `${tempC.toFixed(1)} °C` },
      { label: 'Length', value: `${lenMm.toFixed(2)} mm` },
      { label: 'ΔL', value: `${sign}${dMm.toFixed(2)} mm` },
    ];
  }

  // ── Chart ─────────────────────────────────────────────────────────
  getChartConfig(result) {
    const finalDelta = Math.max(
      result?.summary?.totalDeltaMm ?? 0,
      this._getSharedExpansionMax(),
    );
    return {
      title: 'EXPANSION vs TEMPERATURE',
      xLabel: 'Temperature',
      yLabel: 'Expansion',
      xMax: 200,
      yMax: Math.max(finalDelta * 1.15, 0.1),
      xUnit: '°C',
      yUnit: 'mm',
      regionColors: {
        elastic: 0x22c55e,
        plastic: 0xf59e0b,
        failure: 0xef4444,
      },
    };
  }

  _getSharedExpansionMax() {
    return Math.max(
      ...THERMAL_ROD_IDS.map((id) => runThermalTest(id)?.summary?.totalDeltaMm ?? 0),
    );
  }

  // ── Quest hook ────────────────────────────────────────────────────
  getTestedStateKey() { return 'thermalRodsExpanded'; }
  getCompletionObservation() { return 'thermal_expansion_observed'; }

  getCompletionDialog() {
    return {
      speaker: 'Mrs. Ramirez',
      text:
        "Look at that — aluminum stretched almost twice as much as steel " +
        "at the same temperature. That's why dissimilar materials at high " +
        "temp pull each other apart at joints. Each material has its own " +
        "thermal personality!",
    };
  }

  getProgressDialog(sampleId, _result, remaining) {
    const rod = getThermalRod(sampleId);
    const name = rod?.name || sampleId;
    return {
      speaker: 'Mrs. Ramirez',
      text: `${name} done — ${remaining} more to go.\n\n` +
        `Watch how each metal grows by a different amount at the same temperature.`,
    };
  }

  getFirstEntryHint() {
    return {
      speaker: 'Mrs. Ramirez',
      text:
        "Welcome to the thermal lab! Pick a rod and run the heating cycle " +
        "— watch how much each one stretches when it gets hot. Different " +
        "materials have different 'thermal personalities.'",
    };
  }
}

// ── HMR ────────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, ThermalRigScene);
