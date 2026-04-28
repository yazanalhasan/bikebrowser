/**
 * sceneItemGrants.js — declarative source of truth for which scenes
 * grant which item ids. Used by progressionReachabilityAudit.
 *
 * Each entry: sceneKey → array of { itemId, condition? }
 *   condition is optional — describes when the grant fires:
 *     - { activeQuest: <questId>, stepIndex?: <n> } — fires only during quest
 *     - { transform: <name> } — synthesized from other items (band-aid mapping)
 *
 * This file MUST be kept in sync with actual scene grant code by hand.
 * A future cycle could replace it with metadata-decorated scenes; for
 * now hand-curation is acceptable.
 *
 * Coverage status (2026-04-25):
 *   - StreetBlockScene, DogParkScene, DesertForagingScene, CopperMineScene,
 *     SaltRiverScene, MountainScene, ZuzuGarageScene populated.
 *   - Quest reward grants are tracked separately by quests.js `reward.items`.
 *   - Starting inventory is tracked by saveSystem.js initial state.
 *
 * If a scene/grant pair is missing here, the audit will warn (INCOMPLETE_DATA)
 * rather than error — better to flag a gap than to spuriously block CI.
 */

export const SCENE_ITEM_GRANTS = {
  // Foraging plant interactions in StreetBlockScene (PLANT_INFO map).
  StreetBlockScene: [
    { itemId: 'mesquite_pods' },
    { itemId: 'mesquite_wood_sample' },
    { itemId: 'creosote_leaves' },
    { itemId: 'prickly_pear_fruit' },
    { itemId: 'barrel_cactus_pulp' },
    { itemId: 'jojoba_seeds' },
    { itemId: 'agave_fiber' },
    { itemId: 'yucca_root' },
    { itemId: 'desert_lavender_flowers' },
    { itemId: 'ephedra_stems' },
    { itemId: 'yerba_mansa_root' },
  ],

  DogParkScene: [
    { itemId: 'ephedra_stems' },
    { itemId: 'yerba_mansa_root' },
    { itemId: 'creosote_leaves' },
  ],

  DesertForagingScene: [
    { itemId: 'yucca_fiber' },
    { itemId: 'agave_fiber' },
    { itemId: 'jojoba_extract' },
    { itemId: 'creosote_resin' },
    { itemId: 'cactus_water' },
  ],

  CopperMineScene: [
    { itemId: 'surface_copper' },
    { itemId: 'deep_copper' },
    // Band-aid: CopperMineScene mints copper_ore_sample when player has
    // surface_copper or deep_copper while bridge_collapse is active.
    {
      itemId: 'copper_ore_sample',
      condition: {
        activeQuest: 'bridge_collapse',
        transform: 'surface_or_deep_copper_mapping',
      },
    },
  ],

  SaltRiverScene: [
    { itemId: 'algae_sample' },
    { itemId: 'microbial_sample' },
    { itemId: 'river_minerals' },
    { itemId: 'reed_fiber' },
  ],

  MountainScene: [
    // Granted on a quest checkpoint when bridge_collapse is active and step
    // requires copper_ore_sample (see MountainScene.js:165).
    {
      itemId: 'copper_ore_sample',
      condition: { activeQuest: 'bridge_collapse' },
    },
  ],

  ZuzuGarageScene: [
    // Granted on workbench interaction during bridge_collapse step.
    {
      itemId: 'steel_sample',
      condition: { activeQuest: 'bridge_collapse' },
    },
    // Crafted via RECIPES['healing_salve'] in craftingSystem.js
    // (creosote_leaves + agave_fiber). Recipe is learnedFrom mrs_ramirez
    // and unlocked by desert_healer quest reward (quests.js:254).
    // Listed here so the progression-reachability audit recognises a
    // source for the desert_healer.use_salve step.
    {
      itemId: 'healing_salve',
      condition: {
        activeQuest: 'desert_healer',
        transform: 'recipe',
      },
    },
  ],
};

/**
 * Items considered "always available" — granted by save-system initial
 * inventory or quest rewards that always fire. These bypass per-scene
 * reachability checks.
 *
 * Source of truth:
 *   - saveSystem.js initial inventory: ['tire_lever', 'patch_kit',
 *     'wrench', 'chain_lube']
 *   - Other quest rewards listed in quests.js are tracked dynamically by
 *     the audit walking quest.reward.items.
 */
export const STARTING_INVENTORY = [
  'tire_lever',
  'patch_kit',
  'wrench',
  'chain_lube',
];

export default SCENE_ITEM_GRANTS;
