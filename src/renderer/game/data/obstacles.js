/**
 * Obstacles — Zelda-style progression gates for each scene.
 *
 * Each obstacle is a physical barrier the player cannot pass until
 * they learn a specific system. The design principle:
 *
 *   1. Player explores → finds obstacle (blocked path, hazard zone)
 *   2. Player tries and FAILS (takes damage, gets stuck, bounces back)
 *   3. Player wonders "how do I get past this?"
 *   4. AI assistant hints AFTER failure (not before)
 *   5. Player learns the system (quest, NPC, experimentation)
 *   6. Player returns with new capability and SUCCEEDS
 *   7. Player feels: "I figured it out"
 *
 * Obstacle types:
 *   barrier    — physical wall, removed when condition met
 *   hazard     — damages player on contact, passable with protection
 *   puzzle     — requires specific item/knowledge to interact
 *   gate       — NPC or system that requires trust/knowledge to open
 */

// ── Obstacle Definitions Per Scene ───────────────────────────────────────────

export const SCENE_OBSTACLES = {

  StreetBlockScene: {
    obstacles: [
      {
        id: 'heat_zone',
        type: 'hazard',
        x: 650, y: 400,
        width: 120, height: 80,
        label: '🌡️ Scorching Pavement',
        icon: '🔥',
        description: 'The pavement is scorching hot. You need protection to cross.',
        damage: { stat: 'health', amount: 0.05, interval: 500 },
        passCondition: { type: 'item', item: 'sun_balm', message: 'Apply sun balm to resist the heat.' },
        failMessage: 'Ouch! The pavement burns! You need some kind of heat protection...',
        successMessage: 'The sun balm protects your skin. You cross the hot zone safely!',
        hintDelay: 2, // show AI hint after 2 failures
        learnSystem: 'crafting',
        unlocksPath: 'south_desert_access',
      },
      {
        id: 'locked_workshop',
        type: 'gate',
        x: 700, y: 200,
        width: 60, height: 60,
        label: '🔒 Workshop',
        icon: '🔧',
        description: 'A locked workshop with tools inside. Someone trusts you to enter.',
        passCondition: { type: 'reputation', threshold: 15, message: 'Earn more reputation by completing quests.' },
        failMessage: 'The workshop is locked. The owner doesn\'t know you well enough yet.',
        successMessage: 'The workshop owner recognizes your work. Welcome inside!',
        hintDelay: 1,
        learnSystem: 'quests',
        unlocksPath: 'workshop_interior',
      },
    ],
    puzzles: [
      {
        id: 'wilted_plant',
        type: 'puzzle',
        x: 350, y: 480,
        icon: '🥀',
        label: 'Wilted Plant',
        description: 'A plant that needs water. If you could find some...',
        solveCondition: { type: 'item', item: 'prickly_pear_fruit' },
        failMessage: 'The plant is too dry. It needs water or a hydrating fruit...',
        successMessage: 'The prickly pear juice revives the plant! It reveals a hidden path.',
        reward: { xp: 15, zuzubucks: 10 },
        learnSystem: 'foraging',
      },
    ],
  },

  DogParkScene: {
    obstacles: [
      {
        id: 'muddy_path',
        type: 'hazard',
        x: 400, y: 350,
        width: 200, height: 40,
        label: '🟤 Muddy Path',
        icon: '💦',
        description: 'Deep mud blocks the path. Walking through drains your stamina.',
        damage: { stat: 'stamina', amount: 0.08, interval: 300 },
        passCondition: { type: 'knowledge', concept: 'non_newtonian_fluids', message: 'Learn about fluid behavior to cross safely.' },
        failMessage: 'You sink in the mud! Moving slowly makes it worse... maybe speed matters?',
        successMessage: 'You sprint across — the mud firms up under quick steps! Shear thickening in action.',
        hintDelay: 2,
        learnSystem: 'science',
        unlocksPath: 'park_east',
      },
    ],
    puzzles: [
      {
        id: 'broken_fence',
        type: 'puzzle',
        x: 600, y: 250,
        icon: '🔨',
        label: 'Broken Fence',
        description: 'A section of fence is broken. Needs repair.',
        solveCondition: { type: 'item', item: 'wrench' },
        failMessage: 'The fence is broken. You need a tool to fix it...',
        successMessage: 'Fixed! The dogs are safe now. You earned the park keeper\'s trust.',
        reward: { xp: 20, reputation: 5 },
        learnSystem: 'repair',
      },
    ],
  },

  LakeEdgeScene: {
    obstacles: [
      {
        id: 'deep_water',
        type: 'barrier',
        x: 400, y: 200,
        width: 300, height: 50,
        label: '🌊 Deep Water',
        icon: '🌊',
        description: 'Deep water blocks the path. You can\'t swim across without a raft.',
        passCondition: { type: 'quest', quest: 'boat_puzzle', message: 'Learn about buoyancy to build a raft.' },
        failMessage: 'The water is too deep to wade through. You need something that floats...',
        successMessage: 'Your raft carries you across! Archimedes would be proud.',
        hintDelay: 1,
        learnSystem: 'materials',
        unlocksPath: 'lake_island',
      },
    ],
    puzzles: [
      {
        id: 'contaminated_spring',
        type: 'puzzle',
        x: 250, y: 350,
        icon: '🧪',
        label: 'Dirty Spring',
        description: 'A natural spring, but the water is contaminated.',
        solveCondition: { type: 'item', item: 'creosote_leaves' },
        failMessage: 'The water is murky and contaminated. You need something antimicrobial...',
        successMessage: 'Creosote resin purifies the water! Now you have a clean water source.',
        reward: { xp: 20, zuzubucks: 15 },
        learnSystem: 'ecology',
      },
    ],
  },

  MountainScene: {
    obstacles: [
      {
        id: 'steep_cliff',
        type: 'barrier',
        x: 400, y: 150,
        width: 200, height: 40,
        label: '⛰️ Steep Cliff',
        icon: '🧗',
        description: 'A steep cliff blocks the mountain path. You need strong rope.',
        passCondition: { type: 'item', item: 'agave_fiber', message: 'Agave fiber is strong enough for rope.' },
        failMessage: 'The cliff is too steep to climb bare-handed. You need strong fiber rope...',
        successMessage: 'The agave rope holds! You climb to the mountain summit.',
        hintDelay: 2,
        learnSystem: 'foraging',
        unlocksPath: 'summit',
      },
      {
        id: 'cold_zone',
        type: 'hazard',
        x: 400, y: 100,
        width: 300, height: 60,
        label: '❄️ Freezing Altitude',
        icon: '🥶',
        description: 'The air is freezing at this altitude.',
        damage: { stat: 'health', amount: 0.03, interval: 800 },
        passCondition: { type: 'item', item: 'healing_salve', message: 'A healing salve protects against cold damage.' },
        failMessage: 'It\'s freezing! Your health drops in the cold. You need protection...',
        successMessage: 'The salve warms your skin. You push through the cold.',
        hintDelay: 3,
        learnSystem: 'crafting',
        unlocksPath: 'mountain_cave',
      },
    ],
    puzzles: [],
  },

  DesertTrailScene: {
    obstacles: [
      {
        id: 'dehydration_zone',
        type: 'hazard',
        x: 400, y: 300,
        width: 400, height: 200,
        label: '🏜️ Scorching Desert',
        icon: '☀️',
        description: 'Open desert with no shade. Hydration drops fast.',
        damage: { stat: 'hydration', amount: 0.04, interval: 600 },
        passCondition: { type: 'item', item: 'hydration_jelly', message: 'Craft cactus water jelly for sustained hydration.' },
        failMessage: 'The desert sun is relentless! Your water is running out...',
        successMessage: 'The cactus jelly keeps you hydrated through the desert crossing!',
        hintDelay: 2,
        learnSystem: 'crafting',
        unlocksPath: 'oasis',
      },
    ],
    puzzles: [
      {
        id: 'ancient_signpost',
        type: 'puzzle',
        x: 300, y: 150,
        icon: '🪧',
        label: 'Ancient Signpost',
        description: 'A weathered signpost with writing you can\'t read... yet.',
        solveCondition: { type: 'languageRank', region: 'levant', rank: 2 },
        failMessage: 'The signpost has writing on it, but you can\'t read it. Learn the local language...',
        successMessage: 'You can read it! The sign points to a hidden water source!',
        reward: { xp: 25, zuzubucks: 15 },
        learnSystem: 'language',
      },
    ],
  },

  CommunityPoolScene: {
    obstacles: [],
    puzzles: [
      {
        id: 'clogged_filter',
        type: 'puzzle',
        x: 500, y: 300,
        icon: '🔧',
        label: 'Clogged Pool Filter',
        description: 'The pool filter is clogged with grime.',
        solveCondition: { type: 'item', item: 'yucca_root' },
        failMessage: 'The filter is clogged with oil and grime. You need a natural cleaning agent...',
        successMessage: 'Yucca surfactant cuts right through the grease! The filter runs clean.',
        reward: { xp: 20, reputation: 10 },
        learnSystem: 'chemistry',
      },
    ],
  },

  SportsFieldsScene: {
    obstacles: [],
    puzzles: [
      {
        id: 'broken_scoreboard',
        type: 'puzzle',
        x: 600, y: 200,
        icon: '📟',
        label: 'Broken Scoreboard',
        description: 'The electronic scoreboard is dead. Needs power.',
        solveCondition: { type: 'quest', quest: 'chain_repair' },
        failMessage: 'The scoreboard has no power. Maybe fixing things earns you the skills to help here...',
        successMessage: 'Your repair skills fix the wiring! The scoreboard lights up.',
        reward: { xp: 15, zuzubucks: 10 },
        learnSystem: 'repair',
      },
    ],
  },
};

// ── Obstacle Query Functions ─────────────────────────────────────────────────

/** Get all obstacles for a scene. */
export function getSceneObstacles(sceneKey) {
  return SCENE_OBSTACLES[sceneKey] || { obstacles: [], puzzles: [] };
}

/**
 * Check if an obstacle's pass condition is met.
 *
 * @param {object} obstacle
 * @param {object} gameState - full game save state
 * @returns {{ passed: boolean, reason: string }}
 */
export function checkObstacleCondition(obstacle, gameState) {
  const cond = obstacle.passCondition || obstacle.solveCondition;
  if (!cond) return { passed: true, reason: '' };

  switch (cond.type) {
    case 'item':
      return {
        passed: gameState.inventory?.includes(cond.item),
        reason: cond.message || `Need item: ${cond.item}`,
      };
    case 'quest':
      return {
        passed: gameState.completedQuests?.includes(cond.quest),
        reason: cond.message || `Complete quest: ${cond.quest}`,
      };
    case 'reputation':
      return {
        passed: (gameState.reputation || 0) >= cond.threshold,
        reason: cond.message || `Need ${cond.threshold} reputation`,
      };
    case 'knowledge':
      return {
        passed: gameState.knowledge?.unlocked?.includes(cond.concept),
        reason: cond.message || `Learn concept: ${cond.concept}`,
      };
    case 'languageRank': {
      const region = gameState.language?.regions?.[cond.region];
      return {
        passed: (region?.rank || 0) >= cond.rank,
        reason: cond.message || `Reach language rank ${cond.rank}`,
      };
    }
    default:
      return { passed: false, reason: 'Unknown condition.' };
  }
}

/** Count total obstacles and puzzles across all scenes. */
export function getObstacleStats() {
  let obstacles = 0, puzzles = 0;
  for (const scene of Object.values(SCENE_OBSTACLES)) {
    obstacles += scene.obstacles?.length || 0;
    puzzles += scene.puzzles?.length || 0;
  }
  return { obstacles, puzzles, total: obstacles + puzzles };
}
