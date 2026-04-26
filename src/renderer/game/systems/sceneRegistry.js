/**
 * Scene Registry — defines all game scenes, their layer types,
 * connections, unlock requirements, and spawn points.
 *
 * Three scene layers:
 *   overworld  — macro navigation map (one scene)
 *   local      — playable zoomed-in locations
 *   micro      — focused interaction overlays (bike repair, dialogue, puzzle)
 *
 * Each scene entry defines:
 *   key         — Phaser scene key
 *   layer       — 'overworld' | 'local' | 'micro'
 *   name        — display name
 *   icon        — emoji for UI/overworld markers
 *   description — flavor text
 *   worldPos    — { x, y } position on the overworld map (for markers)
 *   spawns      — named spawn points within the scene
 *   exits       — connections to other scenes
 *   unlockReq   — conditions to enter (null = always open)
 *   defaultMusic — audio key for scene
 */

// ---------------------------------------------------------------------------
// Scene definitions
// ---------------------------------------------------------------------------

const SCENES = {
  // === OVERWORLD ===
  OverworldScene: {
    key: 'OverworldScene',
    layer: 'overworld',
    name: 'Neighborhood',
    icon: '🗺️',
    description: 'E Trailside View — the neighborhood from above',
    worldPos: null,
    spawns: {
      default: { x: 640, y: 500 },
      fromGarage: { x: 280, y: 280 },
      fromStreet: { x: 280, y: 280 },
      fromDogPark: { x: 270, y: 700 },
      fromLakeEdge: { x: 770, y: 220 },
      fromSportsFields: { x: 1280, y: 380 },
      fromCommunityPool: { x: 1100, y: 720 },
      fromDesertTrail: { x: 1450, y: 700 },
      fromMountain: { x: 1150, y: 160 },
    },
    exits: {},
    unlockReq: null,
    region: 'home',
    defaultMusic: 'pixel_pedal_parade_v2',
  },

  // === LOCAL SCENES ===
  ZuzuGarageScene: {
    key: 'ZuzuGarageScene',
    layer: 'local',
    name: "Zuzu's Garage",
    icon: '🏠',
    description: 'Home base — bike repairs, upgrades, notebook',
    worldPos: { x: 250, y: 230 },
    spawns: {
      default: { x: 400, y: 350 },
      fromStreet: { x: 400, y: 520 },
      fromOverworld: { x: 400, y: 350 },
      fromMaterialLab: { x: 400, y: 350 },
    },
    exits: {
      toStreet: { target: 'StreetBlockScene', spawn: 'fromGarage' },
      toOverworld: { target: 'OverworldScene', spawn: 'fromGarage' },
      toMaterialLab: { target: 'MaterialLabScene', spawn: 'fromGarage' },
    },
    unlockReq: null,
    region: 'home',
    defaultMusic: 'pixel_pedal_parade_v4',
  },

  MaterialLabScene: {
    key: 'MaterialLabScene',
    layer: 'local',
    name: 'Materials Lab',
    icon: '🧪',
    description: "Mr. Chen's materials testing lab — the UTM rig.",
    worldPos: null,
    spawns: {
      default: { x: 400, y: 540 },
      fromGarage: { x: 400, y: 540 },
      fromMaterialLab: { x: 400, y: 540 },
    },
    exits: {
      toGarage: { target: 'ZuzuGarageScene', spawn: 'fromMaterialLab' },
    },
    unlockReq: null,
    region: 'home',
    defaultMusic: 'pixel_pedal_parade_v4',
  },

  StreetBlockScene: {
    key: 'StreetBlockScene',
    layer: 'local',
    name: "Zuzu's Street",
    icon: '🏘️',
    description: 'The street outside — neighbors, driveways, sidewalks',
    worldPos: { x: 400, y: 300 },
    spawns: {
      default: { x: 400, y: 300 },
      fromGarage: { x: 120, y: 300 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toGarage: { target: 'ZuzuGarageScene', spawn: 'fromStreet' },
      toOverworld: { target: 'OverworldScene', spawn: 'fromStreet' },
    },
    unlockReq: null,
    region: 'neighborhood',
    defaultMusic: 'pixel_pedal_parade_v2',
  },

  DogParkScene: {
    key: 'DogParkScene',
    layer: 'local',
    name: 'Dog Park',
    icon: '🐕',
    description: 'Fenced park — dogs, mud paths, ecology puzzles',
    worldPos: { x: 270, y: 700 },
    spawns: {
      default: { x: 400, y: 500 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromDogPark' },
    },
    unlockReq: null,  // always accessible — first exploration area
    region: 'neighborhood',
    defaultMusic: 'neighborhood_hybrid_ride',
  },

  LakeEdgeScene: {
    key: 'LakeEdgeScene',
    layer: 'local',
    name: 'Lake Edge',
    icon: '🏞️',
    description: 'Shoreline with dock — water science, buoyancy, contamination',
    worldPos: { x: 770, y: 140 },
    spawns: {
      default: { x: 400, y: 400 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromLakeEdge' },
    },
    unlockReq: {
      reputation: 10,
      questsAny: ['flat_tire_repair', 'chain_repair'],
      hint: 'Complete a bike repair quest and earn 10 reputation.',
    },
    region: 'lakeside',
    defaultMusic: 'desert_discovery',
  },

  SportsFieldsScene: {
    key: 'SportsFieldsScene',
    layer: 'local',
    name: 'Sports Fields',
    icon: '⚽',
    description: 'Tennis court and soccer field — physics, materials testing',
    worldPos: { x: 1280, y: 380 },
    spawns: {
      default: { x: 400, y: 400 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromSportsFields' },
    },
    unlockReq: {
      reputation: 10,
      questsAny: ['flat_tire_repair', 'chain_repair'],
      hint: 'Complete a bike repair quest to access the sports area.',
    },
    region: 'fields',
    defaultMusic: 'neighborhood_hybrid_ride',
  },

  CommunityPoolScene: {
    key: 'CommunityPoolScene',
    layer: 'local',
    name: 'Community Pool',
    icon: '🏊',
    description: 'Pool with slide — chemistry, surfactants, water science',
    worldPos: { x: 1100, y: 720 },
    spawns: {
      default: { x: 400, y: 400 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromCommunityPool' },
    },
    unlockReq: {
      reputation: 20,
      questsAny: ['desert_healer', 'food_chain_tracker'],
      hint: 'Complete an ecology quest and earn 20 reputation.',
    },
    region: 'pool',
    defaultMusic: 'neighborhood_hybrid_ride',
  },

  DesertTrailScene: {
    key: 'DesertTrailScene',
    layer: 'local',
    name: 'Desert Trail',
    icon: '🌵',
    description: 'Branching paths, cacti, wildlife — survival, foraging, language',
    worldPos: { x: 1450, y: 700 },
    spawns: {
      default: { x: 400, y: 400 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromDesertTrail' },
    },
    unlockReq: {
      reputation: 20,
      questsAny: ['desert_survival', 'desert_healer'],
      hint: 'Learn desert survival before venturing into the desert trail.',
    },
    region: 'desert',
    defaultMusic: 'desert_discovery',
  },

  MountainScene: {
    key: 'MountainScene',
    layer: 'local',
    name: 'Desert Mountain',
    icon: '⛰️',
    description: 'Foothills, climb paths, cave — advanced materials, topology',
    worldPos: { x: 1150, y: 80 },
    spawns: {
      default: { x: 400, y: 400 },
      fromOverworld: { x: 400, y: 80 },
    },
    exits: {
      toOverworld: { target: 'OverworldScene', spawn: 'fromMountain' },
    },
    unlockReq: {
      reputation: 35,
      questsAnyOrActive: ['bridge_collapse'],
      hint: 'Start material science (begin "The Bridge That Broke") and earn 35 reputation.',
    },
    region: 'mountain',
    defaultMusic: 'desert_discovery',
  },

  // === WORLD MAP ===
  WorldMapScene: {
    key: 'WorldMapScene',
    layer: 'overworld',
    name: 'World Map',
    icon: '🗺️',
    description: 'Explore the wider Arizona region',
    worldPos: null,
    spawns: { default: { x: 400, y: 300 } },
    exits: {},
    unlockReq: null,
    region: 'world',
    defaultMusic: 'desert_discovery',
  },

  // === SUB-SCENES (Quest for Glory-style explorable locations) ===
  DesertForagingScene: {
    key: 'DesertForagingScene',
    layer: 'local',
    name: 'Sonoran Foraging Grounds',
    icon: '🌵',
    description: 'Desert ecosystem — harvest plants, manage water, learn ethnobotany',
    worldPos: null,   // accessed via world map, not neighborhood overworld
    spawns: {
      default: { x: 600, y: 400 },
      fromWorldMap: { x: 600, y: 750 },
    },
    exits: {
      toWorldMap: { target: 'WorldMapScene', spawn: 'default' },
    },
    unlockReq: null,
    region: 'desert',
    defaultMusic: 'desert_discovery',
  },

  CopperMineScene: {
    key: 'CopperMineScene',
    layer: 'local',
    name: 'Abandoned Copper Mine',
    icon: '⛏️',
    description: 'Old mine — copper ore, conductivity, structural physics',
    worldPos: null,
    spawns: {
      default: { x: 500, y: 300 },
      fromWorldMap: { x: 500, y: 850 },
    },
    exits: {
      toWorldMap: { target: 'WorldMapScene', spawn: 'default' },
    },
    unlockReq: {
      reputation: 15,
      questsAny: ['flat_tire_repair'],
      hint: 'Build some repair reputation before exploring the mine.',
    },
    region: 'desert',
    defaultMusic: 'desert_discovery',
  },

  SaltRiverScene: {
    key: 'SaltRiverScene',
    layer: 'local',
    name: 'Salt River Basin',
    icon: '🏞️',
    description: 'Desert waterway — biology, fluid dynamics, ecological balance',
    worldPos: null,
    spawns: {
      default: { x: 550, y: 600 },
      fromWorldMap: { x: 550, y: 760 },
    },
    exits: {
      toWorldMap: { target: 'WorldMapScene', spawn: 'default' },
    },
    unlockReq: {
      reputation: 20,
      questsAny: ['chain_repair', 'desert_healer'],
      hint: 'Complete more neighborhood quests and earn 20 reputation.',
    },
    region: 'desert',
    defaultMusic: 'desert_discovery',
  },
};

export default SCENES;

export const SCENE_MAP = SCENES;

/** Get all scenes of a given layer type. */
export function getScenesByLayer(layer) {
  return Object.values(SCENES).filter(s => s.layer === layer);
}

/** Get all local scenes for overworld display. */
export function getLocalScenes() {
  return getScenesByLayer('local');
}

/**
 * Check if a scene is unlocked for the player.
 * Supports: reputation, questsAny, questsAll, questsAnyOrActive, items, knowledge.
 *
 * @param {string} sceneKey
 * @param {object} state — game save state
 * @returns {boolean}
 */
export function isSceneUnlocked(sceneKey, state) {
  const scene = SCENES[sceneKey];
  if (!scene || !scene.unlockReq) return true;

  const req = scene.unlockReq;
  const completedIds = state?.completedQuests || [];

  // Reputation threshold
  if (req.reputation && (state?.reputation || 0) < req.reputation) return false;

  // Must complete ALL listed quests
  if (req.questsAll) {
    for (const qid of req.questsAll) {
      if (!completedIds.includes(qid)) return false;
    }
  }

  // Must complete ANY listed quest
  if (req.questsAny) {
    if (!req.questsAny.some((qid) => completedIds.includes(qid))) return false;
  }

  // Must have completed OR currently be on ANY listed quest
  // (breaks circular locks where a quest grants items only obtainable in a scene gated by that quest)
  if (req.questsAnyOrActive) {
    const matched = req.questsAnyOrActive.some(
      (qid) => completedIds.includes(qid) || state?.activeQuest?.id === qid
    );
    if (!matched) return false;
  }

  // Must have specific item
  if (req.item && !state?.inventory?.includes(req.item)) return false;

  // Must have knowledge concept
  if (req.knowledge && !state?.knowledge?.unlocked?.includes(req.knowledge)) return false;

  // Legacy: completedQuests count
  if (req.completedQuests) {
    if (completedIds.length < req.completedQuests) return false;
  }

  return true;
}

/**
 * Get unlock progress for a locked scene.
 * Returns what the player has vs what they need.
 *
 * @param {string} sceneKey
 * @param {object} state
 * @returns {{ locked, hint, progress, conditions }}
 */
export function getUnlockProgress(sceneKey, state) {
  const scene = SCENES[sceneKey];
  if (!scene || !scene.unlockReq) return { locked: false, hint: '', progress: 1, conditions: [] };

  const req = scene.unlockReq;
  const completedIds = state?.completedQuests || [];
  const conditions = [];
  let metCount = 0;
  let totalCount = 0;

  if (req.reputation) {
    totalCount++;
    const current = state?.reputation || 0;
    const met = current >= req.reputation;
    if (met) metCount++;
    conditions.push({ type: 'reputation', needed: req.reputation, current, met, label: `${current}/${req.reputation} reputation` });
  }

  if (req.questsAny) {
    totalCount++;
    const met = req.questsAny.some((qid) => completedIds.includes(qid));
    if (met) metCount++;
    conditions.push({ type: 'quest', met, label: met ? 'Quest requirement met' : `Complete one of: ${req.questsAny.join(' or ')}` });
  }

  if (req.questsAll) {
    for (const qid of req.questsAll) {
      totalCount++;
      const met = completedIds.includes(qid);
      if (met) metCount++;
      conditions.push({ type: 'quest', met, label: met ? `✅ ${qid}` : `Complete: ${qid}` });
    }
  }

  if (req.questsAnyOrActive) {
    totalCount++;
    const met = req.questsAnyOrActive.some(
      (qid) => completedIds.includes(qid) || state?.activeQuest?.id === qid
    );
    if (met) metCount++;
    conditions.push({
      type: 'quest',
      met,
      label: met ? 'Quest requirement met' : `Start or complete one of: ${req.questsAnyOrActive.join(' or ')}`,
    });
  }

  const locked = !isSceneUnlocked(sceneKey, state);
  const progress = totalCount > 0 ? metCount / totalCount : 1;

  return {
    locked,
    hint: req.hint || 'Complete more quests to unlock.',
    progress: Math.round(progress * 100) / 100,
    conditions,
    region: scene.region,
  };
}

/**
 * Get all regions with unlock status for map display.
 */
export function getAllRegionStatus(state) {
  return getLocalScenes().map((scene) => {
    const unlocked = isSceneUnlocked(scene.key, state);
    const progress = getUnlockProgress(scene.key, state);
    return {
      key: scene.key,
      name: scene.name,
      icon: scene.icon,
      region: scene.region,
      worldPos: scene.worldPos,
      unlocked,
      ...progress,
    };
  });
}

/**
 * Get the spawn position for entering a scene.
 * @param {string} sceneKey
 * @param {string} [spawnName='default']
 * @returns {{ x: number, y: number }}
 */
export function getSpawn(sceneKey, spawnName = 'default') {
  const scene = SCENES[sceneKey];
  if (!scene) return { x: 400, y: 300 };
  return scene.spawns[spawnName] || scene.spawns.default || { x: 400, y: 300 };
}
