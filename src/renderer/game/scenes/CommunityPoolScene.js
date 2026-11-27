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
import { startInteraction } from '../systems/interactionManager.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';

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
    // Painted concrete deck over the whole scene, then a mown-grass border
    // outside the fence. Both are textures now, not flat fills.
    {
      const o = this.layout.ground_deck;
      this.addGroundTexture(ART.communitypool_deck, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    for (const key of ['grass_border_top', 'grass_border_bottom', 'grass_border_left', 'grass_border_right']) {
      const o = this.layout[key];
      // These layout rects are top-left anchored (they came from fillRect).
      this.addGroundTexture(ART.lakeedge_grass, o.x, o.y, o.w, o.h, { depth: 0 });
    }
    {
      const o = this.layout.pool_deck;
      this.addGroundTexture(ART.communitypool_deck, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h, { depth: 0 });
    }

    // === POOL (water collision) ===
    const poolX = this.layout.pool_water.x, poolY = this.layout.pool_water.y;
    const poolW = this.layout.pool_water.w, poolH = this.layout.pool_water.h;
    // Pool water
    this.addGroundTexture(ART.communitypool_pool_water, poolX - poolW / 2, poolY - poolH / 2, poolW, poolH, { depth: 0 });
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
    this.addProp(ART.lifeguard_chair, this.layout.lifeguard_label.x, this.layout.lifeguard_label.y + 24, { depth: 3 });
    this.addWall(this.layout.lifeguard_chair.x, this.layout.lifeguard_chair.y, this.layout.lifeguard_chair.w, this.layout.lifeguard_chair.h);

    // === SLIDE (north side of pool) ===
    this.add.rectangle(this.layout.slide.x, this.layout.slide.y, this.layout.slide.w, this.layout.slide.h, 0x42a5f5).setStrokeStyle(2, 0x1e88e5).setDepth(2);
    this.addProp(ART.pool_slide, this.layout.slide.x, this.layout.slide.y + 26, { depth: 3 });
    this.addWall(this.layout.slide.x, this.layout.slide.y, this.layout.slide.w, this.layout.slide.h);

    // === UMBRELLA (decorative) ===
    this.addProp(ART.umbrella, this.layout.umbrella_left.x, this.layout.umbrella_left.y + 30, { depth: 3 });
    this.addProp(ART.umbrella, this.layout.umbrella_right.x, this.layout.umbrella_right.y + 30, { depth: 3 });

    // === INTERACTABLES ===

    // Pool rules sign
    this.addInteractable({
      x: this.layout.interact_pool_rules.x, y: this.layout.interact_pool_rules.y,
      label: 'Pool Rules',
      icon: ART.clipboard,
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
      icon: ART.diving_board,
      radius: 55,
      onInteract: () => {
        startInteraction(this, {
          type: 'buoyancy',
          lessonId: 'diving_board_buoyancy',
          knowledgeId: 'concept:buoyancy',
          prompt: 'The board hangs over the deep end. What keeps me from sinking all the way if I jump in?',
          choices: [
            { label: 'Water pushes up with the same force as the water I push aside', correct: true },
            { label: 'The board keeps pulling me back up', correct: false },
            { label: 'Air in the pool rules sign holds me', correct: false },
          ],
          success: 'That push is buoyancy. The same idea tells you if a raft will float.',
        });
      },
    });

    // Towel rack
    this.addInteractable({
      x: this.layout.interact_towel_rack.x, y: this.layout.interact_towel_rack.y,
      label: 'Towel Rack',
      icon: ART.towel_rack,
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
