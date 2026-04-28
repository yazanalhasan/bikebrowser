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
    this.add.rectangle(b.x, b.y, b.w, b.h, 0x000000, 0.65).setDepth(100);

    const p = this.layout.panel;
    this.add.rectangle(p.x, p.y, p.w, p.h, 0xf8fafc, 0.98)
      .setStrokeStyle(3, 0x0f172a)
      .setDepth(101);

    const title = this.layout.title;
    this.add.text(title.x, title.y, this.explainer.title, {
      fontSize: '24px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#0f172a',
    }).setOrigin(0.5).setDepth(102);

    const close = this.layout.close;
    this.add.circle(close.x, close.y, close.r, 0xe2e8f0)
      .setStrokeStyle(2, 0x64748b)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._cancel())
      .setDepth(102);
    this.add.text(close.x, close.y, 'x', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#334155',
    }).setOrigin(0.5).setDepth(103);
  }

  _drawWheel() {
    const w = this.layout.wheel;
    const rim = this.layout.rim;
    const tube = this.layout.tube;
    const hole = this.layout.hole;

    this.wheelGfx = this.add.graphics().setDepth(102);
    this.wheelGfx.lineStyle(24, 0x111827, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, w.outerR);
    this.wheelGfx.lineStyle(rim.lineWidth, 0x94a3b8, 1);
    this.wheelGfx.strokeCircle(w.x, w.y, rim.r);
    this.wheelGfx.lineStyle(tube.lineWidth, 0x38bdf8, 0.75);
    this.wheelGfx.strokeCircle(w.x, w.y, tube.r);
    this.wheelGfx.fillStyle(0x334155, 1);
    this.wheelGfx.fillCircle(w.x, w.y, w.hubR);

    const spokeGfx = this.add.graphics().setDepth(102);
    spokeGfx.lineStyle(2, 0xcbd5e1, 0.85);
    for (const deg of [0, 30, 60, 90, 120, 150]) {
      const rad = Phaser.Math.DegToRad(deg);
      const dx = Math.cos(rad) * rim.r;
      const dy = Math.sin(rad) * rim.r;
      spokeGfx.lineBetween(w.x - dx, w.y - dy, w.x + dx, w.y + dy);
    }

    this.holeMarker = this.add.circle(hole.x, hole.y, hole.r, 0xef4444, 1)
      .setStrokeStyle(3, 0x7f1d1d)
      .setDepth(104);

    this.airParticles = this.layout.air_particles.map((p, index) => (
      this.add.circle(p.x, p.y, p.r, 0x93c5fd, 0.9)
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
    const body = this.add.rectangle(0, 0, patch.w, patch.h, 0xfacc15)
      .setStrokeStyle(3, 0xa16207);
    const text = this.add.text(0, 0, 'PATCH', {
      fontSize: '11px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#713f12',
    }).setOrigin(0.5);
    this.patch.add([body, text]);
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
    this.instructionText = this.add.text(instruction.x, instruction.y, '', {
      fontSize: '18px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#0f172a',
      align: 'center',
      wordWrap: { width: instruction.w },
    }).setOrigin(0.5).setDepth(105);

    this.feedbackText = this.add.text(feedback.x, feedback.y, '', {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#475569',
      align: 'center',
      wordWrap: { width: feedback.w },
    }).setOrigin(0.5).setDepth(105);

    this.stepPips = this.layout.step_pips.map((pip) => (
      this.add.circle(pip.x, pip.y, pip.r, 0xcbd5e1).setDepth(105)
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
    this.stepPips.forEach((pip, i) => {
      pip.setFillStyle(i < this._stepIndex ? 0x22c55e : i === this._stepIndex ? 0xf59e0b : 0xcbd5e1);
    });
  }

  _currentStep() {
    return this.explainer.steps[this._stepIndex] || null;
  }

  _showElement(element) {
    const labelKey = element.labelLayoutKey;
    const labelLayout = this.layout[labelKey];
    const area = this.layout[element.layoutKey];
    const highlight = this.add.rectangle(area.x, area.y, area.w, area.h, element.highlightColor, 0.16)
      .setStrokeStyle(3, element.highlightColor, 0.9)
      .setDepth(103);
    const label = this.add.text(labelLayout.x, labelLayout.y, `${element.label}\n${element.description}`, {
      fontSize: '12px',
      fontFamily: 'sans-serif',
      color: '#0f172a',
      backgroundColor: '#ffffff',
      padding: { x: 8, y: 6 },
      wordWrap: { width: labelLayout.w },
    }).setOrigin(0.5).setDepth(111);
    this._elementLabels.set(element.id, { highlight, label });
  }

  _hideElement(element) {
    const objects = this._elementLabels.get(element.id);
    if (!objects || this._solvedElements.has(element.id)) return;
    objects.highlight.destroy();
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
      this.holeMarker.setFillStyle(0xfacc15, 1).setStrokeStyle(3, 0xa16207);
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
}
