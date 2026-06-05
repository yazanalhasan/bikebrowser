import Phaser from 'phaser';
import { narratePanel, narrateText } from '../audio/sceneNarration.js';
import { ASSET_KEYS } from '../systems/AssetRegistry.js';

// Phase 1.9.3 — player-facing bridge design. The player assigns a tested
// material to each load-bearing role (deck → support → brace), then BUILDS and
// SEES the bridge hold or fail. A weak choice fails visibly and the player
// iterates. Choice → consequence → payoff, all via keyboard (no debug API).
const ROLES = [
  { key: 'deck', label: 'DECK', hint: 'the part you ride across' },
  { key: 'support', label: 'SUPPORTS', hint: 'the legs that carry the load' },
  { key: 'brace', label: 'BRACE', hint: 'the triangle that stiffens it' },
];

export default class BridgeDesignScene extends Phaser.Scene {
  constructor() {
    super('BridgeDesignScene');
  }

  create() {
    this.phase = 'idle'; // idle | choose | result
    this.candidates = [];
    this.candIdx = 0;
    this.roleIdx = 0;
    this.selection = {};

    this.panel = this.add.container(480, 220).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 600, 340, 0x1a2412, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0xc7e89a, 1);
    this.backdrop = this.add.image(0, 164, ASSET_KEYS.washCrossingBackdrop).setOrigin(0.5, 0).setDisplaySize(548, 112).setVisible(false);
    this.backdropFrame = this.add.rectangle(0, 164, 552, 116, 0x000000, 0).setOrigin(0.5, 0).setStrokeStyle(3, 0xd9b879, 0.92).setVisible(false);
    this.textBand = this.add.rectangle(0, 8, 580, 82, 0x1a2412, 0.82).setOrigin(0.5, 0).setVisible(false);
    this.title = this.add.text(0, 16, '', { fontFamily: 'Arial', fontSize: '22px', color: '#eafbe0', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.roleHint = this.add.text(0, 48, '', { fontFamily: 'Arial', fontSize: '13px', color: '#bcd6ac' }).setOrigin(0.5, 0);

    // The candidate material card the player is cycling through.
    this.card = this.add.container(0, 104);
    this.cardBg = this.add.rectangle(0, 0, 320, 70, 0x2d3a22, 1).setStrokeStyle(3, 0xc7e89a, 1);
    this.candName = this.add.text(0, -12, '', { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.candEvidence = this.add.text(0, 16, '', { fontFamily: 'Arial', fontSize: '13px', color: '#cfe6b8' }).setOrigin(0.5);
    this.card.add([this.cardBg, this.candName, this.candEvidence, this.add.text(-176, 0, '◀', { fontSize: '20px', color: '#c7e89a' }).setOrigin(0.5), this.add.text(176, 0, '▶', { fontSize: '20px', color: '#c7e89a' }).setOrigin(0.5)]);

    // Chosen-so-far row.
    this.chosenText = this.add.text(0, 158, '', { fontFamily: 'Arial', fontSize: '13px', color: '#bcd6ac' }).setOrigin(0.5);

    // The bridge visual (deck + two supports + brace) over a gap.
    this.bridge = this.add.container(0, 232);
    this.deck = this.add.rectangle(0, 0, 300, 14, 0xb98a4a).setOrigin(0.5);
    this.supL = this.add.rectangle(-110, 26, 14, 52, 0x9a9a9a).setOrigin(0.5, 0);
    this.supR = this.add.rectangle(110, 26, 14, 52, 0x9a9a9a).setOrigin(0.5, 0);
    this.brace = this.add.triangle(0, 8, 0, 24, -60, -10, 60, -10, 0xcf9b5a).setOrigin(0.5).setAlpha(0.9);
    this.bridge.add([this.brace, this.deck, this.supL, this.supR]);
    this.bridge.setVisible(false);

    this.verdict = this.add.text(0, 288, '', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.hint = this.add.text(0, 318, '◀ ▶ pick    E choose    Esc leave', { fontFamily: 'Arial', fontSize: '12px', color: '#bcd6ac' }).setOrigin(0.5);
    this.panel.add([bg, this.backdrop, this.backdropFrame, this.textBand, this.title, this.roleHint, this.card, this.chosenText, this.bridge, this.verdict, this.hint]);

    this.registry.events.on('bridgeDesign:start', () => this.startFlow());
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow() {
    const runtime = this.registry.get('act1Runtime');
    const tested = runtime?.materialsLabSystem?.getState().tested || [];
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    if (!tested.length) {
      // Gating with feedback, not silence: the player who hasn't tested any
      // materials still gets a live modal that explains the prerequisite,
      // instead of pressing E and seeing nothing happen.
      this._showBlocked();
      return;
    }
    this.candidates = tested.map((t) => ({ id: t.materialId, name: t.displayName, safe: Boolean(t.bridgeSafe), band: t.strengthBand }));
    this.selection = {};
    this.roleIdx = 0;
    this.candIdx = 0;
    this._showChoose();
  }

  _showBlocked() {
    this.phase = 'blocked';
    this._hideBackdrop();
    this.candidates = [];
    this.card.setVisible(false);
    this.bridge.setVisible(false);
    this.chosenText.setText('');
    this.title.setText('Plan the bridge repair');
    this.roleHint.setText('You need tested materials before you can choose.');
    this.verdict.setText('Test materials at the UTM first, then come back to design the bridge.');
    this.verdict.setColor('#ffd27a');
    this.hint.setText('E or Esc to head back');
    this._publish();
    this._narrate();
  }

  _showChoose() {
    this.phase = 'choose';
    this._setBackdrop(ASSET_KEYS.washCrossingBackdrop);
    this.candIdx = 0;
    this.bridge.setVisible(false);
    this.card.setVisible(true);
    this.verdict.setText('');
    const role = ROLES[this.roleIdx];
    this.title.setText(`Build the bridge — pick the ${role.label}`);
    this.roleHint.setText(role.hint);
    this.hint.setText('◀ ▶ pick    E choose    Esc leave');
    this._render();
    this._publish();
    this._narrate();
  }

  _render() {
    const c = this.candidates[this.candIdx];
    this.candName.setText(c.name);
    // The evidence the player gathered at the UTM (their memory made visible).
    this.candEvidence.setText(c.safe ? `test: held the load (${c.band})` : 'test: snapped under load');
    this.candEvidence.setColor(c.safe ? '#9affb0' : '#ff9b9b');
    const picks = ROLES.slice(0, this.roleIdx).map((r) => `${r.label}: ${this.candidates.find((x) => x.id === this.selection[r.key])?.name || '?'}`);
    this.chosenText.setText(picks.join('    '));
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    if (this.phase === 'blocked') {
      if (key === 'e' || event.code === 'Space') { this._finish(); }
    } else if (this.phase === 'choose') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.candIdx = (this.candIdx - 1 + this.candidates.length) % this.candidates.length; this._render(); this._publish(); this._narrateCandidate(); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.candIdx = (this.candIdx + 1) % this.candidates.length; this._render(); this._publish(); this._narrateCandidate(); }
      else if (key === 'e' || event.code === 'Space') { this._choose(); }
    } else if (this.phase === 'result') {
      if (key === 'e' || event.code === 'Space') { this._afterResult(); }
    }
  }

  _choose() {
    const role = ROLES[this.roleIdx];
    this.selection[role.key] = this.candidates[this.candIdx].id;
    if (this.roleIdx < ROLES.length - 1) {
      this.roleIdx += 1;
      this._showChoose();
    } else {
      this._build();
    }
  }

  _build() {
    const runtime = this.registry.get('act1Runtime');
    const result = runtime.designBridge(this.selection);
    this.phase = 'result';
    this._setBackdrop(ASSET_KEYS.washCrossingBackdrop);
    this.card.setVisible(false);
    this.chosenText.setText('');
    this.bridge.setVisible(true);
    if (result.ok) {
      // Holds: green, steady.
      this.deck.setFillStyle(0x86c06a);
      this.supL.setFillStyle(0x86c06a); this.supR.setFillStyle(0x86c06a);
      this.tweens.add({ targets: this.bridge, y: 236, duration: 160, yoyo: true });
      this.verdict.setText('✅ The bridge holds! Strong parts carry the load.');
      this.verdict.setColor('#9affb0');
      this.hint.setText('E to finish');
      this.success = true;
    } else {
      // Fails: the weak role visibly sags/breaks red.
      const weakRole = (result.evaluated || []).find((e) => !e.bridgeSafe);
      this.deck.setFillStyle(0xb98a4a);
      const part = weakRole?.role === 'support' ? this.supL : weakRole?.role === 'brace' ? this.brace : this.deck;
      part.setFillStyle(0xff6b6b);
      this.tweens.add({ targets: this.deck, angle: 10, y: 16, duration: 360, ease: 'Bounce.easeOut' });
      this.tweens.add({ targets: [this.supL], angle: 18, duration: 360 });
      this.verdict.setText(`💥 The ${weakRole?.role || 'bridge'} failed — ${result.explanation || 'weak material under load.'}`);
      this.verdict.setColor('#ffb3b3');
      this.hint.setText('E to redesign');
      this.success = false;
    }
    this._publish({ outcome: result.ok ? 'safe' : (result.outcome || 'unsafe'), built: true });
    this._narrate();
  }

  _afterResult() {
    if (this.success) {
      this._finish();
    } else {
      // Iterate: redesign from scratch with the lesson learned.
      this.roleIdx = 0;
      this.selection = {};
      this.deck.setAngle(0).setY(0); this.supL.setAngle(0); this.supR.setAngle(0);
      this.bridge.setY(232);
      this._showChoose();
    }
  }

  _finish() {
    this.phase = 'idle';
    this._hideBackdrop();
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('bridgeDesign:done');
    this._publish();
  }

  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint, this.title] });
  }

  _narrateCandidate() {
    narrateText(this, `${this.candName.text}. ${this.candEvidence.text}`);
  }

  _setBackdrop(key) {
    if (!key) { this._hideBackdrop(); return; }
    // Re-apply display size after setTexture: setTexture resizes to the new
    // texture's native frame, so the scale must be reset or the diorama blows up.
    this.backdrop.setTexture(key).setOrigin(0.5, 0).setDisplaySize(548, 112).setVisible(true);
    this.backdropFrame.setVisible(true);
    this.textBand.setVisible(true);
  }

  _hideBackdrop() {
    this.backdrop?.setVisible(false);
    this.backdropFrame?.setVisible(false);
    this.textBand?.setVisible(false);
  }

  _publish(extra = {}) {
    const role = ROLES[this.roleIdx];
    window.__BRIDGE_DESIGN__ = {
      active: this.panel.visible,
      phase: this.phase,
      role: role ? role.key : null,
      candidateId: this.phase === 'choose' && this.candidates[this.candIdx] ? this.candidates[this.candIdx].id : null,
      candidateIndex: this.candIdx,
      candidates: this.candidates.map((c) => c.id),
      selection: { ...this.selection },
      ...extra,
    };
  }
}
