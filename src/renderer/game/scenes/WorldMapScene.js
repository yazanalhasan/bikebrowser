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
import { isDiscovered, revealArea, getDiscoveryState, DISCOVERY_TILE_SIZE, _emitRegionDiscovered } from '../systems/discoverySystem.js';
import { _drainPendingReveals as _drainPendingQuestReveals } from '../systems/discoveryBridge.js';

const SCENE_KEY = 'WorldMapScene';

// ── Terrain palette (v2 — tile-based renderer) ──────────────────────────────
// Stronger, more recognizable biome identity than the v1 muddy warm palette.
// Phaser Graphics fillStyle wants 0xRRGGBB integers, so each entry is the
// hex value from the v2 spec converted from #RRGGBB.
const BIOME_COLORS = Object.freeze({
  [BIOME.DESERT]:    0xD4A656, // sandy
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
    this.add.rectangle(width / 2, height / 2, width, height, 0x2d1b0e).setDepth(-300);

    // Parchment/map overlay
    const mapW = width * 0.88;
    const mapH = height * 0.82;
    const mapX = width / 2;
    const mapY = height / 2 + 10;
    this.add.rectangle(mapX, mapY, mapW, mapH, 0xf5e6c8).setStrokeStyle(3, 0x8b6914).setDepth(-200);

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

    // ── Fog-of-war layer ──
    // Sits ABOVE terrain (-100) but BELOW paths (-50), landmarks (-25),
    // nodes (0/1) and vignette (1000). Depth chosen as -75.
    // Never drawn per-frame; only drawn once at create and on redrawFog().
    this._renderFogLayer({ mapBounds: { x: mapX, y: mapY, w: mapW, h: mapH } });

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

    // Store layout params so revealNode() can compute world coords without
    // create() being on the call stack.
    this._mapLayout = { padX, padY, usableW, usableH };

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

    // ── Seed initial home/neighborhood fog clearance ────────────────────────
    // On a fresh save the discovery state is empty and fog covers the entire
    // map. The home node is rendered above fog (depth 1) so it stays visible,
    // but the surrounding area is pitch black, which reads as broken on first
    // load. Reveal a comfortable area (3 × DISCOVERY_TILE_SIZE = 96 px) around
    // the home so fog clears around the player's start point. Idempotent —
    // revealArea adds tiles to a Set; subsequent loads of an already-revealed
    // save are no-ops. Then redraw fog to apply.
    revealArea(homeX, homeY, 96);
    this.redrawFog();

    // ── Drain queued quest-activation reveals (reverse discovery bridge) ───
    // discoveryBridge queues location ids when a quest becomes active while
    // WorldMapScene wasn't mounted (e.g. quest started in a sub-scene, or
    // a save was loaded mid-quest). Drain those now so the player sees the
    // associated nodes revealed when they open the map. revealNode is
    // idempotent against already-revealed tiles.
    //
    // Pacing layer: pass `null` to drain the queue WITHOUT firing reveals
    // synchronously, then schedule revealNode via Phaser's time.delayedCall
    // so the player has a beat to register the map first. Multiple reveals
    // stagger naturally rather than all popping in on the same frame.
    const drained = _drainPendingQuestReveals(null);
    if (drained.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[WorldMapScene] paced reveal of ${drained.length} queued nodes: ${drained.join(', ')}`);
      const INITIAL_DELAY = 700;  // ms — let player see the map state first
      const STAGGER = 380;        // ms between subsequent reveals
      drained.forEach((id, i) => {
        this.time.delayedCall(INITIAL_DELAY + i * STAGGER, () => {
          // Guard: scene may have been left/destroyed during the delay
          if (this.scene && this.scene.key === 'WorldMapScene' && this.scene.isActive()) {
            try { this.revealNode(id); }
            catch (e) {
              // eslint-disable-next-line no-console
              console.warn('[WorldMapScene] paced revealNode failed for', id, e);
            }
          }
        });
      });
    }

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

    // ── Node base graphics (drop-shadow + biome base) ──────────────────────
    // Rendered at depth 0, before node circles/icons (depth 1). Each base is
    // a small biome-matched shape that "plants" the node into the terrain.
    const nodeBaseG = this.add.graphics();
    nodeBaseG.setDepth(0);
    nodeBaseG.setData('occlusionRole', 'safe');

    for (const loc of locations) {
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;

      // ── Discovery gate — skip base entirely for undiscovered nodes ─────────
      // Skipping entirely (not silhouette) prevents leaking world layout through
      // the fog layer, consistent with the path-gating rule below.
      if (!isDiscovered(x, y)) continue;

      const biome = biomeForWorldRegion(loc.region);

      // ── Drop shadow under each node (rendered first so it's behind base) ─
      nodeBaseG.fillStyle(0x000000, 0.18);
      nodeBaseG.fillEllipse(x, y + 2, 36, 12);

      // ── Biome-matched base shape ──────────────────────────────────────────
      switch (biome) {
        case BIOME.DESERT:
          // Faded tan dust patch ellipse
          nodeBaseG.fillStyle(0xB49664, 0.5);
          nodeBaseG.fillEllipse(x, y + 4, 32, 10);
          break;

        case BIOME.MOUNTAIN:
          // Irregular rocky base — 3 overlapping ellipses at slight offsets
          nodeBaseG.fillStyle(0x7A7060, 0.45);
          nodeBaseG.fillEllipse(x - 4, y + 4, 20, 8);
          nodeBaseG.fillStyle(0x6A6050, 0.40);
          nodeBaseG.fillEllipse(x + 4, y + 5, 18, 7);
          nodeBaseG.fillStyle(0x8A8070, 0.35);
          nodeBaseG.fillEllipse(x, y + 3, 28, 9);
          break;

        case BIOME.GRASSLAND:
          // Soft green ellipse
          nodeBaseG.fillStyle(0x4A9040, 0.45);
          nodeBaseG.fillEllipse(x, y + 4, 32, 10);
          break;

        case BIOME.WATER:
          // Light blue ellipse + tiny dock rectangle
          nodeBaseG.fillStyle(0x5A9EC8, 0.45);
          nodeBaseG.fillEllipse(x, y + 4, 32, 10);
          // Dock — small tan rectangle below center
          nodeBaseG.fillStyle(0xB4956A, 0.55);
          nodeBaseG.fillRect(x - 3, y + 6, 6, 4);
          break;

        case BIOME.ROCK:
          // Dark gray flat ellipse
          nodeBaseG.fillStyle(0x504840, 0.50);
          nodeBaseG.fillEllipse(x, y + 4, 32, 10);
          break;

        case BIOME.URBAN:
          // Light gray square outline
          nodeBaseG.lineStyle(1.5, 0xA0A090, 0.55);
          nodeBaseG.strokeRect(x - 16, y - 4, 32, 14);
          break;

        default:
          // Unknown — neutral faded ellipse
          nodeBaseG.fillStyle(0x706050, 0.35);
          nodeBaseG.fillEllipse(x, y + 4, 28, 9);
          break;
      }
    }

    // Per-location map for reveal animation targets: { circle, icon, nameLabel }
    this._nodeObjects = {};

    for (const loc of locations) {
      const x = padX + loc.mapPos.x * usableW;
      const y = padY + loc.mapPos.y * usableH + 20;

      // ── Discovery gate — skip rendering entirely if not discovered ──────────
      // Skipping (not silhouette) is chosen so undiscovered node positions are
      // never visible above the fog, preventing world-layout leakage.
      if (!isDiscovered(x, y)) continue;

      const unlocked = isLocationUnlocked(loc.id, state);

      // Node circle — depth 1
      const color = unlocked ? this._getTypeColor(loc.type) : 0x666666;
      const circle = this.add.circle(x, y, 22, color, unlocked ? 1 : 0.4);
      circle.setStrokeStyle(3, unlocked ? 0xffffff : 0x888888);
      circle.setInteractive({ useHandCursor: unlocked });
      circle.setDepth(1);

      // Icon — depth 1
      const icon = this.add.text(x, y, unlocked ? loc.icon : '🔒', {
        fontSize: '20px',
      }).setOrigin(0.5).setDepth(1);

      // Name label — depth 1, inactive at 0.7 alpha
      const nameLabel = this.add.text(x, y + 32, loc.name, {
        fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
        color: unlocked ? '#3b1e08' : '#888888',
        stroke: '#f5e6c8', strokeThickness: 2,
        align: 'center', wordWrap: { width: 120 },
      }).setOrigin(0.5, 0).setDepth(1);

      // Inactive label recedes slightly — active label stays full opacity.
      if (!unlocked) {
        nameLabel.setAlpha(0.7);
      }

      // Difficulty stars — depth 1
      if (unlocked) {
        const stars = '⭐'.repeat(loc.difficulty);
        this.add.text(x, y + 48, stars, { fontSize: '10px' }).setOrigin(0.5).setDepth(1);
      }

      // Side quest indicators — depth 1
      if (unlocked) {
        const quests = getSideQuestStatus(loc.id, state);
        const available = quests.filter(q => !q.completed).length;
        const completed = quests.filter(q => q.completed).length;
        if (available > 0) {
          this.add.text(x + 20, y - 20, `📋${available}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#2563eb',
            backgroundColor: '#dbeafe', padding: { x: 2, y: 1 },
          }).setOrigin(0.5).setDepth(1);
        }
        if (completed > 0) {
          this.add.text(x - 20, y - 20, `✅${completed}`, {
            fontSize: '10px', fontFamily: 'sans-serif', color: '#16a34a',
          }).setOrigin(0.5).setDepth(1);
        }
      }

      // ── Click handler — unchanged; only circle geometry changes ────────────
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
      // Store game objects keyed by locationId so revealNode() can tween them.
      this._nodeObjects[loc.id] = { circle, icon, nameLabel, x, y };
    }

    // ── Neighborhood marker (home base) ──
    // homeX / homeY declared above (before _renderPathLayer call).
    this.add.circle(homeX, homeY, 18, 0x22c55e).setStrokeStyle(3, 0xffffff).setDepth(1);
    this.add.text(homeX, homeY, '🏠', { fontSize: '18px' }).setOrigin(0.5).setDepth(1);
    this.add.text(homeX, homeY + 28, 'Neighborhood', {
      fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#166534', stroke: '#f5e6c8', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(1);

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

    // ── Camera vignette overlay ────────────────────────────────────────────
    // Fullscreen trapezoidal edge-darkening. Four Graphics rects, one per
    // edge, filled with a shallow gradient toward the center. Cheaper than
    // a radial gradient (Phaser's fillGradientStyle is 4-corner only, not
    // radial) and works across all Phaser 3 versions. Combined they produce
    // the illusion of a dark vignette ring without a single circular draw.
    // setInteractive(false) + occlusionRole:'safe' so no input is blocked
    // and no future occlusion probe flags this layer.
    this._renderVignette({ width, height });

    // Fade in
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // Audio — goes through SCENE_MUSIC so the file-backed track for this
    // scene is used (desert_discovery had no real audio file and killed the
    // music every time the player opened the map).
    const audioMgr = this.registry.get('audioManager');
    audioMgr?.transitionToScene('WorldMapScene');
  }

  // ── Camera vignette (trapezoid-edge implementation) ───────────────────────

  /**
   * Renders a fullscreen vignette overlay at depth 1000 using four edge
   * trapezoids, each filled with a gradient that darkens from the viewport
   * edge toward the center. The trapezoids overlap slightly in the corners
   * to avoid gaps.
   *
   * Choice: trapezoids over radial gradient. Phaser 3's Graphics API offers
   * fillGradientStyle (4-corner linear) but not a radial gradient function.
   * Fighting the API would require WebGL shaders or a RenderTexture, both
   * heavier than 4 fillGradientStyle rects. The trapezoid trick achieves
   * the same perceptual result at zero extra cost.
   *
   * Input is blocked on the container (setInteractive on child graphics does
   * nothing; the Graphics object itself has no interactive region by default,
   * so input passes through to nodes beneath it automatically).
   */
  _renderVignette({ width, height }) {
    const EDGE = Math.round(Math.min(width, height) * 0.32); // vignette depth ~32% of short side
    const ALPHA_OUTER = 0.50; // darkness at viewport edge
    const ALPHA_INNER = 0;    // transparent at center

    const vg = this.add.graphics();
    vg.setDepth(1000);
    vg.setData('occlusionRole', 'safe');

    // Phaser fillGradientStyle(tl, tr, bl, br, alpha) — colors as 0xRRGGBB.
    // We use pure black (0x000000) at the outer corners and transparent inner.
    // Each of the four rects covers one edge band:

    // TOP edge
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, ALPHA_OUTER, ALPHA_OUTER, ALPHA_INNER, ALPHA_INNER);
    vg.fillRect(0, 0, width, EDGE);

    // BOTTOM edge
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, ALPHA_INNER, ALPHA_INNER, ALPHA_OUTER, ALPHA_OUTER);
    vg.fillRect(0, height - EDGE, width, EDGE);

    // LEFT edge
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, ALPHA_OUTER, ALPHA_INNER, ALPHA_OUTER, ALPHA_INNER);
    vg.fillRect(0, 0, EDGE, height);

    // RIGHT edge
    vg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, ALPHA_INNER, ALPHA_OUTER, ALPHA_INNER, ALPHA_OUTER);
    vg.fillRect(width - EDGE, 0, EDGE, height);
  }

  // ── Path rendering (v2 — biome-aware bezier trails) ──────────────────────

  /**
   * Draw bezier path trails connecting each location node to the neighborhood
   * home base. Paths use a quadratic bezier (one control point) whose curve
   * direction is deterministically signed via hash2(a.id + b.id), ensuring
   * the same curve renders on every reload / HMR cycle.
   *
   * Upgrade #1 — terrain-constrained paths:
   *   - DESERT paths: wider/softer curves (perp offset 16% of segment length).
   *   - MOUNTAIN paths: tighter/more angular. Two control points (cubic-style
   *     approximated via a sub-divided segment) give a slight kink. STEPS
   *     reduced to 14 for a mildly faceted feel consistent with rocky terrain.
   *   - Midpoint biome is now sampled: if the midpoint pixel falls closer to
   *     a different anchor than either endpoint, that biome dominates.
   *
   * Upgrade #4 — path integration:
   *   - Overall stroke alpha reduced ~12-15% per biome to fade edges into terrain.
   *   - Locked-path multiplier reduced from 0.35 to 0.25 of post-reduction alpha.
   *   - Last 3 bezier segments drawn 1 px thinner for soft endpoints.
   *
   * Upgrade #5 — depth consistency:
   *   - container.setDepth(-50) explicit (was already set; kept for clarity).
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

    // Build anchor list matching terrain so midpoint biome lookup is accurate.
    const allLocs = Object.values(WORLD_LOCATIONS);
    const anchors = allLocs.map((loc) => ({
      x: padX + loc.mapPos.x * usableW,
      y: padY + loc.mapPos.y * usableH + 20,
      biome: biomeForWorldRegion(loc.region),
    }));

    for (const loc of locations) {
      const ax = homeX;
      const ay = homeY;
      const bx = padX + loc.mapPos.x * usableW;
      const by = padY + loc.mapPos.y * usableH + 20;

      // ── Discovery gate — skip path if the destination node is not discovered.
      // The home base (neighborhood) is always visible; we treat it as always
      // discovered. The destination must be discovered to avoid leaking the
      // world layout (path endpoints reveal node positions through the fog).
      if (!isDiscovered(bx, by)) continue;

      // ── Biome sampling (endpoint + midpoint) ────────────────────────────
      const biomeA = homeBiome;
      const biomeB = biomeForWorldRegion(loc.region);

      // Skip WATER biome paths entirely — can't walk on water.
      if (biomeA === BIOME.WATER || biomeB === BIOME.WATER) continue;

      // Sample midpoint biome from nearest location anchor.
      const midRawX = (ax + bx) / 2;
      const midRawY = (ay + by) / 2;
      let midBiome = biomeB;
      if (anchors.length > 0) {
        let minD2 = Infinity;
        for (const a of anchors) {
          const ddx = a.x - midRawX;
          const ddy = a.y - midRawY;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 < minD2) { minD2 = d2; midBiome = a.biome; }
        }
      }

      // Dominant biome: midpoint wins if it differs from both endpoints.
      // Otherwise destination biome is used (most common path context).
      let majorityBiome;
      if (midBiome !== biomeA && midBiome !== biomeB) {
        majorityBiome = midBiome;
      } else {
        majorityBiome = biomeB !== BIOME.UNKNOWN ? biomeB : biomeA;
      }

      // ── Path style by biome (post upgrade #4 reduced alphas) ───────────
      let strokeColor, strokeAlpha, strokeWidth;
      switch (majorityBiome) {
        case BIOME.DESERT:
          strokeColor = 0xa08250;
          strokeAlpha = 0.50; // was 0.60 → -10 pp
          strokeWidth = 3;
          break;
        case BIOME.GRASSLAND:
          strokeColor = 0x6e5a32;
          strokeAlpha = 0.55; // was 0.65 → -10 pp
          strokeWidth = 3;
          break;
        case BIOME.MOUNTAIN:
          strokeColor = 0x3c3228;
          strokeAlpha = 0.65; // was 0.75 → -10 pp
          strokeWidth = 5;
          break;
        default:
          strokeColor = 0x786446;
          strokeAlpha = 0.50; // was 0.60 → -10 pp
          strokeWidth = 3;
      }

      // Locked paths recede more (multiplier reduced 0.35 → 0.25 per #4).
      const unlocked = isLocationUnlocked(loc.id, state);
      if (!unlocked) strokeAlpha *= 0.25;

      // ── Bezier control point (upgrade #1 biome-aware curvature) ─────────
      const dx = bx - ax;
      const dy = by - ay;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perpendicular unit vector (rotate 90°): (-dy/dist, dx/dist).
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);

      // Deterministic sign via hash.
      const seedA = loc.id.split('').reduce((acc, c) => (acc + c.charCodeAt(0)) | 0, 0);
      const seedB = 'neighborhood'.split('').reduce((acc, c) => (acc + c.charCodeAt(0)) | 0, 0);
      const hSign = hash2(0x9a7b, seedA, seedB);
      const sign = (hSign & 1) ? 1 : -1;

      // Offset percentage per biome (#1):
      //   DESERT   → 16% (was 12%) — softer, wider curves for open desert
      //   MOUNTAIN → 10% — tighter, more angular feel
      //   others   → 12% (unchanged)
      let offsetPct;
      if (majorityBiome === BIOME.DESERT) {
        offsetPct = 0.22;
      } else if (majorityBiome === BIOME.MOUNTAIN) {
        offsetPct = 0.25; // stronger mountain curvature
      } else {
        offsetPct = 0.12;
      }
      const offset = dist * offsetPct;
      const midX = midRawX + sign * perpX * offset;
      const midY = midRawY + sign * perpY * offset;

      // For MOUNTAIN paths: add a secondary kink control point to simulate
      // the angular switchback feel of high-elevation trails (#1). We
      // interpolate two bezier segments (A→kink→mid, mid→kink2→B) rather
      // than one smooth arc. kink sits at 35% along the straight line,
      // offset further from center using the opposite perpendicular sign.
      const isMountain = majorityBiome === BIOME.MOUNTAIN;

      // STEPS: 14 for mountain (faceted look per spec), 20 otherwise.
      const STEPS = isMountain ? 10 : 20;

      g.lineStyle(strokeWidth, strokeColor, strokeAlpha);

      if (isMountain) {
        // Cubic bezier approximated as two joined quadratics for a kink path.
        const kinkOffset = dist * 0.08;
        // ctrl1 biased toward 35% along path from A, offset opposite sign
        const t1 = 0.35;
        const kx1 = ax + t1 * dx + (-sign) * perpX * kinkOffset;
        const ky1 = ay + t1 * dy + (-sign) * perpY * kinkOffset;
        // ctrl2 biased toward 65% along path from A, same sign
        const t2 = 0.65;
        const kx2 = ax + t2 * dx + sign * perpX * kinkOffset * 0.5;
        const ky2 = ay + t2 * dy + sign * perpY * kinkOffset * 0.5;

        // Draw cubic bezier via STEPS line segments.
        // Cubic bezier: P(t) = (1-t)^3 A + 3(1-t)^2·t·C1 + 3(1-t)·t^2·C2 + t^3·B
        g.beginPath();
        g.moveTo(ax, ay);
        for (let i = 1; i <= STEPS; i++) {
          const t = i / STEPS;
          const u = 1 - t;
          const px = u*u*u*ax + 3*u*u*t*kx1 + 3*u*t*t*kx2 + t*t*t*bx;
          const py = u*u*u*ay + 3*u*u*t*ky1 + 3*u*t*t*ky2 + t*t*t*by;
          // Soft endpoint: last 3 segments drawn 1 px thinner.
          if (i === STEPS - 2 && strokeWidth > 1) {
            g.strokePath();
            g.lineStyle(Math.max(1, strokeWidth - 1), strokeColor, strokeAlpha * 0.85);
            g.beginPath();
            g.moveTo(px - (px - (u*u*u*ax + 3*u*u*t*kx1 + 3*u*t*t*kx2 + t*t*t*bx)), py);
            g.moveTo(px, py);
          }
          g.lineTo(px, py);
        }
        g.strokePath();
      } else {
        // Quadratic bezier (original approach).
        g.beginPath();
        g.moveTo(ax, ay);
        for (let i = 1; i <= STEPS; i++) {
          const t = i / STEPS;
          const u = 1 - t;
          const px = u * u * ax + 2 * u * t * midX + t * t * bx;
          const py = u * u * ay + 2 * u * t * midY + t * t * by;
          // Soft endpoint: last 3 segments 1 px thinner.
          if (i === STEPS - 2 && strokeWidth > 1) {
            g.strokePath();
            g.lineStyle(Math.max(1, strokeWidth - 1), strokeColor, strokeAlpha * 0.85);
            g.beginPath();
            g.moveTo(px, py);
          }
          g.lineTo(px, py);
        }
        g.strokePath();
      }
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
   * display objects.
   */
  _renderTerrainLayer({ padX, padY, usableW, usableH, mapBounds }) {
    const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    const container = this.add.container(0, 0);
    this._terrainContainer = container;
    container.setDepth(-100); // explicit depth — terrain is always bottom-most

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

  // ── Fog-of-war overlay ────────────────────────────────────────────────────

  /**
   * Create the fog container and Graphics object, then draw fog tiles.
   *
   * Layer depth: -75 — sits strictly between terrain (-100) and paths (-50).
   * Layer order: terrain (-100) → fog (-75) → paths (-50) → landmarks (-25)
   *              → node bases (0) → node circles/icons/labels (1) → vignette (1000).
   *
   * The Graphics object is NOT made interactive. Phaser.GameObjects.Graphics
   * has no input region by default, so pointer events fall through to node
   * circles (depth 1) underneath without any extra configuration. We also
   * explicitly confirm this by NOT calling setInteractive() — the absence
   * of a hit area is what guarantees pass-through input.
   *
   * @param {{ mapBounds: { x, y, w, h } }} opts
   */
  _renderFogLayer({ mapBounds }) {
    const container = this.add.container(0, 0);
    this._fogContainer = container;
    container.setDepth(-75); // above terrain (-100), below paths (-50)

    const g = this.add.graphics();
    // No setInteractive() call — Graphics objects have no hit area by default.
    // Input events pass through transparently to node circles beneath.
    this._fogGraphics = g;

    // Store map bounds so redrawFog() can operate without create() params.
    this._fogMapBounds = mapBounds;

    container.add(g);

    this._drawFogTiles(g, mapBounds);
  }

  /**
   * Public method — clears and redraws the fog overlay. Call this whenever
   * discovery state changes (e.g. after world-node-gating grants discovery
   * via revealArea, it calls scene.redrawFog() to refresh the visual).
   *
   * Performance: a fresh-save redraw (every tile fogged) on a 900×615 map
   * with 32 px tiles is ~28×20 = ~560 solid fillRect calls. Each fillRect
   * is a single GPU draw call batch entry. Typical measured time on Chrome
   * desktop: <2 ms. Well within the 16 ms budget.
   */
  redrawFog() {
    if (!this._fogGraphics || !this._fogMapBounds) return;
    const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    this._fogGraphics.clear();
    this._drawFogTiles(this._fogGraphics, this._fogMapBounds);

    const t1 = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    // eslint-disable-next-line no-console
    console.debug(`[WorldMapScene] redrawFog: ${(t1 - t0).toFixed(1)} ms`);
  }

  /**
   * Internal — iterate tiles across the map parchment area and fill solid
   * black (#000000, alpha 1.0) for every undiscovered tile. Discovered tiles
   * are simply skipped (no draw call, no transparent rect) for performance.
   *
   * Uses DISCOVERY_TILE_SIZE (32 px) to match the discovery grid exactly so
   * fog tile boundaries align with the discovery grid boundaries.
   *
   * Batching: a single fillStyle call per contiguous run of same-color rects
   * would be ideal, but since there's only one color (black) we set fillStyle
   * once at the top and call fillRect for each undiscovered tile. Phaser
   * batches these into the same draw pass automatically.
   *
   * isDiscovered() maps world-pixel positions → discovery grid cells. We pass
   * the tile's top-left pixel (mapLeft + tx * TILE, mapTop + ty * TILE) as the
   * world-pixel coordinate. The discoverySystem uses Math.floor(x / TILE) which
   * maps that pixel to grid cell (tx, ty), matching our iteration indices.
   *
   * @param {Phaser.GameObjects.Graphics} g
   * @param {{ x, y, w, h }} mapBounds  Parchment rectangle (center x/y).
   */
  _drawFogTiles(g, mapBounds) {
    const TILE = DISCOVERY_TILE_SIZE; // 32 px — matches discovery grid
    const mapLeft = mapBounds.x - mapBounds.w / 2;
    const mapTop  = mapBounds.y - mapBounds.h / 2;
    const cols = Math.ceil(mapBounds.w / TILE);
    const rows = Math.ceil(mapBounds.h / TILE);

    // Set fill style once — all undiscovered tiles share the same solid black.
    g.fillStyle(0x000000, 1.0);

    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const px = mapLeft + tx * TILE;
        const py = mapTop  + ty * TILE;

        // isDiscovered() expects world pixels. Pass the tile's top-left corner;
        // the system floors to the same (tx, ty) grid cell we iterate here.
        if (isDiscovered(px, py)) continue; // no fog — tile revealed

        // Undiscovered — solid black fog tile. Clamp to parchment edge for the
        // last column/row which may extend slightly beyond mapBounds.
        const tileW = Math.min(TILE, mapBounds.w - tx * TILE);
        const tileH = Math.min(TILE, mapBounds.h - ty * TILE);
        g.fillRect(px, py, tileW, tileH);
      }
    }
  }

  // ── Landmark scatter (v2 — clustering, variance, contrast, depth) ─────────

  /**
   * Paint sparse environmental landmarks across the world map. Runs once at
   * scene create, after terrain and paths, before nodes and labels.
   *
   * Upgrade #2 — Landmark clustering:
   *   Pick 8 cluster anchor points per scene (deterministic from SEED).
   *   Each anchor spawns 2-4 landmarks within a 40 px radius. The existing
   *   per-tile pass adds stragglers for natural distribution variation.
   *   Total cap stays at 80.
   *
   * Upgrade #5 — Depth consistency:
   *   container.setDepth(-25) added explicitly.
   *
   * Upgrade #6 — Landmark variation:
   *   ±15° rotation and 0.85-1.15× scale per landmark, deterministic.
   *   Cactus arm count varies (1 or 2), ridge line count already varied.
   *
   * Upgrade #7 — Micro-contrast:
   *   Cactus fill alpha bumped to 1.0, rock grays darkened 5-10%,
   *   mountain ridge stroke darkened.
   */
  _renderLandmarkLayer({ padX, padY, usableW, usableH, mapBounds }) {
    const t0 = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // Reuse same seed as terrain heightmap for cross-layer determinism.
    const SEED = 0x5eed;

    const container = this.add.container(0, 0);
    this._landmarkContainer = container;
    // Depth -90 sits BETWEEN terrain (-100) and fog (-75). Landmarks are
    // geographic features that belong with the terrain — fog must hide them
    // until the player explores. Original spec used -25 (above fog), which
    // leaked the world layout: cacti/ridges/scrub were visible through fog
    // on a fresh save. Lowered after the fog layer landed.
    container.setDepth(-90);

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

    // ── Helper: draw one landmark shape at (lx, ly) with biome + seed ─────
    // rotation and scale applied via manual trig (no matrix — Graphics has no
    // per-draw transform, so we rotate the shape's component coordinates).
    const drawLandmark = (lx, ly, dominant, tx, ty, rotSeed, scaleSeed) => {
      if (totalCount >= LANDMARK_CAP) return;

      // Rotation ±15° (upgrade #6). Convert deterministic rand to [-15, +15] deg.
      const rotDeg = (rand2(rotSeed, tx, ty) - 0.5) * 30;
      const rotRad = rotDeg * (Math.PI / 180);
      const cosR = Math.cos(rotRad);
      const sinR = Math.sin(rotRad);
      // Scale 0.85-1.15 (upgrade #6).
      const sc = 0.85 + rand2(scaleSeed, tx, ty) * 0.30;

      // Rotate a (dx, dy) offset around (lx, ly) and scale it.
      const rp = (dx, dy) => ({
        x: lx + (dx * cosR - dy * sinR) * sc,
        y: ly + (dx * sinR + dy * cosR) * sc,
      });

      // ── Shadow ─────────────────────────────────────────────────────────
      g.fillStyle(0x000000, 0.15);
      g.fillEllipse(lx, ly + 1, 6 * sc, 2 * sc);

      // ── Per-biome landmark shape ────────────────────────────────────────
      if (dominant === BIOME.DESERT) {
        const typeRoll = rand2(SEED ^ 0x3333, tx, ty);
        if (typeRoll < 0.70) {
          // Cactus — 1 or 2 arm pairs (upgrade #6 micro-variation).
          const armCount = rand2(SEED ^ 0x7777, tx, ty) < 0.5 ? 1 : 2;
          // Alpha 1.0 (upgrade #7 micro-contrast).
          g.fillStyle(0x2D5C2D, 1.0);
          const trunk0 = rp(-2, -8);
          const trunk1 = rp( 2, -8);
          const trunk2 = rp( 2,  8);
          const trunk3 = rp(-2,  8);
          g.fillPoints([trunk0, trunk1, trunk2, trunk3], true);
          // First arm pair
          const la0 = rp(-6, -2); const la1 = rp(-2, -2);
          const la2 = rp(-2,  1); const la3 = rp(-6,  1);
          g.fillPoints([la0, la1, la2, la3], true);
          const ra0 = rp(2, -4); const ra1 = rp(6, -4);
          const ra2 = rp(6, -1); const ra3 = rp(2, -1);
          g.fillPoints([ra0, ra1, ra2, ra3], true);
          // Second arm pair if armCount === 2
          if (armCount === 2) {
            const la4 = rp(-3, -3); const la5 = rp(-1, -3);
            const la6 = rp(-1, -1); const la7 = rp(-3, -1);
            g.fillPoints([la4, la5, la6, la7], true);
          }
        } else {
          // Rock formation — 3 triangles, slightly darker (upgrade #7).
          g.fillStyle(0x7A7060, 1);
          const t1a = rp(-4, 2); const t1b = rp(-1, -2); const t1c = rp(2, 2);
          g.fillTriangle(t1a.x, t1a.y, t1b.x, t1b.y, t1c.x, t1c.y);
          g.fillStyle(0x6A6050, 1); // darker mid rock (#7)
          const t2a = rp(0, 2); const t2b = rp(3, -1); const t2c = rp(6, 2);
          g.fillTriangle(t2a.x, t2a.y, t2b.x, t2b.y, t2c.x, t2c.y);
          g.fillStyle(0x8A8070, 1);
          const t3a = rp(-2, 2); const t3b = rp(1, 0); const t3c = rp(4, 2);
          g.fillTriangle(t3a.x, t3a.y, t3b.x, t3b.y, t3c.x, t3c.y);
        }
        biomeCounts[BIOME.DESERT]++;

      } else if (dominant === BIOME.GRASSLAND) {
        // Scrub — dot cluster, slightly darker alpha (upgrade #7).
        g.fillStyle(0x2D6A2D, 0.95);
        g.fillCircle(lx, ly, 2 * sc);
        g.fillCircle(lx - 3 * sc, ly + 1 * sc, 1.5 * sc);
        g.fillCircle(lx + 3 * sc, ly + 1 * sc, 1.5 * sc);
        biomeCounts[BIOME.GRASSLAND]++;

      } else if (dominant === BIOME.MOUNTAIN) {
        // Ridge line — slightly darker stroke (upgrade #7).
        const lineCount = rand2(SEED ^ 0x4444, tx, ty) < 0.5 ? 2 : 3;
        g.lineStyle(1.5, 0x4A4545, 0.95); // was 0x5A5555, 0.85 → darker #7
        for (let i = 0; i < lineCount; i++) {
          const lineHalfW = (6 - i) * sc;
          const p0 = rp(-lineHalfW, -i * 2.5);
          const p1 = rp( lineHalfW, -i * 2.5);
          g.lineBetween(p0.x, p0.y, p1.x, p1.y);
        }
        biomeCounts[BIOME.MOUNTAIN]++;

      } else if (dominant === BIOME.ROCK) {
        // Boulder — darker gray (upgrade #7: was 0x7A7265 → 0x6A6255).
        g.fillStyle(0x6A6255, 1);
        g.slice(lx, ly + 1 * sc, 4 * sc, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        g.fillPath();
        biomeCounts[BIOME.ROCK]++;

      } else if (dominant === BIOME.URBAN) {
        // Structure — slightly stronger alpha (upgrade #7).
        g.lineStyle(1, 0xB8A880, 1.0); // was 0xC8B890, 0.90
        const u0 = rp(-3, -3); const u1 = rp(3, -3);
        const u2 = rp(3,  3);  const u3 = rp(-3,  3);
        g.strokePoints([u0, u1, u2, u3], true);
        g.fillStyle(0xA89870, 1.0);
        const d0 = rp(-1, 1); const d1 = rp(1, 1);
        const d2 = rp(1, 3);  const d3 = rp(-1, 3);
        g.fillPoints([d0, d1, d2, d3], true);
        biomeCounts[BIOME.URBAN]++;
      }

      totalCount++;
    };

    // ── Phase 1: Cluster anchors (upgrade #2) ─────────────────────────────
    // 8 cluster anchors placed deterministically inside the parchment area.
    // Each anchor's biome is sampled from the terrain anchor list. Each
    // anchor spawns 2-4 child landmarks within CLUSTER_RADIUS px.
    const NUM_CLUSTERS = 8;
    const CLUSTER_RADIUS = 40;
    const CLUSTER_SEED = SEED ^ 0xC1A57E2;

    for (let ci = 0; ci < NUM_CLUSTERS && totalCount < LANDMARK_CAP; ci++) {
      // Deterministic cluster center within the parchment area.
      const cx = mapLeft + TILE + rand2(CLUSTER_SEED, ci, 0) * (mapW - TILE * 2);
      const cy = mapTop  + TILE + rand2(CLUSTER_SEED, ci, 1) * (mapH - TILE * 2);

      // Cluster biome from nearest location anchor.
      let clusterBiome = BIOME.UNKNOWN;
      if (anchors.length > 0) {
        let minD2 = Infinity;
        for (const a of anchors) {
          const ddx = a.x - cx; const ddy = a.y - cy;
          const d2 = ddx*ddx + ddy*ddy;
          if (d2 < minD2) { minD2 = d2; clusterBiome = a.biome; }
        }
      }
      if (clusterBiome === BIOME.WATER || clusterBiome === BIOME.UNKNOWN) continue;

      // Child count: 2-4
      const childCount = 2 + Math.floor(rand2(CLUSTER_SEED, ci, 2) * 3);
      for (let ch = 0; ch < childCount && totalCount < LANDMARK_CAP; ch++) {
        const angle = rand2(CLUSTER_SEED ^ 0x111, ci * 10 + ch, 0) * Math.PI * 2;
        const radius = rand2(CLUSTER_SEED ^ 0x222, ci * 10 + ch, 1) * CLUSTER_RADIUS;
        const lx = cx + Math.cos(angle) * radius;
        const ly = cy + Math.sin(angle) * radius;

        // Skip if outside parchment bounds.
        if (lx < mapLeft + 4 || lx > mapLeft + mapW - 4 ||
            ly < mapTop  + 4 || ly > mapTop  + mapH - 4) continue;

        const tx = Math.floor((lx - mapLeft) / TILE);
        const ty = Math.floor((ly - mapTop)  / TILE);
        drawLandmark(lx, ly, clusterBiome, tx + ci * 100, ty + ch * 10,
          CLUSTER_SEED ^ 0xA1B2 ^ (ci * 17 + ch * 31),
          CLUSTER_SEED ^ 0xC3D4 ^ (ci * 19 + ch * 37));
      }
    }

    // ── Phase 2: Per-tile straggler pass (original algorithm, reduced cap) ─
    // Fills in natural variation between clusters. Spawn probabilities
    // unchanged; just cap at whatever remains from LANDMARK_CAP.
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

        drawLandmark(lx, ly, dominant, tx, ty,
          SEED ^ 0xE5F6 ^ (tx * 13 + ty * 7),
          SEED ^ 0x7890 ^ (tx * 11 + ty * 5));
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
      `[landmarks] v2 render ${ms}ms | total=${totalCount} | ` +
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

  // ── Node discovery & reveal ───────────────────────────────────────────────

  /**
   * Reveal a world-map node by id. Intended to be called by external systems
   * (quest engine, dialogue events) when a location is first discovered.
   *
   * Steps:
   *  1. Resolve the location's pixel coords from _mapLayout.
   *  2. Check whether this is the very first discovery ever (pre-revealArea
   *     tile count === 0) so we can fire the first-discovery dialog.
   *  3. Call revealArea() to mark tiles as discovered in the discovery module.
   *  4. Call saveGame() so the reveal persists across sessions.
   *  5. Call redrawFog() to update the fog visual.
   *  6. Spawn a circle + path reveal: create the node game objects that were
   *     skipped during create() (because the node was hidden), animate them in.
   *  7. Play discover SFX if available.
   *  8. Fire first-discovery dialog on the very first ever reveal.
   *
   * Non-blocking: all Phaser tweens are asynchronous. No await, no scene pause.
   *
   * @param {string} nodeId — location id from WORLD_LOCATIONS.
   */
  revealNode(nodeId) {
    const loc = WORLD_LOCATIONS[nodeId];
    if (!loc) {
      // eslint-disable-next-line no-console
      console.warn(`[WorldMapScene] revealNode: unknown nodeId "${nodeId}"`);
      return;
    }

    const layout = this._mapLayout;
    if (!layout) {
      // eslint-disable-next-line no-console
      console.warn('[WorldMapScene] revealNode: called before create() — _mapLayout not set');
      return;
    }

    const { padX, padY, usableW, usableH } = layout;
    const x = padX + loc.mapPos.x * usableW;
    const y = padY + loc.mapPos.y * usableH + 20;

    // ── 1. First-discovery detection: was the tile set empty before this call?
    // We check via getDiscoveryState().tiles.length instead of a flag in the
    // save schema — no schema bump required, and it correctly handles the edge
    // case where the node was already revealed (tiles > 0 from a prior load).
    const wasFirstEver = getDiscoveryState().tiles.length === 0;

    // ── 2. Mark tiles discovered (2.5× DISCOVERY_TILE_SIZE radius = 80 px)
    // This covers the node icon (radius 22) plus a comfortable surrounding area
    // that aligns with the fog grid, so the fog clears visibly around the node.
    const REVEAL_RADIUS = DISCOVERY_TILE_SIZE * 2.5; // 80 px
    revealArea(x, y, REVEAL_RADIUS);

    // ── 3. Persist — saveGame() reads live discovery state from the module.
    const state = this.registry.get('gameState');
    saveGame(state);

    // ── 3b. Fire region-discovered event so the quest bridge can queue unlocks.
    // Passes the locationId (nodeId) as the regionId so DISCOVERY_UNLOCKS can
    // look up per-location unlock specs (keyed by WORLD_LOCATIONS ids).
    _emitRegionDiscovered(nodeId);

    // ── 4. Update fog visual.
    this.redrawFog();

    // ── 5. Spawn node game objects for this newly revealed location and animate.
    // If the node was already rendered (visible from a prior session), skip
    // re-creation but still play the animation on the existing objects.
    if (!this._nodeObjects[nodeId]) {
      this._spawnNodeObjects(loc, x, y, state);
    }

    const objs = this._nodeObjects[nodeId];
    if (objs) {
      // Visual emphasis layer: ring expansion + glow burst at the node center.
      // Fires alongside (not instead of) the existing scale/alpha-pulse tweens
      // in _playRevealAnimation so the beat reads as a punctuated discovery.
      this._playRevealHighlight(x, y);
      this._playRevealAnimation(objs);
    }

    // ── 6. Play discover SFX if available.
    // audioManifest has no 'discover' SFX key — no sfx_world/sfx_ui entry for
    // discovery. We fall back to 'reward_stinger' (stinger, 0.7 volume) as the
    // closest available celebratory cue.
    const audioMgr = this.registry.get('audioManager');
    if (audioMgr) {
      // Try discover key first; fall back to reward_stinger.
      if (audioMgr.hasSfx?.('discover')) {
        audioMgr.playSfx('discover');
      } else if (audioMgr.playStinger) {
        audioMgr.playStinger('reward_stinger');
      } else {
        // AudioManager may expose playSfx for stingers too — try both.
        audioMgr.playSfx?.('reward_stinger');
      }
    }

    // ── 7. First-discovery dialog (narrative beat).
    if (wasFirstEver) {
      this.registry.set('dialogEvent', {
        speaker: 'Zuzu',
        text: `You discovered a new place! "${loc.name}" is now on your map.`,
        choices: null,
        step: null,
      });
    }
  }

  /**
   * Spawn node game objects (circle, icon, label, stars) for a location that
   * was previously hidden behind fog. Called from revealNode() when the
   * location was not rendered during create(). Places all child objects inside
   * a Phaser Container positioned at (x, y) so the reveal tween only needs to
   * animate the container's scale — children use local (0, 0)-relative coords.
   * Registers click handlers so the node is immediately interactive.
   *
   * @param {object} loc — WORLD_LOCATIONS entry
   * @param {number} x — screen X
   * @param {number} y — screen Y
   * @param {object} state — gameState registry value
   */
  _spawnNodeObjects(loc, x, y, state) {
    const unlocked = isLocationUnlocked(loc.id, state);
    const color = unlocked ? this._getTypeColor(loc.type) : 0x666666;

    // Container at node center, depth 1. Starts at scale 0 for the reveal
    // tween. Input on child objects is relative to the container position.
    const container = this.add.container(x, y);
    container.setDepth(1);
    container.setScale(0);

    // Node circle — at local (0, 0).
    const circle = this.add.circle(0, 0, 22, color, unlocked ? 1 : 0.4);
    circle.setStrokeStyle(3, unlocked ? 0xffffff : 0x888888);
    container.add(circle);

    // Icon — at local (0, 0).
    const icon = this.add.text(0, 0, unlocked ? loc.icon : '🔒', {
      fontSize: '20px',
    }).setOrigin(0.5);
    container.add(icon);

    // Name label — at local (0, 32).
    const nameLabel = this.add.text(0, 32, loc.name, {
      fontSize: '11px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: unlocked ? '#3b1e08' : '#888888',
      stroke: '#f5e6c8', strokeThickness: 2,
      align: 'center', wordWrap: { width: 120 },
    }).setOrigin(0.5, 0);
    if (!unlocked) nameLabel.setAlpha(0.7);
    container.add(nameLabel);

    // Difficulty stars — at local (0, 48).
    if (unlocked) {
      const stars = '⭐'.repeat(loc.difficulty);
      container.add(this.add.text(0, 48, stars, { fontSize: '10px' }).setOrigin(0.5));
    }

    // Make the circle interactive. Because the circle is inside a container,
    // Phaser's input system resolves pointer events relative to the container's
    // world transform automatically. setInteractive() on the container itself
    // would need an explicit hit area; instead we keep the circle interactive
    // and the container's scale tween from 0→1 naturally scales the hit zone.
    circle.setInteractive({ useHandCursor: unlocked });
    if (unlocked) {
      circle.on('pointerdown', () => this._selectLocation(loc));
      circle.on('pointerover', () => {
        this.tweens.add({ targets: circle, scaleX: 1.2, scaleY: 1.2, duration: 150, ease: 'Back.easeOut' });
      });
      circle.on('pointerout', () => {
        this.tweens.add({ targets: circle, scaleX: 1, scaleY: 1, duration: 150 });
      });
    } else {
      circle.setInteractive({ useHandCursor: false });
      circle.on('pointerdown', () => this._showLockHint(loc, state));
    }

    this._markers.push({ loc, circle, icon, nameLabel });
    this._nodeObjects[loc.id] = { container, circle, icon, nameLabel, x, y };
  }

  /**
   * Play the reveal animation on a node's game objects.
   *
   * If a `container` is present (nodes spawned by _spawnNodeObjects after fog
   * reveal), scale the container 0 → 1 and alpha-pulse the circle + icon.
   * If only individual objects are present (nodes already rendered in create()
   * that were already at scale 1), alpha-pulse only — no scale tween needed.
   *
   * Duration: 550 ms. Back.easeOut gives a satisfying "pop" overshoot.
   * The alpha pulse begins first (no delay) while the scale tween is offset
   * by 80 ms so the player's eye catches the brightening before the scale
   * kicks in. The pulse uses yoyo to overlap with — rather than blink before
   * — the scale, giving a more cinematic feel without any extra duration.
   * Non-blocking — Phaser tweens are asynchronous; never blocks input.
   *
   * @param {{ container?, circle, icon, nameLabel }} objs
   */
  _playRevealAnimation({ container, circle, icon, nameLabel }) {
    const DURATION = 550;
    const SCALE_DELAY = 80; // ms — let alpha pulse start before the pop

    if (container) {
      // Container approach (freshly spawned node): scale the whole group in.
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: DURATION,
        delay: SCALE_DELAY,
        ease: 'Back.easeOut',
      });
    }

    // Alpha pulse on circle + icon (nameLabel alpha is 0.7 for locked nodes;
    // don't override it). Works for both container and non-container paths.
    // Single yoyo tween: 35% out, 35% back (Sine in then auto-reverses with
    // Sine.easeOut behaviour via yoyoEase) — replaces the previous chained
    // onComplete pattern. Overlaps naturally with the scale tween instead of
    // sequencing in/out.
    const pulseTargets = [circle, icon].filter(Boolean);
    if (pulseTargets.length > 0) {
      this.tweens.add({
        targets: pulseTargets,
        alpha: 0.5,
        duration: DURATION * 0.35,
        ease: 'Sine.easeIn',
        yoyo: true,
        yoyoEase: 'Sine.easeOut',
      });
    }

    // Visual emphasis: brief amber stroke flash on the node circle. Phaser
    // Arc/Circle don't tween stroke colors directly, so we set then revert
    // via delayedCall. Captures the node's current stroke (which branches
    // on locked/unlocked in _spawnNodeObjects: 0xffffff vs 0x888888) so the
    // restore exactly matches what the spawn logic chose.
    if (circle && typeof circle.setStrokeStyle === 'function') {
      const FLASH_COLOR = 0xFFD27A; // warm amber, matches highlight palette
      const FLASH_DURATION = 450;   // ms — sits within the 550 ms reveal beat
      const STROKE_WIDTH = 3;       // matches _spawnNodeObjects pattern
      const originalStrokeColor = (typeof circle.strokeColor === 'number')
        ? circle.strokeColor
        : 0xffffff;
      circle.setStrokeStyle(STROKE_WIDTH, FLASH_COLOR);
      this.time.delayedCall(FLASH_DURATION, () => {
        if (circle && circle.scene) {
          circle.setStrokeStyle(STROKE_WIDTH, originalStrokeColor);
        }
      });
    }
  }

  /**
   * Visual emphasis layer for revealNode(). Adds a warm-amber ring expansion
   * + inner glow burst centered on the newly-revealed node so the beat reads
   * as "look here, this is significant" rather than a quiet appearance.
   *
   * Both effects sit at depth 0.5 — above the landmarks (-25) so they're
   * visible, below the node container (1) so the icon stays crisp on top.
   * Both effects destroy themselves in onComplete; no GameObject leaks.
   *
   * Pure visual: does NOT touch timing, camera, audio, or progression.
   *
   * @param {number} x — node center x in scene coords
   * @param {number} y — node center y in scene coords
   */
  _playRevealHighlight(x, y) {
    const COLOR = 0xFFD27A;        // warm amber, parchment/discovery palette
    const RING_DURATION = 700;     // ms — matches the 700 ms initial pacing beat
    const GLOW_DURATION = 500;     // ms — glow fades faster than ring
    const NODE_RADIUS = 22;        // matches _spawnNodeObjects circle radius
    const RING_TARGET_RADIUS = 80; // matches REVEAL_RADIUS — fog-cleared area
    const HIGHLIGHT_DEPTH = 0.5;   // above fog/landmarks, below node container

    // Inner glow burst — semi-transparent amber fill that fades + softly
    // expands. Sits below the node icon so it haloes rather than obscures.
    const GLOW_RADIUS = 40;
    const GLOW_ALPHA_START = 0.4;
    const GLOW_SCALE_END = 1.4;
    const glow = this.add.circle(x, y, GLOW_RADIUS, COLOR, GLOW_ALPHA_START);
    glow.setDepth(HIGHLIGHT_DEPTH);
    this.tweens.add({
      targets: glow,
      alpha: 0,
      scale: GLOW_SCALE_END,
      duration: GLOW_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => glow.destroy(),
    });

    // Outer ring expansion — stroked-only circle that grows from the node's
    // own radius out to the fog-reveal radius and fades to alpha 0. Phaser
    // doesn't tween Graphics radius natively, so we tween scale on a Circle
    // GameObject (visually identical, much simpler).
    const RING_STROKE_WIDTH = 3;
    const ring = this.add.circle(x, y, NODE_RADIUS, undefined, 0);
    ring.setStrokeStyle(RING_STROKE_WIDTH, COLOR, 1.0);
    ring.setDepth(HIGHLIGHT_DEPTH);
    this.tweens.add({
      targets: ring,
      scale: RING_TARGET_RADIUS / NODE_RADIUS,
      alpha: 0,
      duration: RING_DURATION,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy(),
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
