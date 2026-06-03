import Phaser from 'phaser';

// Phase 2.4 — Multi-Biome. A reachable biome (Salt River) that carries the full
// loop: read the biome's new rules, then for each site OBSERVE -> PREDICT which
// option suits it -> SEE the outcome -> get the PAYOFF (why + a discovery). Gated
// behind the wider map (repair the bridge); locked entry gives clear feedback,
// never silence. Same overlay + modal-guard pattern as the other loops.
const BIOME_ID = 'salt_river';

export default class BiomeScene extends Phaser.Scene {
  constructor() {
    super('BiomeScene');
  }

  create() {
    this.phase = 'idle'; // idle | blocked | intro | observe | predict | result | summary
    this.biomeId = BIOME_ID;
    this.queue = [];
    this.index = 0;
    this.options = [];
    this.optIdx = 0;
    this.results = [];

    this.panel = this.add.container(480, 188).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 640, 410, 0x0f1a24, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0x7fd1ff, 1);
    this.title = this.add.text(0, 16, '', { fontFamily: 'Arial', fontSize: '21px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.body = this.add.text(0, 50, '', { fontFamily: 'Arial', fontSize: '14px', color: '#bcd6ec', align: 'center', wordWrap: { width: 580 } }).setOrigin(0.5, 0);
    this.conditions = this.add.text(0, 120, '', { fontFamily: 'Arial', fontSize: '12px', color: '#8fb8d6', align: 'center', wordWrap: { width: 580 } }).setOrigin(0.5, 0);

    this.card = this.add.container(0, 178);
    this.cardBg = this.add.rectangle(0, 0, 380, 56, 0x1a2c3a, 1).setStrokeStyle(3, 0x7fd1ff, 1);
    this.optName = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.card.add([this.cardBg, this.optName,
      this.add.text(-206, 0, '◀', { fontSize: '20px', color: '#7fd1ff' }).setOrigin(0.5),
      this.add.text(206, 0, '▶', { fontSize: '20px', color: '#7fd1ff' }).setOrigin(0.5)]);

    this.verdict = this.add.text(0, 250, '', { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold', align: 'center', wordWrap: { width: 580 } }).setOrigin(0.5, 0);
    this.why = this.add.text(0, 300, '', { fontFamily: 'Arial', fontSize: '13px', color: '#cfe6fb', align: 'center', wordWrap: { width: 580 } }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 384, '', { fontFamily: 'Arial', fontSize: '12px', color: '#8fb8d6' }).setOrigin(0.5, 0);

    this.panel.add([bg, this.title, this.body, this.conditions, this.card, this.verdict, this.why, this.hint]);

    this.registry.events.on('biome:start', (biomeId) => this.startFlow(biomeId));
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow(biomeId) {
    const runtime = this.registry.get('act1Runtime');
    if (!runtime) return;
    this.biomeId = biomeId || BIOME_ID;
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    const entered = runtime.enterBiome(this.biomeId);
    if (!entered.ok) { this._showBlocked(); return; }
    this.biome = entered.biome;
    this.queue = entered.biome.placements.slice();
    this.index = 0;
    this.results = [];
    this._showIntro();
  }

  _showBlocked() {
    this.phase = 'blocked';
    this.card.setVisible(false);
    this.title.setText('Salt River — beyond the wider map');
    this.body.setText('This biome is past the broken crossing. Repair the bridge to open the route, then come back.');
    this.conditions.setText('');
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('E or Esc to head back');
    this._publish();
  }

  _showIntro() {
    this.phase = 'intro';
    this.card.setVisible(false);
    this.title.setText(this.biome.name);
    this.body.setText(this.biome.intro);
    this.conditions.setText('');
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('E to explore the river    Esc to leave');
    this._publish();
  }

  _showObserve() {
    this.phase = 'observe';
    const runtime = this.registry.get('act1Runtime');
    const obs = runtime.observeBiomePlacement(this.biomeId, this.queue[this.index]);
    if (!obs.ok) { this._finish(); return; }
    this.placement = obs.placement;
    this.options = obs.placement.options;
    this.optIdx = 0;
    this.title.setText(`${this.biome.name}  (${this.index + 1}/${this.queue.length})`);
    this.body.setText(`You see: ${obs.placement.site}`);
    this.conditions.setText(`conditions — ${obs.placement.conditions.join(' · ')}`);
    this.card.setVisible(false);
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('E to choose    Esc to leave');
    this._publish();
  }

  _showPredict() {
    this.phase = 'predict';
    this.card.setVisible(true);
    this.body.setText(this.placement.kind === 'engineering' ? 'Which material suits this site? (you can be wrong — you will see)' : 'Which plant suits this site? (you can be wrong — you will see)');
    this.verdict.setText('');
    this.why.setText('');
    this.hint.setText('◀ ▶ pick    E decide    Esc leave');
    this._renderCard();
    this._publish();
  }

  _renderCard() {
    this.optName.setText(this.options[this.optIdx] || '');
  }

  _commit() {
    const runtime = this.registry.get('act1Runtime');
    const placementId = this.queue[this.index];
    const optionId = this.options[this.optIdx];
    runtime.predictBiomePlacement(this.biomeId, placementId, optionId);
    const result = runtime.resolveBiomePlacement(this.biomeId, placementId);
    if (!result.ok) return;
    this.phase = 'result';
    this.card.setVisible(false);
    this.body.setText('');
    this.verdict.setText(result.thrives ? `✅ ${result.predictedId} suits the ${this.biome.name}.` : `🥀 ${result.predictedId} does not last here. ${result.correct} is the fit.`);
    this.verdict.setColor(result.thrives ? '#9affb0' : '#ffd27a');
    this.why.setText(result.thrives ? result.why : `${result.why}  Why ${result.correct} fits: ${result.correctWhy}`);
    this.hint.setText(this.index < this.queue.length - 1 ? 'E for the next site    Esc leave' : 'E for your field notes    Esc leave');
    this.results.push({ id: placementId, thrives: result.thrives });
    this._publish({ thrives: result.thrives, discovery: result.discovery?.id || null, payoff: true });
  }

  _advance() {
    if (this.index < this.queue.length - 1) { this.index += 1; this._showObserve(); return; }
    this._showSummary();
  }

  _showSummary() {
    this.phase = 'summary';
    this.card.setVisible(false);
    const good = this.results.filter((r) => r.thrives).length;
    this.title.setText(`${this.biome.name} — field notes`);
    this.body.setText('');
    this.conditions.setText('');
    this.verdict.setText(`${good}/${this.results.length} good fits on your first pick`);
    this.verdict.setColor('#eaf6ff');
    this.why.setText('A new biome has new rules: salt-tolerant life on the banks, corrosion-proof metal in the water. Your notebook remembers them.');
    this.hint.setText('E to close');
    this._publish({ payoff: true });
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    const advance = key === 'e' || event.code === 'Space';
    if (this.phase === 'blocked') { if (advance) this._finish(); }
    else if (this.phase === 'intro') { if (advance) this._showObserve(); }
    else if (this.phase === 'observe') { if (advance) this._showPredict(); }
    else if (this.phase === 'predict') {
      if (event.key === 'ArrowLeft' || key === 'a') { this.optIdx = (this.optIdx - 1 + this.options.length) % this.options.length; this._renderCard(); this._publish(); }
      else if (event.key === 'ArrowRight' || key === 'd') { this.optIdx = (this.optIdx + 1) % this.options.length; this._renderCard(); this._publish(); }
      else if (advance) { this._commit(); }
    }
    else if (this.phase === 'result') { if (advance) this._advance(); }
    else if (this.phase === 'summary') { if (advance) this._finish(); }
  }

  _finish() {
    this.phase = 'idle';
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('biome:done');
    this._publish();
  }

  _publish(extra = {}) {
    window.__BIOME__ = {
      active: this.panel.visible,
      phase: this.phase,
      biomeId: this.biomeId,
      placementId: this.queue[this.index] || null,
      optionId: this.options[this.optIdx] || null,
      optionIndex: this.optIdx,
      options: this.options.slice(),
      index: this.index,
      total: this.queue.length,
      resolvedCount: this.results.length,
      goodCount: this.results.filter((r) => r.thrives).length,
      ...extra,
    };
  }
}
