import Phaser from 'phaser';
import { CrashModel } from '../systems/CrashModel.js';
import { CRASH_SLOTS, CRASH_CATALOG, CRASH_CHALLENGE, crashOptionById } from '../../data/chapter4/crashLoad.js';

// CrashTestScene — Chapter 4's player-facing Crash & Load Test (Car). Modal
// overlay (Engine Dyno pattern). The player configures four systems, predicts the
// outcome, then fires the crash sled: occupant g + cabin integrity + stability.
// Logic in CrashModel. Opened with `crash:start`, closed with Esc → `crash:done`.

const VERDICT_STYLE = {
  safe:      { color: '#9be79b', label: 'SAFE — survivable' },
  collapse:  { color: '#ff7a7a', label: 'CABIN COLLAPSE' },
  high_g:    { color: '#ffae6a', label: 'HIGH-G — occupant injury' },
  unstable:  { color: '#ffd27a', label: 'UNSTABLE — poor balance' },
  incomplete: { color: '#c7cdd6', label: 'CONFIGURE THE CAR' },
};
const SLOT_LABEL = { front: 'Front structure', cage: 'Cabin cage', restraint: 'Restraint', load: 'Load balance' };

export default class CrashTestScene extends Phaser.Scene {
  constructor() { super('CrashTestScene'); }

  create() {
    this.open = false;
    this.solved = false;
    this.model = new CrashModel();
    this.challenge = CRASH_CHALLENGE;
    this.prediction = null;
    this.lastResult = null;
    this.selection = {};

    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.scrim = this.add.rectangle(640, 360, 1280, 720, 0x0a0f14, 0.94).setScrollFactor(0).setInteractive();
    this.title = this.add.text(640, 26, 'CRASH & LOAD TEST — Build the Car', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#8fd3e6', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.brief = this.add.text(640, 64, this.challenge.goal, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', align: 'center', wordWrap: { width: 1040 },
    }).setOrigin(0.5, 0);
    this.hint = this.add.text(1262, 16, 'Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9aa0a8' }).setOrigin(1, 0);
    this.root.add([this.scrim, this.title, this.brief, this.hint]);
    this.slotLayer = this.add.container(0, 0).setScrollFactor(0);
    this.controlLayer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.slotLayer, this.controlLayer]);

    this.registry.events.on('crash:start', () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    this.registry.events.emit('crash:opened');
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit('crash:done', { solved: this.solved });
  }

  cycleSlot(slot) {
    const opts = CRASH_CATALOG[slot];
    const idx = opts.findIndex((o) => o.id === this.selection[slot]);
    this.selection[slot] = opts[(idx + 1) % opts.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  setPrediction(p) { this.prediction = p; if (this.open) this.render(); }

  test() {
    this.lastResult = this.model.solve(this.selection);
    if (this.lastResult.verdict === 'safe') {
      this.solved = true;
      this.registry.events.emit('crash:passed', { occupantG: this.lastResult.occupantG, predicted: this.prediction });
    }
    if (this.open) this.render();
    return this.lastResult;
  }

  render() {
    this.slotLayer.removeAll(true);
    this.controlLayer.removeAll(true);

    let y = 112;
    CRASH_SLOTS.forEach((slot) => {
      const opt = this.selection[slot] ? crashOptionById(slot, this.selection[slot]) : null;
      const box = this.add.rectangle(360, y + 22, 600, 48, 0x182530, 1)
        .setStrokeStyle(1, 0xffffff, 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => box.setStrokeStyle(2, 0x8fd3e6, 0.8))
        .on('pointerout', () => box.setStrokeStyle(1, 0xffffff, 0.18))
        .on('pointerdown', () => this.cycleSlot(slot));
      const label = this.add.text(80, y + 14, SLOT_LABEL[slot], {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: '#a0d2e7', fontStyle: 'bold',
      }).setScrollFactor(0);
      const pick = this.add.text(250, y + 8, opt ? opt.name : '— set —', {
        fontFamily: 'Arial', fontSize: '14px', color: opt ? '#ffffff' : '#9aa0a8',
      }).setScrollFactor(0);
      const note = this.add.text(250, y + 28, opt ? opt.note : 'click to choose', {
        fontFamily: 'Arial', fontSize: '11px', color: '#aeb9c2', wordWrap: { width: 360 },
      }).setScrollFactor(0);
      const cyc = this.add.text(648, y + 16, '⟳', { fontFamily: 'Arial', fontSize: '18px', color: '#8fd3e6' }).setScrollFactor(0);
      this.slotLayer.add([box, label, pick, note, cyc]);
      y += 58;
    });

    // Cross-link to Chapter 4's biology pillar — the Microscope (cellular
    // biology). The Crash Test is the Ch4 hub (mirrors Ch2/Ch3 pillar links).
    const bioBtn = this.add.rectangle(1128, 64, 220, 30, 0x153028, 1)
      .setStrokeStyle(1, 0xa8d8c0, 0.5).setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.hide(); this.registry.events.emit('cell:start'); });
    const bioTxt = this.add.text(1128, 64, '🔬 Microscope →', {
      fontFamily: 'Arial', fontSize: '12px', color: '#a8d8c0', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([bioBtn, bioTxt]);

    const px = 740;
    const pTitle = this.add.text(px, 112, this.challenge.predictPrompt, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', wordWrap: { width: 470 },
    }).setScrollFactor(0);
    this.controlLayer.add(pTitle);
    this.challenge.predictOptions.forEach((opt, i) => {
      const on = this.prediction === opt;
      const b = this.add.rectangle(px + 60 + (i % 2) * 240, 172 + Math.floor(i / 2) * 44, 220, 36, on ? 0x1f4a5a : 0x182530, 1)
        .setStrokeStyle(1, on ? 0x8fd3e6 : 0xffffff, on ? 0.9 : 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setPrediction(opt));
      const t = this.add.text(px + 60 + (i % 2) * 240, 172 + Math.floor(i / 2) * 44, opt.replace('_', '-').toUpperCase(), {
        fontFamily: 'Arial', fontSize: '12px', color: on ? '#b0e6f5' : '#cdd6e2', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      this.controlLayer.add([b, t]);
    });

    const sledBtn = this.add.rectangle(px + 170, 284, 340, 46, 0x1f6b7a, 1)
      .setStrokeStyle(1, 0x8fd3e6, 0.7).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.test());
    const sledTxt = this.add.text(px + 170, 284, this.prediction ? '💥 FIRE THE CRASH SLED' : 'Predict first, then CRASH', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaf6fb', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([sledBtn, sledTxt]);

    const r = this.lastResult;
    if (r) {
      const vs = VERDICT_STYLE[r.verdict] || VERDICT_STYLE.incomplete;
      const meter = this.add.text(px, 334,
        `Occupant peak ${r.occupantG ?? '–'}g  ·  cabin ${r.cabinHolds ? 'intact' : 'breached'}  ·  ${r.stable ? 'stable' : 'unstable'}`, {
        fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#b0e6f5',
      }).setScrollFactor(0);
      const verdict = this.add.text(px, 360, vs.label, {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: vs.color, fontStyle: 'bold',
      }).setScrollFactor(0);
      const reason = this.add.text(px, 388, r.reason, {
        fontFamily: 'Arial', fontSize: '12px', color: '#cdd6e2', wordWrap: { width: 470 },
      }).setScrollFactor(0);
      this.controlLayer.add([meter, verdict, reason]);

      if (r.verdict === 'safe') {
        const buildBtn = this.add.rectangle(px + 170, 474, 340, 46, 0x2f7d3a, 1)
          .setStrokeStyle(2, 0x9be79b, 0.9).setScrollFactor(0)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => this._build());
        const buildTxt = this.add.text(px + 170, 474, '🚗  BUILD THE CAR', {
          fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaffea', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.controlLayer.add([buildBtn, buildTxt]);
      }
    }
  }

  _build() {
    if (!this.solved) return;
    this.registry.events.emit('crash:built', { challenge: this.challenge.id });
    this.hide();
  }
}
