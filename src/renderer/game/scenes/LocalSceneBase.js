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
import { getPhysicsState, wireCameraToMCP } from '../systems/physicsbridge.js';

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

export default class LocalSceneBase extends Phaser.Scene {
  constructor(sceneKey) {
    super({ key: sceneKey });
    this._sceneKey = sceneKey;
  }

  // ---------------------------------------------------------------------------
  // Override points
  // ---------------------------------------------------------------------------

  /** Override to define the scene key. */
  getSceneKey() { return this._sceneKey; }

  /** Override to set world size. Larger = scrollable with camera. */
  getWorldSize() { return DEFAULT_WORLD; }

  /** Override to build the scene's visual world. Called after base setup. */
  createWorld() { /* subclass implements */ }

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

    state = result.state;
    this.registry.set('gameState', state);
    saveGame(state);

    const nextStep = getCurrentStep(state);
    if (!nextStep) {
      // Quest completed
      audioMgr?.playStinger?.('reward_stinger');
      if (typeof this._showRewardCelebration === 'function') {
        this._showRewardCelebration(state);
      }
    } else {
      audioMgr?.playSfx?.('ui_success');
    }
    // Close current dialog regardless — the next step's dialog will be
    // emitted by whichever interaction the player triggers next (NPC,
    // prop, scene transition).
    if (nextStep?.type === 'quiz') {
      const text = nextStep.templateVars
        ? interpolateStepText(nextStep.text, nextStep.templateVars, state)
        : nextStep.text;
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu (thinking)',
        text,
        choices: nextStep.choices || null,
        step: nextStep,
        questId: state?.activeQuest?.id,
      });
    } else {
      this.registry.set('dialogEvent', null);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  create() {
    this._transitioning = false;
    this._npcs = {};
    this._exits = [];
    this._interactables = [];

    const state = this.registry.get('gameState');
    const sceneKey = this.getSceneKey();
    const world = this.getWorldSize();

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
    const cam = this.cameras.main;
    if (world.width > cam.width || world.height > cam.height) {
      // World is larger than viewport: bound the camera and follow the player.
      cam.setBounds(0, 0, world.width, world.height);
      cam.startFollow(this.player.sprite, true, 0.1, 0.1);
      cam.setDeadzone(60, 40);
    } else {
      // World FITS inside the viewport (small scene + larger window). Without
      // this branch the camera stays at scroll (0,0) and the world content
      // renders in the canvas top-left with empty space to the right/bottom.
      // Center the camera on the world's center so the scene appears centered
      // in the viewport.
      cam.centerOn(world.width / 2, world.height / 2);

      // Fill the empty space around the world with a biome-themed frame
      // and overlay a soft vignette so the surround reads as intentional
      // rather than uninitialized.
      this._renderViewportFrame();

      // Re-center + redraw frame on every viewport resize so the scene stays
      // visually intact when the window is resized after scene boot. Cleaned
      // up on scene shutdown so HMR + scene-stop don't leak listeners on the
      // global Scale manager.
      this.scale.on('resize', this._recenterCameraOnWorld, this);
      this.scale.on('resize', this._renderViewportFrame, this);
      this.events.once('shutdown', () => {
        this.scale.off('resize', this._recenterCameraOnWorld, this);
        this.scale.off('resize', this._renderViewportFrame, this);
      });
    }
    cam.fadeIn(350, 0, 0, 0);

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

    // Update NPCs
    Object.values(this._npcs).forEach(npc => npc.update(this.player.sprite));

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
   * Add a visible wall with color.
   */
  addVisibleWall(x, y, w, h, color, strokeColor) {
    const wall = this.add.rectangle(x, y, w, h, color);
    if (strokeColor) wall.setStrokeStyle(2, strokeColor);
    this.physics.add.existing(wall, true);
    if (!this._collisionBodies) this._collisionBodies = [];
    this._collisionBodies.push(wall);
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
   * @param {object} config
   * @param {number} config.x
   * @param {number} config.y
   * @param {string} config.label — display name
   * @param {string} config.icon — emoji
   * @param {number} [config.radius=60] — interaction radius
   * @param {function} config.onInteract — called when player interacts
   */
  addInteractable(config) {
    const { x, y, label, icon, radius = 60, onInteract } = config;

    const text = this.add.text(x, y, icon, { fontSize: '28px' }).setOrigin(0.5).setDepth(4);
    const nameLabel = this.add.text(x, y + 24, label, {
      fontSize: '11px', fontFamily: 'sans-serif', color: '#374151',
      fontStyle: 'bold', stroke: '#ffffff', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);

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
      return;
    }

    // Try NPCs first
    for (const npc of Object.values(this._npcs)) {
      if (npc.isNearby()) {
        npc.onInteract();
        return;
      }
    }
    // Then interactable props
    const nearestProp = this._getNearbyInteractables()[0];
    if (nearestProp) {
      nearestProp.onInteract();
      return;
    }
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
  _renderViewportFrame() {
    if (!this.cameras?.main) return;
    const world = this.getWorldSize();
    const cam = this.cameras.main;

    // Tear down any previous frame from a prior resize.
    if (this._viewportFrame) {
      this._viewportFrame.destroy();
      this._viewportFrame = null;
    }
    if (this._viewportVignette) {
      this._viewportVignette.destroy();
      this._viewportVignette = null;
    }

    // Bail if the world fully covers the viewport — no empty space to fill.
    if (cam.width <= world.width && cam.height <= world.height) return;

    const sceneKey = this.getSceneKey();
    const biome = SCENE_BIOMES[sceneKey] || DEFAULT_BIOME;

    // Empty-band positions in screen-space. Camera is centered on world
    // center, so world covers the rect (offsetX, offsetY)-(offsetX+W, offsetY+H).
    const offsetX = Math.max(0, (cam.width  - world.width)  / 2);
    const offsetY = Math.max(0, (cam.height - world.height) / 2);

    // ── Biome fill bands ──────────────────────────────────────────────────
    const frame = this.add.graphics();
    frame.setScrollFactor(0);
    frame.setDepth(2000);
    frame.fillStyle(biome.fill, 1.0);
    if (offsetX > 0) {
      frame.fillRect(0, 0, offsetX, cam.height);                              // left
      frame.fillRect(cam.width - offsetX, 0, offsetX, cam.height);            // right
    }
    if (offsetY > 0) {
      frame.fillRect(offsetX, 0, world.width, offsetY);                       // top
      frame.fillRect(offsetX, cam.height - offsetY, world.width, offsetY);    // bottom
    }
    // Accent line just outside the world edges — a thin biome-accent stroke
    // that visually frames the playable area.
    frame.lineStyle(2, biome.accent, 0.85);
    frame.strokeRect(offsetX - 1, offsetY - 1, world.width + 2, world.height + 2);
    this._viewportFrame = frame;

    // ── Vignette over the full viewport ───────────────────────────────────
    // Same trapezoid trick as world-map-polish: 4 edge bands with a linear
    // gradient that darkens toward the viewport corners. Subtle (alpha 0.35)
    // so the biome fill still reads.
    const VIG_DEPTH = Math.round(Math.min(cam.width, cam.height) * 0.22);
    const ALPHA_OUTER = 0.35;
    const ALPHA_INNER = 0;
    const vg = this.add.graphics();
    vg.setScrollFactor(0);
    vg.setDepth(2001);
    // TOP
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000,
      ALPHA_OUTER, ALPHA_OUTER, ALPHA_INNER, ALPHA_INNER);
    vg.fillRect(0, 0, cam.width, VIG_DEPTH);
    // BOTTOM
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000,
      ALPHA_INNER, ALPHA_INNER, ALPHA_OUTER, ALPHA_OUTER);
    vg.fillRect(0, cam.height - VIG_DEPTH, cam.width, VIG_DEPTH);
    // LEFT
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000,
      ALPHA_OUTER, ALPHA_INNER, ALPHA_OUTER, ALPHA_INNER);
    vg.fillRect(0, 0, VIG_DEPTH, cam.height);
    // RIGHT
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000,
      ALPHA_INNER, ALPHA_OUTER, ALPHA_INNER, ALPHA_OUTER);
    vg.fillRect(cam.width - VIG_DEPTH, 0, VIG_DEPTH, cam.height);
    this._viewportVignette = vg;
  }

  /**
   * Re-center the camera on the world's center. Used by the world-fits-in-
   * viewport path so the scene stays visually centered if the window is
   * resized AFTER scene boot. Wired as a `scale.resize` listener inside
   * create(); removed on scene shutdown to avoid leaks across HMR/scene
   * restarts.
   */
  _recenterCameraOnWorld() {
    if (!this.cameras?.main) return;
    const world = this.getWorldSize();
    const cam = this.cameras.main;
    if (world.width > cam.width || world.height > cam.height) {
      // Window has shrunk below world size — bound + follow if not already
      if (!cam.useBounds) {
        cam.setBounds(0, 0, world.width, world.height);
        if (this.player?.sprite) {
          cam.startFollow(this.player.sprite, true, 0.1, 0.1);
          cam.setDeadzone(60, 40);
        }
      }
      return;
    }
    cam.centerOn(world.width / 2, world.height / 2);
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
