# Autonomy Repair Plan

Prioritized, evidence-based list of what must change before Executive Brain
can safely run long autonomous sessions across *all* work classes. Ordered by
what unblocks the most value at the least risk. Each item names the gate it
restores and the autonomy it unlocks. **None weakens a control in
`governance_preservation.md` — every item adds governance.**

## Priority 0 — required before *any* paid/heavy overnight autonomy

### R0.1 Budget governance (minimum version) — **Critical**
- **Gap:** B1 (`brain/budgets/` absent). Detail: `budget_governance_gap.md`.
- **Do:** `config/budgets.yaml`; `budgets/{models,registry,ledger,
  enforcement,cli}.py`; `check_budget_or_block(tool, est)` fail-closed, wired
  into paid executors' `execute()`; remaining-budget report; tests.
- **Unlocks:** paid-tool autonomy (Claude/Codex API, later MiniMax) within a
  ceiling, with a ledger.
- **Effort:** ~1 session (reuses privilege-gate + reservation patterns).

### R0.2 Resource caps for heavy local tools — **Critical**
- **Gap:** B2 (no GPU-min/wall-clock/batch limits).
- **Do:** `ResourceBudget(gpu_minutes, wall_clock_s, max_batch)` enforced in
  ComfyUI/Blender launch paths; auto-stop on cap.
- **Unlocks:** governed ComfyUI/Blender autonomy.
- **Effort:** folded into R0.1.

### R0.3 Recovery / stuck-detection / escalation guard — **High**
- **Gap:** B3 (informal retry, no formal escalation, no hard stop).
- **Do:** implement `recovery_and_escalation_system.md`: attempt counter,
  2-fail→consult(LangChain/LangGraph/Claude)→replan, hard iteration cap, then
  escalate to operator + checkpoint. Never infinite retry.
- **Unlocks:** *safe* long unattended loops (regardless of cost).
- **Effort:** ~1 session.

## Priority 1 — required before *asset-generation* autonomy

### R1.1 MiniMax adapter behind privilege + budget gates — High
- **Gap:** B4 (privileges/docs only, no adapter).
- **Do:** build adapter; call only after privilege `governed_execute` **and**
  `check_budget_or_block` pass.
- **Depends on:** R0.1.

### R1.2 Junk-asset quality gate — Medium
- **Gap:** L9 (no auto quality gate on generated art).
- **Do:** run the acceptance art-audit on every generated asset; reject below
  threshold; never commit junk.
- **Depends on:** R1.1 (and uses existing acceptance art-audit).

## Priority 2 — resilience & observability for long runs

### R2.1 Executor fallback chain — Medium
- **Gap:** B5. **Do:** per-capability fallback order; route on failure,
  bounded by the R0.3 attempt cap.

### R2.2 LangSmith tracing wired into the loop — Medium
- **Gap:** B6. **Do:** trace graph/executor calls; link run_id; surface in the
  overnight report for post-hoc diagnosis.

### R2.3 lessons_learned retrieval loop — Medium
- **Gap:** L2. **Do:** record failure signatures + resolutions; retrieve
  matching ones before each retry (feeds R0.3 and L1).

## Priority 3 — quality/breadth polish (safe to defer)

- **R3.1** LangChain plan-repair assist (L1).
- **R3.2** Mission Value Scoring in-loop gating (L3).
- **R3.3** Step-level checkpoints for multi-hour missions (L6).
- **R3.4** Periodic reconciliation tick during long runs (L7).
- **R3.5** Procedural freshness re-validate in-loop (L8).
- **R3.6** Acceptance hardening H1/S1 + `retries:1` (B7 / `acceptance_hardening.md`).

## Dependency order (critical path to full autonomy)
```
R0.1 budget ─┬─> R1.1 MiniMax adapter ─> R1.2 junk-asset gate
             └─> (paid Claude/Codex autonomy)
R0.2 resource caps ─> governed ComfyUI/Blender
R0.3 recovery guard ─> safe long loops (independent of cost; do early)
R2.* resilience/observability  (parallelizable after R0.3)
R3.* polish  (anytime)
```

## Minimum bar to flip "overnight production: ALLOWED"
**R0.1 + R0.2 + R0.3 complete and tested**, OR all paid/heavy tools disabled.
Until then: overnight autonomy is restricted to the free local set per
`overnight_execution_policy.md`. Unpaid local autonomy (audits/tests/edits/
docs) needs only **R0.3** to be considered fully safe for long unattended
runs; it is already safe for supervised/bounded runs today.
