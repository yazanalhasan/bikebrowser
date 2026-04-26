/**
 * progressionReachabilityAudit.js — DEV-only soft-lock detector.
 *
 * Catches the bridge_collapse bug class: a quest is started but the
 * resources/scenes it needs are gated behind that very quest. Pure
 * observer — never mutates state. Wired by runtimeAudit (boot) and
 * questSystem.startQuest (post-activation).
 *
 * Checks: (1) item reachability + fallbacks, (2) scene self-cycle,
 * (3) discovery visibility via DISCOVERY_UNLOCKS reverse map,
 * (4) fallback variants (folded into 1), (5) DFS cycle detection
 * across quest → items+scenes → unlocks → other quests.
 */

import QUESTS from '../data/quests.js';
import ITEMS from '../data/items.js';
import SCENES from './sceneRegistry.js';
import { DISCOVERY_UNLOCKS } from '../data/discoveryUnlocks.js';
import { WORLD_LOCATIONS } from '../data/worldMapData.js';
import {
  SCENE_ITEM_GRANTS,
  STARTING_INVENTORY,
} from '../data/sceneItemGrants.js';

const SCENE_FIELDS = ['scene', 'targetScene', 'transitionTo'];

const makeError = (type, p) => ({ type, ...p });
const makeWarning = (type, p) => ({ type, ...p });

/** Inverse of DISCOVERY_UNLOCKS: questId → [locationId,...] (mirrors discoveryBridge). */
function buildQuestToLocations() {
  const out = {};
  if (!DISCOVERY_UNLOCKS || typeof DISCOVERY_UNLOCKS !== 'object') return out;
  for (const [locId, spec] of Object.entries(DISCOVERY_UNLOCKS)) {
    if (!spec || spec.pending) continue;
    const qid = spec.questId || spec.quest;
    if (!qid) continue;
    if (!out[qid]) out[qid] = [];
    out[qid].push(locId);
  }
  return out;
}

/** Find the world-map entry whose entryScene matches sceneKey. */
function findLocationForScene(sceneKey) {
  if (!WORLD_LOCATIONS) return null;
  for (const [id, loc] of Object.entries(WORLD_LOCATIONS)) {
    if (loc && loc.entryScene === sceneKey) return { id, location: loc };
  }
  return null;
}

/** itemId → [{sceneKey, condition}, ...] from the manifest. */
function collectAllSceneGrants() {
  const out = {};
  for (const [sceneKey, grants] of Object.entries(SCENE_ITEM_GRANTS || {})) {
    for (const g of grants || []) {
      if (!g || !g.itemId) continue;
      if (!out[g.itemId]) out[g.itemId] = [];
      out[g.itemId].push({ sceneKey, condition: g.condition || null });
    }
  }
  return out;
}

/** itemId → [questId, ...] from quest reward.items. */
function collectQuestRewardGrants() {
  const out = {};
  for (const [qid, q] of Object.entries(QUESTS || {})) {
    const items = q?.reward?.items || [];
    for (const itemId of items) {
      if (!out[itemId]) out[itemId] = [];
      out[itemId].push(qid);
    }
  }
  return out;
}

/**
 * Structural scene reachability for a given quest. We do NOT walk the
 * full prerequisite chain — that's progression, not structure. Only
 * self-cycles (a quest gating on its own completion) are flagged.
 */
function isSceneReachableForQuest(sceneKey, questId) {
  const scene = SCENES[sceneKey];
  if (!scene) return { reachable: false, reason: 'scene-not-registered' };
  const req = scene.unlockReq;
  if (!req) return { reachable: true, reason: 'always-open' };

  if (Array.isArray(req.questsAll) && req.questsAll.includes(questId)) {
    return {
      reachable: false,
      reason: `questsAll requires '${questId}' (self-cycle)`,
    };
  }
  if (
    Array.isArray(req.questsAny) &&
    req.questsAny.length === 1 &&
    req.questsAny.includes(questId)
  ) {
    return {
      reachable: false,
      reason: `questsAny only accepts completed '${questId}' (self-cycle)`,
    };
  }
  return { reachable: true, reason: 'gates-do-not-cycle' };
}

// ── Sub-audits ──────────────────────────────────────────────────────────────

/** Checks 1+4: item reachability with fallback variants. */
function auditItemReachability(state, ctx) {
  const errors = [];
  const warnings = [];
  const startingSet = new Set(STARTING_INVENTORY);
  const playerInv = new Set(state?.inventory || []);

  for (const [questId, quest] of Object.entries(QUESTS || {})) {
    for (const step of quest.steps || []) {
      const need = step.requiredItem;
      if (!need || !ITEMS[need]) continue;
      if (playerInv.has(need) || startingSet.has(need)) continue;

      const sceneSrcs = ctx.sceneGrants[need] || [];
      const rewardSrcs = ctx.rewardGrants[need] || [];

      const reachableScenes = sceneSrcs.filter(
        (src) => isSceneReachableForQuest(src.sceneKey, questId).reachable
      );
      const reachableRewards = rewardSrcs.filter((qid) => qid !== questId);

      if (reachableScenes.length === 0 && reachableRewards.length === 0) {
        if (sceneSrcs.length === 0 && rewardSrcs.length === 0) {
          warnings.push(makeWarning('INCOMPLETE_DATA', {
            questId, stepId: step.id, itemId: need,
            reason: `no source recorded for item '${need}' — add to sceneItemGrants.js or quests.js reward`,
          }));
        } else {
          errors.push(makeError('UNREACHABLE_PROGRESS', {
            questId, stepId: step.id, itemId: need,
            reason: `item '${need}' has sources but none are reachable for quest '${questId}'`,
            path: [
              ...sceneSrcs.map((s) => `${s.sceneKey} → ${isSceneReachableForQuest(s.sceneKey, questId).reason}`),
              ...rewardSrcs.map((q) => `reward of '${q}'`),
            ],
          }));
        }
      }
    }
  }
  return { errors, warnings };
}

/** Check 2: scene-reachability self-cycle detection. */
function auditSceneReachability() {
  const errors = [];
  const warnings = [];
  for (const [questId, quest] of Object.entries(QUESTS || {})) {
    const seen = new Set();
    for (const step of quest.steps || []) {
      for (const f of SCENE_FIELDS) {
        const sceneKey = step[f];
        if (!sceneKey || seen.has(sceneKey)) continue;
        seen.add(sceneKey);
        const r = isSceneReachableForQuest(sceneKey, questId);
        if (!r.reachable && r.reason !== 'scene-not-registered') {
          errors.push(makeError('UNREACHABLE_PROGRESS', {
            questId, stepId: step.id, sceneKey,
            reason: `scene '${sceneKey}' unreachable: ${r.reason}`,
            path: [`${questId} → ${sceneKey}.unlockReq`],
          }));
        }
      }
    }
  }
  return { errors, warnings };
}

/** Check 3: discovery visibility — quest must be able to reveal its scenes. */
function auditDiscoveryVisibility(state, ctx) {
  const errors = [];
  const warnings = [];
  const discovered = new Set(state?.discoveredLocations || state?.discovered || []);

  for (const [questId, quest] of Object.entries(QUESTS || {})) {
    const seen = new Set();
    const revealedLocs = new Set(ctx.questToLocations[questId] || []);
    for (const step of quest.steps || []) {
      for (const f of SCENE_FIELDS) {
        const sceneKey = step[f];
        if (!sceneKey || seen.has(sceneKey)) continue;
        seen.add(sceneKey);
        const found = findLocationForScene(sceneKey);
        if (!found) continue; // not a world-map sub-scene
        const locId = found.id;
        if (discovered.has(locId)) continue;
        if (revealedLocs.has(locId)) continue;
        errors.push(makeError('UNREACHABLE_PROGRESS', {
          questId, stepId: step.id, sceneKey, locationId: locId,
          reason: `quest '${questId}' needs scene '${sceneKey}' at location '${locId}' with no discovery path`,
          path: [`${questId} → ${sceneKey} → ${locId} (fogged)`],
        }));
      }
    }
  }
  return { errors, warnings };
}

/** Check 5: dependency-graph cycle detection (DFS white/grey/black). */
function auditDependencyCycles(ctx) {
  const errors = [];
  const warnings = [];
  const adj = {};

  for (const [questId, quest] of Object.entries(QUESTS || {})) {
    const deps = new Set();
    for (const step of quest.steps || []) {
      const need = step.requiredItem;
      if (need && ctx.sceneGrants[need]) {
        for (const src of ctx.sceneGrants[need]) {
          const req = SCENES[src.sceneKey] && SCENES[src.sceneKey].unlockReq;
          if (!req) continue;
          for (const arr of [req.questsAll, req.questsAny, req.questsAnyOrActive]) {
            if (Array.isArray(arr)) for (const q of arr) deps.add(q);
          }
        }
      }
      for (const f of SCENE_FIELDS) {
        const k = step[f];
        if (!k) continue;
        const req = SCENES[k] && SCENES[k].unlockReq;
        if (!req) continue;
        for (const arr of [req.questsAll, req.questsAny]) {
          if (Array.isArray(arr)) for (const q of arr) deps.add(q);
        }
      }
    }
    deps.delete(questId);
    adj[questId] = deps;
  }

  const WHITE = 0, GREY = 1, BLACK = 2;
  const color = {};
  for (const q of Object.keys(adj)) color[q] = WHITE;

  function visit(q, path) {
    color[q] = GREY;
    path.push(q);
    for (const next of adj[q] || []) {
      if (color[next] === GREY) {
        const idx = path.indexOf(next);
        const cycle = idx >= 0 ? path.slice(idx).concat(next) : [next];
        errors.push(makeError('UNREACHABLE_PROGRESS', {
          questId: q,
          reason: `dependency cycle detected: ${cycle.join(' → ')}`,
          path: cycle,
        }));
      } else if (color[next] === WHITE && QUESTS[next]) {
        visit(next, path);
      }
    }
    path.pop();
    color[q] = BLACK;
  }
  for (const q of Object.keys(adj)) {
    if (color[q] === WHITE) visit(q, []);
  }
  return { errors, warnings };
}

// ── Main entry point ────────────────────────────────────────────────────────

function describe(entry) {
  const parts = [];
  if (entry.questId) parts.push(`quest=${entry.questId}`);
  if (entry.stepId) parts.push(`step=${entry.stepId}`);
  if (entry.itemId) parts.push(`item=${entry.itemId}`);
  if (entry.sceneKey) parts.push(`scene=${entry.sceneKey}`);
  if (entry.locationId) parts.push(`loc=${entry.locationId}`);
  parts.push(entry.reason || '(no reason)');
  return parts.join(' ');
}

/**
 * Run all reachability checks. Returns errors/warnings + a small graph summary.
 *
 * @param {object} [state] — game save state; pass {} for boot/structural audit.
 * @param {{ silent?: boolean }} [options]
 * @returns {{ errors, warnings, passed, reachability_graph }}
 */
export function runProgressionReachabilityAudit(state = {}, { silent = false } = {}) {
  const ctx = {
    sceneGrants: collectAllSceneGrants(),
    rewardGrants: collectQuestRewardGrants(),
    questToLocations: buildQuestToLocations(),
  };

  const allErrors = [];
  const allWarnings = [];
  const checks = [
    { name: 'itemReachability', fn: () => auditItemReachability(state, ctx) },
    { name: 'sceneReachability', fn: () => auditSceneReachability() },
    { name: 'discoveryVisibility', fn: () => auditDiscoveryVisibility(state, ctx) },
    { name: 'dependencyCycles', fn: () => auditDependencyCycles(ctx) },
  ];

  for (const { name, fn } of checks) {
    try {
      const r = fn();
      allErrors.push(...(r.errors || []));
      allWarnings.push(...(r.warnings || []));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[progressionAudit] internal error in ${name}:`, err?.message || err);
    }
  }

  const passed = allErrors.length === 0;
  if (!silent) {
    const label = passed
      ? `[progressionAudit] PASS — 0 errors, ${allWarnings.length} warnings`
      : `[progressionAudit] FAIL — ${allErrors.length} errors, ${allWarnings.length} warnings`;
    // eslint-disable-next-line no-console
    console.group(label);
    for (const e of allErrors) console.error(`  ERROR  [${e.type}] ${describe(e)}`);
    for (const w of allWarnings) console.warn(`  WARN   [${w.type}] ${describe(w)}`);
    if (allErrors.length === 0 && allWarnings.length === 0) {
      // eslint-disable-next-line no-console
      console.log('  All progression-reachability checks passed.');
    }
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  return {
    errors: allErrors,
    warnings: allWarnings,
    passed,
    reachability_graph: {
      sceneGrantedItems: Object.keys(ctx.sceneGrants).length,
      rewardItems: Object.keys(ctx.rewardGrants).length,
      questsWithReveals: Object.keys(ctx.questToLocations).length,
    },
  };
}

export default runProgressionReachabilityAudit;
