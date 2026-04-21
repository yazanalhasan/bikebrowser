/**
 * Milestone Engine — evaluates, tracks, and rewards progression milestones.
 *
 * Pure functions operating on game state (same pattern as questSystem.js
 * and knowledgeSystem.js). No side effects — callers persist the result.
 *
 * Architecture:
 *   milestones.js (data)  →  milestoneEngine.js (logic)  →  GameContainer (integration)
 *
 * The engine checks milestone conditions against the full game state,
 * resolves dependency graphs, grants rewards, and exposes query hooks
 * for UI consumption.
 */

import MILESTONES, { MILESTONE_MAP, PHASE_NAMES, CATEGORY_ICONS } from '../data/milestones.js';

// Debug logging — enabled by setting window.__MILESTONE_DEBUG = true in console
function debugLog(...args) {
  if (typeof window !== 'undefined' && window.__MILESTONE_DEBUG) {
    console.log('[Milestone]', ...args);
  }
}

// ── Default State ───────────────────────────────────────────────────────────

/**
 * Default milestone state. Added to save schema.
 */
export function defaultMilestoneState() {
  return {
    completed: [],      // milestone IDs
    completedAt: {},    // { [milestoneId]: timestamp }
    unlocked: [],       // system/feature IDs unlocked by rewards
    currentPhase: 1,    // highest phase with a completed milestone
  };
}

// ── Condition Evaluation Engine ─────────────────────────────────────────────

/**
 * Evaluate a single condition against game state.
 *
 * @param {object} condition - { type, target, value }
 * @param {object} state - full game state (save data)
 * @param {object} milestoneState - state.milestones
 * @returns {{ met: boolean, current: number, required: number }}
 */
function evaluateCondition(condition, state, milestoneState) {
  const { type, target, value } = condition;

  switch (type) {
    case 'quest': {
      const has = (state.completedQuests || []).includes(target);
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    case 'craft': {
      const has = (state.knownRecipes || []).includes(target) ||
                  (state.inventory || []).includes(target);
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    case 'collect': {
      const count = (state.inventory || []).filter((id) => id === target).length;
      return { met: count >= (value || 1), current: count, required: value || 1 };
    }

    case 'build': {
      const has = state.builds?.[target] != null;
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    case 'reputation': {
      const rep = state.reputation || 0;
      return { met: rep >= value, current: rep, required: value };
    }

    case 'skill': {
      const level = state.skills?.[target] || 0;
      return { met: level >= value, current: level, required: value };
    }

    case 'knowledge': {
      const has = (state.knowledge?.unlocked || []).includes(target);
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    case 'material': {
      const count = state.materials?.[target] || 0;
      return { met: count >= value, current: count, required: value };
    }

    case 'milestone': {
      const has = (milestoneState.completed || []).includes(target);
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    case 'bio': {
      const arr = state.bio?.[target] || [];
      return { met: arr.length >= (value || 1), current: arr.length, required: value || 1 };
    }

    case 'mine': {
      const mined = state.minedResources?.[target] || 0;
      return { met: mined >= (value || 1), current: mined, required: value || 1 };
    }

    case 'refine': {
      // Check refined output in state.materials
      const refined = state.materials?.[target] || 0;
      return { met: refined >= (value || 1), current: refined, required: value || 1 };
    }

    case 'discover_region': {
      const visited = state.miningStats?.regionsVisited || [];
      const has = visited.includes(target);
      return { met: has, current: has ? 1 : 0, required: 1 };
    }

    default:
      return { met: false, current: 0, required: 1 };
  }
}

/**
 * Evaluate all conditions for a milestone.
 * Returns { allMet, conditions[] with evaluation results }.
 */
function evaluateMilestone(milestone, state, milestoneState) {
  const results = milestone.conditions.map((cond) => ({
    ...cond,
    ...evaluateCondition(cond, state, milestoneState),
  }));

  return {
    allMet: results.every((r) => r.met),
    conditions: results,
    metCount: results.filter((r) => r.met).length,
    totalCount: results.length,
  };
}

// ── Dependency Graph ────────────────────────────────────────────────────────

/**
 * Check if all dependencies for a milestone are completed.
 */
function dependenciesMet(milestone, milestoneState) {
  if (!milestone.dependencies || milestone.dependencies.length === 0) return true;
  const completed = new Set(milestoneState.completed || []);
  return milestone.dependencies.every((dep) => completed.has(dep));
}

// ── Core Engine Functions ───────────────────────────────────────────────────

/**
 * Check all milestones against current state. Returns newly completed ones.
 * Does NOT mutate state — returns a new milestoneState if anything changed.
 *
 * @param {object} state - full game state
 * @returns {{ milestoneState: object, newlyCompleted: object[], rewards: object[] }}
 */
export function checkMilestones(state) {
  const ms = state.milestones || defaultMilestoneState();
  const completedSet = new Set(ms.completed);
  const newlyCompleted = [];
  const allRewards = [];

  // Iterate all milestones; check uncompleted ones
  for (const milestone of MILESTONES) {
    if (completedSet.has(milestone.id)) continue;

    if (!dependenciesMet(milestone, ms)) {
      debugLog('SKIP', milestone.id, '— deps not met:', milestone.dependencies.filter(
        (d) => !(ms.completed || []).includes(d)
      ));
      continue;
    }

    const eval_ = evaluateMilestone(milestone, state, ms);
    if (eval_.allMet) {
      debugLog('COMPLETE', milestone.id, '— all', eval_.totalCount, 'conditions met');
      newlyCompleted.push(milestone);
      completedSet.add(milestone.id);
      allRewards.push(...(milestone.rewards || []));
    } else {
      const failed = eval_.conditions.filter((c) => !c.met);
      debugLog('BLOCKED', milestone.id, `(${eval_.metCount}/${eval_.totalCount})`,
        '— failing:', failed.map((c) => `${c.type}:${c.target || ''}=${c.current}/${c.required}`).join(', '));
    }
  }

  if (newlyCompleted.length === 0) {
    return { milestoneState: ms, newlyCompleted: [], rewards: [] };
  }

  // Build updated milestone state
  const now = Date.now();
  const completedAt = { ...ms.completedAt };
  for (const m of newlyCompleted) {
    completedAt[m.id] = now;
  }

  // Compute highest completed phase
  let currentPhase = ms.currentPhase || 1;
  for (const m of newlyCompleted) {
    if (m.phase > currentPhase) currentPhase = m.phase;
  }

  // Collect unlocked systems from rewards
  const newUnlocks = allRewards
    .filter((r) => r.type === 'unlock')
    .map((r) => r.target);
  const allUnlocked = [...new Set([...(ms.unlocked || []), ...newUnlocks])];

  const updatedMs = {
    completed: [...completedSet],
    completedAt,
    unlocked: allUnlocked,
    currentPhase,
  };

  return {
    milestoneState: updatedMs,
    newlyCompleted,
    rewards: allRewards,
  };
}

/**
 * Apply milestone rewards to game state.
 * Handles skill, item, knowledge, and era rewards.
 *
 * @param {object} state - full game state
 * @param {object[]} rewards - reward objects from milestone
 * @returns {object} updated game state
 */
export function applyRewards(state, rewards) {
  let updated = { ...state };

  for (const reward of rewards) {
    switch (reward.type) {
      case 'skill': {
        const skills = { ...updated.skills };
        skills[reward.target] = (skills[reward.target] || 0) + (reward.value || 1);
        updated = { ...updated, skills };
        break;
      }
      case 'item': {
        updated = { ...updated, inventory: [...(updated.inventory || []), reward.target] };
        break;
      }
      case 'knowledge': {
        const knowledge = updated.knowledge || { unlocked: [], discoveries: [] };
        if (!knowledge.unlocked.includes(reward.target)) {
          updated = {
            ...updated,
            knowledge: {
              unlocked: [...knowledge.unlocked, reward.target],
              discoveries: [
                ...knowledge.discoveries,
                { conceptId: reward.target, unlockedAt: Date.now(), source: 'milestone' },
              ],
            },
          };
        }
        break;
      }
      // 'unlock', 'era', 'zone' — tracked in milestoneState.unlocked, no extra state change
      default:
        break;
    }
  }

  return updated;
}

/**
 * Complete a specific milestone by ID (manual trigger).
 * Returns updated milestoneState or null if already completed / not found.
 */
export function completeMilestone(milestoneState, milestoneId) {
  const ms = milestoneState || defaultMilestoneState();
  if (ms.completed.includes(milestoneId)) return null;

  const milestone = MILESTONE_MAP[milestoneId];
  if (!milestone) return null;

  return {
    ...ms,
    completed: [...ms.completed, milestoneId],
    completedAt: { ...ms.completedAt, [milestoneId]: Date.now() },
    currentPhase: Math.max(ms.currentPhase || 1, milestone.phase),
  };
}

// ── Query Functions (UI Hooks) ──────────────────────────────────────────────

/**
 * Get all milestones that are currently available (dependencies met, not completed).
 */
export function getAvailableMilestones(state) {
  const ms = state.milestones || defaultMilestoneState();
  const completedSet = new Set(ms.completed);

  return MILESTONES
    .filter((m) => !completedSet.has(m.id) && dependenciesMet(m, ms))
    .map((m) => {
      const eval_ = evaluateMilestone(m, state, ms);
      return {
        ...m,
        icon: CATEGORY_ICONS[m.category] || '📋',
        progress: eval_.metCount / eval_.totalCount,
        conditions: eval_.conditions,
        ready: eval_.allMet,
      };
    });
}

/**
 * Get completed milestones with timestamps.
 */
export function getCompletedMilestones(milestoneState) {
  const ms = milestoneState || defaultMilestoneState();
  return ms.completed.map((id) => {
    const milestone = MILESTONE_MAP[id];
    return milestone ? {
      ...milestone,
      icon: CATEGORY_ICONS[milestone.category] || '📋',
      completedAt: ms.completedAt[id],
    } : null;
  }).filter(Boolean);
}

/**
 * Get progression summary by phase.
 */
export function getProgressionSummary(milestoneState) {
  const ms = milestoneState || defaultMilestoneState();
  const completedSet = new Set(ms.completed);

  const phases = {};
  for (const milestone of MILESTONES) {
    const p = milestone.phase;
    if (!phases[p]) {
      phases[p] = {
        phase: p,
        name: PHASE_NAMES[p] || `Phase ${p}`,
        total: 0,
        completed: 0,
        percentage: 0,
      };
    }
    phases[p].total++;
    if (completedSet.has(milestone.id)) phases[p].completed++;
  }

  for (const p of Object.values(phases)) {
    p.percentage = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
  }

  const total = MILESTONES.length;
  const completed = ms.completed.length;

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    currentPhase: ms.currentPhase || 1,
    phases,
  };
}

/**
 * Get milestones by category with completion status.
 */
export function getMilestonesByDomain(milestoneState) {
  const ms = milestoneState || defaultMilestoneState();
  const completedSet = new Set(ms.completed);
  const domains = {};

  for (const milestone of MILESTONES) {
    const cat = milestone.category;
    if (!domains[cat]) {
      domains[cat] = {
        category: cat,
        icon: CATEGORY_ICONS[cat] || '📋',
        milestones: [],
        completed: 0,
        total: 0,
      };
    }
    domains[cat].total++;
    if (completedSet.has(milestone.id)) domains[cat].completed++;
    domains[cat].milestones.push({
      id: milestone.id,
      name: milestone.name,
      phase: milestone.phase,
      completed: completedSet.has(milestone.id),
    });
  }

  return domains;
}

/**
 * Check if a specific system/feature is unlocked via milestones.
 */
export function isFeatureUnlocked(milestoneState, featureId) {
  const ms = milestoneState || defaultMilestoneState();
  return (ms.unlocked || []).includes(featureId);
}

/**
 * Get the dependency tree for visualization.
 * Returns nodes and edges for rendering a DAG.
 */
export function getDependencyGraph() {
  const nodes = MILESTONES.map((m) => ({
    id: m.id,
    name: m.name,
    phase: m.phase,
    category: m.category,
    icon: CATEGORY_ICONS[m.category] || '📋',
  }));

  const edges = [];
  for (const m of MILESTONES) {
    for (const dep of m.dependencies || []) {
      edges.push({ from: dep, to: m.id });
    }
  }

  return { nodes, edges };
}
