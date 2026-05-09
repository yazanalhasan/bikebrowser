import { DEPTHS, PALETTE } from '../art/artConfig.js';

export class InteractionMarker {
  constructor(scene, x, y, type = 'inspect', options = {}) {
    this.scene = scene;
    this.type = type;
    this.container = scene.add.container(x, y).setDepth(options.depth ?? DEPTHS.interaction);
    this._build(type);
    if (options.pulse !== false) this._pulse();
  }

  _build(type) {
    const g = this.scene.add.graphics();
    const colors = {
      quest: PALETTE.uiAccentGold,
      blocked: PALETTE.dangerRed,
      success: PALETTE.successGreen,
      inspect: PALETTE.uiAccentBlue,
    };
    const color = colors[type] || colors.inspect;

    g.fillStyle(color, 0.18);
    g.fillCircle(0, 0, 15);
    g.lineStyle(3, color, 0.9);
    g.strokeCircle(0, 0, 11);
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(0, 0, 7);
    g.fillStyle(color, 1);

    if (type === 'quest') {
      g.fillCircle(0, -4, 2);
      g.fillRoundedRect(-1.5, -1, 3, 7, 1.5);
    } else if (type === 'blocked') {
      g.lineStyle(3, color, 1);
      g.lineBetween(-5, -5, 5, 5);
      g.lineBetween(5, -5, -5, 5);
    } else if (type === 'success') {
      g.lineStyle(3, color, 1);
      g.lineBetween(-5, 0, -1, 5);
      g.lineBetween(-1, 5, 7, -6);
    } else {
      g.lineStyle(2, color, 1);
      g.strokeCircle(-2, -2, 4);
      g.lineBetween(2, 2, 7, 7);
    }

    this.container.add(g);
  }

  setTarget(target, offsetX = 0, offsetY = -28) {
    this.target = target;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.scene.events.on('update', this.update, this);
    return this;
  }

  update() {
    if (!this.target?.active) return;
    this.container.setPosition(this.target.x + this.offsetX, this.target.y + this.offsetY);
  }

  _pulse() {
    this.scene.tweens.add({
      targets: this.container,
      scale: { from: 0.92, to: 1.08 },
      alpha: { from: 0.84, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 650,
      ease: 'Sine.easeInOut',
    });
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    this.container.destroy();
  }
}

export function createInteractionMarker(scene, x, y, type = 'inspect', options = {}) {
  return new InteractionMarker(scene, x, y, type, options);
}
