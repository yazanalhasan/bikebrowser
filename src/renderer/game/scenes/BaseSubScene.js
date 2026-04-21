/**
 * BaseSubScene — template for all Quest for Glory-style sub-scenes.
 *
 * Extends LocalSceneBase with:
 *   - Origin tracking (where the player came from)
 *   - Auto exit-point registration (return to world map)
 *   - Gameplay arbiter integration (suppresses global questions)
 *   - Side quest management
 *   - Embedded challenge system (replaces popup questions)
 *   - Resource collection tracking
 *
 * Sub-scenes are OPTIONAL. They never block main progression.
 *
 * Subclasses override:
 *   createWorld()      — build the environment
 *   getSceneKey()      — return the scene key
 *   getWorldSize()     — return { width, height }
 *   getLocationId()    — return the worldMapData location id
 *   onUpdate(dt)       — optional per-frame logic
 *   setupChallenges()  — register embedded educational challenges
 */

import LocalSceneBase from './LocalSceneBase.js';
import { setBusy, resetBusyState } from '../systems/gameplayArbiter.js';
import { getSideQuestsForLocation, startSideQuest, getCurrentSideStep, advanceSideQuest } from '../systems/sideQuestSystem.js';
import { saveGame } from '../systems/saveSystem.js';

export default class BaseSubScene extends LocalSceneBase {
  constructor(sceneKey) {
    super(sceneKey);
    this._locationId = null;
    this._origin = 'WorldMapScene';
    this._originSpawn = 'default';
    this._challenges = [];
    this._collectedResources = [];
  }

  /** Override to return the location ID from worldMapData. */
  getLocationId() { return this._locationId; }

  /** Override to register embedded educational challenges. */
  setupChallenges() { /* subclass implements */ }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  init(data) {
    this._origin = data?.origin || 'WorldMapScene';
    this._originSpawn = data?.originSpawn || 'default';
    this._locationId = data?.locationId || this.getLocationId();
  }

  create() {
    // Mark as in sub-scene — suppresses global education questions
    setBusy('inSubScene', true);

    // Call parent create (sets up player, physics, camera, MCP, obstacles)
    super.create();

    // Register exit point (return to world map)
    this._registerExitPoint();

    // Setup side quests for this location
    this._initSideQuests();

    // Setup embedded challenges (replaces popup questions)
    this.setupChallenges();

    // Show arrival message
    this._showArrivalMessage();
  }

  update(time, delta) {
    super.update(time, delta);
  }

  shutdown() {
    // Clear sub-scene flag when leaving
    setBusy('inSubScene', false);
  }

  // ── Exit Point ────────────────────────────────────────────────────────

  _registerExitPoint() {
    const world = this.getWorldSize();

    // Default exit: bottom edge of the scene → return to world map
    this.addExit({
      x: world.width / 2,
      y: world.height - 20,
      width: Math.min(world.width * 0.4, 200),
      height: 40,
      targetScene: this._origin,
      targetSpawn: this._originSpawn,
      label: '← Return to Map',
      sfx: 'door_interact',
    });
  }

  // ── Arrival Message ───────────────────────────────────────────────────

  _showArrivalMessage() {
    const state = this.registry.get('gameState');
    const quests = getSideQuestsForLocation(this.getLocationId());
    const available = quests.filter(q => !state.sideQuests?.[q.id]?.completed);

    let text = 'You arrived! Explore the area.';
    if (available.length > 0) {
      text = `You arrived! There ${available.length === 1 ? 'is' : 'are'} ${available.length} quest${available.length > 1 ? 's' : ''} here.`;
    }

    this.time.delayedCall(500, () => {
      this.registry.set('mcpAlert', {
        id: 'sub_scene_arrival',
        message: text,
        severity: 'info',
      });
    });
  }

  // ── Side Quests ───────────────────────────────────────────────────────

  _initSideQuests() {
    // Nothing to do on init — quests are triggered by NPC/interactable interactions
  }

  /**
   * Start a side quest from an interactable/NPC.
   * @param {string} questId
   */
  triggerSideQuest(questId) {
    let state = this.registry.get('gameState');
    const result = startSideQuest(state, questId);
    if (result.ok) {
      this.registry.set('gameState', result.state);
      saveGame(result.state);

      // Show first step
      const step = getCurrentSideStep(result.state, questId);
      if (step) {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: step.text,
          choices: step.choices || null,
          step: { ...step, questId, isSideQuest: true },
        });
      }
    } else {
      this.registry.set('mcpAlert', {
        id: `side_quest_${questId}`,
        message: result.message,
        severity: 'info',
      });
    }
  }

  /**
   * Advance a side quest step (called from dialog handler).
   * @param {string} questId
   * @param {number} [choiceIndex]
   */
  advanceSideQuestStep(questId, choiceIndex) {
    let state = this.registry.get('gameState');
    const result = advanceSideQuest(state, questId, choiceIndex);
    this.registry.set('gameState', result.state);
    saveGame(result.state);

    if (result.completed) {
      // Show completion celebration
      this.registry.set('mcpAlert', {
        id: `side_quest_complete_${questId}`,
        message: `Side quest complete! ${result.message}`,
        severity: 'info',
      });
      const audioMgr = this.registry.get('audioManager');
      audioMgr?.playSfx('ui_quest_complete');
    } else if (result.ok) {
      // Show next step
      const step = getCurrentSideStep(result.state, questId);
      if (step) {
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu',
          text: step.text,
          choices: step.choices || null,
          step: { ...step, questId, isSideQuest: true },
        });
      }
    } else {
      // Failed (wrong quiz answer, missing item)
      this.registry.set('mcpAlert', {
        id: `side_quest_fail_${questId}`,
        message: result.message,
        severity: 'warning',
      });
    }
  }

  // ── Embedded Challenges ───────────────────────────────────────────────

  /**
   * Add an embedded educational challenge at a location in the scene.
   * These replace random popup questions with contextual gameplay.
   *
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {string} config.icon — emoji marker
   * @param {string} config.label — display name
   * @param {string} config.question — the challenge question
   * @param {Array} config.choices — answer choices
   * @param {string} config.explanation — shown after answering
   * @param {string} [config.concept] — math/science concept
   * @param {object} [config.reward] — { items, zuzubucks, reputation }
   */
  addChallenge(config) {
    const challengeId = `challenge_${this.getSceneKey()}_${this._challenges.length}`;
    const state = this.registry.get('gameState');
    const solved = state.solvedChallenges?.includes(challengeId);

    if (solved) {
      // Show completed marker
      this.add.text(config.x, config.y, '✅', { fontSize: '24px' }).setOrigin(0.5).setDepth(4);
      this.add.text(config.x, config.y + 20, config.label, {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#16a34a',
        stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4);
      return;
    }

    this.addInteractable({
      x: config.x,
      y: config.y,
      icon: config.icon || '❓',
      label: config.label || 'Challenge',
      radius: 70,
      onInteract: () => {
        this.registry.set('dialogEvent', {
          speaker: 'Challenge',
          text: config.question,
          choices: config.choices,
          step: {
            type: 'embedded_challenge',
            challengeId,
            explanation: config.explanation,
            concept: config.concept,
            reward: config.reward,
          },
        });
      },
    });

    this._challenges.push({ id: challengeId, ...config });
  }

  /**
   * Resolve an embedded challenge answer.
   * @param {string} challengeId
   * @param {number} choiceIndex
   */
  resolveChallenge(challengeId, choiceIndex) {
    const challenge = this._challenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const correct = challenge.choices[choiceIndex]?.correct;
    let state = this.registry.get('gameState');

    if (correct) {
      // Mark as solved
      const solvedChallenges = [...(state.solvedChallenges || []), challengeId];
      let updated = { ...state, solvedChallenges };

      // Apply reward
      if (challenge.reward) {
        if (challenge.reward.zuzubucks) {
          updated = { ...updated, zuzubucks: (updated.zuzubucks || 0) + challenge.reward.zuzubucks };
        }
        if (challenge.reward.reputation) {
          updated = { ...updated, reputation: (updated.reputation || 0) + challenge.reward.reputation };
        }
        if (challenge.reward.items) {
          updated = { ...updated, inventory: [...(updated.inventory || []), ...challenge.reward.items] };
        }
      }

      this.registry.set('gameState', updated);
      saveGame(updated);

      this.registry.set('mcpAlert', {
        id: `challenge_${challengeId}`,
        message: `Correct! ${challenge.explanation} ${challenge.reward?.zuzubucks ? `(+${challenge.reward.zuzubucks} Zuzubucks)` : ''}`,
        severity: 'info',
      });
      const audioMgr = this.registry.get('audioManager');
      audioMgr?.playSfx('ui_success');
    } else {
      this.registry.set('mcpAlert', {
        id: `challenge_fail_${challengeId}`,
        message: `Not quite! ${challenge.explanation}`,
        severity: 'warning',
      });
      const audioMgr = this.registry.get('audioManager');
      audioMgr?.playSfx('ui_error');
    }
  }

  // ── Resource Collection ───────────────────────────────────────────────

  /**
   * Add a forageable resource to the scene.
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {string} config.icon
   * @param {string} config.label
   * @param {string} config.itemId — item to grant
   * @param {string} [config.description] — flavor text
   */
  addResource(config) {
    const state = this.registry.get('gameState');
    const collected = state.inventory?.includes(config.itemId);

    if (collected) {
      // Show collected marker
      this.add.text(config.x, config.y, '✓', {
        fontSize: '16px', color: '#16a34a', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4).setAlpha(0.5);
      return;
    }

    this.addInteractable({
      x: config.x,
      y: config.y,
      icon: config.icon,
      label: config.label,
      radius: 60,
      onInteract: () => {
        let st = this.registry.get('gameState');
        const updated = { ...st, inventory: [...(st.inventory || []), config.itemId] };
        this.registry.set('gameState', updated);
        saveGame(updated);

        this.registry.set('mcpAlert', {
          id: `collect_${config.itemId}`,
          message: `Collected: ${config.label}! ${config.description || ''}`,
          severity: 'info',
        });
        const audioMgr = this.registry.get('audioManager');
        audioMgr?.playSfx('item_pickup');
      },
    });
  }
}
