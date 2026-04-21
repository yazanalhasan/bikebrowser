/**
 * LakeEdgeScene — peaceful lakeside area with a dock and shoreline.
 *
 * Local playable scene with:
 *   - Shoreline on the north, water collision
 *   - Dock/pier extending into the water
 *   - Reeds, rocks, trees along the shore
 *   - Fishing spot interactable, cave entrance interactable (future)
 *   - Sandy ground near water, grass further south
 *   - Exit south to overworld
 *
 * World size: 900x700
 */

import LocalSceneBase from './LocalSceneBase.js';

export default class LakeEdgeScene extends LocalSceneBase {
  constructor() {
    super('LakeEdgeScene');
  }

  getWorldSize() {
    return { width: 900, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Grass (southern half)
    this.add.rectangle(width / 2, height * 0.75, width, height * 0.5, 0x7cb342);
    // Sand/tan strip (middle)
    this.add.rectangle(width / 2, height * 0.42, width, 160, 0xe8d5a3);
    // Water (northern portion)
    this.add.rectangle(width / 2, 100, width, 200, 0x42a5f5);

    // Shoreline edge detail
    const shoreGfx = this.add.graphics();
    shoreGfx.fillStyle(0xc8b88a, 0.5);
    for (let x = 0; x < width; x += 60) {
      shoreGfx.fillEllipse(x + 30, 205, 70, 20);
    }

    // Water ripples (decorative)
    const waterGfx = this.add.graphics();
    waterGfx.lineStyle(1, 0x90caf9, 0.4);
    for (let y = 40; y < 190; y += 30) {
      for (let x = 50; x < width; x += 120) {
        waterGfx.strokeEllipse(x, y, 40, 8);
      }
    }

    // === WATER COLLISION (top zone) ===
    this.addWall(width / 2, 90, width, 180);

    // === BOUNDARY WALLS ===
    this.addWall(width / 2, 0, width, 20);       // top
    this.addWall(0, height / 2, 20, height);      // left
    this.addWall(width, height / 2, 20, height);  // right

    // === DOCK / PIER ===
    const dockX = 450;
    const dockGfx = this.add.graphics();
    dockGfx.fillStyle(0x8d6e63, 1);
    dockGfx.fillRect(dockX - 25, 140, 50, 200);
    // Dock planks
    dockGfx.lineStyle(1, 0x6d4c41, 0.6);
    for (let py = 150; py < 340; py += 15) {
      dockGfx.strokeRect(dockX - 24, py, 48, 14);
    }
    // Dock posts
    this.add.rectangle(dockX - 20, 150, 8, 8, 0x5d4037).setDepth(2);
    this.add.rectangle(dockX + 20, 150, 8, 8, 0x5d4037).setDepth(2);
    // Dock walls (sides only so player can walk on it)
    this.addWall(dockX - 28, 240, 6, 200);
    this.addWall(dockX + 28, 240, 6, 200);

    // === ROCKS ===
    const rocks = [[120, 260], [780, 240], [350, 230], [650, 270], [200, 450]];
    for (const [rx, ry] of rocks) {
      this.add.text(rx, ry, '🪨', { fontSize: '24px' }).setOrigin(0.5).setDepth(3);
      this.addWall(rx, ry, 22, 18);
    }

    // === REEDS ===
    const reeds = [[80, 210], [160, 200], [280, 215], [560, 205], [720, 210], [830, 215]];
    for (const [rx, ry] of reeds) {
      this.add.text(rx, ry, '🌾', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
    }

    // === TREES ===
    const trees = [[60, 380], [180, 520], [750, 400], [850, 550], [400, 580], [600, 600]];
    for (const [tx, ty] of trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 20, 20);
    }

    // === PATH along shore ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xd7ccc8, 0.7);
    pathGfx.fillRoundedRect(40, 330, 820, 35, 8);

    // === INTERACTABLES ===

    // Fishing spot (end of dock)
    this.addInteractable({
      x: dockX, y: 170,
      label: 'Fishing Spot',
      icon: '🎣',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "The water is calm here at the end of the dock. I can see fish swimming below!\n\n(Fishing mini-game coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Cave entrance (east side)
    this.addInteractable({
      x: 820, y: 320,
      label: 'Cave Entrance',
      icon: '🕳️',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A dark cave opening in the rocks... I can feel cool air coming from inside.\n\nI should come back with a flashlight.\n\n(Cave exploration coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Interesting shell on the beach
    this.addInteractable({
      x: 260, y: 290,
      label: 'Seashell',
      icon: '🐚',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A pretty spiral shell washed up on the shore. If I hold it up to my ear, I can almost hear the ocean!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 220, '🏞️ Lake Edge', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#1b5e20',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: width / 2, y: height - 14,
      width: 160, height: 28,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromLakeEdge',
      label: '🗺️ Leave Lake ⬇',
    });
  }
}
