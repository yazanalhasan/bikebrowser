import Phaser from 'phaser';
import { narratePanel, narrateText } from '../audio/sceneNarration.js';
import { ASSET_KEYS } from '../systems/AssetRegistry.js';

const BACKDROP_BY_INVESTIGATION = {
  wash_out_cause: ASSET_KEYS.washScourBackdrop,
  green_strip: ASSET_KEYS.greenWashBackdrop,
};

// Phase 1.9.4 — player-facing investigation. The player reads a mystery,
// CHOOSES a hypothesis (one is misleading), gathers evidence, and SEES the
// evidence contradict a wrong guess — then concludes with the better
// explanation. Being wrong and corrected by evidence is the payoff, not a
// penalty (mirrors the reasoning grader). Choice → consequence → payoff, all
// via keyboard (no debug API).
export default class InvestigationScene extends Phaser.Scene {
  constructor() {
    super('InvestigationScene');
  }

  create() {
    this.phase = 'idle'; // idle | observe | hypothesis | evidence | conclusion | summary
    this.investigationId = null;
    this.hypotheses = [];
    this.hypIdx = 0;
    this.evidence = [];
    this.evidenceShown = 0;

    this.panel = this.add.container(480, 200).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 620, 392, 0x171f2b, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0x9ac7e8, 1);
    this.backdrop = this.add.image(0, 110, ASSET_KEYS.washScourBackdrop).setOrigin(0.5, 0).setDisplaySize(560, 116).setVisible(false);
    this.backdropFrame = this.add.rectangle(0, 110, 564, 120, 0x000000, 0).setOrigin(0.5, 0).setStrokeStyle(3, 0x9ac7e8, 0.92).setVisible(false);
    this.textBand = this.add.rectangle(0, 8, 600, 96, 0x171f2b, 0.82).setOrigin(0.5, 0).setVisible(false);
    this.title = this.add.text(0, 16, '', { fontFamily: 'Arial', fontSize: '21px', color: '#e0f1fb', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.observation = this.add.text(0, 50, '', { fontFamily: 'Arial', fontSize: '14px', color: '#bccfe0', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);

    // Two hypothesis cards — the player picks one (the misleading one is not marked).
    this.cardA = this._hypCard(120);
    this.cardB = this._hypCard(176);

    // Evidence reveal area.
    this.evidenceTitle = this.add.text(0, 234, '', { fontFamily: 'Arial', fontSize: '13px', color: '#9ac7e8', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.evidenceText = this.add.text(0, 256, '', { fontFamily: 'Arial', fontSize: '13px', color: '#cfe0f0', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);

    this.verdict = this.add.text(0, 326, '', { fontFamily: 'Arial', fontSize: '16px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 560 } }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 370, '', { fontFamily: 'Arial', fontSize: '12px', color: '#bccfe0' }).setOrigin(0.5, 0);

    this.panel.add([bg, this.backdrop, this.backdropFrame, this.textBand, this.title, this.observation, this.cardA.container, this.cardB.container, this.evidenceTitle, this.evidenceText, this.verdict, this.hint]);

    this.registry.events.on('investigation:start', (id) => this.startFlow(id));
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  _hypCard(y) {
    const container = this.add.container(0, y);
    const card = this.add.rectangle(0, 0, 540, 46, 0x222d3d, 1).setOrigin(0.5).setStrokeStyle(2, 0x3c5066, 1);
    const text = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '15px', color: '#dce8f4', align: 'center', wordWrap: { width: 500 } }).setOrigin(0.5);
    const tag = this.add.text(248, 0, '', { fontFamily: 'Arial', fontSize: '12px', color: '#ff9b9b', fontStyle: 'bold' }).setOrigin(1, 0.5);
    container.add([card, text, tag]);
    return { container, card, text, tag };
  }

  startFlow(id) {
    const runtime = this.registry.get('act1Runtime');
    if (!runtime) return;
    const obs = runtime.observeMystery(id);
    if (!obs.ok) return;
    this.investigationId = id;
    this.hypotheses = obs.hypotheses.map((h) => ({ id: h.id, text: h.text }));
    this.hypIdx = 0;
    this.evidence = [];
    this.evidenceShown = 0;
    this.disprovesHypothesis = false;
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._showObserve(obs);
  }

  _showObserve(obs) {
    this.phase = 'observe';
    this._setBackdrop(this.investigationId);
    this.title.setText(obs.title);
    this.observation.setText(`You notice: ${obs.observation}`);
    [this.cardA, this.cardB].forEach((c) => c.container.setVisible(false));
    this.evidenceTitle.setText('');
    this.evidenceText.setText('');
    this.verdict.setText('');
    this.hint.setText('E to weigh the explanations    Esc leave');
    this._publish();
    this._narrate();
  }

  _showHypothesis() {
    this.phase = 'hypothesis';
    this._setBackdrop(this.investigationId);
    this.observation.setText('Which explanation do you think is right? (you can be wrong — the evidence will tell)');
    this.evidenceTitle.setText('');
    this.evidenceText.setText('');
    this.verdict.setText('');
    this.hint.setText('▲ ▼ choose    E investigate it    Esc leave');
    this._renderHypotheses();
    this._publish();
    this._narrate();
  }

  _renderHypotheses() {
    const cards = [this.cardA, this.cardB];
    this.hypotheses.forEach((h, i) => {
      const c = cards[i];
      if (!c) return;
      c.container.setVisible(true);
      c.text.setText(h.text);
      c.tag.setText('');
      const selected = i === this.hypIdx;
      c.card.setStrokeStyle(selected ? 3 : 2, selected ? 0x9ac7e8 : 0x3c5066, 1);
      c.card.setFillStyle(selected ? 0x2b3a4e : 0x222d3d, 1);
      c.text.setColor(selected ? '#ffffff' : '#9fb2c4');
    });
  }

  _commitHypothesis() {
    const runtime = this.registry.get('act1Runtime');
    const chosen = this.hypotheses[this.hypIdx];
    runtime.hypothesizeMystery(this.investigationId, chosen.id);
    const inv = runtime.investigateMystery(this.investigationId);
    if (!inv.ok) return;
    this.evidence = inv.evidence;
    this.disprovesHypothesis = Boolean(inv.disprovesHypothesis);
    this.evidenceShown = 0;
    this._showEvidence();
  }

  _showEvidence() {
    this.phase = 'evidence';
    this._setBackdrop(this.investigationId);
    this.observation.setText('You go and look. The evidence comes in:');
    // Reveal one more evidence item.
    this.evidenceShown = Math.min(this.evidenceShown + 1, this.evidence.length);
    const chosen = this.hypotheses[this.hypIdx];
    const shown = this.evidence.slice(0, this.evidenceShown);
    const disprovesChosen = shown.some((e) => e.disproves === chosen.id);
    this.evidenceTitle.setText(`Evidence ${this.evidenceShown} of ${this.evidence.length}`);
    this.evidenceText.setText(shown.map((e) => `• ${e.text}`).join('\n'));
    this.evidenceText.setColor('#cfe0f0');

    // The chosen hypothesis card reacts: if the evidence contradicts it, it
    // visibly turns red — the player SEES their guess fail.
    const cards = [this.cardA, this.cardB];
    const c = cards[this.hypIdx];
    if (c) {
      if (disprovesChosen) {
        c.card.setStrokeStyle(3, 0xff6b6b, 1);
        c.card.setFillStyle(0x3a2326, 1);
        c.text.setColor('#ffd9d9');
        c.tag.setText('✗ doesn’t fit');
        this.tweens.add({ targets: c.container, x: { from: -6, to: 0 }, duration: 70, repeat: 2, yoyo: true });
      }
    }

    if (this.evidenceShown < this.evidence.length) {
      this.hint.setText('E for the next clue    Esc leave');
    } else {
      this.verdict.setText(disprovesChosen
        ? 'The evidence points the other way.'
        : 'The evidence backs your idea.');
      this.verdict.setColor(disprovesChosen ? '#ffb3b3' : '#9affb0');
      this.hint.setText('E to draw your conclusion    Esc leave');
    }
    this._publish();
    this._narrate();
  }

  _showConclusion() {
    this.phase = 'conclusion';
    this._setBackdrop(this.investigationId);
    const runtime = this.registry.get('act1Runtime');
    const result = runtime.concludeMystery(this.investigationId);
    if (!result.ok) return;
    this.conclusionText = result.conclusion.text;
    this.correctedFromMisleading = Boolean(result.correctedFromMisleading);
    this.observation.setText('');
    [this.cardA, this.cardB].forEach((c) => c.container.setVisible(false));
    this.evidenceTitle.setText(this.correctedFromMisleading ? 'You changed your mind with the evidence' : 'Your hypothesis held up');
    this.evidenceTitle.setColor(this.correctedFromMisleading ? '#ffd27a' : '#9affb0');
    this.evidenceText.setText('');
    this.verdict.setText(this.conclusionText);
    this.verdict.setColor('#dffbe6');
    this.hint.setText('E to finish    Esc leave');
    this._publish({ concluded: true });
    this._narrate();
  }

  _showSummary() {
    this.phase = 'summary';
    this._hideBackdrop();
    this.evidenceTitle.setText('Mystery solved');
    this.evidenceTitle.setColor('#9ac7e8');
    this.evidenceText.setText(this.correctedFromMisleading
      ? 'You started with the obvious guess, let the evidence correct you, and reached the real explanation. That is how an investigator thinks.'
      : 'You formed an idea and the evidence confirmed it. Notebook updated.');
    this.verdict.setText('+1 notebook entry');
    this.verdict.setColor('#cfe0f0');
    this.hint.setText('E to close');
    this._publish({ concluded: true });
    this._narrate();
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    const advance = key === 'e' || event.code === 'Space';
    if (this.phase === 'observe') {
      if (advance) this._showHypothesis();
    } else if (this.phase === 'hypothesis') {
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || key === 'w' || key === 'a') { this.hypIdx = (this.hypIdx - 1 + this.hypotheses.length) % this.hypotheses.length; this._renderHypotheses(); this._publish(); narrateText(this, this.hypotheses[this.hypIdx]?.text); }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || key === 's' || key === 'd') { this.hypIdx = (this.hypIdx + 1) % this.hypotheses.length; this._renderHypotheses(); this._publish(); narrateText(this, this.hypotheses[this.hypIdx]?.text); }
      else if (advance) { this._commitHypothesis(); }
    } else if (this.phase === 'evidence') {
      if (advance) {
        if (this.evidenceShown < this.evidence.length) this._showEvidence();
        else this._showConclusion();
      }
    } else if (this.phase === 'conclusion') {
      if (advance) this._showSummary();
    } else if (this.phase === 'summary') {
      if (advance) this._finish();
    }
  }

  _finish() {
    this.phase = 'idle';
    this._hideBackdrop();
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('investigation:done');
    this._publish();
  }

  // Narrator: read the current panel aloud (skips the keyboard-control hint).
  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint, this.title] });
  }

  _setBackdrop(investigationId) {
    const key = BACKDROP_BY_INVESTIGATION[investigationId];
    if (!key) { this._hideBackdrop(); return; }
    // Re-apply display size after setTexture: setTexture resizes to the new
    // texture's native frame, so the scale must be reset or the diorama blows up.
    this.backdrop.setTexture(key).setOrigin(0.5, 0).setDisplaySize(560, 116).setVisible(true);
    this.backdropFrame.setVisible(true);
    this.textBand.setVisible(true);
  }

  _hideBackdrop() {
    this.backdrop?.setVisible(false);
    this.backdropFrame?.setVisible(false);
    this.textBand?.setVisible(false);
  }

  _publish(extra = {}) {
    const chosen = this.hypotheses[this.hypIdx];
    window.__INVESTIGATION__ = {
      active: this.panel.visible,
      phase: this.phase,
      investigationId: this.investigationId,
      hypothesisId: chosen ? chosen.id : null,
      hypothesisIndex: this.hypIdx,
      hypotheses: this.hypotheses.map((h) => h.id),
      evidenceShown: this.evidenceShown,
      evidenceCount: this.evidence.length,
      disprovesHypothesis: Boolean(this.disprovesHypothesis),
      correctedFromMisleading: Boolean(this.correctedFromMisleading),
      conclusionText: this.conclusionText || null,
      ...extra,
    };
  }
}
