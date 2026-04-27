#!/usr/bin/env node
/**
 * Migration test: v5 → v6 (Materials Lab density-measurement fields).
 *
 * The agent spec authored this as "v4 → v5", but `CURRENT_VERSION` was
 * already 5 when this dispatch ran (v4→v5 was taken by an unrelated
 * soft-lock band-aid migration in saveSystem.js). The migration here is
 * functionally what the spec asked for, just shifted to the next free
 * slot.
 *
 * Asserts:
 *   1. v5 fixture migrates cleanly to v6.
 *   2. New fields `materialLog` and `derivedAnswers` are present after.
 *   3. Existing fields (observations, materialTestsCompleted) preserved.
 *   4. Round-trip migrate→serialize→migrate is idempotent.
 *
 * Run directly: `node scripts/test-lab-notebook-migration.js`
 * Exits 0 on PASS, non-zero on FAIL.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// We re-extract the migration function from the source file rather than
// importing it (saveSystem.js depends on `localStorage` and the discovery
// module, neither available in plain Node). This keeps the test fast and
// dependency-free.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SAVE_SYSTEM_PATH = resolve(__dirname, '../src/renderer/game/systems/saveSystem.js');

const src = readFileSync(SAVE_SYSTEM_PATH, 'utf8');

// Eval out the migrate function by string-extraction (no top-level imports
// fire). This is brittle by design — if the function signature changes,
// this test screams immediately, which is exactly the contract we want.
// Match the function body up to the closing brace at column 0 followed by
// blank line / EOF. Source uses `function ... { ... }` formatting.
const fnMatch = src.match(/function migrateV5toV6\([\s\S]*?\n\}\s/);
if (!fnMatch) {
  console.error('FAIL — could not locate migrateV5toV6 in saveSystem.js');
  process.exit(1);
}
const migrateV5toV6 = new Function(`${fnMatch[0]}\nreturn migrateV5toV6;`)();

// Extract CURRENT_VERSION too.
const versionMatch = src.match(/const CURRENT_VERSION = (\d+);/);
if (!versionMatch || Number(versionMatch[1]) < 6) {
  console.error(`FAIL — CURRENT_VERSION should be >= 6, got ${versionMatch?.[1]}`);
  process.exit(1);
}

// ─── v5 fixture ────────────────────────────────────────────────────────
const v5Save = {
  version: 5,
  player: { x: 400, y: 350, scene: 'ZuzuGarageScene' },
  inventory: ['mesquite_sample', 'steel_sample', 'copper_ore_sample'],
  completedQuests: [],
  activeQuest: { id: 'bridge_collapse', stepIndex: 8 },
  observations: ['load_test_completed', 'visited_lab'],
  materialTestsCompleted: ['mesquite_wood', 'structural_steel', 'copper'],
  journal: ['Started bridge_collapse quest.'],
  // Note: no materialLog, no derivedAnswers — that's what v6 adds.
};

const failures = [];

// ─── Test 1: migration produces v6 with new fields ────────────────────
const v6Save = migrateV5toV6(v5Save);

if (v6Save.version !== 6) {
  failures.push(`version should be 6, got ${v6Save.version}`);
}
if (!Array.isArray(v6Save.materialLog)) {
  failures.push('materialLog should be an array after migration');
}
if (v6Save.materialLog.length !== 0) {
  failures.push(`materialLog should be empty after fresh migration, got length ${v6Save.materialLog.length}`);
}
if (typeof v6Save.derivedAnswers !== 'object' || v6Save.derivedAnswers === null) {
  failures.push('derivedAnswers should be an object after migration');
}
if (Object.keys(v6Save.derivedAnswers).length !== 0) {
  failures.push('derivedAnswers should be empty after fresh migration');
}

// ─── Test 2: existing fields preserved ────────────────────────────────
if (!Array.isArray(v6Save.observations) || v6Save.observations.length !== 2) {
  failures.push('observations array should be preserved');
}
if (!v6Save.observations.includes('load_test_completed')) {
  failures.push('observations should still contain load_test_completed');
}
if (!Array.isArray(v6Save.materialTestsCompleted) || v6Save.materialTestsCompleted.length !== 3) {
  failures.push('materialTestsCompleted should be preserved');
}
if (v6Save.activeQuest?.id !== 'bridge_collapse') {
  failures.push('activeQuest should be preserved');
}

// ─── Test 3: idempotent on re-run ─────────────────────────────────────
const v6Pop = {
  ...v6Save,
  materialLog: [{ id: 'mesquite_wood', name: 'Mesquite Wood', massGrams: 8.5, recordedAt: 123 }],
  derivedAnswers: { lightestMaterial: 'mesquite_wood' },
};
// Simulate re-running migration on already-migrated v5 (forced version flag).
const reMigrated = migrateV5toV6({ ...v6Pop, version: 5 });
if (reMigrated.materialLog.length !== 1) {
  failures.push('idempotent re-run lost materialLog data');
}
if (reMigrated.derivedAnswers.lightestMaterial !== 'mesquite_wood') {
  failures.push('idempotent re-run lost derivedAnswers');
}
if (reMigrated.version !== 6) {
  failures.push('idempotent re-run did not bump version to 6');
}

// ─── Test 4: serializable (round-trips through JSON) ──────────────────
let roundTripped;
try {
  roundTripped = JSON.parse(JSON.stringify(v6Save));
} catch (e) {
  failures.push(`v6 save not JSON-serializable: ${e.message}`);
}
if (roundTripped && roundTripped.version !== 6) {
  failures.push('JSON round-trip lost version');
}

// ─── Report ───────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error('FAIL:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('PASS — v5→v6 migration: schema correct, fields preserved, idempotent, serializable.');
process.exit(0);
