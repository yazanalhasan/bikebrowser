# Repository Integrity Audit

Independent verification (by code, not the right-tab conclusion) of the
`brain/artifacts/` source-control integrity concern in the **Executive Brain**
repo (`C:/Users/admin/Documents/executive-brain`). 2026-06-02.

## Verdict: CONFIRMED — 1 CRITICAL issue. A fresh clone of Executive Brain fails to import.

## The six questions, answered by code

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Is `brain/artifacts` actually required? | **YES** | It's a source package providing the artifact registry (`register_file_artifact`, `list_artifacts`, `get_artifact`, indexer/search/reports). Core write/read paths depend on it. |
| 2 | Imported by committed code? | **YES (widely)** | `brain/cli.py:75-78`, `brain/act1_acceptance/runner.py:8`, `brain/inspect/routes.py:35-38`, `brain/executive/loop.py:5`, `brain/execution/reports.py:5`, `brain/delegation/lifecycle.py:7`, `brain/delegation/packet_builder.py:6`, `brain/artifacts/*` internal. |
| 3 | Is it tracked? | **NO** | `git ls-files brain/artifacts` → **0 files**. |
| 4 | Is it gitignored? | **YES** | `git check-ignore -v brain/artifacts` → `.gitignore:29:artifacts/`. The pattern `artifacts/` (unanchored) matches any dir named `artifacts`, including `brain/artifacts/`. |
| 5 | Would a fresh clone fail? | **YES** | Not in any commit ⇒ clean checkout omits `brain/artifacts/` ⇒ `import brain.artifacts.registry` → `ModuleNotFoundError` ⇒ `brain/cli.py`, the acceptance runner, the inspect API, the executive loop, delegation, and execution reports all fail at import. EB is non-functional on a fresh clone. |
| 6 | Is this the only such case? | **YES** | Scanned every `brain/**/__init__.py` package against `git check-ignore` + `git ls-files`: **`brain/artifacts` is the only gitignored/untracked source package**. All others are tracked. No other broad `.gitignore` pattern swallows source (the rest target `.env`, caches, `memory/*` runtime state, db dumps). |

## Why the 436 tests still pass
The tests pass **locally only** because `brain/artifacts/` physically exists on
disk (untracked). The test suite never exercises a clean checkout, so the gap is
invisible to CI-as-run-locally. Any fresh clone / new machine / CI runner /
disaster-recovery would have **no** `brain/artifacts/` and EB would not import.

## Root cause
`.gitignore:29` is a single unanchored line `artifacts/` intended to ignore the
**top-level runtime-output** directory `artifacts/` (acceptance reports, asset
audits, etc.). Because the pattern is unanchored, Git applies it to **every**
directory named `artifacts` at any depth — including the **source package**
`brain/artifacts/`. The source package was therefore never committed.

## Issue classification

| Severity | Issue | Detail |
|---|---|---|
| **CRITICAL** | `brain/artifacts/` source package gitignored + untracked + imported by committed code | Fresh clone of Executive Brain fails to import (`brain.cli`, acceptance runner, inspect API, executive loop, delegation, execution reports). Sole blocker to a clean, reproducible checkout. |
| **LOW (informational)** | Committed code references top-level `artifacts/...` data paths (`brain/missions/observed_state.py`, `brain/inspect/routes.py:449`, `brain/execution/change_gate.py`) | These are **runtime-generated evidence files** (correctly ignored), read defensively / regenerated; their absence does **not** break import or core function. Not an integrity defect — expected runtime-output behavior. |
| **LOW (informational)** | EB `artifacts/` (top-level) is gitignored | **Correct by design** (runtime output). No action; only noted to contrast with the CRITICAL source-package case. |

## Scope confirmation
- Only `brain/artifacts/` is affected (verified across all brain packages).
- The top-level `artifacts/` ignore is appropriate and should remain.
- This is an **Executive Brain** repo issue; the BikeBrowser repo is not implicated.

## Recommendation
Confirmed CRITICAL ⇒ fix before resuming Phase 1. The safest fix, its risks,
migration, and test strategy are in `repository_integrity_fix_plan.md`.
**Not implemented yet** (verify-only, per directive).
