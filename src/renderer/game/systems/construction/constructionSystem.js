/**
 * ConstructionSystem — reusable "place parts → validate → permanent world
 * change" backbone.
 *
 * Designed to be MOUNTED inside a Phaser scene (not extended from). The host
 * scene owns the visuals (drawGhost, drawPlaced render hooks) and any post-
 * completion behaviors (tweens, NPC reactions, scene swapping). The system
 * owns lifecycle: restore-from-state, click wiring, persistence, completion
 * dispatch.
 *
 * First consumer: DryWashScene (bridge_collapse step 15 — build_bridge).
 * Future consumer: shelter construction.
 *
 * Pattern mirrors LabRigBase._emitCompletionDialog — same observation push +
 * `step: state.activeQuest` tagging so LocalSceneBase.advanceFromDialog can
 * advance the quest cleanly.
 */

import { saveGame } from '../saveSystem.js';

/**
 * @typedef {Object} ConstructionSlot
 * @property {string} id           Unique within blueprint.
 * @property {number} x            Scene-space x.
 * @property {number} y            Scene-space y.
 * @property {number} [w]          Optional width hint for renderers.
 * @property {number} [h]          Optional height hint for renderers.
 * @property {string} [type]       Optional grouping tag (beam, wall, fastener).
 * @property {string} [requiredItem] Optional item-id gate the host can read.
 *
 * @typedef {Object} ConstructionCompletion
 * @property {string} observation        Observation string emitted on complete.
 * @property {string} [stateFlag]        Boolean flag set on state at completion.
 * @property {string} [questId]          If matches activeQuest.id, dialog is
 *                                       tagged with `step: state.activeQuest`.
 * @property {string} dialogSpeaker      Speaker name in the completion dialog.
 * @property {string} dialogText         Body text in the completion dialog.
 *
 * @typedef {Object} ConstructionBlueprint
 * @property {string} id
 * @property {string} name
 * @property {ConstructionSlot[]} slots
 * @property {string} stateKey                // gameState field for placed ids
 * @property {ConstructionCompletion} completion
 *
 * @typedef {Object} ConstructionSystemOpts
 * @property {Phaser.GameObjects.Container|Phaser.Scene} [layer]
 *           Container to draw into. Falls back to `scene` (which works as a
 *           factory in Phaser too).
 * @property {(slot: ConstructionSlot, layer: any, scene: Phaser.Scene) => Phaser.GameObjects.GameObject} drawGhost
 *           Required. Host renders a ghost/placeholder for an empty slot.
 *           Returned object becomes the click target — the system makes it
 *           interactive and wires pointerdown to tryPlace(slot.id).
 * @property {(slot: ConstructionSlot, layer: any, scene: Phaser.Scene) => Phaser.GameObjects.GameObject} drawPlaced
 *           Required. Host renders the placed/finished sprite for a slot.
 * @property {(slot: ConstructionSlot, scene: Phaser.Scene) => (boolean|Promise<boolean>)} [onPlace]
 *           Called BEFORE the ghost→placed swap. Return false to abort
 *           (e.g. inventory check failed). Async ok — the system awaits.
 * @property {(scene: Phaser.Scene, system: ConstructionSystem) => (void|Promise<void>)} [onAllPlaced]
 *           Called when last slot lands, BEFORE completeBuild() emits.
 *           Subclass load-test animations go here. Async ok.
 * @property {boolean} [autoCompleteAfterAllPlaced=true]
 *           If false, the host must call system.completeBuild() explicitly
 *           after onAllPlaced. Useful when the host wants to gate completion
 *           on an animation it owns.
 */

export class ConstructionSystem {
  /**
   * @param {Phaser.Scene} scene
   * @param {ConstructionBlueprint} blueprint
   * @param {ConstructionSystemOpts} opts
   */
  constructor(scene, blueprint, opts = {}) {
    if (!scene) throw new Error('[ConstructionSystem] scene is required');
    if (!blueprint) throw new Error('[ConstructionSystem] blueprint is required');
    if (typeof opts.drawGhost !== 'function') {
      throw new Error('[ConstructionSystem] opts.drawGhost is required');
    }
    if (typeof opts.drawPlaced !== 'function') {
      throw new Error('[ConstructionSystem] opts.drawPlaced is required');
    }

    this.scene = scene;
    this.blueprint = blueprint;
    this.opts = opts;
    this.layer = opts.layer || scene;
    this._mounted = false;
    this._completed = false;
    /** @type {Map<string, Phaser.GameObjects.GameObject>} */
    this._ghostObjects = new Map();
    /** @type {Map<string, Phaser.GameObjects.GameObject>} */
    this._placedObjects = new Map();
    /** @type {boolean} */
    this._completing = false;
  }

  // ── State helpers ────────────────────────────────────────────────────

  /**
   * Read the persisted list of placed slot ids from save state. Always
   * returns an array (defaults to []) even on a fresh save.
   * @returns {string[]}
   */
  getPlacedSlotIds() {
    const state = this.scene.registry.get('gameState') || {};
    const arr = state[this.blueprint.stateKey];
    return Array.isArray(arr) ? arr : [];
  }

  /** True once every blueprint slot id is present in state. */
  isComplete() {
    const placed = this.getPlacedSlotIds();
    return this.blueprint.slots.every(s => placed.includes(s.id));
  }

  // ── Mount / unmount ──────────────────────────────────────────────────

  /**
   * Render the construction site. Already-placed slots come back as
   * `drawPlaced` sprites; empty slots become interactive `drawGhost`
   * sprites. If state shows the build is already finished, no ghosts
   * render and onAllPlaced/completeBuild are NOT re-fired (revisit
   * idempotency: a finished bridge is just a finished bridge).
   */
  mount() {
    if (this._mounted) return;
    this._mounted = true;

    const placed = new Set(this.getPlacedSlotIds());
    const fullyBuilt = this.isComplete();

    for (const slot of this.blueprint.slots) {
      if (placed.has(slot.id)) {
        this._renderPlaced(slot);
      } else {
        this._renderGhost(slot);
      }
    }

    if (fullyBuilt) {
      // Revisit case — leave it as a finished build. Mark as completed so
      // any post-mount tryPlace calls (defensive) become no-ops.
      this._completed = true;
    }
  }

  /**
   * Tear down all rendered objects. Called by the host when leaving the
   * scene or rebuilding (e.g. HMR). Does NOT mutate save state.
   */
  unmount() {
    if (!this._mounted) return;
    for (const obj of this._ghostObjects.values()) {
      try { obj.destroy(); } catch { /* swallow */ }
    }
    for (const obj of this._placedObjects.values()) {
      try { obj.destroy(); } catch { /* swallow */ }
    }
    this._ghostObjects.clear();
    this._placedObjects.clear();
    this._mounted = false;
  }

  // ── Rendering primitives ─────────────────────────────────────────────

  /**
   * Render a ghost sprite for an empty slot and wire it for click-to-place.
   * @private
   */
  _renderGhost(slot) {
    const obj = this.opts.drawGhost(slot, this.layer, this.scene);
    if (!obj) return;
    if (typeof obj.setInteractive === 'function') {
      obj.setInteractive({ useHandCursor: true });
    }
    if (typeof obj.on === 'function') {
      obj.on('pointerdown', () => { this.tryPlace(slot.id); });
    }
    this._ghostObjects.set(slot.id, obj);
  }

  /** Render a placed sprite at the slot's position. @private */
  _renderPlaced(slot) {
    const obj = this.opts.drawPlaced(slot, this.layer, this.scene);
    if (obj) this._placedObjects.set(slot.id, obj);
  }

  // ── Placement flow ───────────────────────────────────────────────────

  /**
   * Attempt to place the given slot. Awaits opts.onPlace; if it returns
   * false, aborts. Otherwise swaps ghost→placed, persists, and (if the
   * blueprint is now complete) fires opts.onAllPlaced + completeBuild.
   *
   * @param {string} slotId
   * @returns {Promise<boolean>} true if placement landed.
   */
  async tryPlace(slotId) {
    if (!this._mounted || this._completed) return false;
    const slot = this.blueprint.slots.find(s => s.id === slotId);
    if (!slot) return false;
    if (this.getPlacedSlotIds().includes(slotId)) return false;

    if (typeof this.opts.onPlace === 'function') {
      let ok;
      try {
        ok = await this.opts.onPlace(slot, this.scene);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[ConstructionSystem] onPlace threw', e);
        ok = false;
      }
      if (ok === false) return false;
    }

    // Swap ghost → placed.
    const ghost = this._ghostObjects.get(slotId);
    if (ghost) {
      try { ghost.destroy(); } catch { /* swallow */ }
      this._ghostObjects.delete(slotId);
    }
    this._renderPlaced(slot);

    // Persist.
    const state = this.scene.registry.get('gameState') || {};
    const placed = this.getPlacedSlotIds();
    if (!placed.includes(slotId)) {
      const nextPlaced = [...placed, slotId];
      const updated = { ...state, [this.blueprint.stateKey]: nextPlaced };
      this.scene.registry.set('gameState', updated);
      saveGame(updated);
    }

    // Pickup-style audio nudge — best-effort.
    try {
      const audioMgr = this.scene.registry.get('audioManager');
      audioMgr?.playSfx?.('item_pickup');
    } catch { /* swallow */ }

    // Completion check.
    if (this.isComplete() && !this._completing) {
      this._completing = true;
      if (typeof this.opts.onAllPlaced === 'function') {
        try {
          await this.opts.onAllPlaced(this.scene, this);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[ConstructionSystem] onAllPlaced threw', e);
        }
      }
      const auto = this.opts.autoCompleteAfterAllPlaced !== false;
      if (auto) this.completeBuild();
      this._completing = false;
    }

    return true;
  }

  // ── Completion dispatch ──────────────────────────────────────────────

  /**
   * Emit the completion contract:
   *   1. Push blueprint.completion.observation into state.observations
   *      (deduped).
   *   2. Set blueprint.completion.stateFlag (if specified) to true.
   *   3. Fire a dialog event tagged with `step: state.activeQuest` IFF
   *      state.activeQuest.id matches blueprint.completion.questId.
   *
   * Idempotent — running twice is a no-op (the observation/flag are
   * already set, and `_completed` short-circuits the dialog re-emit).
   */
  completeBuild() {
    if (this._completed) return;
    this._completed = true;

    const completion = this.blueprint.completion || {};
    const liveState = this.scene.registry.get('gameState') || {};

    // 1. Push observation (deduped).
    let updated = liveState;
    if (completion.observation) {
      const observations = Array.isArray(liveState.observations)
        ? liveState.observations
        : [];
      if (!observations.includes(completion.observation)) {
        updated = { ...updated, observations: [...observations, completion.observation] };
      }
    }

    // 2. Set state flag (if specified).
    if (completion.stateFlag) {
      updated = { ...updated, [completion.stateFlag]: true };
    }

    if (updated !== liveState) {
      this.scene.registry.set('gameState', updated);
      saveGame(updated);
    }

    // 3. Fire dialog. Tag with `step: activeQuest` so the dialog handler
    //    advances the quest via LocalSceneBase.advanceFromDialog.
    if (completion.dialogSpeaker && completion.dialogText) {
      const aq = updated.activeQuest;
      const matchesQuest = !!completion.questId && aq?.id === completion.questId;
      this.scene.registry.set('dialogEvent', {
        speaker: completion.dialogSpeaker,
        text: completion.dialogText,
        choices: null,
        step: matchesQuest ? aq : null,
      });
    }
  }
}

export default ConstructionSystem;
