/**
 * DryWashScene — Arizona dry-wash arroyo where the bridge_collapse quest
 * culminates.
 *
 * Three behavioral phases driven by save state:
 *
 *   1. Visit phase — bridge_collapse not yet at build_bridge step.
 *      Broken bridge remnants visible. Mr. Chen nudges the player toward
 *      the testing flow. No construction available.
 *
 *   2. Build phase — bridge_collapse active and stepIndex === BUILD_STEP_INDEX
 *      and !state.bridgeBuilt. Mounts the ConstructionSystem with the
 *      mesquite blueprint. Player clicks ghost beams to place them.
 *      After the last beam is placed the host runs a load-test bike
 *      animation, then explicitly calls system.completeBuild() to emit
 *      the observation + Mr. Chen's "It holds!" dialog.
 *
 *   3. Post-build phase — state.bridgeBuilt === true.
 *      Renders the completed bridge (no ghosts, no construction system),
 *      so revisits show the result of the player's work.
 *
 * The far-side trail stays locked (🔒) through this dispatch — the
 * neighborhood-unlock dispatch will handle that.
 */

import LocalSceneBase from './LocalSceneBase.js';
import { saveGame } from '../systems/saveSystem.js';
import { ConstructionSystem } from '../systems/construction/constructionSystem.js';
import { BRIDGE_MESQUITE_BLUEPRINT } from '../data/blueprints/bridgeBlueprint.js';
import { registerSceneHmr } from '../dev/phaserHmr.js';
import {
  applySeamlessEntry,
  attachEdgeSensor,
  performSeamlessTransition,
} from '../systems/seamlessTraversal.js';

const SCENE_KEY = 'DryWashScene';

// Step in bridge_collapse.steps where build_bridge sits (id: 'build_bridge').
// Indexed against the canonical quests.js steps array. If the order shifts,
// update this constant — there's no automatic lookup because we want the
// behavior gate to stay deterministic even if quests.js changes shape.
const BUILD_STEP_INDEX = 14;

// Wash channel geometry — kept at module scope so the construction system's
// blueprint coords (also y≈400) and the broken-bridge remnant decals stay
// visually consistent.
const WASH_Y = 400;
const WASH_HALF_HEIGHT = 40;

export default class DryWashScene extends LocalSceneBase {
  constructor() {
    super(SCENE_KEY);
    /** @type {ConstructionSystem|null} */
    this._construction = null;
    this._buildPhaseActive = false;
  }

  getSceneKey() { return SCENE_KEY; }
  getWorldSize() { return { width: 900, height: 600 }; }

  // ── Lifecycle ──────────────────────────────────────────────────────

  /**
   * Stash incoming scene-start data so create() can apply seamless-entry
   * placement after the player is constructed. Phaser passes whatever the
   * caller sent via `scene.start(key, data)`. World-map travel sends no
   * `entryEdge` → applySeamlessEntry is a no-op and the original spawn
   * behavior in LocalSceneBase.create() runs unchanged.
   *
   * @param {{ entryEdge?: string, vx?: number, vy?: number, facing?: string, seamless?: boolean }} [data]
   */
  init(data) {
    this._initData = data || null;
  }

  /**
   * Extends LocalSceneBase.create() to:
   *   1. Apply any seamless-entry payload (repositions player to the
   *      entry edge, restores velocity + facing). No-op when entered via
   *      world-map travel.
   *   2. Attach the cardinal edge sensors so walking off the west edge
   *      transitions back to NeighborhoodScene.
   */
  create() {
    super.create();
    applySeamlessEntry(this, this._initData);
    attachEdgeSensor(this, this.player, (edge) => {
      performSeamlessTransition(this, edge, this.player);
    });
  }

  // ── World construction ─────────────────────────────────────────────

  createWorld() {
    const { width, height } = this.getWorldSize();
    const state = this.registry.get('gameState') || {};

    // Mark first visit (used by future quest-hint UI; not gating).
    if (!state.visitedDryWash) {
      const updated = { ...state, visitedDryWash: true };
      this.registry.set('gameState', updated);
      saveGame(updated);
    }

    // ── Sky / background ──
    this.add.rectangle(width / 2, 120, width, 240, 0xf2c98f);
    // ── Sandy near-side ground ──
    this.add.rectangle(width / 2, 240, width, 240, 0xc8a274);
    // ── Far-side ground (slightly different tone to read as "across") ──
    this.add.rectangle(width / 2, height - 80, width, 160, 0xb89368);

    // ── Wash channel (jagged tan-brown arroyo at y≈400) ──
    this._renderWashChannel(width);

    // ── Distant mesa silhouette ──
    const mesa = this.add.graphics();
    mesa.fillStyle(0x9b7958, 0.6);
    mesa.fillTriangle(80, 220, 200, 60, 320, 220);
    mesa.fillTriangle(420, 220, 540, 90, 660, 220);
    mesa.fillTriangle(720, 220, 820, 110, 880, 220);

    // ── Decorative cacti / brush ──
    this.add.text(60, 300, '🌵', { fontSize: '34px' }).setOrigin(0.5).setDepth(2);
    this.add.text(width - 80, 320, '🌵', { fontSize: '28px' }).setOrigin(0.5).setDepth(2);
    this.add.text(width - 50, 200, '🌿', { fontSize: '22px' }).setOrigin(0.5).setDepth(2);
    this.add.text(140, 220, '🌿', { fontSize: '18px' }).setOrigin(0.5).setDepth(2);

    // ── Monsoon warning sign ──
    this._renderMonsoonSign(60, 200);

    // ── Broken bridge remnants — only visible until built ──
    if (!state.bridgeBuilt) {
      this._renderBrokenRemnants();
    }

    // ── Far-side locked trail indicator ──
    this._renderLockedTrail(width, height);

    // ── Mr. Chen NPC on the near side ──
    this._chenLastInteract = 0;
    this.addNpc({
      id: 'mr_chen',
      name: 'Mr. Chen',
      x: 200, y: 300,
      color: 0x6b3410,
      onInteract: () => this._onMrChenInteract(),
    });

    // ── Scene title ──
    this.add.text(width / 2, 30, '🏜️ Dry Wash', {
      fontSize: '18px', fontFamily: 'sans-serif', fontStyle: 'bold',
      color: '#7c2d12', stroke: '#fef3c7', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10).setScrollFactor(0);

    // ── Exit back to world map ──
    this.addExit({
      x: width / 2, y: height - 14,
      width: 220, height: 28,
      targetScene: 'WorldMapScene',
      targetSpawn: 'fromDryWash',
      label: '← World Map',
    });

    // ── Phase routing — visit / build / post-build ──
    this._initPhaseFromState(state);
  }

  // ── Visual subroutines ─────────────────────────────────────────────

  /**
   * Tan-brown jagged channel cutting horizontally across the scene with
   * darker shading at the bottom. Drawn entirely with Phaser Graphics so
   * we don't need any image assets.
   * @private
   */
  _renderWashChannel(width) {
    const g = this.add.graphics();
    // Floor of the channel
    g.fillStyle(0x8b6940, 1);
    g.fillRect(0, WASH_Y - WASH_HALF_HEIGHT, width, WASH_HALF_HEIGHT * 2);
    // Darker shading at the very bottom
    g.fillStyle(0x6b4d2a, 1);
    g.fillRect(0, WASH_Y + 10, width, WASH_HALF_HEIGHT - 10);
    // Jagged top edge
    g.fillStyle(0xc8a274, 1);
    let x = 0;
    while (x < width) {
      const dx = 18 + Math.floor(Math.random() * 14);
      const dy = -4 - Math.floor(Math.random() * 8);
      g.fillTriangle(x, WASH_Y - WASH_HALF_HEIGHT, x + dx, WASH_Y - WASH_HALF_HEIGHT, x + dx / 2, WASH_Y - WASH_HALF_HEIGHT + dy);
      x += dx;
    }
    // Jagged bottom edge
    x = 0;
    while (x < width) {
      const dx = 22 + Math.floor(Math.random() * 16);
      const dy = 4 + Math.floor(Math.random() * 6);
      g.fillStyle(0xb89368, 1);
      g.fillTriangle(x, WASH_Y + WASH_HALF_HEIGHT, x + dx, WASH_Y + WASH_HALF_HEIGHT, x + dx / 2, WASH_Y + WASH_HALF_HEIGHT + dy);
      x += dx;
    }
    // Pebbles on the wash floor
    const pebbles = this.add.graphics();
    pebbles.fillStyle(0x4a3520, 0.6);
    for (let i = 0; i < 28; i++) {
      const px = 20 + Math.random() * (width - 40);
      const py = WASH_Y - 18 + Math.random() * 50;
      pebbles.fillCircle(px, py, 2 + Math.random() * 2);
    }
  }

  /**
   * Cracked plank stumps + half-buried debris on both sides of the wash.
   * @private
   */
  _renderBrokenRemnants() {
    const g = this.add.graphics();
    g.lineStyle(0);

    // Near-side stub (left edge of wash)
    g.fillStyle(0x6b4423);
    g.fillRect(120, WASH_Y - 8, 60, 14);
    // Cracked end
    g.fillStyle(0x4a2e16);
    g.fillTriangle(180, WASH_Y - 8, 195, WASH_Y - 2, 178, WASH_Y + 6);

    // Near-side stub (slightly out into wash)
    g.fillStyle(0x6b4423);
    g.fillRect(170, WASH_Y - 4, 30, 8);

    // Far-side stub
    g.fillStyle(0x6b4423);
    g.fillRect(720, WASH_Y - 8, 60, 14);
    g.fillStyle(0x4a2e16);
    g.fillTriangle(720, WASH_Y - 8, 705, WASH_Y - 2, 722, WASH_Y + 6);

    // Loose half-buried beam in wash floor
    g.fillStyle(0x5a3920);
    g.fillRect(360, WASH_Y + 24, 80, 10);
    g.fillRect(540, WASH_Y + 28, 60, 8);

    // Splintered debris dots
    g.fillStyle(0x3a2310);
    g.fillCircle(245, WASH_Y + 20, 3);
    g.fillCircle(290, WASH_Y + 30, 2);
    g.fillCircle(620, WASH_Y + 26, 3);
    g.fillCircle(680, WASH_Y + 16, 2);

    // Tag the remnant graphics so we can hide it after build (defensive
    // — current flow re-renders the whole scene on revisit, so this is
    // mostly belt-and-suspenders).
    this._brokenRemnants = g;
  }

  /**
   * Wooden monsoon warning sign post.
   * @private
   */
  _renderMonsoonSign(x, y) {
    // Post
    this.add.rectangle(x, y + 30, 6, 60, 0x6b4423).setDepth(2);
    // Sign face
    const sign = this.add.rectangle(x, y, 64, 36, 0x8b6234).setStrokeStyle(2, 0x4a2e16).setDepth(2);
    sign.setOrigin(0.5);
    this.add.text(x, y - 4, '⚠', { fontSize: '14px' }).setOrigin(0.5).setDepth(3);
    this.add.text(x, y + 9, 'MONSOON', {
      fontSize: '7px', fontFamily: 'sans-serif',
      fontStyle: 'bold', color: '#fef3c7',
    }).setOrigin(0.5).setDepth(3);
  }

  /** Faint outline of a far-side trail with a 🔒 icon. @private */
  _renderLockedTrail(width, height) {
    const g = this.add.graphics();
    g.lineStyle(2, 0x6b5b3a, 0.45);
    g.beginPath();
    g.moveTo(width - 60, height - 90);
    g.lineTo(width - 30, height - 140);
    g.lineTo(width - 10, height - 200);
    g.strokePath();
    this.add.text(width - 30, height - 140, '🔒', { fontSize: '20px' })
      .setOrigin(0.5).setDepth(3).setAlpha(0.85);
    this.add.text(width - 30, height - 168, 'Far Trail', {
      fontSize: '10px', fontFamily: 'sans-serif',
      color: '#4a3520', fontStyle: 'bold',
      stroke: '#fef3c7', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3).setAlpha(0.9);
  }

  // ── Phase routing ──────────────────────────────────────────────────

  /** @private */
  _initPhaseFromState(state) {
    if (state.bridgeBuilt) {
      // Post-build — render the finished bridge, no construction system.
      this._renderFinishedBridgeOnly();
      return;
    }
    const aq = state.activeQuest;
    const onBuildStep = aq?.id === 'bridge_collapse' && (aq.stepIndex || 0) === BUILD_STEP_INDEX;
    if (onBuildStep) {
      this._mountConstruction();
    }
    // else — visit phase, nothing extra to do.
  }

  /**
   * Mount the ConstructionSystem with the mesquite blueprint. Wires
   * onPlace (inventory check) and onAllPlaced (bike load-test animation).
   * Uses autoCompleteAfterAllPlaced=false — this scene calls
   * completeBuild() explicitly after the bike crosses.
   * @private
   */
  _mountConstruction() {
    this._buildPhaseActive = true;
    this._construction = new ConstructionSystem(this, BRIDGE_MESQUITE_BLUEPRINT, {
      layer: this,
      drawGhost: (slot, layer) => this._drawGhostBeam(slot, layer),
      drawPlaced: (slot, layer) => this._drawPlacedBeam(slot, layer),
      onPlace: (slot, scene) => this._onPlaceBeam(slot, scene),
      onAllPlaced: (scene, system) => this._onAllPlaced(scene, system),
      autoCompleteAfterAllPlaced: false,
    });
    this._construction.mount();

    // Hint banner so the player knows what to do.
    this.time.delayedCall(400, () => {
      const audioMgr = this.registry.get('audioManager');
      audioMgr?.playSfx?.('ui_open');
      this.registry.set('mcpAlert', {
        id: 'dry_wash_build_intro',
        message: 'Click each ghost beam to place a mesquite plank across the wash.',
        severity: 'info',
      });
    });
  }

  /**
   * Render only the placed beams (post-build phase). Uses the same
   * drawPlaced primitive the construction system uses, so visual
   * consistency holds.
   * @private
   */
  _renderFinishedBridgeOnly() {
    for (const slot of BRIDGE_MESQUITE_BLUEPRINT.slots) {
      this._drawPlacedBeam(slot, this);
    }
  }

  // ── Render hooks (passed to ConstructionSystem) ───────────────────

  /**
   * Ghost-beam — a translucent dashed rectangle marking where a beam goes.
   * The returned object becomes the click target.
   * @private
   */
  _drawGhostBeam(slot, layer) {
    const w = slot.w || 130;
    const h = slot.h || 18;
    // Use a Rectangle as the click target — it has a built-in hit area.
    const ghost = layer.add.rectangle(slot.x, slot.y, w, h, 0xffffff, 0)
      .setStrokeStyle(2, 0xfacc15, 0.85)
      .setDepth(3);
    // Decorative hatch overlay
    const hatch = layer.add.graphics();
    hatch.lineStyle(1, 0xfacc15, 0.45);
    for (let i = -w / 2 + 6; i < w / 2; i += 10) {
      hatch.lineBetween(slot.x + i, slot.y - h / 2 + 1, slot.x + i + 6, slot.y + h / 2 - 1);
    }
    hatch.setDepth(3);
    // Tag hatch on the ghost so it's destroyed alongside it.
    ghost.once('destroy', () => { try { hatch.destroy(); } catch { /* swallow */ } });

    // Pulsing "place me" glow
    const glow = layer.add.text(slot.x, slot.y - 22, '+', {
      fontSize: '20px', fontFamily: 'sans-serif',
      color: '#facc15', fontStyle: 'bold',
      stroke: '#7c2d12', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(4);
    this.tweens.add({
      targets: glow, alpha: 0.4, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    ghost.once('destroy', () => { try { glow.destroy(); } catch { /* swallow */ } });

    return ghost;
  }

  /**
   * Placed beam — a solid mesquite plank.
   * @private
   */
  _drawPlacedBeam(slot, layer) {
    const w = slot.w || 130;
    const h = slot.h || 18;
    const beam = layer.add.rectangle(slot.x, slot.y, w, h, 0x8b5a2b)
      .setStrokeStyle(2, 0x4a2e16)
      .setDepth(3);
    // Wood-grain stripes
    const grain = layer.add.graphics();
    grain.lineStyle(1, 0x6b3f1a, 0.7);
    grain.lineBetween(slot.x - w / 2 + 4, slot.y - 3, slot.x + w / 2 - 4, slot.y - 3);
    grain.lineBetween(slot.x - w / 2 + 4, slot.y + 3, slot.x + w / 2 - 4, slot.y + 3);
    grain.setDepth(4);
    beam.once('destroy', () => { try { grain.destroy(); } catch { /* swallow */ } });
    return beam;
  }

  // ── ConstructionSystem callbacks ──────────────────────────────────

  /**
   * onPlace — gate placement on having at least one mesquite_wood_sample.
   * Per spec we don't actually consume; placing 4 beams from 1 sample is
   * acceptable gameplay simplification.
   * @private
   */
  _onPlaceBeam(_slot, scene) {
    const state = scene.registry.get('gameState') || {};
    const inv = state.inventory || [];
    if (!inv.includes('mesquite_wood_sample')) {
      scene.registry.set('mcpAlert', {
        id: 'dry_wash_no_mesquite',
        message: 'You need a mesquite wood sample to place a beam. Forage one first.',
        severity: 'warning',
      });
      const audioMgr = scene.registry.get('audioManager');
      audioMgr?.playSfx?.('ui_error');
      return false;
    }
    return true;
  }

  /**
   * onAllPlaced — runs the bike load-test animation, then explicitly
   * resolves so the host can call completeBuild(). Returns a Promise
   * the system awaits.
   * @private
   */
  _onAllPlaced(scene, system) {
    return new Promise((resolve) => {
      const audioMgr = scene.registry.get('audioManager');
      audioMgr?.playSfx?.('ui_success');

      const { width } = this.getWorldSize();
      // Spawn a bike sprite at the left edge of the bridge.
      const bike = scene.add.text(0, WASH_Y - 14, '🚴', { fontSize: '34px' })
        .setOrigin(0.5).setDepth(6);
      // Tween across the bridge.
      scene.tweens.add({
        targets: bike,
        x: width,
        duration: 2500,
        ease: 'Linear',
        onComplete: () => {
          scene.time.delayedCall(300, () => {
            try { bike.destroy(); } catch { /* swallow */ }
            // Explicitly call completeBuild — autoCompleteAfterAllPlaced is false.
            try { system.completeBuild(); } catch (e) {
              // eslint-disable-next-line no-console
              console.warn('[DryWashScene] completeBuild threw', e);
            }
            resolve();
          });
        },
      });
    });
  }

  // ── NPC interaction ───────────────────────────────────────────────

  /** @private */
  _onMrChenInteract() {
    const state = this.registry.get('gameState') || {};
    if (state.bridgeBuilt) {
      this.registry.set('dialogEvent', {
        speaker: 'Mr. Chen',
        text:
          "Beautiful work, Zuzu. The mesquite holds up just like the data said it would. " +
          "Every time you cross this wash now, that's engineering you can stand on.",
        choices: null, step: null,
      });
      return;
    }
    const aq = state.activeQuest;
    const onBuildStep = aq?.id === 'bridge_collapse' && (aq.stepIndex || 0) === BUILD_STEP_INDEX;
    if (onBuildStep) {
      this.registry.set('dialogEvent', {
        speaker: 'Mr. Chen',
        text:
          "Place each mesquite beam across the wash — click the yellow outlines. " +
          "Once they're all down, we'll roll a loaded bike across to test it.",
        choices: null, step: null,
      });
      return;
    }
    // Visit phase
    this.registry.set('dialogEvent', {
      speaker: 'Mr. Chen',
      text:
        "This is the wash that floods every monsoon, Zuzu. The old bridge gave out. " +
        "Before we rebuild, we have to pick the RIGHT material — collect samples, " +
        "weigh them, test their strength. Come find me back at the lab when you're ready.",
      choices: null, step: null,
    });
  }
}

// ── HMR ──────────────────────────────────────────────────────────
registerSceneHmr(SCENE_KEY, import.meta.hot, DryWashScene);
