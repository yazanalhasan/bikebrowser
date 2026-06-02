# Overnight Execution Policy

The standing rules for unattended (e.g. 8-hour) autonomous sessions. This is
the **operational gate**: what the autonomous loop may and may not do tonight,
given the current state of governance. Derived from
`autonomy_readiness/autonomy_readiness_score.md` and the tool matrix in
`available_assets_and_helpers_registry.md`.

## Current verdict (2026-06-02)
> **Overnight *production* is NOT authorized for paid/heavy work.** Budget
> governance is DESIGN ONLY (`budget_governance_gap.md`) and the recovery
> guard is not yet implemented (B3). **Unpaid local autonomy is authorized**
> under the limits below.

**Do not start overnight autonomous production until budget governance is
implemented (R0.1+R0.2) and the recovery guard is in place (R0.3) — OR all
paid/high-resource tools are disabled.**

## Allowed autonomously (free local set)
- ✅ Read-only audits
- ✅ Local tests (Python/Brain 365 suite, JS unit)
- ✅ Playwright validation (incl. the acceptance gate)
- ✅ Code edits (within repo paths)
- ✅ Docs / artifacts
- ✅ Non-paid local work within normal runtime limits
- ✅ Safe git: branch, commit-per-change, tag (NOT force/reset/merge-to-main)

## NOT allowed autonomously (blocked until budgets + caps exist)
- ⛔ MiniMax generation
- ⛔ Paid API generation (any metered API call)
- ⛔ Cloud generation
- ⛔ Paid model calls
- ⛔ Large batch asset generation
- ⛔ Long GPU runs
- ⛔ Uncontrolled ComfyUI batches
- ⛔ Large Blender render batches
- ⛔ Destructive git (reset --hard, force-push), merge to main, publishing
- ⛔ Unvetted dependency installs (`npm`/`pip install` of new packages)
- ⛔ Committing secrets (the MiniMax key stays only in gitignored `.env`)

## Preconditions to start a session
1. Acceptance gate **GREEN** at the start (Playwright 3/3 + Brain PASS).
2. Working tree clean or at a known baseline; baseline tag present.
3. Paid/heavy tools confirmed at `plan_only` (privilege) — or budget system
   live. If budgets are absent, paid/heavy stay disabled.
4. Recovery guard active (R0.3) — else cap iterations and keep the session
   short/supervised.
5. A mission queue scored via Mission Value Scoring (defer low-value/high-cost
   and anything needing a blocked tool).

## During the session (the loop)
- Pick highest-priority scored mission → consult procedural memory → select
  cheapest deterministic tool → execute (within privilege/budget gates).
- **After every change:** run the acceptance gate. **Red gate ⇒ STOP that
  change** (diagnose/revert; never weaken the gate). Commit only on green.
- **On failure:** follow `recovery_and_escalation_system.md` (2 fails →
  consult → replan → fallback → escalate). **Never infinite retry.**
- **Checkpoint** after each completed mission and on any escalation.
- **Log everything**, including anything deferred/dropped/capped (no silent
  truncation).

## Stop conditions (graceful)
- Red acceptance gate that can't be auto-resolved → stop, report.
- Any budget/resource cap reached → stop that class, report.
- Privilege denial requiring promotion → stop action, request operator.
- Per-mission iteration cap or per-run wall-clock (session window) reached →
  graceful stop.
- Repeated escalations / no progress → pause loop, escalate to operator.

## End-of-session report (write to `autonomous_run/overnight_report.md`)
- Missions attempted / completed / deferred (with value scores + reasons).
- Player-visible changes (`player_visible_changes.md`) vs internal-only.
- Acceptance results per change (green/red, score deltas vs baseline).
- **Remaining budget** per tool (once the budget system exists).
- Failures + escalations + lessons_learned recorded.
- Checkpoints written; current baseline/commit.
- Anything capped/dropped/deferred, named explicitly.

## Flipping the switch to "paid/heavy ALLOWED"
Requires, per `autonomy_repair_plan.md`:
- **R0.1** budget governance (config + ledger + `check_budget_or_block` +
  paid-tool block + report) — tested.
- **R0.2** resource caps (gpu-min/wall-clock/batch) for ComfyUI/Blender —
  tested.
- **R0.3** recovery/escalation guard — tested.
- **R1.2** junk-asset quality gate before any generated asset is committed.
Until all four hold, the policy above stands: **free local autonomy only.**
