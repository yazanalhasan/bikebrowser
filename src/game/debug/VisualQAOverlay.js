import { DEPTHS } from '../art/artConfig.js';

export class VisualQAOverlay {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.enabled = options.enabled ?? false;
    this.tracked = new Set();
    this.graphics = scene.add.graphics().setDepth(DEPTHS.ui + 10).setScrollFactor(0);
    this.readout = scene.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#1F2937',
      backgroundColor: '#FFF7E8',
      padding: { x: 8, y: 6 },
    }).setDepth(DEPTHS.ui + 11).setScrollFactor(0).setVisible(this.enabled);
    scene.events.on('update', this.update, this);
  }

  track(gameObject, metadata = {}) {
    this.tracked.add({ gameObject, metadata });
    return gameObject;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.readout.setVisible(this.enabled);
    this.graphics.setVisible(this.enabled);
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  update() {
    if (!this.enabled) return;
    const pointer = this.scene.input.activePointer;
    const world = pointer.positionToCamera(this.scene.cameras.main);
    const hit = [...this.tracked].find(({ gameObject }) => {
      if (!gameObject?.getBounds) return false;
      return gameObject.getBounds().contains(world.x, world.y);
    });

    this.graphics.clear();
    let lines = [`cursor: ${Math.round(world.x)}, ${Math.round(world.y)}`];

    if (hit) {
      const { gameObject, metadata } = hit;
      const b = gameObject.getBounds?.();
      if (b) {
        const tl = this.scene.cameras.main.getWorldPoint(b.x, b.y);
        this.graphics.lineStyle(2, 0xf7b733, 0.9);
        this.graphics.strokeRect(tl.x, tl.y, b.width, b.height);
      }
      lines = lines.concat([
        `asset: ${metadata.key || gameObject.texture?.key || 'graphics'}`,
        `frame: ${metadata.frame || gameObject.frame?.name || '-'}`,
        `depth: ${gameObject.depth}`,
        `scale: ${gameObject.scaleX?.toFixed?.(2) || 1}, ${gameObject.scaleY?.toFixed?.(2) || 1}`,
        `anchor: ${gameObject.originX?.toFixed?.(2) || '-'}, ${gameObject.originY?.toFixed?.(2) || '-'}`,
        `shadow: ${metadata.shadow || '-'}`,
        `collision: ${metadata.collision || '-'}`,
        `label: ${metadata.label || '-'}`,
      ]);
    }

    this.readout.setText(lines.join('\n'));
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    this.graphics.destroy();
    this.readout.destroy();
  }
}

export function createVisualQAOverlay(scene, options = {}) {
  return new VisualQAOverlay(scene, options);
}
