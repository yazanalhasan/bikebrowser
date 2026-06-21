import Phaser from 'phaser';
import { ExtractionModel } from '../systems/ExtractionModel.js';
import { ETHNOBOTANY_SPECIES, METHODS, speciesById } from '../../data/chapter2/ethnobotanySpecies.js';

// ExtractionBenchScene — Chapter 2's biology pillar (the first instrument of the
// Biology Workbench). Modal overlay (same pattern as the Circuit Bench). The
// player picks a desert plant, a part, and a processing method, predicts whether
// it will YIELD, then processes it — discovering that the *method changes the
// outcome*. Opened with `extraction:start`, closed with Esc → `extraction:done`.
//
// Procedural art (production art human-gated). State exposed for the e2e harness.

const OUTCOME_STYLE = {
  yield: { color: '#9be79b', label: 'YIELD' },
  wrong: { color: '#ff9a9a', label: 'WRONG METHOD' },
  inert: { color: '#c7cdd6', label: 'NOTHING HAPPENS' },
  invalid: { color: '#9aa0a8', label: 'PICK A PLANT, PART & METHOD' },
};

export default class ExtractionBenchScene extends Phaser.Scene {
  constructor() { super('ExtractionBenchScene'); }

  create() {
    this.open = false;
    this.model = new ExtractionModel();
    this.speciesId = ETHNOBOTANY_SPECIES[0].id;
    this.partId = ETHNOBOTANY_SPECIES[0].parts[0].id;
    this.methodId = METHODS[0].id;
    this.lastResult = null;
    this.discovered = new Set(); // products the player has produced

    this.root = this.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    this.scrim = this.add.rectangle(640, 360, 1280, 720, 0x0c120c, 0.94).setScrollFactor(0).setInteractive();
    this.title = this.add.text(640, 26, 'EXTRACTION BENCH — Ethnobotany', {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: '#bfe3c3', fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.brief = this.add.text(640, 64,
      'How do people turn a desert plant into food, fibre, dye, medicine or fuel? Pick a part and a method — the method changes what you get.', {
      fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', align: 'center', wordWrap: { width: 1040 },
    }).setOrigin(0.5, 0);
    this.hint = this.add.text(1262, 16, 'Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9aa0a8' }).setOrigin(1, 0);
    this.root.add([this.scrim, this.title, this.brief, this.hint]);

    this.layer = this.add.container(0, 0).setScrollFactor(0);
    this.root.add(this.layer);

    this.registry.events.on('extraction:start', () => this.show());
    this.input.keyboard.on('keydown-ESC', () => { if (this.open) this.hide(); });
  }

  show() {
    if (this.open) return;
    this.open = true;
    this.scene.bringToTop();
    this.render();
    this.root.setVisible(true);
    this.registry.events.emit('extraction:opened');
  }

  hide() {
    if (!this.open) return;
    this.open = false;
    this.root.setVisible(false);
    this.registry.events.emit('extraction:done', { discovered: [...this.discovered] });
  }

  // --- headless API ------------------------------------------------------
  cycleSpecies() {
    const idx = ETHNOBOTANY_SPECIES.findIndex((s) => s.id === this.speciesId);
    const next = ETHNOBOTANY_SPECIES[(idx + 1) % ETHNOBOTANY_SPECIES.length];
    this.speciesId = next.id;
    this.partId = next.parts[0].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  cyclePart() {
    const sp = speciesById(this.speciesId);
    const idx = sp.parts.findIndex((p) => p.id === this.partId);
    this.partId = sp.parts[(idx + 1) % sp.parts.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  cycleMethod() {
    const idx = METHODS.findIndex((m) => m.id === this.methodId);
    this.methodId = METHODS[(idx + 1) % METHODS.length].id;
    this.lastResult = null;
    if (this.open) this.render();
  }

  process() {
    this.lastResult = this.model.process(this.speciesId, this.partId, this.methodId);
    if (this.lastResult.outcome === 'yield') {
      this.discovered.add(this.lastResult.product);
      this.registry.events.emit('extraction:yield', {
        species: this.speciesId, product: this.lastResult.product, category: this.lastResult.category,
      });
    }
    if (this.open) this.render();
    return this.lastResult;
  }

  // --- rendering ---------------------------------------------------------
  render() {
    this.layer.removeAll(true);
    const sp = speciesById(this.speciesId);
    const part = sp.parts.find((p) => p.id === this.partId);
    const method = METHODS.find((m) => m.id === this.methodId);

    const selector = (x, label, value, sub, cb) => {
      const box = this.add.rectangle(x + 150, 150, 300, 56, 0x223024, 1)
        .setStrokeStyle(1, 0xffffff, 0.18).setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => box.setStrokeStyle(2, 0xbfe3c3, 0.8))
        .on('pointerout', () => box.setStrokeStyle(1, 0xffffff, 0.18))
        .on('pointerdown', cb);
      const l = this.add.text(x + 14, 128, label, { fontFamily: 'Arial', fontSize: '11px', color: '#9fcfa6' }).setScrollFactor(0);
      const v = this.add.text(x + 14, 144, value, { fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setScrollFactor(0);
      const s = this.add.text(x + 14, 168, sub, { fontFamily: 'Arial', fontSize: '11px', color: '#aeb6c2', wordWrap: { width: 280 } }).setScrollFactor(0);
      const cyc = this.add.text(x + 286, 130, '⟳', { fontFamily: 'Arial', fontSize: '18px', color: '#bfe3c3' }).setOrigin(1, 0).setScrollFactor(0);
      this.layer.add([box, l, v, s, cyc]);
    };

    selector(60, 'PLANT', sp.name, sp.region, () => this.cycleSpecies());
    selector(390, 'PART', part.name, `of the ${sp.name}`, () => this.cyclePart());
    selector(720, 'METHOD', method.name, method.hint, () => this.cycleMethod());

    // Process button.
    const btn = this.add.rectangle(640, 250, 360, 46, 0x2f6b3a, 1)
      .setStrokeStyle(1, 0xbfe3c3, 0.7).setScrollFactor(0)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.process());
    const btnTxt = this.add.text(640, 250, `🌿  ${method.name.toUpperCase()} THE ${part.name.toUpperCase()}`, {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#eaffea', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0);
    this.layer.add([btn, btnTxt]);

    // Result.
    if (this.lastResult) {
      const st = OUTCOME_STYLE[this.lastResult.outcome] || OUTCOME_STYLE.invalid;
      const v = this.add.text(640, 312, st.label + (this.lastResult.product ? ` → ${this.lastResult.product}` : ''), {
        fontFamily: 'Georgia, serif', fontSize: '20px', color: st.color, fontStyle: 'bold',
      }).setOrigin(0.5).setScrollFactor(0);
      const r = this.add.text(640, 344, this.lastResult.reason, {
        fontFamily: 'Arial', fontSize: '13px', color: '#cdd6e2', align: 'center', wordWrap: { width: 760 },
      }).setOrigin(0.5, 0).setScrollFactor(0);
      this.layer.add([v, r]);
    }

    // Discovery tally.
    const tally = this.add.text(640, 470, `Products discovered: ${this.discovered.size}`, {
      fontFamily: 'Arial', fontSize: '13px', color: '#9fcfa6',
    }).setOrigin(0.5).setScrollFactor(0);
    this.layer.add(tally);
    if (this.discovered.size) {
      const list = this.add.text(640, 492, [...this.discovered].join('  ·  '), {
        fontFamily: 'Arial', fontSize: '12px', color: '#bfe3c3', align: 'center', wordWrap: { width: 800 },
      }).setOrigin(0.5, 0).setScrollFactor(0);
      this.layer.add(list);
    }
  }
}
