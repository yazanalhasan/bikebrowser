import Phaser from 'phaser';
import { CircuitModel } from '../systems/CircuitModel.js';
import { CIRCUIT_SLOTS, optionsForSlot } from '../../data/chapter2/circuitComponents.js';
import { challengeById } from '../../data/chapter2/circuitChallenges.js';

// CircuitBenchScene — Chapter 2's player-facing Circuit Bench. A modal overlay
// (same pattern as Prediction/Bridge/Skate/ChapterMap) where the player wires a
// series circuit to power the e-bike motor. It runs the canonical reasoning loop:
//   Observe (the goal) → Predict (spin/stall/fry) → Test (Ohm's-law solve, parts
//   light up by current) → Build (on spin) → Verify/Payoff (e-bike powers) →
//   Reflect. All logic lives in CircuitModel; this scene is presentation + input.
//
// Opened with `circuit:start`, closed with Esc → `circuit:done`. Procedural art
// (production art is human-gated). State is exposed (open/selection/lastResult/
// solved) so the e2e harness can drive it headlessly.

const VERDICT_STYLE = {
  spin:    { color: '#9be79b', label: 'SPINS — the motor turns' },
  stall:   { color: '#ffd27a', label: 'STALLS — too little voltage' },
  fry:     { color: '#ff7a7a', label: 'FRIED — a part exceeded its rating' },
  tripped: { color: '#ffe07a', label: 'TRIPPED — the fuse protected the circuit' },
  open:    { color: '#c7cdd6', label: 'OPEN — incomplete circuit' },
};
const SLOT_LABEL = { battery: 'Battery', fuse: 'Fuse', controller: 'Controller', wire: 'Wire', motor: 'Motor' };

export default class CircuitBenchScene extends Phaser.Scene {
  constructor() { super('CircuitBenchScene'); }

  create() {
    this.open = false;
    this.solved = false;
    this.model = new CircuitModel();
    this.challenge = challengeById('ebike_first_power');
    this.prediction = null;
    this.lastResult = null;
    // Motor is the fixed load; the player chooses the other four. Start each
    // pickable slot empty so building is intentional (no auto-correct default).
    this.selection = { motor: this.challenge.motorId };

    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.scrim = this.add.rectangle(640, 360, 1280, 720, 0x0a0e13, 0.94).setScrollFactor(0).setInteractive();
    this.title = this.add.text(640, 26, 'CIRCUIT BENCH — Power the E-bike', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#ffe7a8', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.brief = this.add.text(640, 64, this.challenge.goal, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', align: 'center', wordWrap: { width: 1040 },
    }).setOrigin(0.5, 0);
    this.hint = this.add.text(1262, 16, 'Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9aa0a8' }).setOrigin(1, 0);
    this.root.add([this.scrim, this.title, this.brief, this.hint]);

    this.slotLayer = this.add.container(0, 0).setScrollFactor(0);
    this.controlLayer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.slotLayer, this.controlLayer]);

    this.registry.events.on('circuit:start', () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    this.registry.events.emit('circuit:opened');
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit('circuit:done', { solved: this.solved });
  }

  // --- headless-friendly API (used by the UI handlers and by e2e) ---------
  cycleSlot(slot) {
    const opts = optionsForSlot(slot);
    if (!opts.length) return;
    const curIdx = opts.findIndex((o) => o.id === this.selection[slot]);
    this.selection[slot] = opts[(curIdx + 1) % opts.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  setPrediction(p) {
    this.prediction = p;
    if (this.open) this.render();
  }

  test() {
    this.lastResult = this.model.solve(this.selection);
    if (this.lastResult.verdict === 'spin') {
      this.solved = true;
      this.registry.events.emit('circuit:solved', { challenge: this.challenge.id, predicted: this.prediction });
    }
    if (this.open) this.render();
    return this.lastResult;
  }

  // --- rendering ----------------------------------------------------------
  render() {
    this.slotLayer.removeAll(true);
    this.controlLayer.removeAll(true);
    const result = this.lastResult;
    const memberBySlot = {};
    if (result) result.members.forEach((m) => { memberBySlot[m.slot] = m; });

    // Component slots (left column).
    let y = 110;
    CIRCUIT_SLOTS.forEach((slot) => {
      const opts = optionsForSlot(slot);
      const sel = opts.find((o) => o.id === this.selection[slot]) || null;
      const fixed = slot === 'motor';
      const mem = memberBySlot[slot];
      const rowColor = mem ? mem.color : 0x2a313c;

      const box = this.add.rectangle(360, y + 22, 600, 44, rowColor, mem ? 0.32 : 1)
        .setStrokeStyle(1, 0xffffff, 0.18).setScrollFactor(0).setOrigin(0.5, 0.5);
      const label = this.add.text(80, y + 12, `${SLOT_LABEL[slot]}${fixed ? ' (load)' : ''}`, {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#e7d9b0', fontStyle: 'bold',
      }).setScrollFactor(0);
      const pick = this.add.text(250, y + 12, sel ? sel.name : '— pick —', {
        fontFamily: 'Arial', fontSize: '14px', color: sel ? '#ffffff' : '#9aa0a8',
      }).setScrollFactor(0);
      const spec = this.add.text(250, y + 30, sel ? this._specLine(slot, sel, mem) : 'click to choose', {
        fontFamily: 'Arial', fontSize: '11px', color: '#aeb6c2',
      }).setScrollFactor(0);
      this.slotLayer.add([box, label, pick, spec]);

      if (!fixed) {
        box.setInteractive({ useHandCursor: true })
          .on('pointerover', () => box.setStrokeStyle(2, 0xffe7a8, 0.8))
          .on('pointerout', () => box.setStrokeStyle(1, 0xffffff, 0.18))
          .on('pointerdown', () => this.cycleSlot(slot));
        const cyc = this.add.text(648, y + 14, '⟳', { fontFamily: 'Arial', fontSize: '18px', color: '#ffe7a8' }).setScrollFactor(0);
        this.slotLayer.add(cyc);
      }
      y += 54;
    });

    // Predict row.
    const predictY = 110;
    const pTitle = this.add.text(740, predictY, this.challenge.predictPrompt, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', wordWrap: { width: 470 },
    }).setScrollFactor(0);
    this.controlLayer.add(pTitle);
    this.challenge.predictOptions.forEach((opt, i) => {
      const on = this.prediction === opt;
      const b = this.add.rectangle(800 + i * 150, predictY + 64, 130, 34, on ? 0x3a5a3a : 0x2a313c, 1)
        .setStrokeStyle(1, on ? 0x9be79b : 0xffffff, on ? 0.9 : 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setPrediction(opt));
      const t = this.add.text(800 + i * 150, predictY + 64, opt.toUpperCase(), {
        fontFamily: 'Arial', fontSize: '13px', color: on ? '#9be79b' : '#cdd6e2', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      this.controlLayer.add([b, t]);
    });

    // Test button.
    const testBtn = this.add.rectangle(900, predictY + 130, 320, 44, 0x2f5d6b, 1)
      .setStrokeStyle(1, 0x8fd3e6, 0.7).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.test());
    const testTxt = this.add.text(900, predictY + 130, this.prediction ? '⚡ TEST THE CIRCUIT' : 'Predict first, then TEST', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaf6fb', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([testBtn, testTxt]);

    // Readout.
    if (result) {
      const vs = VERDICT_STYLE[result.verdict] || VERDICT_STYLE.open;
      const correct = this.prediction && this.prediction === result.verdict;
      const meter = this.add.text(740, predictY + 180,
        `V = ${result.volts}V   ·   R = ${result.totalResistance}Ω   ·   I = ${result.current}A   ·   motor sees ${result.motorVolts ?? 0}V`, {
        fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#dfe7f0',
      }).setScrollFactor(0);
      const verdict = this.add.text(740, predictY + 206, vs.label, {
        fontFamily: 'Georgia, serif', fontSize: '17px', color: vs.color, fontStyle: 'bold',
      }).setScrollFactor(0);
      const reason = this.add.text(740, predictY + 232, result.reason, {
        fontFamily: 'Arial', fontSize: '12px', color: '#c7cdd6', wordWrap: { width: 480 },
      }).setScrollFactor(0);
      const predNote = this.prediction ? this.add.text(740, predictY + 300,
        correct ? `✓ You predicted ${this.prediction.toUpperCase()} — right.` : `You predicted ${this.prediction.toUpperCase()}; it ${result.verdict.toUpperCase()}. Read why, adjust, retry.`, {
        fontFamily: 'Arial', fontSize: '12px', color: correct ? '#9be79b' : '#ffd27a', fontStyle: 'italic',
      }).setScrollFactor(0) : null;
      this.controlLayer.add([meter, verdict, reason]);
      if (predNote) this.controlLayer.add(predNote);

      if (result.verdict === 'spin') {
        const buildBtn = this.add.rectangle(900, predictY + 340, 320, 46, 0x2f7d3a, 1)
          .setStrokeStyle(2, 0x9be79b, 0.9).setScrollFactor(0)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => this._build());
        const buildTxt = this.add.text(900, predictY + 340, '🚲  BUILD THE E-BIKE', {
          fontFamily: 'Georgia, serif', fontSize: '16px', color: '#eaffea', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.controlLayer.add([buildBtn, buildTxt]);
      }
    }
  }

  _specLine(slot, part, mem) {
    const base = {
      battery: `${part.volts}V · ${part.maxCurrentA}A max`,
      fuse: part.maxCurrentA === Infinity ? 'no protection' : `blows at ${part.maxCurrentA}A`,
      controller: `${part.maxCurrentA}A max · ${part.resistanceOhm}Ω`,
      wire: `${part.maxCurrentA}A max · ${part.resistanceOhm}Ω`,
      motor: `${part.ratedWatts}W · needs ${part.minVolts}V · ${part.maxCurrentA}A max`,
    }[slot] || '';
    if (mem && mem.failed) return `${base}   ⚠ ${mem.current}A > ${mem.capacity}A`;
    if (mem) return `${base}   (${mem.current}A flowing)`;
    return base;
  }

  _build() {
    if (!this.solved) return;
    this.registry.events.emit('circuit:built', { challenge: this.challenge.id });
    this.hide();
  }
}
