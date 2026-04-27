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
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

export default class DesertTrailScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'desertTrailLayout',
    layoutPath: 'layouts/desert-trail.layout.json',
  };

  constructor() {
    super('DesertTrailScene');
  }

  preload() {
    super.preload?.();
    this.load.json('desertTrailLayout', 'layouts/desert-trail.layout.json');
  }

  getWorldSize() {
    return { width: 1200, height: 800 };
  }

  createWorld() {
    this.layout = loadLayout(this, 'desertTrailLayout');

    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Desert sand base
    this.add.rectangle(this.layout.ground_base.x, this.layout.ground_base.y, this.layout.ground_base.w, this.layout.ground_base.h, 0xe8c170);

    // Color variation patches
    const sandGfx = this.add.graphics();
    sandGfx.fillStyle(0xd4a853, 0.4);
    sandGfx.fillCircle(this.layout.sand_patches[0].x, this.layout.sand_patches[0].y, this.layout.sand_patches[0].r);
    sandGfx.fillCircle(this.layout.sand_patches[1].x, this.layout.sand_patches[1].y, this.layout.sand_patches[1].r);
    sandGfx.fillCircle(this.layout.sand_patches[2].x, this.layout.sand_patches[2].y, this.layout.sand_patches[2].r);
    sandGfx.fillStyle(0xf0d68a, 0.3);
    sandGfx.fillCircle(this.layout.sand_patches[3].x, this.layout.sand_patches[3].y, this.layout.sand_patches[3].r);
    sandGfx.fillCircle(this.layout.sand_patches[4].x, this.layout.sand_patches[4].y, this.layout.sand_patches[4].r);

    // === TRAILS ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xc9a85c, 0.8);
    // Main horizontal trail
    pathGfx.fillRoundedRect(this.layout.path_main.x, this.layout.path_main.y, this.layout.path_main.w, this.layout.path_main.h, 10);
    // Branch north
    pathGfx.fillRoundedRect(this.layout.path_branch_north.x, this.layout.path_branch_north.y, this.layout.path_branch_north.w, this.layout.path_branch_north.h, 10);
    // Branch south-east
    pathGfx.fillRoundedRect(this.layout.path_branch_southeast.x, this.layout.path_branch_southeast.y, this.layout.path_branch_southeast.w, this.layout.path_branch_southeast.h, 10);
    // Shortcut diagonal (small stepping stones)
    pathGfx.fillStyle(0xb8944a, 0.6);
    for (let i = 0; i < 8; i++) {
      pathGfx.fillCircle(320 + i * 30, 320 - i * 25, 12);
    }
    // East continuation
    pathGfx.fillStyle(0xc9a85c, 0.8);
    pathGfx.fillRoundedRect(this.layout.path_east.x, this.layout.path_east.y, this.layout.path_east.w, this.layout.path_east.h, 10);

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_bottom.x, this.layout.wall_bottom.y, this.layout.wall_bottom.w, this.layout.wall_bottom.h);   // bottom
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h);  // right

    // === ROCKS (collision) ===
    for (const rock of this.layout.rocks) {
      this.add.text(rock.x, rock.y, '🪨', { fontSize: `${rock.size}px` }).setOrigin(0.5).setDepth(3);
      this.addWall(rock.x, rock.y, rock.size * 0.7, rock.size * 0.6);
    }

    // === CACTI ===
    for (const cactus of this.layout.cacti) {
      this.add.text(cactus.x, cactus.y, '🌵', { fontSize: '30px' }).setOrigin(0.5).setDepth(3);
      this.addWall(cactus.x, cactus.y, 16, 16);
    }

    // === DESERT SHRUBS (decorative, no collision) ===
    for (const shrub of this.layout.shrubs) {
      this.add.text(shrub.x, shrub.y, '🌿', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
    }

    // === SKULL (decorative) ===
    this.add.text(this.layout.skull.x, this.layout.skull.y, '💀', { fontSize: '20px' }).setOrigin(0.5).setDepth(2);

    // === LIZARD (decorative, wandering) ===
    const lizard = this.add.text(this.layout.lizard.x, this.layout.lizard.y, '🦎', { fontSize: '22px' }).setOrigin(0.5).setDepth(4);
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
      x: this.layout.interact_scavenge_spot.x, y: this.layout.interact_scavenge_spot.y,
      label: 'Scavenge Spot',
      icon: '🔍',
      radius: this.layout.interact_scavenge_spot.radius,
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
      x: this.layout.interact_old_crate.x, y: this.layout.interact_old_crate.y,
      label: 'Old Crate',
      icon: '📦',
      radius: this.layout.interact_old_crate.radius,
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
      x: this.layout.interact_trail_marker.x, y: this.layout.interact_trail_marker.y,
      label: 'Trail Marker',
      icon: '🪧',
      radius: this.layout.interact_trail_marker.radius,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A weathered trail marker:\n\n  North Trail - 'Lookout Point'\n  East Trail - 'Canyon Pass'\n  Shortcut - 'For brave hikers only!'\n\nGood to know!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏜️ Desert Trail', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#795548',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (west → overworld) ===
    this.addExit({
      x: this.layout.exit_west.x, y: this.layout.exit_west.y,
      width: this.layout.exit_west.w, height: this.layout.exit_west.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromDesertTrail',
      label: '🗺️ Leave ⬅',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('DesertTrailScene', import.meta.hot, DesertTrailScene);
