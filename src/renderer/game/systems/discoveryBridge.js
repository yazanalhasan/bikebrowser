/**
 * discoveryBridge.js — quest ↔ discovery wiring (REVERSE direction).
 *
 * Forward direction (already wired by world-discovery-quests in
 * questSystem.initDiscoveryQuestBridge):
 *   when a player discovers a location, queue an unlock for the quest
 *   listed in DISCOVERY_UNLOCKS[locationId].questId.
 *
 * Reverse direction (this module — bridge_collapse soft-lock fix):
 *   when a quest becomes active (via startQuest, or rehydrated from a
 *   loaded save), reveal the locations associated with it so the player
 *   can find their way. Without this, the world-map fog-of-war added by
 *   commit 5360e29 (world-node-gating) hides the quest's required
 *   locations and the player has no way to make progress — e.g.
 *   `bridge_collapse` step 6 needs `copper_ore_sample` from MountainScene
 *   /CopperMineScene, but those nodes stay fogged.
 *
 * The reverse map is computed once at module load by inverting
 * DISCOVERY_UNLOCKS. Pending entries (questId === null) are skipped.
 *
 * Mounting order:
 *   - If the WorldMapScene is currently mounted, reveal directly via
 *     `scene.revealNode(id)` for the animated reveal.
 *   - Otherwise queue the location id in `_pendingReveals`. WorldMapScene
 *     drains the queue in its create() via `_drainPendingReveals(this)`.
 *   - The pending queue is in-module memory only — it does not survive
 *     a page reload. That is fine: quest activation re-fires on save-load,
 *     so the next mount will see fresh queued reveals.
 *
 * Idempotency:
 *   `revealNode` is itself idempotent against already-revealed tiles
 *   (revealArea uses a Set; redrawFog is a fresh draw). Callers do not
 *   need to dedupe.
 */

import { DISCOVERY_UNLOCKS } from '../data/discoveryUnlocks.js';
import { WORLD_LOCATIONS } from '../data/worldMapData.js';

const QUEST_TARGET_REVEALS = {
  bridge_collapse: ['dry_wash'],
};

// Inverse: questId → [locationId, ...]. Built once at module load.
const QUEST_TO_LOCATIONS = (() => {
  const out = {};
  for (const [locId, spec] of Object.entries(DISCOVERY_UNLOCKS)) {
    if (!spec || spec.pending) continue;
    const qid = spec.questId;
    if (!qid) continue;
    if (!out[qid]) out[qid] = [];
    out[qid].push(locId);
  }
  for (const [questId, locIds] of Object.entries(QUEST_TARGET_REVEALS)) {
    if (!out[questId]) out[questId] = [];
    for (const locId of locIds) {
      if (!out[questId].includes(locId)) out[questId].push(locId);
    }
  }
  return out;
})();

/**
 * Pending reveals: location ids that need to be revealed but
 * WorldMapScene wasn't mounted at the time. Drained by
 * `_drainPendingReveals` when WorldMapScene next mounts.
 * @type {Set<string>}
 */
const _pendingReveals = new Set();

/**
 * Reveal all locations associated with the given quest. If `scene` is
 * the active WorldMapScene, prefer `scene.revealNode(id)` for the
 * animated reveal. Otherwise queue the location id; WorldMapScene
 * will drain the queue on its next mount.
 *
 * @param {string} questId
 * @param {Phaser.Scene|null} [scene] — optional WorldMapScene instance.
 */
export function revealLocationsByQuestId(questId, scene = null) {
  if (!questId) return;
  const locs = QUEST_TO_LOCATIONS[questId] || [];
  if (locs.length === 0) return;

  for (const id of locs) {
    const loc = WORLD_LOCATIONS[id];
    if (!loc) continue;

    const isWorldMapMounted =
      scene &&
      scene.scene &&
      scene.scene.key === 'WorldMapScene' &&
      typeof scene.revealNode === 'function';

    if (isWorldMapMounted) {
      try {
        scene.revealNode(id);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[discoveryBridge] revealNode failed for', id, e);
        _pendingReveals.add(id);
      }
    } else {
      _pendingReveals.add(id);
    }
  }
}

/**
 * Drain queued reveals. Called by WorldMapScene.create() AFTER
 * `_mapLayout` is established so revealNode can compute pixel coords.
 * Returns the location ids that were drained (for logging/telemetry).
 *
 * @param {Phaser.Scene} scene — WorldMapScene instance with revealNode().
 * @returns {string[]} drained location ids
 */
export function _drainPendingReveals(scene) {
  if (_pendingReveals.size === 0) return [];
  const drained = Array.from(_pendingReveals);
  _pendingReveals.clear();
  if (!scene || typeof scene.revealNode !== 'function') return drained;
  for (const id of drained) {
    try {
      scene.revealNode(id);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[discoveryBridge] revealNode failed during drain for', id, e);
    }
  }
  return drained;
}

/**
 * Drive reveals from a save state. Idempotent against already-revealed
 * tiles. Safe to call on:
 *   - quest start (startQuest in questSystem.js)
 *   - save load (after loadGame seeds gameState)
 *
 * @param {object} state — game save state
 * @param {Phaser.Scene|null} [scene] — optional WorldMapScene instance
 */
export function triggerQuestRevealsForState(state, scene = null) {
  const aq = state && state.activeQuest;
  if (!aq || !aq.id) return;
  revealLocationsByQuestId(aq.id, scene);
}

/**
 * Internal/test helper — returns the inverse map for assertions.
 */
export function _debugGetQuestToLocations() {
  return QUEST_TO_LOCATIONS;
}
