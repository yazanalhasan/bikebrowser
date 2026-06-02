import Phaser from 'phaser';

// Phase 1.9.2 — player-facing predict-before-test. Feels like gameplay, not a
// form: a quick visual "will it HOLD or BREAK?" pick (arrows), how-sure dots,
// then E to test and watch the load bar hold or snap with your guess vs the
// result side by side. Prediction GATES testing (arc.md: prediction precedes
// intervention). Reversible before commit; obvious; seconds per material.
export default class PredictionScene extends Phaser.Scene {
  constructor() {
    super('PredictionScene');
  }

  create() {
    this.queue = [];
    this.index = 0;
    this.phase = 'idle'; // idle | choose | result
    this.guess = 'hold'; // 'hold' | 'break'
    this.confidence = 2; // 1..3

    const cx = 480;
    this.panel = this.add.container(cx, 250).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 560, 300, 0x10243a, 0.96).setOrigin(0.5, 0).setStrokeStyle(4, 0x7fd1ff, 1);
    this.title = this.add.text(0, 22, '', { fontFamily: 'Arial', fontSize: '22px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5, 0);

    // Two big choice chips.
    this.holdChip = this.add.container(-130, 96);
    this.holdBg = this.add.rectangle(0, 0, 200, 96, 0x1f7a3a, 1).setStrokeStyle(4, 0x9affb0, 0);
    this.holdChip.add([this.holdBg, this.add.text(0, -16, '💪', { fontSize: '34px' }).setOrigin(0.5), this.add.text(0, 24, 'WILL HOLD', { fontFamily: 'Arial', fontSize: '16px', color: '#eafff0', fontStyle: 'bold' }).setOrigin(0.5)]);
    this.breakChip = this.add.container(130, 96);
    this.breakBg = this.add.rectangle(0, 0, 200, 96, 0x9a2f2f, 1).setStrokeStyle(4, 0xffb0b0, 0);
    this.breakChip.add([this.breakBg, this.add.text(0, -16, '💥', { fontSize: '34px' }).setOrigin(0.5), this.add.text(0, 24, 'WILL BREAK', { fontFamily: 'Arial', fontSize: '16px', color: '#fff0f0', fontStyle: 'bold' }).setOrigin(0.5)]);

    this.sureLabel = this.add.text(0, 168, 'how sure?', { fontFamily: 'Arial', fontSize: '13px', color: '#bcd6ec' }).setOrigin(0.5);
    this.sureDots = [0, 1, 2].map((i) => this.add.circle(-18 + i * 18, 192, 7, 0x4a6076).setStrokeStyle(2, 0x9fc3e0));

    // Load bar (animates on test) + result row.
    this.barTrack = this.add.rectangle(0, 224, 360, 18, 0x2a3c50).setOrigin(0.5);
    this.barFill = this.add.rectangle(-180, 224, 0, 18, 0x9affb0).setOrigin(0, 0.5);
    this.verdict = this.add.text(0, 256, '', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.hint = this.add.text(0, 284, '← → pick    ↑ ↓ how sure    E to test', { fontFamily: 'Arial', fontSize: '13px', color: '#9fc3e0' }).setOrigin(0.5);

    this.panel.add([bg, this.title, this.holdChip, this.breakChip, this.sureLabel, ...this.sureDots, this.barTrack, this.barFill, this.verdict, this.hint]);

    this.registry.events.on('prediction:start', (materialIds) => this.startFlow(materialIds));

    // window keydown for reliable test/keyboard input (mirrors DialogueScene).
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));

    this._publish();
  }

  startFlow(materialIds) {
    const runtime = this.registry.get('act1Runtime');
    const all = Array.isArray(materialIds) && materialIds.length ? materialIds : ['mesquite', 'steel', 'copper_brace', 'weak_scrap'];
    // Only materials the player has actually collected (gating already enforced
    // by the runtime; this keeps the flow honest).
    this.queue = all.filter((id) => runtime?.inventorySystem?.has(id));
    if (!this.queue.length) return;
    this.index = 0;
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._showChoose();
  }

  _showChoose() {
    this.phase = 'choose';
    this.guess = 'hold';
    this.confidence = 2;
    const id = this.queue[this.index];
    const runtime = this.registry.get('act1Runtime');
    const name = runtime?.materialsLabSystem?.materials.get(id)?.displayName || id;
    this.title.setText(`Will ${name} hold the load?`);
    this.barFill.width = 0;
    this.barFill.fillColor = 0x9affb0;
    this.verdict.setText('');
    this.hint.setText('← → pick    ↑ ↓ how sure    E to test');
    this._render();
    this._publish();
  }

  _render() {
    // Highlight the chosen chip; show confidence dots.
    this.holdBg.setStrokeStyle(4, 0x9affb0, this.guess === 'hold' ? 1 : 0);
    this.breakBg.setStrokeStyle(4, 0xffb0b0, this.guess === 'break' ? 1 : 0);
    this.holdChip.setScale(this.guess === 'hold' ? 1.06 : 0.96);
    this.breakChip.setScale(this.guess === 'break' ? 1.06 : 0.96);
    this.sureDots.forEach((dot, i) => dot.setFillStyle(i < this.confidence ? 0x7fd1ff : 0x4a6076));
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = event.key;
    if (this.phase === 'choose') {
      if (key === 'ArrowLeft' || key?.toLowerCase() === 'a') { this.guess = 'hold'; this._render(); this._publish(); }
      else if (key === 'ArrowRight' || key?.toLowerCase() === 'd') { this.guess = 'break'; this._render(); this._publish(); }
      else if (key === 'ArrowUp' || key?.toLowerCase() === 'w') { this.confidence = Math.min(3, this.confidence + 1); this._render(); this._publish(); }
      else if (key === 'ArrowDown' || key?.toLowerCase() === 's') { this.confidence = Math.max(1, this.confidence - 1); this._render(); this._publish(); }
      else if (key?.toLowerCase() === 'e' || event.code === 'Space') { this._commitAndTest(); }
    } else if (this.phase === 'result') {
      if (key?.toLowerCase() === 'e' || event.code === 'Space') { this._advance(); }
    }
  }

  _commitAndTest() {
    const id = this.queue[this.index];
    const runtime = this.registry.get('act1Runtime');
    const confidenceWord = ['low', 'medium', 'high'][this.confidence - 1];
    const willHold = this.guess === 'hold';
    runtime.predictMaterial(id, willHold, confidenceWord, `I think it will ${willHold ? 'hold' : 'break'}.`);
    const test = runtime.testMaterial(id);
    const safe = Boolean(test?.result?.bridgeSafe);
    const matched = willHold === safe;
    this.phase = 'result';
    // Animate the load bar to the material's strength; green holds, red snaps.
    const strength = Math.max(0.08, Number(test?.result?.bridgeUsefulness || 0));
    this.barFill.fillColor = safe ? 0x9affb0 : 0xff6b6b;
    this.tweens.add({ targets: this.barFill, width: 360 * strength, duration: 420, ease: 'Cubic.easeOut' });
    this.verdict.setText(`${matched ? '✓' : '✗'}  you: ${willHold ? '💪' : '💥'}   real: ${safe ? '💪 held' : '💥 snapped'}`);
    this.verdict.setColor(matched ? '#9affb0' : '#ffd27f');
    this.hint.setText(this.index < this.queue.length - 1 ? 'E for next material' : 'E to finish');
    this._publish({ matched, safe });
  }

  _advance() {
    if (this.index < this.queue.length - 1) {
      this.index += 1;
      this._showChoose();
      return;
    }
    this.phase = 'idle';
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('prediction:done');
    this._publish();
  }

  // Expose state so player-reachable acceptance can drive + assert via real keys.
  _publish(extra = {}) {
    window.__PREDICTION__ = {
      active: this.panel.visible,
      phase: this.phase,
      materialId: this.queue[this.index] || null,
      guess: this.guess,
      confidence: this.confidence,
      index: this.index,
      total: this.queue.length,
      ...extra,
    };
  }
}
