/**
 * DesertTrailScene — expansive desert with branching trails and cacti.
 *
 * Local playable scene with:
 *   - Branching desert paths (tan/brown)
 *   - Cacti, rocks (collision), desert shrubs
 *   - Scavenging spot interactable, shortcut path
 *   - Wider world = scrolling camera
 *   - Exit west to overworld
 *
 * World size: 1200x800
 */

import LocalSceneBase from './LocalSceneBase.js';

export default class DesertTrailScene extends LocalSceneBase {
  constructor() {
    super('DesertTrailScene');
  }

  getWorldSize() {
    return { width: 1200, height: 800 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Desert sand base
    this.add.rectangle(width / 2, height / 2, width, height, 0xe8c170);

    // Color variation patches
    const sandGfx = this.add.graphics();
    sandGfx.fillStyle(0xd4a853, 0.4);
    sandGfx.fillCircle(300, 200, 120);
    sandGfx.fillCircle(800, 500, 150);
    sandGfx.fillCircle(1000, 200, 100);
    sandGfx.fillStyle(0xf0d68a, 0.3);
    sandGfx.fillCircle(600, 600, 140);
    sandGfx.fillCircle(200, 500, 100);

    // === TRAILS ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xc9a85c, 0.8);
    // Main horizontal trail
    pathGfx.fillRoundedRect(0, 360, 900, 40, 10);
    // Branch north
    pathGfx.fillRoundedRect(500, 100, 40, 280, 10);
    // Branch south-east
    pathGfx.fillRoundedRect(700, 380, 40, 300, 10);
    // Shortcut diagonal (small stepping stones)
    pathGfx.fillStyle(0xb8944a, 0.6);
    for (let i = 0; i < 8; i++) {
      pathGfx.fillCircle(320 + i * 30, 320 - i * 25, 12);
    }
    // East continuation
    pathGfx.fillStyle(0xc9a85c, 0.8);
    pathGfx.fillRoundedRect(880, 360, 320, 40, 10);

    // === BOUNDARY WALLS ===
    this.addWall(width / 2, 0, width, 20);       // top
    this.addWall(width / 2, height, width, 20);   // bottom
    this.addWall(width, height / 2, 20, height);  // right

    // === ROCKS (collision) ===
    const rocks = [
      [150, 150, 40], [400, 280, 35], [850, 200, 45],
      [1050, 350, 50], [300, 600, 30], [950, 650, 40],
      [600, 700, 35], [1100, 550, 45],
    ];
    for (const [rx, ry, size] of rocks) {
      this.add.text(rx, ry, '🪨', { fontSize: `${size}px` }).setOrigin(0.5).setDepth(3);
      this.addWall(rx, ry, size * 0.7, size * 0.6);
    }

    // === CACTI ===
    const cacti = [
      [200, 300], [450, 180], [700, 250], [900, 450],
      [350, 480], [1050, 150], [1100, 400], [550, 550],
      [800, 650], [150, 650],
    ];
    for (const [cx, cy] of cacti) {
      this.add.text(cx, cy, '🌵', { fontSize: '30px' }).setOrigin(0.5).setDepth(3);
      this.addWall(cx, cy, 16, 16);
    }

    // === DESERT SHRUBS (decorative, no collision) ===
    const shrubs = [
      [100, 400], [250, 200], [650, 150], [750, 500],
      [1000, 300], [400, 700], [900, 100], [1150, 250],
    ];
    for (const [sx, sy] of shrubs) {
      this.add.text(sx, sy, '🌿', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
    }

    // === SKULL (decorative) ===
    this.add.text(1050, 680, '💀', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);

    // === LIZARD (decorative, wandering) ===
    const lizard = this.add.text(600, 400, '🦎', { fontSize: '22px' }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: lizard,
      x: 680, y: 350,
      duration: 4000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // === INTERACTABLES ===

    // Scavenging spot
    this.addInteractable({
      x: 520, y: 140,
      label: 'Scavenge Spot',
      icon: '🔍',
      radius: 60,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "There are interesting things half-buried in the sand here... old bottle caps, a rusty gear, some colorful stones.\n\nCould be useful for building projects!",
          choices: null, step: null,
        });
      },
    });

    // Mysterious crate
    this.addInteractable({
      x: 1050, y: 500,
      label: 'Old Crate',
      icon: '📦',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "An old wooden crate half-buried in the sand. Someone left it here a long time ago.\n\nI wonder what was inside... there are a few bolts and a chain link left.",
          choices: null, step: null,
        });
      },
    });

    // Trail marker sign
    this.addInteractable({
      x: 200, y: 370,
      label: 'Trail Marker',
      icon: '🪧',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A weathered trail marker:\n\n  North Trail - 'Lookout Point'\n  East Trail - 'Canyon Pass'\n  Shortcut - 'For brave hikers only!'\n\nGood to know!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 40, '🏜️ Desert Trail', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#795548',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (west → overworld) ===
    this.addExit({
      x: 14, y: height / 2,
      width: 28, height: 140,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromDesertTrail',
      label: '🗺️ Leave ⬅',
    });
  }
}
