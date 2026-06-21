import Phaser from 'phaser';

// KnobBenchScene — a reusable modal "predict → configure → test → build" bench.
// Chapters 3–7 all share the same shape (a handful of knobs, a prediction, a
// solver verdict, and a build button on success), so they're expressed as a
// config over this base instead of copy-pasted scenes. The Circuit/Extraction
// benches predate it; the engineering rigs from Boat onward use it.
//
// config = {
//   startEvent, openedEvent, doneEvent, builtEvent, solvedEvent,
//   title, theme:{ accent:'#rrggbb', accentHex:0x, scrim:0x, slotBox:0x, predictOn:0x },
//   model,                         // has solve(selection) -> { verdict, reason, ... }
//   slots, catalog, optionById,    // data-driven knobs
//   slotLabels, challenge,         // {goal, predictPrompt, predictOptions}
//   verdictStyle,                  // { verdict: {color,label} }
//   successVerdict,                // verdict string that enables BUILD
//   buildLabel, meter,             // meter(result)->string for the readout
// }

export default class KnobBenchScene extends Phaser.Scene {
  constructor(sceneKey, config) {
    super(sceneKey);
    this.cfg = config;
  }

  create() {
    const c = this.cfg;
    this.open = false;
    this.solved = false;
    this.prediction = null;
    this.lastResult = null;
    this.selection = { ...(c.fixedSelection || {}) };

    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.scrim = this.add.rectangle(640, 360, 1280, 720, c.theme.scrim, 0.94).setScrollFactor(0).setInteractive();
    this.title = this.add.text(640, 26, c.title, {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: c.theme.accent, fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.brief = this.add.text(640, 64, c.challenge.goal, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', align: 'center', wordWrap: { width: 1040 },
    }).setOrigin(0.5, 0);
    this.hintTxt = this.add.text(1262, 16, 'Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9aa0a8' }).setOrigin(1, 0);
    this.root.add([this.scrim, this.title, this.brief, this.hintTxt]);
    this.slotLayer = this.add.container(0, 0).setScrollFactor(0);
    this.controlLayer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add([this.slotLayer, this.controlLayer]);

    this.registry.events.on(c.startEvent, () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    if (this.cfg.openedEvent) this.registry.events.emit(this.cfg.openedEvent);
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit(this.cfg.doneEvent, { solved: this.solved });
  }

  cycleSlot(slot) {
    const opts = this.cfg.catalog[slot];
    const idx = opts.findIndex((o) => o.id === this.selection[slot]);
    this.selection[slot] = opts[(idx + 1) % opts.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  setPrediction(p) { this.prediction = p; if (this.open) this.render(); }

  test() {
    this.lastResult = this.cfg.model.solve(this.selection);
    if (this.lastResult.verdict === this.cfg.successVerdict) {
      this.solved = true;
      if (this.cfg.solvedEvent) this.registry.events.emit(this.cfg.solvedEvent, { predicted: this.prediction, result: this.lastResult });
    }
    if (this.open) this.render();
    return this.lastResult;
  }

  render() {
    const c = this.cfg;
    this.slotLayer.removeAll(true);
    this.controlLayer.removeAll(true);

    let y = 112;
    c.slots.forEach((slot) => {
      const opt = this.selection[slot] ? c.optionById(slot, this.selection[slot]) : null;
      const box = this.add.rectangle(360, y + 22, 600, 48, c.theme.slotBox, 1)
        .setStrokeStyle(1, 0xffffff, 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => box.setStrokeStyle(2, c.theme.accentHex, 0.8))
        .on('pointerout', () => box.setStrokeStyle(1, 0xffffff, 0.18))
        .on('pointerdown', () => this.cycleSlot(slot));
      const label = this.add.text(80, y + 14, c.slotLabels[slot], {
        fontFamily: 'Georgia, serif', fontSize: '14px', color: c.theme.accent, fontStyle: 'bold',
      }).setScrollFactor(0);
      const pick = this.add.text(250, y + 8, opt ? opt.name : '— set —', {
        fontFamily: 'Arial', fontSize: '14px', color: opt ? '#ffffff' : '#9aa0a8',
      }).setScrollFactor(0);
      const note = this.add.text(250, y + 28, opt ? opt.note : 'click to choose', {
        fontFamily: 'Arial', fontSize: '11px', color: '#aeb9c2', wordWrap: { width: 360 },
      }).setScrollFactor(0);
      const cyc = this.add.text(648, y + 16, '⟳', { fontFamily: 'Arial', fontSize: '18px', color: c.theme.accent }).setScrollFactor(0);
      this.slotLayer.add([box, label, pick, note, cyc]);
      y += 58;
    });

    const px = 740;
    const pTitle = this.add.text(px, 112, c.challenge.predictPrompt, {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', wordWrap: { width: 470 },
    }).setScrollFactor(0);
    this.controlLayer.add(pTitle);
    c.challenge.predictOptions.forEach((opt, i) => {
      const on = this.prediction === opt;
      const b = this.add.rectangle(px + 60 + (i % 2) * 240, 172 + Math.floor(i / 2) * 44, 220, 36, on ? c.theme.predictOn : c.theme.slotBox, 1)
        .setStrokeStyle(1, on ? c.theme.accentHex : 0xffffff, on ? 0.9 : 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setPrediction(opt));
      const t = this.add.text(px + 60 + (i % 2) * 240, 172 + Math.floor(i / 2) * 44, String(opt).replace(/_/g, '-').toUpperCase(), {
        fontFamily: 'Arial', fontSize: '12px', color: on ? c.theme.accent : '#cdd6e2', fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      this.controlLayer.add([b, t]);
    });

    const rows = Math.ceil(c.challenge.predictOptions.length / 2);
    const testY = 172 + rows * 44 + 26;
    const testBtn = this.add.rectangle(px + 170, testY, 340, 46, c.theme.predictOn, 1)
      .setStrokeStyle(1, c.theme.accentHex, 0.7).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.test());
    const testTxt = this.add.text(px + 170, testY, this.prediction ? c.testLabel : 'Predict first, then test', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaf6fb', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.controlLayer.add([testBtn, testTxt]);

    const r = this.lastResult;
    if (r) {
      const vs = c.verdictStyle[r.verdict] || { color: '#c7cdd6', label: String(r.verdict).toUpperCase() };
      const meter = this.add.text(px, testY + 50, c.meter(r), {
        fontFamily: 'Consolas, monospace', fontSize: '13px', color: c.theme.accent,
      }).setScrollFactor(0);
      const verdict = this.add.text(px, testY + 76, vs.label, {
        fontFamily: 'Georgia, serif', fontSize: '18px', color: vs.color, fontStyle: 'bold',
      }).setScrollFactor(0);
      const reason = this.add.text(px, testY + 104, r.reason, {
        fontFamily: 'Arial', fontSize: '12px', color: '#cdd6e2', wordWrap: { width: 470 },
      }).setScrollFactor(0);
      this.controlLayer.add([meter, verdict, reason]);

      if (r.verdict === c.successVerdict) {
        const buildBtn = this.add.rectangle(px + 170, testY + 190, 340, 46, 0x2f7d3a, 1)
          .setStrokeStyle(2, 0x9be79b, 0.9).setScrollFactor(0)
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => this._build());
        const buildTxt = this.add.text(px + 170, testY + 190, c.buildLabel, {
          fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaffea', fontStyle: 'bold',
        }).setOrigin(0.5).setScrollFactor(0);
        this.controlLayer.add([buildBtn, buildTxt]);
      }
    }
  }

  _build() {
    if (!this.solved) return;
    this.registry.events.emit(this.cfg.builtEvent, { challenge: this.cfg.challenge.id });
    this.hide();
  }
}
