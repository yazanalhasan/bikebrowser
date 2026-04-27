/**
 * DesertForagingScene — Sonoran Desert foraging zone.
 *
 * Mechanics: plant harvesting, water management
 * Teaches: ethnobotany, survival math
 * Rewards: fibers, resins, solvents
 */

import BaseSubScene from './BaseSubScene.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

const SCENE_KEY = 'DesertForagingScene';

export default class DesertForagingScene extends BaseSubScene {
  static layoutEditorConfig = {
    layoutAssetKey: 'desertForagingLayout',
    layoutPath: 'layouts/desert-foraging.layout.json',
  };

  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'desert_foraging'; }
  getWorldSize() { return { width: 1200, height: 800 }; }

  preload() {
    super.preload?.();
    this.load.json('desertForagingLayout', 'layouts/desert-foraging.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'desertForagingLayout');

    // ── Ground ── sandy desert with vegetation patches
    this.add.rectangle(this.layout.ground.x, this.layout.ground.y, this.layout.ground.w, this.layout.ground.h, 0xd4a574);

    // Vegetation patches (darker ground)
    for (const p of this.layout.patches) {
      this.add.rectangle(p.x, p.y, p.w, p.h, 0xb8956a, 0.6);
    }

    // Dry riverbed (winding path)
    const riverbed = this.add.graphics();
    riverbed.fillStyle(0xc4a882, 0.4);
    riverbed.fillRoundedRect(this.layout.riverbed_west.x, this.layout.riverbed_west.y, this.layout.riverbed_west.w, this.layout.riverbed_west.h, 15);
    riverbed.fillRoundedRect(this.layout.riverbed_mid.x, this.layout.riverbed_mid.y, this.layout.riverbed_mid.w, this.layout.riverbed_mid.h, 15);
    riverbed.fillRoundedRect(this.layout.riverbed_east.x, this.layout.riverbed_east.y, this.layout.riverbed_east.w, this.layout.riverbed_east.h, 15);

    // ── Rock formations ──
    for (const r of this.layout.rocks) {
      this.add.text(r.x, r.y, '🪨', { fontSize: '32px' }).setOrigin(0.5);
      this.addWall(r.x, r.y, 40, 30);
    }

    // ── Cacti (collision) ──
    for (const c of this.layout.cacti) {
      this.add.text(c.x, c.y, '🌵', { fontSize: '36px' }).setOrigin(0.5);
      this.addWall(c.x, c.y, 30, 40);
    }

    // ── Desert wildlife ──
    const lizard = this.add.text(this.layout.lizard.x, this.layout.lizard.y, '🦎', { fontSize: '20px' }).setOrigin(0.5);
    this.tweens.add({
      targets: lizard, x: 680, y: 480, duration: 4000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const hawk = this.add.text(this.layout.hawk.x, this.layout.hawk.y, '🦅', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.7);
    this.tweens.add({
      targets: hawk, x: 900, y: 60, duration: 8000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Boundary walls ──
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);       // top
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);    // left
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h); // right
    // bottom has the exit zone (from BaseSubScene._registerExitPoint)

    // ── Forageable Resources ──
    this.addResource({
      x: this.layout.resource_yucca_fiber.x, y: this.layout.resource_yucca_fiber.y, icon: '🌿', label: 'Yucca Fiber',
      itemId: 'yucca_fiber',
      description: 'Strong natural fiber — used by indigenous peoples for rope and baskets.',
    });
    this.addResource({
      x: this.layout.resource_agave_fiber.x, y: this.layout.resource_agave_fiber.y, icon: '🌱', label: 'Agave Fiber',
      itemId: 'agave_fiber',
      description: 'Tough sisal fiber from agave — natural adhesive properties.',
    });
    this.addResource({
      x: this.layout.resource_jojoba_extract.x, y: this.layout.resource_jojoba_extract.y, icon: '🫧', label: 'Jojoba Extract',
      itemId: 'jojoba_extract',
      description: 'Liquid wax from jojoba seeds — natural lubricant and solvent.',
    });
    this.addResource({
      x: this.layout.resource_creosote_resin.x, y: this.layout.resource_creosote_resin.y, icon: '🧴', label: 'Creosote Resin',
      itemId: 'creosote_resin',
      description: 'Antiseptic resin from creosote bush — used as natural sealant.',
    });
    this.addResource({
      x: this.layout.resource_barrel_cactus_water.x, y: this.layout.resource_barrel_cactus_water.y, icon: '💧', label: 'Barrel Cactus Water',
      itemId: 'cactus_water',
      description: 'Emergency water from barrel cactus pulp.',
    });

    // ── Quest NPC: Desert Guide ──
    this.addNpc({
      id: 'desert_guide',
      name: 'Ranger Nita',
      x: this.layout.npc_desert_guide.x, y: this.layout.npc_desert_guide.y,
      color: 0x92400e,
      onInteract: () => this._handleGuideInteract(),
    });

    // ── Scene label ──
    this.add.text(this.layout.scene_label.x, this.layout.scene_label.y, '🏜️ Sonoran Foraging Grounds', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#5c3d10', stroke: '#f5e6c8', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  setupChallenges() {
    // Embedded challenge 1: Water management math
    this.addChallenge({
      x: this.layout.challenge_water_math.x, y: this.layout.challenge_water_math.y,
      icon: '🧮',
      label: 'Water Math',
      question: 'You have 1.5 liters of water. Each hour in the desert, you need 350ml. How many full hours can you survive?',
      choices: [
        { label: '4 hours', correct: true },
        { label: '3 hours', correct: false },
        { label: '5 hours', correct: false },
        { label: '6 hours', correct: false },
      ],
      explanation: '1500 / 350 = 4.28, so 4 full hours. Always round DOWN for survival!',
      concept: 'division with remainders in real-world context',
      reward: { zuzubucks: 15, reputation: 5 },
    });

    // Embedded challenge 2: Plant identification ratio
    this.addChallenge({
      x: this.layout.challenge_plant_ratio.x, y: this.layout.challenge_plant_ratio.y,
      icon: '🔬',
      label: 'Plant Ratio',
      question: 'In this area, for every 5 cacti there are 3 shrubs and 2 wildflowers. If you counted 20 cacti, how many shrubs would you expect?',
      choices: [
        { label: '12 shrubs', correct: true },
        { label: '10 shrubs', correct: false },
        { label: '15 shrubs', correct: false },
        { label: '8 shrubs', correct: false },
      ],
      explanation: 'Ratio is 5:3. If cacti = 20 (×4), shrubs = 3×4 = 12.',
      concept: 'equivalent ratios',
      reward: { zuzubucks: 15, reputation: 5 },
    });

    // Embedded challenge 3: Temperature estimation
    this.addChallenge({
      x: this.layout.challenge_heat_math.x, y: this.layout.challenge_heat_math.y,
      icon: '🌡️',
      label: 'Heat Math',
      question: 'The temperature rises 3°F every hour starting from 85°F at 8am. What will it be at noon?',
      choices: [
        { label: '97°F', correct: true },
        { label: '100°F', correct: false },
        { label: '94°F', correct: false },
        { label: '91°F', correct: false },
      ],
      explanation: '8am to noon = 4 hours. 4 × 3 = 12. 85 + 12 = 97°F.',
      concept: 'arithmetic patterns applied to temperature',
      reward: { zuzubucks: 15, reputation: 5 },
    });
  }

  _handleGuideInteract() {
    const state = this.registry.get('gameState');
    const fiberQuest = state.sideQuests?.collect_desert_fibers;
    const waterQuest = state.sideQuests?.water_management_101;

    if (fiberQuest?.completed && waterQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Ranger Nita',
        text: 'You\'ve learned so much about desert plants! Come back anytime to collect more resources.',
        choices: null, step: null,
      });
    } else if (!fiberQuest) {
      this.registry.set('dialogEvent', {
        speaker: 'Ranger Nita',
        text: 'Welcome to the Sonoran Foraging Grounds! I\'m Ranger Nita. Want to learn about desert plants? I have a fiber-collecting challenge for you.',
        choices: [
          { label: 'Start the Fiber Quest!', action: 'start_quest', questId: 'collect_desert_fibers' },
          { label: 'Maybe later', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'collect_desert_fibers' },
      });
    } else if (!waterQuest && fiberQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Ranger Nita',
        text: 'Great fiber work! Now, let me teach you about water management in the desert.',
        choices: [
          { label: 'Start the Water Quest!', action: 'start_quest', questId: 'water_management_101' },
          { label: 'Maybe later', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'water_management_101' },
      });
    } else {
      // Active quest — show current step
      const activeId = fiberQuest && !fiberQuest.completed ? 'collect_desert_fibers' : 'water_management_101';
      this.triggerSideQuest(activeId); // will show current step
    }
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, DesertForagingScene);
