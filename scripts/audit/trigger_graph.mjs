#!/usr/bin/env node
// Trigger-graph audit (Executive Brain) — find code that is wired but never fired:
// the class of bug behind `loadTest:done` (emitted, no listener → the built bridge
// never got placed over the wash).
//
// Three static lenses over the live game (src/game/phaser by default):
//   1. EVENT GRAPH      registry.events.emit('X') vs registry.events.on/once('X')
//                       → orphan emits (no listener) + dead listeners (no emitter)
//   2. ACTION COVERAGE  interaction `action:'X'` (+ `nearest.action==='X'` branches)
//                       vs handleInteraction handler keys
//                       → actions with no handler + handlers nothing routes to
//   3. DEAD METHODS     `_private(` method defs never referenced as `this._private`
//
// Heuristic by design: it SURFACES candidates for review, it does not auto-fix.
// An allowlist marks known-intentional orphans so CI can fail only on NEW ones.
//
// Usage:  node scripts/audit/trigger_graph.mjs [root] [--json] [--strict]
//   --json    machine-readable output
//   --strict  exit 1 if any non-allowlisted finding exists (for CI gating)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const args = process.argv.slice(2);
const ROOT = args.find((a) => !a.startsWith('--')) || 'src/game/phaser';
const JSON_OUT = args.includes('--json');
const STRICT = args.includes('--strict');

// Known-intentional orphans (reviewed, fire-and-forget). New ones are flagged.
const ALLOW = {
  orphanEmits: new Set([
    // scene completion pings; each scene applies its own effects + emits
    // quest:changed (which IS listened). Reviewed 2026-06-21 as fire-and-forget.
    'biome:done', 'ecology:done', 'investigation:done', 'prediction:done',
    'bridgeDesign:done', 'crossing:done',
    // unused hook for a special quest-reward flourish; the reward still applies
    // via zuzubucks:changed + recordFeedback. Reviewed 2026-06-21 as benign.
    'reward:quest',
  ]),
  deadListeners: new Set([
    // legacy advance-by-event path; advancing is keyboard/pointer-driven.
    'dialogue:advance',
  ]),
  // runtime handlers the scene intentionally supersedes with a richer flow
  // (utm→prediction, bridge_plan→design UI) — kept for debug/tests.
  debugOnlyHandlers: new Set(['utm', 'bridge_plan', 'spanish_neighbor']),
  deadMethods: new Set([]),
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

function allMatches(text, re) {
  const out = [];
  let m;
  while ((m = re.exec(text)) !== null) out.push(m);
  return out;
}

const files = walk(ROOT);
const corpus = files.map((f) => ({ f, src: readFileSync(f, 'utf8') }));
const rel = (f) => relative('.', f).split(sep).join('/');

// ---- Lens 1: event graph -------------------------------------------------
const emits = new Map(); // event -> [files]
const listens = new Map();
for (const { f, src } of corpus) {
  // Tolerate optional chaining: systems use `registry?.events?.emit(...)`,
  // scenes use `registry.events.emit(...)`. Anchor on `registry…events…` so we
  // never catch scene-lifecycle `this.events.once('shutdown')` or input `.on(...)`.
  for (const m of allMatches(src, /registry\s*\??\.\s*events\s*\??\.\s*emit\(\s*['"]([\w:-]+)['"]/g)) {
    if (!emits.has(m[1])) emits.set(m[1], new Set());
    emits.get(m[1]).add(rel(f));
  }
  for (const m of allMatches(src, /registry\s*\??\.\s*events\s*\??\.\s*(?:on|once)\(\s*['"]([\w:-]+)['"]/g)) {
    if (!listens.has(m[1])) listens.set(m[1], new Set());
    listens.get(m[1]).add(rel(f));
  }
}
const orphanEmits = [...emits.keys()].filter((e) => !listens.has(e)).sort();
const deadListeners = [...listens.keys()].filter((e) => !emits.has(e)).sort();

// ---- Lens 2: action coverage ---------------------------------------------
const registeredActions = new Set();
const branchedActions = new Set(); // handled inline in a scene via nearest.action === 'X'
const handlerKeys = new Set();
for (const { src } of corpus) {
  for (const m of allMatches(src, /action:\s*['"]([a-z_]+)['"]/g)) registeredActions.add(m[1]);
  for (const m of allMatches(src, /nearest\.action\s*===\s*['"]([a-z_]+)['"]/g)) branchedActions.add(m[1]);
}
// handler keys live in the handleInteraction `handlers = { key: () => ... }` block
const runtimeFile = corpus.find((c) => c.f.endsWith('Act1RuntimeSystem.js'));
if (runtimeFile) {
  const hi = runtimeFile.src.indexOf('handleInteraction(action)');
  const slice = hi >= 0 ? runtimeFile.src.slice(hi, hi + 4000) : '';
  for (const m of allMatches(slice, /^\s{6}([a-z_]+):\s*\(\)\s*=>/gm)) handlerKeys.add(m[1]);
}
const handledSomehow = (a) => handlerKeys.has(a) || branchedActions.has(a);
const unhandledActions = [...registeredActions].filter((a) => !handledSomehow(a)).sort();
const unroutedHandlers = [...handlerKeys].filter((h) => !registeredActions.has(h) && !branchedActions.has(h)).sort();

// ---- Lens 3: dead private methods ----------------------------------------
const deadMethods = [];
for (const { f, src } of corpus) {
  const defs = allMatches(src, /^\s{2}(_[A-Za-z0-9]+)\s*\(/gm).map((m) => m[1]);
  for (const name of new Set(defs)) {
    // referenced anywhere (any file) as this._name / .name( besides its own def?
    const refRe = new RegExp(`\\.${name}\\b`, 'g');
    const totalRefs = corpus.reduce((n, c) => n + allMatches(c.src, refRe).length, 0);
    if (totalRefs === 0) deadMethods.push({ method: name, file: rel(f) });
  }
}

// ---- assemble -------------------------------------------------------------
const newOrphanEmits = orphanEmits.filter((e) => !ALLOW.orphanEmits.has(e));
const newDeadListeners = deadListeners.filter((e) => !ALLOW.deadListeners.has(e));
const newUnroutedHandlers = unroutedHandlers.filter((h) => !ALLOW.debugOnlyHandlers.has(h));
const newDeadMethods = deadMethods.filter((d) => !ALLOW.deadMethods.has(d.method));

const report = {
  root: ROOT,
  counts: {
    files: files.length, emits: emits.size, listeners: listens.size,
    orphanEmits: orphanEmits.length, deadListeners: deadListeners.length,
    unhandledActions: unhandledActions.length, unroutedHandlers: unroutedHandlers.length,
    deadMethods: deadMethods.length,
  },
  eventGraph: {
    orphanEmits: orphanEmits.map((e) => ({ event: e, emittedIn: [...emits.get(e)], allowlisted: ALLOW.orphanEmits.has(e) })),
    deadListeners: deadListeners.map((e) => ({ event: e, listenedIn: [...listens.get(e)], allowlisted: ALLOW.deadListeners.has(e) })),
  },
  actionCoverage: {
    unhandledActions,
    unroutedHandlers: unroutedHandlers.map((h) => ({ handler: h, allowlisted: ALLOW.debugOnlyHandlers.has(h) })),
  },
  deadMethods,
  newFindings: {
    orphanEmits: newOrphanEmits, deadListeners: newDeadListeners,
    unhandledActions, unroutedHandlers: newUnroutedHandlers, deadMethods: newDeadMethods,
  },
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const C = report.counts;
  console.log(`\nTrigger-graph audit — ${ROOT}`);
  console.log(`  ${C.files} files · ${C.emits} event types emitted · ${C.listeners} listened\n`);
  const line = (label, items, fmt) => {
    console.log(`■ ${label}: ${items.length}`);
    for (const it of items) console.log('    ' + fmt(it));
    if (items.length) console.log('');
  };
  line('Orphan emits (emitted, no listener)', report.eventGraph.orphanEmits,
    (o) => `${o.allowlisted ? '·' : '🔴'} ${o.event}  (${o.emittedIn.join(', ')})`);
  line('Dead listeners (listened, never emitted)', report.eventGraph.deadListeners,
    (o) => `${o.allowlisted ? '·' : '🔴'} ${o.event}  (${o.listenedIn.join(', ')})`);
  line('Registered actions with no handler', report.actionCoverage.unhandledActions, (a) => `🔴 ${a}`);
  line('Handlers nothing routes to', report.actionCoverage.unroutedHandlers,
    (o) => `${o.allowlisted ? '· (debug-only)' : '🟠'} ${o.handler}`);
  line('Dead private methods (never referenced)', report.deadMethods, (d) => `🟠 ${d.method}  (${d.file})`);
  const totalNew = newOrphanEmits.length + newDeadListeners.length + unhandledActions.length + newUnroutedHandlers.length + newDeadMethods.length;
  console.log(totalNew ? `RESULT: ${totalNew} NEW (non-allowlisted) finding(s).` : 'RESULT: clean — only allowlisted/known items.');
}

const totalNew = newOrphanEmits.length + newDeadListeners.length + unhandledActions.length + newUnroutedHandlers.length + newDeadMethods.length;
if (STRICT && totalNew > 0) process.exit(1);
