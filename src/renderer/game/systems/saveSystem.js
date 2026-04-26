/**
 * Save system — localStorage-backed persistence.
 *
 * Uses a versioned schema so future milestones can migrate cleanly.
 * No Electron APIs required — works in any browser.
 *
 * Save shape (v1):
 * {
 *   version: 1,
 *   player: { x, y, scene },
 *   inventory: string[],           // item ids
 *   completedQuests: string[],     // quest ids
 *   activeQuest: { id, stepIndex } | null,
 *   upgrades: string[],            // upgrade item ids the player has unlocked
 *   journal: string[],             // freeform log entries
 *   timestamp: ISO string
 * }
 */

import { getDiscoveryState, loadDiscoveryState } from './discoverySystem.js';

const SAVE_KEY = 'bikebrowser_game_save';
const CURRENT_VERSION = 4;

/** Map old scene keys to new ones. */
const SCENE_MIGRATION = {
  GarageScene: 'ZuzuGarageScene',
  NeighborhoodScene: 'OverworldScene',
};

function defaultSave() {
  return {
    version: CURRENT_VERSION,
    player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
    inventory: ['tire_lever', 'patch_kit', 'wrench', 'chain_lube'],
    completedQuests: [],
    activeQuest: null,
    upgrades: [],
    zuzubucks: 0,
    reputation: 0,
    hasSeenOnboarding: false,
    journal: ['Zuzu\'s adventure begins! Check out the garage and head outside.'],
    gameSettings: {
      speechEnabled: true,
      autoSpeak: true,
      speechRate: 0.9,
      complexityMode: 'adaptive', // 'adaptive' | 'starter' | 'guided' | 'builder' | 'advanced'
    },
    // Engineering progression
    chapter: 'bike_phase', // 'bike_phase' | 'battery_phase' | 'ebike_phase'
    materials: {},          // { [materialId]: count } — raw + produced materials
    builds: {
      bike: null,           // serialized system graph (or null if not started)
      battery: null,
      ebike: null,
    },
    factories: {},          // { [friendId]: Factory | null }
    knowledge: {
      unlocked: [],
      discoveries: [],
    },
    skills: {
      mechanic: 1,
      electrical: 0,
      chemistry: 0,
      engineering: 0,
      biology: 0,
    },
    bio: {
      samples: [],      // collected biological samples
      extracted: [],     // extracted DNA/RNA/protein materials
      constructs: [],    // engineered DNA constructs
      organisms: [],     // active engineered organisms
      productions: [],   // bio-production outputs
    },
    knownRecipes: ['healing_salve', 'energy_cake', 'hydration_jelly'],
    language: {
      regions: {},       // { [regionId]: { xp, rank, terms } }
      activeRegion: null,
      settings: {
        transliterationVisible: true,
        pronunciationHints: true,
        autoAudioPlayback: false,
        microphoneEnabled: false,
        displayMode: 'dual',
      },
    },
    sideQuests: {},        // { [questId]: { id, stepIndex, completed } }
    solvedChallenges: [],  // embedded challenge IDs solved in sub-scenes
    worldMap: {            // world map exploration state
      lastVisited: null,
      visitCount: {},
    },
    solvedObstacles: [],   // obstacle/puzzle IDs that have been solved
    milestones: {
      completed: [],       // milestone IDs
      completedAt: {},     // { [milestoneId]: timestamp }
      unlocked: [],        // system/feature IDs unlocked by rewards
      currentPhase: 1,     // highest phase with a completed milestone
    },
    // Mining & resources
    minedResources: {},      // { [rawMaterialId]: count }
    miningToolLevel: 0,      // 0=hand, 1=pickaxe, 2=drill, 3=rig
    miningStats: {
      totalMined: 0,
      totalRefined: 0,
      regionsVisited: [],
    },
    // World map discovery (fog of war). Sparse by design — empty default.
    // See systems/discoverySystem.js for the canonical shape.
    discovery: {
      tiles: [],
      width: 0,
      height: 0,
      tile: 32,
    },
    timestamp: new Date().toISOString(),
  };
}

/** Migrate from v1 → v2 (add zuzubucks, reputation, onboarding flag). */
function migrateV1toV2(data) {
  return {
    ...data,
    version: 2,
    zuzubucks: data.zuzubucks ?? 0,
    reputation: data.reputation ?? 0,
    hasSeenOnboarding: data.hasSeenOnboarding ?? false,
  };
}

/** Migrate from v2 → v3 (scene key migration to layered architecture). */
function migrateV2toV3(data) {
  const scene = data.player?.scene;
  const newScene = (scene && SCENE_MIGRATION[scene]) || scene;
  return {
    ...data,
    version: 3,
    player: {
      ...data.player,
      scene: newScene || 'ZuzuGarageScene',
    },
  };
}

/** Migrate from v3 → v4 (add milestone engine state). */
function migrateV3toV4(data) {
  return {
    ...data,
    version: 4,
    milestones: data.milestones ?? {
      completed: [],
      completedAt: {},
      unlocked: [],
      currentPhase: 1,
    },
  };
}

/** Read save from localStorage, or return defaults. */
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();

    const data = JSON.parse(raw);

    if (typeof data.version !== 'number' || data.version < 1) {
      return defaultSave();
    }

    // Run migrations
    let migrated = data;
    if (migrated.version === 1) migrated = migrateV1toV2(migrated);
    if (migrated.version === 2) migrated = migrateV2toV3(migrated);
    if (migrated.version === 3) migrated = migrateV3toV4(migrated);

    // Fill any fields that may be missing from older saves.
    const merged = {
      ...defaultSave(),
      ...migrated,
      version: CURRENT_VERSION,
    };

    // Hydrate the discovery module from the merged save. Older saves without
    // a `discovery` field fall through to the default empty payload above,
    // which loadDiscoveryState resolves to an empty Set.
    try {
      loadDiscoveryState(merged.discovery);
    } catch {
      // Never let a discovery hydrate failure break the entire load.
    }

    return merged;
  } catch {
    return defaultSave();
  }
}

/** Persist full save object. */
export function saveGame(state) {
  try {
    // Pull live discovery state from the module so callers don't have to
    // remember to copy it into `state` before saving. If the discovery
    // module hasn't been initialized this run, getDiscoveryState() returns
    // an empty payload — harmless.
    let discovery;
    try {
      discovery = getDiscoveryState();
    } catch {
      discovery = state?.discovery ?? { tiles: [], width: 0, height: 0, tile: 32 };
    }

    const data = {
      ...state,
      discovery,
      version: CURRENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Check whether a save exists in localStorage. */
export function hasSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return typeof data === 'object' && data !== null && typeof data.version === 'number';
  } catch {
    return false;
  }
}

/** Wipe save (e.g. "New Game"). */
export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  return defaultSave();
}
