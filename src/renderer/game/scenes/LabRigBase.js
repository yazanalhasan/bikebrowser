/**
 * LabRigBase — the reusable Lab Rig System.
 *
 * Foundation for any "rig-and-readout" lab scene: a rig anatomy on the
 * left, a sample selector + START button, a live readout panel, an
 * optional region-colored chart, and a per-tick animated test loop.
 *
 * First consumer: ThermalRigScene (heat_failure quest).
 * Phase 2: MaterialLabScene (UTM) will be migrated to extend this base.
 *
 * Design intent — every concrete lab scene is a *thin* subclass that:
 *   1. Declares its sample set (materials, rods, batteries, …).
 *   2. Provides a runSampleTest(id) → TestResult function.
 *   3. Draws its own apparatus + specimen + per-tick deformation.
 *
 * All lifecycle (selector, START, tween, chart, observation/quest hook,
 * exit zone, first-entry hint) is owned by the base.
 *
 * NOTE on HMR: the base does NOT call registerSceneHmr — it's an
 * abstract class with no scene key of its own. Each concrete subclass
 * must call registerSceneHmr at the bottom of its file.
 */

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';

// Defaults (subclasses can override via getWorldSize / hooks).
const DEFAULT_WORLD_W = 800;
const DEFAULT_WORLD_H = 600;
const DEFAULT_TEST_DURATION_MS = 3500;

// Visual palette shared across rigs.
const COL_BG = 0x2a2a32;
const COL_FLOOR = 0x35353f;
const COL_GRID = 0x4a4a55;
const COL_PANEL = 0x1c1d22;
const COL_PANEL_EDGE = 0x4a4d55;
const COL_TEXT = '#e7e9ee';
const COL_TEXT_DIM = '#a4a8b3';
const COL_ELASTIC_DEFAULT = 0x22c55e;
const COL_PLASTIC_DEFAULT = 0xf59e0b;
const COL_FAILURE_DEFAULT = 0xef4444;

// Selector panel layout (left side).
const SELECTOR_X = 60;
const SELECTOR_Y = 110;
const SELECTOR_W = 160;
const SELECTOR_H = 60;
const SELECTOR_GAP = 8;

// Chart panel layout (right side).
const CHART_X = 460;
const CHART_Y = 110;
const CHART_W = 310;
const CHART_H = 280;
const CHART_PAD = 28;

// START button.
const START_BTN_X = 140;
const START_BTN_Y = 410;
const START_BTN_W = 160;
const START_BTN_H = 44;

// Readout panel.
const READOUT_X = 220;
const READOUT_Y = 70;
const READOUT_W = 280;
const READOUT_H = 36;

// Convert "#rrggbb" to int.
function hexToInt(hex) {
  if (hex == null) return 0xcccccc;
  if (typeof hex === 'number') return hex;
  const s = hex.startsWith('#') ? hex.slice(1) : hex;
  const v = parseInt(s, 16);
  return Number.isFinite(v) ? v : 0xcccccc;
}

export default class LabRigBase extends LocalSceneBase {
  // ─────────────────────────────────────────────────────────────────────
  // Override points — subclasses MUST or MAY implement these.
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Phaser scene key string. (Required.)
   * UTM phase-2 returns: 'MaterialLabScene'.
   */
  getSceneKey() { return super.getSceneKey(); }

  /** Title shown in the top header bar. (Required.)
   *  UTM: 'MATERIALS LAB — UNIVERSAL TESTING MACHINE'. */
  getRigTitle() { return 'LAB RIG'; }

  /** Optional one-line subtitle under the title. */
  getRigSubtitle() { return null; }

  /** Optional emoji displayed before the title. */
  getRigTitleEmoji() { return '🔬'; }

  /**
   * Sample set the player tests. (Required.)
   * Returns array of `{id, name, color, secondaryColor?, icon?, category?}`.
   * UTM: maps MATERIALS via MATERIAL_IDS.
   */
  getSampleSet() { return []; }

  /**
   * Run the test for the given sample id and return a TestResult.
   * (Required.)
   *
   * Shape:
   *   {
   *     sampleId,
   *     curve: [{x, y, region, ...subclass extras}, ...],
   *     summary: {...},
   *     scores: {...},
   *     unlockedKnowledge?: [],
   *     passed?: boolean,
   *   }
   *
   * UTM: returns runTensileTest(id) — already shaped this way (each
   * curve point has {strain, stress, region}; phase 2 will alias x=strain,
   * y=stress on the result so the base's chart drawing works unchanged).
   */
  runSampleTest(_sampleId) { return null; }

  /**
   * Draw the rig anatomy (frame, supports, columns, base). (Required.)
   * @param {{scene: Phaser.Scene, layer: Phaser.GameObjects.Container, world: {w:number,h:number}}} _ctx
   * UTM: draws the UTM base + columns + crossbeam + crosshead + grips.
   */
  drawApparatus(_ctx) { /* subclass implements */ }

  /**
   * Draw the specimen for the given sample id. Called on initial entry
   * AND on every selector swap. The base destroys the prior layer
   * before this fires. (Required.)
   * UTM: draws the wood/copper/steel rectangle between the grips +
   * optional grain striations.
   */
  drawSpecimenForSample(_sampleId, _ctx) { /* subclass implements */ }

  /**
   * Per-tick animation while the test runs.
   * @param {number} _progress01 - 0..1
   * @param {object} _sample - current curve sample {x, y, region, ...}
   * @param {object} _result - the full TestResult
   * @param {object} _ctx
   * UTM: deforms the specimen height/width, moves the crosshead.
   */
  animateProgress(_progress01, _sample, _result, _ctx) { /* subclass implements */ }

  /**
   * Final completion animation (failure splinter / neck snap / heat haze
   * fade). Fires once, after the tween completes.
   * UTM: fires _failSplinter / _failNecking / _failStretch.
   */
  animateCompletion(_result, _ctx) { /* subclass implements */ }

  /**
   * Returns array of `{label, value}` pairs to display in the live
   * readout panel during the test. (Required.)
   * UTM: [{label:'Force',value:'1234 N'}, ...].
   */
  getReadoutFields(_progress01, _sample, _summary) { return []; }

  /**
   * Return null to hide the chart, or a config:
   *   { xLabel, yLabel, xMax, yMax, xUnit, yUnit, title?,
   *     regionColors?: { elastic, plastic, failure } }
   * UTM: returns stress-vs-strain config.
   */
  getChartConfig(_result) { return null; }

  /** Optional chart annotations — overlay points/labels on top of the curve.
   *  Returns array of { xValue, yValue, label, color, dotRadius? } OR null.
   *  Called once when chart renders with a full curve.
   *  UTM: returns yield + ultimate markers.  Thermal: returns null. */
  getChartAnnotations(_result) { return null; }

  /**
   * Optional alternate chart mode (e.g. UTM's "Density" view).
   * If the subclass returns a non-null object, the base renders a
   * small toggle button at the top-right of the chart header. The
   * subclass is responsible for drawing the alt-mode contents via
   * `drawAlternateChart(g, geometry)` when `_chartMode === 'alt'`.
   *
   * Shape: { label: string, isAvailable: () => boolean }
   * Default: null — no toggle, only stress-strain.
   */
  getAlternateChartMode() { return null; }

  /**
   * Render the alt-chart content. Called by the base when the toggle
   * is in the alt position. Subclass owns the drawing on the supplied
   * graphics object; the base provides chart-panel geometry.
   *
   * @param {Phaser.GameObjects.Graphics} _g
   * @param {{x:number, y:number, w:number, h:number}} _geom
   */
  drawAlternateChart(_g, _geom) { /* subclass implements */ }

  /** gameState field that persists tested ids. UTM: 'materialTestsCompleted'. */
  getTestedStateKey() { return 'labRigSamplesTested'; }

  /** Observation string emitted when ALL samples tested.
   *  UTM: 'load_test_completed'. */
  getCompletionObservation() { return null; }

  /** Dialog shown when ALL samples tested.
   *  UTM: Mr. Chen's "all three tested" speech. */
  getCompletionDialog() {
    return { speaker: 'Lab', text: 'All samples tested!' };
  }

  /** Casual per-test dialog while progress is partial.
   *  Optional override; default is a generic "good — N more to go" line. */
  getProgressDialog(sampleId, _result, remaining) {
    return {
      speaker: 'Lab',
      text: `Good — ${sampleId} tested. ${remaining} more to go.`,
    };
  }

  /** Quest id this rig serves. UTM: 'bridge_collapse'. */
  getQuestId() { return null; }

  /** Optional first-entry hint dialog (shown once per save).
   *  UTM: Mr. Chen's welcome to the Materials Lab. */
  getFirstEntryHint() { return null; }

  /** Spawn name used for the back-to-garage exit. Override if needed. */
  getExitSpawnName() { return 'fromMaterialLab'; }

  /** Test tween duration in ms. */
  getTestDurationMs() { return DEFAULT_TEST_DURATION_MS; }

  /** Default world size — 800×600 unless overridden. */
  getWorldSize() { return { width: DEFAULT_WORLD_W, height: DEFAULT_WORLD_H }; }

  // ─────────────────────────────────────────────────────────────────────
  // LocalSceneBase hook — base owns the entire build.
  // ─────────────────────────────────────────────────────────────────────

  createWorld() {
    const state = this.registry.get('gameState') || {};
    const world = this.getWorldSize();
    this._worldDim = { w: world.width, h: world.height };

    // Restore tested-set from save.
    const stateKey = this.getTestedStateKey();
    const prior = Array.isArray(state[stateKey]) ? state[stateKey] : [];
    this._testedIds = new Set(prior);

    // Determine initial active sample.
    const samples = this.getSampleSet() || [];
    this._samples = samples;
    this._activeSampleId = samples.length ? samples[0].id : null;
    this._testInProgress = false;
    this._chartPoints = [];

    // ── Subclass-facing ctx ───────────────────────────────────────────
    // We give the subclass a Container as its drawing layer so the base
    // can clean specimen swaps simply by clearing/destroying children.
    this._apparatusLayer = this.add.container(0, 0).setDepth(2);
    this._specimenLayer = this.add.container(0, 0).setDepth(3);
    this._effectsLayer = this.add.container(0, 0).setDepth(4);
    this._ctx = {
      scene: this,
      layer: this._apparatusLayer,
      specimenLayer: this._specimenLayer,
      effectsLayer: this._effectsLayer,
      world: this._worldDim,
    };

    // ── Background + title ────────────────────────────────────────────
    this._drawBackground();
    this._drawTitle();

    // ── Apparatus + specimen (subclass) ───────────────────────────────
    this.drawApparatus(this._ctx);
    if (this._activeSampleId) {
      this.drawSpecimenForSample(this._activeSampleId, this._ctx);
    }

    // ── UI: readout + selector + START + chart ────────────────────────
    this._buildReadout();
    this._buildSelector();
    this._buildStartButton();
    this._renderChart(null);

    // ── Exit back to garage ───────────────────────────────────────────
    this.addExit({
      x: world.width / 2, y: world.height - 18,
      width: 200, height: 28,
      targetScene: 'ZuzuGarageScene',
      targetSpawn: this.getExitSpawnName(),
      label: '⬅ Back to Garage',
    });

    // ── First-entry hint (once per save, per rig) ─────────────────────
    this._maybeShowFirstEntryHint(state);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Background, title, readout, selector, start button — base owns these.
  // ─────────────────────────────────────────────────────────────────────

  _drawBackground() {
    const w = this._worldDim.w, h = this._worldDim.h;
    this.add.rectangle(w / 2, h / 2, w, h, COL_BG);
    const grid = this.add.graphics();
    grid.lineStyle(1, COL_GRID, 0.25);
    for (let x = 0; x <= w; x += 40) grid.lineBetween(x, 60, x, h - 40);
    for (let y = 60; y <= h - 40; y += 40) grid.lineBetween(0, y, w, y);
    this.add.rectangle(w / 2, h - 30, w, 50, COL_FLOOR).setDepth(0);
  }

  _drawTitle() {
    const w = this._worldDim.w;
    this.add.rectangle(w / 2, 24, w, 48, 0x14151a).setDepth(2);
    const emoji = this.getRigTitleEmoji() || '';
    const title = this.getRigTitle() || 'LAB RIG';
    this.add.text(w / 2, 22, `${emoji}  ${title}`, {
      fontSize: '14px', fontFamily: 'sans-serif', color: COL_TEXT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    const subtitle = this.getRigSubtitle();
    if (subtitle) {
      this.add.text(w / 2, 50, subtitle, {
        fontSize: '10px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      }).setOrigin(0.5).setDepth(3);
    }
  }

  _buildReadout() {
    this.add.rectangle(READOUT_X, READOUT_Y, READOUT_W, READOUT_H, COL_PANEL)
      .setStrokeStyle(2, COL_PANEL_EDGE).setDepth(2);
    this._readoutText = this.add.text(READOUT_X, READOUT_Y, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#10b981',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
    this._refreshReadout(0, null, null);
  }

  _refreshReadout(progress01, sample, summary) {
    if (!this._readoutText) return;
    const fields = this.getReadoutFields(progress01, sample, summary) || [];
    if (!fields.length) {
      this._readoutText.setText('— ready —');
      return;
    }
    const txt = fields.map(f => `${f.label}: ${f.value}`).join('    ');
    this._readoutText.setText(txt);
  }

  _buildSelector() {
    if (!this._samples.length) return;
    this.add.text(SELECTOR_X + SELECTOR_W / 2, SELECTOR_Y - 16, 'SAMPLES', {
      fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    this._slots = [];
    this._samples.forEach((s, idx) => {
      const sy = SELECTOR_Y + idx * (SELECTOR_H + SELECTOR_GAP);

      const bg = this.add.rectangle(
        SELECTOR_X + SELECTOR_W / 2, sy + SELECTOR_H / 2,
        SELECTOR_W, SELECTOR_H, COL_PANEL,
      ).setStrokeStyle(2, COL_PANEL_EDGE).setDepth(2)
        .setInteractive({ useHandCursor: true });

      const chip = this.add.rectangle(
        SELECTOR_X + 18, sy + SELECTOR_H / 2,
        22, 36, hexToInt(s.color),
      ).setStrokeStyle(1, 0x111114).setDepth(3);

      const nameTxt = this.add.text(SELECTOR_X + 38, sy + 12, s.name || s.id, {
        fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT,
        fontStyle: 'bold', wordWrap: { width: SELECTOR_W - 50 },
      }).setDepth(3);

      if (s.category || s.subtitle) {
        this.add.text(SELECTOR_X + 38, sy + 28, s.category || s.subtitle, {
          fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
        }).setDepth(3);
      }

      const check = this.add.text(
        SELECTOR_X + SELECTOR_W - 18, sy + SELECTOR_H / 2, '✓',
        { fontSize: '18px', fontFamily: 'sans-serif', color: '#22c55e', fontStyle: 'bold' },
      ).setOrigin(0.5).setDepth(4)
        .setVisible(this._testedIds.has(s.id));

      bg.on('pointerdown', () => this._selectSample(s.id));

      this._slots.push({ id: s.id, bg, chip, nameTxt, check });
    });

    this._refreshSlotHighlight();
  }

  _refreshSlotHighlight() {
    if (!this._slots) return;
    for (const slot of this._slots) {
      const isActive = slot.id === this._activeSampleId;
      slot.bg.setStrokeStyle(isActive ? 3 : 2, isActive ? 0xfbbf24 : COL_PANEL_EDGE);
      slot.check.setVisible(this._testedIds.has(slot.id));
    }
  }

  _selectSample(id) {
    if (this._testInProgress) return;
    if (!this._samples.find(s => s.id === id)) return;
    this._activeSampleId = id;

    // Clear specimen layer for the new draw.
    this._specimenLayer.removeAll(true);
    this._effectsLayer.removeAll(true);

    this.drawSpecimenForSample(id, this._ctx);
    this._refreshReadout(0, null, null);
    this._chartPoints = [];
    this._renderChart(null);
    this._refreshSlotHighlight();
  }

  _buildStartButton() {
    this._startBtnBg = this.add.rectangle(
      START_BTN_X, START_BTN_Y, START_BTN_W, START_BTN_H, 0x16a34a,
    ).setStrokeStyle(3, 0x065f46).setDepth(3)
      .setInteractive({ useHandCursor: true });
    this._startBtnLabel = this.add.text(
      START_BTN_X, START_BTN_Y, '▶ START TEST', {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#ffffff',
        fontStyle: 'bold',
      },
    ).setOrigin(0.5).setDepth(4);

    this._startBtnBg.on('pointerdown', () => this._runActiveTest());
    this._startBtnBg.on('pointerover', () => {
      if (!this._testInProgress) this._startBtnBg.setFillStyle(0x22c55e);
    });
    this._startBtnBg.on('pointerout', () => {
      if (!this._testInProgress) this._startBtnBg.setFillStyle(0x16a34a);
    });

    this.add.text(START_BTN_X, START_BTN_Y + 32, 'Run the test', {
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

  // ─────────────────────────────────────────────────────────────────────
  // Test lifecycle — base drives the tween + dispatches subclass hooks.
  // ─────────────────────────────────────────────────────────────────────

  _runActiveTest() {
    if (this._testInProgress) return;
    if (!this._activeSampleId) return;

    const result = this.runSampleTest(this._activeSampleId);
    if (!result || !Array.isArray(result.curve) || result.curve.length === 0) return;

    this._testInProgress = true;
    this._setStartButtonEnabled(false);
    this._chartPoints = [];

    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx?.('ui_click');

    const curve = result.curve;
    const duration = this.getTestDurationMs();

    this.tweens.addCounter({
      from: 0,
      to: curve.length - 1,
      duration,
      ease: 'Quad.easeIn',
      onUpdate: (tween) => {
        const idx = Math.min(curve.length - 1, Math.max(0, Math.floor(tween.getValue())));
        const sample = curve[idx];
        const progress01 = idx / Math.max(1, curve.length - 1);

        this.animateProgress(progress01, sample, result, this._ctx);
        this._refreshReadout(progress01, sample, result.summary);

        this._chartPoints.push(sample);
        if (this._chartPoints.length % 3 === 0 || idx === curve.length - 1) {
          this._renderChart(this._chartPoints, result);
        }
      },
      onComplete: () => {
        this._renderChart(curve, result);
        this.animateCompletion(result, this._ctx);
        this.time.delayedCall(800, () => {
          this._markTestComplete(this._activeSampleId, result);
          this._setStartButtonEnabled(true);
          this._testInProgress = false;
        });
      },
    });
  }

  _markTestComplete(sampleId, result) {
    this._testedIds.add(sampleId);
    const stateKey = this.getTestedStateKey();
    const state = this.registry.get('gameState') || {};
    const updated = { ...state, [stateKey]: Array.from(this._testedIds) };
    this.registry.set('gameState', updated);
    saveGame(updated);
    this._refreshSlotHighlight();

    const total = this._samples.length;
    if (this._testedIds.size >= total) {
      this._emitCompletionDialog(result);
    } else {
      const remaining = total - this._testedIds.size;
      const dlg = this.getProgressDialog(sampleId, result, remaining);
      if (dlg) {
        this.registry.set('dialogEvent', {
          speaker: dlg.speaker,
          text: dlg.text,
          choices: null,
          step: null,
        });
      }
    }
  }

  /**
   * On all-samples-tested: emit observation + the subclass's completion
   * dialog. If the active quest's id matches getQuestId(), we tag the
   * dialog with `step: state.activeQuest` so LocalSceneBase.advanceFromDialog
   * advances the quest. Otherwise we emit a casual non-questy dialog.
   */
  _emitCompletionDialog(_result) {
    const state = this.registry.get('gameState') || {};
    const aq = state.activeQuest;
    const questId = this.getQuestId();
    const observation = this.getCompletionObservation();

    // Persist the observation regardless of quest state — it's a fact
    // the player has produced, and the questSystem.advanceQuest function
    // will require it on the matching observe step.
    if (observation) {
      const observations = Array.isArray(state.observations) ? state.observations : [];
      if (!observations.includes(observation)) {
        const updated = { ...state, observations: [...observations, observation] };
        this.registry.set('gameState', updated);
        saveGame(updated);
      }
    }

    const dlg = this.getCompletionDialog();
    if (!dlg) return;

    const matchesQuest = !!questId && aq?.id === questId;
    const liveState = this.registry.get('gameState') || {};
    this.registry.set('dialogEvent', {
      speaker: dlg.speaker,
      text: dlg.text,
      choices: dlg.choices ?? null,
      step: matchesQuest ? liveState.activeQuest : null,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Chart — base owns the rendering. Subclass declares config or null.
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Chart-mode toggle — when a subclass declares `getAlternateChartMode()`
   * non-null, we render a small button at the chart header that flips
   * between 'default' (stress-strain) and 'alt' (e.g. density).
   * Default mode preserved exactly when no alt mode is declared.
   */
  setChartMode(mode) {
    this._chartMode = mode === 'alt' ? 'alt' : 'default';
    this._renderChart(this._chartPoints?.length ? this._chartPoints : null, this._lastResult || null);
  }

  _renderChart(progressCurve, result) {
    // Cache the most-recent result so toggle re-renders don't lose it.
    if (result) this._lastResult = result;
    if (this._chartMode == null) this._chartMode = 'default';

    const altMode = this.getAlternateChartMode();
    const altActive = !!altMode && this._chartMode === 'alt';

    if (altActive) {
      this._renderAlternateChart(altMode);
      return;
    }

    const cfg = this.getChartConfig(result || null);
    if (!cfg) {
      // Hide a chart that may have been drawn previously.
      if (this._chartG) { this._chartG.destroy(); this._chartG = null; }
      if (this._chartTitle) { this._chartTitle.destroy(); this._chartTitle = null; }
      if (this._chartAxisLabels) {
        this._chartAxisLabels.forEach(t => t.destroy());
        this._chartAxisLabels = null;
      }
      if (this._chartAnnotations) {
        this._chartAnnotations.forEach(t => t.destroy());
        this._chartAnnotations = null;
      }
      return;
    }
    // Clear prior annotation text nodes — graphics dots live on _chartG.
    if (this._chartAnnotations) {
      this._chartAnnotations.forEach(t => t.destroy());
    }
    this._chartAnnotations = [];
    // Clear any leftover alt-chart text labels from a prior alt render.
    if (this._altChartTexts) {
      this._altChartTexts.forEach(t => t?.destroy?.());
      this._altChartTexts = [];
    }

    if (!this._chartG) this._chartG = this.add.graphics().setDepth(2);
    const g = this._chartG;
    g.clear();

    g.fillStyle(COL_PANEL, 1);
    g.fillRect(CHART_X, CHART_Y, CHART_W, CHART_H);
    g.lineStyle(2, COL_PANEL_EDGE, 1);
    g.strokeRect(CHART_X, CHART_Y, CHART_W, CHART_H);

    // Chart-mode toggle button (only renders when subclass exposes one).
    this._ensureModeToggle();

    if (!this._chartTitle) {
      this._chartTitle = this.add.text(
        CHART_X + CHART_W / 2, CHART_Y - 14,
        cfg.title || `${cfg.yLabel || 'Y'} vs ${cfg.xLabel || 'X'}`, {
          fontSize: '12px', fontFamily: 'sans-serif', color: COL_TEXT,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5).setDepth(3);
    } else if (cfg.title) {
      this._chartTitle.setText(cfg.title);
    }

    const innerX = CHART_X + CHART_PAD;
    const innerY = CHART_Y + CHART_PAD - 4;
    const innerW = CHART_W - CHART_PAD - 12;
    const innerH = CHART_H - CHART_PAD - 28;

    const xMax = Math.max(1e-6, cfg.xMax || 1);
    const yMax = Math.max(1e-6, cfg.yMax || 1);

    // Axes
    g.lineStyle(2, 0xa4a8b3, 1);
    g.lineBetween(innerX, innerY + innerH, innerX + innerW, innerY + innerH);
    g.lineBetween(innerX, innerY, innerX, innerY + innerH);

    // Grid ticks
    g.lineStyle(1, COL_GRID, 0.6);
    for (let i = 1; i <= 4; i++) {
      const tx = innerX + (i / 4) * innerW;
      g.lineBetween(tx, innerY, tx, innerY + innerH);
      const ty = innerY + (i / 4) * innerH;
      g.lineBetween(innerX, ty, innerX + innerW, ty);
    }

    if (this._chartAxisLabels) this._chartAxisLabels.forEach(t => t.destroy());
    this._chartAxisLabels = [];

    const xUnit = cfg.xUnit ? ` (${cfg.xUnit})` : '';
    const yUnit = cfg.yUnit ? ` (${cfg.yUnit})` : '';
    const xLabel = this.add.text(
      CHART_X + CHART_W / 2, CHART_Y + CHART_H - 8,
      `${cfg.xLabel || 'X'}${xUnit}, max ${formatAxis(xMax)}`, {
        fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
      },
    ).setOrigin(0.5).setDepth(3);
    this._chartAxisLabels.push(xLabel);
    const yLabel = this.add.text(
      CHART_X + 6, CHART_Y + CHART_H / 2,
      `${cfg.yLabel || 'Y'}${yUnit}\nmax ${formatAxis(yMax)}`, {
        fontSize: '9px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
        align: 'center',
      },
    ).setOrigin(0.5).setDepth(3).setRotation(-Math.PI / 2);
    this._chartAxisLabels.push(yLabel);

    if (!progressCurve || progressCurve.length < 2) {
      const hint = this.add.text(CHART_X + CHART_W / 2, CHART_Y + CHART_H / 2,
        'Press START TEST to begin', {
          fontSize: '11px', fontFamily: 'sans-serif', color: COL_TEXT_DIM,
        }).setOrigin(0.5).setDepth(3);
      this._chartAxisLabels.push(hint);
      return;
    }

    const colors = {
      elastic: cfg.regionColors?.elastic ?? COL_ELASTIC_DEFAULT,
      plastic: cfg.regionColors?.plastic ?? COL_PLASTIC_DEFAULT,
      failure: cfg.regionColors?.failure ?? COL_FAILURE_DEFAULT,
    };

    const toScreen = (p) => {
      // Each curve sample uses {x, y}. Subclasses with named fields
      // (strain/stress, tempC/lengthMm) should also set x and y on the
      // sample; we treat the canonical (x,y) as authoritative.
      const px = (p.x != null) ? p.x : 0;
      const py = (p.y != null) ? p.y : 0;
      return {
        sx: innerX + (px / xMax) * innerW,
        sy: innerY + innerH - (py / yMax) * innerH,
      };
    };

    let prevColor = null;
    for (let i = 1; i < progressCurve.length; i++) {
      const a = progressCurve[i - 1];
      const b = progressCurve[i];
      const region = b.region || 'elastic';
      const color = colors[region] != null ? colors[region] : colors.elastic;
      if (color !== prevColor) {
        g.lineStyle(2.5, color, 1);
        prevColor = color;
      }
      const pa = toScreen(a);
      const pb = toScreen(b);
      g.lineBetween(pa.sx, pa.sy, pb.sx, pb.sy);
    }

    // Optional annotations (e.g. yield/ultimate markers).
    const annotations = this.getChartAnnotations(result || null);
    if (Array.isArray(annotations)) {
      for (const a of annotations) {
        if (a == null || a.xValue == null || a.yValue == null) continue;
        const sp = toScreen({ x: a.xValue, y: a.yValue });
        const r = a.dotRadius != null ? a.dotRadius : 4;
        g.fillStyle(a.color != null ? a.color : 0xfbbf24, 1);
        g.fillCircle(sp.sx, sp.sy, r);
        if (a.label) {
          const txt = this.add.text(sp.sx + 4, sp.sy - 14, a.label, {
            fontSize: '9px', fontFamily: 'sans-serif',
            color: typeof a.color === 'number'
              ? `#${a.color.toString(16).padStart(6, '0')}`
              : '#fbbf24',
            fontStyle: 'bold',
          }).setDepth(4);
          this._chartAnnotations.push(txt);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Chart-mode toggle helpers (additive — disabled unless the subclass
  // declares getAlternateChartMode()).
  // ─────────────────────────────────────────────────────────────────────

  _ensureModeToggle() {
    const altMode = this.getAlternateChartMode();
    if (!altMode) {
      // Subclass does not declare an alt mode — clean up any prior button.
      if (this._modeToggleBg) { this._modeToggleBg.destroy(); this._modeToggleBg = null; }
      if (this._modeToggleLbl) { this._modeToggleLbl.destroy(); this._modeToggleLbl = null; }
      return;
    }
    const tx = CHART_X + CHART_W - 50;
    const ty = CHART_Y - 14;
    if (!this._modeToggleBg) {
      this._modeToggleBg = this.add.rectangle(tx, ty, 92, 18, 0x2c2e34)
        .setStrokeStyle(1, 0x4a4d55).setDepth(4)
        .setInteractive({ useHandCursor: true });
      this._modeToggleLbl = this.add.text(tx, ty, '', {
        fontSize: '9px', fontFamily: 'sans-serif', color: '#e7e9ee',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(5);
      this._modeToggleBg.on('pointerdown', () => {
        if (!this._modeToggleAvailable) return;
        const next = this._chartMode === 'alt' ? 'default' : 'alt';
        this.setChartMode(next);
      });
    }
    const isAvailable = typeof altMode.isAvailable === 'function'
      ? !!altMode.isAvailable() : true;
    this._modeToggleAvailable = isAvailable;
    const labelText = this._chartMode === 'alt'
      ? '↺ Stress / Strain'
      : `↺ ${altMode.label || 'Alt'}`;
    this._modeToggleLbl.setText(labelText);
    this._modeToggleBg.setAlpha(isAvailable ? 1 : 0.5);
    this._modeToggleBg.setInteractive({ useHandCursor: isAvailable });
  }

  _renderAlternateChart(altMode) {
    // Clear prior chart drawings.
    if (this._chartAnnotations) {
      this._chartAnnotations.forEach(t => t.destroy());
      this._chartAnnotations = [];
    }
    if (this._chartAxisLabels) {
      this._chartAxisLabels.forEach(t => t.destroy());
      this._chartAxisLabels = [];
    }
    // Also clear any alt-mode texts from a prior render.
    if (this._altChartTexts) {
      this._altChartTexts.forEach(t => t?.destroy?.());
      this._altChartTexts = [];
    }
    if (!this._chartG) this._chartG = this.add.graphics().setDepth(2);
    const g = this._chartG;
    g.clear();

    // Title for alt mode (use altMode.label or default).
    if (!this._chartTitle) {
      this._chartTitle = this.add.text(
        CHART_X + CHART_W / 2, CHART_Y - 14,
        altMode.label || 'Alt Chart', {
          fontSize: '12px', fontFamily: 'sans-serif', color: COL_TEXT,
          fontStyle: 'bold',
        },
      ).setOrigin(0.5).setDepth(3);
    } else {
      this._chartTitle.setText(altMode.label || 'Alt Chart');
    }

    // Subclass paints the actual content. May return { texts: [...] }
    // which we track for cleanup on next render.
    const drawResult = this.drawAlternateChart(g, {
      x: CHART_X, y: CHART_Y, w: CHART_W, h: CHART_H,
    });
    if (drawResult && Array.isArray(drawResult.texts)) {
      this._altChartTexts = drawResult.texts;
    }

    // Toggle button stays visible in alt mode.
    this._ensureModeToggle();
  }

  // ─────────────────────────────────────────────────────────────────────
  // First-entry hint — once-per-rig-per-save, tracked under
  // state.labRigHints[sceneKey] so each rig fires its own hint.
  // ─────────────────────────────────────────────────────────────────────

  _maybeShowFirstEntryHint(state) {
    const hint = this.getFirstEntryHint();
    if (!hint) return;
    const sceneKey = this.getSceneKey();
    const seen = state.labRigHints && state.labRigHints[sceneKey];
    if (seen) return;

    this.time.delayedCall(600, () => {
      this.registry.set('dialogEvent', {
        speaker: hint.speaker,
        text: hint.text,
        choices: null,
        step: null,
      });
      const live = this.registry.get('gameState') || {};
      const labRigHints = { ...(live.labRigHints || {}), [sceneKey]: true };
      const updated = { ...live, labRigHints };
      this.registry.set('gameState', updated);
      saveGame(updated);
    });
  }
}

// Format an axis label number with up to 2 decimals, dropping trailing zeros.
function formatAxis(v) {
  if (!Number.isFinite(v)) return '0';
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  if (Math.abs(v) >= 10) return v.toFixed(1).replace(/\.0$/, '');
  return v.toFixed(2).replace(/\.?0+$/, '');
}
