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
import { generateHeightmap, sampleHeightmap, rand2, hash2 } from '../utils/terrainNoise.js';

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

    // ── Path layer — drawn BEFORE nodes so node icons render on top ──
    // Neighborhood home-base anchor (hub for all connection paths).
    const homeX = padX + 0.15 * usableW;
    const homeY = padY + 0.2 * usableH + 20;
    this._renderPathLayer({
      locations,
      state,
      homeX,
      homeY,
      padX,
      padY,
      usableW,
      usableH,
    });

    // ── Landmark scatter layer ──
    // Rendered AFTER terrain and paths, BEFORE nodes/labels so landmarks
    // stay behind node icons and never obscure click targets.
    this._renderLandmarkLayer({
      padX,
      padY,
      usableW,
      usableH,
      mapBounds: { x: mapX, y: mapY, w: mapW, h: mapH },
    });

    for (const loc of locations) {
      const unlocked = isLocationUnlocked(loc.id, state);
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;

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
    // homeX / homeY declared above (before _renderPathLayer call).
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

  // ── Path rendering (v1 — biome-colored quadratic bezier trails) ───────────

  /**
   * Draw bezier path trails connecting each location node to the neighborhood
   * home base. Paths use a quadratic bezier (one control point) whose curve
   * direction is deterministically signed via hash2(a.id + b.id), ensuring
   * the same curve renders on every reload / HMR cycle.
   *
   * Coloring and width are keyed off the biome at both endpoints and the
   * midpoint, so paths visually reflect the terrain they cross:
   *   DESERT    → faded tan, 2 px
   *   GRASSLAND → green-brown trail, 2 px
   *   MOUNTAIN  → darker rugged, 3 px
   *   WATER     → path skipped (TODO: ferry-boat mechanic)
   *   other     → neutral medium tan, 2 px
   *
   * Paths are drawn into `_pathContainer` (depth between terrain at -100 and
   * nodes added immediately after). The container depth is set to -50 so it
   * sits above terrain but below nodes.
   *
   * TODO (follow-up): dashed rendering for pending discovery unlocks once
   * data/discoveryUnlocks.js is authored (file does not exist yet as of
   * 2026-04-25). When it arrives, check `loc.pending === true` per the spec.
   */
  _renderPathLayer({ locations, state, homeX, homeY, padX, padY, usableW, usableH }) {
    // Home-base node is the hub — every location connects to it.
    // We treat the home node as having DESERT biome (it sits in the Arizona
    // Desert region). For biome majority sampling we check both endpoints
    // plus the geometric midpoint, and pick the majority biome.
    const homeBiome = BIOME.DESERT; // neighborhood is in arizona_desert

    const container = this.add.container(0, 0);
    this._pathContainer = container;
    container.setDepth(-50); // above terrain (-100), below nodes (0)

    // Single Graphics object for all path segments — batches draw calls.
    const g = this.add.graphics();
    container.add(g);

    for (const loc of locations) {
      const ax = homeX;
      const ay = homeY;
      const bx = padX + loc.mapPos.x * usableW;
      const by = padY + loc.mapPos.y * usableH + 20;

      // ── Biome sampling ──────────────────────────────────────────────────
      // Sample endpoint biomes and midpoint biome to determine path color.
      // We use the WORLD_REGION_BIOME map (same as terrain layer) to get
      // biome for each location's region. For the midpoint we pick whichever
      // of the two endpoint biomes covers more of the path (50/50 → endpoint b).
      const biomeA = homeBiome;
      const biomeB = biomeForWorldRegion(loc.region);

      // Skip WATER biome paths entirely — can't walk on water.
      // TODO(ferry): when ferry-boat mechanic lands, render these as dashed
      // water-crossing routes (rgba(58,123,168,0.5)) instead of skipping.
      if (biomeA === BIOME.WATER || biomeB === BIOME.WATER) continue;

      // Majority biome: use biomeB (destination) as the defining terrain
      // since that's where the traveler is heading. Both being DESERT is
      // the most common case for the current arizona_desert map.
      const majorityBiome = biomeB !== BIOME.UNKNOWN ? biomeB : biomeA;

      // ── Path style by biome ─────────────────────────────────────────────
      let strokeColor, strokeAlpha, strokeWidth;
      switch (majorityBiome) {
        case BIOME.DESERT:
          strokeColor = 0xa08250; // faded tan — rgba(160,130,80,0.6)
          strokeAlpha = 0.6;
          strokeWidth = 2;
          break;
        case BIOME.GRASSLAND:
          strokeColor = 0x6e5a32; // green-brown trail — rgba(110,90,50,0.65)
          strokeAlpha = 0.65;
          strokeWidth = 2;
          break;
        case BIOME.MOUNTAIN:
          strokeColor = 0x3c3228; // darker rugged — rgba(60,50,40,0.75)
          strokeAlpha = 0.75;
          strokeWidth = 3;
          break;
        default:
          strokeColor = 0x786446; // neutral medium tan — rgba(120,100,70,0.6)
          strokeAlpha = 0.6;
          strokeWidth = 2;
      }

      // Locked paths are rendered more faintly.
      const unlocked = isLocationUnlocked(loc.id, state);
      if (!unlocked) strokeAlpha *= 0.35;

      // ── Bezier control point ────────────────────────────────────────────
      // Midpoint plus a perpendicular offset. The offset magnitude is 12%
      // of segment length — small enough to look natural, not noodle-like.
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perpendicular unit vector (rotate 90°): (-dy/dist, dx/dist).
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);

      // Deterministic sign: hash the two node ids. hash2 needs integer args;
      // we encode the string pair as two short hash seeds by summing char
      // codes so the result is stable regardless of id length.
      const seedA = loc.id.split('').reduce((acc, c) => (acc + c.charCodeAt(0)) | 0, 0);
      const seedB = 'neighborhood'.split('').reduce((acc, c) => (acc + c.charCodeAt(0)) | 0, 0);
      const hSign = hash2(0x9a7b, seedA, seedB);
      // Odd hash → +1, even hash → -1.
      const sign = (hSign & 1) ? 1 : -1;

      const offset = dist * 0.12;
      const midX = (ax + bx) / 2 + sign * perpX * offset;
      const midY = (ay + by) / 2 + sign * perpY * offset;

      // ── Draw quadratic bezier ───────────────────────────────────────────
      // Phaser's Graphics API doesn't have a native quadratic bezier stroke,
      // so we approximate it with ~20 line segments. This gives a smooth
      // visual at the path widths used (2-3 px) without noticeable facets.
      const STEPS = 20;
      g.lineStyle(strokeWidth, strokeColor, strokeAlpha);
      g.beginPath();
      g.moveTo(ax, ay);
      for (let i = 1; i <= STEPS; i++) {
        const t = i / STEPS;
        const u = 1 - t;
        // Quadratic bezier: P(t) = u²·A + 2u·t·ctrl + t²·B
        const px = u * u * ax + 2 * u * t * midX + t * t * bx;
        const py = u * u * ay + 2 * u * t * midY + t * t * by;
        g.lineTo(px, py);
      }
      g.strokePath();
    }
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

  // ── Landmark scatter (v1 — procedural shapes, no assets) ──────────────────

  /**
   * Paint sparse environmental landmarks across the world map. Runs once at
   * scene create, after terrain and paths, before nodes and labels.
   *
   * Placement is fully deterministic: uses the same seed (0x5eed) as the
   * terrain heightmap so landmark positions are stable across reloads and
   * HMR cycles. Per-biome spawn probability gates which tiles get a landmark
   * (desert 8%, mountain 6%, rock 5%, grassland 4%, urban 2%). Total capped
   * at ~80 to keep render cost predictable (< 8 ms target).
   *
   * All shapes are drawn with Phaser Graphics — no image loading. Each shape
   * gets a 1 px ellipse shadow offset 1 px down at rgba(0,0,0,0.15) for a
   * cheap depth cue.
   *
   * The container is stored as {@link _landmarkContainer} so downstream agents
   * (fog overlay, polish pass) can tint or hide the layer without touching
   * unrelated display objects.
   */
  _renderLandmarkLayer({ padX, padY, usableW, usableH, mapBounds }) {
    const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // Reuse same seed as terrain heightmap for cross-layer determinism.
    const SEED = 0x5eed;

    const container = this.add.container(0, 0);
    this._landmarkContainer = container;

    const mapLeft = mapBounds.x - mapBounds.w / 2;
    const mapTop  = mapBounds.y - mapBounds.h / 2;
    const mapW    = mapBounds.w;
    const mapH    = mapBounds.h;

    // ── Build same anchor list terrain uses so dominant-biome lookup matches ─
    const locations = Object.values(WORLD_LOCATIONS);
    const anchors = locations.map((loc) => {
      const biome = biomeForWorldRegion(loc.region);
      return {
        x: padX + loc.mapPos.x * usableW,
        y: padY + loc.mapPos.y * usableH + 20,
        biome,
      };
    });

    // ── Spawn probability table keyed by biome ────────────────────────────
    const SPAWN_PROB = {
      [BIOME.DESERT]:    0.08,
      [BIOME.GRASSLAND]: 0.04,
      [BIOME.MOUNTAIN]:  0.06,
      [BIOME.ROCK]:      0.05,
      [BIOME.URBAN]:     0.02,
      [BIOME.WATER]:     0,
      [BIOME.UNKNOWN]:   0,
    };

    // ── Tile grid parameters (must match terrain TILE=32) ─────────────────
    const TILE = 32;
    const cols = Math.ceil(mapW / TILE);
    const rows = Math.ceil(mapH / TILE);

    const LANDMARK_CAP = 80;

    // Per-biome counters for receipt and console debug.
    const biomeCounts = {
      [BIOME.DESERT]: 0,
      [BIOME.GRASSLAND]: 0,
      [BIOME.MOUNTAIN]: 0,
      [BIOME.ROCK]: 0,
      [BIOME.URBAN]: 0,
    };

    // Single Graphics object — all landmarks batched into one draw call group.
    const g = this.add.graphics();
    let totalCount = 0;

    for (let ty = 0; ty < rows && totalCount < LANDMARK_CAP; ty++) {
      for (let tx = 0; tx < cols && totalCount < LANDMARK_CAP; tx++) {
        // Tile center in screen px.
        const cx = mapLeft + tx * TILE + TILE / 2;
        const cy = mapTop  + ty * TILE + TILE / 2;

        // Skip tiles that fall outside the parchment bounds.
        if (cx < mapLeft || cx > mapLeft + mapW || cy < mapTop || cy > mapTop + mapH) continue;

        // Determine dominant biome from nearest anchor (K=1), same as terrain detail pass.
        const weights = computeBiomeWeights(cx, cy, anchors, 1);
        const dominant = anchors[weights[0].idx].biome;

        const prob = SPAWN_PROB[dominant] ?? 0;
        if (prob === 0) continue;

        // Gate on spawn probability. Uses a distinct XOR sub-seed so these
        // rolls don't alias the terrain detail-pass rolls (which use 0xc0ffee).
        const spawnRoll = rand2(SEED ^ 0xABCD1234, tx, ty);
        if (spawnRoll >= prob) continue;

        // Jitter within tile so landmarks don't sit on a rigid grid.
        const jx = (rand2(SEED ^ 0x1111, tx, ty) - 0.5) * (TILE - 8);
        const jy = (rand2(SEED ^ 0x2222, tx, ty) - 0.5) * (TILE - 8);
        const lx = cx + jx;
        const ly = cy + jy;

        // ── Shadow: 1 px ellipse 1 px below landmark center ───────────────
        g.fillStyle(0x000000, 0.15);
        g.fillEllipse(lx, ly + 1, 6, 2);

        // ── Per-biome landmark shape ───────────────────────────────────────
        if (dominant === BIOME.DESERT) {
          // 70% cactus, 30% rock_formation (per spec).
          const typeRoll = rand2(SEED ^ 0x3333, tx, ty);
          if (typeRoll < 0.70) {
            // Cactus — tall green rect (3×8 px trunk) with two arm rects.
            g.fillStyle(0x3A7A3A, 1);
            g.fillRect(lx - 1, ly - 4, 3, 8);   // trunk
            g.fillRect(lx - 4, ly - 1, 3, 2);   // left arm
            g.fillRect(lx + 2, ly - 2, 3, 2);   // right arm
          } else {
            // Rock formation — 3 small gray triangles clustered.
            g.fillStyle(0x8A8070, 1);
            g.fillTriangle(lx - 4, ly + 2, lx - 1, ly - 2, lx + 2, ly + 2);
            g.fillStyle(0x7A7060, 1);
            g.fillTriangle(lx,     ly + 2, lx + 3, ly - 1, lx + 6, ly + 2);
            g.fillStyle(0x9A9080, 1);
            g.fillTriangle(lx - 2, ly + 2, lx + 1, ly,     lx + 4, ly + 2);
          }
          biomeCounts[BIOME.DESERT]++;

        } else if (dominant === BIOME.GRASSLAND) {
          // Scrub — small dark-green dot cluster (3 overlapping circles).
          g.fillStyle(0x2D6A2D, 0.85);
          g.fillCircle(lx,     ly,     2);
          g.fillCircle(lx - 3, ly + 1, 1.5);
          g.fillCircle(lx + 3, ly + 1, 1.5);
          biomeCounts[BIOME.GRASSLAND]++;

        } else if (dominant === BIOME.MOUNTAIN) {
          // Ridge line — 2-3 short dark-gray strokes stacked (elevation contour).
          const lineCount = rand2(SEED ^ 0x4444, tx, ty) < 0.5 ? 2 : 3;
          g.lineStyle(1.5, 0x5A5555, 0.85);
          for (let i = 0; i < lineCount; i++) {
            const lineHalfW = 6 - i;    // each ridge slightly narrower
            const stackY    = ly - i * 2.5;
            g.lineBetween(lx - lineHalfW, stackY, lx + lineHalfW, stackY);
          }
          biomeCounts[BIOME.MOUNTAIN]++;

        } else if (dominant === BIOME.ROCK) {
          // Boulder — single gray semicircle (top half; approximated via slice).
          g.fillStyle(0x7A7265, 1);
          g.slice(lx, ly + 1, 4, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
          g.fillPath();
          biomeCounts[BIOME.ROCK]++;

        } else if (dominant === BIOME.URBAN) {
          // Structure — small light-tan square outline (6×6 building footprint).
          g.lineStyle(1, 0xC8B890, 0.90);
          g.strokeRect(lx - 3, ly - 3, 6, 6);
          // Door hint — tiny filled rect on the south face.
          g.fillStyle(0xA89870, 0.80);
          g.fillRect(lx - 1, ly + 1, 2, 2);
          biomeCounts[BIOME.URBAN]++;
        }

        totalCount++;
      }
    }

    // Mask landmarks to the parchment rectangle so shapes at tile edges never
    // spill onto the dark map border (same pattern as terrain mask).
    const mask = this.make.graphics({ x: 0, y: 0, add: false });
    mask.fillStyle(0xffffff, 1);
    mask.fillRect(mapLeft, mapTop, mapW, mapH);
    g.setMask(mask.createGeometryMask());

    container.add(g);

    const t1 = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    const ms = (t1 - t0).toFixed(1);
    // eslint-disable-next-line no-console
    console.debug(
      `[landmarks] render ${ms}ms | total=${totalCount} | ` +
      `desert=${biomeCounts[BIOME.DESERT]} grassland=${biomeCounts[BIOME.GRASSLAND]} ` +
      `mountain=${biomeCounts[BIOME.MOUNTAIN]} rock=${biomeCounts[BIOME.ROCK]} ` +
      `urban=${biomeCounts[BIOME.URBAN]} | seed=0x${SEED.toString(16)} (same as terrain)`
    );
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
