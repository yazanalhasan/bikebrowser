/**
 * Workbench Prefab — reusable workbench display object.
 *
 * PREFAB CANDIDATE for Phaser Editor.
 *
 * When migrated to Phaser Editor, this becomes a prefab scene file
 * that can be placed visually in any scene. For now, it's a code-based
 * prefab that encapsulates the workbench visual composition.
 *
 * Components:
 *   - Wooden table surface with legs
 *   - Tool emoji decorations
 *   - "Workbench" label
 *
 * Usage:
 *   import Workbench from '../prefabs/Workbench.js';
 *   const wb = new Workbench(scene, x, y, { compact: isMobile });
 */

export default class Workbench {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - Center X position
   * @param {number} y - Center Y position
   * @param {{ compact?: boolean }} [opts]
   */
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    const compact = opts.compact || false;
    const w = compact ? 100 : 160;
    const fontSize = compact ? '18px' : '22px';

    // Table surface
    this.table = scene.add.rectangle(x, y, w, 60, 0x7c5c3c).setStrokeStyle(3, 0x5a3e28);
    // Legs
    this.legL = scene.add.rectangle(x - w / 2 + 10, y + 38, 10, 22, 0x5a3e28);
    this.legR = scene.add.rectangle(x + w / 2 - 10, y + 38, 10, 22, 0x5a3e28);
    // Tools
    this.tool1 = scene.add.text(x - 25, y - 6, '\uD83D\uDD27', { fontSize }).setOrigin(0.5);
    this.tool2 = scene.add.text(x, y - 6, '\uD83E\uDE9B', { fontSize }).setOrigin(0.5);
    this.tool3 = scene.add.text(x + 25, y - 6, '\uD83E\uDDF0', { fontSize }).setOrigin(0.5);
    // Label
    this.label = scene.add.text(x, y + 42, 'Workbench', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#5a3e28', fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  /** Destroy all visual components. */
  destroy() {
    this.table.destroy();
    this.legL.destroy();
    this.legR.destroy();
    this.tool1.destroy();
    this.tool2.destroy();
    this.tool3.destroy();
    this.label.destroy();
  }
}
