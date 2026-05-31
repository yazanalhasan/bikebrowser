/**
 * SaltRiverScene — Salt River Basin sub-scene.
 *
 * Mechanics: water flow observation, ecological sampling
 * Teaches: biology, fluid dynamics, fractions
 * Rewards: organic compounds, microbial samples, fluid dynamics knowledge
 */

import BaseSubScene from './BaseSubScene.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

const SCENE_KEY = 'SaltRiverScene';

export default class SaltRiverScene extends BaseSubScene {
  static layoutEditorConfig = {
    layoutAssetKey: 'saltRiverLayout',
    layoutPath: 'layouts/salt-river.layout.json',
  };

  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'salt_river'; }
  getWorldSize() { return { width: 1100, height: 800 }; }

  preload() {
    super.preload?.();
    this.load.json('saltRiverLayout', 'layouts/salt-river.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'saltRiverLayout');
    const { width, height } = this.getWorldSize();

    this._renderCanyonRiverBackground(width, height);

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
    for (const r of this.layout.river_rocks) {
      const rock = this.add.circle(r.x, r.y, 15, 0x777777).setDepth(3);
      rock.setStrokeStyle(2, 0x555555);
      this.addWall(r.x, r.y, 30, 30);
    }

    // ── Trees (north bank) ──
    for (const t of this.layout.trees) {
      this.add.text(t.x, t.y, '🌳', { fontSize: '32px' }).setOrigin(0.5);
      this.addWall(t.x, t.y, 30, 30);
    }

    // ── Reeds along riverbank ──
    for (const r of this.layout.reeds) {
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
    const heron = this.add.text(this.layout.heron.x, this.layout.heron.y, '🦩', { fontSize: '28px' }).setOrigin(0.5);
    this.tweens.add({
      targets: heron, y: 245, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Frog
    const frog = this.add.text(this.layout.frog.x, this.layout.frog.y, '🐸', { fontSize: '20px' }).setOrigin(0.5);
    this.tweens.add({
      targets: frog, x: 340, y: 500, duration: 2000,
      yoyo: true, repeat: -1, ease: 'Quad.easeInOut',
    });

    // ── Irrigation channels (south bank) ──
    const channels = this.add.graphics();
    channels.lineStyle(4, 0x6b98d4, 0.5);
    // Channel A
    channels.lineBetween(this.layout.channel_a_top.x1, this.layout.channel_a_top.y1, this.layout.channel_a_top.x2, this.layout.channel_a_top.y2);
    channels.lineBetween(this.layout.channel_a_bottom.x1, this.layout.channel_a_bottom.y1, this.layout.channel_a_bottom.x2, this.layout.channel_a_bottom.y2);
    // Channel B
    channels.lineBetween(this.layout.channel_b_top.x1, this.layout.channel_b_top.y1, this.layout.channel_b_top.x2, this.layout.channel_b_top.y2);
    channels.lineBetween(this.layout.channel_b_bottom.x1, this.layout.channel_b_bottom.y1, this.layout.channel_b_bottom.x2, this.layout.channel_b_bottom.y2);
    // Channel C
    channels.lineBetween(this.layout.channel_c_top.x1, this.layout.channel_c_top.y1, this.layout.channel_c_top.x2, this.layout.channel_c_top.y2);
    channels.lineBetween(this.layout.channel_c_bottom.x1, this.layout.channel_c_bottom.y1, this.layout.channel_c_bottom.x2, this.layout.channel_c_bottom.y2);

    this.add.text(this.layout.channel_label_a.x, this.layout.channel_label_a.y, 'Ch. A', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);
    this.add.text(this.layout.channel_label_b.x, this.layout.channel_label_b.y, 'Ch. B', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);
    this.add.text(this.layout.channel_label_c.x, this.layout.channel_label_c.y, 'Ch. C', { fontSize: '10px', color: '#3b5998' }).setOrigin(0.5);

    // ── Boundary ──
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h);

    // ── Resources ──
    this.addResource({
      x: this.layout.resource_algae_sample.x, y: this.layout.resource_algae_sample.y, icon: '🧪', label: 'Algae Sample',
      itemId: 'algae_sample',
      description: 'Green algae from the river — could produce organic compounds.',
    });
    this.addResource({
      x: this.layout.resource_microbial_sample.x, y: this.layout.resource_microbial_sample.y, icon: '🔬', label: 'Microbial Sample',
      itemId: 'microbial_sample',
      description: 'Microorganisms from river sediment — potential for bio-production.',
    });
    this.addResource({
      x: this.layout.resource_mineral_deposit.x, y: this.layout.resource_mineral_deposit.y, icon: '💎', label: 'Mineral Deposit',
      itemId: 'river_minerals',
      description: 'Dissolved minerals deposited along the riverbed.',
    });
    this.addResource({
      x: this.layout.resource_reed_fiber.x, y: this.layout.resource_reed_fiber.y, icon: '🌿', label: 'River Reed Fiber',
      itemId: 'reed_fiber',
      description: 'Tough natural fiber from river reeds — good for weaving.',
    });

    // ── Quest NPC: Biologist ──
    this.addNpc({
      id: 'river_biologist',
      name: 'Dr. Maya',
      x: this.layout.npc_biologist.x, y: this.layout.npc_biologist.y,
      color: 0x2563eb,
      onInteract: () => this._handleBiologistInteract(),
    });

    // ── Scene label ──
    this.add.text(this.layout.scene_label.x, this.layout.scene_label.y, '🏞️ Salt River Basin', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#1e3a5f', stroke: '#dbeafe', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  _renderCanyonRiverBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, 0x8bd5f5);
    this.add.rectangle(width / 2, 92, width, 184, 0x58b7ee).setAlpha(0.42);

    const canyon = this.add.graphics();
    canyon.fillStyle(0xf07a2e, 0.92);
    canyon.fillTriangle(0, 260, 110, 120, 245, 300);
    canyon.fillTriangle(74, 260, 206, 94, 355, 310);
    canyon.fillStyle(0x813c75, 0.58);
    canyon.fillTriangle(288, 300, 520, 126, 710, 322);
    canyon.fillStyle(0xf4a33d, 0.72);
    canyon.fillTriangle(760, 276, 922, 112, 1100, 300);
    canyon.fillStyle(0x5b4c8e, 0.44);
    canyon.fillTriangle(485, 282, 660, 154, 820, 304);

    const shore = this.add.graphics();
    shore.fillStyle(0xeecb82, 0.9);
    shore.fillRoundedRect(0, 230, width, 210, 16);
    shore.fillStyle(0x78a95f, 0.76);
    shore.fillRoundedRect(0, 440, width, height - 440, 18);
    shore.fillStyle(0xf49a2f, 0.18);
    shore.fillEllipse(180, 555, 330, 86);
    shore.fillEllipse(910, 548, 300, 94);

    const river = this.add.graphics();
    river.fillStyle(0x118bc5, 0.98);
    river.beginPath();
    river.moveTo(0, 356);
    river.lineTo(170, 320);
    river.lineTo(340, 338);
    river.lineTo(500, 306);
    river.lineTo(695, 344);
    river.lineTo(width, 316);
    river.lineTo(width, 500);
    river.lineTo(790, 522);
    river.lineTo(600, 490);
    river.lineTo(410, 538);
    river.lineTo(210, 498);
    river.lineTo(0, 526);
    river.closePath();
    river.fillPath();

    river.fillStyle(0x21d3e7, 0.46);
    river.fillEllipse(420, 418, 260, 36);
    river.fillEllipse(720, 406, 230, 28);
    river.fillStyle(0xffa32e, 0.34);
    river.fillEllipse(220, 430, 260, 32);
    river.fillEllipse(560, 454, 320, 34);

    const brush = this.add.graphics();
    for (const [x, y, color] of [
      [86, 492, 0xf2802d], [152, 518, 0x94bf5d], [238, 530, 0xffc042],
      [830, 510, 0xf2802d], [930, 492, 0xa6c85f], [1004, 526, 0xffc042],
    ]) {
      brush.fillStyle(color, 0.82).fillEllipse(x, y, 52, 24);
    }
  }

  setupChallenges() {
    // Embedded challenge 1: Flow rate
    this.addChallenge({
      x: this.layout.challenge_flow_rate.x, y: this.layout.challenge_flow_rate.y,
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
      x: this.layout.challenge_food_chain.x, y: this.layout.challenge_food_chain.y,
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
      x: this.layout.challenge_irrigation.x, y: this.layout.challenge_irrigation.y,
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

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, SaltRiverScene);
