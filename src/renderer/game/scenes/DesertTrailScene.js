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

    this._renderSunsetTrailBackground(width, height);

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

  _renderSunsetTrailBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, 0x5fb7f2);
    this.add.rectangle(width / 2, 138, width, 276, 0xffc35a).setAlpha(0.28);
    this.add.circle(width * 0.64, 176, 86, 0xffd35c, 0.76);

    const sky = this.add.graphics();
    sky.fillStyle(0xff8f3b, 0.58);
    sky.fillEllipse(680, 122, 260, 64);
    sky.fillEllipse(830, 108, 210, 52);
    sky.fillStyle(0xf7a4c0, 0.3);
    sky.fillEllipse(320, 118, 250, 44);

    const mountains = this.add.graphics();
    mountains.fillStyle(0x47326f, 0.72);
    mountains.fillTriangle(0, 330, 210, 142, 420, 330);
    mountains.fillTriangle(270, 330, 520, 166, 760, 330);
    mountains.fillTriangle(700, 330, 970, 138, width, 330);
    mountains.fillStyle(0xff9c35, 0.48);
    mountains.fillTriangle(45, 310, 210, 142, 260, 310);
    mountains.fillTriangle(750, 316, 970, 138, 1030, 316);

    const desert = this.add.graphics();
    desert.fillStyle(0xe99f3f, 1).fillRect(0, 300, width, height - 300);
    desert.fillStyle(0x7452a2, 0.22).fillEllipse(920, 650, 560, 130);
    desert.fillStyle(0xf6c15f, 0.64).fillEllipse(320, 600, 700, 150);

    const path = this.add.graphics();
    path.fillStyle(0xffcf62, 0.92);
    path.beginPath();
    path.moveTo(0, 660);
    path.lineTo(350, 520);
    path.lineTo(550, 400);
    path.lineTo(670, 330);
    path.lineTo(742, 338);
    path.lineTo(628, 430);
    path.lineTo(468, 560);
    path.lineTo(270, height);
    path.lineTo(0, height);
    path.closePath();
    path.fillPath();
    path.fillStyle(0x5d4595, 0.28);
    path.fillEllipse(490, 640, 160, 28);
    path.fillEllipse(610, 456, 120, 18);

    const flowers = this.add.graphics();
    for (const [x, y, color] of [
      [120, 526, 0xff7b2e], [188, 482, 0xd95ad1], [252, 548, 0xffda54],
      [870, 520, 0xd95ad1], [990, 478, 0x35b7c5], [1040, 570, 0xff7b2e],
    ]) {
      flowers.fillStyle(color, 0.78).fillEllipse(x, y, 54, 26);
    }
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('DesertTrailScene', import.meta.hot, DesertTrailScene);
