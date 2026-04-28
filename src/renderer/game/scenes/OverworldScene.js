/**
 * OverworldScene — macro navigation map.
 *
 * Purpose:
 *   - See the whole neighborhood from above
 *   - Travel between locations
 *   - View quest markers and objectives
 *   - See which areas are locked/unlocked
 *
 * This is NOT the main gameplay scene. Players spend short periods
 * here before entering local playable scenes.
 *
 * Locations appear as interactive markers. Walking near one and
 * pressing action (or tapping) enters that local scene.
 */

import Phaser from 'phaser';
import Player from '../entities/Player.js';
import { saveGame } from '../systems/saveSystem.js';
import { transitionTo } from '../systems/sceneTransition.js';
import { getLocalScenes, isSceneUnlocked, getSpawn } from '../systems/sceneRegistry.js';
import {
  WORLD, BOUNDARY_PADDING, CAMERA, remapLegacyPosition,
} from '../data/neighborhoodLayout.js';
import MCPSystem from '../systems/MCPSystem.js';
import { getUnlockProgress } from '../systems/sceneRegistry.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { loadLayout } from '../utils/loadLayout.js';

const SCENE_KEY = 'OverworldScene';
const ENTER_RADIUS = 70; // how close player must be to enter a location

export default class OverworldScene extends Phaser.Scene {
  static layoutEditorConfig = {
    layoutAssetKey: 'overworldLayout',
    layoutPath: 'layouts/overworld.layout.json',
  };

  constructor() {
    super({ key: SCENE_KEY });
  }

  preload() {
    this.load.json('overworldLayout', 'layouts/overworld.layout.json');
    if (!this.textures.exists(WORLD.mapAsset)) {
      this.load.image(WORLD.mapAsset, WORLD.mapPath);
    }
  }

  create() {
    this.layout = loadLayout(this, 'overworldLayout');
    this._transitioning = false;
    const state = this.registry.get('gameState');

    // --- Physics world bounds ---
    this.physics.world.setBounds(
      BOUNDARY_PADDING.left,
      BOUNDARY_PADDING.top,
      WORLD.width - BOUNDARY_PADDING.left - BOUNDARY_PADDING.right,
      WORLD.height - BOUNDARY_PADDING.top - BOUNDARY_PADDING.bottom,
    );

    // --- World map ---
    this.add.image(WORLD.width / 2, WORLD.height / 2, WORLD.mapAsset)
      .setDisplaySize(WORLD.width, WORLD.height)
      .setDepth(0);

    // --- Location markers ---
    this._locationMarkers = [];
    const localScenes = getLocalScenes();

    for (const sceneDef of localScenes) {
      if (!sceneDef.worldPos) continue;
      const { x, y } = sceneDef.worldPos;
      const unlocked = isSceneUnlocked(sceneDef.key, state);

      // Marker circle
      const markerColor = unlocked ? 0xfbbf24 : 0x6b7280;
      const marker = this.add.circle(x, y, this.layout.marker_circle.r, markerColor, 0.7)
        .setStrokeStyle(this.layout.marker_circle.stroke_width, unlocked ? 0xf59e0b : 0x4b5563)
        .setDepth(10);

      // Icon
      const icon = this.add.text(x, y, unlocked ? sceneDef.icon : '🔒', {
        fontSize: '18px',
      }).setOrigin(0.5).setDepth(11);

      // Name label
      const label = this.add.text(x, y + this.layout.marker_label.y_offset, sceneDef.name, {
        fontSize: '12px', fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: unlocked ? '#78350f' : '#6b7280',
        stroke: '#ffffff', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(11);

      // Enter prompt (hidden) OR lock hint
      let prompt;
      if (unlocked) {
        prompt = this.add.text(x, y + this.layout.marker_prompt.y_offset, '⬆ Enter', {
          fontSize: '13px', fontFamily: 'sans-serif',
          fontStyle: 'bold', color: '#ffffff',
          backgroundColor: '#1e40af',
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5).setDepth(12).setVisible(false);
      } else {
        // Show lock requirements
        const progress = getUnlockProgress(sceneDef.key, state);
        prompt = this.add.text(x, y + this.layout.marker_prompt.y_offset, `🔒 ${progress.hint}`, {
          fontSize: '10px', fontFamily: 'sans-serif',
          color: '#ffffff',
          backgroundColor: '#6b7280',
          padding: { x: 4, y: 2 },
          wordWrap: { width: 160 },
        }).setOrigin(0.5).setDepth(12).setVisible(false);

        // Progress bar under locked marker
        if (progress.progress > 0 && progress.progress < 1) {
          const barW = this.layout.progress_bar.w;
          this.add.rectangle(x, y + this.layout.progress_bar.y_offset, barW, this.layout.progress_bar.h, 0x4b5563).setDepth(11);
          this.add.rectangle(x - barW / 2 + (barW * progress.progress) / 2, y + this.layout.progress_bar.y_offset, barW * progress.progress, this.layout.progress_bar.h, 0xfbbf24).setOrigin(0, 0.5).setDepth(12);
        }
      }

      // Quest indicator
      const hasQuest = this._hasQuestAt(sceneDef.key, state);
      let questMarker = null;
      if (hasQuest && unlocked) {
        questMarker = this.add.text(x + this.layout.marker_quest_indicator.x_offset, y + this.layout.marker_quest_indicator.y_offset, '❗', {
          fontSize: '16px',
        }).setOrigin(0.5).setDepth(12);
      }

      this._locationMarkers.push({
        sceneDef, x, y, unlocked, marker, icon, label, prompt, questMarker,
      });
    }

    // --- Player ---
    let spawnX, spawnY;
    if (state?.player?.scene === SCENE_KEY) {
      const remapped = remapLegacyPosition(state.player);
      spawnX = remapped.x;
      spawnY = remapped.y;
    } else {
      // Try to find a named spawn based on where the player came from
      const spawn = getSpawn(SCENE_KEY, this._resolveSpawnName(state));
      spawnX = spawn.x;
      spawnY = spawn.y;
    }

    this.player = new Player(this, spawnX, spawnY);

    // --- Camera ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD.width, WORLD.height);
    cam.startFollow(this.player.sprite, true, CAMERA.lerpX, CAMERA.lerpY);
    cam.setDeadzone(CAMERA.deadzoneWidth, CAMERA.deadzoneHeight);
    cam.fadeIn(350, 0, 0, 0);

    // --- Input ---
    this.actionKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.input.on('pointerdown', (pointer) => {
      this._handlePointerDown(pointer);
    });

    // --- Audio ---
    const audioMgr = this.registry.get('audioManager');
    if (audioMgr) audioMgr.transitionToScene(SCENE_KEY);

    // --- Scene label ---
    this.add.text(this.layout.map_label.x, this.layout.map_label.y, '🗺️ Neighborhood Map', {
      fontSize: '16px', fontFamily: 'sans-serif', color: '#78350f',
      fontStyle: 'bold', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);

    // --- MCP ---
    this.mcp = new MCPSystem(this);
    this.mcp.init({ sceneKey: SCENE_KEY });
    this.registry.set('mcp', this.mcp);
    if (typeof window !== 'undefined') window.mcp = this.mcp;
  }

  update(time, delta) {
    if (!this.player) return;
    // Skip the tick if the sprite was torn down by a pause/unmount race.
    if (!this.player.sprite || !this.player.sprite.active || !this.player.sprite.body) return;

    const pos = this.player.update();

    // Update location marker proximity
    this._updateMarkerProximity();

    // Action key → enter nearest location
    if (Phaser.Input.Keyboard.JustDown(this.actionKey)) {
      this._handleActionKey();
    }

    // MCP tick
    if (this.mcp) this.mcp.update(delta, time);

    // Periodic save
    if (this.game.getFrame() % 120 === 0) {
      this._savePosition(pos);
    }
  }

  // ── Location marker interaction ────────────────────────────────────────────

  _updateMarkerProximity() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const loc of this._locationMarkers) {
      const dx = px - loc.x;
      const dy = py - loc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isNear = dist < ENTER_RADIUS;
      const isNearUnlocked = isNear && loc.unlocked;
      const isNearLocked = isNear && !loc.unlocked;

      loc.prompt.setVisible(isNear);

      // Pulse effect when near
      if (isNearUnlocked) {
        const pulse = 1 + Math.sin(this.time.now * 0.005) * 0.08;
        loc.marker.setScale(pulse);
      } else {
        loc.marker.setScale(1);
      }

      // AI hint when approaching locked region (once per visit)
      if (isNearLocked && !loc._hintedLock) {
        loc._hintedLock = true;
        const mcp = this.registry.get('mcp');
        if (mcp) {
          const progress = getUnlockProgress(loc.sceneDef.key, this.registry.get('gameState'));
          mcp._pushAlert?.('region_locked',
            `${loc.sceneDef.name} is locked. ${progress.hint}`,
            'info');
        }
      }
      if (!isNear) loc._hintedLock = false;
    }
  }

  _enterNearestLocation() {
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    let nearest = null;
    let nearestDist = Infinity;

    for (const loc of this._locationMarkers) {
      if (!loc.unlocked) continue;
      const dx = px - loc.x;
      const dy = py - loc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ENTER_RADIUS && dist < nearestDist) {
        nearest = loc;
        nearestDist = dist;
      }
    }

    if (nearest) {
      transitionTo(this, nearest.sceneDef.key, 'fromOverworld');
    }
  }

  _handleActionKey() {
    this._enterNearestLocation();
  }

  _handlePointerDown(pointer) {
    for (const loc of this._locationMarkers) {
      if (!loc.unlocked) continue;
      const dx = pointer.worldX - loc.x;
      const dy = pointer.worldY - loc.y;
      if (Math.sqrt(dx * dx + dy * dy) < 40) {
        // Check if player is close enough
        const pdx = this.player.sprite.x - loc.x;
        const pdy = this.player.sprite.y - loc.y;
        if (Math.sqrt(pdx * pdx + pdy * pdy) < ENTER_RADIUS) {
          transitionTo(this, loc.sceneDef.key, 'fromOverworld');
        }
        return;
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _hasQuestAt(sceneKey, state) {
    // Check if any active or available quest is tied to a scene's NPCs
    const questMap = {
      StreetBlockScene: ['flat_tire_repair'],
      ZuzuGarageScene: [],
      DogParkScene: [],
    };
    const questIds = questMap[sceneKey] || [];
    for (const qid of questIds) {
      if (state?.activeQuest?.id === qid) return true;
      if (!state?.completedQuests?.includes(qid)) return true;
    }
    return false;
  }

  _resolveSpawnName(state) {
    const prev = state?.player?.scene;
    if (!prev || prev === SCENE_KEY) return 'default';
    // Map previous scene to a spawn name
    const spawnMap = {
      ZuzuGarageScene: 'fromGarage',
      StreetBlockScene: 'fromStreet',
      DogParkScene: 'fromDogPark',
      LakeEdgeScene: 'fromLakeEdge',
      SportsFieldsScene: 'fromSportsFields',
      CommunityPoolScene: 'fromCommunityPool',
      DesertTrailScene: 'fromDesertTrail',
      MountainScene: 'fromMountain',
      // Legacy scene names
      GarageScene: 'fromGarage',
      NeighborhoodScene: 'default',
    };
    return spawnMap[prev] || 'default';
  }

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
}

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr('OverworldScene', import.meta.hot, OverworldScene);
