/**
 * WorldMapScene — Quest for Glory-style navigable world map.
 *
 * Shows regions as clusters of location nodes. Player selects a location
 * and travels to the corresponding sub-scene.
 *
 * Access: via "Bike GPS" interactable in StreetBlockScene or OverworldScene.
 * Return: sub-scenes exit back here, or directly to the neighborhood.
 *
 * This is a UI-driven map, not a free-roaming overworld.
 */

import Phaser from 'phaser';
import { saveGame } from '../systems/saveSystem.js';
import { WORLD_LOCATIONS, REGIONS, isLocationUnlocked, getLocationsByRegion } from '../data/worldMapData.js';
import { getSideQuestStatus } from '../systems/sideQuestSystem.js';
import { setBusy } from '../systems/gameplayArbiter.js';
import { BIOME } from '../data/regions.js';

const SCENE_KEY = 'WorldMapScene';

// ── Terrain palette ─────────────────────────────────────────────────────────
// Warm palette from the rebuild blueprint. Hex literals are used because
// Phaser Graphics fillStyle expects 0xRRGGBB integers.
const BIOME_COLORS = Object.freeze({
  [BIOME.DESERT]:    0xf0d18a, // sand
  [BIOME.GRASSLAND]: 0x4f7a52, // warm green
  [BIOME.WATER]:     0x2b5f91, // deep blue
  [BIOME.ROCK]:      0x7a6a5a, // warm gray
  [BIOME.MOUNTAIN]:  0x5a5560, // cool gray
  [BIOME.URBAN]:     0xb8a07a, // warm tan / dirt
  [BIOME.UNKNOWN]:   0x1a1a2e, // dark void (matches existing background)
});

// Mapping of worldMapData REGIONS ids → biome enum. The richer biome data
// in regions.js uses different ids (arizona, andes, …); this map bridges the
// two so the local world-map regions can paint terrain. Defaults to DESERT
// for the Sonoran setting, MOUNTAIN for the Superstition placeholder.
const WORLD_REGION_BIOME = Object.freeze({
  arizona_desert: BIOME.DESERT,
  mountain_range: BIOME.MOUNTAIN,
});

function biomeForWorldRegion(regionId) {
  return WORLD_REGION_BIOME[regionId] || BIOME.UNKNOWN;
}

export default class WorldMapScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEY });
  }

  init(data) {
    this._origin = data?.origin || 'OverworldScene';
    this._originSpawn = data?.originSpawn || 'default';
  }

  create() {
    const state = this.registry.get('gameState');
    const { width, height } = this.cameras.main;

    // Suppress global education questions while on world map
    setBusy('inMenu', true);

    // ── Background ──
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d1b0e);

    // Parchment/map overlay
    const mapW = width * 0.88;
    const mapH = height * 0.82;
    const mapX = width / 2;
    const mapY = height / 2 + 10;
    this.add.rectangle(mapX, mapY, mapW, mapH, 0xf5e6c8).setStrokeStyle(3, 0x8b6914);

    // ── Terrain layer ──
    // Painted ONCE at create. Lives strictly beneath paths / nodes / labels
    // so click handlers and hover effects are unaffected. Held in a single
    // container so the fog overlay agent (next pass) can swap or tint without
    // touching unrelated graphics.
    this._renderTerrainLayer({
      padX: width * 0.1,
      padY: height * 0.15,
      usableW: width - width * 0.1 * 2,
      usableH: height - height * 0.15 * 2 - 20,
      mapBounds: { x: mapX, y: mapY, w: mapW, h: mapH },
    });

    // Title
    this.add.text(width / 2, 30, '🗺️  WORLD MAP  🗺️', {
      fontSize: '22px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#5c3d10', stroke: '#f5e6c8', strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Subtitle with region ──
    this.add.text(width / 2, 55, 'Tap a location to travel there', {
      fontSize: '12px', fontFamily: 'sans-serif', color: '#8b6914',
    }).setOrigin(0.5);

    // ── Location Markers ──
    this._markers = [];
    const locations = Object.values(WORLD_LOCATIONS);
    const padX = width * 0.1;
    const padY = height * 0.15;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2 - 20;

    for (const loc of locations) {
      const unlocked = isLocationUnlocked(loc.id, state);
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;

      // Connection lines to neighborhood center
      const centerX = padX + 0.15 * usableW;
      const centerY = padY + 0.2 * usableH + 20;
      const line = this.add.graphics();
      line.lineStyle(2, unlocked ? 0x8b6914 : 0x999999, unlocked ? 0.5 : 0.2);
      line.lineBetween(centerX, centerY, x, y);

      // Node circle
      const color = unlocked ? this._getTypeColor(loc.type) : 0x666666;
      const circle = this.add.circle(x, y, 22, color, unlocked ? 1 : 0.4);
      circle.setStrokeStyle(3, unlocked ? 0xffffff : 0x888888);
      circle.setInteractive({ useHandCursor: unlocked });

      // Icon
      const icon = this.add.text(x, y, unlocked ? loc.icon : '🔒', {
        fontSize: '20px',
      }).setOrigin(0.5);

      // Name label
      const nameLabel = this.add.text(x, y + 32, loc.name, {
        fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
        color: unlocked ? '#3b1e08' : '#888888',
        stroke: '#f5e6c8', strokeThickness: 2,
        align: 'center', wordWrap: { width: 120 },
      }).setOrigin(0.5, 0);

      // Difficulty stars
      if (unlocked) {
        const stars = '⭐'.repeat(loc.difficulty);
        this.add.text(x, y + 48, stars, { fontSize: '10px' }).setOrigin(0.5);
      }

      // Side quest indicators
      if (unlocked) {
        const quests = getSideQuestStatus(loc.id, state);
        const available = quests.filter(q => !q.completed).length;
        const completed = quests.filter(q => q.completed).length;
        if (available > 0) {
          this.add.text(x + 20, y - 20, `📋${available}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#2563eb',
            backgroundColor: '#dbeafe', padding: { x: 2, y: 1 },
          }).setOrigin(0.5);
        }
        if (completed > 0) {
          this.add.text(x - 20, y - 20, `✅${completed}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#16a34a',
          }).setOrigin(0.5);
        }
      }

      // Click handler
      if (unlocked) {
        circle.on('pointerdown', () => this._selectLocation(loc));

        // Hover pulse
        circle.on('pointerover', () => {
          this.tweens.add({ targets: circle, scale: 1.2, duration: 150, ease: 'Back.easeOut' });
        });
        circle.on('pointerout', () => {
          this.tweens.add({ targets: circle, scale: 1, duration: 150 });
        });
      } else {
        // Show unlock hint on tap
        circle.setInteractive({ useHandCursor: false });
        circle.on('pointerdown', () => this._showLockHint(loc, state));
      }

      this._markers.push({ loc, circle, icon, nameLabel });
    }

    // ── Neighborhood marker (home base) ──
    const homeX = padX + 0.15 * usableW;
    const homeY = padY + 0.2 * usableH + 20;
    this.add.circle(homeX, homeY, 18, 0x22c55e).setStrokeStyle(3, 0xffffff);
    this.add.text(homeX, homeY, '🏠', { fontSize: '18px' }).setOrigin(0.5);
    this.add.text(homeX, homeY + 28, 'Neighborhood', {
      fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#166534', stroke: '#f5e6c8', strokeThickness: 2,
    }).setOrigin(0.5, 0);

    // ── Back button ──
    const backBtn = this.add.text(60, height - 35, '← Back to Neighborhood', {
      fontSize: '14px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#ffffff', backgroundColor: '#475569', padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backBtn.on('pointerdown', () => this._returnToNeighborhood());
    backBtn.on('pointerover', () => backBtn.setBackgroundColor('#334155'));
    backBtn.on('pointerout', () => backBtn.setBackgroundColor('#475569'));

    // ── Legend ──
    const legendY = height - 35;
    const legendX = width - 140;
    this.add.text(legendX, legendY, '🟢 Resource  🔵 Material  🟤 Biology', {
      fontSize: '9px', fontFamily: 'sans-serif', color: '#8b6914',
    }).setOrigin(0.5);

    // Fade in
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // Audio — goes through SCENE_MUSIC so the file-backed track for this
    // scene is used (desert_discovery had no real audio file and killed the
    // music every time the player opened the map).
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.transitionToScene('WorldMapScene');
  }

  // ── Terrain rendering ───────────────────────────────────────────────────

  /**
   * Paint biome-colored blobs for every world-map location. Runs once at
   * scene create. The result is added to {@link _terrainContainer} which is
   * inserted at depth 0 so it sits beneath every other display object on the
   * scene (paths, nodes, labels). No per-frame work, no input listeners.
   */
  _renderTerrainLayer({ padX, padY, usableW, usableH, mapBounds }) {
    const container = this.add.container(0, 0);
    // No explicit depth — relying on creation order. The container is added
    // in create() at line ~80, after the parchment rectangle (line ~73) and
    // before the title (line ~89), so it naturally renders above parchment
    // and below all foreground elements (title, paths, nodes, labels, HUD).
    // Setting depth(-100) here previously hid the terrain BEHIND the
    // parchment because parchment is at default depth 0.
    this._terrainContainer = container;

    const g = this.add.graphics();

    // Per-location blob: soft-edged gradient achieved by stacking three
    // translucent fills of decreasing radius. Phaser's Graphics has no real
    // radial gradient, but layered alpha circles read as a soft edge.
    const locations = Object.values(WORLD_LOCATIONS);
    const baseR = Math.max(usableW, usableH) * 0.22; // ~225 px on a 1024 map
    for (const loc of locations) {
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;
      const biome = biomeForWorldRegion(loc.region);
      const color = BIOME_COLORS[biome] ?? BIOME_COLORS[BIOME.UNKNOWN];

      // Soft halo (outer)
      g.fillStyle(color, 0.18);
      g.fillCircle(x, y, baseR);
      // Mid
      g.fillStyle(color, 0.32);
      g.fillCircle(x, y, baseR * 0.72);
      // Core
      g.fillStyle(color, 0.55);
      g.fillCircle(x, y, baseR * 0.45);
    }

    // Desert stipple — a sparse dot pattern on top of the desert blobs adds
    // a touch of texture without per-frame cost. Only desert locations get
    // dots (other biomes read fine flat at this scale).
    g.fillStyle(0xc9a86a, 0.55);
    for (const loc of locations) {
      if (biomeForWorldRegion(loc.region) !== BIOME.DESERT) continue;
      const cx = padX + loc.mapPos.x * usableW;
      const cy = padY + loc.mapPos.y * usableH + 20;
      const stippleR = baseR * 0.6;
      // Deterministic offsets (no RNG so the map is stable across reopens).
      const seeds = [
        [-0.6, -0.3], [0.4, -0.5], [-0.2, 0.55], [0.7, 0.15],
        [0.05, -0.2], [-0.45, 0.2], [0.3, 0.5], [-0.7, -0.6],
        [0.55, -0.1], [-0.1, 0.0], [0.2, -0.7], [-0.55, 0.55],
      ];
      for (const [dx, dy] of seeds) {
        g.fillCircle(cx + dx * stippleR, cy + dy * stippleR, 1.6);
      }
    }

    // Mask the terrain to the parchment rectangle so blobs don't bleed onto
    // the dark border outside the map.
    const mask = this.make.graphics({ x: 0, y: 0, add: false });
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(
      mapBounds.x - mapBounds.w / 2,
      mapBounds.y - mapBounds.h / 2,
      mapBounds.w,
      mapBounds.h,
    );
    g.setMask(mask.createGeometryMask());

    container.add(g);
  }

  // ── Travel to location ──────────────────────────────────────────────────

  _selectLocation(loc) {
    // Check if scene class is registered
    const sceneExists = this.scene.manager.keys[loc.entryScene];
    if (!sceneExists) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `${loc.name} is still being explored... Coming soon!`,
        choices: null, step: null,
      });
      return;
    }

    const state = this.registry.get('gameState');
    const updated = {
      ...state,
      player: { x: 400, y: 400, scene: loc.entryScene },
      worldMap: {
        ...(state.worldMap || {}),
        lastVisited: loc.id,
        visitCount: ((state.worldMap?.visitCount || {})[loc.id] || 0) + 1,
      },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);

    // Play travel SFX
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.playSfx('door_interact');

    // Fade out and transition
    this.cameras.main.fadeOut(400, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) {
        setBusy('inMenu', false);
        this.scene.start(loc.entryScene, {
          origin: SCENE_KEY,
          originSpawn: 'default',
          locationId: loc.id,
        });
      }
    });
  }

  _returnToNeighborhood() {
    const state = this.registry.get('gameState');
    const updated = {
      ...state,
      player: { x: 400, y: 300, scene: this._origin },
    };
    this.registry.set('gameState', updated);
    saveGame(updated);

    setBusy('inMenu', false);

    this.cameras.main.fadeOut(350, 0, 0, 0, (_cam, progress) => {
      if (progress >= 1) {
        this.scene.start(this._origin);
      }
    });
  }

  _showLockHint(loc, state) {
    const req = loc.unlockReq || {};
    const hints = [];
    if (req.reputation) hints.push(`Need ${req.reputation} reputation (you have ${state?.reputation || 0})`);
    if (req.questsAny) hints.push(`Complete a quest: ${req.questsAny.join(' or ')}`);
    this.registry.set('dialogEvent', {
      speaker: 'System',
      text: `${loc.name} is locked. ${hints.join('. ') || 'Keep exploring!'}`,
      choices: null, step: null,
    });
  }

  _getTypeColor(type) {
    switch (type) {
      case 'resource': return 0x22c55e;
      case 'material': return 0x3b82f6;
      case 'biology': return 0x92400e;
      case 'exploration': return 0xf59e0b;
      default: return 0x6b7280;
    }
  }
}
