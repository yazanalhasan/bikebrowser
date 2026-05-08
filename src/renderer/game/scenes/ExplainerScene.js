import Phaser from 'phaser';
import { loadLayout } from '../utils/loadLayout.js';
import { getExplainer } from '../data/explainers/index.js';
import {
  cancelInteractiveExplainer,
  completeInteractiveExplainer,
} from '../systems/interactiveExplainerSystem.js';

export default class ExplainerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ExplainerScene' });
    this._stepIndex = 0;
    this._elementLabels = new Map();
  }

  init(data) {
    this._explainerId = data?.explainerId;
    this._returnSceneKey = data?.returnSceneKey;
    this._stepIndex = 0;
    this._advancing = false;
  }

  preload() {
    const explainer = getExplainer(this._explainerId);
    if (explainer) {
      this.load.json(explainer.layoutKey, explainer.layoutPath);
    }
  }

  create() {
    this.explainer = getExplainer(this._explainerId);
    if (!this.explainer) {
      this.scene.stop();
      return;
    }

    this.layout = loadLayout(this, this.explainer.layoutKey);
    this._elementLabels = new Map();
    this._zones = new Map();
    this._solvedElements = new Set();

    this._drawFrame();
    this._drawWheel();
    this._createElementZones();
    this._createPatch();
    this._createStepUi();
    this._renderStep();
  }

  _drawFrame() {
    const b = this.layout.backdrop;
    this.add.rectangle(b.x, b.y, b.w, b.h, 0x020617, 0.72).setDepth(100);

    const p = this.layout.panel;
    this._drawRoundedPanel(p.x + 8, p.y + 10, p.w, p.h, p.r || 18, 0x020617, 0.22, 0x020617, 0, 101);
    this._drawRoundedPanel(p.x, p.y, p.w, p.h, p.r || 18, 0xf8fafc, 0.98, 0xe2e8f0, 3, 102);
    this.add.rectangle(p.x, p.y - p.h / 2 + 58, p.w - 42, 1, 0xdbeafe, 0.9).setDepth(103);

    const title = this.layout.title;
    this._drawRoundedPanel(title.x, title.y, 310, 46, 18, 0xffffff, 0.85, 0xbfdbfe, 2, 103);
    this.add.text(title.x, title.y, this.explainer.title, {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#0f172a',
    }).setOrigin(0.5).setDepth(104);

    const close = this.layout.close;
    this._drawRoundedPanel(close.x, close.y, close.r * 2.2, close.r * 2.2, close.r, 0xffffff, 0.96, 0xcbd5e1, 2, 104);
    this.add.circle(close.x, close.y, close.r, 0xffffff, 0.01)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._cancel())
      .setDepth(105);
    this.add.text(close.x, close.y, 'x', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#334155',
    }).setOrigin(0.5).setDepth(106);
  }

  _drawWheel() {
    const w = this.layout.wheel;
    const rim = this.layout.rim;
    const tube = this.layout.tube;
    const hole = this.layout.hole;

    this.add.ellipse(w.x, w.y + w.outerR + 16, w.outerR * 1.62, 32, 0x020617, 0.14)
      .setDepth(101);

    this.wheelGfx = this.add.graphics().setDepth(102);

    this.wheelGfx.lineStyle(32, 0x020617, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, w.outerR);
    this.wheelGfx.lineStyle(20, 0x1f2937, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, w.outerR - 4);
    this.wheelGfx.lineStyle(2, 0x475569, 0.75);
    this.wheelGfx.strokeCircle(w.x, w.y, w.outerR - 20);

    const treadGfx = this.add.graphics().setDepth(103);
    treadGfx.fillStyle(0x111827, 0.95);
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = Phaser.Math.DegToRad(deg);
      const x = w.x + Math.cos(rad) * (w.outerR + 1);
      const y = w.y + Math.sin(rad) * (w.outerR + 1);
      treadGfx.save();
      treadGfx.translateCanvas(x, y);
      treadGfx.rotateCanvas(rad + Math.PI / 2);
      treadGfx.fillRoundedRect(-3, -10, 6, 20, 2);
      treadGfx.restore();
    }

    this.wheelGfx.lineStyle(10, 0xe2e8f0, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, rim.r);
    this.wheelGfx.lineStyle(rim.lineWidth, 0x94a3b8, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, rim.r - 4);
    this.wheelGfx.lineStyle(3, 0xffffff, 0.9);
    this.wheelGfx.strokeCircle(w.x, w.y, rim.r + 7);

    this.wheelGfx.lineStyle(tube.lineWidth, 0x38bdf8, 0.35);
    this.wheelGfx.strokeCircle(w.x, w.y, tube.r);
    this.wheelGfx.lineStyle(3, 0x0ea5e9, 0.8);
    this.wheelGfx.strokeCircle(w.x, w.y, tube.r);

    const spokeGfx = this.add.graphics().setDepth(102);
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = Phaser.Math.DegToRad(deg);
      const hubX = w.x + Math.cos(rad + 0.12) * (w.hubR + 5);
      const hubY = w.y + Math.sin(rad + 0.12) * (w.hubR + 5);
      const rimX = w.x + Math.cos(rad) * (rim.r - 9);
      const rimY = w.y + Math.sin(rad) * (rim.r - 9);
      spokeGfx.lineStyle(1.5, 0x94a3b8, 0.78);
      spokeGfx.lineBetween(hubX, hubY, rimX, rimY);
    }

    this.wheelGfx.fillStyle(0x0f172a, 1);
    this.wheelGfx.fillCircle(w.x, w.y, w.hubR + 12);
    this.wheelGfx.fillStyle(0x64748b, 1);
    this.wheelGfx.fillCircle(w.x, w.y, w.hubR + 5);
    this.wheelGfx.fillStyle(0xe2e8f0, 1);
    this.wheelGfx.fillCircle(w.x, w.y, w.hubR - 3);

    const valve = this.add.graphics().setDepth(104);
    valve.fillStyle(0x1f2937, 1);
    valve.fillRoundedRect(w.x - 4, w.y + rim.r - 6, 8, 34, 3);
    valve.fillStyle(0xf59e0b, 1);
    valve.fillRoundedRect(w.x - 3, w.y + rim.r + 18, 6, 10, 2);

    this.holePulse = [
      this.add.circle(hole.x, hole.y, hole.r + 10, 0xef4444, 0.18).setStrokeStyle(3, 0xef4444, 0.75).setDepth(104),
      this.add.circle(hole.x, hole.y, hole.r + 20, 0xef4444, 0.08).setStrokeStyle(2, 0xef4444, 0.5).setDepth(104),
    ];
    this.holeMarker = this.add.circle(hole.x, hole.y, hole.r, 0xef4444, 1)
      .setStrokeStyle(4, 0xffffff, 0.9)
      .setDepth(104);
    this.tweens.add({
      targets: this.holePulse,
      scale: 1.18,
      alpha: 0.18,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.airParticles = this.layout.air_particles.map((p, index) => (
      this.add.circle(p.x, p.y, p.r + 2, 0xbfdbfe, 0.65)
        .setStrokeStyle(2, 0x60a5fa, 0.8)
        .setDepth(104)
        .setAlpha(0.9 - index * 0.15)
    ));

    this.tweens.add({
      targets: this.airParticles,
      x: '+=18',
      y: '-=10',
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: this.tweens.stagger(120),
    });
  }

  _createElementZones() {
    const elementsBySpecificity = [...this.explainer.elements]
      .map((element) => {
        const area = this.layout[element.layoutKey];
        return { element, area, areaSize: (area?.w || 0) * (area?.h || 0) };
      })
      .sort((a, b) => b.areaSize - a.areaSize);

    for (const { element, area } of elementsBySpecificity) {
      const zone = this.add.zone(area.x, area.y, area.w, area.h)
        .setInteractive({ useHandCursor: true })
        .setDepth(110 + this._zones.size);

      zone.on('pointerover', () => this._showElement(element));
      zone.on('pointerout', () => this._hideElement(element));
      zone.on('pointerdown', () => this._handleElementClick(element));

      this._zones.set(element.id, zone);
    }
  }

  _createPatch() {
    const patch = this.layout.patch;
    this.patch = this.add.container(patch.x, patch.y).setDepth(108);
    const shadow = this.add.rectangle(4, 5, patch.w, patch.h, 0x713f12, 0.18);
    const body = this.add.graphics();
    body.fillStyle(0xfef3c7, 1);
    body.fillRoundedRect(-patch.w / 2, -patch.h / 2, patch.w, patch.h, patch.r || 8);
    body.lineStyle(3, 0xd97706, 0.9);
    body.strokeRoundedRect(-patch.w / 2, -patch.h / 2, patch.w, patch.h, patch.r || 8);
    body.lineStyle(2, 0xf59e0b, 0.45);
    body.lineBetween(-patch.w / 2 + 12, 0, patch.w / 2 - 12, 0);
    body.lineBetween(0, -patch.h / 2 + 8, 0, patch.h / 2 - 8);
    const text = this.add.text(0, 0, 'PATCH', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#92400e',
    }).setOrigin(0.5);
    this.patch.add([shadow, body, text]);
    this.patch.setSize(patch.w, patch.h);
    this.patch.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(this.patch);

    this.patch.on('drag', (_pointer, dragX, dragY) => {
      if (!this._currentStep()?.action) return;
      this.patch.setPosition(dragX, dragY);
    });

    this.patch.on('dragend', () => this._handlePatchDrop());
  }

  _createStepUi() {
    const instruction = this.layout.instruction;
    const feedback = this.layout.feedback;
    this.instructionCard = this._drawRoundedPanel(
      instruction.x,
      instruction.y,
      Math.min(instruction.w + 48, 620),
      58,
      18,
      0xffffff,
      0.92,
      0xbfdbfe,
      2,
      104,
    );
    this.instructionText = this.add.text(instruction.x, instruction.y, '', {
      fontSize: '20px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#0f172a',
      align: 'center',
      wordWrap: { width: instruction.w },
    }).setOrigin(0.5).setDepth(106);

    this.feedbackText = this.add.text(feedback.x, feedback.y, '', {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#475569',
      align: 'center',
      wordWrap: { width: feedback.w },
    }).setOrigin(0.5).setDepth(106);

    this.stepPips = this.layout.step_pips.map((pip) => (
      this.add.circle(pip.x, pip.y, pip.r + 2, 0xffffff, 0.95)
        .setStrokeStyle(2, 0xcbd5e1)
        .setDepth(106)
    ));
  }

  _renderStep() {
    const step = this._currentStep();
    if (!step) {
      this._complete();
      return;
    }

    this.instructionText.setText(step.instruction);
    this.feedbackText.setText('');
    this.patch.setAlpha(step.action === 'drag_patch' ? 1 : 0.35);
    this.patch.setScale(step.action === 'drag_patch' ? 1.1 : 1);
    this.stepPips.forEach((pip, i) => {
      pip.setFillStyle(i < this._stepIndex ? 0x22c55e : i === this._stepIndex ? 0x2563eb : 0xcbd5e1);
      pip.setStrokeStyle(2, i === this._stepIndex ? 0x1d4ed8 : 0xffffff);
    });
  }

  _currentStep() {
    return this.explainer.steps[this._stepIndex] || null;
  }

  _showElement(element) {
    if (this._elementLabels.has(element.id)) return;
    const labelKey = element.labelLayoutKey;
    const labelLayout = this.layout[labelKey];
    const area = this.layout[element.layoutKey];
    const highlight = this.add.ellipse(area.x, area.y, area.w, area.h, element.highlightColor, 0.13)
      .setStrokeStyle(4, element.highlightColor, 0.85)
      .setDepth(103);
    const labelBg = this._drawRoundedPanel(labelLayout.x, labelLayout.y, labelLayout.w + 18, 58, 10, 0xffffff, 0.96, element.highlightColor, 2, 110);
    const label = this.add.text(labelLayout.x, labelLayout.y, `${element.label}\n${element.description}`, {
      fontSize: '12px',
      fontFamily: 'sans-serif',
      color: '#0f172a',
      padding: { x: 8, y: 6 },
      wordWrap: { width: labelLayout.w },
    }).setOrigin(0.5).setDepth(111);
    this._elementLabels.set(element.id, { highlight, labelBg, label });
  }

  _hideElement(element) {
    const objects = this._elementLabels.get(element.id);
    if (!objects || this._solvedElements.has(element.id)) return;
    objects.highlight.destroy();
    objects.labelBg.destroy();
    objects.label.destroy();
    this._elementLabels.delete(element.id);
  }

  _handleElementClick(element) {
    const step = this._currentStep();
    if (!step || step.action || this._advancing) return;

    if (step.target === element.id) {
      this._solvedElements.add(element.id);
      this._success(step.success);
    } else {
      this._wrong(step.hint);
    }
  }

  _handlePatchDrop() {
    const step = this._currentStep();
    if (step?.action !== 'drag_patch' || this._advancing) return;

    const hole = this.layout.hole;
    const distance = Phaser.Math.Distance.Between(this.patch.x, this.patch.y, hole.x, hole.y);
    if (distance <= hole.r + 34) {
      this.patch.setPosition(hole.x, hole.y);
      this.airParticles.forEach((p) => p.setVisible(false));
      this.holePulse.forEach((p) => p.setVisible(false));
      this.holeMarker.setFillStyle(0xfacc15, 1).setStrokeStyle(4, 0xd97706);
      this._success(step.success);
    } else {
      this._wrong(step.hint);
    }
  }

  _success(message) {
    if (this._advancing) return;
    this._advancing = true;
    this.feedbackText.setColor('#15803d').setText(message || 'Correct.');
    this.registry.get('audioManager')?.playSfx?.('ui_success');
    this.cameras.main.flash(120, 34, 197, 94, false);
    this.time.delayedCall(750, () => {
      this._stepIndex += 1;
      this._advancing = false;
      this._renderStep();
    });
  }

  _wrong(message) {
    this.feedbackText.setColor('#b45309').setText(message || 'Try another part.');
    this.registry.get('audioManager')?.playSfx?.('ui_error');
    this.tweens.add({
      targets: this.instructionText,
      x: '+=8',
      duration: 45,
      yoyo: true,
      repeat: 3,
    });
  }

  _complete() {
    completeInteractiveExplainer(this, {
      explainerId: this._explainerId,
      returnSceneKey: this._returnSceneKey,
    });
  }

  _cancel() {
    cancelInteractiveExplainer(this, {
      returnSceneKey: this._returnSceneKey,
    });
  }

  _drawRoundedPanel(x, y, w, h, r, fill, alpha, stroke, strokeWidth, depth) {
    const gfx = this.add.graphics().setDepth(depth);
    gfx.fillStyle(fill, alpha);
    gfx.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    if (strokeWidth > 0) {
      gfx.lineStyle(strokeWidth, stroke, 0.95);
      gfx.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    }
    return gfx;
  }
}
