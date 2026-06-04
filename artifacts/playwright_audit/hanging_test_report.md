# Playwright Diagnostic Report

Generated: 2026-05-29T23:42:36.7853111-07:00

## Commands

| Command | Exit |
| --- | ---: |
| npx playwright test --list | 0 |
| npx playwright test --reporter=line | 124 |
| npx playwright test --reporter=json | 124 |

## Interpretation

- Exit code 124 means the watchdog killed the command after the configured timeout.
- Targeted BikeBrowser validation should use explicit spec paths rather than broad 
px playwright test.
- Full-suite diagnostics are useful for triage, but they should not block TARGETED execution packages.

## Recent Full-Run Output

``text

Running 38 tests using 1 worker

[1A[2K[1/38] [chromium] › tests\e2e\all-scenes.snapshot.spec.js:88:7 › all scene snapshots › captures the Phaser rebuild Act 1 runtime states
TIMEOUT after 5s: npx playwright test --reporter=line
``

## Artifacts

- test_list.txt
- full_run_line_output.txt
- full_run_line_error.txt
- full_run_results.json
- full_run_json_error.txt
