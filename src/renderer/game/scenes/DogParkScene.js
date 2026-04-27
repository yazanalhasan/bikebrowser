/**
 * DogParkScene — fenced dog park with walking paths.
 *
 * Local playable scene with:
 *   - Fenced perimeter with gate
 *   - Walking paths, benches, trees
 *   - Dogs (decorative NPCs)
 *   - Future quest hooks (lost collar, dog rescue, fetch)
 *   - Exit to overworld
 *
 * World size: 900×700
 */

import LocalSceneBase from './LocalSceneBase.js';
import QUESTS from '../data/quests.js';
import { saveGame } from '../systems/saveSystem.js';
import { drawPlant } from '../utils/plantRenderer.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

export default class DogParkScene extends LocalSceneBase {
  static layoutEditorConfig = {
    layoutAssetKey: 'dogParkLayout',
    layoutPath: 'layouts/dog-park.layout.json',
  };

  constructor() {
    super('DogParkScene');
  }

  getWorldSize() {
    return { width: 900, height: 700 };
  }

  preload() {
    super.preload?.();
    this.load.json('dogParkLayout', 'layouts/dog-park.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'dogParkLayout');

    // === GROUND ===
    // Grass field
    this.add.rectangle(this.layout.grass_field.x, this.layout.grass_field.y, this.layout.grass_field.w, this.layout.grass_field.h, 0x8bc34a);

    // Dirt patches
    const dirtGfx = this.add.graphics();
    dirtGfx.fillStyle(0xa1887f, 0.4);
    dirtGfx.fillCircle(this.layout.dirt_patch_1.x, this.layout.dirt_patch_1.y, this.layout.dirt_patch_1.r);
    dirtGfx.fillCircle(this.layout.dirt_patch_2.x, this.layout.dirt_patch_2.y, this.layout.dirt_patch_2.r);
    dirtGfx.fillCircle(this.layout.dirt_patch_3.x, this.layout.dirt_patch_3.y, this.layout.dirt_patch_3.r);

    // Walking path (gravel)
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xd7ccc8, 0.8);
    pathGfx.fillRoundedRect(this.layout.path_top.x, this.layout.path_top.y, this.layout.path_top.w, this.layout.path_top.h, 10);
    pathGfx.fillRoundedRect(this.layout.path_center_vertical.x, this.layout.path_center_vertical.y, this.layout.path_center_vertical.w, this.layout.path_center_vertical.h, 10);
    pathGfx.fillRoundedRect(this.layout.path_bottom.x, this.layout.path_bottom.y, this.layout.path_bottom.w, this.layout.path_bottom.h, 10);

    // === FENCE (collision boundary) ===
    const fenceColor = 0x795548;
    // Top fence
    this.addVisibleWall(this.layout.fence_top.x, this.layout.fence_top.y, this.layout.fence_top.w, this.layout.fence_top.h, fenceColor, 0x5d4037);
    // Bottom fence (gap for gate)
    this.addVisibleWall(this.layout.fence_bottom_left.x, this.layout.fence_bottom_left.y, this.layout.fence_bottom_left.w, this.layout.fence_bottom_left.h, fenceColor, 0x5d4037);
    this.addVisibleWall(this.layout.fence_bottom_right.x, this.layout.fence_bottom_right.y, this.layout.fence_bottom_right.w, this.layout.fence_bottom_right.h, fenceColor, 0x5d4037);
    // Left fence
    this.addVisibleWall(this.layout.fence_left.x, this.layout.fence_left.y, this.layout.fence_left.w, this.layout.fence_left.h, fenceColor, 0x5d4037);
    // Right fence
    this.addVisibleWall(this.layout.fence_right.x, this.layout.fence_right.y, this.layout.fence_right.w, this.layout.fence_right.h, fenceColor, 0x5d4037);

    // Fence posts (decorative)
    const fp = this.layout.fence_posts;
    for (let x = fp.x_start; x < this.getWorldSize().width; x += fp.x_step) {
      this.add.rectangle(x, fp.y_top, fp.w, fp.h, 0x5d4037).setDepth(1);
      if (x < fp.gap_min_x || x > fp.gap_max_x) {
        this.add.rectangle(x, fp.y_bottom, fp.w, fp.h, 0x5d4037).setDepth(1);
      }
    }

    // Gate sign
    this.add.text(this.layout.gate_sign.x, this.layout.gate_sign.y, '🐕 Dog Park', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#4e342e',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === BENCHES ===
    for (const { x: bx, y: by } of this.layout.benches) {
      this.add.rectangle(bx, by, this.layout.bench_size.w, this.layout.bench_size.h, 0x795548).setStrokeStyle(2, 0x5d4037).setDepth(1);
      this.addWall(bx, by, this.layout.bench_size.w, this.layout.bench_size.h);
    }

    // === TREES ===
    for (const { x: tx, y: ty } of this.layout.trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 20, 20);
    }

    // === DOGS (decorative, walking) ===
    this._dogs = [];
    const dogEmojis = ['🐕', '🐩', '🐕‍🦺'];

    for (let i = 0; i < this.layout.dog_spots.length; i++) {
      const dog = this.layout.dog_spots[i];
      const sprite = this.add.text(dog.x, dog.y, dogEmojis[i], { fontSize: '28px' })
        .setOrigin(0.5).setDepth(4);

      // Simple wander behavior
      this.tweens.add({
        targets: sprite,
        x: dog.x + (Math.random() - 0.5) * 200,
        y: dog.y + (Math.random() - 0.5) * 100,
        duration: 3000 + Math.random() * 2000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 1000,
      });

      this._dogs.push(sprite);
    }

    // === ECOLOGY PLANTS (drawn with graphics) ===
    this._ecologyPlants = [];

    const parkPlants = [
      { species: 'ephedra', label: 'Ephedra (Mormon Tea)', ...this.layout.plant_ephedra },
      { species: 'yerba_mansa', label: 'Yerba Mansa', ...this.layout.plant_yerba_mansa },
      { species: 'creosote', label: 'Creosote Bush', ...this.layout.plant_creosote },
    ];

    for (const p of parkPlants) {
      const plantContainer = drawPlant(this, p.species, p.x, p.y);
      plantContainer.setDepth(4); // background decoration, below player (depth 6)
      this.addInteractable({
        x: p.x, y: p.y, label: p.label, icon: '',
        radius: p.radius,
        onInteract: () => this._handlePlantInteract(p.species),
      });
      this._ecologyPlants.push({ species: p.species, x: p.x, y: p.y });
    }

    // === WATER BOWL ===
    this.addInteractable({
      x: this.layout.interact_water_bowl.x, y: this.layout.interact_water_bowl.y,
      label: 'Water Bowl',
      icon: '🥣',
      radius: this.layout.interact_water_bowl.radius,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A water bowl for the dogs! 🐕\n\nThey look happy and hydrated. Maybe someday I'll have a dog too...",
          choices: null, step: null,
        });
      },
    });

    // === TENNIS BALL ===
    this.addInteractable({
      x: this.layout.interact_tennis_ball.x, y: this.layout.interact_tennis_ball.y,
      label: 'Tennis Ball',
      icon: '🎾',
      radius: this.layout.interact_tennis_ball.radius,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A tennis ball! I could throw this for the dogs.\n\n(Fetch mini-game coming soon! 🐕)",
          choices: null, step: null,
        });
      },
    });

    // === LOST COLLAR (future quest hook) ===
    this.addInteractable({
      x: this.layout.interact_lost_collar.x, y: this.layout.interact_lost_collar.y,
      label: 'Lost Collar',
      icon: '📿',
      radius: this.layout.interact_lost_collar.radius,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A lost dog collar! Someone's pet must have shaken it off.\n\nMaybe I should ask around to find the owner.\n\n(Lost collar quest coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '🐕 Dog Park', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#33691e',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south gate → overworld) ===
    this.addExit({
      x: this.layout.exit_south.x, y: this.layout.exit_south.y,
      width: this.layout.exit_south.w, height: this.layout.exit_south.h,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromDogPark',
      label: '🗺️ Leave Park ⬇',
    });
  }

  // ── Plant Interaction ──────────────────────────────────────────────────────

  _handlePlantInteract(species) {
    const state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('interaction_ping');

    const PLANT_INFO = {
      ephedra: { desc: 'Ephedra (Mormon Tea) — a powerful natural stimulant. Boosts energy but stresses the heart. Use with caution!', items: ['ephedra_stems'] },
      yerba_mansa: { desc: 'Yerba mansa — powerful antimicrobial root found near water. The desert\'s natural antibiotic.', items: ['yerba_mansa_root'] },
      creosote: { desc: 'Creosote bush — antimicrobial resin. Careful: toxic in large doses.', items: ['creosote_leaves'] },
    };

    const info = PLANT_INFO[species] || { desc: `A ${species} plant.`, items: [] };

    // Check if active quest needs this item
    if (state.activeQuest) {
      const quest = QUESTS[state.activeQuest.id];
      const step = quest?.steps[state.activeQuest.stepIndex];
      if (step?.type === 'forage' && info.items.includes(step.requiredItem)) {
        const updated = { ...state, inventory: [...state.inventory, step.requiredItem] };
        this.registry.set('gameState', updated);
        saveGame(updated);
        audioMgr?.playSfx('item_pickup');
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: `Found ${step.requiredItem.replace(/_/g, ' ')}! ${info.desc}`,
          choices: null, step: null,
        });
        return;
      }
    }

    this.registry.set('dialogEvent', {
      speaker: 'Zuzu', text: info.desc, choices: null, step: null,
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('DogParkScene', import.meta.hot, DogParkScene);
