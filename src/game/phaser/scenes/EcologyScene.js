import Phaser from 'phaser';
import { narratePanel, narrateText } from '../audio/sceneNarration.js';

// Phase 2.1 — Ecology Loop, player-facing. The player OBSERVES a desert site,
// PREDICTS which plant will thrive there, SEES the outcome (it thrives or
// struggles, on screen), and gets the PAYOFF (why that plant fits + a notebook
// entry). Being wrong still teaches — the result names the plant that actually
// fits and why. Choice → consequence → payoff, all by keyboard (no debug API).
export default class EcologyScene extends Phaser.Scene {
  constructor() {
    super('EcologyScene');
  }

  create() {
    this.phase = 'idle'; // idle | observe | predict | result | summary
    this.queue = [];
    this.index = 0;
    this.options = [];
    this.optIdx = 0;
    this.results = [];

    this.panel = this.add.container(480, 196).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 620, 400, 0x14210f, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0xbfe39a, 1);
    this.title = this.add.text(0, 16, '', { fontFamily: 'Arial', fontSize: '21px', color: '#eafbe0', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.site = this.add.text(0, 50, '', { fontFamily: 'Arial', fontSize: '14px', color: '#c8dcb6', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);
    this.conditions = this.add.text(0, 104, '', { fontFamily: 'Arial', fontSize: '12px', color: '#9fc27a', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);

    // The plant card the player is cycling through.
    this.card = this.add.container(0, 168);
    this.cardBg = this.add.rectangle(0, 0, 360, 56, 0x24331a, 1).setStrokeStyle(3, 0xbfe39a, 1);
    this.plantName = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.card.add([this.cardBg, this.plantName,
      this.add.text(-196, 0, '◀', { fontSize: '20px', color: '#bfe39a' }).setOrigin(0.5),
      this.add.text(196, 0, '▶', { fontSize: '20px', color: '#bfe39a' }).setOrigin(0.5)]);

    // The plant glyph that grows (thrive) or wilts (struggle).
    this.plant = this.add.container(0, 250);
    this.stem = this.add.rectangle(0, 0, 10, 54, 0x6fae54).setOrigin(0.5, 1);
    this.leafL = this.add.triangle(-12, -34, 0, 0, -26, -8, 0, -18, 0x7cc05f).setOrigin(0.5);
    this.leafR = this.add.triangle(12, -34, 0, 0, 26, -8, 0, -18, 0x7cc05f).setOrigin(0.5);
    this.plant.add([this.stem, this.leafL, this.leafR]);
    this.plant.setVisible(false);

    this.verdict = this.add.text(0, 300, '', { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);
    this.why = this.add.text(0, 332, '', { fontFamily: 'Arial', fontSize: '13px', color: '#d6ecc4', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 378, '', { fontFamily: 'Arial', fontSize: '12px', color: '#9fc27a' }).setOrigin(0.5, 0);

    this.panel.add([bg, this.title, this.site, this.conditions, this.card, this.plant, this.verdict, this.why, this.hint]);

    this.registry.events.on('ecology:start', () => this.startFlow());
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow() {
    const runtime = this.registry.get('act1Runtime');
    if (!runtime) return;
    const placements = runtime.ecologySystem?.getState().placements || [];
    this.queue = placements.map((p) => p.id);
    if (!this.queue.length) return;
    this.index = 0;
    this.results = [];
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._showObserve();
  }

  _showObserve() {
    this.phase = 'observe';
    const runtime = this.registry.get('act1Runtime');
    const obs = runtime.observeEcologyPlacement(this.queue[this.index]);
    if (!obs.ok) { this._finish(); return; }
    this.placement = obs.placement;
    this.options = obs.placement.options;
    this.optIdx = 0;
    this.title.setText(`Plant the desert  (${this.index + 1}/${this.queue.length})`);
    this.site.setText(`You see: ${obs.placement.site}`);
    this.conditions.setText(`conditions — ${obs.placement.conditions.join(' · ')}`);
    this.card.setVisible(false);
    this.plant.setVisible(false);
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('E to choose a plant    Esc to leave');
    this._publish();
    this._narrate();
  }

  _showPredict() {
    this.phase = 'predict';
    this.card.setVisible(true);
    this.plant.setVisible(false);
    this.site.setText('Which plant will thrive here? (you can be wrong — you will see)');
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('◀ ▶ pick a plant    E plant it    Esc to leave');
    this._renderCard();
    this._publish();
    this._narrate();
  }

  _renderCard() {
    this.plantName.setText(this.options[this.optIdx]?.displayName || '');
  }

  _commit() {
    const runtime = this.registry.get('act1Runtime');
    const id = this.queue[this.index];
    const speciesId = this.options[this.optIdx].id;
    runtime.predictEcologyPlacement(id, speciesId);
    const result = runtime.resolveEcologyPlacement(id);
    if (!result.ok) return;
    this.phase = 'result';
    this.card.setVisible(false);
    this.site.setText('');
    this.plant.setVisible(true);
    this.plant.setScale(1).setAngle(0).setAlpha(1);
    if (result.thrives) {
      // SEE it thrive: the plant grows, green and upright.
      [this.stem, this.leafL, this.leafR].forEach((p) => p.setFillStyle(p === this.stem ? 0x6fae54 : 0x7cc05f));
      this.tweens.add({ targets: this.plant, scaleY: 1.35, scaleX: 1.15, duration: 420, ease: 'Back.easeOut' });
      this.verdict.setText(`✅ ${result.predictedName} thrives here.`);
      this.verdict.setColor('#9affb0');
    } else {
      // SEE it struggle: the plant wilts, amber and drooping.
      [this.stem, this.leafL, this.leafR].forEach((p) => p.setFillStyle(0xc9a24a));
      this.tweens.add({ targets: this.plant, angle: 22, scaleY: 0.6, duration: 480, ease: 'Sine.easeOut' });
      this.verdict.setText(`🥀 ${result.predictedName} struggles here. ${result.correctName} fits this site.`);
      this.verdict.setColor('#ffd27a');
    }
    // Payoff: the reason it fits (always teaches, right or wrong).
    this.why.setText(result.thrives ? result.why : `${result.why}  Why ${result.correctName} fits: ${result.correctWhy}`);
    this.hint.setText(this.index < this.queue.length - 1 ? 'E for the next site    Esc to leave' : 'E for your field notes    Esc to leave');
    this.results.push({ id, thrives: result.thrives, matched: result.thrives, predicted: result.predictedId, correct: result.correct });
    this._publish({ thrives: result.thrives, matched: result.thrives, notebookEntry: result.notebookEntry, payoff: true });
    this._narrate();
  }

  _advance() {
    if (this.index < this.queue.length - 1) {
      this.index += 1;
      this._showObserve();
      return;
    }
    this._showSummary();
  }

  _showSummary() {
    this.phase = 'summary';
    this.plant.setVisible(false);
    this.card.setVisible(false);
    const right = this.results.filter((r) => r.matched).length;
    this.title.setText('Field notes — desert planting');
    this.site.setText('');
    this.conditions.setText('');
    this.verdict.setText(`${right}/${this.results.length} thrived on your first pick`);
    this.verdict.setColor('#eafbe0');
    this.why.setText('Each plant fits a place: deep-rooted shade for the wash edge, dry-tough survivors for the open flat. Your notebook remembers which fits where.');
    this.hint.setText('E to close');
    this._publish({ payoff: true });
    this._narrate();
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    const advance = key === 'e' || event.code === 'Space';
    if (this.phase === 'observe') {
      if (advance) this._showPredict();
    } else if (this.phase === 'predict') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.optIdx = (this.optIdx - 1 + this.options.length) % this.options.length; this._renderCard(); this._publish(); narrateText(this, this.plantName.text); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.optIdx = (this.optIdx + 1) % this.options.length; this._renderCard(); this._publish(); narrateText(this, this.plantName.text); }
      else if (advance) { this._commit(); }
    } else if (this.phase === 'result') {
      if (advance) this._advance();
    } else if (this.phase === 'summary') {
      if (advance) this._finish();
    }
  }

  _finish() {
    this.phase = 'idle';
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('ecology:done');
    this._publish();
  }

  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint] });
  }

  _publish(extra = {}) {
    const opt = this.options[this.optIdx];
    window.__ECOLOGY__ = {
      active: this.panel.visible,
      phase: this.phase,
      placementId: this.queue[this.index] || null,
      optionId: opt ? opt.id : null,
      optionIndex: this.optIdx,
      options: this.options.map((o) => o.id),
      index: this.index,
      total: this.queue.length,
      resolvedCount: this.results.length,
      matchedCount: this.results.filter((r) => r.matched).length,
      results: this.results.map((r) => ({ id: r.id, thrives: r.thrives, matched: r.matched })),
      ...extra,
    };
  }
}
