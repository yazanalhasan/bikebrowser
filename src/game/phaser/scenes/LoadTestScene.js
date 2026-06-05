import Phaser from 'phaser';
import { narratePanel } from '../audio/sceneNarration.js';
import { LOAD_SCENARIOS, StructuralModel, STRESS_COLORS } from '../systems/StructuralModel.js';

// Phase 3 — Load Testing & Stress Visualization. After the player designs a
// bridge, they watch it carry escalating loads (person → monsoon flood). Each
// member colors by stress (green/yellow/red/failed); the player steps through
// the scenarios and sees whether the design holds and WHY a weak member fails.
// Reachable via the `loadTest:start` event emitted after bridge design.
const FALLBACK_PLAN = { deck: 'bamboo', support: 'steel', brace: 'carbon_fiber' };

export default class LoadTestScene extends Phaser.Scene {
  constructor() {
    super('LoadTestScene');
  }

  create() {
    this.model = new StructuralModel();
    this.plan = FALLBACK_PLAN;
    this.idx = 0;
    this.done = false;

    this.panel = this.add.container(480, 210).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 600, 360, 0x111c16, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0x9fe0c0, 1);
    this.title = this.add.text(0, 14, '', { fontFamily: 'Arial', fontSize: '22px', color: '#eafef4', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.scenarioLabel = this.add.text(0, 46, '', { fontFamily: 'Arial', fontSize: '14px', color: '#bfe6d4' }).setOrigin(0.5, 0);
    this.bridgeGfx = this.add.graphics();
    this.verdict = this.add.text(0, 300, '', { fontFamily: 'Arial', fontSize: '17px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.teaching = this.add.text(0, 326, '', { fontFamily: 'Arial', fontSize: '12px', color: '#cfe6dc', wordWrap: { width: 540 }, align: 'center' }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 360, '', { fontFamily: 'Arial', fontSize: '12px', color: '#bcd6cc' }).setOrigin(0.5, 0);
    this.panel.add([bg, this.title, this.scenarioLabel, this.bridgeGfx, this.verdict, this.teaching, this.hint]);

    this.registry.events.on('loadTest:start', (plan) => this.startFlow(plan));
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow(plan) {
    const runtime = this.registry.get('act1Runtime');
    this.plan = plan || runtime?.constructionSystem?.getState()?.plan || FALLBACK_PLAN;
    this.idx = 0;
    this.done = false;
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._renderScenario();
    this._narrate();
  }

  _renderScenario() {
    const scenario = LOAD_SCENARIOS[this.idx];
    const result = this.model.solve(this.plan, scenario.id);
    this.lastResult = result;
    this.title.setText('Load Test — does the bridge hold?');
    this.scenarioLabel.setText(`Load ${this.idx + 1}/${LOAD_SCENARIOS.length}: ${scenario.label}`);
    this._drawBridge(result.members);
    if (result.verdict === 'hold') {
      this.verdict.setText(`✅ Holds the ${scenario.label} — max stress ${(result.maxStress * 100).toFixed(0)}%`);
      this.verdict.setColor('#9affc6');
    } else {
      const f = result.failedMember;
      this.verdict.setText(`💥 ${f ? f.label : 'A member'} fails (${f ? f.forceType : ''}) under the ${scenario.label}`);
      this.verdict.setColor('#ffb3b3');
    }
    // The teaching line: compression vs tension, concrete vs steel.
    const tm = result.teachingMoment;
    this.teaching.setText(tm && tm.concreteFails && tm.steelHolds
      ? 'Compression →← pushes in, tension ←→ pulls apart. Concrete cracks in a tension brace where steel holds the same pull.'
      : 'Each member is colored by stress: green safe, yellow strained, red near failure.');
    const atEnd = this.idx >= LOAD_SCENARIOS.length - 1 || result.verdict === 'fail';
    this.hint.setText(atEnd ? 'E to finish    Esc to leave' : 'E next load    Esc to leave');
    this._publish();
  }

  _drawBridge(members) {
    const g = this.bridgeGfx;
    g.clear();
    const ox = 0; const oy = 150; const sx = 1.4; const sy = 1.0;
    members.forEach((m) => {
      g.lineStyle(7, m.color ?? STRESS_COLORS.green, 1);
      g.beginPath();
      g.moveTo(ox + m.x1 * sx, oy + m.y1 * sy);
      g.lineTo(ox + m.x2 * sx, oy + m.y2 * sy);
      g.strokePath();
    });
  }

  onKey(event) {
    if (!this.panel.visible) return;
    const key = (event.key || '').toLowerCase();
    if (event.key === 'Escape') { this._finish(); return; }
    if (key === 'e' || event.code === 'Space') {
      const failed = this.lastResult && this.lastResult.verdict === 'fail';
      if (this.idx >= LOAD_SCENARIOS.length - 1 || failed) { this._finish(); return; }
      this.idx += 1;
      this._renderScenario();
      this._narrate();
    }
  }

  _finish() {
    this.done = true;
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('loadTest:done', { ok: Boolean(this.lastResult && this.lastResult.verdict === 'hold' && this.idx >= LOAD_SCENARIOS.length - 1) });
    this.registry.events.emit('quest:changed');
    this._publish();
  }

  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint, this.title] });
  }

  _publish() {
    const scenario = LOAD_SCENARIOS[this.idx];
    window.__LOAD_TEST__ = {
      active: this.panel.visible,
      scenarioId: scenario ? scenario.id : null,
      scenarioIndex: this.idx,
      verdict: this.lastResult ? this.lastResult.verdict : null,
      maxStress: this.lastResult ? this.lastResult.maxStress : null,
      plan: { ...this.plan },
      done: this.done,
    };
  }
}
