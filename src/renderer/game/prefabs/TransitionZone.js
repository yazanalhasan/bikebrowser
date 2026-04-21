/**
 * TransitionZone Prefab — reusable scene transition trigger.
 *
 * PREFAB CANDIDATE for Phaser Editor.
 *
 * When migrated to Phaser Editor, this becomes a prefab scene file
 * that can be placed visually. For now, it's a code-based prefab
 * that encapsulates the transition zone visual + physics body.
 *
 * Components:
 *   - Invisible physics trigger zone
 *   - Semi-transparent visual marker
 *   - Text label
 *
 * Usage:
 *   import TransitionZone from '../prefabs/TransitionZone.js';
 *   const zone = new TransitionZone(scene, {
 *     x: 240, y: 190, width: 120, height: 50,
 *     label: '🏠 Go Home',
 *   });
 *   scene.physics.add.overlap(player.sprite, zone.trigger, callback);
 */

export default class TransitionZone {
  /**
   * @param {Phaser.Scene} scene
   * @param {{ x: number, y: number, width: number, height: number, label: string }} config
   */
  constructor(scene, config) {
    this.scene = scene;
    const { x, y, width, height, label } = config;

    // Invisible physics trigger
    this.trigger = scene.add.rectangle(x, y, width, height, 0x000000, 0);
    scene.physics.add.existing(this.trigger, true);

    // Visual marker
    this.marker = scene.add.rectangle(x, y, width, height, 0xf59e0b, 0.2).setDepth(2);

    // Label
    this.label = scene.add.text(x, y, label, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#92400e',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);
  }

  destroy() {
    this.trigger.destroy();
    this.marker.destroy();
    this.label.destroy();
  }
}
