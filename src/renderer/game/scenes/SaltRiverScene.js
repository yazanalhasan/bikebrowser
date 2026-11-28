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
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { groundDepth } from '../../../game/assets/act1Art.js';
import { WORLD_SIGN_DEPTH } from '../systems/labelLayout.js';
import { addSceneTitle } from '../ui/sceneTitle.js';
import { hasArt } from '../../../game/assets/act1Art.js';

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

    // ── Terrain layers ── painted river water between textured banks.
    {
      const o = this.layout.terrain_south_grass;
      this.addGroundTexture(ART.lakeedge_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      const o = this.layout.terrain_sandy_riverbank;
      this.addGroundTexture(ART.saltriver_bank, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      const o = this.layout.terrain_river;
      this.addGroundTexture(ART.saltriver_water, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      const o = this.layout.terrain_north_grass;
      this.addGroundTexture(ART.lakeedge_grass, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }
    {
      const o = this.layout.terrain_north_sandy_shore;
      this.addGroundTexture(ART.saltriver_bank, o.x - o.w / 2, o.y - o.h / 2, o.w, o.h);
    }

    // Flowing water particles (horizontal drift)
    for (let i = 0; i < 8; i++) {
      const leaf = this.addProp(
        i % 2 === 0 ? ART.reeds : ART.river_debris,
        Math.random() * width,
        290 + Math.random() * 200,
        { maxPx: 26, depth: 2, alpha: 0.7, anchor: 'icon' },
      );
      if (!leaf) continue;
      this.tweens.add({
        targets: leaf, x: width + 50, duration: 8000 + Math.random() * 6000,
        repeat: -1, ease: 'Linear',
        onRepeat: () => { leaf.x = -50; leaf.y = 290 + Math.random() * 200; },
      });
    }

    // ── Rocks in river ──
    // Three painted stones, cycled, so a crossing does not look stamped
    // out of one shape (plan 2.7 p7). They were grey circles.
    const stones = [ART.stepping_stone_1, ART.stepping_stone_2, ART.stepping_stone_3]
      .filter((s) => hasArt(this, s));
    this.layout.river_rocks.forEach((r, i) => {
      if (stones.length) {
        this.addProp(stones[i % stones.length], r.x, r.y + 11, { depth: 3 });
      } else {
        this.add.circle(r.x, r.y, 15, 0x777777).setStrokeStyle(2, 0x555555).setDepth(3);
      }
      this.addWall(r.x, r.y, 30, 30);
    });

    // ── Trees (north bank) ──
    for (const t of this.layout.trees) {
      this.addProp(ART.shade_tree, t.x, t.y + 20, { maxPx: 96, depth: groundDepth(t.y) });
      this.addWall(t.x, t.y, 30, 30);
    }

    // ── Reeds along riverbank ──
    for (const r of this.layout.reeds) {
      this.addProp(ART.reeds, r.x, r.y + 12, { maxPx: 38, depth: groundDepth(r.y) });
    }

    // ── Wildlife ──
    // Fish in water
    for (let i = 0; i < 4; i++) {
      const fish = this.addProp(ART.fish, 200 + i * 200, 340 + Math.random() * 100,
        { maxPx: 34, depth: 3, anchor: 'icon' });
      if (!fish) continue;
      this.tweens.add({
        targets: fish, x: fish.x + 80, y: fish.y + 20,
        duration: 3000 + Math.random() * 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // Heron on shore
    const heron = this.addProp(ART.heron, this.layout.heron.x, this.layout.heron.y + 18, { maxPx: 58, depth: 4 });
    this.tweens.add({
      targets: heron, y: 245, duration: 3000,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Frog
    const frog = this.addProp(ART.frog, this.layout.frog.x, this.layout.frog.y + 10, { maxPx: 34, depth: 4 });
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

    // The channel names are the diagram's key — at the default depth the
    // bank drawn after them cut "Ch. B" in half (plan 0.12).
    for (const [cfg, name] of [
      [this.layout.channel_label_a, 'Ch. A'],
      [this.layout.channel_label_b, 'Ch. B'],
      [this.layout.channel_label_c, 'Ch. C'],
    ]) {
      this.add.text(cfg.x, cfg.y, name, { fontSize: '10px', color: '#3b5998' })
        .setOrigin(0.5).setDepth(WORLD_SIGN_DEPTH);
    }

    // ── Boundary ──
    this.addWall(this.layout.wall_top.x, this.layout.wall_top.y, this.layout.wall_top.w, this.layout.wall_top.h);
    this.addWall(this.layout.wall_left.x, this.layout.wall_left.y, this.layout.wall_left.w, this.layout.wall_left.h);
    this.addWall(this.layout.wall_right.x, this.layout.wall_right.y, this.layout.wall_right.w, this.layout.wall_right.h);

    // ── Resources ──
    this.addResource({
      x: this.layout.resource_algae_sample.x, y: this.layout.resource_algae_sample.y, icon: ART.algae, label: 'Algae Sample',
      itemId: 'algae_sample',
      description: 'Green algae from the river — could produce organic compounds.',
    });
    this.addResource({
      x: this.layout.resource_microbial_sample.x, y: this.layout.resource_microbial_sample.y, icon: ART.microbial, label: 'Microbial Sample',
      itemId: 'microbial_sample',
      description: 'Microorganisms from river sediment — potential for bio-production.',
    });
    this.addResource({
      x: this.layout.resource_mineral_deposit.x, y: this.layout.resource_mineral_deposit.y, icon: ART.mineral_deposit, label: 'Mineral Deposit',
      itemId: 'river_minerals',
      description: 'Dissolved minerals deposited along the riverbed.',
    });
    this.addResource({
      x: this.layout.resource_reed_fiber.x, y: this.layout.resource_reed_fiber.y, icon: ART.reed_fiber, label: 'River Reed Fiber',
      itemId: 'reed_fiber',
      description: 'Tough natural fiber from river reeds — good for weaving.',
    });

    // ── Quest NPC: Biologist ──
    this.addNpc({
      // Painted sheet, not five Graphics shapes (plan 2.2).
      id: 'river_biologist',
      sheet: 'maya_idle',
      talkSheet: 'maya_talk',
      name: 'Dr. Maya',
      x: this.layout.npc_biologist.x, y: this.layout.npc_biologist.y,
      color: 0x2563eb,
      onInteract: () => this._handleBiologistInteract(),
    });

    // ── Scene label ──
    addSceneTitle(this, '🏞️ Salt River Basin', { color: '#1e3a5f', stroke: '#dbeafe' });
  }

  setupChallenges() {
    // Embedded challenge 1: Flow rate
    this.addChallenge({
      x: this.layout.challenge_flow_rate.x, y: this.layout.challenge_flow_rate.y,
      icon: ART.ch_flow_rate,
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
      icon: ART.ch_food_chain,
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
      icon: ART.ch_irrigation,
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
    this.offerSideQuest('Dr. Maya', {
      allDone: 'You\'re becoming a real river ecologist! Your samples will help with '
        + 'bio-production research.',
      decline: 'Just exploring',
      offers: {
        river_ecosystem_survey: {
          text: 'Hi there! I\'m Dr. Maya, studying the Salt River ecosystem. Want to '
            + 'help me survey the wildlife?',
          accept: 'Start Ecosystem Survey!',
        },
        balance_the_flow: {
          text: 'Great survey work! Now I need help balancing the irrigation '
            + 'channels. It\'s all about water fractions.',
          accept: 'Start Flow Quest!',
        },
      },
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, SaltRiverScene);
