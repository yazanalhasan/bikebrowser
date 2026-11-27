/**
 * LocalSceneBase — common foundation for all zoomed-in local scenes.
 *
 * Provides:
 *   - World bounds and collision boundary
 *   - Player spawning with larger scale (zoomed-in feel)
 *   - Exit zone management (fade transitions to other scenes)
 *   - NPC management and interaction
 *   - Interactable prop system
 *   - Action key input (E key + touch)
 *   - Camera setup (tighter framing)
 *   - Audio transition
 *   - Save system integration
 *   - Common update loop
 *
 * Subclasses override:
 *   createWorld()    — build the scene's visual layout and props
 *   onUpdate(dt)     — optional per-frame logic
 *   getSceneKey()    — return the scene key string
 *   getWorldSize()   — return { width, height } for this scene
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import Npc from '../entities/Npc.js';
import { saveGame } from '../systems/saveSystem.js';
import { transitionTo } from '../systems/sceneTransition.js';
import { SCENE_MAP, getSpawn } from '../systems/sceneRegistry.js';
import MCPSystem from '../systems/MCPSystem.js';
import { spawnObstacles } from '../systems/obstacleSystem.js';
import { advanceQuest, getCurrentStep } from '../systems/questSystem.js';
import { interpolateStepText } from '../systems/questTemplating.js';
import { dialogForStep, listenerOpenedDialog, sfxForStep } from '../systems/questDialog.js';
import { getPhysicsState, wireCameraToMCP } from '../systems/physicsbridge.js';
import { localCameraFit, localCameraCenter } from '../utils/localCameraFit.js';
import { preloadGameAssets } from '../../../game/assets/preloadGameAssets.js';
import { preloadEcologyAssets } from '../systems/ecology/ecologyAssetManifest.js';
import { addArt, addGround, addBackdrop, hasArt } from '../../../game/assets/act1Art.js';
import { mountCompanion } from '../systems/companionSystem.js';
import { startInteractiveExplainer } from '../systems/interactiveExplainerSystem.js';
import { getNpcProfile } from '../data/npcProfiles.js';
import QUESTS from '../data/quests.js';
import {
  getCompanionsForScene,
  pickCompanionLine,
  markCompanionMet,
} from '../data/companions.js';

// Default world size for local scenes (viewport-scale, not overworld-scale)
const DEFAULT_WORLD = { width: 800, height: 600 };

// Biome-themed background fills + accent colors for the area outside a small
// scene's world bounds (when the player's window is larger than the world).
// Keyed by sceneKey to avoid touching every scene file. Edit a SCENE_BIOMES
// entry when adding a new local scene; fallback is a muted dark frame.
const SCENE_BIOMES = {
  ZuzuGarageScene:    { fill: 0x6b4423, accent: 0x8b6914, label: 'urban'     },
  GarageScene:        { fill: 0x6b4423, accent: 0x8b6914, label: 'urban'     },
  NeighborhoodScene:  { fill: 0x6b5b3a, accent: 0x8b7344, label: 'urban'     },
  StreetBlockScene:   { fill: 0xa08250, accent: 0xc4a26a, label: 'desert'    },
  DesertEdgeScene:    { fill: 0xa08250, accent: 0xc4a26a, label: 'desert'    },
  DogParkScene:       { fill: 0x4a6b3a, accent: 0x6e8a4a, label: 'grassland' },
  SportsFieldsScene:  { fill: 0x5a7a4a, accent: 0x7a9a5a, label: 'grassland' },
  CommunityPoolScene: { fill: 0x4a6680, accent: 0x6a86a0, label: 'urban'     },
  LakeEdgeScene:      { fill: 0x4a7090, accent: 0x6a90b0, label: 'water'     },
  DesertTrailScene:   { fill: 0xa08250, accent: 0xc4a26a, label: 'desert'    },
  DesertForagingScene:{ fill: 0xa68a55, accent: 0xc8aa78, label: 'desert'    },
  MountainScene:      { fill: 0x5a4a3a, accent: 0x7a6a52, label: 'mountain'  },
  CopperMineScene:    { fill: 0x3a2f25, accent: 0x6a553f, label: 'rock'      },
  SaltRiverScene:     { fill: 0x2c5577, accent: 0x4a7393, label: 'water'     },
};
const DEFAULT_BIOME = { fill: 0x2a2422, accent: 0x4a4030, label: 'unknown' };

/**
 * How much further than the interaction radius a prop's name stays
 * visible. Gives the child the name just before the interact prompt.
 */
const NAME_LABEL_LEAD_PX = 34;

export default class LocalSceneBase extends Phaser.Scene {
  constructor(sceneKey) {
    super({ key: sceneKey });
    this._sceneKey = sceneKey;
  }

  // ---------------------------------------------------------------------------
  // Override points
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // Asset loading
  // ---------------------------------------------------------------------------

  /**
   * Load the shared Act 1 art for every local scene and sub-scene.
   *
   * Subclasses that define their own preload() call `super.preload?.()` first,
   * so every scene in the Act 1 chain gets the atlases, the Sonoran tileset,
   * the character sheets, the scene grounds, the world props and the ecology
   * sprites without repeating the list. Loads are idempotent — Phaser skips a
   * key that is already in the texture cache, so scene-to-scene transitions
   * do not re-fetch.
   */
  preload() {
    preloadGameAssets(this);
    preloadEcologyAssets(this);
  }

  /** Override to define the scene key. */
  getSceneKey() { return this._sceneKey; }

  /** Override to set world size. Larger = scrollable with camera. */
  getWorldSize() { return DEFAULT_WORLD; }

  /** Override to build the scene's visual world. Called after base setup. */
  createWorld() { /* subclass implements */ }

  /**
   * How this room should be framed: `'cover'` (fill the screen width, follow
   * Zuzu vertically) or `'contain'` (show the whole room, never follow).
   *
   * Rooms that are really a control panel want `'contain'` — see
   * `utils/localCameraFit.js`. Everything else is a place you walk around in.
   */
  getCameraFitMode() { return 'cover'; }

  /** Override for per-frame custom logic. */
  onUpdate(_dt) { /* subclass implements */ }

  // ---------------------------------------------------------------------------
  // Quest progression — default advanceFromDialog
  // ---------------------------------------------------------------------------
  // Called by GameContainer.handleDialogContinue when the player closes a
  // quest-bearing dialog. Advances the active quest if its step's requirements
  // are met (e.g. requiredItem is in inventory after a forage/grant scene).
  // Without this, scenes like CopperMineScene / MountainScene / ZuzuGarageScene
  // would grant items via dialog but never trigger the step advance — leaving
  // the player with the item but quest stuck on the prior step. NeighborhoodScene
  // and StreetBlockScene OVERRIDE this with NPC-aware versions that emit the
  // next step's dialog inline; this default just advances + saves silently and
  // closes the dialog so the next interaction (NPC, prop, scene transition)
  // surfaces the next step.
  advanceFromDialog(choiceIndex) {
    if (!this.scene?.isActive?.()) return;

    let state = this.registry.get('gameState');
    if (!state?.activeQuest?.id) {
      // No active quest — just close the dialog
      this.registry.set('dialogEvent', null);
      return;
    }

    const audioMgr = this.registry.get('audioManager');
    const result = advanceQuest(state, choiceIndex);

    if (!result.ok) {
      audioMgr?.playSfx?.('ui_error');
      const step = getCurrentStep(state);
      if (step?.type === 'quiz') {
        const text = step.templateVars
          ? interpolateStepText(step.text, step.templateVars, state)
          : step.text;
        this.registry.set('dialogEvent', {
          speaker: 'Zuzu (thinking)',
          text: `${result.message}\n\n${text}`,
          choices: step.choices || null,
          step,
          questId: state?.activeQuest?.id,
        });
        return;
      }
      this.registry.set('dialogEvent', {
        speaker: 'System',
        text: result.message,
        choices: null,
        step: getCurrentStep(state),
      });
      return;
    }

    const zuzubucksBefore = state?.zuzubucks || 0;
    state = result.state;
    const zuzubucksGained = (state?.zuzubucks || 0) - zuzubucksBefore;

    // Writing gameState runs every `changedata-gameState` listener
    // SYNCHRONOUSLY, and one of them (the end-of-Act-1 celebration in
    // GameContainer) opens a dialog. This method used to fall through and
    // null `dialogEvent` immediately afterwards, wiping it — and because the
    // celebration only fires once, it never came back. Remember what was
    // there before so we can tell a listener's dialog from a stale one.
    const dialogBeforeWrite = this.registry.get('dialogEvent');
    this.registry.set('gameState', state);
    saveGame(state);
    const listenerKeptDialog = listenerOpenedDialog(
      dialogBeforeWrite, this.registry.get('dialogEvent'),
    );

    const nextStep = getCurrentStep(state);
    if (!nextStep) {
      // Quest completed
      audioMgr?.playStinger?.('reward_stinger');
      if (typeof this._showRewardCelebration === 'function') {
        // Hand over what was actually earned. The celebration used to
        // hard-code "+25 Zuzubucks!" whatever the quest paid.
        this._showRewardCelebration(state, { zuzubucks: zuzubucksGained });
      }
    } else {
      const sfx = sfxForStep(nextStep);
      if (sfx) audioMgr?.playSfx?.(sfx.key, sfx.opts);
    }
    // An explainer step opens its own overlay rather than a dialog box.
    if (nextStep?.type === 'explainer' && nextStep.explainerId) {
      startInteractiveExplainer(this, nextStep.explainerId);
      return;
    }

    // Carry the conversation on. `systems/questDialog.js` decides what the
    // box should say; this method only writes it.
    const followOn = dialogForStep(nextStep, state, this._activeQuestGiverName(state));
    if (followOn) {
      this.registry.set('dialogEvent', followOn);
      return;
    }

    // Nothing follows. Leave a dialog a listener opened during the state
    // write above rather than wiping it.
    if (listenerKeptDialog) return;
    this.registry.set('dialogEvent', null);
  }

  /**
   * Display name of the NPC who gave the active quest, for dialog speakers.
   * Reads `data/npcProfiles.js` rather than a per-scene name map, so a new
   * quest giver needs no scene edit.
   */
  _activeQuestGiverName(state) {
    const giver = QUESTS[state?.activeQuest?.id]?.giver;
    return (giver && getNpcProfile(giver)?.name) || null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  create() {
    // Phaser reuses the scene *object* across visits, so every per-visit
    // field has to be cleared here or it carries the last visit's destroyed
    // objects into this one.
    //
    // `this.player` matters most. `createWorld()` runs before the new Player
    // is constructed, and `systems/ecology` takes a fast path when
    // `scene.player` already exists at registration time — on a revisit that
    // was the *previous*, destroyed sprite, so every animal's proximity
    // overlap was wired to an inactive object and observations silently
    // stopped counting. That is what blocked "Follow the Food Chain" after
    // the first visit to a scene. Clearing it forces the deferred path,
    // which wires to the real player on the first update tick.
    //
    // `_collisionBodies` is the same bug with a smaller blast radius: it grew
    // 7 -> 14 -> 21 across visits and re-added colliders for destroyed walls.
    this.player = null;
    this._companions = [];
    this._collisionBodies = null;
    this._obstacles = null;
    this._ecologyEntityIndex = null;
    this._transitioning = false;
    this._npcs = {};
    this._exits = [];
    this._interactables = [];

    const state = this.registry.get('gameState');
    const sceneKey = this.getSceneKey();
    const world = this.getWorldSize();

    // Publish which scene is on screen so the React HUD can scene-gate its
    // hints. `gameState.player.scene` is not usable for that: it is only
    // rewritten by `_savePosition`, so it still names the previous scene
    // until the child moves.
    this.registry.set('activeSceneKey', sceneKey);

    // --- Physics world bounds ---
    this.physics.world.setBounds(0, 0, world.width, world.height);

    // --- Build the scene (subclass) ---
    this.createWorld();
    this.time.delayedCall(0, () => {
      const live = this.registry.get('gameState') || state;
      const liveStep = getCurrentStep(live);
      if (liveStep?.type !== 'quiz') return;
      const text = liveStep.templateVars
        ? interpolateStepText(liveStep.text, liveStep.templateVars, live)
        : liveStep.text;
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu (thinking)',
        text,
        choices: liveStep.choices || null,
        step: liveStep,
        questId: live?.activeQuest?.id,
      });
    });

    // --- Player ---
    const spawnName = this._resolveSpawnName(state);
    const spawn = getSpawn(sceneKey, spawnName);
    const px = state?.player?.scene === sceneKey ? state.player.x : spawn.x;
    const py = state?.player?.scene === sceneKey ? state.player.y : spawn.y;

    this.player = new Player(this, px, py);

    // --- Companions (Lina in the neighborhood and the desert) ---
    this._mountCompanions(px, py);

    // --- Wire exit zones ---
    for (const exit of this._exits) {
      this.physics.add.overlap(this.player.sprite, exit.zone, () => {
        transitionTo(this, exit.targetScene, exit.targetSpawn, { sfx: exit.sfx || 'door_interact' });
      });
    }

    // --- Wire collision bodies ---
    if (this._collisionBodies) {
      for (const body of this._collisionBodies) {
        this.physics.add.collider(this.player.sprite, body);
      }
    }

    // --- Camera ---
    // Fit single-screen rooms (and any room that already fits) so a phone
    // shows the whole garage instead of cropping it to the top, and a large
    // window scales the room up. Bigger maps still follow the player.
    this._fitLocalCamera();
    this.scale.on('resize', this._fitLocalCamera, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this._fitLocalCamera, this);
    });
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // --- Input ---
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.input.on('pointerdown', (pointer) => {
      this._handlePointerInteract(pointer);
    });

    // --- Audio ---
    const audioMgr = this.registry.get('audioManager');
    const sceneDef = SCENE_MAP[sceneKey];
    if (audioMgr && sceneDef?.defaultMusic) {
      audioMgr.transitionToScene(sceneKey);
    }

    // --- MCP (Master Control Program) ---
    this.mcp = new MCPSystem(this);
    this.mcp.init({ sceneKey });
    this.registry.set('mcp', this.mcp);

    // --- Obstacles (Zelda-style progression gates) ---
    this._obstacles = spawnObstacles(this);

    // --- Camera effects wired to MCP events ---
    wireCameraToMCP(this, this.mcp);

    // Expose to devtools
    if (typeof window !== 'undefined') {
      window.mcp = this.mcp;
    }
  }

  update(_time, delta) {
    if (!this.player) return;
    // Skip the whole tick if the player's sprite was torn down by a
    // pause/unmount race — entities downstream (NPCs, MCP, save) all
    // read this.player.sprite and would crash on a destroyed body.
    if (!this.player.sprite || !this.player.sprite.active || !this.player.sprite.body) return;

    const pos = this.player.update();
    if (this._cameraMode === 'follow') this._frameFollowCamera();

    // Update NPCs
    Object.values(this._npcs).forEach(npc => npc.update(this.player.sprite));

    // Walk companions along behind the player
    for (const companion of this._companions || []) {
      companion.update(this.player.sprite, this.game.loop.delta);
    }

    const liveState = this.registry.get('gameState');
    const liveStep = getCurrentStep(liveState);
    const autoQuizKey = liveStep?.type === 'quiz'
      ? `${liveState?.activeQuest?.id}:${liveState?.activeQuest?.stepIndex}`
      : null;
    if (autoQuizKey && !this.registry.get('dialogEvent') && this._lastAutoQuizKey !== autoQuizKey) {
      this._lastAutoQuizKey = autoQuizKey;
      const text = liveStep.templateVars
        ? interpolateStepText(liveStep.text, liveStep.templateVars, liveState)
        : liveStep.text;
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu (thinking)',
        text,
        choices: liveStep.choices || null,
        step: liveStep,
        questId: liveState?.activeQuest?.id,
      });
    }

    // Action key interaction
    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this._handleActionKey();
    }

    // Check interactable proximity
    this._updateInteractablePrompts();

    // MCP orchestration tick
    if (this.mcp) {
      this.mcp.update(delta, _time);
    }

    // Periodic save
    if (this.game.getFrame() % 120 === 0) {
      this._savePosition(pos);
    }

    // Subclass update
    this.onUpdate(delta);
  }

  // ---------------------------------------------------------------------------
  // Scene building helpers (call from createWorld)
  // ---------------------------------------------------------------------------

  /**
   * Place an Act 1 art sprite by texture key. Thin pass-through to the art
   * helper so scenes never touch sprite origins or file paths directly.
   * @see src/game/assets/act1Art.js
   */
  addProp(key, x, y, opts = {}) {
    return addArt(this, key, x, y, opts);
  }

  /** Tile a seamless scene-ground texture over a rectangle (top-left anchored). */
  addGroundTexture(key, x, y, w, h, opts = {}) {
    return addGround(this, key, x, y, w, h, opts);
  }

  /** Stretch a painted backdrop plate over a rectangle (top-left anchored). */
  addBackdropTexture(key, x, y, w, h, opts = {}) {
    return addBackdrop(this, key, x, y, w, h, opts);
  }

  /** True when an Act 1 texture is loaded in this scene. */
  hasArtTexture(key) {
    return hasArt(this, key);
  }

  /**
   * Add a rectangular collision wall.
   * @returns {Phaser.GameObjects.Rectangle}
   */
  addWall(x, y, w, h, color = 0x000000, alpha = 0) {
    const wall = this.add.rectangle(x, y, w, h, color, alpha);
    this.physics.add.existing(wall, true);
    if (!this._collisionBodies) this._collisionBodies = [];
    this._collisionBodies.push(wall);
    return wall;
  }

  /**
   * Add a visible wall.
   *
   * Pass `textureKey` to surface the wall with a tiled Act 1 texture instead
   * of a flat fill — a cliff face reads as rock, not as a grey box. The flat
   * colour stays as the fallback for walls that have no art (fences, mine
   * timbers), and as the backing behind a texture with any transparency.
   *
   * @param {string} [textureKey] Act 1 tile texture to face the wall with
   */
  addVisibleWall(x, y, w, h, color, strokeColor, textureKey = null) {
    const wall = this.add.rectangle(x, y, w, h, color);
    if (strokeColor) wall.setStrokeStyle(2, strokeColor);
    this.physics.add.existing(wall, true);
    if (!this._collisionBodies) this._collisionBodies = [];
    this._collisionBodies.push(wall);

    if (textureKey && hasArt(this, textureKey)) {
      wall.setFillStyle(color, 0);
      const face = addGround(this, textureKey, x - w / 2, y - h / 2, w, h,
        { depth: wall.depth });
      if (face && strokeColor) {
        this.add.rectangle(x, y, w, h)
          .setStrokeStyle(2, strokeColor)
          .setDepth(wall.depth + 0.1);
      }
      if (!face) wall.setFillStyle(color, 1);
    }
    return wall;
  }

  /**
   * Add an exit zone that transitions to another scene.
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {number} config.width
   * @param {number} config.height
   * @param {string} config.targetScene — scene key
   * @param {string} [config.targetSpawn='default'] — spawn name
   * @param {string} [config.label] — visible label
   * @param {string} [config.sfx] — transition sound
   * @param {number} [config.labelColor=0x92400e]
   */
  addExit(config) {
    const { x, y, width, height, targetScene, targetSpawn = 'default', label, sfx } = config;

    // Invisible trigger
    const zone = this.add.rectangle(x, y, width, height, 0x000000, 0);
    this.physics.add.existing(zone, true);

    // Visual marker
    this.add.rectangle(x, y, width, height, 0xf59e0b, 0.18).setDepth(1);

    // Label
    if (label) {
      this.add.text(x, y, label, {
        fontSize: '14px', fontFamily: 'sans-serif', color: '#92400e',
        fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(2);
    }

    const entry = { zone, targetScene, targetSpawn, sfx };
    this._exits.push(entry);

    // Wire the overlap immediately if the player has already been created.
    // Exits added in createWorld() run before the player exists and get wired
    // by the loop in create(); exits added after super.create() (e.g. from
    // BaseSubScene._registerExitPoint) need to be wired here or they'll
    // never trigger a transition.
    if (this.player?.sprite) {
      this.physics.add.overlap(this.player.sprite, zone, () => {
        transitionTo(this, entry.targetScene, entry.targetSpawn,
          { sfx: entry.sfx || 'door_interact' });
      });
    }

    return zone;
  }

  /**
   * Mount every companion whose data lists this scene, a short way behind
   * the player's spawn. Companions are friends, not quest-givers: talking
   * to one shows a line and nothing else changes.
   * @private
   */
  _mountCompanions(px, py) {
    this._companions = [];
    const state = this.registry.get('gameState');
    for (const def of getCompanionsForScene(this.getSceneKey(), state)) {
      const companion = mountCompanion(this, {
        id: def.id,
        name: def.name,
        walkSheet: def.walkSheet,
        idleSheet: def.idleSheet,
        // Clear of the spawn point: at (-44, +10) she overlapped Zuzu on
        // arrival, which on Home Street put her on top of him and the
        // flat-tyre bike at once.
        x: px - 62,
        y: py + 26,
        onInteract: () => {
          const live = this.registry.get('gameState');
          const line = pickCompanionLine(def, live);
          if (!line) return;
          // Meeting her is what lets her follow Zuzu out of the neighborhood.
          const next = markCompanionMet(live, def.id);
          if (next !== live) {
            this.registry.set('gameState', next);
            saveGame(next);
          }
          this.registry.set('dialogEvent', {
            speaker: def.name,
            text: line.text,
            choices: null,
            step: null,
          });
        },
      });
      if (companion) this._companions.push(companion);
    }
  }

  /**
   * Add an NPC to the scene.
   * @param {object} config — same as Npc constructor config + questId
   * @returns {Npc}
   */
  addNpc(config) {
    const npc = new Npc(this, config);
    this._npcs[config.id] = npc;
    return npc;
  }

  /**
   * Add an interactable prop (non-NPC object the player can interact with).
   *
   * `icon` is an Act 1 art texture key (see src/game/assets/act1ArtRegistry.js).
   * A string that is not a known art key is drawn as text, which keeps
   * non-Act-1 callers working; for Act 1 that path is a bug, so it warns.
   *
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {string} config.label — display name
   * @param {string|null} config.icon — art texture key, or null when the
   *   scene has already drawn the prop (legacy: an emoji glyph)
   * @param {number} [config.iconMaxPx] — cap the icon's longest side
   * @param {number} [config.radius=60] — interaction radius
   * @param {boolean} [config.showNameLabel=true] — set false when the scene
   *   has already drawn a visible name for this object, so the hotspot does
   *   not print the same name a second time on top of it
   * @param {function} config.onInteract — called when player interacts
   */
  addInteractable(config) {
    const { x, y, label, icon, radius = 60, onInteract, showNameLabel = true } = config;

    // Three cases:
    //  - an art key      -> draw the sprite
    //  - null/'' icon    -> draw nothing, because the scene already drew the
    //                       prop this hotspot sits on (no doubled art)
    //  - any other string -> legacy text glyph
    let text = null;
    if (hasArt(this, icon)) {
      text = addArt(this, icon, x, y, {
        anchor: 'icon',
        depth: 4,
        maxPx: config.iconMaxPx,
      });
    } else if (icon) {
      text = this.add.text(x, y, icon, { fontSize: '28px' }).setOrigin(0.5).setDepth(4);
    }
    // Object caption. Hidden until Zuzu is near it: a scene that names every
    // prop at once is unreadable for a young child (owner request
    // 2026-11-26). `_updateInteractablePrompts` drives the visibility, using
    // a slightly wider radius than the interact prompt so the name arrives
    // first and the child knows what they are walking up to.
    const nameLabel = showNameLabel
      ? this.add.text(x, y + 24, label, {
        fontSize: '11px', fontFamily: 'sans-serif', color: '#374151',
        fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(4).setVisible(false)
      : null;

    // Prompt (hidden by default)
    const prompt = this.add.text(x, y - 24, '💬 Interact', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#ffffff',
      backgroundColor: '#1e293b', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5).setVisible(false);

    const interactable = {
      x,
      y,
      radius,
      label,
      grantsItems: config.grantsItems || [],
      metadata: config.metadata || {},
      onInteract,
      text,
      nameLabel,
      prompt,
      _nearby: false,
      _distanceToPlayer: Infinity,
    };
    this._interactables.push(interactable);
    return interactable;
  }

  /**
   * Remove an interactable and its on-screen parts.
   *
   * Used when a hotspot is spent — a solved puzzle, for instance — so the
   * prompt stops inviting a press that no longer does anything.
   */
  removeInteractable(interactable) {
    if (!interactable) return;
    const at = this._interactables.indexOf(interactable);
    if (at !== -1) this._interactables.splice(at, 1);
    interactable.prompt?.destroy?.();
    interactable.nameLabel?.destroy?.();
    interactable.text?.destroy?.();
  }

  // ---------------------------------------------------------------------------
  // Internal logic
  // ---------------------------------------------------------------------------

  _resolveSpawnName(state) {
    // If the player was in this scene, use their saved position
    if (state?.player?.scene === this.getSceneKey()) return null;
    // Otherwise try to figure out where they came from
    return 'default';
  }

  _handleActionKey() {
    const priorityProp = this._getQuestPriorityInteractable();
    if (priorityProp) {
      priorityProp.onInteract();
      return true;
    }

    // Try NPCs first
    for (const npc of Object.values(this._npcs)) {
      if (npc.isNearby()) {
        npc.onInteract();
        return true;
      }
    }
    // Then interactable props — BEFORE the companion.
    //
    // Lina follows Zuzu everywhere, so with her in range she used to swallow
    // every E press: standing at the wilted plant and pressing E replied
    // "Marhaba! That's the one Mariam taught us" instead of using the fruit.
    // A thing you walked up to beats a friend who walked up to you; she is
    // still one press away as soon as you step off the prop.
    const nearestProp = this._getNearbyInteractables()[0];
    if (nearestProp) {
      nearestProp.onInteract();
      return true;
    }

    // Then a companion standing next to you
    for (const companion of this._companions || []) {
      if (companion.isNearby()) {
        companion.interact();
        return true;
      }
    }
    return false;
  }

  _handlePointerInteract(pointer) {
    const priorityProp = this._getQuestPriorityInteractable();
    if (priorityProp) {
      const dx = pointer.worldX - priorityProp.x;
      const dy = pointer.worldY - priorityProp.y;
      if (Math.sqrt(dx * dx + dy * dy) < priorityProp.radius && priorityProp._nearby) {
        priorityProp.onInteract();
        return;
      }
    }

    // NPCs
    for (const npc of Object.values(this._npcs)) {
      const dx = pointer.worldX - npc.circle.x;
      const dy = pointer.worldY - npc.circle.y;
      if (Math.sqrt(dx * dx + dy * dy) < 70 && npc.isNearby()) {
        npc.onInteract();
        return;
      }
    }
    // Interactable props
    for (const prop of this._getNearbyInteractables()) {
      const dx = pointer.worldX - prop.x;
      const dy = pointer.worldY - prop.y;
      if (Math.sqrt(dx * dx + dy * dy) < prop.radius && prop._nearby) {
        prop.onInteract();
        return;
      }
    }
  }

  _getNearbyInteractables() {
    return this._interactables
      .filter((prop) => prop._nearby)
      .sort((a, b) => a._distanceToPlayer - b._distanceToPlayer);
  }

  _getQuestPriorityInteractable() {
    const state = this.registry.get('gameState');
    const step = getCurrentStep(state);
    if (step?.type === 'observe' && step.requiredObservation) {
      return this._interactables
        .filter((prop) =>
          prop.metadata?.questObservation === step.requiredObservation
          && prop._distanceToPlayer < prop.radius + 80,
        )
        .sort((a, b) => a._distanceToPlayer - b._distanceToPlayer)[0] || null;
    }

    if (step?.type !== 'forage' || !step.requiredItem) return null;

    return this._interactables
      .filter((prop) =>
        prop.grantsItems?.includes(step.requiredItem)
        && prop._distanceToPlayer < prop.radius + 80,
      )
      .sort((a, b) => a._distanceToPlayer - b._distanceToPlayer)[0] || null;
  }

  _updateInteractablePrompts() {
    if (!this.player) return;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const prop of this._interactables) {
      const dx = px - prop.x;
      const dy = py - prop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      prop._nearby = dist < prop.radius;
      prop._distanceToPlayer = dist;
      prop.prompt.setVisible(prop._nearby);
      // The name shows a little before the prompt does, and only if the
      // prop actually has a name.
      if (prop.nameLabel) {
        prop.nameLabel.setVisible(Boolean(prop.label) && dist < prop.radius + NAME_LABEL_LEAD_PX);
      }
    }
  }

  /**
   * Render a biome-themed frame + vignette over the viewport area outside
   * the world bounds. Only visible when the window is larger than the
   * world (the same condition that triggers camera centering). Idempotent:
   * destroys the previous frame on each call so resize handlers can simply
   * call this without leaking Graphics objects.
   *
   * Layout:
   *   - 4 biome-fill rects in the empty bands around the world.
   *   - 1 accent line at each world edge (subtle parchment-like border).
   *   - 4 trapezoidal vignette gradients over the full viewport.
   *
   * All graphics are pinned via setScrollFactor(0) and rendered at depth
   * 2000 (above scene content but below React-side HUD overlays which are
   * outside the canvas entirely). Input passes through (Graphics has no
   * default hit area).
   */
  /**
   * Outline the room, and nothing else.
   *
   * This used to paint biome-coloured letterbox bands and a vignette with
   * `setScrollFactor(0)`, on the assumption that scroll-factor-0 means screen
   * coordinates. It does not: Phaser still scales those objects by the camera
   * zoom, about the viewport centre. Above zoom 1 the bands drifted outward
   * harmlessly, but a phone fits a 1000px room into 390px — zoom 0.39 — and
   * the bands shrank inward into a solid block over the middle of the room,
   * hiding Zuzu, Mrs. Ramirez and the whole street centre. Unplayable.
   *
   * The bands are gone. `_fitLocalCamera` sets the camera's own background to
   * the biome colour, which fills every uncovered pixel correctly at any zoom
   * and needs no geometry at all. What is left is a one-pixel accent edge
   * drawn in WORLD space, so it scales with the room the way everything else
   * in the scene does.
   * @private
   */
  _renderViewportFrame() {
    if (!this.cameras?.main) return;
    const world = this.getWorldSize();

    if (this._viewportFrame) {
      this._viewportFrame.destroy();
      this._viewportFrame = null;
    }
    if (this._viewportVignette) {
      this._viewportVignette.destroy();
      this._viewportVignette = null;
    }

    const biome = SCENE_BIOMES[this.getSceneKey()] || DEFAULT_BIOME;

    // World-space edge: scrollFactor stays 1, so zoom moves it with the room.
    const frame = this.add.graphics();
    frame.setDepth(2000);
    frame.lineStyle(2, biome.accent, 0.85);
    frame.strokeRect(-1, -1, world.width + 2, world.height + 2);
    this._viewportFrame = frame;
  }

  /**
   * Follow Zuzu on axes that are tighter than the room, and center the room
   * on axes where the window is taller or wider. Keeps a phone from pinning
   * the garage to the top of a tall screen.
   */
  /**
   * Scroll the camera for the current fit.
   *
   * The room always fills the screen width, so this is mostly about the
   * vertical axis: follow Zuzu when the room is taller than the view, centre
   * it when it is not. Falls back to the room centre before the player
   * exists (a resize can land during `createWorld`).
   * @private
   */
  _frameFollowCamera() {
    const cam = this.cameras?.main;
    if (!cam || !this._cameraFit) return;
    const world = this.getWorldSize();
    const sprite = this.player?.sprite;
    const { centerX, centerY } = localCameraCenter({
      fit: this._cameraFit,
      worldWidth: world.width,
      worldHeight: world.height,
      focusX: sprite?.x ?? world.width / 2,
      focusY: sprite?.y ?? world.height / 2,
    });
    // centerOn, not setScroll — see localCameraCenter for why.
    cam.centerOn(centerX, centerY);
  }

  /**
   * Frame the room for the current viewport. Wired to `scale.resize` so a
   * phone rotation or a devtools dock does not leave the garage cropped.
   */
  /**
   * Size the camera to the room.
   *
   * One rule: fill the screen width (see `utils/localCameraFit.js`). The old
   * contain-fit left side bands on every landscape window and cropped the
   * room on phones, which is what the owner asked to have fixed.
   * @private
   */
  _fitLocalCamera() {
    const cam = this.cameras?.main;
    if (!cam) return;
    const world = this.getWorldSize();

    const fit = localCameraFit({
      camWidth: cam.width,
      camHeight: cam.height,
      worldWidth: world.width,
      worldHeight: world.height,
      mode: this.getCameraFitMode?.() || 'cover',
    });
    this._cameraFit = fit;
    // `follow` means the update loop keeps re-framing as Zuzu walks.
    this._cameraMode = fit.followY ? 'follow' : 'fit';

    // Safety net: paint the camera's own background in this scene's biome
    // colour. Anything the room does not cover then reads as a themed
    // letterbox instead of the renderer's raw dark grey. The band graphics
    // below still draw the accent edge; this just means a child never sees
    // bare #333 if the drawn area and the camera ever disagree about size.
    const biome = SCENE_BIOMES[this.getSceneKey()] || DEFAULT_BIOME;
    cam.setBackgroundColor(biome.fill);

    cam.stopFollow();
    if (cam.useBounds) cam.removeBounds();
    cam.setZoom(fit.zoom);
    this._frameFollowCamera();
    this._renderViewportFrame();
  }

  _savePosition(pos) {
    const state = this.registry.get('gameState');
    if (!state) return;
    const updated = {
      ...state,
      player: { x: Math.round(pos.x), y: Math.round(pos.y), scene: this.getSceneKey() },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);
  }
}
