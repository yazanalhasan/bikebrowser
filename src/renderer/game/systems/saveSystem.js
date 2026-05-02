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
const CURRENT_VERSION = 6;

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
      mensaMode: false,
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
    knownWorkbenchRecipes: [],
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
    solvedCognitiveQuests: [],
    cognitiveProfile: {
      patternSkill: 0.5,
      spatialSkill: 0.5,
      logicSkill: 0.5,
      optimizationSkill: 0.5,
      sequenceSkill: 0.5,
    },
    cognitiveUnlocks: [],
    cognitiveStats: {
      solved: 0,
      attempts: 0,
      byType: {},
    },
    cognitiveAnswers: [],
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
    // Materials Lab — density-measurement loop (v6).
    // Each entry: { id, name, massGrams, recordedAt }. Driven by the scale
    // station in MaterialLabScene; consumed by densitySlate, densityChart,
    // questTemplating ({massTable}), and MaterialLogEntry in the Notebook.
    materialLog: [],
    // UTM material knowledge cache. Each key is a material id with measured
    // yield/ultimate/failure behavior, written by MaterialLabScene and reused
    // by later engineering quests.
    materialKnowledge: {},
    // Player-derived answers (e.g. lightestMaterial chosen via density slate
    // auto-fill). Distinct from observations because these are *values*, not
    // boolean flags. v6.
    derivedAnswers: {},
    // Append-only observation flags. v6 vocabulary additions:
    //   'volume_known' — clicked the calipers / coupon
    //   'masses_measured' — recorded all 3 sample masses
    //   'densities_calculated' — used the slate auto-fill
    observations: [],
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

/**
 * Migrate from v4 → v5: Synthesize copper_ore_sample for players soft-locked
 * on bridge_collapse step 6.
 *
 * Bug context: bridge_collapse step 6 (collect_copper) requires
 * copper_ore_sample, granted only by MountainScene (originally locked
 * behind quest completion — circular). CopperMineScene grants
 * surface_copper/deep_copper which the side-quest uses, but the main-
 * quest band-aid only triggers on scene entry. Players who somehow have
 * mine copper but never entered CopperMineScene with the bridge_collapse
 * step active end up stuck. Synthesize the canonical item if mine copper
 * is present.
 *
 * Idempotent: only fires when activeQuest is bridge_collapse step 5
 * (stepIndex; 0-indexed for "step 6"), inventory has mine copper but
 * lacks the canonical item. Re-running on the migrated state is a no-op
 * because hasCanonical will be true.
 */
function migrateV4toV5(data) {
  const aq = data.activeQuest;
  const inv = data.inventory || [];
  const hasMineCopper = inv.includes('surface_copper') || inv.includes('deep_copper');
  const hasCanonical = inv.includes('copper_ore_sample');
  const matchesSoftLock =
    aq && aq.id === 'bridge_collapse' && aq.stepIndex === 5 && hasMineCopper && !hasCanonical;
  if (matchesSoftLock) {
    return {
      ...data,
      version: 5,
      inventory: [...inv, 'copper_ore_sample'],
    };
  }
  return {
    ...data,
    version: 5,
  };
}

/**
 * Migrate from v5 → v6: Initialize the Materials-Lab density-measurement
 * pipeline fields (`materialLog`, `derivedAnswers`). Existing observations
 * stay as-is. Idempotent — no-op for saves that already have the fields.
 *
 * Vocabulary additions to state.observations (handled at write-time, not
 * here): 'volume_known', 'masses_measured', 'densities_calculated'.
 */
function migrateV5toV6(data) {
  return {
    ...data,
    version: 6,
    materialLog: Array.isArray(data.materialLog) ? data.materialLog : [],
    derivedAnswers:
      data.derivedAnswers && typeof data.derivedAnswers === 'object'
        ? data.derivedAnswers
        : {},
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
    if (migrated.version === 4) migrated = migrateV4toV5(migrated);
    if (migrated.version === 5) migrated = migrateV5toV6(migrated);

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
