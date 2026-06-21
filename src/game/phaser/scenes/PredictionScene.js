import Phaser from 'phaser';
import { act1Materials } from '../../data/act1/index.js';
import { narratePanel, narrateText } from '../audio/sceneNarration.js';
import { ASSET_KEYS } from '../systems/AssetRegistry.js';
import { materialVis, drawMaterialTexture } from '../systems/materialVisuals.js';

const UTM_MATERIAL_IDS = act1Materials.map((material) => material.id);

// Player-facing predict-before-test UTM loop. Each tested material now draws its
// stress-strain curve from the material catalog so strength, stiffness, and
// brittle/ductile failure are visible evidence, not just text.
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

    this.panel = this.add.container(480, 210).setScrollFactor(0).setDepth(1400).setVisible(false);
    const bg = this.add.rectangle(0, 0, 600, 382, 0x10243a, 0.97).setOrigin(0.5, 0).setStrokeStyle(4, 0x7fd1ff, 1);
    this.backdrop = this.add.image(0, 82, ASSET_KEYS.utmRigBackdrop).setOrigin(0.5, 0).setDisplaySize(538, 126).setVisible(false);
    this.backdropFrame = this.add.rectangle(0, 82, 542, 130, 0x000000, 0).setOrigin(0.5, 0).setStrokeStyle(3, 0x7fd1ff, 0.92).setVisible(false);
    this.textBand = this.add.rectangle(0, 8, 580, 72, 0x10243a, 0.82).setOrigin(0.5, 0).setVisible(false);
    this.title = this.add.text(0, 18, '', { fontFamily: 'Arial', fontSize: '22px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5, 0);

    this.chips = this.add.container(0, 96);
    this.holdBg = this.add.rectangle(-130, 0, 200, 84, 0x1f7a3a, 1).setStrokeStyle(4, 0x9affb0, 0);
    this.breakBg = this.add.rectangle(130, 0, 200, 84, 0x9a2f2f, 1).setStrokeStyle(4, 0xffb0b0, 0);
    this.chips.add([
      this.holdBg, this.add.text(-130, -8, 'HOLD', { fontFamily: 'Arial', fontSize: '24px', color: '#eafff0', fontStyle: 'bold' }).setOrigin(0.5), this.add.text(-130, 24, 'carries load', { fontFamily: 'Arial', fontSize: '13px', color: '#c8ffd6' }).setOrigin(0.5),
      this.breakBg, this.add.text(130, -8, 'BREAK', { fontFamily: 'Arial', fontSize: '24px', color: '#fff0f0', fontStyle: 'bold' }).setOrigin(0.5), this.add.text(130, 24, 'fails early', { fontFamily: 'Arial', fontSize: '13px', color: '#ffd2d2' }).setOrigin(0.5),
    ]);
    this.sureLabel = this.add.text(0, 158, 'how sure?', { fontFamily: 'Arial', fontSize: '12px', color: '#bcd6ec' }).setOrigin(0.5);
    this.sureDots = [0, 1, 2].map((i) => this.add.circle(-18 + i * 18, 180, 7, 0x4a6076).setStrokeStyle(2, 0x9fc3e0));

    // The sample under test. Its fill now carries MATERIAL IDENTITY (family
    // colour + a texture in beamGrain) instead of a generic blue bar; the verdict
    // rides on the outline + the stress-strain curve + the text. beamGrain shares
    // the beam's tween targets so the grain bends/droops with it under load.
    this.beam = this.add.rectangle(0, 160, 240, 16, 0x9fc3e0).setOrigin(0.5).setVisible(false);
    this.beamGrain = this.add.graphics({ x: 0, y: 160 }).setVisible(false);
    this.beamLeft = this.add.rectangle(0, 160, 122, 16, 0xff6b6b).setOrigin(1, 0.5).setVisible(false);
    this.beamRight = this.add.rectangle(0, 160, 122, 16, 0xff6b6b).setOrigin(0, 0.5).setVisible(false);
    this.weight = this.add.text(0, 130, 'LOAD', { fontFamily: 'Arial', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);

    this.curveGraphics = this.add.graphics({ x: -250, y: 216 }).setVisible(false);
    this.curveTitle = this.add.text(-250, 218, '', { fontFamily: 'Arial', fontSize: '12px', color: '#d8ecff', fontStyle: 'bold' }).setOrigin(0, 0).setVisible(false);
    this.curveCaption = this.add.text(0, 332, '', { fontFamily: 'Arial', fontSize: '12px', color: '#cfe6fb', wordWrap: { width: 520 }, align: 'center' }).setOrigin(0.5, 0).setVisible(false);

    this.verdict = this.add.text(0, 268, '', { fontFamily: 'Arial', fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.explain = this.add.text(0, 294, '', { fontFamily: 'Arial', fontSize: '13px', color: '#cfe6fb', wordWrap: { width: 520 }, align: 'center' }).setOrigin(0.5, 0);
    this.hint = this.add.text(0, 364, 'Left/Right pick    Up/Down confidence    E test    Esc leave', { fontFamily: 'Arial', fontSize: '12px', color: '#9fc3e0' }).setOrigin(0.5);

    this.panel.add([bg, this.backdrop, this.backdropFrame, this.textBand, this.title, this.chips, this.sureLabel, ...this.sureDots, this.beam, this.beamGrain, this.beamLeft, this.beamRight, this.weight, this.curveGraphics, this.curveTitle, this.curveCaption, this.verdict, this.explain, this.hint]);

    this.registry.events.on('prediction:start', (materialIds) => this.startFlow(materialIds));
    this.keyHandler = (event) => this.onKey(event);
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', () => window.removeEventListener('keydown', this.keyHandler));
    this._publish();
  }

  startFlow(materialIds) {
    const runtime = this.registry.get('act1Runtime');
    const all = Array.isArray(materialIds) && materialIds.length ? materialIds : UTM_MATERIAL_IDS;
    this.queue = all.filter((id) => runtime?.inventorySystem?.has(id));
    if (!this.queue.length) return;
    this.index = 0;
    this.results = [];
    this.registry.set('modalActive', true);
    this.panel.setVisible(true);
    this._showChoose();
  }

  _resetBeam() {
    this.beam.setVisible(true).setPosition(0, 160).setAngle(0).setFillStyle(0x9fc3e0).setStrokeStyle();
    this.beamLeft.setVisible(false).setPosition(0, 160).setAngle(0);
    this.beamRight.setVisible(false).setPosition(0, 160).setAngle(0);
    this.weight.setVisible(false).setY(130);
    if (this.beamGrain) this.beamGrain.setVisible(false).clear().setPosition(0, 160).setAngle(0);
  }

  // Paint the current material onto the beam: family fill + procedural texture,
  // so the player sees WHAT they are about to test, not a generic bar.
  _dressBeam(materialId) {
    const vis = materialVis(materialId);
    this._beamVis = vis;
    this.beam.setFillStyle(vis.base).setStrokeStyle(3, 0x10243a, 0.55);
    this.beamGrain.setVisible(true).setPosition(0, 160).setAngle(0);
    drawMaterialTexture(this.beamGrain, vis, 116, 6, false);
  }

  _showChoose() {
    this.phase = 'choose';
    this._setBackdrop(ASSET_KEYS.utmRigBackdrop);
    this._clearCurve();
    this.guess = 'hold';
    this.confidence = 2;
    const id = this.queue[this.index];
    const runtime = this.registry.get('act1Runtime');
    const material = runtime?.materialsLabSystem?.materials.get(id);
    const name = material?.displayName || material?.name || id;
    this.title.setText(`(${this.index + 1}/${this.queue.length}) Will ${name} hold the load?`);
    this.chips.setVisible(true);
    this.sureLabel.setVisible(true);
    this.sureDots.forEach((d) => d.setVisible(true));
    this._resetBeam();
    this._dressBeam(id);
    this.verdict.setText('');
    this.explain.setText('');
    this.hint.setText('Left/Right pick    Up/Down confidence    E test    Esc leave');
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
    const band = result.strengthBand;
    const safe = Boolean(result.bridgeSafe);
    const matched = willHold === safe;
    const name = result.displayName || id;
    const outcome = band === 'strong candidate' ? 'hold' : band === 'useful with limits' ? 'bend' : 'break';
    this.chips.setVisible(false);
    this.sureLabel.setVisible(false);
    this.sureDots.forEach((d) => d.setVisible(false));
    this.weight.setVisible(true);
    this._animateBeam(outcome);
    this._setBackdrop(ASSET_KEYS.utmRigBackdrop);
    this._drawCurve(result);
    const faces = { hold: 'it held', bend: 'it bent, but held', break: 'it failed' };
    this.verdict.setText(`${matched ? 'match' : 'revise'}: you said ${willHold ? 'hold' : 'break'} - ${faces[outcome]}`);
    this.verdict.setColor(matched ? '#9affb0' : '#ffd27f');
    this.explain.setText(`${name}: ${result.verdict || ''}`);
    this.hint.setText(this.index < this.queue.length - 1 ? 'E next material    Esc leave' : 'E summary    Esc leave');
    this.phase = 'result';
    this.results.push({ id, name, outcome, matched, safe, curve: result.curve });
    this._publish({ outcome, matched, materialId: id, curve: result.curve });
    this._narrate();
  }

  _animateBeam(outcome) {
    // Fill stays the material's colour throughout — the verdict is the outline:
    // green (held), amber (bent but held), or the snapped red-edged halves.
    const vis = this._beamVis || materialVis(this.queue[this.index]);
    this.tweens.add({ targets: this.weight, y: 160, duration: 260, ease: 'Quad.easeIn', yoyo: outcome !== 'break', hold: 40 });
    if (outcome === 'hold') {
      this.beam.setStrokeStyle(4, 0x9affb0, 1);
      this.tweens.add({ targets: [this.beam, this.beamGrain], y: 166, duration: 200, ease: 'Quad.easeOut', yoyo: true });
    } else if (outcome === 'bend') {
      this.beam.setStrokeStyle(4, 0xffd27f, 1);
      this.tweens.add({ targets: [this.beam, this.beamGrain], angle: 7, y: 168, duration: 320, ease: 'Sine.easeOut', yoyo: true, hold: 120 });
    } else {
      this.beam.setVisible(false);
      this.beamGrain.setVisible(false);
      // The sample snaps — the broken halves keep the material colour with a raw
      // red fracture edge, so the player sees WHAT failed, not just a red bar.
      this.beamLeft.setVisible(true).setPosition(0, 160).setFillStyle(vis.base).setStrokeStyle(3, 0x9a2f1a, 1);
      this.beamRight.setVisible(true).setPosition(0, 160).setFillStyle(vis.base).setStrokeStyle(3, 0x9a2f1a, 1);
      this.tweens.add({ targets: this.beamLeft, angle: 24, y: 178, duration: 300, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.beamRight, angle: -24, y: 178, duration: 300, ease: 'Back.easeOut' });
    }
  }

  _drawCurve(result = {}) {
    const curve = result.curve;
    this.curveGraphics.clear();
    if (!curve) { this._clearCurve(); return; }
    this.curveGraphics.setVisible(true);
    this.curveTitle.setVisible(true).setText('stress-strain curve');
    this.curveCaption.setVisible(true).setText(`${result.curveLesson || ''} Compression: ${result.notes?.compression || ''} Tension: ${result.notes?.tension || ''}`);

    const w = 500;
    const h = 92;
    const pad = 12;
    const x0 = pad;
    const y0 = h - pad;
    const xMax = w - pad;
    const yMax = pad;
    const maxStress = 10;
    const maxStrain = 0.24;
    const toX = (strain) => x0 + Math.min(strain / maxStrain, 1) * (xMax - x0);
    const toY = (stress) => y0 - Math.min(stress / maxStress, 1) * (y0 - yMax);
    const elasticX = toX(curve.elasticLimit);
    const elasticY = toY(Math.min(curve.ultimateStress * 0.72, curve.ultimateStress));
    const ultimateX = toX(curve.strainAtFailure * 0.82);
    const ultimateY = toY(curve.ultimateStress);
    const failureX = toX(curve.strainAtFailure);
    const failureY = toY(Math.max(curve.ultimateStress * 0.18, 0.4));

    this.curveGraphics.fillStyle(0x071524, 0.84).fillRoundedRect(0, 0, w, h, 6);
    this.curveGraphics.lineStyle(2, 0x9fc3e0, 0.75).lineBetween(x0, yMax, x0, y0).lineBetween(x0, y0, xMax, y0);
    this.curveGraphics.lineStyle(1, 0x31516c, 0.7);
    for (let i = 1; i <= 4; i += 1) {
      const gx = x0 + ((xMax - x0) * i) / 4;
      const gy = y0 - ((y0 - yMax) * i) / 4;
      this.curveGraphics.lineBetween(gx, yMax, gx, y0).lineBetween(x0, gy, xMax, gy);
    }
    this.curveGraphics.lineStyle(4, result.bridgeSafe ? 0x9affb0 : 0xff9b9b, 1);
    this.curveGraphics.beginPath();
    this.curveGraphics.moveTo(x0, y0);
    this.curveGraphics.lineTo(elasticX, elasticY);
    this.curveGraphics.lineTo(ultimateX, ultimateY);
    this.curveGraphics.lineTo(failureX, failureY);
    this.curveGraphics.strokePath();
    this.curveGraphics.fillStyle(0xffd27f, 1).fillCircle(elasticX, elasticY, 4);
    this.curveGraphics.fillStyle(0xffffff, 1).fillCircle(ultimateX, ultimateY, 4);
    this.curveGraphics.fillStyle(0xff6b6b, 1).fillCircle(failureX, failureY, 4);
    this.curveGraphics.fillStyle(0xcfe6fb, 1);
    this.curveGraphics.fillRect(32, h - 8, 58, 2);
  }

  _clearCurve() {
    this.curveGraphics.clear().setVisible(false);
    this.curveTitle.setVisible(false).setText('');
    this.curveCaption.setVisible(false).setText('');
  }

  _advance() {
    if (this.index < this.queue.length - 1) {
      this.index += 1;
      this._showChoose();
      return;
    }
    this._showSummary();
  }

  _showSummary() {
    this.phase = 'summary';
    this._hideBackdrop();
    this._clearCurve();
    this.chips.setVisible(false);
    this.sureLabel.setVisible(false);
    this.sureDots.forEach((d) => d.setVisible(false));
    this.beam.setVisible(false); this.beamGrain.setVisible(false); this.beamLeft.setVisible(false); this.beamRight.setVisible(false); this.weight.setVisible(false);
    const held = this.results.filter((r) => r.outcome !== 'break').length;
    const failed = this.results.filter((r) => r.outcome === 'break').length;
    const right = this.results.filter((r) => r.matched).length;
    this.title.setText('UTM material results');
    this.verdict.setText(`${held} carried load - ${failed} failed - predictions ${right}/${this.results.length}`);
    this.verdict.setColor('#eaf6ff');
    this.explain.setText('Compression squeezes. Tension pulls. Strong materials are not always light, stiff materials are not always tough, and concrete needs tension help.');
    this.hint.setText('E to close');
    this._publish();
    this._narrate();
  }

  _finish() {
    this.phase = 'idle';
    this._hideBackdrop();
    this._clearCurve();
    this.panel.setVisible(false);
    this.registry.set('modalActive', false);
    this.registry.events.emit('quest:changed');
    this.registry.events.emit('prediction:done');
    this._publish();
  }

  _narrate() {
    narratePanel(this, this.panel, { exclude: [this.hint, this.title] });
  }

  _setBackdrop(key) {
    if (!key) { this._hideBackdrop(); return; }
    this.backdrop.setTexture(this.textures.exists('bg_utm') ? 'bg_utm' : key).setOrigin(0.5, 0).setDisplaySize(538, 126).setVisible(true);
    this.backdropFrame.setVisible(true);
    this.textBand.setVisible(true);
  }

  _hideBackdrop() {
    this.backdrop?.setVisible(false);
    this.backdropFrame?.setVisible(false);
    this.textBand?.setVisible(false);
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
      results: this.results.map((r) => ({ id: r.id, outcome: r.outcome, matched: r.matched, curve: r.curve })),
      ...extra,
    };
  }
}
