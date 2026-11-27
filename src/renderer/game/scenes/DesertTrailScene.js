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
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';

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
    // Painted desert-floor texture, tiled over the whole world. Replaces the
    // flat 0xe8c170 rectangle and the graphics "colour variation" circles —
    // the variation is in the art now.
    this.addGroundTexture(ART.deserttrail_ground, 0, 0, width, height);

    // === TRAILS ===
    // Worn trails read as lighter sand over the desert floor. The ecology
    // terrain tiles carry the grain, so these are textured strips rather
    // than flat fills.
    const trails = [
      this.layout.path_main,
      this.layout.path_branch_north,
      this.layout.path_branch_southeast,
      this.layout.path_east,
    ];
    for (const t of trails) {
      this.addGroundTexture('ecology.terrain.sand', t.x, t.y, t.w, t.h, {
        depth: 1, alpha: 0.85,
      });
    }
    // Shortcut diagonal — stepping stones rather than a graded trail.
    for (let i = 0; i < 8; i++) {
      this.addProp(ART.rock_boulder, 320 + i * 30, 320 - i * 25 + 8, {
        maxPx: 22, depth: 2, alpha: 0.9,
      });
    }

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_bottom.x, this.layout.wall_bottom.y, this.layout.wall_bottom.w, this.layout.wall_bottom.h);   // bottom
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h);  // right

    // === ROCKS (collision) ===
    // Layout `size` was an emoji font size; it still reads as "how big is
    // this boulder", so it drives the sprite's longest side.
    for (const rock of this.layout.rocks) {
      this.addProp(ART.rock_boulder, rock.x, rock.y + rock.size / 2, {
        maxPx: rock.size, depth: groundDepth(rock.y),
      });
      this.addWall(rock.x, rock.y, rock.size * 0.7, rock.size * 0.6);
    }

    // === CACTI ===
    for (const cactus of this.layout.cacti) {
      this.addProp(ART.saguaro, cactus.x, cactus.y + 18, {
        depth: groundDepth(cactus.y),
      });
      this.addWall(cactus.x, cactus.y, 16, 16);
    }

    // === DESERT SHRUBS (decorative, no collision) ===
    for (const shrub of this.layout.shrubs) {
      this.addProp(ART.desert_shrub, shrub.x, shrub.y + 10, {
        maxPx: 34, depth: groundDepth(shrub.y),
      });
    }

    // === SKULL (decorative) ===
    this.addProp(ART.animal_skull, this.layout.skull.x, this.layout.skull.y + 8, {
      maxPx: 32, depth: groundDepth(this.layout.skull.y),
    });

    // === LIZARD (decorative, wandering) ===
    const lizard = this.addProp(ART.lizard, this.layout.lizard.x, this.layout.lizard.y + 8, {
      maxPx: 30, depth: groundDepth(this.layout.lizard.y) + 1,
    });
    if (lizard) {
      this.tweens.add({
        targets: lizard,
        x: 680, y: 350,
        duration: 4000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }

    // === INTERACTABLES ===

    // Scavenging spot
    this.addInteractable({
      x: this.layout.interact_scavenge_spot.x, y: this.layout.interact_scavenge_spot.y,
      label: 'Scavenge Spot',
      icon: ART.scavenge_spot,
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
      icon: ART.old_crate,
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
      icon: ART.trail_marker,
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
