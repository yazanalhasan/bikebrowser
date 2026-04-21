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

export default class DogParkScene extends LocalSceneBase {
  constructor() {
    super('DogParkScene');
  }

  getWorldSize() {
    return { width: 900, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // === GROUND ===
    // Grass field
    this.add.rectangle(width / 2, height / 2, width, height, 0x8bc34a);

    // Dirt patches
    const dirtGfx = this.add.graphics();
    dirtGfx.fillStyle(0xa1887f, 0.4);
    dirtGfx.fillCircle(300, 350, 50);
    dirtGfx.fillCircle(600, 400, 40);
    dirtGfx.fillCircle(450, 250, 35);

    // Walking path (gravel)
    const pathGfx = this.add.graphics();
    pathGfx.fillStyle(0xd7ccc8, 0.8);
    pathGfx.fillRoundedRect(50, 80, 800, 40, 10);
    pathGfx.fillRoundedRect(width / 2 - 20, 80, 40, height - 160, 10);
    pathGfx.fillRoundedRect(50, height - 120, 800, 40, 10);

    // === FENCE (collision boundary) ===
    const fenceColor = 0x795548;
    // Top fence
    this.addVisibleWall(width / 2, 30, width - 40, 10, fenceColor, 0x5d4037);
    // Bottom fence (gap for gate)
    this.addVisibleWall(200, height - 30, 360, 10, fenceColor, 0x5d4037);
    this.addVisibleWall(700, height - 30, 360, 10, fenceColor, 0x5d4037);
    // Left fence
    this.addVisibleWall(30, height / 2, 10, height - 40, fenceColor, 0x5d4037);
    // Right fence
    this.addVisibleWall(width - 30, height / 2, 10, height - 40, fenceColor, 0x5d4037);

    // Fence posts (decorative)
    for (let x = 50; x < width; x += 80) {
      this.add.rectangle(x, 30, 6, 14, 0x5d4037).setDepth(1);
      if (x < 380 || x > 520) {
        this.add.rectangle(x, height - 30, 6, 14, 0x5d4037).setDepth(1);
      }
    }

    // Gate sign
    this.add.text(width / 2, height - 55, '🐕 Dog Park', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#4e342e',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === BENCHES ===
    const benches = [[150, 200], [700, 200], [150, 500], [700, 500]];
    for (const [bx, by] of benches) {
      this.add.rectangle(bx, by, 50, 20, 0x795548).setStrokeStyle(2, 0x5d4037).setDepth(1);
      this.addWall(bx, by, 50, 20);
    }

    // === TREES ===
    const trees = [[80, 120], [820, 120], [80, 580], [820, 580],
                   [400, 150], [250, 400], [650, 300]];
    for (const [tx, ty] of trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '32px' }).setOrigin(0.5).setDepth(3);
      this.addWall(tx, ty, 20, 20);
    }

    // === DOGS (decorative, walking) ===
    this._dogs = [];
    const dogPositions = [
      { x: 300, y: 300, emoji: '🐕', speed: 30 },
      { x: 500, y: 350, emoji: '🐩', speed: 25 },
      { x: 200, y: 450, emoji: '🐕‍🦺', speed: 35 },
    ];

    for (const dog of dogPositions) {
      const sprite = this.add.text(dog.x, dog.y, dog.emoji, { fontSize: '28px' })
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
      { species: 'ephedra', label: 'Ephedra (Mormon Tea)', x: 100, y: 300, radius: 55 },
      { species: 'yerba_mansa', label: 'Yerba Mansa', x: 500, y: 250, radius: 50 },
      { species: 'creosote', label: 'Creosote Bush', x: 750, y: 400, radius: 55 },
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
      x: 450, y: 350,
      label: 'Water Bowl',
      icon: '🥣',
      radius: 50,
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
      x: 600, y: 250,
      label: 'Tennis Ball',
      icon: '🎾',
      radius: 50,
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
      x: 180, y: 340,
      label: 'Lost Collar',
      icon: '📿',
      radius: 50,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: "A lost dog collar! Someone's pet must have shaken it off.\n\nMaybe I should ask around to find the owner.\n\n(Lost collar quest coming soon!)",
          choices: null, step: null,
        });
      },
    });

    // === SCENE TITLE ===
    this.add.text(width / 2, 55, '🐕 Dog Park', {
      fontSize: '20px', fontFamily: 'sans-serif', color: '#33691e',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // === EXIT (south gate → overworld) ===
    this.addExit({
      x: width / 2, y: height - 14,
      width: 140, height: 28,
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
