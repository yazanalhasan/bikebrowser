import { DEPTHS, LABEL_STYLE, PALETTE } from '../art/artConfig.js';

export class WorldLabel {
  constructor(scene, x, y, text, options = {}) {
    this.scene = scene;
    this.target = null;
    this.offsetX = options.offsetX ?? 0;
    this.offsetY = options.offsetY ?? 0;
    this.distanceTarget = options.distanceTarget || null;
    this.maxDistance = options.maxDistance ?? null;
    /**
     * Proximity gate. When set, the label is only shown while the player
     * (or an explicit `distanceTarget`) is within this many world pixels of
     * the label's anchor. A young child reads a screen far better when only
     * the thing they are standing next to is named, so scenes that would
     * otherwise print a dozen captions at once pass this.
     *
     * `nearRadiusRelease` adds hysteresis so a label does not flicker when
     * the player walks the boundary.
     */
    this.nearRadius = options.nearRadius ?? null;
    this.nearRadiusRelease = options.nearRadiusRelease ?? (
      this.nearRadius != null ? this.nearRadius + 28 : null
    );
    this._near = false;
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
    // A proximity label starts hidden: on scene entry the player is usually
    // nowhere near it, and a one-frame flash of every caption is exactly the
    // clutter the gate exists to remove.
    if (this.nearRadius != null) {
      this.container.setAlpha(0);
      this.container.setVisible(false);
    }
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

  /** World position the label is anchored at (its follow target, else itself). */
  _anchor() {
    if (this.target?.x !== undefined) return this.target;
    return this.container;
  }

  /**
   * Who proximity is measured from. An explicit `distanceTarget` wins;
   * otherwise the player sprite, resolved lazily because labels are built in
   * `createWorld()` and the player is constructed after that.
   */
  _proximitySource() {
    if (this.distanceTarget) return this.distanceTarget;
    return this.scene?.player?.sprite || null;
  }

  /** True while the proximity source is inside the gate (with hysteresis). */
  _isNear() {
    const src = this._proximitySource();
    if (!src || src.x === undefined) return false;
    const anchor = this._anchor();
    const dx = src.x - anchor.x;
    const dy = src.y - anchor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const limit = this._near ? this.nearRadiusRelease : this.nearRadius;
    this._near = dist <= limit;
    return this._near;
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
    if (this.distanceTarget && this.maxDistance) {
      const anchor = this._anchor();
      const dx = this.distanceTarget.x - anchor.x;
      const dy = this.distanceTarget.y - anchor.y;
      distanceVisible = Math.sqrt(dx * dx + dy * dy) <= this.maxDistance;
    }

    const nearVisible = this.nearRadius == null ? true : this._isNear();
    const shouldShow = zoomVisible && distanceVisible && nearVisible && this.visible;

    if (this.nearRadius == null) {
      this.container.setVisible(shouldShow);
      return;
    }

    // Proximity labels ease in and out so walking past a plant reads as the
    // name arriving, not as a flashing caption.
    const targetAlpha = shouldShow ? 1 : 0;
    const alpha = this.container.alpha;
    if (Math.abs(alpha - targetAlpha) < 0.01) {
      this.container.setAlpha(targetAlpha);
      this.container.setVisible(targetAlpha > 0);
      return;
    }
    const next = alpha + (targetAlpha - alpha) * 0.18;
    this.container.setAlpha(next);
    this.container.setVisible(next > 0.01);
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    this.container.destroy();
  }
}

export function createWorldLabel(scene, x, y, text, options = {}) {
  return new WorldLabel(scene, x, y, text, options);
}
