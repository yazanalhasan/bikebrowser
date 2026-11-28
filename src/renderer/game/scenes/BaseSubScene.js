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
import {
  startSideQuest, getCurrentSideStep, advanceSideQuest,
  getOfferableSideQuests, getActiveSideQuestAt, sideQuestDialogAction,
} from '../systems/sideQuestSystem.js';
import { challengeDialogAction } from '../systems/subSceneDialog.js';
import { NARRATOR } from '../systems/questDialog.js';
import { saveGame } from '../systems/saveSystem.js';
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { addArt } from '../../../game/assets/act1Art.js';
import { challengeIdFor } from '../systems/challengeIds.js';

export default class BaseSubScene extends LocalSceneBase {
  constructor(sceneKey) {
    super(sceneKey);
    this._locationId = null;
    this._origin = 'WorldMapScene';
    this._originSpawn = 'default';
    this._challenges = [];
    this._collectedResources = [];
  }

  /**
   * Rewrite a solved marker recorded under the old positional id.
   *
   * Old saves hold `challenge_CopperMineScene_0`. Called once per
   * challenge as the scene builds, in registration order, so the mapping
   * is the same one the old ids were written with.
   *
   * @private
   */
  _migrateLegacyChallengeId(legacyId, challengeId) {
    if (legacyId === challengeId) return;
    const state = this.registry.get('gameState');
    const solved = state?.solvedChallenges;
    if (!Array.isArray(solved) || !solved.includes(legacyId)) return;
    const updated = {
      ...state,
      solvedChallenges: [
        ...solved.filter((id) => id !== legacyId),
        ...(solved.includes(challengeId) ? [] : [challengeId]),
      ],
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
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

    // Setup embedded challenges (replaces popup questions). The list is
    // emptied first: it survived between visits, which is what made the
    // ids drift.
    this._resetChallenges();
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
    const locationId = this.getLocationId();
    // Only count what the kid can actually take. This used to count every
    // quest defined for the location, so the mine promised "2 quests here"
    // when Pete offers the second one only after the first is finished.
    const offerable = getOfferableSideQuests(locationId, state);
    const underway = getActiveSideQuestAt(locationId, state);

    let text = 'You arrived! Explore the area.';
    if (underway) {
      text = `You arrived! "${underway.title}" is still going.`;
    } else if (offerable.length === 1) {
      text = 'You arrived! Someone here has a quest for you.';
    } else if (offerable.length > 1) {
      text = `You arrived! There are ${offerable.length} quests to pick up here.`;
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

  /**
   * Phaser reuses the scene object, so anything built in `create()` has to
   * be cleared there too. This list is what the challenge ids used to be
   * numbered from.
   */
  _resetChallenges() {
    this._challenges = [];
  }

  _initSideQuests() {
    // Nothing to do on init — quests are triggered by NPC/interactable interactions
  }

  /**
   * The standard side-quest giver turn: resume what is running, offer the
   * next one that can be started, or say the all-done line.
   *
   * The mine, the foraging grounds and the river each had their own copy of
   * this branching with the prerequisite spelled out in scene code
   * ("...&& fiberQuest?.completed"). The prerequisite now lives in the quest
   * data as `requires`, and this reads it.
   *
   * @param {string} npcName
   * @param {{ allDone: string, offers: Record<string, {text: string, accept: string}>,
   *           decline?: string }} lines
   */
  offerSideQuest(npcName, lines) {
    const state = this.registry.get('gameState');
    const locationId = this.getLocationId();

    const underway = getActiveSideQuestAt(locationId, state);
    if (underway) {
      this.triggerSideQuest(underway.id);
      return;
    }

    const next = getOfferableSideQuests(locationId, state)[0];
    if (!next) {
      this.registry.set('dialogEvent', {
        speaker: npcName, text: lines.allDone, choices: null, step: null,
      });
      return;
    }

    const offer = lines.offers?.[next.id] || {};
    this.registry.set('dialogEvent', {
      speaker: npcName,
      text: offer.text || `Want to take on ${next.title}?`,
      choices: [
        { label: offer.accept || `Start ${next.title}!`, action: 'start_quest', questId: next.id },
        { label: lines.decline || 'Maybe later', action: 'dismiss' },
      ],
      step: { type: 'side_quest_offer', questId: next.id },
    });
  }

  /**
   * Side-quest dialogs never belong to the main quest.
   *
   * Offers and side-quest steps used to fall through to
   * `LocalSceneBase.advanceFromDialog`, which tried to advance whatever main
   * quest was running: "Start Copper Quest!" answered with the bridge
   * quest's hint and started nothing, and a side quest's own steps never
   * advanced.
   */
  advanceFromDialog(choiceIndex) {
    const dialog = this.registry.get('dialogEvent');

    // An embedded challenge grades itself. `resolveChallenge` had no
    // callers at all, so a wrong answer in the mine was never marked wrong:
    // the box went straight to the next step of whatever main quest was
    // running.
    const challenge = challengeDialogAction(dialog, choiceIndex);
    if (challenge) {
      this.registry.set('dialogEvent', null);
      this.resolveChallenge(challenge.challengeId, challenge.choiceIndex);
      return undefined;
    }

    const action = sideQuestDialogAction(dialog, choiceIndex);
    if (!action) return super.advanceFromDialog(choiceIndex);

    this.registry.set('dialogEvent', null);
    if (action.kind === 'start') this.triggerSideQuest(action.questId);
    else if (action.kind === 'advance') this.advanceSideQuestStep(action.questId, choiceIndex);
    return undefined;
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
   * @param {string} config.icon — Act 1 art texture key (see act1ArtRegistry.js)
   * @param {string} config.label — display name
   * @param {string} config.question — the challenge question
   * @param {Array} config.choices — answer choices
   * @param {string} config.explanation — shown after answering
   * @param {string} [config.concept] — math/science concept
   * @param {object} [config.reward] — { items, zuzubucks, reputation }
   */
  addChallenge(config) {
    // The id comes from the challenge itself, never from how many have
    // been registered: `this._challenges.length` restarted at 0 only in
    // the constructor, and Phaser reuses the scene object, so a second
    // visit numbered the same three challenges _3.._5 and offered every
    // one of them again.
    const challengeId = challengeIdFor(this.getSceneKey(), config);
    const legacyId = `challenge_${this.getSceneKey()}_${this._challenges.length}`;
    this._migrateLegacyChallengeId(legacyId, challengeId);

    const state = this.registry.get('gameState');
    const solved = state.solvedChallenges?.includes(challengeId);

    if (solved) {
      // Show completed marker
      addArt(this, ART.ui_check, config.x, config.y, { anchor: 'icon', maxPx: 30, depth: 4 });
      this.add.text(config.x, config.y + 20, config.label, {
        fontSize: '10px', fontFamily: 'sans-serif', color: '#16a34a',
        stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4);
      return;
    }

    this.addInteractable({
      x: config.x,
      y: config.y,
      icon: config.icon || ART.ui_question,
      label: config.label || 'Challenge',
      radius: 70,
      onInteract: () => {
        // Solved earlier in this same visit: the ✓ marker is only drawn
        // when the scene is built, so without this the question came back
        // and asked a child something they had already worked out.
        const live = this.registry.get('gameState');
        if (live?.solvedChallenges?.includes(challengeId)) {
          this.registry.set('dialogEvent', {
            speaker: NARRATOR,
            text: `You already worked this one out.

${config.explanation}`,
            choices: null,
            step: null,
          });
          return;
        }
        this.registry.set('dialogEvent', {
          // "Challenge" is not a person. The notebook is how the game
          // already talks to the child when nobody is speaking.
          speaker: NARRATOR,
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

    let state = this.registry.get('gameState');

    // Already earned. Say so warmly and pay nothing: this is what let a
    // child farm the same three mine challenges for 20 Zuzubucks a lap.
    if (state.solvedChallenges?.includes(challengeId)) {
      this.registry.set('mcpAlert', {
        id: `challenge_done_${challengeId}`,
        message: `You already worked this one out: ${challenge.explanation}`,
        severity: 'info',
      });
      return;
    }

    const correct = challenge.choices[choiceIndex]?.correct;

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
   * @param {(updatedState: object, scene: BaseSubScene) => void} [config.onAfterCollect]
   *   — optional scene-specific hook fired AFTER the inventory mutation and
   *     pickup SFX. Wrapped in try/catch so it can't break generic collection.
   */
  addResource(config) {
    const state = this.registry.get('gameState');
    const collected = state.inventory?.includes(config.itemId);

    if (collected) {
      // Show collected marker
      addArt(this, ART.ui_check, config.x, config.y, {
        anchor: 'icon', maxPx: 22, depth: 4, alpha: 0.5,
      });
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

        // Optional scene-specific post-collect hook. Safe — wraps in try/catch so
        // scene-specific logic can't break generic resource collection.
        if (typeof config.onAfterCollect === 'function') {
          try { config.onAfterCollect(updated, this); }
          catch (e) {
            // eslint-disable-next-line no-console
            console.warn(`[addResource] onAfterCollect failed for ${config.itemId}`, e);
          }
        }
      },
    });
  }
}
