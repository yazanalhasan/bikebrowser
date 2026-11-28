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
import { ART } from '../../../game/assets/act1ArtRegistry.js';
import { addArt } from '../../../game/assets/act1Art.js';
import { preloadGameAssets } from '../../../game/assets/preloadGameAssets.js';
import {
  WORLD_SIGN_ART_DEPTH, WORLD_SIGN_DEPTH, HUD_RAIL_WIDTH, underHudRail,
} from '../systems/labelLayout.js';

const SCENE_KEY = 'OverworldScene';

// The Sonoran tileset frames used to lay the overworld ground.
const SONORAN_TILES = 'sonoran_tiles';
const TILE = { grass: 1, road: 2, kerb: 4, sand: 6 };
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
    // Act 1 art: marker icons, props and the Sonoran tileset that builds the
    // neighborhood ground below.
    preloadGameAssets(this);
  }

  /**
   * Lay the overworld ground from the Sonoran tileset: sand base, grass
   * blocks, then the road cross with concrete kerbs. Tile indices are the
   * tileset's own frames (0/1 grass, 2 road, 4 kerb, 6 sand).
   * @private
   */
  _buildGround() {
    const L = this.layout;
    const tile = (frame, x, y, w, h, depth) => {
      if (!this.textures.exists(SONORAN_TILES)) return null;
      return this.add.tileSprite(x, y, w, h, SONORAN_TILES, frame)
        .setOrigin(0, 0)
        .setDepth(depth);
    };

    const base = L.ground_desert_margin;
    tile(TILE.sand, base.x, base.y, base.w, base.h, 0);
    for (const b of L.ground_grass_blocks || []) {
      tile(TILE.grass, b.x, b.y, b.w, b.h, 1);
    }
    for (const s of L.sidewalks || []) {
      tile(TILE.kerb, s.x, s.y, s.w, s.h, 2);
    }
    const rv = L.road_vertical;
    const rh = L.road_horizontal;
    tile(TILE.road, rv.x, rv.y, rv.w, rv.h, 3);
    tile(TILE.road, rh.x, rh.y, rh.w, rh.h, 3);
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
    // Built from the 8-tile Sonoran tileset rather than a single painted
    // plate: `neighborhood_world_v1.png` was never in the repo, so this used
    // to render as a missing texture. Geometry lives in the layout JSON.
    this._buildGround();

    // --- Location markers ---
    this._locationMarkers = [];
    const localScenes = getLocalScenes();

    for (const sceneDef of localScenes) {
      if (!sceneDef.worldPos) continue;
      const { x, y } = sceneDef.worldPos;
      const unlocked = isSceneUnlocked(sceneDef.key, state);

      // Marker circle
      const markerColor = unlocked ? 0xfbbf24 : 0x6b7280;
      // The whole pin — ring, icon, name, prompt — rides in the sign
      // band. The child walks this map, and at depth 10-12 they stood on
      // top of the place they were trying to read (plan 0.12).
      const marker = this.add.circle(x, y, this.layout.marker_circle.r, markerColor, 0.7)
        .setStrokeStyle(this.layout.marker_circle.stroke_width, unlocked ? 0xf59e0b : 0x4b5563)
        .setDepth(WORLD_SIGN_ART_DEPTH);

      // Icon — painted marker art; the lock is art too when the scene is shut.
      const iconKey = unlocked ? sceneDef.iconArt : ART.map_lock;
      const icon = addArt(this, iconKey, x, y, {
        anchor: 'icon', maxPx: 30, depth: WORLD_SIGN_ART_DEPTH + 1,
      });

      // Name label
      const label = this.add.text(x, y + this.layout.marker_label.y_offset, sceneDef.name, {
        fontSize: '12px', fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: unlocked ? '#78350f' : '#6b7280',
        stroke: '#ffffff', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(WORLD_SIGN_DEPTH);

      // Enter prompt (hidden) OR lock hint
      let prompt;
      if (unlocked) {
        prompt = this.add.text(x, y + this.layout.marker_prompt.y_offset, '⬆ Enter', {
          fontSize: '13px', fontFamily: 'sans-serif',
          fontStyle: 'bold', color: '#ffffff',
          backgroundColor: '#1e40af',
          padding: { x: 6, y: 3 },
        }).setOrigin(0.5).setDepth(WORLD_SIGN_DEPTH + 1).setVisible(false);
      } else {
        // Show lock requirements
        const progress = getUnlockProgress(sceneDef.key, state);
        prompt = this.add.text(x, y + this.layout.marker_prompt.y_offset, progress.hint, {
          fontSize: '10px', fontFamily: 'sans-serif',
          color: '#ffffff',
          backgroundColor: '#6b7280',
          padding: { x: 4, y: 2 },
          wordWrap: { width: 160 },
        }).setOrigin(0.5).setDepth(WORLD_SIGN_DEPTH + 1).setVisible(false);

        // Progress bar under locked marker
        if (progress.progress > 0 && progress.progress < 1) {
          const barW = this.layout.progress_bar.w;
          this.add.rectangle(x, y + this.layout.progress_bar.y_offset, barW, this.layout.progress_bar.h, 0x4b5563).setDepth(WORLD_SIGN_ART_DEPTH + 1);
          this.add.rectangle(x - barW / 2 + (barW * progress.progress) / 2, y + this.layout.progress_bar.y_offset, barW * progress.progress, this.layout.progress_bar.h, 0xfbbf24).setOrigin(0, 0.5).setDepth(WORLD_SIGN_ART_DEPTH + 2);
        }
      }

      // Quest indicator
      const hasQuest = this._hasQuestAt(sceneDef.key, state);
      let questMarker = null;
      if (hasQuest && unlocked) {
        questMarker = addArt(
          this, ART.ui_exclaim,
          x + this.layout.marker_quest_indicator.x_offset,
          y + this.layout.marker_quest_indicator.y_offset,
          { anchor: 'icon', maxPx: 24, depth: 12 },
        );
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

  /**
   * Keep every pin's name out from under the HUD rail.
   *
   * The map is 1536 wide in a 1280 camera, so it scrolls: a pin that
   * reads fine in one position slides under the rail's icons in
   * another, and "Sports Fields" was 42% hidden at the default spawn.
   * Depth cannot fix it — the rail is DOM, above the whole canvas — so
   * the label moves instead, from under its pin to the pin's left,
   * which is the same yielding rule name tags already follow.
   */
  _dodgeHudRail() {
    const cam = this.cameras.main;
    for (const loc of this._locationMarkers) {
      for (const text of [loc.label, loc.prompt]) {
        if (!text?.visible) continue;
        const home = text.getData('homeX') ?? text.x;
        if (text.getData('homeX') == null) text.setData('homeX', home);

        const halfW = text.displayWidth / 2;
        const ox = cam.width / 2;
        const screenRight = (home + halfW - cam.scrollX - ox) * cam.zoom + ox;
        if (underHudRail(screenRight, cam.width)) {
          // Clamp in SCREEN space, not relative to the pin: when the pin
          // itself is under the rail, nudging the label a few pixels to
          // its left leaves it under the rail too. This puts the label's
          // right edge just clear of the rail wherever the map has
          // scrolled to.
          const limit = cam.width - HUD_RAIL_WIDTH - 4;
          const worldRight = (limit - ox) / cam.zoom + cam.scrollX + ox;
          text.setX(worldRight - halfW);
        } else {
          text.setX(home);
        }
      }
    }
  }

  _updateMarkerProximity() {
    this._dodgeHudRail();
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
      return true;
    }
    return false;
  }

  _handleActionKey() {
    return this._enterNearestLocation();
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
      // No legacy keys here: loadGame rewrites a retired scene key
      // before the game boots, so `prev` is always a live scene.
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
