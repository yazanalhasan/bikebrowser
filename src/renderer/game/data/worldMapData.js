/**
 * World Map Data — defines explorable regions and locations beyond the neighborhood.
 *
 * Quest for Glory-style world expansion. Each location is an optional sub-scene
 * that offers unique materials, knowledge, and side quests without blocking
 * main progression.
 *
 * Structure:
 *   region → contains multiple locations
 *   location → links to a Phaser sub-scene (entryScene)
 *
 * Regions unlock progressively as the player builds reputation and completes quests.
 */

// ── Regions ─────────────────────────────────────────────────────────────────

export const REGIONS = {
  arizona_desert: {
    id: 'arizona_desert',
    name: 'Arizona Desert',
    description: 'The Sonoran Desert surrounding the neighborhood — plants, mines, and waterways.',
    icon: '🏜️',
    mapPos: { x: 0.5, y: 0.5 },  // normalized position on world map (0-1)
    unlockReq: null,               // always available
  },
  // Future regions (placeholder — not implemented yet)
  mountain_range: {
    id: 'mountain_range',
    name: 'Superstition Mountains',
    description: 'Rugged peaks with rare minerals and ancient trails.',
    icon: '⛰️',
    mapPos: { x: 0.8, y: 0.2 },
    unlockReq: { reputation: 50, questsAny: ['bridge_collapse'] },
  },
};

// ── Locations ───────────────────────────────────────────────────────────────

export const WORLD_LOCATIONS = {
  desert_foraging: {
    id: 'desert_foraging',
    name: 'Sonoran Foraging Grounds',
    description: 'Rich desert ecosystem — harvest plants, manage water, learn ethnobotany.',
    icon: '🌵',
    region: 'arizona_desert',
    type: 'resource',          // resource | material | biology | exploration
    difficulty: 1,
    entryScene: 'DesertForagingScene',
    mapPos: { x: 0.3, y: 0.4 },
    unlockReq: null,           // always available as first sub-scene
    rewards: ['fibers', 'resins', 'solvents', 'ethnobotany_knowledge'],
    travelTime: 'Short ride',
    travelIcon: '🚲',
  },

  copper_mine: {
    id: 'copper_mine',
    name: 'Abandoned Copper Mine',
    description: 'An old mine with exposed copper veins — learn about conductivity and materials science.',
    icon: '⛏️',
    region: 'arizona_desert',
    type: 'material',
    difficulty: 2,
    entryScene: 'CopperMineScene',
    mapPos: { x: 0.7, y: 0.3 },
    unlockReq: { reputation: 15, questsAny: ['flat_tire_repair'] },
    rewards: ['copper_ore', 'wire_samples', 'conductivity_knowledge'],
    travelTime: 'Medium ride',
    travelIcon: '🚲',
  },

  salt_river: {
    id: 'salt_river',
    name: 'Salt River Basin',
    description: 'A desert waterway teeming with life — study fluid dynamics and ecological balance.',
    icon: '🏞️',
    region: 'arizona_desert',
    type: 'biology',
    difficulty: 2,
    entryScene: 'SaltRiverScene',
    mapPos: { x: 0.5, y: 0.7 },
    unlockReq: { reputation: 20, questsAny: ['chain_repair', 'desert_healer'] },
    rewards: ['organic_compounds', 'microbial_samples', 'fluid_dynamics_knowledge'],
    travelTime: 'Long ride',
    travelIcon: '🚲',
  },

  dry_wash: {
    id: 'dry_wash',
    name: 'Dry Wash',
    description:
      'A flash-flood arroyo with broken bridge remnants — the place where bridge_collapse plays out.',
    icon: '🏜️',
    region: 'arizona_desert',
    type: 'exploration',
    difficulty: 1,
    entryScene: 'DryWashScene',
    mapPos: { x: 0.5, y: 0.55 },
    // Active-or-completed: bridge_collapse's build_bridge step has
    // step.scene === 'DryWashScene', so the player must be able to
    // travel here while the quest is still active. Plain questsAny
    // (completed-only) would lock the destination behind the very
    // quest that sends them there.
    unlockReq: { questsAnyOrActive: ['bridge_collapse'] },
    rewards: ['bridge_construction_knowledge'],
    travelTime: 'Short ride',
    travelIcon: '🚲',
  },
};

// ── Helper Functions ────────────────────────────────────────────────────────

/** Get all locations in a region. */
export function getLocationsByRegion(regionId) {
  return Object.values(WORLD_LOCATIONS).filter(l => l.region === regionId);
}

/** Get all unlocked regions for a given game state. */
export function getUnlockedRegions(state) {
  return Object.values(REGIONS).filter(r => isRegionUnlocked(r.id, state));
}

/** Check if a region is unlocked. */
export function isRegionUnlocked(regionId, state) {
  const region = REGIONS[regionId];
  if (!region || !region.unlockReq) return true;
  const req = region.unlockReq;
  const completed = state?.completedQuests || [];
  const activeId = state?.activeQuest?.id;
  if (req.reputation && (state?.reputation || 0) < req.reputation) return false;
  if (req.questsAny && !req.questsAny.some(q => completed.includes(q))) return false;
  if (req.questsAnyOrActive
      && !req.questsAnyOrActive.some(q => completed.includes(q) || q === activeId)) {
    return false;
  }
  return true;
}

/** Check if a specific location is unlocked. */
export function isLocationUnlocked(locationId, state) {
  const loc = WORLD_LOCATIONS[locationId];
  if (!loc) return false;
  // Region must be unlocked first
  if (!isRegionUnlocked(loc.region, state)) return false;
  if (!loc.unlockReq) return true;
  const req = loc.unlockReq;
  const completed = state?.completedQuests || [];
  const activeId = state?.activeQuest?.id;
  if (req.reputation && (state?.reputation || 0) < req.reputation) return false;
  if (req.questsAny && !req.questsAny.some(q => completed.includes(q))) return false;
  // questsAnyOrActive — mirrors sceneRegistry.isSceneUnlocked. Breaks
  // circular locks where a quest's step targets a scene whose unlockReq
  // is the same quest.
  if (req.questsAnyOrActive
      && !req.questsAnyOrActive.some(q => completed.includes(q) || q === activeId)) {
    return false;
  }
  if (req.questsAll) {
    for (const q of req.questsAll) { if (!completed.includes(q)) return false; }
  }
  return true;
}

/** Get all locations with unlock status for map display. */
export function getWorldMapStatus(state) {
  return Object.values(WORLD_LOCATIONS).map(loc => ({
    ...loc,
    unlocked: isLocationUnlocked(loc.id, state),
    regionUnlocked: isRegionUnlocked(loc.region, state),
  }));
}
