/**
 * GarageSceneBase — Editor-generated scene layout.
 *
 * THIS FILE REPRESENTS THE EDITOR-OWNED BOUNDARY.
 *
 * When Phaser Editor takes over scene composition, it will regenerate
 * this file (or a .scene file that compiles to equivalent code).
 * All static layout — walls, floor, furniture placement, decorative
 * objects — lives here.
 *
 * Custom game logic (player spawning, physics overlaps, transitions,
 * quest triggers, save system, audio, state-dependent upgrades) lives
 * in the subclass: scenes/GarageScene.js
 *
 * Convention:
 *   - editorCreate() sets up all visual objects and exposes references
 *   - The subclass calls editorCreate() from its own create()
 *   - Named objects are stored as instance properties for subclass access
 *   - editorCreate() must NOT contain game logic, only composition
 *
 * Current status: HAND-AUTHORED PLACEHOLDER
 * This code was extracted from the original GarageScene.create() to
 * establish the boundary. When Phaser Editor is connected, this file
 * will be replaced by editor-generated output.
 */

import Phaser from 'phaser';

export default class GarageSceneBase extends Phaser.Scene {
  constructor() {
    super({ key: 'GarageScene' });
  }

  /**
   * Editor-generated scene composition.
   *
   * Creates all static visual objects for the Garage scene.
   * Stores references to interactive/important objects as instance
   * properties so the subclass can wire up game logic.
   *
   * @param {number} width - Scene width
   * @param {number} height - Scene height
   * @param {{ playArea: object }} safe - Safe zone layout from safeZones.js
   */
  editorCreate(width, height, safe) {
    const { playArea } = safe;
    const isMobile = width < 600;

    // --- Concrete floor ---
    this.add.rectangle(width / 2, height / 2, width, height, 0xbfb8a8);
    const floorGfx = this.add.graphics();
    floorGfx.lineStyle(1, 0xa8a090, 0.3);
    for (let x = 0; x < width; x += 80) floorGfx.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 80) floorGfx.lineBetween(0, y, width, y);

    // --- Stucco walls (tan/adobe) ---
    this.add.rectangle(width / 2, 24, width, 48, 0xd4a574);
    this.add.rectangle(width / 2, 49, width, 3, 0xc4945e);
    this.add.rectangle(24, height / 2, 48, height, 0xd4a574);
    this.add.rectangle(49, height / 2, 3, height, 0xc4945e);
    this.add.rectangle(width - 24, height / 2, 48, height, 0xd4a574);
    this.add.rectangle(width - 49, height / 2, 3, height, 0xc4945e);

    // --- Windows ---
    this.add.rectangle(width - 24, playArea.centerY - 40, 28, 40, 0x87ceeb, 0.6);
    this.add.rectangle(width - 24, playArea.centerY - 40, 28, 40).setStrokeStyle(3, 0x8b7355);
    this.add.rectangle(width - 24, playArea.centerY + 40, 28, 40, 0x87ceeb, 0.6);
    this.add.rectangle(width - 24, playArea.centerY + 40, 28, 40).setStrokeStyle(3, 0x8b7355);

    // --- Peg board (decorative) ---
    this.add.rectangle(width / 2, 38, 200, 22, 0x8b7355);
    this.add.text(width / 2, 38, '\u2699\uFE0F  \uD83E\uDE9A  \uD83D\uDCCF  \uD83D\uDD29', { fontSize: '13px' }).setOrigin(0.5);

    // === UPPER BAND: Workbench, Bike, Notebook ===

    const upperY = playArea.top + 40;

    // --- Workbench (left) --- [PREFAB CANDIDATE]
    /** @type {number} */
    this.workbenchX = isMobile ? 80 : playArea.left + playArea.width * 0.18;
    /** @type {number} */
    this.workbenchY = upperY;
    const wbX = this.workbenchX;
    const wbY = this.workbenchY;
    const wbW = isMobile ? 100 : 160;
    this.add.rectangle(wbX, wbY, wbW, 60, 0x7c5c3c).setStrokeStyle(3, 0x5a3e28);
    this.add.rectangle(wbX - wbW / 2 + 10, wbY + 38, 10, 22, 0x5a3e28);
    this.add.rectangle(wbX + wbW / 2 - 10, wbY + 38, 10, 22, 0x5a3e28);
    this.add.text(wbX - 25, wbY - 6, '\uD83D\uDD27', { fontSize: isMobile ? '18px' : '22px' }).setOrigin(0.5);
    this.add.text(wbX, wbY - 6, '\uD83E\uDE9B', { fontSize: isMobile ? '18px' : '22px' }).setOrigin(0.5);
    this.add.text(wbX + 25, wbY - 6, '\uD83E\uDDF0', { fontSize: isMobile ? '18px' : '22px' }).setOrigin(0.5);
    this.add.text(wbX, wbY + 42, 'Workbench', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#5a3e28', fontStyle: 'bold',
    }).setOrigin(0.5);

    // --- HERO BIKE (center) --- [PREFAB CANDIDATE]
    const bikeX = width / 2;
    const bikeY = isMobile ? upperY + 60 : upperY + 10;
    const matGfx = this.add.graphics();
    matGfx.fillStyle(0x6b7280, 0.15);
    matGfx.fillRoundedRect(bikeX - 60, bikeY - 15, 120, 80, 8);
    this.add.rectangle(bikeX - 45, bikeY - 20, 6, 60, 0x6b7280);
    this.add.rectangle(bikeX + 45, bikeY - 20, 6, 60, 0x6b7280);
    this.add.rectangle(bikeX, bikeY - 48, 96, 5, 0x6b7280);
    this.add.rectangle(bikeX, bikeY + 35, 96, 4, 0x6b7280);
    this.add.text(bikeX, bikeY + 5, '\uD83D\uDEB2', { fontSize: isMobile ? '48px' : '64px' }).setOrigin(0.5);
    const bikeGlow = this.add.graphics();
    bikeGlow.fillStyle(0x3b82f6, 0.06);
    bikeGlow.fillCircle(bikeX, bikeY + 5, 55);
    this.add.text(bikeX, bikeY + 52, "\u2B50 Zuzu's Bike \u2B50", {
      fontSize: '15px', fontFamily: 'sans-serif', color: '#1e40af', fontStyle: 'bold',
      stroke: '#dbeafe', strokeThickness: 2,
    }).setOrigin(0.5);

    // --- Notebook desk (right) --- [PREFAB CANDIDATE]
    const nbX = isMobile ? width - 80 : playArea.left + playArea.width * 0.82;
    const nbY = upperY;
    this.add.rectangle(nbX, nbY, 120, 55, 0x8b6f47).setStrokeStyle(3, 0x6b5430);
    this.add.text(nbX - 18, nbY - 6, '\uD83D\uDCD3', { fontSize: '26px' }).setOrigin(0.5);
    this.add.text(nbX + 18, nbY - 6, '\u270F\uFE0F', { fontSize: '20px' }).setOrigin(0.5);
    this.add.text(nbX, nbY + 38, 'Notebook', {
      fontSize: '13px', fontFamily: 'sans-serif', color: '#5b21b6', fontStyle: 'bold',
    }).setOrigin(0.5);

    // === CENTER BAND: Decorative items ===

    // Oil stain
    const oilGfx = this.add.graphics();
    oilGfx.fillStyle(0x8b8070, 0.2);
    oilGfx.fillCircle(playArea.centerX + 60, playArea.centerY + 30, 25);
    oilGfx.fillCircle(playArea.centerX + 45, playArea.centerY + 50, 15);

    // Tires against left wall
    this.add.text(58, playArea.centerY + 10, '\u2B55', { fontSize: '30px' }).setOrigin(0.5);
    this.add.text(58, playArea.centerY + 55, '\u2B55', { fontSize: '24px' }).setOrigin(0.5);

    // Small tools on left wall
    this.add.text(58, playArea.centerY - 40, '\uD83D\uDD29', { fontSize: '20px' }).setOrigin(0.5);
    this.add.text(58, playArea.centerY - 15, '\uD83E\uDE9B', { fontSize: '20px' }).setOrigin(0.5);

    // Water bottle
    this.add.text(width - 58, playArea.centerY + 60, '\uD83E\uDDC3', { fontSize: '20px' }).setOrigin(0.5);

    // === BOTTOM BAND: Exit zone, sunlight, title ===

    const EXIT_ZONE_HEIGHT = 48;

    this.add.rectangle(width / 2, height - 6, width - 48, 12, 0x9ca3af);
    this.add.rectangle(width / 2, height - EXIT_ZONE_HEIGHT / 2,
      width - 60, EXIT_ZONE_HEIGHT, 0xf59e0b, 0.18);

    // Exit zone — exposed for subclass physics wiring
    /** @type {Phaser.GameObjects.Rectangle} */
    this.exitZone = this.add.rectangle(
      width / 2, height - EXIT_ZONE_HEIGHT / 2,
      width - 60, EXIT_ZONE_HEIGHT, 0x000000, 0,
    );

    // Sunlight glow
    const sunGfx = this.add.graphics();
    sunGfx.fillStyle(0xfbbf24, 0.1);
    sunGfx.fillRect(30, height - EXIT_ZONE_HEIGHT - 30, width - 60, EXIT_ZONE_HEIGHT + 30);

    // Exit label
    this.add.text(width / 2, height - EXIT_ZONE_HEIGHT / 2, '\u2600\uFE0F Go Outside \u2B07', {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#92400e',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5);

    // Scene title
    this.add.text(width / 2, height - EXIT_ZONE_HEIGHT - 22, "Zuzu's Garage", {
      fontSize: '18px', fontFamily: 'sans-serif', color: '#78350f',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5);
  }
}
