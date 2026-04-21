/**
 * NeighborhoodScene — outdoor world built on the generated neighborhood map.
 *
 * CUSTOM GAME LOGIC ONLY.
 *
 * Layout and static composition are defined in editor-scenes/NeighborhoodSceneBase.js
 * (the editor-owned boundary). This file extends it with:
 *   - Player spawning with save compatibility
 *   - NPC creation and interaction logic
 *   - Quest system integration
 *   - Reward celebrations
 *   - Physics world bounds and collisions
 *   - Camera following
 *   - Landmark zone detection
 *   - Save system integration
 *   - Audio transitions
 *   - Input handling (keyboard + touch)
 *   - Debug overlay
 *
 * When Phaser Editor regenerates the base class, this file is untouched.
 */

import Phaser from 'phaser';
import NeighborhoodSceneBase from '../editor-scenes/NeighborhoodSceneBase.js';
import Player from '../entities/Player.js';
import Npc from '../entities/Npc.js';
import { saveGame } from '../systems/saveSystem.js';
import { startQuest, getCurrentStep, advanceQuest } from '../systems/questSystem.js';
import {
  WORLD, SPAWNS, GARAGE_TRANSITION,
  NPC_PLACEMENTS, BOUNDARY_PADDING, CAMERA,
  remapLegacyPosition, drawDebugWorld,
} from '../data/neighborhoodLayout.js';
import { getNpcDialogue } from '../services/npcAiClient.js';
import { getNpcProfile } from '../data/npcProfiles.js';
import { computeDifficultyBand } from '../systems/dialogueDifficulty.js';
import { QUEST_TOPIC_MAP } from '../../learning/topics.js';
import { getFallbackDialogue } from '../data/npcDialogueTemplates.js';
import { populateWorld } from '../systems/ecologyEngine.js';
import { initDepthSort, updateDepthSort, applyDepth } from '../systems/depthSort.js';
import { FLORA_MAP } from '../data/flora.js';

const SCENE_KEY = 'NeighborhoodScene';

// Set to true during development to see zones/bounds
const DEBUG_WORLD = false;

export default class NeighborhoodScene extends NeighborhoodSceneBase {
  // Note: constructor is inherited from NeighborhoodSceneBase (key: 'NeighborhoodScene')

  // preload() is inherited from NeighborhoodSceneBase (loads asset packs)

  create() {
    this._transitioning = false;
    const state = this.registry.get('gameState');

    // --- Physics world bounds ---
    this.physics.world.setBounds(
      BOUNDARY_PADDING.left,
      BOUNDARY_PADDING.top,
      WORLD.width - BOUNDARY_PADDING.left - BOUNDARY_PADDING.right,
      WORLD.height - BOUNDARY_PADDING.top - BOUNDARY_PADDING.bottom,
    );

    // --- Editor-generated layout ---
    this.editorCreate();

    // --- Landmark zone detection state ---
    this._currentLandmark = null;
    this._landmarkLabel = this.add.text(0, 0, '', {
      fontSize: '16px',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
      color: '#fef3c7',
      stroke: '#78350f',
      strokeThickness: 3,
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setDepth(50).setAlpha(0).setScrollFactor(0);

    // --- NPCs (code-owned: behavior + quest integration) ---
    this._npcs = {};
    this._npcBikes = {};

    NPC_PLACEMENTS.forEach((npcData) => {
      const npc = new Npc(this, {
        id: npcData.id,
        name: npcData.name,
        x: npcData.x,
        y: npcData.y,
        color: npcData.color,
        onInteract: () => this._handleNpcInteract(npcData.id, npcData.questId),
      });
      this._npcs[npcData.id] = npc;

      // Bike visual cue near NPC
      const questDone = state.completedQuests?.includes(npcData.questId);
      const bikeIcons = {
        flat_tire_repair: { done: '\uD83D\uDEB2\u2705', todo: '\uD83D\uDEB2\u274C' },
        chain_repair: { done: '\uD83D\uDEB2\u2705', todo: '\uD83D\uDEB2\u26D3\uFE0F' },
      };
      const icons = bikeIcons[npcData.questId] || { done: '\uD83D\uDEB2\u2705', todo: '\uD83D\uDEB2\u2753' };
      this._npcBikes[npcData.id] = this.add.text(
        npcData.x + npcData.bikeOffset.x,
        npcData.y + npcData.bikeOffset.y,
        questDone ? icons.done : icons.todo,
        { fontSize: '28px' },
      ).setOrigin(0.5).setDepth(40);
    });

    // --- Player (with save compat) ---
    let spawnX, spawnY;
    if (state?.player?.scene === SCENE_KEY) {
      const remapped = remapLegacyPosition(state.player);
      spawnX = remapped.x;
      spawnY = remapped.y;
    } else {
      spawnX = SPAWNS.fromGarage.x;
      spawnY = SPAWNS.fromGarage.y;
    }

    this.player = new Player(this, spawnX, spawnY);

    // --- Physics overlaps ---
    this.physics.add.overlap(this.player.sprite, this.entryZone, () => {
      this._goToGarage();
    });

    this.collisionBodies.forEach((body) => {
      this.physics.add.collider(this.player.sprite, body);
    });

    // --- Camera ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.width, WORLD.height);
    cam.startFollow(this.player.sprite, true, CAMERA.lerpX, CAMERA.lerpY);
    cam.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
    cam.fadeIn(400, 0, 0, 0);

    // --- Input ---
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.input.on('pointerdown', (pointer) => {
      const allNpcs = Object.values(this._npcs);
      for (const npc of allNpcs) {
        const dx = pointer.worldX - npc.circle.x;
        const dy = pointer.worldY - npc.circle.y;
        if (Math.sqrt(dx * dx + dy * dy) < 70 && npc.isNearby()) {
          npc.onInteract();
          return;
        }
      }
    });

    // --- Ecology: procedural flora + fauna ---
    this._ecologyObjects = [];
    this._depthSortables = [];
    this._spawnEcology();

    // --- Depth sorting ---
    initDepthSort(this);

    // --- Audio ---
    const audioMgr = this.registry.get('audioManager');
    if (audioMgr) audioMgr.transitionToScene(SCENE_KEY);

    // --- Debug ---
    if (DEBUG_WORLD) {
      drawDebugWorld(this);
    }
  }

  /** Spawn procedural ecology (flora + fauna) and register for depth sorting. */
  _spawnEcology() {
    const { plants, animals } = populateWorld({ gridSize: 60, timeOfDay: 'day' });

    // Render plants as simple graphics
    for (const plant of plants) {
      const floraDef = FLORA_MAP[plant.species];
      if (!floraDef) continue;

      let gameObj;
      if (plant.size === 'large') {
        // Tall plants: trunk + canopy
        const g = this.add.graphics();
        g.fillStyle(0x8b6914, 1); // trunk
        g.fillRect(-2, -plant.heightOffset, 4, plant.heightOffset);
        g.fillStyle(plant.color, 1); // canopy
        g.fillCircle(0, -plant.heightOffset, 10);
        g.setPosition(plant.x, plant.y);
        gameObj = g;
      } else if (plant.size === 'medium') {
        // Medium: circle canopy
        const g = this.add.graphics();
        g.fillStyle(plant.color, 0.85);
        g.fillCircle(0, -6, 8);
        g.fillStyle(plant.color + 0x111111, 0.6);
        g.fillCircle(3, -3, 5);
        g.setPosition(plant.x, plant.y);
        gameObj = g;
      } else {
        // Small: tiny bush/cactus
        const g = this.add.graphics();
        g.fillStyle(plant.color, 0.8);
        g.fillCircle(0, -3, 5);
        g.setPosition(plant.x, plant.y);
        gameObj = g;
      }

      applyDepth(gameObj, plant.heightOffset);
      this._ecologyObjects.push(gameObj);
      this._depthSortables.push({ gameObject: gameObj, heightOffset: plant.heightOffset });
    }

    // Render animals as emoji text
    for (const animal of animals) {
      const emoji = this.add.text(animal.x, animal.y, animal.emoji, {
        fontSize: animal.aerial ? '16px' : '20px',
      }).setOrigin(0.5);

      if (animal.aerial) {
        emoji.setAlpha(0.7);
        emoji.setDepth(45); // Aerial animals above everything except UI
      } else {
        applyDepth(emoji);
        this._depthSortables.push({ gameObject: emoji, heightOffset: 0 });
      }

      this._ecologyObjects.push(emoji);
    }

    // Register player and NPCs for depth sorting
    this._depthSortables.push(
      { gameObject: this.player.container, heightOffset: 20, children: [this.player.label] },
      { gameObject: this.player.sprite, heightOffset: 0 }
    );
    for (const npc of Object.values(this._npcs)) {
      this._depthSortables.push({
        gameObject: npc.circle,
        heightOffset: 0,
        children: [npc.label, npc.prompt],
      });
    }
  }

  // ── Game loop ──────────────────────────────────────────────────────────────
  update() {
    if (!this.player) return;

    const pos = this.player.update();

    Object.values(this._npcs).forEach((npc) => npc.update(this.player.sprite));

    // --- Depth sorting (every frame) ---
    updateDepthSort(this, this._depthSortables);

    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      for (const npc of Object.values(this._npcs)) {
        if (npc.isNearby()) {
          npc.onInteract();
          break;
        }
      }
    }

    this._checkLandmarkZones();

    if (this.game.getFrame() % 120 === 0) {
      this._savePosition(pos);
    }
  }

  // ── Landmark zone detection ────────────────────────────────────────────────
  _checkLandmarkZones() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    let inside = null;

    for (const zone of this.landmarkZones) {
      const lm = zone._landmarkData;
      if (!lm.showLabel) continue;
      const halfW = lm.width / 2;
      const halfH = lm.height / 2;
      if (px >= lm.x - halfW && px <= lm.x + halfW &&
          py >= lm.y - halfH && py <= lm.y + halfH) {
        inside = lm;
        break;
      }
    }

    if (inside && inside.id !== this._currentLandmark) {
      this._currentLandmark = inside.id;
      const cam = this.cameras.main;
      this._landmarkLabel
        .setText(`${inside.icon} ${inside.name}`)
        .setPosition(cam.width / 2, 60)
        .setAlpha(0);

      this.tweens.add({
        targets: this._landmarkLabel,
        alpha: 1,
        duration: 300,
        yoyo: true,
        hold: 2000,
        onComplete: () => {
          this._landmarkLabel.setAlpha(0);
        },
      });
    } else if (!inside) {
      this._currentLandmark = null;
    }
  }

  // ── NPC Interaction ────────────────────────────────────────────────────────

  /** Compute the current difficulty band using game + learning state. */
  _getDifficultyBand(state, questId) {
    const gameSettings = state.gameSettings || {};
    const topicProgress = {};
    // Read topic progress from learning store (stored in localStorage)
    try {
      const raw = localStorage.getItem('bikebrowser_learning_progress');
      if (raw) {
        const parsed = JSON.parse(raw);
        for (const [id, entry] of Object.entries(parsed.topics || {})) {
          topicProgress[id] = entry.state || 'new';
        }
      }
    } catch { /* ignore */ }

    return computeDifficultyBand({
      completedQuests: state.completedQuests || [],
      topicProgress,
      questTopics: QUEST_TOPIC_MAP[questId] || [],
      overrideMode: gameSettings.complexityMode === 'adaptive' ? undefined : gameSettings.complexityMode,
    });
  }

  /** Emit a dialog event enriched with AI dialogue (async, shows fallback immediately). */
  _emitEnrichedDialog(npcId, questId, step, state) {
    const profile = getNpcProfile(npcId);
    const npcName = profile.name;
    const speaker = step.type === 'quiz' ? 'Zuzu (thinking)' : npcName;
    const { band } = this._getDifficultyBand(state, questId);

    // Get immediate fallback content
    const fallback = getFallbackDialogue(questId, step.id, band);
    const immediateText = fallback?.captionLine || step.text;
    const immediateChoices = step.type === 'quiz'
      ? (fallback?.answerChoices || step.choices)
      : null;

    // Emit fallback immediately so dialog appears without delay
    this.registry.set('dialogEvent', {
      speaker,
      text: immediateText,
      choices: immediateChoices,
      step,
      npcId,
      questId,
      band,
      aiDialogue: fallback,
      voicePreference: profile.voicePreference,
    });

    // Fire-and-forget AI enrichment (updates dialog if AI responds quickly)
    getNpcDialogue({
      npcId,
      questId,
      stepId: step.id,
      stepType: step.type,
      band,
      originalText: step.text,
    }).then(({ dialogue, source }) => {
      if (source === 'fallback') return; // Already showing fallback
      // Only update if the same step is still active
      const currentDialog = this.registry.get('dialogEvent');
      if (currentDialog?.step?.id !== step.id) return;

      const enrichedChoices = step.type === 'quiz'
        ? (dialogue.answerChoices || immediateChoices)
        : null;

      this.registry.set('dialogEvent', {
        speaker,
        text: dialogue.captionLine || immediateText,
        choices: enrichedChoices,
        step,
        npcId,
        questId,
        band,
        aiDialogue: dialogue,
        voicePreference: profile.voicePreference,
      });
    }).catch(() => {
      // AI failed silently — fallback is already showing
    });
  }

  _handleNpcInteract(npcId, questId) {
    let state = this.registry.get('gameState');
    const audioMgr = this.registry.get('audioManager');

    audioMgr?.playSfx('interaction_ping');

    const profile = getNpcProfile(npcId);
    const npcName = profile.name;

    if (state.completedQuests?.includes(questId)) {
      const thankYous = {
        flat_tire_repair: 'Thanks again for fixing my tire, Zuzu! You\'re the best bike mechanic on the block! \uD83D\uDEB2',
        chain_repair: 'My chain is running perfectly thanks to you! Keep up the great work, young mechanic! \u26D3\uFE0F',
      };
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: thankYous[questId] || `Thanks for your help, Zuzu!`,
        choices: null,
        step: null,
        npcId,
        voicePreference: profile.voicePreference,
      });
      return;
    }

    if (state.activeQuest && state.activeQuest.id !== questId) {
      this.registry.set('dialogEvent', {
        speaker: npcName,
        text: 'Looks like you\'re busy with another job right now. Come back when you\'re free!',
        choices: null,
        step: null,
        npcId,
        voicePreference: profile.voicePreference,
      });
      return;
    }

    if (!state.activeQuest) {
      const started = startQuest(state, questId);
      if (started) {
        state = started;
        this.registry.set('gameState', state);
        saveGame(state);
        audioMgr?.playSfx('ui_quest_accept');
      }
    }

    const step = getCurrentStep(state);
    if (!step) return;

    this._emitEnrichedDialog(npcId, questId, step, state);
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

    NPC_PLACEMENTS.forEach((npcData) => {
      if (state.completedQuests?.includes(npcData.questId) && this._npcBikes[npcData.id]) {
        this._npcBikes[npcData.id].setText('\uD83D\uDEB2\u2705');
      }
    });

    const nextStep = getCurrentStep(state);
    if (nextStep) {
      const questId = state.activeQuest?.id;
      const QUEST_NPC = { flat_tire_repair: 'mrs_ramirez', chain_repair: 'mr_chen' };
      const npcId = QUEST_NPC[questId];

      if (npcId && questId) {
        this._emitEnrichedDialog(npcId, questId, nextStep, state);
      } else {
        // Fallback for unknown quests
        this.registry.set('dialogEvent', {
          speaker: 'NPC',
          text: nextStep.text,
          choices: nextStep.type === 'quiz' ? nextStep.choices : null,
          step: nextStep,
        });
      }
    } else {
      this.registry.set('dialogEvent', null);
    }
  }

  // ── Reward celebration ─────────────────────────────────────────────────────

  _showRewardCelebration(state) {
    const cam = this.cameras.main;
    const cx = cam.scrollX + cam.width / 2;
    const cy = cam.scrollY + cam.height / 2 - 40;

    const rewardText = this.add.text(cx, cy, '\uD83C\uDF89 Quest Complete! \uD83C\uDF89', {
      fontSize: '28px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', stroke: '#1e40af', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    const bucks = state.zuzubucks || 0;
    const bucksText = this.add.text(cx, cy + 40, `\uD83D\uDCB0 +25 Zuzubucks! (Total: ${bucks})`, {
      fontSize: '18px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#fbbf24', stroke: '#78350f', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);

    const emojis = ['\u2B50', '\uD83D\uDD27', '\uD83C\uDF89', '\uD83D\uDCB0', '\uD83C\uDFC6', '\uD83D\uDEB2'];
    for (let i = 0; i < 8; i++) {
      const emoji = emojis[i % emojis.length];
      const ex = cx + (Math.random() - 0.5) * 300;
      const ey = cy + (Math.random() - 0.5) * 100;
      const particle = this.add.text(ex, ey, emoji, { fontSize: '24px' })
        .setOrigin(0.5).setDepth(100).setAlpha(0);

      this.tweens.add({
        targets: particle,
        y: ey - 80 - Math.random() * 60,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.5, to: 1.2 },
        duration: 600,
        delay: i * 100,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: particle,
            alpha: 0,
            y: particle.y - 30,
            duration: 800,
            delay: 1200,
            onComplete: () => particle.destroy(),
          });
        },
      });
    }

    rewardText.setScale(0);
    this.tweens.add({
      targets: rewardText,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    bucksText.setAlpha(0);
    this.tweens.add({
      targets: bucksText,
      alpha: 1,
      duration: 400,
      delay: 400,
    });

    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: [rewardText, bucksText],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          rewardText.destroy();
          bucksText.destroy();
        },
      });
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  _savePosition(pos) {
    const state = this.registry.get('gameState');
    if (!state) return;
    const updated = {
      ...state,
      player: { x: Math.round(pos.x), y: Math.round(pos.y), scene: SCENE_KEY },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }

  _goToGarage() {
    if (this._transitioning) return;
    this._transitioning = true;

    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('door_interact');

    const gt = GARAGE_TRANSITION;
    const state = this.registry.get('gameState');
    const updated = {
      ...state,
      player: { x: gt.targetSpawn.x, y: gt.targetSpawn.y, scene: 'GarageScene' },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);

    this.cameras.main.fadeOut(300, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) this.scene.start('GarageScene');
    });
  }
}
