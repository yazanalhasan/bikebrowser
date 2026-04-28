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
 * Keys are WORLD_LOCATIONS ids (per-location granularity); the audit accepts
 * either regions.js region ids or WORLD_LOCATIONS keys.
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

  // mountain_range removed 2026-04-28: it is a worldMapData REGIONS placeholder
  // (not a WORLD_LOCATIONS key) and has no per-location discovery event to fire on.
  // It also had no quest dependency (pending:true, questId:null). Re-add when a
  // mountain *location* is added to WORLD_LOCATIONS and a force/gravity/incline
  // intro quest exists.
};

export default DISCOVERY_UNLOCKS;
