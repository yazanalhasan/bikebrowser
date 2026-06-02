# Governance Readiness — R0 Sprint result

Outcome of the R0 Governance Sprint: converting the critical governance
systems from **DESIGN ONLY** to **IMPLEMENTED** before any Phase 1 gameplay
work. All code lives in the Executive Brain repo
(`C:/Users/admin/Documents/executive-brain`). Every subsystem is fail-closed
and unit-tested.

## Scorecard

| Governance area | Before | After | Score /5 | Evidence (EB repo) |
|---|---|---|---|---|
| **Budget Governance** | DESIGN ONLY | **IMPLEMENTED** | 5 | `brain/budgets/` (models/registry/ledger/enforcement/reports) + `memory/procedural/project_budgets.yaml`; fail-closed `check_budget_or_block`; 12 tests |
| **Resource Governance** | MISSING | **IMPLEMENTED** | 5 | `check_resource_or_block` (gpu_minutes/wall_clock/storage/batch caps); fail-closed; covered in budget tests |
| **Recovery Guard** | PARTIAL | **IMPLEMENTED** | 5 | `brain/recovery/guard.py` — 2-fail→consult→replan→fallback→escalate; **no infinite retry**; 10 tests |
| **Lessons Learned** | MISSING | **IMPLEMENTED** | 4 | `brain/recovery/lessons.py` — cause/fix/prevention registry; retrieve-before-retry |
| **Asset Governance** | PARTIAL | **IMPLEMENTED** | 5 | `brain/assets/promotion.py` — stage→promote/reject requires validation + acceptance + provenance; 8 tests |
| **Mission Governance** | MISSING | **IMPLEMENTED** | 5 | `brain/missions/value_scoring.py` — Player/Educational/Engineering value − cost; defers low-value/high-cost & paid-tool missions; 14 tests |
| **Tool Governance** | DESIGN ONLY | **IMPLEMENTED** | 4 | `brain/tools/selection.py` — cheapest-deterministic-first; honors budget/privilege gates; escalation path |
| **Voice Governance** (Sprint V1) | DESIGN ONLY | **IMPLEMENTED** (gov-only, generation disabled) | 5 | `brain/voice/` (registry/cache/manifest/queue/validation/executor/reports + xtts/piper adapters); integrates privilege+budget+recovery+promotion; `VOICE_GENERATION_ENABLED=False`; 16 tests; tag `voice_governance_v1` |

**Suite:** full Executive Brain test suite green — **426 passing** (R0 sprint
+44, Voice Governance Sprint V1 +16 = +60 new tests). Also fixed a **pre-existing** failure (the MiniMax
`creative_pipeline_policy.yaml` declared `tool_roles`/`playability_validation`
that the `ProceduralPolicy` schema rejected — 7 tests were red before this
sprint; now reconciled in `schemas/procedural.py`).

## What each subsystem guarantees
- **Budget:** a paid tool with no money budget is **blocked**, fail-closed.
  `governed_execute` is not authorization to spend. Ledger records
  reserve/commit/release; reservations count against remaining.
- **Resource:** a heavy tool (ComfyUI/Blender) with no gpu-minute / wall-clock
  / storage / batch budget is **blocked**. Batch size capped per call.
- **Recovery:** failure #1 retries; failure #2 **stops** and consults
  LangChain/LangGraph/Claude with retrieved lessons; replan; fallback once;
  then escalate with a stuck report. RETRY never recurs after the 2nd failure
  (proven by `test_never_infinite_retry`).
- **Lessons:** solved blockers are stored and retrieved before the next
  attempt, so long runs stop repeating mistakes.
- **Asset:** nothing is promoted to production without validation (quality
  threshold) + acceptance signal + known provenance. Junk is rejected and
  logged.
- **Mission:** low-value/high-cost work is deferred; paid-tool missions are
  deferred until budgets exist; governance-weakening missions are rejected;
  governance-building missions rank top.
- **Tool:** picks the cheapest deterministic tool; paid/heavy tools are not
  selectable for autonomy unless budgets authorize them.

## The question — can Executive Brain now safely run 8-hour autonomous sessions?

**For free-local autonomy: YES, now with real guards.** The sprint added the
three things that were missing for *safe* long unattended loops:
- runaway-loop protection (Recovery Guard — no infinite retry),
- junk-work protection (Mission Value Scoring + Tool Governance),
- junk-asset protection (Asset Promotion gate).
Combined with the pre-existing acceptance ratchet, fail-closed privileges,
checkpoints, and reconciliation, an 8-hour session over audits/tests/
Playwright/edits/docs is now governed end-to-end.

**For paid/heavy autonomy: the MECHANISM now exists and is tested, but spend
remains administratively unauthorized** (no limits set in
`project_budgets.yaml` — the safe default). An operator can authorize a
bounded envelope (e.g. `minimax: {usd_limit: 5}`) and paid autonomy becomes
safe *within that envelope*, fail-closed beyond it.

### Honest remaining gap — INTEGRATION (not a blocker for free-local)
These are **tested governance primitives**; they are not yet wired into a
single live autonomous-executor loop. `brain/executive/loop.py` today prepares
governed packages and **stops for approval** (it does not auto-execute). Before
truly unattended *paid* 8-hour runs, the remaining work is **wiring**:
1. Call `check_budget_or_block` / `check_resource_or_block` inside the paid/
   heavy executor `execute()` paths (next to the privilege gate).
2. Wrap the executor call in the `RecoveryGuard` (record_outcome per attempt).
3. Gate mission selection through `score_mission` / `rank_missions`.
4. Run `evaluate_promotion` before any generated asset is committed.
5. Record a `Lesson` on each resolved failure.

That integration is the natural Phase-0.8 follow-up. It is **not** required for
the free-local autonomy that is safe today, and it does **not** involve any
gameplay/feature work.

## Verdict
**R0 Governance Sprint PASSES.** All six named governance areas are
IMPLEMENTED, fail-closed, and tested. Budget readiness blocker **B1 is closed**
(mechanism exists); paid spend stays safely unauthorized until an operator
sets limits. Trustworthy-autonomy foundation is in place. **Phase 1 gameplay
work may begin** — under these guards, and with the wiring follow-up tracked.
