/**
 * NeighborhoodSceneBase — Editor-generated scene layout.
 *
 * THIS FILE REPRESENTS THE EDITOR-OWNED BOUNDARY.
 *
 * When Phaser Editor takes over scene composition, it will regenerate
 * this file (or a .scene file that compiles to equivalent code).
 * All static layout — world map placement, landmark labels, collision
 * zones, NPC positions, transition zones — lives here.
 *
 * Custom game logic (player spawning, NPC interaction, quest system,
 * reward celebrations, save/load, landmark detection, camera setup,
 * audio transitions) lives in the subclass: scenes/NeighborhoodScene.js
 *
 * Convention:
 *   - editorCreate() sets up all visual/spatial objects
 *   - The subclass calls editorCreate() from its own create()
 *   - Named objects are stored as instance properties for subclass access
 *   - editorCreate() must NOT contain game logic, only composition
 *
 * Current status: HAND-AUTHORED PLACEHOLDER
 * This code was extracted from the original NeighborhoodScene.create()
 * to establish the boundary. When Phaser Editor is connected, this file
 * will be replaced by editor-generated output.
 */

import Phaser from 'phaser';
import { loadPack } from '../assetPackLoader.js';
import {
  WORLD, GARAGE_TRANSITION, LANDMARKS, COLLISION_ZONES,
} from '../data/neighborhoodLayout.js';

export default class NeighborhoodSceneBase extends Phaser.Scene {
  constructor() {
    super({ key: 'NeighborhoodScene' });
  }

  preload() {
    // Load scene-specific asset pack
    loadPack(this, 'neighborhood-scene');
  }

  /**
   * Editor-generated scene composition.
   *
   * Creates all static visual/spatial objects for the Neighborhood scene.
   * Stores references to interactive objects as instance properties.
   */
  editorCreate() {
    // === WORLD MAP ===

    /** @type {Phaser.GameObjects.Image} */
    this.worldMap = this.add.image(WORLD.width / 2, WORLD.height / 2, WORLD.mapAsset)
      .setDisplaySize(WORLD.width, WORLD.height)
      .setDepth(0);

    // === LANDMARK LABELS ===

    LANDMARKS.forEach((lm) => {
      if (!lm.showLabel) return;
      this.add.text(lm.x, lm.y - lm.height / 2 - 8, `${lm.icon} ${lm.name}`, {
        fontSize: '14px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(5).setAlpha(0.85);
    });

    // === COLLISION ZONES (invisible static physics bodies) ===

    /** @type {Phaser.GameObjects.Rectangle[]} */
    this.collisionBodies = [];
    COLLISION_ZONES.forEach((cz) => {
      const rect = this.add.rectangle(
        cz.x, cz.y, cz.width, cz.height, 0x000000, 0,
      );
      this.physics.add.existing(rect, true);
      this.collisionBodies.push(rect);
    });

    // === LANDMARK ZONE TRIGGERS ===

    /** @type {Phaser.GameObjects.Rectangle[]} */
    this.landmarkZones = [];
    LANDMARKS.forEach((lm) => {
      const zone = this.add.rectangle(
        lm.x, lm.y, lm.width, lm.height, 0x000000, 0,
      );
      this.physics.add.existing(zone, true);
      zone._landmarkData = lm;
      this.landmarkZones.push(zone);
    });

    // === GARAGE TRANSITION ZONE ===

    const gt = GARAGE_TRANSITION;

    /** @type {Phaser.GameObjects.Rectangle} */
    this.entryZone = this.add.rectangle(
      gt.x, gt.y, gt.width, gt.height, 0x000000, 0,
    );
    this.physics.add.existing(this.entryZone, true);

    // Visual marker for garage entrance
    this.add.rectangle(gt.x, gt.y, gt.width, gt.height, 0xf59e0b, 0.2)
      .setDepth(2);
    this.add.text(gt.x, gt.y, gt.label, {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#92400e',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    // === SCENE LABEL ===

    this.add.text(WORLD.width / 2, WORLD.height - 14, 'E Trailside View', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#78350f',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
  }
}
