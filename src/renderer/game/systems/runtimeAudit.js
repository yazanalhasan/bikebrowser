/**
 * runtimeAudit.js — Boot-time cross-system consistency validator.
 *
 * Runs every game boot in DEV mode. Surfaces broken data references to
 * the dev console without blocking play. Pure observer — never modifies
 * any data file.
 *
 * Entry point:
 *   runRuntimeAudit({ silent = false }) → { errors, warnings, passed }
 */

import QUESTS from '../data/quests.js';
import ITEMS from '../data/items.js';
import REGIONS, { BIOME, getBiome } from '../data/regions.js';
import { debugListVoiceAssignments } from '../services/npcSpeech.js';
import NPC_PROFILES from '../data/npcProfiles.js';
import { createGameConfig } from '../config.js';
import DISCOVERY_UNLOCKS_REAL from '../data/discoveryUnlocks.js';
import { WORLD_LOCATIONS } from '../data/worldMapData.js';
import { runProgressionReachabilityAudit } from './progressionReachabilityAudit.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeError(where, message) {
  return { where, message };
}

function makeWarning(where, message) {
  return { where, message };
}

// Derive the scene key set by calling createGameConfig with dummy args and
// reading the .scene array. No Phaser instance is created — this is a
// pure config-object inspection.
function _getRegisteredSceneKeys() {
  try {
    const cfg = createGameConfig(null, 0, 0);
    const keys = new Set();
    for (const SceneClass of (cfg.scene || [])) {
      if (SceneClass && SceneClass.name) keys.add(SceneClass.name);
    }
    return keys;
  } catch {
    return new Set();
  }
}

// ── Sub-audits ────────────────────────────────────────────────────────────────

/**
 * auditQuestGivers — every quest's `giver` must exist in CHARACTER_GENDER
 * (via debugListVoiceAssignments) OR have a profile in NPC_PROFILES.
 * Mismatch = warning (not error), since quests may reference NPCs that
 * pre-date tts-voice-config coverage.
 */
function auditQuestGivers() {
  const errors = [];
  const warnings = [];

  // debugListVoiceAssignments() returns { [npcId]: voiceName } for all ids
  // in CHARACTER_GENDER — use its keys as the known voice-config set.
  const voiceConfigIds = new Set(Object.keys(debugListVoiceAssignments()));
  const profileIds = new Set(Object.keys(NPC_PROFILES));

  for (const [questId, quest] of Object.entries(QUESTS)) {
    if (!quest.giver) {
      warnings.push(makeWarning(
        'data/quests.js',
        `quest "${questId}" has no giver field`
      ));
      continue;
    }
    if (!voiceConfigIds.has(quest.giver) && !profileIds.has(quest.giver)) {
      warnings.push(makeWarning(
        'data/quests.js',
        `quest "${questId}" giver "${quest.giver}" not found in CHARACTER_GENDER or npcProfiles`
      ));
    }
  }

  return { errors, warnings };
}

/**
 * auditQuestItems — every `requiredItem` in quest steps must exist in items.js.
 * Missing item = error.
 */
function auditQuestItems() {
  const errors = [];
  const warnings = [];

  const itemIds = new Set(Object.keys(ITEMS));

  for (const [questId, quest] of Object.entries(QUESTS)) {
    const steps = quest.steps || [];
    for (const step of steps) {
      if (step.requiredItem && !itemIds.has(step.requiredItem)) {
        errors.push(makeError(
          'data/quests.js',
          `quest "${questId}" step "${step.id}" requiredItem "${step.requiredItem}" not found in items.js`
        ));
      }
    }
  }

  return { errors, warnings };
}

/**
 * auditQuestScenes — every scene key referenced in quest steps must be
 * registered in config.js (ALL_SCENES). Missing scene = error.
 *
 * Checks step fields: `scene`, `targetScene`, `transitionTo`.
 */
function auditQuestScenes() {
  const errors = [];
  const warnings = [];

  const registeredScenes = _getRegisteredSceneKeys();
  const SCENE_FIELDS = ['scene', 'targetScene', 'transitionTo'];

  for (const [questId, quest] of Object.entries(QUESTS)) {
    const steps = quest.steps || [];
    for (const step of steps) {
      for (const field of SCENE_FIELDS) {
        const sceneKey = step[field];
        if (sceneKey && !registeredScenes.has(sceneKey)) {
          errors.push(makeError(
            'data/quests.js',
            `quest "${questId}" step "${step.id}" field "${field}" references unregistered scene "${sceneKey}"`
          ));
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * auditRegionBiomes — every region must have a non-UNKNOWN biome.
 * UNKNOWN = warning (known gap: chinese, malay).
 */
function auditRegionBiomes() {
  const errors = [];
  const warnings = [];

  for (const region of REGIONS) {
    const biome = getBiome(region.id);
    if (!biome || biome === BIOME.UNKNOWN) {
      warnings.push(makeWarning(
        'data/regions.js',
        `region "${region.id}" (${region.name}) has UNKNOWN biome — terrain renderer will use fallback`
      ));
    }
  }

  return { errors, warnings };
}

/**
 * auditDiscoveryUnlocks — validates DISCOVERY_UNLOCKS.
 *
 * The module is statically imported at the top of this file, so it is
 * guaranteed to be evaluated by the time this function runs. The previous
 * dynamic-import pattern (commit c2fae90) was a workaround for the file
 * not yet existing during world-discovery-quests development; it raced
 * against module evaluation at boot and produced misleading
 * "module not yet present" log messages on first boot. The file ships
 * now, so a static import is race-free and clearer.
 *
 * Malformed-data resilience: if the import yields a non-object (e.g. data
 * corruption, accidental refactor) we emit a warning and skip iteration.
 * Iteration itself is wrapped in try/catch so a single broken entry does
 * not abort the audit.
 */
function auditDiscoveryUnlocks() {
  const errors = [];
  const warnings = [];

  const DISCOVERY_UNLOCKS = DISCOVERY_UNLOCKS_REAL;

  if (!DISCOVERY_UNLOCKS || typeof DISCOVERY_UNLOCKS !== 'object') {
    warnings.push(makeWarning(
      'data/discoveryUnlocks.js',
      'DISCOVERY_UNLOCKS is not a valid object — skipping validation'
    ));
    return { errors, warnings };
  }

  // ── Data-source assertion (amended-.md hard rule: consult inline docs before validating)
  //
  // discoveryUnlocks.js:14-21 documents that its keys are WORLD_LOCATIONS IDs
  // (from worldMapData.js), NOT regions.js IDs. Validating against regions.js alone
  // is therefore too coarse and produces false-positive errors for every valid
  // location-level key (desert_foraging, copper_mine, salt_river, mountain_range).
  // The audit must accept either a regions.js region ID or a worldMapData.js location ID.
  //
  // If either data source is unavailable, we fail loudly so future divergence is caught
  // early rather than silently masking the audit.
  const regionIds = new Set(REGIONS.map((r) => r.id));
  const worldLocationIds = WORLD_LOCATIONS ? new Set(Object.keys(WORLD_LOCATIONS)) : null;
  if (regionIds.size === 0 && !worldLocationIds) {
    errors.push(makeError(
      'data/discoveryUnlocks.js',
      '[auditDiscoveryUnlocks] ASSERTION FAILED: neither regions.js nor worldMapData.js WORLD_LOCATIONS is importable — cannot validate keys'
    ));
    return { errors, warnings };
  }
  if (!worldLocationIds) {
    warnings.push(makeWarning(
      'data/discoveryUnlocks.js',
      '[auditDiscoveryUnlocks] worldMapData.js WORLD_LOCATIONS not importable — key validation uses regions.js only (may produce false positives for location-level keys)'
    ));
  }
  // Union: a key is valid if it matches any region OR any world-map location.
  const validKeys = new Set([...regionIds, ...(worldLocationIds || [])]);

  try {
    const questIds = new Set(Object.keys(QUESTS));

    for (const [regionId, entry] of Object.entries(DISCOVERY_UNLOCKS)) {
      if (!validKeys.has(regionId)) {
        errors.push(makeError(
          'data/discoveryUnlocks.js',
          `DISCOVERY_UNLOCKS entry "${regionId}" does not match any region in regions.js or any location in worldMapData.js`
        ));
        continue;
      }
      if (entry && entry.pending === true) continue;
      const questRef = entry && (entry.quest || entry.questId);
      if (!questRef) {
        errors.push(makeError(
          'data/discoveryUnlocks.js',
          `DISCOVERY_UNLOCKS["${regionId}"] has no quest reference and no pending:true`
        ));
      } else if (!questIds.has(questRef)) {
        errors.push(makeError(
          'data/discoveryUnlocks.js',
          `DISCOVERY_UNLOCKS["${regionId}"] references unknown quest "${questRef}"`
        ));
      }
    }
  } catch (err) {
    warnings.push(makeWarning(
      'data/discoveryUnlocks.js',
      `iteration aborted: ${err?.message || err}`
    ));
  }

  return { errors, warnings };
}

// ── Main entry point ──────────────────────────────────────────────────────────

/**
 * Run all sub-audits and aggregate results.
 *
 * @param {{ silent?: boolean }} [options]
 * @returns {Promise<{ errors: Array, warnings: Array, passed: boolean }>}
 */
export async function runRuntimeAudit({ silent = false } = {}) {
  const allErrors = [];
  const allWarnings = [];

  const syncAudits = [
    { name: 'auditQuestGivers', fn: auditQuestGivers },
    { name: 'auditQuestItems', fn: auditQuestItems },
    { name: 'auditQuestScenes', fn: auditQuestScenes },
    { name: 'auditRegionBiomes', fn: auditRegionBiomes },
    { name: 'auditDiscoveryUnlocks', fn: auditDiscoveryUnlocks },
    { name: 'auditProgressionReachability', fn: () => {
      const r = runProgressionReachabilityAudit({}, { silent: true });
      return {
        errors: r.errors.map((e) => makeError('progressionReachability', `[${e.type}] ${e.questId ? 'quest=' + e.questId + ' ' : ''}${e.reason}`)),
        warnings: r.warnings.map((w) => makeWarning('progressionReachability', `[${w.type}] ${w.questId ? 'quest=' + w.questId + ' ' : ''}${w.reason || ''}`)),
      };
    } },
  ];

  for (const { name, fn } of syncAudits) {
    try {
      const result = fn();
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    } catch (err) {
      console.error(`[runtimeAudit] internal error in ${name}:`, err?.message || err);
    }
  }

  const passed = allErrors.length === 0;

  if (!silent) {
    const label = passed
      ? `[runtimeAudit] PASS — 0 errors, ${allWarnings.length} warnings`
      : `[runtimeAudit] FAIL — ${allErrors.length} errors, ${allWarnings.length} warnings`;

    console.group(label);

    for (const e of allErrors) {
      console.error(`  ERROR  [${e.where}] ${e.message}`);
    }
    for (const w of allWarnings) {
      console.warn(`  WARN   [${w.where}] ${w.message}`);
    }

    if (allErrors.length === 0 && allWarnings.length === 0) {
      console.log('  All cross-system checks passed.');
    }

    console.groupEnd();
  }

  return { errors: allErrors, warnings: allWarnings, passed };
}
