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
import { registerSceneHmr } from '../dev/phaserHmr.js';
import { generateHeightmap, sampleHeightmap, rand2 } from '../utils/terrainNoise.js';

const SCENE_KEY = 'WorldMapScene';

// ── Terrain palette (v2 — tile-based renderer) ──────────────────────────────
// Stronger, more recognizable biome identity than the v1 muddy warm palette.
// Phaser Graphics fillStyle wants 0xRRGGBB integers, so each entry is the
// hex value from the v2 spec converted from #RRGGBB.
const BIOME_COLORS = Object.freeze({
  [BIOME.DESERT]:    0xE6C27A, // sandy
  [BIOME.GRASSLAND]: 0x7FBF6A, // warm green
  [BIOME.WATER]:     0x3A7BA8, // blue
  [BIOME.MOUNTAIN]:  0x7E6855, // gray-brown
  [BIOME.ROCK]:      0x5C5048, // darker rough
  [BIOME.URBAN]:     0x9C886A, // warm tan
  [BIOME.UNKNOWN]:   0x3C3530, // desaturated foggy
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

// ── Terrain math helpers (module-level for v8 hot-path inlining) ───────────

/** Unpack 0xRRGGBB int into { r, g, b } byte components. */
function unpackRGB(c) {
  return {
    r: (c >> 16) & 0xff,
    g: (c >> 8) & 0xff,
    b: c & 0xff,
  };
}

function clamp255(v) {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v | 0;
}

/**
 * Compute biome blend weights for a tile at (tx, ty) given the anchor list.
 * Uses inverse-distance-squared weighting on the K nearest anchors. Returns
 * a sorted array of `{ idx, w }` with weights normalized to sum to 1.
 *
 * For K=1 callers (detail pass), this still works — single-element array
 * with weight 1.
 */
function computeBiomeWeights(tx, ty, anchors, k) {
  // Score every anchor by inverse-distance-squared.
  const scored = new Array(anchors.length);
  for (let i = 0; i < anchors.length; i++) {
    const dx = anchors[i].x - tx;
    const dy = anchors[i].y - ty;
    const d2 = dx * dx + dy * dy + 1; // +1 avoids div-by-zero at exact anchor
    scored[i] = { idx: i, w: 1 / d2 };
  }
  // Partial sort: pick top K by descending weight.
  scored.sort((a, b) => b.w - a.w);
  const kk = Math.min(k, scored.length);
  const top = scored.slice(0, kk);
  let sum = 0;
  for (let i = 0; i < kk; i++) sum += top[i].w;
  if (sum > 0) {
    for (let i = 0; i < kk; i++) top[i].w /= sum;
  }
  return top;
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

  // ── Terrain rendering (v2 — tile-based, biome-blended, elevation-shaded) ─

  /**
   * Paint a continuous tile-based terrain across the entire map area. Runs
   * once at scene create. Replaces the v1 radial fillCircle blobs (which
   * looked like dead gradient stamps on tan paper) with a real grid of
   * 32 px tiles. Each tile's color is the inverse-distance-squared blend of
   * the 2-3 nearest region biomes, then modulated by a coarse fbm
   * heightmap so high ground brightens and low ground dims.
   *
   * Result: continuous geography reads like a Civilization-style world map,
   * with smooth biome transitions instead of visible region borders.
   *
   * The {@link _terrainContainer} field stays so the fog-overlay agent can
   * tint or swap this layer in a later pass without touching unrelated
   * display objects. No explicit depth — creation order in create() puts
   * the terrain above the parchment rectangle and below paths / nodes /
   * labels / HUD chrome.
   */
  _renderTerrainLayer({ padX, padY, usableW, usableH, mapBounds }) {
    const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    const container = this.add.container(0, 0);
    this._terrainContainer = container;

    // Map render rectangle in screen px (parchment area).
    const mapLeft = mapBounds.x - mapBounds.w / 2;
    const mapTop = mapBounds.y - mapBounds.h / 2;
    const mapW = mapBounds.w;
    const mapH = mapBounds.h;

    // ── Tile grid ────────────────────────────────────────────────────────
    // 32 px tiles → ~28×21 = ~588 tiles on a 900×615 parchment area. Small
    // enough for fine biome blending, large enough to stay well under the
    // 16 ms render budget (single Graphics object batches all fillRects).
    const TILE = 32;
    const cols = Math.ceil(mapW / TILE);
    const rows = Math.ceil(mapH / TILE);

    // ── Region anchors in pixel space ────────────────────────────────────
    // Convert each location's normalized mapPos into the same coord system
    // the markers use (padX/padY/usableW/usableH from create()) so terrain
    // and nodes stay aligned.
    const locations = Object.values(WORLD_LOCATIONS);
    const anchors = locations.map((loc) => {
      const biome = biomeForWorldRegion(loc.region);
      return {
        x: padX + loc.mapPos.x * usableW,
        y: padY + loc.mapPos.y * usableH + 20,
        biome,
        color: BIOME_COLORS[biome] ?? BIOME_COLORS[BIOME.UNKNOWN],
        isMountain: biome === BIOME.MOUNTAIN,
      };
    });

    // ── Heightmap ────────────────────────────────────────────────────────
    // Coarse fbm noise, ~5x coarser than the tile grid. On a 900×615 map
    // with 32 px tiles, that's ~28×21 tiles → ~6×5 heightmap cells, which
    // is intentionally low-frequency (broad continents, not pixel noise).
    // Bumped slightly for finer mountain detail without being noisy.
    const HM_DIVISOR = 5;
    const hmCols = Math.max(8, Math.ceil(cols / HM_DIVISOR));
    const hmRows = Math.max(6, Math.ceil(rows / HM_DIVISOR));
    const heightmap = generateHeightmap({
      seed: 0x5eed,
      cols: hmCols,
      rows: hmRows,
      scale: 4,
      octaves: 4,
    });

    // ── Tile rendering ───────────────────────────────────────────────────
    const g = this.add.graphics();

    // Pre-extract anchor RGB for fast lerp.
    const anchorsRGB = anchors.map((a) => unpackRGB(a.color));

    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        // Tile center in screen px.
        const cx = mapLeft + tx * TILE + TILE / 2;
        const cy = mapTop + ty * TILE + TILE / 2;

        // ── Biome blend: weighted by 1 / dist^2 of nearest 2-3 anchors ──
        const weights = computeBiomeWeights(cx, cy, anchors, 3);

        // Mix RGB.
        let r = 0, gC = 0, b = 0;
        for (let i = 0; i < weights.length; i++) {
          const w = weights[i].w;
          const rgb = anchorsRGB[weights[i].idx];
          r += rgb.r * w;
          gC += rgb.g * w;
          b += rgb.b * w;
        }

        // ── Heightmap sample ──
        const gx = (tx / cols) * (hmCols - 1);
        const gy = (ty / rows) * (hmRows - 1);
        let h = sampleHeightmap(heightmap, gx, gy);

        // Mountain bias: nearest anchor is mountain → push tile uphill.
        const top = weights[0];
        if (anchors[top.idx].isMountain) {
          h = Math.min(1, h + 0.3 * top.w);
        }

        // Brightness modifier: 0.85 .. 1.15 over h in [0,1].
        const k = 0.85 + h * 0.30;
        r = clamp255(r * k);
        gC = clamp255(gC * k);
        b = clamp255(b * k);

        const color = (r << 16) | (gC << 8) | b;
        g.fillStyle(color, 1);
        g.fillRect(mapLeft + tx * TILE, mapTop + ty * TILE, TILE, TILE);
      }
    }

    // ── Per-biome detail pass (cheap, deterministic) ─────────────────────
    // Walk tiles again and add taste-level detail keyed off each tile's
    // dominant biome. All offsets come from the deterministic hash so the
    // map renders identically across reloads.
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const cx = mapLeft + tx * TILE + TILE / 2;
        const cy = mapTop + ty * TILE + TILE / 2;
        const weights = computeBiomeWeights(cx, cy, anchors, 1);
        const dominant = anchors[weights[0].idx].biome;

        if (dominant === BIOME.DESERT) {
          // Sparse 1-px sand grain stipple — only ~12% of desert tiles, 1-2 dots.
          const r1 = rand2(0xc0ffee, tx, ty);
          if (r1 < 0.18) {
            g.fillStyle(0xC9A570, 0.85);
            const dx = (rand2(0xa, tx, ty) - 0.5) * (TILE - 4);
            const dy = (rand2(0xb, tx, ty) - 0.5) * (TILE - 4);
            g.fillRect(cx + dx, cy + dy, 1, 1);
            if (r1 < 0.06) {
              const dx2 = (rand2(0xc, tx, ty) - 0.5) * (TILE - 4);
              const dy2 = (rand2(0xd, tx, ty) - 0.5) * (TILE - 4);
              g.fillRect(cx + dx2, cy + dy2, 1, 1);
            }
          }
        } else if (dominant === BIOME.GRASSLAND) {
          // Darker green patches — ~8% of grassland tiles, small 3px blob.
          if (rand2(0x9ea55, tx, ty) < 0.10) {
            g.fillStyle(0x5fa050, 0.55);
            g.fillCircle(cx, cy, 3);
          }
        } else if (dominant === BIOME.WATER) {
          // Subtle horizontal banding — every other tile row, faint white wash.
          if ((ty % 2) === 0) {
            g.fillStyle(0x6FA8C8, 0.10);
            g.fillRect(mapLeft + tx * TILE, mapTop + ty * TILE, TILE, TILE);
          }
        } else if (dominant === BIOME.ROCK) {
          // Scattered dark dots, ~12% chance per tile.
          if (rand2(0x60c10c, tx, ty) < 0.14) {
            g.fillStyle(0x3A322C, 0.75);
            const dx = (rand2(0x21, tx, ty) - 0.5) * (TILE - 6);
            const dy = (rand2(0x22, tx, ty) - 0.5) * (TILE - 6);
            g.fillCircle(cx + dx, cy + dy, 1.5);
          }
        } else if (dominant === BIOME.URBAN) {
          // Faint grid hint — light line on a small fraction of tiles.
          if (rand2(0x07ba17, tx, ty) < 0.18) {
            g.lineStyle(1, 0x7a6a4a, 0.35);
            g.strokeRect(mapLeft + tx * TILE + 4, mapTop + ty * TILE + 4, TILE - 8, TILE - 8);
          }
        }
      }
    }

    // Mask the terrain to the parchment rectangle so tiles at the grid
    // edges never spill onto the dark border outside the map.
    const mask = this.make.graphics({ x: 0, y: 0, add: false });
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(mapLeft, mapTop, mapW, mapH);
    g.setMask(mask.createGeometryMask());

    container.add(g);

    const t1 = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const ms = (t1 - t0).toFixed(1);
    // eslint-disable-next-line no-console
    console.debug(`[WorldMapScene] terrain v2: ${cols}x${rows}=${cols * rows} tiles in ${ms} ms (heightmap ${hmCols}x${hmRows})`);
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

// ── HMR ──────────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, WorldMapScene);
