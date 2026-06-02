# Governance Preservation

The controls below are **load-bearing** for safe autonomy. Increasing
autonomy must **never** weaken them. This document records each control, its
evidence, and the invariant that must hold through all autonomy work
(including Phase 1). If a change would relax any invariant, it is rejected —
autonomy is bought with *more* governance, not less.

| Control | Status | Where | Invariant (must NOT be weakened) |
|---|---|---|---|
| **Privilege enforcement** | IMPLEMENTED | `executors/privilege_gate.py` | Fail-closed; dangerous tools default `plan_only`; promotion to `governed_execute` is explicit; no env flag bypasses the in-`execute()` check |
| **Budget enforcement** | DESIGN ONLY | (to build) `budgets/` | Once built: paid/heavy action without sufficient budget is **blocked**, fail-closed; no "assume unlimited" |
| **Acceptance enforcement** | IMPLEMENTED | act1-acceptance spec + `act1_acceptance/runner.py` | Dual signal (Playwright PASS **and** Brain audit PASS); **never weaken assertions or thresholds to pass**; a red gate **stops** autonomous work |
| **Checkpointing** | IMPLEMENTED | `runtime/resume.py`, `replay.py`, `memory/checkpoints/` | Progress is recoverable; no autonomous run discards a checkpoint without a newer valid one |
| **Audit logging** | IMPLEMENTED | execution records + reconciliation reports + ledger (to add) | Every executor action, approval, and (future) spend is recorded and attributable to a mission/run_id |
| **Validation** | IMPLEMENTED | `runtime/validation.py`, validator executor | Claims are validated against reality; backend shortcuts don't count as player-visible |
| **Production-promotion gates** | IMPLEMENTED | acceptance ratchet + baseline tag | Promotion to "done"/committed requires green acceptance; baseline `baseline_pre_phase1` is immutable reference |
| **Reconciliation** | IMPLEMENTED | `reconciliation/` (5 reconcilers) | Intended vs actual drift is detectable and reported; reconcilers are not disabled for speed |

## Invariants stated explicitly

1. **Fail-closed everywhere.** Privilege, budget (when built), and acceptance
   all deny by default. Absence of a budget = blocked, not unlimited. Absence
   of acceptance evidence = not-done, not assumed-done.

2. **Acceptance is non-negotiable and dual-signal.** Green = Playwright 3/3
   **and** Brain audit PASS, with fresh evidence. Assertions, coverage, and
   thresholds may be made *more deterministic* but **never more lenient**. A
   red gate halts the autonomous loop; it is never bypassed, skipped, or
   re-tagged green.

3. **Privilege ≠ permission to spend.** `governed_execute` authorizes the
   *kind* of action; the budget gate (once built) authorizes the *cost*. Both
   must pass. Today, because budgets don't exist, paid/heavy `governed_execute`
   is administratively held at `plan_only`.

4. **No silent truncation or junk promotion.** If an autonomous run caps
   coverage, samples, or skips, it must log what was dropped. Generated assets
   below the quality bar are never committed (L9).

5. **Checkpointed, attributable, recoverable.** Every autonomous mission is
   checkpointed and every action is attributable (run_id → mission → ledger).
   A crash resumes from a checkpoint; it never silently restarts paid work.

6. **Reality wins.** Reconciliation and validation arbitrate between claimed
   and actual state. A claim without verified player-visible evidence is not
   accepted.

7. **Legacy preservation holds.** The Legacy Preservation Registry
   (`foundation/`) lists 25 subsystems, 10 non-negotiables, 0 marked REMOVE.
   Autonomy must not delete or regress preserved legacy features.

## How autonomy *adds* governance (not removes it)
- The budget system (B1) is **new** governance required *before* paid autonomy.
- The recovery/escalation guard (B3) is **new** governance that prevents
  infinite retries and runaway spend.
- The junk-asset gate (L9) is **new** governance for generated content.

Every item on the repair plan (`autonomy_repair_plan.md`) is an *addition* to
governance. None relaxes a control above. That is the standing rule:
**maximum autonomy inside strong governance.**
