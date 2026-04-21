/**
 * Factory System — friend-owned production facilities.
 *
 * Zuzu converts friends' houses into specialized workshops.
 * Each factory takes raw materials → produces components.
 * Factories level up for faster production and new outputs.
 *
 * Pure functions — operates on factory state from save data.
 */

import { FRIENDS, FACTORY_TYPES } from '../data/factories.js';

// ── Factory State ────────────────────────────────────────────────────────────

/**
 * Default factory state (no factories unlocked).
 */
export function defaultFactoryState() {
  const state = {};
  for (const friendId of Object.keys(FRIENDS)) {
    state[friendId] = null; // not unlocked
  }
  return state;
}

/**
 * Create a new factory for a friend.
 */
export function createFactory(friendId) {
  const friend = FRIENDS[friendId];
  if (!friend) return null;

  const factoryType = FACTORY_TYPES[friend.defaultFactory];
  if (!factoryType) return null;

  const level1 = factoryType.levels[0];
  return {
    owner: friendId,
    type: friend.defaultFactory,
    level: 1,
    productionRate: level1.productionRate,
    inputs: level1.inputs,
    outputs: level1.outputs,
    lastProducedAt: Date.now(),
    totalProduced: 0,
  };
}

// ── Unlock Logic ─────────────────────────────────────────────────────────────

/**
 * Check if a friend's factory can be unlocked.
 *
 * @param {string} friendId
 * @param {number} reputation - player's current reputation
 * @param {string[]} completedQuests
 * @returns {{ canUnlock: boolean, reason?: string }}
 */
export function canUnlockFactory(friendId, reputation, completedQuests) {
  const friend = FRIENDS[friendId];
  if (!friend) return { canUnlock: false, reason: 'Unknown friend.' };

  const req = friend.unlockRequirements;

  if (reputation < req.reputation) {
    return {
      canUnlock: false,
      reason: `Need ${req.reputation} reputation (have ${reputation}).`,
    };
  }

  if (req.quest && !completedQuests.includes(req.quest)) {
    return {
      canUnlock: false,
      reason: `Complete quest "${req.quest}" first.`,
    };
  }

  return { canUnlock: true };
}

/**
 * Unlock a factory. Returns updated factory state.
 */
export function unlockFactory(factoryState, friendId) {
  const factory = createFactory(friendId);
  if (!factory) return factoryState;
  return { ...factoryState, [friendId]: factory };
}

// ── Production ───────────────────────────────────────────────────────────────

/**
 * Run a production tick for all active factories.
 *
 * @param {object} factoryState
 * @param {object} materials - current material inventory { [id]: count }
 * @param {number} now - current timestamp
 * @returns {{ factoryState: object, materials: object, produced: object[] }}
 */
export function tickProduction(factoryState, materials, now) {
  const newState = { ...factoryState };
  const newMaterials = { ...materials };
  const produced = [];

  for (const [friendId, factory] of Object.entries(factoryState)) {
    if (!factory) continue;

    // Production interval: 1 unit per 60 seconds × productionRate
    const elapsed = (now - factory.lastProducedAt) / 1000;
    const interval = 60 / factory.productionRate;
    const cycles = Math.floor(elapsed / interval);

    if (cycles <= 0) continue;

    // Check if inputs are available
    let canProduce = true;
    for (const input of factory.inputs) {
      if ((newMaterials[input] || 0) < cycles) {
        canProduce = false;
        break;
      }
    }

    if (!canProduce) continue;

    // Consume inputs
    for (const input of factory.inputs) {
      newMaterials[input] = (newMaterials[input] || 0) - cycles;
    }

    // Produce outputs
    for (const output of factory.outputs) {
      newMaterials[output] = (newMaterials[output] || 0) + cycles;
      produced.push({ factory: friendId, item: output, count: cycles });
    }

    newState[friendId] = {
      ...factory,
      lastProducedAt: now,
      totalProduced: factory.totalProduced + cycles,
    };
  }

  return { factoryState: newState, materials: newMaterials, produced };
}

// ── Upgrades ─────────────────────────────────────────────────────────────────

/**
 * Check if a factory can be upgraded.
 */
export function canUpgradeFactory(factory, zuzubucks, materials) {
  if (!factory) return { canUpgrade: false, reason: 'No factory.' };

  const factoryType = FACTORY_TYPES[factory.type];
  if (!factoryType) return { canUpgrade: false, reason: 'Unknown factory type.' };

  const nextLevel = factoryType.levels.find((l) => l.level === factory.level + 1);
  if (!nextLevel) return { canUpgrade: false, reason: 'Already at max level.' };

  const cost = nextLevel.upgradeCost;
  if (zuzubucks < (cost.zuzubucks || 0)) {
    return { canUpgrade: false, reason: `Need ${cost.zuzubucks} Zuzubucks.` };
  }

  if (cost.materials) {
    for (const [matId, count] of Object.entries(cost.materials)) {
      if ((materials[matId] || 0) < count) {
        return { canUpgrade: false, reason: `Need ${count}× ${matId}.` };
      }
    }
  }

  return { canUpgrade: true, cost, nextLevel };
}

/**
 * Upgrade a factory to the next level.
 * Returns { factoryState, zuzubucks, materials } or null if can't upgrade.
 */
export function upgradeFactory(factoryState, friendId, zuzubucks, materials) {
  const factory = factoryState[friendId];
  const check = canUpgradeFactory(factory, zuzubucks, materials);
  if (!check.canUpgrade) return null;

  const cost = check.cost;
  let newBucks = zuzubucks - (cost.zuzubucks || 0);
  let newMats = { ...materials };
  if (cost.materials) {
    for (const [matId, count] of Object.entries(cost.materials)) {
      newMats[matId] = (newMats[matId] || 0) - count;
    }
  }

  const nextLevel = check.nextLevel;
  const newFactory = {
    ...factory,
    level: nextLevel.level,
    productionRate: nextLevel.productionRate,
    inputs: nextLevel.inputs,
    outputs: nextLevel.outputs,
  };

  return {
    factoryState: { ...factoryState, [friendId]: newFactory },
    zuzubucks: newBucks,
    materials: newMats,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get all unlockable friends (not yet unlocked, requirements checkable).
 */
export function getUnlockableFriends(factoryState, reputation, completedQuests) {
  return Object.entries(FRIENDS)
    .filter(([id]) => !factoryState[id])
    .map(([id, friend]) => ({
      ...friend,
      ...canUnlockFactory(id, reputation, completedQuests),
    }));
}

/**
 * Get all active factories with their type info.
 */
export function getActiveFactories(factoryState) {
  return Object.entries(factoryState)
    .filter(([, factory]) => factory !== null)
    .map(([friendId, factory]) => ({
      ...factory,
      friend: FRIENDS[friendId],
      factoryType: FACTORY_TYPES[factory.type],
    }));
}

/**
 * Get total production output across all factories.
 */
export function getTotalOutput(factoryState) {
  let total = 0;
  for (const factory of Object.values(factoryState)) {
    if (factory) total += factory.totalProduced;
  }
  return total;
}
