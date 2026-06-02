# Autonomy Blockers

Conditions that **prevent safe unattended operation** for at least one class
of work. A blocker stops that class until resolved (vs. a *limiter*, which
degrades quality but is safe — see `autonomy_limiters.md`). Severity:
**Critical / High / Medium / Low.** Status per the IMPLEMENTED / PARTIAL /
DESIGN ONLY / MISSING taxonomy.

| # | Blocker | Severity | Status of fix | Blocks |
|---|---|---|---|---|
| B1 | **No budget governance** (`brain/budgets/` absent) | **Critical** | DESIGN ONLY | all paid-tool autonomy |
| B2 | **No resource caps for heavy local tools** (GPU-min/wall-clock/batch) | **Critical** | MISSING | ComfyUI/Blender batch autonomy |
| B3 | **No formal stuck-detection / escalation** (2-fail→consult→replan) | **High** | PARTIAL | safe long unattended loops |
| B4 | **MiniMax adapter not implemented** (privileges + docs only) | High | DESIGN ONLY | any MiniMax generation |
| B5 | **No executor fallback chain** (primary fails → no auto-alternate) | Medium | PARTIAL | resilience of long runs |
| B6 | **LangSmith tracing not wired into the loop** | Medium | PARTIAL | post-hoc diagnosis of overnight runs |
| B7 | **Acceptance hardening H1/S1 open** (hardcoded coords, zone ambiguity) | Medium | PARTIAL | gate determinism under load |

---

### B1 — No budget governance · Critical
- **Evidence:** `brain/budgets/` does not exist; no `check_budget_or_block`,
  ledger, or config anywhere. Full detail + repair plan in
  `budget_governance_gap.md`.
- **Why it blocks:** paid executors (`claude`/`codex` API path, future
  MiniMax) run with no spend ceiling and no ledger. An autonomous retry loop
  could exhaust a paid balance overnight, untracked.
- **Fix:** implement the minimum budget system (see gap doc).
- **Risk if ignored:** runaway spend, no attribution, silent governance hole.
- **Interim:** keep all paid tools at `plan_only`; autonomy over free set only.

### B2 — No resource caps for heavy local tools · Critical
- **Evidence:** `brain/resources/` governs reservations/capacity, not cost or
  duration. No GPU-minute / wall-clock / batch-size ceiling for ComfyUI or
  Blender.
- **Why it blocks:** an uncontrolled batch can pin the GPU for hours and
  starve the host; no automatic stop.
- **Fix:** `ResourceBudget(gpu_minutes, wall_clock_s, max_batch)` enforced in
  the ComfyUI/Blender launch path (part of the budget system).
- **Interim:** ComfyUI/Blender heavy/batch runs disabled for autonomy.

### B3 — No formal stuck-detection / escalation · High
- **Evidence:** retry references exist in `executive/loop.py` and
  `codex_executor.py`, but there is no formal "after 2 failed attempts →
  consult LangChain/LangGraph/Claude → replan; never infinite retry" guard,
  and no lessons_learned retrieval feeding the next attempt.
- **Why it blocks safe long runs:** a malformed mission can burn iterations
  (and, once paid tools are on, money) without ever escalating or stopping.
- **Fix:** implement `recovery_and_escalation_system.md` (attempt counter +
  consult step + replan + hard stop + escalation to operator).
- **Interim:** cap autonomous iterations per mission; operator reviews loop
  output.

### B4 — MiniMax adapter not implemented · High
- **Evidence:** 5 MiniMax privileges (`memory/procedural/
  executive_privileges.yaml`, all `plan_only`) + capability/policy/playbook
  docs, but no adapter; capability marked not-yet-implemented.
- **Why it blocks:** there is no code path to actually call MiniMax; even if
  promoted, nothing executes. Compounds with B1 (no budget).
- **Fix:** build the adapter *after* B1, behind both privilege and budget
  gates.

### B5 — No executor fallback chain · Medium
- **Evidence:** router selects an executor; codex-packet fallback exists when
  codex is unavailable, but no general "primary errors → try declared
  alternate" chain.
- **Why it matters:** a transient executor failure can dead-end a mission
  that another executor could complete.
- **Fix:** declare fallback order per capability; route on failure (bounded by
  the stuck-detection attempt cap so it can't loop).

### B6 — LangSmith tracing not wired · Medium
- **Evidence:** `langsmith>=0.3.11` is a dependency; no tracing in the loop.
- **Why it matters:** overnight failures are hard to diagnose without traces.
- **Fix:** wire LangSmith tracing around graph/executor calls; link run_id.

### B7 — Acceptance hardening open items · Medium
- **Evidence:** `foundation/acceptance_hardening.md` H1 (bike step hardcodes
  470,432) and S1 (50px zone ambiguity) still open.
- **Why it matters:** the gate is the autonomy ratchet; under load these
  could re-introduce flakiness (a red gate stops work — good — but a *flaky*
  red wastes runs).
- **Fix:** runtime-derive walk targets; `interactions.byId()`; `retries:1` +
  error-context surfaced to stuck-detection.

## Bottom line
B1+B2 **block all paid/heavy autonomy** until fixed. B3 blocks *safe* long
unattended loops regardless of cost. With paid/heavy tools disabled and an
iteration cap in place, **unpaid local autonomy is not blocked** and is safe
to run today.
