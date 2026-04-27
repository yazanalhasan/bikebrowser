/**
 * CommunityPoolScene — fenced community pool with deck and amenities.
 *
 * Local playable scene with:
 *   - Pool in center (water collision, blue rectangle)
 *   - Pool deck (lighter concrete) around it
 *   - Lounge chairs, lifeguard chair, slide
 *   - Pool rules sign interactable, diving board interactable (future)
 *   - Fence around perimeter
 *   - Exit south to overworld
 *
 * World size: 800x600
 */

import LocalSceneBase from './LocalSceneBase.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

export default class CommunityPoolScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'communityPoolLayout',
    layoutPath: 'layouts/community-pool.layout.json',
  };

  constructor() {
    super('CommunityPoolScene');
  }

  getWorldSize() {
    return { width: 800, height: 600 };
  }

  preload() {
    super.preload?.();
    this.load.json('communityPoolLayout', 'layouts/community-pool.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'communityPoolLayout');

    // === GROUND ===
    // Concrete deck (full background)
    this.add.rectangle(this.layout.ground_deck.x, this.layout.ground_deck.y, this.layout.ground_deck.w, this.layout.ground_deck.h, 0xd6d2c4);

    // Grass border outside the fence
    const grassGfx = this.add.graphics();
    grassGfx.fillStyle(0x7cb342, 1);
    grassGfx.fillRect(this.layout.grass_border_top.x, this.layout.grass_border_top.y, this.layout.grass_border_top.w, this.layout.grass_border_top.h);
    grassGfx.fillRect(this.layout.grass_border_bottom.x, this.layout.grass_border_bottom.y, this.layout.grass_border_bottom.w, this.layout.grass_border_bottom.h);
    grassGfx.fillRect(this.layout.grass_border_left.x, this.layout.grass_border_left.y, this.layout.grass_border_left.w, this.layout.grass_border_left.h);
    grassGfx.fillRect(this.layout.grass_border_right.x, this.layout.grass_border_right.y, this.layout.grass_border_right.w, this.layout.grass_border_right.h);

    // Pool deck (lighter area around pool)
    this.add.rectangle(this.layout.pool_deck.x, this.layout.pool_deck.y, this.layout.pool_deck.w, this.layout.pool_deck.h, 0xe8e0d0);

    // === POOL (water collision) ===
    const poolX = this.layout.pool_water.x, poolY = this.layout.pool_water.y;
    const poolW = this.layout.pool_water.w, poolH = this.layout.pool_water.h;
    // Pool water
    this.add.rectangle(poolX, poolY, poolW, poolH, 0x42a5f5);
    // Pool border
    const poolGfx = this.add.graphics();
    poolGfx.lineStyle(4, 0x90caf9, 1);
    poolGfx.strokeRect(poolX - poolW / 2, poolY - poolH / 2, poolW, poolH);
    // Lane lines
    poolGfx.lineStyle(1, 0xbbdefb, 0.5);
    for (let ly = poolY - poolH / 2 + 36; ly < poolY + poolH / 2; ly += 36) {
      poolGfx.strokeRect(poolX - poolW / 2 + 10, ly, poolW - 20, 0);
    }
    // Pool water collision
    this.addWall(this.layout.pool_wall.x, this.layout.pool_wall.y, this.layout.pool_wall.w, this.layout.pool_wall.h);

    // === FENCE (perimeter) ===
    const fenceColor = 0x9e9e9e;
    // Top
    this.addVisibleWall(this.layout.fence_top.x, this.layout.fence_top.y, this.layout.fence_top.w, this.layout.fence_top.h, fenceColor, 0x757575);
    // Left
    this.addVisibleWall(this.layout.fence_left.x, this.layout.fence_left.y, this.layout.fence_left.w, this.layout.fence_left.h, fenceColor, 0x757575);
    // Right
    this.addVisibleWall(this.layout.fence_right.x, this.layout.fence_right.y, this.layout.fence_right.w, this.layout.fence_right.h, fenceColor, 0x757575);
    // Bottom (gap for entrance)
    this.addVisibleWall(this.layout.fence_bottom_west.x, this.layout.fence_bottom_west.y, this.layout.fence_bottom_west.w, this.layout.fence_bottom_west.h, fenceColor, 0x757575);
    this.addVisibleWall(this.layout.fence_bottom_east.x, this.layout.fence_bottom_east.y, this.layout.fence_bottom_east.w, this.layout.fence_bottom_east.h, fenceColor, 0x757575);

    // Fence posts
    const fp = this.layout.fence_posts;
    for (let x = fp.x_start; x < this.getWorldSize().width; x += fp.x_step) {
      this.add.rectangle(x, fp.y_top, fp.w, fp.h, 0x757575).setDepth(1);
      if (x < fp.gap_min_x || x > fp.gap_max_x) {
        this.add.rectangle(x, fp.y_bottom, fp.w, fp.h, 0x757575).setDepth(1);
      }
    }

    // === LOUNGE CHAIRS ===
    const loungeSpots = this.layout.lounge_chairs;
    for (const { x: lx, y: ly } of loungeSpots) {
      this.add.rectangle(lx, ly, this.layout.lounge_chair_size.w, this.layout.lounge_chair_size.h, 0xf5f5f5).setStrokeStyle(1, 0xbdbdbd).setDepth(1);
      this.addWall(lx, ly, this.layout.lounge_chair_size.w, this.layout.lounge_chair_size.h);
    }

    // === LIFEGUARD CHAIR (east side) ===
    this.add.rectangle(this.layout.lifeguard_chair.x, this.layout.lifeguard_chair.y, this.layout.lifeguard_chair.w, this.layout.lifeguard_chair.h, 0xffa726).setStrokeStyle(2, 0xf57c00).setDepth(2);
    this.add.text(this.layout.lifeguard_label.x, this.layout.lifeguard_label.y, '🏖️', { fontSize: '18px' }).setOrigin(0.5).setDepth(3);
    this.addWall(this.layout.lifeguard_chair.x, this.layout.lifeguard_chair.y, this.layout.lifeguard_chair.w, this.layout.lifeguard_chair.h);

    // === SLIDE (north side of pool) ===
    this.add.rectangle(this.layout.slide.x, this.layout.slide.y, this.layout.slide.w, this.layout.slide.h, 0x42a5f5).setStrokeStyle(2, 0x1e88e5).setDepth(2);
    this.add.text(this.layout.slide.x, this.layout.slide.y, '🛝', { fontSize: '22px' }).setOrigin(0.5).setDepth(3);
    this.addWall(this.layout.slide.x, this.layout.slide.y, this.layout.slide.w, this.layout.slide.h);

    // === UMBRELLA (decorative) ===
    this.add.text(this.layout.umbrella_left.x, this.layout.umbrella_left.y, '⛱️', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
    this.add.text(this.layout.umbrella_right.x, this.layout.umbrella_right.y, '⛱️', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);

    // === INTERACTABLES ===

    // Pool rules sign
    this.addInteractable({
      x: this.layout.interact_pool_rules.x, y: this.layout.interact_pool_rules.y,
      label: 'Pool Rules',
      icon: '📋',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "POOL RULES:\n1. No running on deck\n2. No diving in shallow end\n3. Shower before entering\n4. Have fun!\n\nSeems fair to me!",
          choices: null, step: null,
        });
      },
    });

    // Diving board
    this.addInteractable({
      x: this.layout.interact_diving_board.x, y: this.layout.interact_diving_board.y,
      label: 'Diving Board',
      icon: '🤿',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "The diving board bounces when I step on it. Looks like it goes over the deep end!\n\n(Diving mini-game coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Towel rack
    this.addInteractable({
      x: this.layout.interact_towel_rack.x, y: this.layout.interact_towel_rack.y,
      label: 'Towel Rack',
      icon: '🧴',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Sunscreen and towels! Always important to protect your skin. SPF 50 or bust!",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏊 Community Pool', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#0d47a1',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south gate → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromCommunityPool',
      label: '🗺️ Leave Pool ⬇',
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('CommunityPoolScene', import.meta.hot, CommunityPoolScene);
