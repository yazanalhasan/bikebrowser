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

const SCENE_KEY = 'CopperMineScene';

export default class CopperMineScene extends BaseSubScene {
  constructor() {
    super(SCENE_KEY);
  }

  getSceneKey() { return SCENE_KEY; }
  getLocationId() { return 'copper_mine'; }
  getWorldSize() { return { width: 1000, height: 900 }; }

  createWorld() {
    const { width, height } = this.getWorldSize();

    // ── Bridge-quest copper bridge (no pun intended) ──
    // The bridge_collapse quest step `collect_copper` requires the item id
    // `copper_ore_sample`, which only the MountainScene grants. Players who
    // intuitively visit the *Copper Mine* (this scene) for copper end up with
    // `surface_copper`/`deep_copper` instead and get stuck. If they already
    // have either of those AND are on the relevant quest step, retroactively
    // grant `copper_ore_sample` so the quest can advance. Strictly additive —
    // does not affect the side-quest `collect_copper_samples`.
    {
      const st = this.registry.get('gameState');
      const aq = st?.activeQuest;
      if (aq?.id === 'bridge_collapse' && !(st.inventory || []).includes('copper_ore_sample')) {
        const step = QUESTS.bridge_collapse?.steps?.[aq.stepIndex];
        const hasMineCopper = (st.inventory || []).some(
          (id) => id === 'surface_copper' || id === 'deep_copper'
        );
        if (step?.id === 'collect_copper' && hasMineCopper) {
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
      }
    }

    // ── Ground layers ── mine entrance transitions to underground
    // Surface (top third)
    this.add.rectangle(width / 2, 120, width, 240, 0xb8956a);
    // Mine entrance (transition zone)
    this.add.rectangle(width / 2, 300, width, 120, 0x6b5b4f);
    // Underground (bottom two-thirds)
    this.add.rectangle(width / 2, 600, width, 600, 0x3d3329);

    // ── Mine entrance arch ──
    const arch = this.add.graphics();
    arch.fillStyle(0x4a3728);
    arch.fillRoundedRect(350, 200, 300, 160, { tl: 40, tr: 40, bl: 0, br: 0 });
    arch.fillStyle(0x1a1410);
    arch.fillRoundedRect(380, 230, 240, 130, { tl: 30, tr: 30, bl: 0, br: 0 });
    this.add.text(500, 195, '⛏️ COPPER MINE', {
      fontSize: '14px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#f5e6c8', stroke: '#3d2b1f', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Support beams ──
    const beamColor = 0x6b4423;
    const beams = [
      { x: 200, y: 400 }, { x: 500, y: 400 }, { x: 800, y: 400 },
      { x: 300, y: 600 }, { x: 650, y: 600 },
      { x: 150, y: 750 }, { x: 500, y: 750 }, { x: 850, y: 750 },
    ];
    for (const b of beams) {
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
    const sparkles = [
      { x: 180, y: 468 }, { x: 720, y: 518 }, { x: 400, y: 698 },
    ];
    for (const s of sparkles) {
      const sparkle = this.add.text(s.x, s.y, '✨', { fontSize: '14px' }).setOrigin(0.5).setAlpha(0.6);
      this.tweens.add({
        targets: sparkle, alpha: 0.2, duration: 1500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // ── Rock walls (collision) ──
    const walls = [
      { x: 50, y: 500, w: 60, h: 200 },
      { x: 950, y: 500, w: 60, h: 200 },
      { x: 50, y: 750, w: 60, h: 200 },
      { x: 950, y: 750, w: 60, h: 200 },
    ];
    for (const w of walls) {
      this.addVisibleWall(w.x, w.y, w.w, w.h, 0x4a3728, 0x2d1b0e);
    }

    // ── Rubble piles (collision + decoration) ──
    const rubble = [
      { x: 350, y: 500, s: '🪨' }, { x: 700, y: 450, s: '🪨' },
      { x: 200, y: 680, s: '🪨' }, { x: 800, y: 700, s: '🪨' },
    ];
    for (const r of rubble) {
      this.add.text(r.x, r.y, r.s, { fontSize: '28px' }).setOrigin(0.5);
      this.addWall(r.x, r.y, 35, 25);
    }

    // ── Mine cart (decoration) ──
    this.add.text(600, 380, '🚃', { fontSize: '30px' }).setOrigin(0.5);
    this.addWall(600, 380, 50, 30);

    // ── Lanterns ──
    const lanterns = [{ x: 200, y: 380 }, { x: 500, y: 380 }, { x: 800, y: 380 },
                      { x: 300, y: 580 }, { x: 650, y: 580 }];
    for (const l of lanterns) {
      const glow = this.add.circle(l.x, l.y, 30, 0xfbbf24, 0.15).setDepth(0);
      this.add.text(l.x, l.y, '🏮', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);
      this.tweens.add({
        targets: glow, alpha: 0.08, duration: 2000,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }

    // ── Boundary ──
    this.addWall(width / 2, 0, width, 20);
    this.addWall(0, height / 2, 20, height);
    this.addWall(width, height / 2, 20, height);

    // ── Resources ──
    this.addResource({
      x: 180, y: 470, icon: '🟤', label: 'Surface Copper',
      itemId: 'surface_copper',
      description: 'Oxidized copper ore from the surface — greenish patina (verdigris).',
    });
    this.addResource({
      x: 720, y: 520, icon: '🔶', label: 'Deep Copper Ore',
      itemId: 'deep_copper',
      description: 'Pure chalcopyrite from deep in the mine — higher conductivity.',
    });
    this.addResource({
      x: 400, y: 700, icon: '🔌', label: 'Wire Sample',
      itemId: 'wire_spool',
      description: 'A spool of hand-drawn copper wire left by old miners.',
    });

    // ── Quest NPC: Old Miner ──
    this.addNpc({
      id: 'old_miner',
      name: 'Old Miner Pete',
      x: 500, y: 500,
      color: 0x8b6914,
      onInteract: () => this._handleMinerInteract(),
    });

    // ── Scene label ──
    this.add.text(width / 2, 30, '⛏️ Abandoned Copper Mine', {
      fontSize: '16px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#f5e6c8', stroke: '#3d2b1f', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);
  }

  setupChallenges() {
    // Embedded challenge 1: Conductivity comparison
    this.addChallenge({
      x: 150, y: 550,
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
      x: 700, y: 650,
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
      x: 450, y: 820,
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
