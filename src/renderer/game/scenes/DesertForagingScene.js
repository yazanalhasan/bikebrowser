/**
 * DesertForagingScene — Sonoran Desert foraging zone.
 *
 * Mechanics: plant harvesting, water management
 * Teaches: ethnobotany, survival math
 * Rewards: fibers, resins, solvents
 */

import BaseSubScene from './BaseSubScene.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

const SCENE_KEY = 'DesertForagingScene';

export default class DesertForagingScene extends BaseSubScene {
  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'desert_foraging'; }
  getWorldSize() { return { width: 1200, height: 800 }; }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // ── Ground ── sandy desert with vegetation patches
    this.add.rectangle(width / 2, height / 2, width, height, 0xd4a574);

    // Vegetation patches (darker ground)
    const patches = [
      { x: 200, y: 200, w: 150, h: 100 },
      { x: 600, y: 350, w: 200, h: 120 },
      { x: 900, y: 500, w: 160, h: 100 },
      { x: 350, y: 600, w: 180, h: 90 },
    ];
    for (const p of patches) {
      this.add.rectangle(p.x, p.y, p.w, p.h, 0xb8956a, 0.6);
    }

    // Dry riverbed (winding path)
    const riverbed = this.add.graphics();
    riverbed.fillStyle(0xc4a882, 0.4);
    riverbed.fillRoundedRect(100, 350, 400, 30, 15);
    riverbed.fillRoundedRect(450, 330, 300, 35, 15);
    riverbed.fillRoundedRect(700, 340, 250, 30, 15);

    // ── Rock formations ──
    const rocks = [
      { x: 100, y: 150, s: '🪨' }, { x: 750, y: 200, s: '🪨' },
      { x: 1050, y: 400, s: '🪨' }, { x: 300, y: 700, s: '🪨' },
      { x: 850, y: 650, s: '🪨' },
    ];
    for (const r of rocks) {
      this.add.text(r.x, r.y, r.s, { fontSize: '32px' }).setOrigin(0.5);
      this.addWall(r.x, r.y, 40, 30);
    }

    // ── Cacti (collision) ──
    const cacti = [
      { x: 180, y: 400 }, { x: 500, y: 250 }, { x: 700, y: 150 },
      { x: 1000, y: 300 }, { x: 400, y: 550 }, { x: 1100, y: 600 },
    ];
    for (const c of cacti) {
      this.add.text(c.x, c.y, '🌵', { fontSize: '36px' }).setOrigin(0.5);
      this.addWall(c.x, c.y, 30, 40);
    }

    // ── Desert wildlife ──
    const lizard = this.add.text(600, 500, '🦎', { fontSize: '20px' }).setOrigin(0.5);
    this.tweens.add({
      targets: lizard, x: 680, y: 480, duration: 4000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const hawk = this.add.text(400, 80, '🦅', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.7);
    this.tweens.add({
      targets: hawk, x: 900, y: 60, duration: 8000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Boundary walls ──
    this.addWall(width / 2, 0, width, 20);       // top
    this.addWall(0, height / 2, 20, height);      // left
    this.addWall(width, height / 2, 20, height);  // right
    // bottom has the exit zone (from BaseSubScene._registerExitPoint)

    // ── Forageable Resources ──
    this.addResource({
      x: 250, y: 230, icon: '🌿', label: 'Yucca Fiber',
      itemId: 'yucca_fiber',
      description: 'Strong natural fiber — used by indigenous peoples for rope and baskets.',
    });
    this.addResource({
      x: 650, y: 380, icon: '🌱', label: 'Agave Fiber',
      itemId: 'agave_fiber',
      description: 'Tough sisal fiber from agave — natural adhesive properties.',
    });
    this.addResource({
      x: 950, y: 530, icon: '🫧', label: 'Jojoba Extract',
      itemId: 'jojoba_extract',
      description: 'Liquid wax from jojoba seeds — natural lubricant and solvent.',
    });
    this.addResource({
      x: 400, y: 630, icon: '🧴', label: 'Creosote Resin',
      itemId: 'creosote_resin',
      description: 'Antiseptic resin from creosote bush — used as natural sealant.',
    });
    this.addResource({
      x: 800, y: 200, icon: '💧', label: 'Barrel Cactus Water',
      itemId: 'cactus_water',
      description: 'Emergency water from barrel cactus pulp.',
    });

    // ── Quest NPC: Desert Guide ──
    this.addNpc({
      id: 'desert_guide',
      name: 'Ranger Nita',
      x: 550, y: 450,
      color: 0x92400e,
      onInteract: () => this._handleGuideInteract(),
    });

    // ── Scene label ──
    this.add.text(width / 2, 30, '🏜️ Sonoran Foraging Grounds', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#5c3d10', stroke: '#f5e6c8', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  setupChallenges() {
    // Embedded challenge 1: Water management math
    this.addChallenge({
      x: 800, y: 350,
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
      x: 350, y: 300,
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
      x: 1050, y: 250,
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
