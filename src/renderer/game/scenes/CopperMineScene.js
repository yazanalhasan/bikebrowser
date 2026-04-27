/**
 * CopperMineScene — Abandoned copper mine sub-scene.
 *
 * Mechanics: mining, structural stability inspection
 * Teaches: materials science, conductivity, percentages
 * Rewards: copper ore, wire samples, conductivity knowledge
 */

import BaseSubScene from './BaseSubScene.js';
import { saveGame } from '../systems/saveSystem.js';
import QUESTS from '../data/quests.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

const SCENE_KEY = 'CopperMineScene';

export default class CopperMineScene extends BaseSubScene {
  static layoutEditorConfig = {
    layoutAssetKey: 'copperMineLayout',
    layoutPath: 'layouts/copper-mine.layout.json',
  };

  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'copper_mine'; }
  getWorldSize() { return { width: 1000, height: 900 }; }

  preload() {
    super.preload?.();
    this.load.json('copperMineLayout', 'layouts/copper-mine.layout.json');
  }

  createWorld() {
    this.layout = loadLayout(this, 'copperMineLayout');
    const { width, height } = this.getWorldSize();

    // ── Bridge-quest copper bridge (no pun intended) ──
    // The bridge_collapse quest step `collect_copper` requires the item id
    // `copper_ore_sample`, which only the MountainScene grants. Players who
    // intuitively visit the *Copper Mine* (this scene) for copper end up with
    // `surface_copper`/`deep_copper` instead and get stuck. The helper
    // `_mintCopperOreSampleIfNeeded` retroactively grants `copper_ore_sample`
    // when the player is on the relevant step and has any mine copper. Called
    // here on scene entry as a safety net AND inline from the surface/deep
    // copper collection callbacks (low-friction path). Strictly additive —
    // does not affect the side-quest `collect_copper_samples`.
    this._mintCopperOreSampleIfNeeded();

    // ── Ground layers ── mine entrance transitions to underground
    // Surface (top third)
    this.add.rectangle(this.layout.ground_surface.x, this.layout.ground_surface.y, this.layout.ground_surface.w, this.layout.ground_surface.h, 0xb8956a);
    // Mine entrance (transition zone)
    this.add.rectangle(this.layout.ground_entrance.x, this.layout.ground_entrance.y, this.layout.ground_entrance.w, this.layout.ground_entrance.h, 0x6b5b4f);
    // Underground (bottom two-thirds)
    this.add.rectangle(this.layout.ground_underground.x, this.layout.ground_underground.y, this.layout.ground_underground.w, this.layout.ground_underground.h, 0x3d3329);

    // ── Mine entrance arch ──
    const arch = this.add.graphics();
    arch.fillStyle(0x4a3728);
    arch.fillRoundedRect(this.layout.arch_outer.x, this.layout.arch_outer.y, this.layout.arch_outer.w, this.layout.arch_outer.h, { tl: 40, tr: 40, bl: 0, br: 0 });
    arch.fillStyle(0x1a1410);
    arch.fillRoundedRect(this.layout.arch_inner.x, this.layout.arch_inner.y, this.layout.arch_inner.w, this.layout.arch_inner.h, { tl: 30, tr: 30, bl: 0, br: 0 });
    this.add.text(this.layout.arch_label.x, this.layout.arch_label.y, '⛏️ COPPER MINE', {
      fontSize: '14px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#f5e6c8', stroke: '#3d2b1f', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Support beams ──
    const beamColor = 0x6b4423;
    for (const b of this.layout.beams) {
      // Vertical post
      this.add.rectangle(b.x, b.y, 12, 80, beamColor).setDepth(1);
      // Horizontal beam
      this.add.rectangle(b.x, b.y - 40, 80, 10, beamColor).setDepth(1);
    }

    // ── Copper veins (visual) ──
    const veins = this.add.graphics();
    veins.lineStyle(3, 0xc87533, 0.7);
    // Vein 1
    veins.beginPath(); veins.moveTo(100, 450); veins.lineTo(180, 470); veins.lineTo(250, 455); veins.stroke();
    // Vein 2
    veins.beginPath(); veins.moveTo(600, 500); veins.lineTo(720, 520); veins.lineTo(800, 510); veins.stroke();
    // Vein 3
    veins.beginPath(); veins.moveTo(300, 680); veins.lineTo(400, 700); veins.lineTo(480, 690); veins.stroke();
    // Sparkle on veins
    for (const s of this.layout.sparkles) {
      const sparkle = this.add.text(s.x, s.y, '✨', { fontSize: '14px' }).setOrigin(0.5).setAlpha(0.6);
      this.tweens.add({
        targets: sparkle, alpha: 0.2, duration: 1500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // ── Rock walls (collision) ──
    for (const w of this.layout.rock_walls) {
      this.addVisibleWall(w.x, w.y, w.w, w.h, 0x4a3728, 0x2d1b0e);
    }

    // ── Rubble piles (collision + decoration) ──
    for (const r of this.layout.rubble) {
      this.add.text(r.x, r.y, r.s, { fontSize: '28px' }).setOrigin(0.5);
      this.addWall(r.x, r.y, 35, 25);
    }

    // ── Mine cart (decoration) ──
    this.add.text(this.layout.mine_cart.x, this.layout.mine_cart.y, '🚃', { fontSize: '30px' }).setOrigin(0.5);
    this.addWall(this.layout.mine_cart.x, this.layout.mine_cart.y, 50, 30);

    // ── Lanterns ──
    for (const l of this.layout.lanterns) {
      const glow = this.add.circle(l.x, l.y, 30, 0xfbbf24, 0.15).setDepth(0);
      this.add.text(l.x, l.y, '🏮', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
      this.tweens.add({
        targets: glow, alpha: 0.08, duration: 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // ── Boundary ──
    this.addWall(this.layout.boundary_top.x, this.layout.boundary_top.y, this.layout.boundary_top.w, this.layout.boundary_top.h);
    this.addWall(this.layout.boundary_left.x, this.layout.boundary_left.y, this.layout.boundary_left.w, this.layout.boundary_left.h);
    this.addWall(this.layout.boundary_right.x, this.layout.boundary_right.y, this.layout.boundary_right.w, this.layout.boundary_right.h);

    // ── Resources ──
    this.addResource({
      x: this.layout.resource_surface_copper.x, y: this.layout.resource_surface_copper.y, icon: '🟤', label: 'Surface Copper',
      itemId: 'surface_copper',
      description: 'Oxidized copper ore from the surface — greenish patina (verdigris).',
      onAfterCollect: () => this._mintCopperOreSampleIfNeeded(),
    });
    this.addResource({
      x: this.layout.resource_deep_copper.x, y: this.layout.resource_deep_copper.y, icon: '🔶', label: 'Deep Copper Ore',
      itemId: 'deep_copper',
      description: 'Pure chalcopyrite from deep in the mine — higher conductivity.',
      onAfterCollect: () => this._mintCopperOreSampleIfNeeded(),
    });
    this.addResource({
      x: this.layout.resource_wire_spool.x, y: this.layout.resource_wire_spool.y, icon: '🔌', label: 'Wire Sample',
      itemId: 'wire_spool',
      description: 'A spool of hand-drawn copper wire left by old miners.',
    });

    // ── Quest NPC: Old Miner ──
    this.addNpc({
      id: 'old_miner',
      name: 'Old Miner Pete',
      x: this.layout.npc_old_miner.x, y: this.layout.npc_old_miner.y,
      color: 0x8b6914,
      onInteract: () => this._handleMinerInteract(),
    });

    // ── Scene label ──
    this.add.text(this.layout.scene_title.x, this.layout.scene_title.y, '⛏️ Abandoned Copper Mine', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#f5e6c8', stroke: '#3d2b1f', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  setupChallenges() {
    // Embedded challenge 1: Conductivity comparison
    this.addChallenge({
      x: this.layout.challenge_conductivity.x, y: this.layout.challenge_conductivity.y,
      icon: '⚡',
      label: 'Conductivity Test',
      question: 'Copper conducts 59 million siemens/meter. Aluminum conducts 37 million. What fraction of copper\'s conductivity does aluminum have? (Round to nearest tenth)',
      choices: [
        { label: 'About 0.6 (63%)', correct: true },
        { label: 'About 0.8 (80%)', correct: false },
        { label: 'About 0.4 (40%)', correct: false },
        { label: 'About 0.9 (90%)', correct: false },
      ],
      explanation: '37 / 59 = 0.627 ≈ 0.6. Aluminum is only ~63% as conductive as copper!',
      concept: 'ratio and percentage comparison',
      reward: { zuzubucks: 20, reputation: 5 },
    });

    // Embedded challenge 2: Mine cart load
    this.addChallenge({
      x: this.layout.challenge_mine_cart.x, y: this.layout.challenge_mine_cart.y,
      icon: '⚖️',
      label: 'Load Calculation',
      question: 'A mine cart holds 200 kg max. Each copper ore chunk weighs 12.5 kg. How many chunks fit safely?',
      choices: [
        { label: '16 chunks', correct: true },
        { label: '15 chunks', correct: false },
        { label: '20 chunks', correct: false },
        { label: '17 chunks', correct: false },
      ],
      explanation: '200 / 12.5 = 16 exactly. Always check the weight limit!',
      concept: 'division with decimals',
      reward: { zuzubucks: 20, reputation: 5 },
    });

    // Embedded challenge 3: Mine shaft depth
    this.addChallenge({
      x: this.layout.challenge_mine_shaft.x, y: this.layout.challenge_mine_shaft.y,
      icon: '📏',
      label: 'Depth Check',
      question: 'A dropped rock takes 2 seconds to hit the bottom. Distance = 5 × time². How deep is the shaft?',
      choices: [
        { label: '20 meters', correct: true },
        { label: '10 meters', correct: false },
        { label: '25 meters', correct: false },
        { label: '40 meters', correct: false },
      ],
      explanation: 'd = 5 × 2² = 5 × 4 = 20 meters. This approximates real gravitational freefall!',
      concept: 'exponents in physics formulas',
      reward: { zuzubucks: 20, reputation: 5 },
    });
  }

  /**
   * Mint copper_ore_sample if the player is on bridge_collapse step
   * collect_copper and has any mine copper in inventory but not the
   * canonical sample. Called at scene entry (safety net) AND inline from
   * surface_copper/deep_copper collection callbacks (low-friction path).
   *
   * Idempotent: returns silently if the player already has copper_ore_sample,
   * if the active quest is wrong, or if the active step is wrong — so calling
   * it twice (re-entry after collection) does NOT double-mint or double-dialog.
   */
  _mintCopperOreSampleIfNeeded() {
    const st = this.registry.get('gameState');
    const aq = st?.activeQuest;
    if (aq?.id !== 'bridge_collapse') return;
    if ((st.inventory || []).includes('copper_ore_sample')) return;
    const step = QUESTS.bridge_collapse?.steps?.[aq.stepIndex];
    if (step?.id !== 'collect_copper') return;
    const hasMineCopper = (st.inventory || []).some(
      (id) => id === 'surface_copper' || id === 'deep_copper'
    );
    if (!hasMineCopper) return;
    const updated = { ...st, inventory: [...st.inventory, 'copper_ore_sample'] };
    this.registry.set('gameState', updated);
    saveGame(updated);
    this.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text:
        "Wait — this copper from the mine works as a sample for Mr. Chen's bridge test!\n\n" +
        '🟤 Got: Copper Ore Sample',
      choices: null,
      step: null,
    });
  }

  _handleMinerInteract() {
    const state = this.registry.get('gameState');
    const copperQuest = state.sideQuests?.collect_copper_samples;
    const stabilityQuest = state.sideQuests?.mine_stability_check;

    if (copperQuest?.completed && stabilityQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Old Miner Pete',
        text: 'You\'re a natural prospector! That copper will serve you well when you start building battery systems.',
        choices: null, step: null,
      });
    } else if (!copperQuest) {
      this.registry.set('dialogEvent', {
        speaker: 'Old Miner Pete',
        text: 'Well hey there, young explorer! This old mine\'s got some fine copper still. Want me to show you how to prospect?',
        choices: [
          { label: 'Start Copper Quest!', action: 'start_quest', questId: 'collect_copper_samples' },
          { label: 'Just looking around', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'collect_copper_samples' },
      });
    } else if (!stabilityQuest && copperQuest?.completed) {
      this.registry.set('dialogEvent', {
        speaker: 'Old Miner Pete',
        text: 'Now that you\'ve got copper skills, let me teach you about structural safety. These old supports need checking.',
        choices: [
          { label: 'Start Stability Quest!', action: 'start_quest', questId: 'mine_stability_check' },
          { label: 'Maybe later', action: 'dismiss' },
        ],
        step: { type: 'side_quest_offer', questId: 'mine_stability_check' },
      });
    } else {
      const activeId = copperQuest && !copperQuest.completed ? 'collect_copper_samples' : 'mine_stability_check';
      this.triggerSideQuest(activeId);
    }
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, CopperMineScene);
