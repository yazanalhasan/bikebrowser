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
import { getPhysicsState, wireCameraToMCP } from '../systems/physicsbridge.js';

// Default world size for local scenes (viewport-scale, not overworld-scale)
const DEFAULT_WORLD = { width: 800, height: 600 };

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
      cam.setBounds(0, 0, world.width, world.height);
      cam.startFollow(this.player.sprite, true, 0.1, 0.1);
      cam.setDeadzone(60, 40);
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

    const interactable = { x, y, radius, onInteract, text, nameLabel, prompt, _nearby: false };
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
    // Try NPCs first
    for (const npc of Object.values(this._npcs)) {
      if (npc.isNearby()) {
        npc.onInteract();
        return;
      }
    }
    // Then interactable props
    for (const prop of this._interactables) {
      if (prop._nearby) {
        prop.onInteract();
        return;
      }
    }
  }

  _handlePointerInteract(pointer) {
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
    for (const prop of this._interactables) {
      const dx = pointer.worldX - prop.x;
      const dy = pointer.worldY - prop.y;
      if (Math.sqrt(dx * dx + dy * dy) < prop.radius && prop._nearby) {
        prop.onInteract();
        return;
      }
    }
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
      prop.prompt.setVisible(prop._nearby);
    }
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
