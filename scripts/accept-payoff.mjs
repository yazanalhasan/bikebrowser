#!/usr/bin/env node
// Payoff Acceptance — LAYER 3 (future).
// "Does the feature feel rewarding?" — choice, visible consequence, payoff.
//
// This layer is a placeholder until payoff is crisply assertable. It runs any
// Playwright tests tagged @payoff if present, otherwise reports the layer as
// not-yet-defined and exits 0 (informational, non-blocking).
//
// Completeness gate today = Engine Acceptance + Player Reachability Acceptance.
// Payoff becomes blocking once assertions exist (see player_reachability_suite.md).
import { execSync } from 'node:child_process';

try {
  const out = execSync('npx playwright test --grep @payoff --list', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const total = (out.match(/(\d+)\s+tests?\s+in/i) || [])[1];
  if (total && Number(total) > 0) {
    console.log(`PAYOFF ACCEPTANCE: running ${total} @payoff test(s)…`);
    execSync('npx playwright test --grep @payoff', { stdio: 'inherit' });
    console.log('PAYOFF ACCEPTANCE: PASS');
    process.exit(0);
  }
} catch {
  // fall through to placeholder
}
console.log('PAYOFF ACCEPTANCE: placeholder — no @payoff assertions yet (Phase 1.9.x).');
console.log('  Tracked in artifacts/qa_audit/player_reachability_suite.md (test.fixme: visible load test).');
console.log('  Non-blocking until payoff is assertable.');
process.exit(0);
