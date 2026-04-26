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
 * @property {('click'|'drag')} [mode]        Optional placement mode. When
 *                                            absent or 'click' (default), the
 *                                            host's ghost is wired with
 *                                            pointerdown→tryPlace (legacy
 *                                            click-to-place). When 'drag',
 *                                            pointerdown lifts a draggable
 *                                            "moving" beam that follows the
 *                                            pointer; pointerup over any
 *                                            unplaced ghost-slot anchor calls
 *                                            tryPlace(slotId); pointerup
 *                                            elsewhere or Escape cancels.
 *                                            Anchor-validity is delegated to
 *                                            tryPlace — drag mode only
 *                                            decides which slot id to attempt.
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

    // ── Drag-mode state (only used when blueprint.mode === 'drag') ──
    /** @type {?{ slotId: string, ghost: any, originX: number, originY: number }} */
    this._dragState = null;
    /** @type {?Function} */
    this._dragMoveHandler = null;
    /** @type {?Function} */
    this._dragUpHandler = null;
    /** @type {?Function} */
    this._dragKeyHandler = null;
  }

  /**
   * @returns {boolean} True iff this blueprint opted into drag-and-drop
   *   placement. Absence of the field (or 'click') falls back to the
   *   legacy click-to-place wiring — backwards compatible by design.
   * @private
   */
  _isDragMode() {
    return this.blueprint.mode === 'drag';
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
    // Cancel any in-flight drag so scene-level listeners don't leak.
    if (this._dragState) this._cancelDrag();
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
   * Render a ghost sprite for an empty slot and wire it for click-to-place
   * (default) or drag-and-drop (when blueprint.mode === 'drag').
   *
   * Click mode (legacy, default): `pointerdown` on the ghost calls
   *   `tryPlace(slot.id)` directly.
   *
   * Drag mode: `pointerdown` on the ghost lifts a "moving" copy that
   *   follows the pointer (see `_beginDrag`). The original ghost stays
   *   in place and acts as a drop anchor. Release over any unplaced
   *   ghost slot triggers `tryPlace(slotId)` for that slot.
   *
   * @private
   */
  _renderGhost(slot) {
    const obj = this.opts.drawGhost(slot, this.layer, this.scene);
    if (!obj) return;
    if (typeof obj.setInteractive === 'function') {
      obj.setInteractive({ useHandCursor: true });
    }
    if (typeof obj.on === 'function') {
      if (this._isDragMode()) {
        obj.on('pointerdown', (pointer) => { this._beginDrag(slot, obj, pointer); });
      } else {
        obj.on('pointerdown', () => { this.tryPlace(slot.id); });
      }
    }
    this._ghostObjects.set(slot.id, obj);
  }

  /** Render a placed sprite at the slot's position. @private */
  _renderPlaced(slot) {
    const obj = this.opts.drawPlaced(slot, this.layer, this.scene);
    if (obj) this._placedObjects.set(slot.id, obj);
  }

  // ── Drag-mode handlers (only active when blueprint.mode === 'drag') ──

  /**
   * Begin a drag-and-drop placement. Spawns a "moving" ghost that follows
   * the pointer and registers scene-level pointermove/pointerup/Escape
   * handlers. The original ghost on the slot stays in place as a drop
   * anchor (also the cancel-target if the player drops back where they
   * picked up). Anchor-validity is delegated to `tryPlace` itself — drag
   * code only decides which slot id to attempt on release.
   *
   * @param {ConstructionSlot} slot
   * @param {Phaser.GameObjects.GameObject} sourceGhost The original ghost
   *   the player pressed down on. Used as the visual template for the
   *   moving copy via opts.drawGhost(slot, layer, scene).
   * @param {Phaser.Input.Pointer} pointer
   * @private
   */
  _beginDrag(slot, sourceGhost, pointer) {
    if (!this._mounted || this._completed) return;
    if (this._dragState) return; // already dragging
    if (this.getPlacedSlotIds().includes(slot.id)) return;

    // Spawn a "moving" ghost the same way the host renders a slot ghost,
    // so the drag visual matches the design without forking primitives.
    let movingGhost = null;
    try {
      movingGhost = this.opts.drawGhost(slot, this.layer, this.scene);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[ConstructionSystem] drawGhost threw during drag', e);
      return;
    }
    if (!movingGhost) return;

    // The moving ghost must NOT be interactive — it would steal hit-tests
    // from the underlying anchors we're trying to drop onto.
    try { movingGhost.disableInteractive?.(); } catch { /* swallow */ }
    try { movingGhost.setAlpha?.(0.75); } catch { /* swallow */ }
    try { movingGhost.setDepth?.(50); } catch { /* swallow */ }

    // Position at pointer immediately.
    const px = pointer?.worldX ?? pointer?.x ?? slot.x;
    const py = pointer?.worldY ?? pointer?.y ?? slot.y;
    try { movingGhost.setPosition?.(px, py); } catch { /* swallow */ }

    // Dim the source ghost so it reads as "lifted".
    try { sourceGhost.setAlpha?.(0.35); } catch { /* swallow */ }

    this._dragState = {
      slotId: slot.id,
      ghost: movingGhost,
      originX: slot.x,
      originY: slot.y,
    };

    // Scene-level move/up handlers — pointerdown on the ghost only fires
    // once, but move/up belong to the scene's input plugin so the player
    // can drag anywhere.
    const input = this.scene.input;
    if (!input) {
      this._cancelDrag();
      return;
    }

    this._dragMoveHandler = (mp) => this._onDragMove(mp);
    this._dragUpHandler = (mp) => this._onDragUp(mp);
    input.on('pointermove', this._dragMoveHandler);
    input.on('pointerup', this._dragUpHandler);
    input.on('pointerupoutside', this._dragUpHandler);

    // Escape → cancel.
    if (input.keyboard) {
      this._dragKeyHandler = (ev) => {
        if (ev?.key === 'Escape' || ev?.code === 'Escape') this._cancelDrag();
      };
      input.keyboard.on('keydown', this._dragKeyHandler);
    }
  }

  /** Update the moving ghost to track the pointer. @private */
  _onDragMove(pointer) {
    const ds = this._dragState;
    if (!ds || !ds.ghost) return;
    const px = pointer?.worldX ?? pointer?.x;
    const py = pointer?.worldY ?? pointer?.y;
    if (typeof px !== 'number' || typeof py !== 'number') return;
    try { ds.ghost.setPosition?.(px, py); } catch { /* swallow */ }
  }

  /**
   * Handle pointerup. Hit-test the pointer against every unplaced ghost
   * slot's bounds; if the pointer landed inside one, attempt placement on
   * THAT slot id (which may differ from the slot the player picked up
   * from — playful but matches the spec's "drop on a valid anchor"). If
   * no anchor was hit, cancel.
   *
   * @private
   */
  async _onDragUp(pointer) {
    const ds = this._dragState;
    if (!ds) return;
    const px = pointer?.worldX ?? pointer?.x;
    const py = pointer?.worldY ?? pointer?.y;

    let hitSlotId = null;
    if (typeof px === 'number' && typeof py === 'number') {
      hitSlotId = this._hitTestAnchors(px, py);
    }

    // Tear the drag state down BEFORE awaiting tryPlace — the latter is
    // async and may take frames (onPlace can be async too).
    this._endDrag();

    if (hitSlotId) {
      // tryPlace handles "already placed" / "completed" / "onPlace returned
      // false" — drag code does NOT duplicate any of that validity logic.
      await this.tryPlace(hitSlotId);
    }
    // Else: no valid anchor under pointer → silent cancel. Already done.
  }

  /**
   * Hit-test (px, py) against every unplaced ghost slot's bounding rect.
   * Returns the first matching slot id, or null. Uses the slot's
   * authored x/y/w/h (falling back to small defaults if w/h are absent
   * — same defaults the host typically uses when rendering).
   *
   * @param {number} px
   * @param {number} py
   * @returns {?string}
   * @private
   */
  _hitTestAnchors(px, py) {
    const placed = new Set(this.getPlacedSlotIds());
    for (const slot of this.blueprint.slots) {
      if (placed.has(slot.id)) continue;
      if (!this._ghostObjects.has(slot.id)) continue;
      const w = slot.w || 32;
      const h = slot.h || 32;
      const left = slot.x - w / 2;
      const right = slot.x + w / 2;
      const top = slot.y - h / 2;
      const bottom = slot.y + h / 2;
      if (px >= left && px <= right && py >= top && py <= bottom) {
        return slot.id;
      }
    }
    return null;
  }

  /** Cancel an in-flight drag. Idempotent. @private */
  _cancelDrag() {
    if (!this._dragState) return;
    this._endDrag();
  }

  /**
   * Tear down moving ghost + scene-level listeners. Restores the source
   * ghost's alpha. Idempotent. @private
   */
  _endDrag() {
    const ds = this._dragState;
    this._dragState = null;

    if (ds?.ghost) {
      try { ds.ghost.destroy(); } catch { /* swallow */ }
    }
    if (ds?.slotId) {
      const sourceGhost = this._ghostObjects.get(ds.slotId);
      if (sourceGhost) {
        try { sourceGhost.setAlpha?.(1); } catch { /* swallow */ }
      }
    }

    const input = this.scene?.input;
    if (input) {
      if (this._dragMoveHandler) {
        try { input.off('pointermove', this._dragMoveHandler); } catch { /* swallow */ }
      }
      if (this._dragUpHandler) {
        try { input.off('pointerup', this._dragUpHandler); } catch { /* swallow */ }
        try { input.off('pointerupoutside', this._dragUpHandler); } catch { /* swallow */ }
      }
      if (input.keyboard && this._dragKeyHandler) {
        try { input.keyboard.off('keydown', this._dragKeyHandler); } catch { /* swallow */ }
      }
    }

    this._dragMoveHandler = null;
    this._dragUpHandler = null;
    this._dragKeyHandler = null;
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
