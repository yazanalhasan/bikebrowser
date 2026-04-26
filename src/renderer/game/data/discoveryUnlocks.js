/**
 * discoveryUnlocks.js — maps world-location IDs to quest unlock specs.
 *
 * When a player discovers a world-map location (nodeId), the wiring in
 * questSystem.initDiscoveryQuestBridge() looks up the locationId here
 * and calls startQuest() for any non-pending entry.
 *
 * Schema per entry:
 *   questId  {string|null}  — The quest ID to unlock. Must exist in quests.js.
 *                             Checked by runtimeAudit `entry.quest || entry.questId`.
 *   pending  {boolean}      — true if no suitable quest exists yet; wiring skips it.
 *   todo     {string}       — (pending:true only) description of the missing quest.
 *
 * IMPORTANT — audit compatibility note:
 *   runtimeAudit.auditDiscoveryUnlocks() validates keys against regions.js IDs
 *   (arizona, andes, arabian, etc.). These keys are WORLD_LOCATIONS IDs
 *   (locationIds from worldMapData.js), which is the correct granularity for
 *   per-location discovery events. The audit check is therefore too coarse and
 *   will report errors for these valid keys. A future cycle should update
 *   auditDiscoveryUnlocks() to also accept worldMapData location IDs.
 *   See: src/renderer/game/systems/runtimeAudit.js — auditDiscoveryUnlocks()
 *
 * Data only — no logic here. Wiring lives in questSystem.initDiscoveryQuestBridge().
 */

export const DISCOVERY_UNLOCKS = {
  /**
   * Sonoran Foraging Grounds — desert ecology, plant harvesting.
   * Unlocks: desert_healer (ecology quest with Mrs. Ramirez).
   * Theme match: foraging grounds → medicinal plant quest is the natural intro.
   */
  desert_foraging: {
    questId: 'desert_healer',
    pending: false,
  },

  /**
   * Abandoned Copper Mine — conductivity and materials science.
   * Unlocks: bridge_collapse (materials quest that explicitly uses copper ore mining).
   * Theme match: mine discovery → materials/stress/strain intro quest.
   */
  copper_mine: {
    questId: 'bridge_collapse',
    pending: false,
  },

  /**
   * Salt River Basin — fluid dynamics and ecological balance.
   * Unlocks: boat_puzzle (buoyancy/density, Archimedes' Principle).
   * Theme match: river/waterway discovery → fluid physics / buoyancy quest.
   * Note: the_living_fluid is also thematically adjacent (non-Newtonian fluid)
   * but boat_puzzle is the primary intro to fluid/water physics in quests.js.
   */
  salt_river: {
    questId: 'boat_puzzle',
    pending: false,
  },

  /**
   * Superstition Mountains — rugged peaks, minerals, ancient trails.
   * No matching force/gravity/incline quest exists in quests.js yet.
   * one_sided_forest (Möbius cave) is the closest (cave system in a mountain),
   * but it's topology/math — not force/gravity/incline. Leaving pending.
   */
  mountain_range: {
    questId: null,
    pending: true,
    todo: 'Need a force/gravity/incline intro quest for mountain region — one_sided_forest is topology, not physics.',
  },
};

export default DISCOVERY_UNLOCKS;
