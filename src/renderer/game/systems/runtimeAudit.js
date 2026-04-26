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
 * auditDiscoveryUnlocks — validates DISCOVERY_UNLOCKS if the module exists.
 * Absent file = expected until world-discovery-quests lands; logs info + skips.
 */
async function auditDiscoveryUnlocks() {
  const errors = [];
  const warnings = [];

  let DISCOVERY_UNLOCKS;
  try {
    // Hide the path behind a variable so neither Vite's pre-bundler nor Rollup
    // (production build) statically analyze it. Without this indirection, the
    // build fails with "Could not resolve ../data/discoveryUnlocks.js" because
    // the file is the world-discovery-quests agent's deliverable and has not
    // shipped yet. The runtime try/catch handles the actual import failure.
    const modPath = '../data/discoveryUnlocks.js';
    const mod = await import(/* @vite-ignore */ modPath);
    DISCOVERY_UNLOCKS = mod.default || mod.DISCOVERY_UNLOCKS;
  } catch {
    console.log('[runtimeAudit] DISCOVERY_UNLOCKS module not yet present — auditDiscoveryUnlocks skipped');
    return { errors, warnings, skipped: true };
  }

  if (!DISCOVERY_UNLOCKS || typeof DISCOVERY_UNLOCKS !== 'object') {
    warnings.push(makeWarning(
      'data/discoveryUnlocks.js',
      'DISCOVERY_UNLOCKS is not a valid object — skipping validation'
    ));
    return { errors, warnings };
  }

  const questIds = new Set(Object.keys(QUESTS));
  const regionIds = new Set(REGIONS.map((r) => r.id));

  for (const [regionId, entry] of Object.entries(DISCOVERY_UNLOCKS)) {
    if (!regionIds.has(regionId)) {
      errors.push(makeError(
        'data/discoveryUnlocks.js',
        `DISCOVERY_UNLOCKS entry "${regionId}" does not match any region in regions.js`
      ));
      continue;
    }
    if (entry.pending === true) continue;
    const questRef = entry.quest || entry.questId;
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

  try {
    const result = await auditDiscoveryUnlocks();
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  } catch (err) {
    console.error('[runtimeAudit] internal error in auditDiscoveryUnlocks:', err?.message || err);
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
