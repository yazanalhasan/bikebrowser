/**
 * StreetBlockScene — the street outside Zuzu's house.
 *
 * Local playable scene with:
 *   - Sidewalks, road, driveways
 *   - Zuzu's house exterior
 *   - Mrs. Ramirez + flat tire quest
 *   - Neighbor houses
 *   - Exit to garage (west)
 *   - Exit to overworld (north)
 *
 * World size: 1000×700 (slightly larger than viewport for scrolling)
 */

import LocalSceneBase from './LocalSceneBase.js';
import { startQuest, getCurrentStep, advanceQuest } from '../systems/questSystem.js';
import { saveGame } from '../systems/saveSystem.js';
import { NPC_PLACEMENTS } from '../data/neighborhoodLayout.js';
import { getQuestBoard, getNextQuestForNPC } from '../data/questBoard.js';
import QUESTS from '../data/quests.js';
import { drawPlant } from '../utils/plantRenderer.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';

export default class StreetBlockScene extends LocalSceneBase {
  constructor() {
    super('StreetBlockScene');
  }

  getWorldSize() {
    return { width: 1000, height: 700 };
  }

  createWorld() {
    const { width, height } = this.getWorldSize();
    const state = this.registry.get('gameState');

    // === GROUND ===
    // Grass
    this.add.rectangle(width / 2, height / 2, width, height, 0x7cb342);

    // Road (horizontal, center)
    this.add.rectangle(width / 2, 350, width, 120, 0x616161);
    // Road lines
    const roadGfx = this.add.graphics();
    roadGfx.lineStyle(2, 0xfdd835, 0.6);
    for (let x = 0; x < width; x += 50) {
      roadGfx.lineBetween(x, 350, x + 25, 350);
    }
    // Sidewalks
    this.add.rectangle(width / 2, 280, width, 20, 0xbdbdbd);
    this.add.rectangle(width / 2, 420, width, 20, 0xbdbdbd);

    // === ZUZU'S HOUSE (left side, north of road) ===
    // House body
    this.add.rectangle(130, 180, 180, 120, 0xd4a574).setStrokeStyle(3, 0xc4945e).setDepth(1);
    // Roof
    const roofGfx = this.add.graphics();
    roofGfx.fillStyle(0x8d6e63);
    roofGfx.fillTriangle(40, 125, 130, 60, 220, 125);
    roofGfx.setDepth(2);
    // Door
    this.add.rectangle(130, 220, 35, 50, 0x5d4037).setDepth(2);
    this.add.circle(142, 220, 3, 0xfdd835).setDepth(3);
    // Windows
    this.add.rectangle(85, 175, 30, 25, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    this.add.rectangle(175, 175, 30, 25, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    // Label
    this.add.text(130, 245, "🏠 Zuzu's House", {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#4e342e',
      fontStyle: 'bold', stroke: '#fff', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);
    // House collision
    this.addWall(130, 180, 180, 120);

    // Driveway
    this.add.rectangle(130, 262, 60, 16, 0x9e9e9e);

    // === NEIGHBOR HOUSE — Mrs. Ramirez (center-right, north of road) ===
    this.add.rectangle(550, 180, 180, 120, 0xef9a9a).setStrokeStyle(3, 0xe57373).setDepth(1);
    const roofGfx2 = this.add.graphics();
    roofGfx2.fillStyle(0xc62828);
    roofGfx2.fillTriangle(460, 125, 550, 60, 640, 125);
    roofGfx2.setDepth(2);
    this.add.rectangle(550, 220, 35, 50, 0x5d4037).setDepth(2);
    this.add.circle(562, 220, 3, 0xfdd835).setDepth(3);
    this.add.rectangle(505, 175, 30, 25, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    this.add.rectangle(595, 175, 30, 25, 0x87ceeb, 0.7).setStrokeStyle(2, 0x795548).setDepth(2);
    this.add.text(550, 245, "🏡 Ramirez House", {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#b71c1c',
      fontStyle: 'bold', stroke: '#fff', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);
    this.addWall(550, 180, 180, 120);

    // === NEIGHBOR HOUSE — far right (decorative) ===
    this.add.rectangle(850, 180, 160, 110, 0x90caf9).setStrokeStyle(3, 0x64b5f6).setDepth(1);
    const roofGfx3 = this.add.graphics();
    roofGfx3.fillStyle(0x1565c0);
    roofGfx3.fillTriangle(770, 130, 850, 70, 930, 130);
    roofGfx3.setDepth(2);
    this.add.rectangle(850, 218, 30, 45, 0x5d4037).setDepth(2);
    this.addWall(850, 180, 160, 110);

    // === SOUTH SIDE — more houses ===
    this.add.rectangle(350, 550, 160, 100, 0xc8e6c9).setStrokeStyle(3, 0xa5d6a7).setDepth(1);
    const roofGfx4 = this.add.graphics();
    roofGfx4.fillStyle(0x2e7d32);
    roofGfx4.fillTriangle(270, 505, 350, 445, 430, 505);
    roofGfx4.setDepth(2);
    this.add.rectangle(350, 580, 30, 40, 0x5d4037).setDepth(2);
    this.addWall(350, 550, 160, 100);

    this.add.rectangle(700, 550, 160, 100, 0xfff9c4).setStrokeStyle(3, 0xfff176).setDepth(1);
    const roofGfx5 = this.add.graphics();
    roofGfx5.fillStyle(0xf9a825);
    roofGfx5.fillTriangle(620, 505, 700, 445, 780, 505);
    roofGfx5.setDepth(2);
    this.add.rectangle(700, 580, 30, 40, 0x5d4037).setDepth(2);
    this.addWall(700, 550, 160, 100);

    // === TREES / DECORATIONS ===
    const trees = [[30, 340], [260, 140], [400, 140], [700, 140], [950, 340],
                   [200, 500], [500, 620], [900, 500]];
    for (const [tx, ty] of trees) {
      this.add.text(tx, ty, '🌳', { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
    }

    // === ECOLOGY PLANTS (drawn with graphics + interactable) ===
    this._ecologyPlants = [];

    const plants = [
      { species: 'mesquite', label: 'Mesquite Tree', x: 260, y: 460, radius: 65 },
      { species: 'mesquite', label: 'Mesquite Tree', x: 900, y: 460, radius: 65 },
      { species: 'creosote', label: 'Creosote Bush', x: 80, y: 460, radius: 55 },
      { species: 'creosote', label: 'Creosote Bush', x: 950, y: 620, radius: 55 },
      { species: 'prickly_pear', label: 'Prickly Pear', x: 480, y: 640, radius: 50 },
      { species: 'barrel_cactus', label: 'Barrel Cactus', x: 30, y: 620, radius: 45 },
      { species: 'jojoba', label: 'Jojoba Shrub', x: 780, y: 640, radius: 45 },
      { species: 'agave', label: 'Agave Plant', x: 450, y: 460, radius: 55 },
      { species: 'yucca', label: 'Yucca Plant', x: 150, y: 620, radius: 50 },
      { species: 'desert_lavender', label: 'Desert Lavender', x: 650, y: 460, radius: 50 },
    ];

    for (const p of plants) {
      // Draw visual plant (graphics-based, not emoji)
      const plantContainer = drawPlant(this, p.species, p.x, p.y);
      plantContainer.setDepth(4); // background decoration, below player (depth 6)

      // Add invisible interaction zone (uses existing addInteractable for prompt/hitbox)
      this.addInteractable({
        x: p.x, y: p.y, label: p.label, icon: '', // no emoji — visual is drawn above
        radius: p.radius,
        onInteract: () => this._handlePlantInteract(p.species, p.label),
      });
      this._ecologyPlants.push({ species: p.species, x: p.x, y: p.y });
    }

    // Fire hydrant
    this.add.text(340, 275, '🧯', { fontSize: '18px' }).setOrigin(0.5).setDepth(3);

    // Mailboxes
    this.add.text(190, 265, '📫', { fontSize: '16px' }).setOrigin(0.5).setDepth(3);
    this.add.text(610, 265, '📫', { fontSize: '16px' }).setOrigin(0.5).setDepth(3);

    // Street sign
    this.add.text(width / 2, 275, '🛣️ E Trailside View', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#fff',
      backgroundColor: '#2e7d32', padding: { x: 6, y: 2 },
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    // === MRS. RAMIREZ NPC ===
    const ramirezData = NPC_PLACEMENTS.find(n => n.id === 'mrs_ramirez');
    this.addNpc({
      id: 'mrs_ramirez',
      name: 'Mrs. Ramirez',
      x: 550,
      y: 310,
      color: ramirezData?.color || 0xb45309,
      onInteract: () => this._handleNpcInteract('mrs_ramirez', 'flat_tire_repair'),
    });

    // Mrs. Ramirez's bike
    const questDone = state.completedQuests?.includes('flat_tire_repair');
    this._ramirezBike = this.add.text(
      590, 310,
      questDone ? '🚲✅' : '🚲❌',
      { fontSize: '28px' },
    ).setOrigin(0.5).setDepth(40);

    // === MR. CHEN NPC ===
    const chenData = NPC_PLACEMENTS.find(n => n.id === 'mr_chen');
    this.addNpc({
      id: 'mr_chen',
      name: 'Mr. Chen',
      x: 250,
      y: 430,
      color: chenData?.color || 0x2563eb,
      onInteract: () => this._handleNpcInteract('mr_chen', 'chain_repair'),
    });

    // Mr. Chen's bike
    const chenQuestDone = state.completedQuests?.includes('chain_repair');
    this._chenBike = this.add.text(
      290, 430,
      chenQuestDone ? '🚲✅' : '🚲⛓️',
      { fontSize: '28px' },
    ).setOrigin(0.5).setDepth(40);

    // === EXITS ===
    // West exit → Garage
    this.addExit({
      x: 14, y: 300,
      width: 28, height: 80,
      targetScene: 'ZuzuGarageScene',
      targetSpawn: 'fromStreet',
      label: '🏠 Garage ⬅',
    });

    // North exit → Overworld
    this.addExit({
      x: width / 2, y: 14,
      width: 200, height: 28,
      targetScene: 'OverworldScene',
      targetSpawn: 'fromStreet',
      label: '🗺️ Neighborhood ⬆',
    });

    // === WORLD MAP ACCESS: Bike GPS ===
    this.addInteractable({
      x: width - 60, y: 300,
      icon: '📡',
      label: 'Bike GPS',
      radius: 70,
      onInteract: () => {
        const audioMgr = this.registry.get('audioManager');
        audioMgr?.playSfx('ui_panel_open');
        this._transitioning = true;
        this.cameras.main.fadeOut(350, 0, 0, 0, (_cam, progress) => {
          if (progress >= 1) {
            this.scene.start('WorldMapScene', {
              origin: 'StreetBlockScene',
              originSpawn: 'default',
            });
          }
        });
      },
    });
    // GPS post (visual)
    this.add.rectangle(width - 60, 310, 8, 40, 0x475569);
    this.add.rectangle(width - 60, 285, 30, 5, 0x475569);

    // === WORLD BOUNDS ===
    this.addWall(width / 2, height + 10, width, 20); // south
  }

  // ── Plant Interaction ────────────────────────────────────────────────────────

  _handlePlantInteract(species, label) {
    const state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('interaction_ping');

    // Notify MCP about plant interaction
    const mcp = this.registry.get('mcp');
    if (mcp) {
      mcp.emit('FORAGE_AVAILABLE', { species, x: 0, y: 0 });
    }

    // Plant info from flora data
    const PLANT_INFO = {
      mesquite: { desc: 'A mesquite tree! Its pods are nutritious and its wood makes excellent charcoal. Animals gather here to eat the pods.', items: ['mesquite_pods', 'mesquite_wood_sample'] },
      creosote: { desc: 'Creosote bush — its resin is antimicrobial and anti-inflammatory. Careful: toxic in large doses!', items: ['creosote_leaves'] },
      prickly_pear: { desc: 'Prickly pear cactus! The fruit is sweet and hydrating. The pads are edible too.', items: ['prickly_pear_fruit'] },
      barrel_cactus: { desc: 'Barrel cactus — it has moisture inside but the pulp is bitter and can cause nausea.', items: ['barrel_cactus_pulp'] },
      jojoba: { desc: 'Jojoba shrub — its seeds produce a stable liquid wax. Natural sunscreen and lubricant!', items: ['jojoba_seeds'] },
      agave: { desc: 'Agave plant — strong fibers for rope and bandages. The sap has healing properties.', items: ['agave_fiber'] },
      yucca: { desc: 'Yucca — the root contains natural soap (saponins). Used for cleaning and surfactants for thousands of years.', items: ['yucca_root'] },
      desert_lavender: { desc: 'Desert lavender — purple flowers with a calming scent. Makes a soothing tea that improves focus.', items: ['desert_lavender_flowers'] },
      ephedra: { desc: 'Ephedra (Mormon Tea) — a powerful natural stimulant. Boosts energy but stresses the heart. Use with caution!', items: ['ephedra_stems'] },
      yerba_mansa: { desc: 'Yerba mansa — powerful antimicrobial root found near water. The desert\'s natural antibiotic.', items: ['yerba_mansa_root'] },
    };

    const info = PLANT_INFO[species] || { desc: `A ${label}.`, items: [] };

    // If player has an active forage quest step, give the item
    const step = state.activeQuest ? this._getCurrentStepIfForage(state) : null;
    if (step && info.items.includes(step.requiredItem)) {
      // Grant the item
      const updated = {
        ...state,
        inventory: [...state.inventory, step.requiredItem],
      };
      this.registry.set('gameState', updated);
      // saveGame already imported at top of file
      saveGame(updated);

      audioMgr?.playSfx('item_pickup');

      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `Found ${step.requiredItem.replace(/_/g, ' ')}! ${info.desc}`,
        choices: null, step: null,
      });
      return;
    }

    // Otherwise just show plant info
    this.registry.set('dialogEvent', {
      speaker: 'Zuzu',
      text: info.desc,
      choices: null, step: null,
    });
  }

  _getCurrentStepIfForage(state) {
    if (!state.activeQuest) return null;
    const quest = QUESTS[state.activeQuest.id];
    if (!quest) return null;
    const step = quest.steps[state.activeQuest.stepIndex];
    if (step?.type === 'forage') return step;
    return null;
  }

  // ── NPC Interaction ─────────────────────────────────────────────────────────

  /**
   * Find the next available quest for an NPC from the quest tree.
   */
  _findNextQuestForNPC(npcId, state) {
    return getNextQuestForNPC(npcId, state);
  }

  _handleNpcInteract(npcId, primaryQuestId) {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');

    audioMgr?.playSfx('interaction_ping');

    const NPC_NAMES = { mrs_ramirez: 'Mrs. Ramirez', mr_chen: 'Mr. Chen' };
    const npcName = NPC_NAMES[npcId] || npcId;

    // If there's an active quest with this NPC, continue it
    if (state.activeQuest) {
      const activeQuest = QUESTS[state.activeQuest.id];
      if (activeQuest?.giver === npcId) {
        // This NPC owns the active quest — show current step
        const step = getCurrentStep(state);
        if (step) {
          this.registry.set('dialogEvent', {
            speaker: step.type === 'quiz' ? 'Zuzu (thinking)' : npcName,
            text: step.text,
            choices: step.type === 'quiz' ? step.choices : null,
            step,
          });
          return;
        }
      }
      // Different NPC's quest is active
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: "Looks like you're busy with another job right now. Come back when you're free!",
        choices: null, step: null,
      });
      return;
    }

    // No active quest — find the best quest to offer
    let questToStart = null;

    // 1. Try primary quest first (if not completed)
    if (!state.completedQuests?.includes(primaryQuestId)) {
      questToStart = primaryQuestId;
    } else {
      // 2. Find next available quest from the quest board for this NPC
      questToStart = this._findNextQuestForNPC(npcId, state);
    }

    // 3. If no quest available, give a contextual idle message
    if (!questToStart) {
      const completedCount = state.completedQuests?.length || 0;
      const idleMessages = [
        `Great work so far, Zuzu! You've completed ${completedCount} quests. Keep exploring!`,
        'Check the quest board — new quests unlock as you complete more adventures!',
        "I don't have a new quest right now, but keep exploring. There's always more to learn!",
      ];
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: idleMessages[completedCount % idleMessages.length],
        choices: null, step: null,
      });
      return;
    }

    // Start the quest
    const started = startQuest(state, questToStart);
    if (started) {
      state = started;
      this.registry.set('gameState', state);
      saveGame(state);
      audioMgr?.playSfx('ui_quest_accept');
    }

    const step = getCurrentStep(state);
    if (!step) return;

    this.registry.set('dialogEvent', {
      speaker: step.type === 'quiz' ? 'Zuzu (thinking)' : npcName,
      text: step.text,
      choices: step.type === 'quiz' ? step.choices : null,
      step,
    });
  }

  advanceFromDialog(choiceIndex) {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');
    const result = advanceQuest(state, choiceIndex);

    if (!result.ok) {
      audioMgr?.playSfx('ui_error');
      this.registry.set('dialogEvent', {
        speaker: 'System',
        text: result.message,
        choices: null,
        step: getCurrentStep(state),
      });
      return;
    }

    state = result.state;
    this.registry.set('gameState', state);
    saveGame(state);

    const step = getCurrentStep(state);
    if (step?.type === 'use_item') {
      if (step.id === 'use_lever') audioMgr?.playSfx('wrench_turn', { vary: true });
      else if (step.id === 'use_patch') audioMgr?.playSfx('patch_apply', { vary: true });
      else audioMgr?.playSfx('item_pickup');
    } else if (!step) {
      audioMgr?.playStinger('reward_stinger');
      this._showRewardCelebration(state);
    } else {
      audioMgr?.playSfx('ui_success');
    }

    // Update bike icons
    if (state.completedQuests?.includes('flat_tire_repair') && this._ramirezBike) {
      this._ramirezBike.setText('🚲✅');
    }
    if (state.completedQuests?.includes('chain_repair') && this._chenBike) {
      this._chenBike.setText('🚲✅');
    }

    const nextStep = getCurrentStep(state);
    if (nextStep) {
      // Get speaker from quest giver
      const NPC_NAMES = { mrs_ramirez: 'Mrs. Ramirez', mr_chen: 'Mr. Chen' };
      const activeQuest = QUESTS[state.activeQuest?.id];
      const speaker = nextStep.type === 'quiz'
        ? 'Zuzu (thinking)'
        : NPC_NAMES[activeQuest?.giver] || 'NPC';
      this.registry.set('dialogEvent', {
        speaker,
        text: nextStep.text,
        choices: nextStep.type === 'quiz' ? nextStep.choices : null,
        step: nextStep,
      });
    } else {
      this.registry.set('dialogEvent', null);
    }
  }

  _showRewardCelebration(state) {
    const cam = this.cameras.main;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2 - 40;

    const rewardText = this.add.text(cx, cy, '🎉 Quest Complete! 🎉', {
      fontSize: '28px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#1e40af', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    const bucks = state.zuzubucks || 0;
    const bucksText = this.add.text(cx, cy + 40, `💰 +25 Zuzubucks! (Total: ${bucks})`, {
      fontSize: '18px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#fbbf24', stroke: '#78350f', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    rewardText.setScale(0);
    this.tweens.add({ targets: rewardText, scale: 1, duration: 500, ease: 'Back.easeOut' });
    bucksText.setAlpha(0);
    this.tweens.add({ targets: bucksText, alpha: 1, duration: 400, delay: 400 });

    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: [rewardText, bucksText], alpha: 0, duration: 500,
        onComplete: () => { rewardText.destroy(); bucksText.destroy(); },
      });
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('StreetBlockScene', import.meta.hot, StreetBlockScene);
