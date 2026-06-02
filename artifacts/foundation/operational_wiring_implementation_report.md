# Operational Wiring Implementation Report (Phase 0.8)

Connects the implemented governance modules into the **real autonomous
execution path** so they fire automatically, not only on direct invocation.
No gameplay, content, assets, or voice generation added; XTTS not installed.

## Files changed (Executive Brain)
| File | Change |
|---|---|
| `brain/execution/governance_hooks.py` | **NEW** — import-pure wiring module: `governance_preflight` (mission value + tool governance + budget + resource), `mission_score_for_package`, `iteration_recovery`, `retrieve_lessons`, `loop_signature`, `promote_asset`, `plan_voice` |
| `brain/execution/runner.py` | `run_execution_package` now calls `governance_preflight` after approval / before resource reservation; blocks fail-closed on budget/resource and records `package.metadata["governance"]` |
| `brain/executive/autonomous_completion.py` | cycle scores the mission and **defers** paid/heavy/rejected work before executing; loop runs one `RecoveryGuard` + `LessonStore` across iterations (records on escalate, retrieves before each retry, stops with `recovery_escalation` after 2 failures) |
| `tests/test_operational_wiring.py` | **NEW** — 10 integration tests proving the wired path |

*(External, compatible: `brain/tools/selection.py` gained a registry bridge —
`select_executor`/`classify_executor`/`TOOL_TO_EXECUTOR`/`EXECUTOR_COST_CLASS` —
used by the dispatch layer; my hooks consume `select_tool`.)*

## Code paths wired
- **Runner preflight** (every package, before reservation/execution):
  `governance_preflight(package)` → mission value (advisory) + tool-selection
  recommendation + `check_budget_or_block` (money) + `check_resource_or_block`
  (heavy). Free local executors pass; paid/heavy fail closed → package status
  `BLOCKED` with `blocked_by_budget` / `blocked_by_resource`.
- **Autonomous cycle**: `mission_score_for_package` before execution; deferral on
  `blocked_by_budget` / `reject`.
- **Autonomous loop**: `iteration_recovery` records each iteration on a shared
  `RecoveryGuard`; two consecutive failures → record a lesson + stop
  (`recovery_escalation`), never infinite retry; `retrieve_lessons` before each
  iteration.
- **Asset promotion**: `promote_asset` callable governance entry (validation +
  acceptance + provenance).
- **Voice**: `plan_voice` callable by governance; generation disabled, no audio.

## Tests added (10, `tests/test_operational_wiring.py`)
1. free-local task reaches mission scoring (+ tool governance + budget) ✅
2. paid MiniMax task blocked by budget ✅
3. local TTS task blocked by resource (until budget/privilege) ✅
4. failed task triggers RecoveryGuard after 2 failures (no infinite retry) ✅
5. lessons recorded on escalation + retrievable before retry ✅
6. generated asset cannot be promoted without validation+acceptance+provenance ✅
7. tool selection routes need→executor (code→python, art→aseprite) ✅
8. voice plan produced, **no audio file** created ✅
9. mission scoring defers paid-tool work ✅
10. free executors (local_stub/codex/claude/playwright/validator) preflight-pass
   → acceptance/checkpoint path unaffected ✅

## Tests passing
- `tests/test_operational_wiring.py`: **10 passed**.
- Execution-path regression set (`test_execution_runner`,
  `test_resource_reservation_release`, `test_execution_package_builder`): **11 passed**.
- Full suite: **436 passed** (was 426; +10 wiring tests), exit 0.

## Remaining gaps (honest)
- **Asset Promotion auto-trigger:** `promote_asset` is wired + tested as a
  governance entry, but the runner does not yet auto-detect asset outputs from a
  package to promote them — current autonomous packages are code packages with no
  asset outputs. Auto-trigger lands when an asset-producing task path exists.
- **Tool selection is consulted, not enforced:** preflight records the
  recommended executor and blocks paid/heavy via budget, but does not yet
  override the package's chosen executor. (Registry bridge `select_executor`
  exists for a follow-up that swaps the executor.)
- **Recovery consult is operator-facing:** on escalation the loop stops and
  records a lesson; the actual LangChain/LangGraph/Claude consultation + replan
  is surfaced to the operator, not yet auto-executed.
- **LangSmith tracing** still not wired (observability), as noted pre-sprint.

## Is governance now operational?
**Yes for the core chain.** The autonomous path now demonstrates, via actual
code paths (not direct module calls):

```
Mission → Mission Scoring → Tool Selection → Privilege → Budget/Resource →
Execution → Recovery → Acceptance → (Asset Promotion: callable) → Checkpoint →
Lessons Learned
```

Mission Scoring, Tool Selection (consulted), Budget, Resource, Recovery, and
Lessons moved from **implemented-but-not-wired** to **Operational** (proven by
`test_operational_wiring.py`). Privilege, Execution, Acceptance, and Checkpoint
were already operational. Asset Promotion is wired and callable but not yet
auto-triggered. Voice is callable and generation-disabled.

**Conclusion:** governance is now **operational on the autonomous path**, not
merely implemented — with two well-scoped follow-ups (asset-promotion
auto-trigger, executor-swap enforcement) that do not block the core
Mission→…→Checkpoint→Lessons demonstration.
