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
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

export default class LakeEdgeScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'lakeEdgeLayout',
    layoutPath: 'layouts/lake-edge.layout.json',
  };

  constructor() {
    super('LakeEdgeScene');
  }

  preload() {
    super.preload?.();
    this.load.json('lakeEdgeLayout', 'layouts/lake-edge.layout.json');
  }

  getWorldSize() {
    return { width: 900, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();
    this.layout = loadLayout(this, 'lakeEdgeLayout');

    // === GROUND ===
    // Grass (southern half)
    this.add.rectangle(this.layout.ground_grass.x, this.layout.ground_grass.y, this.layout.ground_grass.w, this.layout.ground_grass.h, 0x7cb342);
    // Sand/tan strip (middle)
    this.add.rectangle(this.layout.ground_sand.x, this.layout.ground_sand.y, this.layout.ground_sand.w, this.layout.ground_sand.h, 0xe8d5a3);
    // Water (northern portion)
    this.add.rectangle(this.layout.water.x, this.layout.water.y, this.layout.water.w, this.layout.water.h, 0x42a5f5);

    // Shoreline edge detail
    const shoreGfx = this.add.graphics();
    shoreGfx.fillStyle(0xc8b88a, 0.5);
    for (let x = 0; x < width; x += 60) {
      shoreGfx.fillEllipse(x + 30, this.layout.shore_ripple_y.y, 70, 20);
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
    this.addWall(this.layout.wall_water.x, this.layout.wall_water.y, this.layout.wall_water.w, this.layout.wall_water.h);

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);   // left
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h); // right

    // === DOCK / PIER ===
    const dockX = this.layout.interact_fishing_spot.x;
    const dockGfx = this.add.graphics();
    dockGfx.fillStyle(0x8d6e63, 1);
    dockGfx.fillRect(this.layout.dock.x, this.layout.dock.y, this.layout.dock.w, this.layout.dock.h);
    // Dock planks
    dockGfx.lineStyle(1, 0x6d4c41, 0.6);
    for (let py = 150; py < 340; py += 15) {
      dockGfx.strokeRect(dockX - 24, py, 48, 14);
    }
    // Dock posts
    this.add.rectangle(this.layout.dock_post_left.x, this.layout.dock_post_left.y, this.layout.dock_post_left.w, this.layout.dock_post_left.h, 0x5d4037).setDepth(2);
    this.add.rectangle(this.layout.dock_post_right.x, this.layout.dock_post_right.y, this.layout.dock_post_right.w, this.layout.dock_post_right.h, 0x5d4037).setDepth(2);
    // Dock walls (sides only so player can walk on it)
    this.addWall(this.layout.dock_wall_left.x, this.layout.dock_wall_left.y, this.layout.dock_wall_left.w, this.layout.dock_wall_left.h);
    this.addWall(this.layout.dock_wall_right.x, this.layout.dock_wall_right.y, this.layout.dock_wall_right.w, this.layout.dock_wall_right.h);

    // === ROCKS ===
    for (const { x: rx, y: ry } of this.layout.rocks) {
      this.add.text(rx, ry, '🪨', { fontSize: '24px' }).setOrigin(0.5).setDepth(3);
      this.addWall(rx, ry, 22, 18);
    }

    // === REEDS ===
    for (const { x: rx, y: ry } of this.layout.reeds) {
      this.add.text(rx, ry, '🌾', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
    }

    // === TREES ===
    for (const { x: tx, y: ty } of this.layout.trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 20, 20);
    }

    // === PATH along shore ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xd7ccc8, 0.7);
    pathGfx.fillRoundedRect(this.layout.path.x, this.layout.path.y, this.layout.path.w, this.layout.path.h, 8);

    // === INTERACTABLES ===

    // Fishing spot (end of dock)
    this.addInteractable({
      x: this.layout.interact_fishing_spot.x, y: this.layout.interact_fishing_spot.y,
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
      x: this.layout.interact_cave_entrance.x, y: this.layout.interact_cave_entrance.y,
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
      x: this.layout.interact_seashell.x, y: this.layout.interact_seashell.y,
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
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏞️ Lake Edge', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#1b5e20',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromLakeEdge',
      label: '🗺️ Leave Lake ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('LakeEdgeScene', import.meta.hot, LakeEdgeScene);
