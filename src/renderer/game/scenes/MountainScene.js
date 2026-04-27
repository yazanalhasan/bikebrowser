/**
 * MountainScene — foothills and mountain terrain with climbing paths.
 *
 * Local playable scene with:
 *   - Foothills at bottom, steeper terrain going up
 *   - Rocky collision areas, a climb path
 *   - Cave entrance interactable (future boss/puzzle)
 *   - Rare materials interactable
 *   - Exit south to overworld
 *
 * World size: 1000x900
 */

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

export default class MountainScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'mountainLayout',
    layoutPath: 'layouts/mountain.layout.json',
  };

  constructor() {
    super('MountainScene');
  }

  getWorldSize() {
    return { width: 1000, height: 900 };
  }

  preload() {
    super.preload?.();
    this.load.json('mountainLayout', 'layouts/mountain.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'mountainLayout');

    const { width, height } = this.getWorldSize();

    // === GROUND (terrain zones, top to bottom) ===
    // Snow-capped peak (very top)
    this.add.rectangle(this.layout.terrain_snow_peak.x, this.layout.terrain_snow_peak.y, this.layout.terrain_snow_peak.w, this.layout.terrain_snow_peak.h, 0xeceff1);
    // Rocky upper mountain
    this.add.rectangle(this.layout.terrain_rocky_upper.x, this.layout.terrain_rocky_upper.y, this.layout.terrain_rocky_upper.w, this.layout.terrain_rocky_upper.h, 0x9e9e9e);
    // Mid-mountain (brown/grey rock)
    this.add.rectangle(this.layout.terrain_mid_mountain.x, this.layout.terrain_mid_mountain.y, this.layout.terrain_mid_mountain.w, this.layout.terrain_mid_mountain.h, 0x8d6e63);
    // Foothills (green-brown transition)
    this.add.rectangle(this.layout.terrain_foothills.x, this.layout.terrain_foothills.y, this.layout.terrain_foothills.w, this.layout.terrain_foothills.h, 0xa5956b);
    // Grassy base
    this.add.rectangle(this.layout.terrain_grassy_base.x, this.layout.terrain_grassy_base.y, this.layout.terrain_grassy_base.w, this.layout.terrain_grassy_base.h, 0x7cb342);

    // Terrain blending
    const blendGfx = this.add.graphics();
    blendGfx.fillStyle(0xbcaaa4, 0.3);
    for (let x = 0; x < width; x += 40) {
      blendGfx.fillTriangle(x, 480, x + 40, 480, x + 20, 480 + 30 + Math.random() * 20);
    }
    blendGfx.fillStyle(0x8bc34a, 0.3);
    for (let x = 0; x < width; x += 50) {
      blendGfx.fillTriangle(x, 660, x + 50, 660, x + 25, 660 + 25 + Math.random() * 20);
    }

    // === CLIMB PATH (winding upward) ===
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xc9a85c, 0.7);
    // Lower path
    pathGfx.fillRoundedRect(this.layout.path_lower.x, this.layout.path_lower.y, this.layout.path_lower.w, this.layout.path_lower.h, 8);
    // Switchback up
    pathGfx.fillRoundedRect(this.layout.path_switchback_right_1.x, this.layout.path_switchback_right_1.y, this.layout.path_switchback_right_1.w, this.layout.path_switchback_right_1.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_switchback_horizontal_1.x, this.layout.path_switchback_horizontal_1.y, this.layout.path_switchback_horizontal_1.w, this.layout.path_switchback_horizontal_1.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_switchback_left_1.x, this.layout.path_switchback_left_1.y, this.layout.path_switchback_left_1.w, this.layout.path_switchback_left_1.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_switchback_horizontal_2.x, this.layout.path_switchback_horizontal_2.y, this.layout.path_switchback_horizontal_2.w, this.layout.path_switchback_horizontal_2.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_switchback_right_2.x, this.layout.path_switchback_right_2.y, this.layout.path_switchback_right_2.w, this.layout.path_switchback_right_2.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_switchback_horizontal_3.x, this.layout.path_switchback_horizontal_3.y, this.layout.path_switchback_horizontal_3.w, this.layout.path_switchback_horizontal_3.h, 8);
    // Upper path to peak
    pathGfx.fillRoundedRect(this.layout.path_upper_vertical.x, this.layout.path_upper_vertical.y, this.layout.path_upper_vertical.w, this.layout.path_upper_vertical.h, 8);
    pathGfx.fillRoundedRect(this.layout.path_upper_horizontal.x, this.layout.path_upper_horizontal.y, this.layout.path_upper_horizontal.w, this.layout.path_upper_horizontal.h, 8);

    // === BOUNDARY WALLS ===
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);      // left
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h);  // right

    // === ROCKY CLIFFS (collision walls representing impassable rock) ===
    // Upper mountain barriers (force player to use switchback path)
    this.addVisibleWall(this.layout.cliff_upper_left.x, this.layout.cliff_upper_left.y, this.layout.cliff_upper_left.w, this.layout.cliff_upper_left.h, 0x757575, 0x616161);
    this.addVisibleWall(this.layout.cliff_upper_right.x, this.layout.cliff_upper_right.y, this.layout.cliff_upper_right.w, this.layout.cliff_upper_right.h, 0x757575, 0x616161);
    this.addVisibleWall(this.layout.cliff_mid_left.x, this.layout.cliff_mid_left.y, this.layout.cliff_mid_left.w, this.layout.cliff_mid_left.h, 0x6d4c41, 0x5d4037);
    this.addVisibleWall(this.layout.cliff_mid_right.x, this.layout.cliff_mid_right.y, this.layout.cliff_mid_right.w, this.layout.cliff_mid_right.h, 0x6d4c41, 0x5d4037);
    // Peak barriers
    this.addVisibleWall(this.layout.cliff_peak_left.x, this.layout.cliff_peak_left.y, this.layout.cliff_peak_left.w, this.layout.cliff_peak_left.h, 0xbdbdbd, 0x9e9e9e);
    this.addVisibleWall(this.layout.cliff_peak_right.x, this.layout.cliff_peak_right.y, this.layout.cliff_peak_right.w, this.layout.cliff_peak_right.h, 0xbdbdbd, 0x9e9e9e);

    // === BOULDERS ===
    for (const { x: bx, y: by, size } of this.layout.boulders) {
      this.add.text(bx, by, '🪨', { fontSize: `${size}px` }).setOrigin(0.5).setDepth(3);
      this.addWall(bx, by, size * 0.7, size * 0.6);
    }

    // === TREES (foothills only) ===
    for (const { x: tx, y: ty } of this.layout.trees) {
      this.add.text(tx, ty, '🌲', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 18, 18);
    }

    // === SNOW (decorative, upper region) ===
    const snowGfx = this.add.graphics();
    snowGfx.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 15; i++) {
      snowGfx.fillCircle(100 + Math.random() * 800, 40 + Math.random() * 80, 5 + Math.random() * 10);
    }

    // === EAGLE (decorative, soaring) ===
    const eagle = this.add.text(this.layout.eagle.x, this.layout.eagle.y, '🦅', { fontSize: '26px' }).setOrigin(0.5).setDepth(5);
    this.tweens.add({
      targets: eagle,
      x: 800, y: 80,
      duration: 6000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // === MOUNTAIN GOAT (decorative) ===
    const goat = this.add.text(this.layout.goat.x, this.layout.goat.y, '🐐', { fontSize: '22px' }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: goat,
      x: 250, y: 330,
      duration: 3500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // === INTERACTABLES ===

    // Cave entrance (upper mountain)
    this.addInteractable({
      x: this.layout.interact_cave.x, y: this.layout.interact_cave.y,
      label: 'Cave Entrance',
      icon: '🕳️',
      radius: 60,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A massive cave carved into the mountainside... Strange echoes come from deep within.\n\nThis feels important. I should prepare before going in.\n\n(Mountain dungeon coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // Rare minerals / copper ore
    this.addInteractable({
      x: this.layout.interact_minerals.x, y: this.layout.interact_minerals.y,
      label: 'Rare Minerals',
      icon: '💎',
      radius: 55,
      onInteract: () => {
        const state = this.registry.get('gameState');
        const step = state?.activeQuest?.id === 'bridge_collapse'
          ? this._getQuestStep(state, 'forage')
          : null;

        if (step?.requiredItem === 'copper_ore_sample' && !(state.inventory || []).includes('copper_ore_sample')) {
          const updated = { ...state, inventory: [...state.inventory, 'copper_ore_sample'] };
          this.registry.set('gameState', updated);
          saveGame(updated);
          const audioMgr = this.registry.get('audioManager');
          audioMgr?.playSfx('item_pickup');
          this.registry.set('dialogEvent', {
            speaker: 'Zuzu',
            text: "Copper ore! The greenish-brown vein is unmistakable.\n\n🟤 Got: Copper Ore Sample\n\nCopper is Arizona's signature metal — high conductivity, soft enough to shape.",
            choices: null, step: null,
          });
          return;
        }

        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "Whoa, there are crystals and copper veins embedded in this rock face! They shimmer purple and blue.\n\nThese could be really valuable for upgrades!",
          choices: null, step: null,
        });
      },
    });

    // Summit viewpoint
    this.addInteractable({
      x: this.layout.interact_summit.x, y: this.layout.interact_summit.y,
      label: 'Summit View',
      icon: '🔭',
      radius: 55,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "I can see the whole world from up here! The town, the lake, the desert trail...\n\nAll that climbing was worth it. What an amazing view!",
          choices: null, step: null,
        });
      },
    });

    // Mountain spring
    this.addInteractable({
      x: this.layout.interact_spring.x, y: this.layout.interact_spring.y,
      label: 'Mountain Spring',
      icon: '💧',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A fresh mountain spring! The water is ice cold and crystal clear.\n\nNature's water fountain, straight from the mountain.",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🏔️ Mountain Trail', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#37474f',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromMountain',
      label: '🗺️ Descend ⬇',
    });
  }

  _getQuestStep(state, stepType) {
    if (!state?.activeQuest) return null;
    const quest = QUESTS[state.activeQuest.id];
    if (!quest) return null;
    const step = quest.steps[state.activeQuest.stepIndex];
    if (step?.type === stepType) return step;
    return null;
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('MountainScene', import.meta.hot, MountainScene);
