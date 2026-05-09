import { DEPTHS, LABEL_STYLE, PALETTE } from '../art/artConfig.js';

export class WorldLabel {
  constructor(scene, x, y, text, options = {}) {
    this.scene = scene;
    this.target = null;
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 0;
    this.distanceTarget = options.distanceTarget || null;
    this.maxDistance = options.maxDistance ?? null;
    this.minZoom = options.minZoom ?? 0;
    this.baseScale = options.scale ?? 1;
    this.pointer = options.pointer ?? false;
    this.visible = true;

    const style = { ...LABEL_STYLE, ...options.style };
    const icon = options.icon ? `${options.icon} ` : '';
    const display = `${icon}${text}`;
    const fontSize = options.fontSize || style.fontSize;
    const width = Math.min(
      options.maxWidth || 164,
      Math.max(options.minWidth || 48, display.length * (fontSize * 0.58) + style.paddingX * 2),
    );
    const height = fontSize + style.paddingY * 2;

    this.container = scene.add.container(x, y).setDepth(options.depth ?? DEPTHS.labels);
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(style.shadowColor, 0.16);
    this.shadow.fillRoundedRect(-width / 2 + 2, -height / 2 + 3, width, height, style.radius);

    this.background = scene.add.graphics();
    this.background.fillStyle(style.backgroundColor, style.alpha);
    this.background.fillRoundedRect(-width / 2, -height / 2, width, height, style.radius);
    this.background.lineStyle(1, style.borderColor, 0.95);
    this.background.strokeRoundedRect(-width / 2, -height / 2, width, height, style.radius);

    this.text = scene.add.text(0, 0, display, {
      fontFamily: style.fontFamily,
      fontSize: `${fontSize}px`,
      fontStyle: style.fontStyle,
      color: style.textColor,
      align: 'center',
      fixedWidth: width - style.paddingX,
    }).setOrigin(0.5);

    this.container.add([this.shadow, this.background, this.text]);

    if (this.pointer) {
      this.arrow = scene.add.triangle(0, height / 2 + 4, -5, 0, 5, 0, 0, 7, PALETTE.uiCream, 0.94);
      this.container.add(this.arrow);
    }

    this._updateScale();
    this._event = scene.events.on('update', this.update, this);
  }

  setTarget(gameObject, offsetX = this.offsetX, offsetY = this.offsetY) {
    this.target = gameObject;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    return this;
  }

  setDistanceVisibility(target, maxDistance) {
    this.distanceTarget = target;
    this.maxDistance = maxDistance;
    return this;
  }

  fadeIn(duration = 160) {
    this.visible = true;
    this.container.setVisible(true);
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration, ease: 'Quad.easeOut' });
    return this;
  }

  fadeOut(duration = 160) {
    this.visible = false;
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!this.visible) this.container.setVisible(false);
      },
    });
    return this;
  }

  _updateScale() {
    const zoom = this.scene.cameras?.main?.zoom || 1;
    const scale = this.baseScale / Math.max(zoom, 0.001);
    this.container.setScale(scale);
  }

  update() {
    if (!this.container?.active) return;
    if (this.target?.active !== false && this.target?.x !== undefined) {
      this.container.setPosition(this.target.x + this.offsetX, this.target.y + this.offsetY);
    }

    this._updateScale();

    const zoom = this.scene.cameras?.main?.zoom || 1;
    const zoomVisible = zoom >= this.minZoom;
    let distanceVisible = true;
    if (this.distanceTarget && this.maxDistance && this.target) {
      const dx = this.distanceTarget.x - this.target.x;
      const dy = this.distanceTarget.y - this.target.y;
      distanceVisible = Math.sqrt(dx * dx + dy * dy) <= this.maxDistance;
    }

    const shouldShow = zoomVisible && distanceVisible && this.visible;
    this.container.setVisible(shouldShow);
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    this.container.destroy();
  }
}

export function createWorldLabel(scene, x, y, text, options = {}) {
  return new WorldLabel(scene, x, y, text, options);
}
