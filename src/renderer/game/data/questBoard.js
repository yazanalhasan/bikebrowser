/**
 * Quest Board — Global Quest Progression Tree.
 *
 * Every quest has:
 *   - tier (1–5)
 *   - track (repair, ecology, science, materials, biology, language)
 *   - prerequisites (completed quest IDs)
 *   - unlocks (what completing this quest makes available)
 *   - systems it uses
 *
 * Rules:
 *   - Every quest unlocks at least 1 new quest
 *   - No dead ends
 *   - At least 2 branching paths per tier
 *   - Quests connect across system tracks
 *
 * Tier structure:
 *   T1 SURVIVAL    — basic repair, first interactions
 *   T2 UNDERSTANDING — ecology, plants, materials
 *   T3 APPLICATION — crafting, building, problem solving
 *   T4 ENGINEERING — optimization, integration, vehicles
 *   T5 MASTERY     — multi-system, biology, advanced engineering
 */

import QUESTS from './quests.js';

// ── Quest Progression Tree ───────────────────────────────────────────────────

const QUEST_TREE = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 1 — SURVIVAL (entry points, no prerequisites)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'flat_tire_repair',
    tier: 1, track: 'repair', type: 'main',
    prerequisites: [],
    unlocks: ['desert_healer', 'desert_infection', 'desert_coating'],
    systemsUsed: ['quest', 'inventory'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'chain_repair',
    tier: 1, track: 'repair', type: 'main',
    prerequisites: [],
    unlocks: ['food_chain_tracker', 'bridge_collapse', 'engine_cleaning'],
    systemsUsed: ['quest', 'inventory'],
    giver: 'mr_chen',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 2 — UNDERSTANDING (ecology, plants, first science)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'desert_healer',
    tier: 2, track: 'ecology', type: 'main',
    prerequisites: ['flat_tire_repair'],
    unlocks: ['desert_survival', 'medicine_balance', 'toxic_knowledge'],
    systemsUsed: ['ecology', 'foraging', 'crafting'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'food_chain_tracker',
    tier: 2, track: 'ecology', type: 'main',
    prerequisites: ['chain_repair'],
    unlocks: ['the_living_fluid', 'invisible_map', 'extract_dna'],
    systemsUsed: ['ecology'],
    giver: 'mr_chen',
  },
  {
    id: 'desert_infection',
    tier: 2, track: 'science', type: 'side',
    prerequisites: ['flat_tire_repair'],
    unlocks: ['toxic_knowledge'],
    systemsUsed: ['ecology', 'chemistry'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'bridge_collapse',
    tier: 2, track: 'materials', type: 'main',
    prerequisites: ['chain_repair'],
    unlocks: ['heat_failure', 'perfect_composite', 'boat_puzzle'],
    systemsUsed: ['materials', 'simulation'],
    giver: 'mr_chen',
  },
  {
    id: 'desert_coating',
    tier: 2, track: 'materials', type: 'side',
    prerequisites: ['flat_tire_repair'],
    unlocks: ['perfect_composite'],
    systemsUsed: ['materials', 'crafting'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'engine_cleaning',
    tier: 2, track: 'science', type: 'side',
    prerequisites: ['chain_repair'],
    unlocks: ['heat_failure'],
    systemsUsed: ['materials', 'chemistry'],
    giver: 'mr_chen',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 3 — APPLICATION (crafting, building, problem solving)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'desert_survival',
    tier: 3, track: 'ecology', type: 'main',
    prerequisites: ['desert_healer'],
    unlocks: ['medicine_balance', 'extract_dna'],
    systemsUsed: ['ecology', 'foraging', 'crafting', 'playerStats'],
    giver: 'mr_chen',
  },
  {
    id: 'medicine_balance',
    tier: 3, track: 'ecology', type: 'main',
    prerequisites: ['desert_healer'],
    unlocks: ['toxic_knowledge'],
    systemsUsed: ['crafting', 'pharmacology', 'playerStats'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'the_living_fluid',
    tier: 3, track: 'science', type: 'main',
    prerequisites: ['food_chain_tracker'],
    unlocks: ['one_sided_forest'],
    systemsUsed: ['science', 'physics'],
    giver: 'mr_chen',
  },
  {
    id: 'toxic_knowledge',
    tier: 3, track: 'science', type: 'main',
    prerequisites: ['desert_healer'],
    unlocks: ['engineer_bacteria'],
    systemsUsed: ['pharmacology', 'crafting'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'invisible_map',
    tier: 3, track: 'science', type: 'side',
    prerequisites: ['food_chain_tracker'],
    unlocks: ['one_sided_forest'],
    systemsUsed: ['science', 'cognition', 'ecology'],
    giver: 'mr_chen',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 4 — ENGINEERING (materials, systems integration)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'heat_failure',
    tier: 4, track: 'materials', type: 'main',
    prerequisites: ['bridge_collapse'],
    unlocks: ['bio_battery_integration'],
    systemsUsed: ['materials', 'simulation', 'thermal'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'perfect_composite',
    tier: 4, track: 'materials', type: 'main',
    prerequisites: ['bridge_collapse'],
    unlocks: ['bio_battery_integration'],
    systemsUsed: ['materials', 'crafting', 'simulation'],
    giver: 'mr_chen',
  },
  {
    id: 'boat_puzzle',
    tier: 4, track: 'materials', type: 'side',
    prerequisites: ['bridge_collapse'],
    unlocks: ['bio_battery_integration'],
    systemsUsed: ['materials', 'buoyancy', 'simulation'],
    giver: 'mr_chen',
  },
  {
    id: 'one_sided_forest',
    tier: 4, track: 'science', type: 'side',
    prerequisites: ['the_living_fluid'],
    unlocks: ['engineer_bacteria'],
    systemsUsed: ['science', 'topology', 'ecology'],
    giver: 'mr_chen',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER 5 — MASTERY (biology, multi-system, advanced)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'extract_dna',
    tier: 5, track: 'biology', type: 'main',
    prerequisites: ['food_chain_tracker'],
    unlocks: ['understand_expression'],
    systemsUsed: ['biology', 'chemistry'],
    giver: 'mr_chen',
  },
  {
    id: 'understand_expression',
    tier: 5, track: 'biology', type: 'main',
    prerequisites: ['extract_dna'],
    unlocks: ['engineer_bacteria'],
    systemsUsed: ['biology'],
    giver: 'mr_chen',
  },
  {
    id: 'engineer_bacteria',
    tier: 5, track: 'biology', type: 'main',
    prerequisites: ['understand_expression'],
    unlocks: ['bio_battery_integration'],
    systemsUsed: ['biology', 'genetics', 'chemistry'],
    giver: 'mrs_ramirez',
  },
  {
    id: 'bio_battery_integration',
    tier: 5, track: 'biology', type: 'main',
    prerequisites: ['engineer_bacteria'],
    unlocks: [],  // capstone quest — unlocks locked content
    systemsUsed: ['biology', 'chemistry', 'battery', 'engineering'],
    giver: 'mr_chen',
  },
];

// ── Locked Content (unlocked by capstone quests) ─────────────────────────────

const LOCKED_SLOTS = [
  {
    id: 'locked_ebike',
    title: 'Build an E-Bike',
    hint: 'Complete "Biology Meets Engineering" to unlock...',
    icon: '⚡',
    unlockQuest: 'bio_battery_integration',
  },
  {
    id: 'locked_factory',
    title: 'Friend Factories',
    hint: 'Reach 40 reputation to unlock...',
    icon: '🏭',
    unlockCondition: 'reputation >= 40',
  },
];

// ── Quest Board Builder ──────────────────────────────────────────────────────

/**
 * Build the quest board from game state.
 * Shows: active, available, completed, upcoming, locked.
 */
export function getQuestBoard(state) {
  const completedIds = new Set(state?.completedQuests || []);
  const activeId = state?.activeQuest?.id || null;

  const completed = [];
  const available = [];
  const upcoming = [];
  let active = null;

  for (const entry of QUEST_TREE) {
    const quest = QUESTS[entry.id];
    if (!quest) continue;

    const prereqsMet = entry.prerequisites.every((p) => completedIds.has(p));

    if (completedIds.has(entry.id)) {
      completed.push({
        id: entry.id,
        title: quest.title,
        giver: entry.giver || quest.giver,
        category: quest.category || entry.track,
        tier: entry.tier,
        track: entry.track,
        reward: quest.reward,
        status: 'completed',
      });
    } else if (entry.id === activeId) {
      active = {
        id: entry.id,
        title: quest.title,
        giver: entry.giver || quest.giver,
        category: quest.category || entry.track,
        tier: entry.tier,
        track: entry.track,
        stepIndex: state.activeQuest.stepIndex,
        totalSteps: quest.steps.length,
        status: 'active',
      };
    } else if (prereqsMet && !activeId) {
      available.push({
        id: entry.id,
        title: quest.title,
        giver: entry.giver || quest.giver,
        category: quest.category || entry.track,
        tier: entry.tier,
        track: entry.track,
        type: entry.type,
        reward: quest.reward,
        systemsUsed: entry.systemsUsed,
        status: 'available',
      });
    } else if (prereqsMet && activeId) {
      available.push({
        id: entry.id,
        title: quest.title,
        giver: entry.giver || quest.giver,
        category: quest.category || entry.track,
        tier: entry.tier,
        track: entry.track,
        type: entry.type,
        reward: quest.reward,
        status: 'waiting',
      });
    } else {
      const missingCount = entry.prerequisites.filter((p) => !completedIds.has(p)).length;
      const missingNames = entry.prerequisites
        .filter((p) => !completedIds.has(p))
        .map((p) => QUESTS[p]?.title || p)
        .slice(0, 2);

      upcoming.push({
        id: entry.id,
        title: quest.title,
        tier: entry.tier,
        track: entry.track,
        type: entry.type,
        icon: getTrackIcon(entry.track),
        hint: `Complete: ${missingNames.join(', ')}${missingCount > 2 ? ` (+${missingCount - 2} more)` : ''}`,
        prerequisites: entry.prerequisites,
      });
    }
  }

  // Smart prioritization: max 4 suggested, prefer track diversity + lower tiers first
  const MAX_SUGGESTED = 4;
  const suggested = prioritizeQuests(available.filter((q) => q.status === 'available'), completed);

  return {
    available,
    suggested: suggested.slice(0, MAX_SUGGESTED),
    active,
    completed,
    upcoming: upcoming.slice(0, 8),
    locked: LOCKED_SLOTS,
    stats: {
      total: QUEST_TREE.length,
      completed: completed.length,
      available: available.length,
      suggested: Math.min(MAX_SUGGESTED, suggested.length),
      percentage: Math.round((completed.length / QUEST_TREE.length) * 100),
      currentTier: getCurrentTier(completed),
    },
  };
}

/**
 * Prioritize available quests for the "suggested" list.
 * Rules:
 *   1. Lower tier first (don't skip ahead)
 *   2. Main quests before side quests
 *   3. Track diversity (don't suggest 3 ecology quests)
 *   4. Max 4 suggestions
 */
function prioritizeQuests(available, completed) {
  if (available.length <= 4) return available;

  // Sort by tier (lower first), then main before side
  const sorted = [...available].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    if (a.type === 'main' && b.type !== 'main') return -1;
    if (b.type === 'main' && a.type !== 'main') return 1;
    return 0;
  });

  // Pick with track diversity
  const picked = [];
  const tracksSeen = new Set();

  // First pass: one per track
  for (const q of sorted) {
    if (picked.length >= 4) break;
    if (!tracksSeen.has(q.track)) {
      picked.push(q);
      tracksSeen.add(q.track);
    }
  }

  // Second pass: fill remaining slots
  for (const q of sorted) {
    if (picked.length >= 4) break;
    if (!picked.includes(q)) {
      picked.push(q);
    }
  }

  return picked;
}

/**
 * Determine the player's current tier based on completed quests.
 */
function getCurrentTier(completed) {
  let maxTier = 1;
  for (const q of completed) {
    const entry = QUEST_TREE.find((t) => t.id === q.id);
    if (entry && entry.tier > maxTier) maxTier = entry.tier;
  }
  return maxTier;
}

// ── Tree Query Functions ─────────────────────────────────────────────────────

/** Get the full quest tree for visualization. */
export function getQuestTree() {
  return QUEST_TREE.map((entry) => {
    const quest = QUESTS[entry.id];
    return {
      ...entry,
      title: quest?.title || entry.id,
      description: quest?.description || '',
    };
  });
}

/** Get all quests in a specific tier. */
export function getQuestsByTier(tier) {
  return QUEST_TREE.filter((q) => q.tier === tier);
}

/** Get all quests in a specific track. */
export function getQuestsByTrack(track) {
  return QUEST_TREE.filter((q) => q.track === track);
}

/** Get what a quest unlocks. */
export function getQuestUnlocks(questId) {
  const entry = QUEST_TREE.find((q) => q.id === questId);
  return entry?.unlocks || [];
}

/** Get the next available quest for an NPC. */
export function getNextQuestForNPC(npcId, state) {
  const completedIds = new Set(state?.completedQuests || []);
  const activeId = state?.activeQuest?.id || null;
  if (activeId) return null;

  for (const entry of QUEST_TREE) {
    if ((entry.giver || QUESTS[entry.id]?.giver) !== npcId) continue;
    if (completedIds.has(entry.id)) continue;
    const prereqsMet = entry.prerequisites.every((p) => completedIds.has(p));
    if (prereqsMet) return entry.id;
  }
  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTrackIcon(track) {
  const icons = {
    repair: '🔧',
    ecology: '🌿',
    science: '🔬',
    materials: '🔩',
    biology: '🧬',
    language: '🗣️',
  };
  return icons[track] || '📋';
}

function getCategoryIcon(category) {
  return getTrackIcon(category);
}

/**
 * Get quests that are newly unlocked by completing a specific quest.
 * Returns quest entries with titles — used for "new quests unlocked!" notifications.
 */
export function getNewlyUnlocked(completedQuestId, state) {
  const entry = QUEST_TREE.find((q) => q.id === completedQuestId);
  if (!entry || !entry.unlocks) return [];

  const completedIds = new Set(state?.completedQuests || []);
  completedIds.add(completedQuestId); // include the just-completed quest

  return entry.unlocks
    .map((id) => {
      const unlocked = QUEST_TREE.find((q) => q.id === id);
      if (!unlocked) return null;
      // Check if this quest's prerequisites are now all met
      const prereqsMet = unlocked.prerequisites.every((p) => completedIds.has(p));
      if (!prereqsMet) return null;
      const quest = QUESTS[id];
      return {
        id,
        title: quest?.title || id,
        track: unlocked.track,
        tier: unlocked.tier,
        icon: getTrackIcon(unlocked.track),
        giver: unlocked.giver,
      };
    })
    .filter(Boolean);
}
