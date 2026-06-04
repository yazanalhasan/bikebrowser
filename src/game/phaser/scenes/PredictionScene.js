import Phaser from 'phaser';
import { narratePanel, narrateText } from '../audio/sceneNarration.js';

// Phase 1.9.2 / 1.9.2A-C — player-facing predict-before-test that feels like a
// guess-and-check mini-game. The player SEES the beam hold / bend / break (not
// just text), the loop always finishes with a summary and closes (never
// trapped), and every result belongs to the action that made it.
export default class PredictionScene extends Phaser.Scene {
  constructor() {
    super('PredictionScene');
  }

  create() {
    this.queue = [];
    this.index = 0;
    this.phase = 'idle'; // idle | choose | result | summary
    this.guess = 'hold';
    this.confidence = 2;
    this.results = [];

    this.panel = this.add.container(480, 230).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 580, 330, 0x10243a, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0x7fd1ff, 1);
    this.title = this.add.text(0, 18, '', { fontFamily: 'Arial', fontSize: '22px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Choice chips.
    this.chips = this.add.container(0, 86);
    this.holdBg = this.add.rectangle(-130, 0, 200, 88, 0x1f7a3a, 1).setStrokeStyle(4, 0x9affb0, 0);
    this.breakBg = this.add.rectangle(130, 0, 200, 88, 0x9a2f2f, 1).setStrokeStyle(4, 0xffb0b0, 0);
    this.chips.add([
      this.holdBg, this.add.text(-130, -14, '💪', { fontSize: '32px' }).setOrigin(0.5), this.add.text(-130, 22, 'WILL HOLD', { fontFamily: 'Arial', fontSize: '15px', color: '#eafff0', fontStyle: 'bold' }).setOrigin(0.5),
      this.breakBg, this.add.text(130, -14, '💥', { fontSize: '32px' }).setOrigin(0.5), this.add.text(130, 22, 'WILL BREAK', { fontFamily: 'Arial', fontSize: '15px', color: '#fff0f0', fontStyle: 'bold' }).setOrigin(0.5),
    ]);
    this.sureLabel = this.add.text(0, 148, 'how sure?', { fontFamily: 'Arial', fontSize: '12px', color: '#bcd6ec' }).setOrigin(0.5);
    this.sureDots = [0, 1, 2].map((i) => this.add.circle(-18 + i * 18, 170, 7, 0x4a6076).setStrokeStyle(2, 0x9fc3e0));

    // The beam under load: straight (hold), tilted (bend), or snapped V (break).
    this.beam = this.add.rectangle(0, 150, 240, 16, 0x9fc3e0).setOrigin(0.5).setVisible(false);
    this.beamLeft = this.add.rectangle(0, 150, 122, 16, 0xff6b6b).setOrigin(1, 0.5).setVisible(false);
    this.beamRight = this.add.rectangle(0, 150, 122, 16, 0xff6b6b).setOrigin(0, 0.5).setVisible(false);
    this.weight = this.add.text(0, 120, '⬇', { fontSize: '22px' }).setOrigin(0.5).setVisible(false);

    this.verdict = this.add.text(0, 232, '', { fontFamily: 'Arial', fontSize: '19px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.explain = this.add.text(0, 262, '', { fontFamily: 'Arial', fontSize: '14px', color: '#cfe6fb', wordWrap: { width: 520 }, align: 'center' }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 308, '← → pick    ↑ ↓ how sure    E to test    Esc to leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9fc3e0' }).setOrigin(0.5);

    this.panel.add([bg, this.title, this.chips, this.sureLabel, ...this.sureDots, this.beam, this.beamLeft, this.beamRight, this.weight, this.verdict, this.explain, this.hint]);

    this.registry.events.on('prediction:start', (materialIds) => this.startFlow(materialIds));
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow(materialIds) {
    const runtime = this.registry.get('act1Runtime');
    const all = Array.isArray(materialIds) && materialIds.length ? materialIds : ['mesquite', 'steel', 'copper_brace', 'weak_scrap'];
    this.queue = all.filter((id) => runtime?.inventorySystem?.has(id));
    if (!this.queue.length) return;
    this.index = 0;
    this.results = [];
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._showChoose();
  }

  _resetBeam() {
    this.beam.setVisible(true).setAngle(0).setFillStyle(0x9fc3e0);
    this.beamLeft.setVisible(false).setAngle(0);
    this.beamRight.setVisible(false).setAngle(0);
    this.weight.setVisible(false).setY(120);
  }

  _showChoose() {
    this.phase = 'choose';
    this.guess = 'hold';
    this.confidence = 2;
    const id = this.queue[this.index];
    const runtime = this.registry.get('act1Runtime');
    const name = runtime?.materialsLabSystem?.materials.get(id)?.displayName || id;
    this.title.setText(`(${this.index + 1}/${this.queue.length})  Will ${name} hold the load?`);
    this.chips.setVisible(true);
    this.sureLabel.setVisible(true);
    this.sureDots.forEach((d) => d.setVisible(true));
    this._resetBeam();
    this.verdict.setText('');
    this.explain.setText('');
    this.hint.setText('← → pick    ↑ ↓ how sure    E to test    Esc to leave');
    this._render();
    this._publish();
    this._narrate();
  }

  _render() {
    this.holdBg.setStrokeStyle(4, 0x9affb0, this.guess === 'hold' ? 1 : 0);
    this.breakBg.setStrokeStyle(4, 0xffb0b0, this.guess === 'break' ? 1 : 0);
    this.sureDots.forEach((dot, i) => dot.setFillStyle(i < this.confidence ? 0x7fd1ff : 0x4a6076));
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    if (this.phase === 'choose') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.guess = 'hold'; this._render(); this._publish(); narrateText(this, 'will hold'); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.guess = 'break'; this._render(); this._publish(); narrateText(this, 'will break'); }
      else if (event.key === 'ArrowUp' || key === 'w') { this.confidence = Math.min(3, this.confidence + 1); this._render(); this._publish(); }
      else if (event.key === 'ArrowDown' || key === 's') { this.confidence = Math.max(1, this.confidence - 1); this._render(); this._publish(); }
      else if (key === 'e' || event.code === 'Space') { this._commitAndTest(); }
    } else if (this.phase === 'result') {
      if (key === 'e' || event.code === 'Space') { this._advance(); }
    } else if (this.phase === 'summary') {
      if (key === 'e' || event.code === 'Space') { this._finish(); }
    }
  }

  _commitAndTest() {
    const id = this.queue[this.index];
    const runtime = this.registry.get('act1Runtime');
    const confidenceWord = ['low', 'medium', 'high'][this.confidence - 1];
    const willHold = this.guess === 'hold';
    runtime.predictMaterial(id, willHold, confidenceWord, `I think it will ${willHold ? 'hold' : 'break'}.`);
    const test = runtime.testMaterial(id);
    const result = test?.result || {};
    const band = result.strengthBand; // 'strong candidate' | 'useful with limits' | 'comparison failure'
    const safe = Boolean(result.bridgeSafe);
    const matched = willHold === safe;
    const name = result.displayName || id;
    // 1.9.2A — SEE the outcome: hold (straight, green), bend (tilt, amber), break (snap, red).
    const outcome = band === 'strong candidate' ? 'hold' : band === 'useful with limits' ? 'bend' : 'break';
    this.chips.setVisible(false);
    this.weight.setVisible(true);
    this._animateBeam(outcome);
    const faces = { hold: '✅ it HELD', bend: '🟡 it BENT, but held', break: '💥 it SNAPPED' };
    this.verdict.setText(`${matched ? '✓' : '✗'}  you said ${willHold ? '💪 hold' : '💥 break'} — ${faces[outcome]}`);
    this.verdict.setColor(matched ? '#9affb0' : '#ffd27f');
    // 1.9.2C — the explanation names THIS material + result (no stale carryover).
    this.explain.setText(`${name}: ${result.verdict || ''}`);
    this.hint.setText(this.index < this.queue.length - 1 ? 'E for next material    Esc to leave' : 'E for summary    Esc to leave');
    this.phase = 'result';
    this.results.push({ id, name, outcome, matched, safe });
    this._publish({ outcome, matched, materialId: id });
    this._narrate();
  }

  _animateBeam(outcome) {
    this.tweens.add({ targets: this.weight, y: 150, duration: 260, ease: 'Quad.easeIn', yoyo: outcome !== 'break', hold: 40 });
    if (outcome === 'hold') {
      this.beam.setFillStyle(0x9affb0);
      this.tweens.add({ targets: this.beam, y: 156, duration: 200, ease: 'Quad.easeOut', yoyo: true });
    } else if (outcome === 'bend') {
      this.beam.setFillStyle(0xffd27f);
      this.tweens.add({ targets: this.beam, angle: 7, y: 158, duration: 320, ease: 'Sine.easeOut', yoyo: true, hold: 120 });
    } else {
      // break: hide the straight beam, snap into a broken V.
      this.beam.setVisible(false);
      this.beamLeft.setVisible(true).setPosition(0, 150);
      this.beamRight.setVisible(true).setPosition(0, 150);
      this.tweens.add({ targets: this.beamLeft, angle: 24, y: 168, duration: 300, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.beamRight, angle: -24, y: 168, duration: 300, ease: 'Back.easeOut' });
    }
  }

  _advance() {
    if (this.index < this.queue.length - 1) {
      this.index += 1;
      this._showChoose();
      return;
    }
    this._showSummary();
  }

  // 1.9.2B — exit flow: always finish with a clear summary, then close.
  _showSummary() {
    this.phase = 'summary';
    this.chips.setVisible(false);
    this.sureLabel.setVisible(false);
    this.sureDots.forEach((d) => d.setVisible(false));
    this.beam.setVisible(false); this.beamLeft.setVisible(false); this.beamRight.setVisible(false); this.weight.setVisible(false);
    const held = this.results.filter((r) => r.outcome !== 'break').length;
    const broke = this.results.filter((r) => r.outcome === 'break').length;
    const right = this.results.filter((r) => r.matched).length;
    this.title.setText('Test bench results');
    this.verdict.setText(`${held} held · ${broke} snapped · you guessed ${right}/${this.results.length} right`);
    this.verdict.setColor('#eaf6ff');
    this.explain.setText('Strong materials carry the load; weak ones snap. Use the evidence when you build.');
    this.hint.setText('E to close');
    this._publish();
    this._narrate();
  }

  _finish() {
    this.phase = 'idle';
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('prediction:done');
    this._publish();
  }

  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint] });
  }

  _publish(extra = {}) {
    window.__PREDICTION__ = {
      active: this.panel.visible,
      phase: this.phase,
      materialId: this.queue[this.index] || null,
      guess: this.guess,
      confidence: this.confidence,
      index: this.index,
      total: this.queue.length,
      results: this.results.map((r) => ({ id: r.id, outcome: r.outcome, matched: r.matched })),
      ...extra,
    };
  }
}
