/**
 * SaltRiverScene — Salt River Basin sub-scene.
 *
 * Mechanics: water flow observation, ecological sampling
 * Teaches: biology, fluid dynamics, fractions
 * Rewards: organic compounds, microbial samples, fluid dynamics knowledge
 */

import BaseSubScene from './BaseSubScene.js';

const SCENE_KEY = 'SaltRiverScene';

export default class SaltRiverScene extends BaseSubScene {
  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'salt_river'; }
  getWorldSize() { return { width: 1100, height: 800 }; }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // ── Terrain layers ──
    // Southern bank (grass)
    this.add.rectangle(width / 2, height - 100, width, 200, 0x7caa55);
    // Sandy riverbank
    this.add.rectangle(width / 2, height - 220, width, 60, 0xd4b896);
    // River (flowing water)
    this.add.rectangle(width / 2, height / 2 - 20, width, 280, 0x4a90d9);
    // Northern bank
    this.add.rectangle(width / 2, 120, width, 240, 0x8bbc6a);
    // Sandy shore (north)
    this.add.rectangle(width / 2, 250, width, 40, 0xd4b896);

    // ── Water animation (ripples) ──
    const waterGraphics = this.add.graphics();
    waterGraphics.setDepth(1);
    for (let i = 0; i < 12; i++) {
      const rx = 80 + Math.random() * (width - 160);
      const ry = 280 + Math.random() * 220;
      waterGraphics.lineStyle(1, 0x7cb8e8, 0.4);
      waterGraphics.strokeEllipse(rx, ry, 40 + Math.random() * 30, 8);
    }

    // Flowing water particles (horizontal drift)
    for (let i = 0; i < 8; i++) {
      const leaf = this.add.text(
        Math.random() * width,
        290 + Math.random() * 200,
        i % 2 === 0 ? '🍃' : '🪵',
        { fontSize: '14px' }
      ).setOrigin(0.5).setAlpha(0.6).setDepth(2);
      this.tweens.add({
        targets: leaf, x: width + 50, duration: 8000 + Math.random() * 6000,
        repeat: -1, ease: 'Linear',
        onRepeat: () => { leaf.x = -50; leaf.y = 290 + Math.random() * 200; },
      });
    }

    // ── Rocks in river ──
    const riverRocks = [
      { x: 200, y: 350 }, { x: 500, y: 400 }, { x: 800, y: 370 },
      { x: 350, y: 430 }, { x: 650, y: 320 }, { x: 950, y: 410 },
    ];
    for (const r of riverRocks) {
      const rock = this.add.circle(r.x, r.y, 15, 0x777777).setDepth(3);
      rock.setStrokeStyle(2, 0x555555);
      this.addWall(r.x, r.y, 30, 30);
    }

    // ── Trees (north bank) ──
    const trees = [
      { x: 120, y: 80 }, { x: 300, y: 100 }, { x: 500, y: 70 },
      { x: 700, y: 90 }, { x: 900, y: 80 }, { x: 1000, y: 110 },
    ];
    for (const t of trees) {
      this.add.text(t.x, t.y, '🌳', { fontSize: '32px' }).setOrigin(0.5);
      this.addWall(t.x, t.y, 30, 30);
    }

    // ── Reeds along riverbank ──
    const reeds = [
      { x: 100, y: 260 }, { x: 250, y: 255 }, { x: 400, y: 265 },
      { x: 600, y: 258 }, { x: 800, y: 262 }, { x: 950, y: 260 },
      { x: 150, y: 510 }, { x: 350, y: 515 }, { x: 550, y: 508 },
      { x: 750, y: 512 }, { x: 900, y: 518 },
    ];
    for (const r of reeds) {
      this.add.text(r.x, r.y, '🌾', { fontSize: '18px' }).setOrigin(0.5);
    }

    // ── Wildlife ──
    // Fish in water
    for (let i = 0; i < 4; i++) {
      const fish = this.add.text(200 + i * 200, 340 + Math.random() * 100, '🐟', {
        fontSize: '16px',
      }).setOrigin(0.5).setDepth(2);
      this.tweens.add({
        targets: fish, x: fish.x + 80, y: fish.y + 20,
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // Heron on shore
    const heron = this.add.text(750, 250, '🦩', { fontSize: '28px' }).setOrigin(0.5);
    this.tweens.add({
      targets: heron, y: 245, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Frog
    const frog = this.add.text(300, 510, '🐸', { fontSize: '20px' }).setOrigin(0.5);
    this.tweens.add({
      targets: frog, x: 340, y: 500, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Quad.easeInOut',
    });

    // ── Irrigation channels (south bank) ──
    const channels = this.add.graphics();
    channels.lineStyle(4, 0x6b98d4, 0.5);
    // Channel A
    channels.lineBetween(300, 550, 300, 700);
    channels.lineBetween(300, 700, 200, 750);
    // Channel B
    channels.lineBetween(550, 550, 550, 700);
    channels.lineBetween(550, 700, 550, 750);
    // Channel C
    channels.lineBetween(800, 550, 800, 700);
    channels.lineBetween(800, 700, 900, 750);

    this.add.text(200, 760, 'Ch. A', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);
    this.add.text(550, 760, 'Ch. B', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);
    this.add.text(900, 760, 'Ch. C', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);

    // ── Boundary ──
    this.addWall(width / 2, 0, width, 20);
    this.addWall(0, height / 2, 20, height);
    this.addWall(width, height / 2, 20, height);

    // ── Resources ──
    this.addResource({
      x: 450, y: 390, icon: '🧪', label: 'Algae Sample',
      itemId: 'algae_sample',
      description: 'Green algae from the river — could produce organic compounds.',
    });
    this.addResource({
      x: 250, y: 340, icon: '🔬', label: 'Microbial Sample',
      itemId: 'microbial_sample',
      description: 'Microorganisms from river sediment — potential for bio-production.',
    });
    this.addResource({
      x: 850, y: 380, icon: '💎', label: 'Mineral Deposit',
      itemId: 'river_minerals',
      description: 'Dissolved minerals deposited along the riverbed.',
    });
    this.addResource({
      x: 650, y: 620, icon: '🌿', label: 'River Reed Fiber',
      itemId: 'reed_fiber',
      description: 'Tough natural fiber from river reeds — good for weaving.',
    });

    // ── Quest NPC: Biologist ──
    this.addNpc({
      id: 'river_biologist',
      name: 'Dr. Maya',
      x: 550, y: 180,
      color: 0x2563eb,
      onInteract: () => this._handleBiologistInteract(),
    });

    // ── Scene label ──
    this.add.text(width / 2, 20, '🏞️ Salt River Basin', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#1e3a5f', stroke: '#dbeafe', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  setupChallenges() {
    // Embedded challenge 1: Flow rate
    this.addChallenge({
      x: 650, y: 440,
      icon: '🌊',
      label: 'Flow Rate',
      question: 'The river moves 120 liters of water past this point every minute. How many liters flow past in 2.5 minutes?',
      choices: [
        { label: '300 liters', correct: true },
        { label: '240 liters', correct: false },
        { label: '360 liters', correct: false },
        { label: '280 liters', correct: false },
      ],
      explanation: '120 × 2.5 = 300 liters. Multiply the rate by the time.',
      concept: 'rate × time = amount (multiplication with decimals)',
      reward: { zuzubucks: 15, reputation: 5 },
    });

    // Embedded challenge 2: Ecosystem balance
    this.addChallenge({
      x: 150, y: 170,
      icon: '🔄',
      label: 'Food Chain',
      question: 'In this river, 1 heron eats 5 fish, and each fish eats 20 insects. If there are 3 herons, how many insects are needed to support them?',
      choices: [
        { label: '300 insects', correct: true },
        { label: '100 insects', correct: false },
        { label: '60 insects', correct: false },
        { label: '200 insects', correct: false },
      ],
      explanation: '3 herons × 5 fish × 20 insects = 300. Food chains multiply at each level!',
      concept: 'multi-step multiplication in ecology',
      reward: { zuzubucks: 15, reputation: 5 },
    });

    // Embedded challenge 3: Water distribution
    this.addChallenge({
      x: 550, y: 680,
      icon: '💧',
      label: 'Irrigation Math',
      question: 'The river provides 900 liters/hour. Channel A needs 1/3, Channel B needs 1/4. How much is left for Channel C?',
      choices: [
        { label: '375 liters/hour', correct: true },
        { label: '300 liters/hour', correct: false },
        { label: '450 liters/hour', correct: false },
        { label: '225 liters/hour', correct: false },
      ],
      explanation: 'A = 900/3 = 300. B = 900/4 = 225. C = 900 - 300 - 225 = 375.',
      concept: 'fraction operations with different denominators',
      reward: { zuzubucks: 20, reputation: 5 },
    });
  }

  _handleBiologistInteract() {
    const state = this.registry.get('gameState');
    const ecosystemQuest = state.sideQuests?.river_ecosystem_survey;
    const flowQuest = state.sideQuests?.balance_the_flow;

    if (ecosystemQuest?.completed && flowQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Dr. Maya',
        text: 'You\'re becoming a real river ecologist! Your samples will help with bio-production research.',
        choices: null, step: null,
      });
    } else if (!ecosystemQuest) {
      this.registry.set('dialogEvent', {
        speaker: 'Dr. Maya',
        text: 'Hi there! I\'m Dr. Maya, studying the Salt River ecosystem. Want to help me survey the wildlife?',
        choices: [
          { label: 'Start Ecosystem Survey!', action: 'start_quest', questId: 'river_ecosystem_survey' },
          { label: 'Just exploring', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'river_ecosystem_survey' },
      });
    } else if (!flowQuest && ecosystemQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Dr. Maya',
        text: 'Great survey work! Now I need help balancing the irrigation channels. It\'s all about water fractions.',
        choices: [
          { label: 'Start Flow Quest!', action: 'start_quest', questId: 'balance_the_flow' },
          { label: 'Maybe later', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'balance_the_flow' },
      });
    } else {
      const activeId = ecosystemQuest && !ecosystemQuest.completed ? 'river_ecosystem_survey' : 'balance_the_flow';
      this.triggerSideQuest(activeId);
    }
  }
}
