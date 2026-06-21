import Phaser from 'phaser';
import { EngineModel } from '../systems/EngineModel.js';
import { ENGINE_SLOTS, ENGINE_CATALOG, ENGINE_CHALLENGE, engineOptionById } from '../../data/chapter3/engineTune.js';

// EngineDynoScene — Chapter 3's player-facing Engine Dyno (combustion powertrain).
// Modal overlay (Circuit Bench pattern). The player tunes five knobs, predicts the
// outcome, then does a dyno pull: power vs heat vs knock. All logic is in
// EngineModel; this is presentation + input. Opened with `engine:start`, closed
// with Esc → `engine:done`. State exposed for the e2e harness.

const VERDICT_STYLE = {
  runs:     { color: '#9be79b', label: 'RUNS CLEAN' },
  knock:    { color: '#ff7a7a', label: 'KNOCK — detonation' },
  overheat: { color: '#ffae6a', label: 'OVERHEAT' },
  foul:     { color: '#ffd27a', label: 'FOULS — rich & weak' },
  incomplete: { color: '#c7cdd6', label: 'SET EVERY KNOB' },
};
const SLOT_LABEL = { afr: 'Air–Fuel', timing: 'Ignition', compression: 'Compression', cooling: 'Cooling', fuel: 'Fuel' };

export default class EngineDynoScene extends Phaser.Scene {
  constructor() { super('EngineDynoScene'); }

  create() {
    this.open = false;
    this.solved = false;
    this.model = new EngineModel();
    this.challenge = ENGINE_CHALLENGE;
    this.prediction = null;
    this.lastResult = null;
    this.selection = {}; // every knob starts empty — tuning is intentional

    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.scrim = this.add.rectangle(640, 360, 1280, 720, 0x140d0a, 0.94).setScrollFactor(0).setInteractive();
    this.title = this.add.text(640, 26, 'ENGINE DYNO — Tune the Motorcycle', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#ffb27a', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.brief = this.add.text(640, 64, this.challenge.goal, {
      fontFamily: 'Arial', fontSize: '13px', color: '#e2d2cd', align: 'center', wordWrap: { width: 1040 },
    }).setOrigin(0.5, 0);
    this.hint = this.add.text(1262, 16, 'Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9aa0a8' }).setOrigin(1, 0);
    this.root.add([this.scrim, this.title, this.brief, this.hint]);
    this.slotLayer = this.add.container(0, 0).setScrollFactor(0);
    this.controlLayer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.slotLayer, this.controlLayer]);

    this.registry.events.on('engine:start', () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    this.registry.events.emit('engine:opened');
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit('engine:done', { solved: this.solved });
  }

  // --- headless API ------------------------------------------------------
  cycleSlot(slot) {
    const opts = ENGINE_CATALOG[slot];
    const idx = opts.findIndex((o) => o.id === this.selection[slot]);
    this.selection[slot] = opts[(idx + 1) % opts.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  setPrediction(p) { this.prediction = p; if (this.open) this.render(); }

  test() {
    this.lastResult = this.model.solve(this.selection);
    if (this.lastResult.verdict === 'runs') {
      this.solved = true;
      this.registry.events.emit('engine:tuned', { power: this.lastResult.power, predicted: this.prediction });
    }
    if (this.open) this.render();
    return this.lastResult;
  }

  // --- rendering ---------------------------------------------------------
  render() {
    this.slotLayer.removeAll(true);
    this.controlLayer.removeAll(true);

    let y = 110;
    ENGINE_SLOTS.forEach((slot) => {
      const opt = this.selection[slot] ? engineOptionById(slot, this.selection[slot]) : null;
      const box = this.add.rectangle(360, y + 22, 600, 46, 0x2c1f1a, 1)
        .setStrokeStyle(1, 0xffffff, 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => box.setStrokeStyle(2, 0xffb27a, 0.8))
        .on('pointerout', () => box.setStrokeStyle(1, 0xffffff, 0.18))
        .on('pointerdown', () => this.cycleSlot(slot));
      const label = this.add.text(80, y + 14, SLOT_LABEL[slot], {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#e7c2a0', fontStyle: 'bold',
      }).setScrollFactor(0);
      const pick = this.add.text(250, y + 8, opt ? opt.name : '— set —', {
        fontFamily: 'Arial', fontSize: '14px', color: opt ? '#ffffff' : '#9aa0a8',
      }).setScrollFactor(0);
      const note = this.add.text(250, y + 28, opt ? opt.note : 'click to choose', {
        fontFamily: 'Arial', fontSize: '11px', color: '#c7b6ae', wordWrap: { width: 360 },
      }).setScrollFactor(0);
      const cyc = this.add.text(648, y + 14, '⟳', { fontFamily: 'Arial', fontSize: '18px', color: '#ffb27a' }).setScrollFactor(0);
      this.slotLayer.add([box, label, pick, note, cyc]);
      y += 56;
    });

    // Predict + dyno pull (right column).
    // Cross-link to Chapter 3's biology pillar — the Phytochemistry Lab. The
    // Engine Dyno is the Ch3 hub, so both rigs are reachable from one ladder entry
    // (mirrors Ch2's Circuit Bench → Extraction Bench).
    const bioBtn = this.add.rectangle(1130, 64, 230, 30, 0x18301d, 1)
      .setStrokeStyle(1, 0xbfe3c3, 0.5).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.hide(); this.registry.events.emit('phyto:start'); });
    const bioTxt = this.add.text(1130, 64, '⚗ Phytochemistry Lab →', {
      fontFamily: 'Arial', fontSize: '12px', color: '#bfe3c3', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([bioBtn, bioTxt]);

    const px = 740;
    const pTitle = this.add.text(px, 110, this.challenge.predictPrompt, {
      fontFamily: 'Arial', fontSize: '13px', color: '#e2d2cd', wordWrap: { width: 470 },
    }).setScrollFactor(0);
    this.controlLayer.add(pTitle);
    this.challenge.predictOptions.forEach((opt, i) => {
      const on = this.prediction === opt;
      const b = this.add.rectangle(px + 60 + (i % 2) * 240, 168 + Math.floor(i / 2) * 44, 220, 36, on ? 0x4a3320 : 0x2c1f1a, 1)
        .setStrokeStyle(1, on ? 0xffb27a : 0xffffff, on ? 0.9 : 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setPrediction(opt));
      const t = this.add.text(px + 60 + (i % 2) * 240, 168 + Math.floor(i / 2) * 44, opt.toUpperCase(), {
        fontFamily: 'Arial', fontSize: '12px', color: on ? '#ffd6b0' : '#cdd6e2', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      this.controlLayer.add([b, t]);
    });

    const dynoBtn = this.add.rectangle(px + 170, 280, 340, 46, 0x7a3a1f, 1)
      .setStrokeStyle(1, 0xffb27a, 0.7).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.test());
    const dynoTxt = this.add.text(px + 170, 280, this.prediction ? '🔥 DYNO PULL' : 'Predict first, then PULL', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffe7d6', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([dynoBtn, dynoTxt]);

    const r = this.lastResult;
    if (r) {
      const vs = VERDICT_STYLE[r.verdict] || VERDICT_STYLE.incomplete;
      const meter = this.add.text(px, 330,
        `Power ${r.power}  ·  Temp ${r.temp ?? '–'}°C  ·  Knock ${r.knockIndex ?? '–'}`, {
        fontFamily: 'Consolas, monospace', fontSize: '14px', color: '#ffd6b0',
      }).setScrollFactor(0);
      const verdict = this.add.text(px, 356, vs.label, {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: vs.color, fontStyle: 'bold',
      }).setScrollFactor(0);
      const reason = this.add.text(px, 384, r.reason, {
        fontFamily: 'Arial', fontSize: '12px', color: '#d6cdc7', wordWrap: { width: 470 },
      }).setScrollFactor(0);
      this.controlLayer.add([meter, verdict, reason]);

      if (r.verdict === 'runs') {
        const buildBtn = this.add.rectangle(px + 170, 470, 340, 46, 0x2f7d3a, 1)
          .setStrokeStyle(2, 0x9be79b, 0.9).setScrollFactor(0)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => this._build());
        const buildTxt = this.add.text(px + 170, 470, '🏍  BUILD THE MOTORCYCLE', {
          fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaffea', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.controlLayer.add([buildBtn, buildTxt]);
      }
    }
  }

  _build() {
    if (!this.solved) return;
    this.registry.events.emit('engine:built', { challenge: this.challenge.id });
    this.hide();
  }
}
