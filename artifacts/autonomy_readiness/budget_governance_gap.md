# Budget Governance Gap — repair plan

**Status: DESIGN ONLY. `brain/budgets/` does not exist.** Budget-governed
autonomy was specified but never implemented. This is the #1 autonomy
blocker. Until it exists, **paid and high-resource tools must not run
autonomously.**

> Verified 2026-06-02: `ls brain/budgets/` → "No such file or directory";
> `grep -rl "check_budget_or_block\|spend_ledger\|brain.budgets" brain/` →
> zero hits. No budget code anywhere in Executive Brain.

## Expected system (per the autonomy spec)
A cost/resource governor parallel to the privilege gate. Before any paid or
heavy action, the executor calls `check_budget_or_block(tool, est_cost)`
which reads a per-project + per-tool budget, checks a running spend ledger,
and **fails closed** (blocks) if the budget is undefined, exhausted, or the
estimate would exceed remaining. A report surfaces remaining budget.

## Actual current state
- **No budget config** (project or per-tool). Spend is unbounded.
- **No ledger.** No record of what any run has spent.
- **No enforcement.** Executors check privilege (`privilege_gate.py`) but
  nothing checks cost. A `governed_execute` MiniMax/Codex/Claude-API call
  would run with **zero spend ceiling**.
- **No resource caps** for heavy local tools (GPU minutes, wall-clock,
  batch size) — `resources/` governs *capacity/reservations*, not *cost or
  duration limits*.
- **No CLI/report** to set or view budgets.

## Missing files
```
brain/budgets/__init__.py
brain/budgets/models.py        # ProjectBudget, ToolBudget, SpendEntry, ResourceBudget
brain/budgets/registry.py      # load/save budget config (config/budgets.yaml)
brain/budgets/ledger.py        # append-only spend ledger + remaining() query
brain/budgets/enforcement.py   # check_budget_or_block(tool, est) -> raises/returns
brain/budgets/cli.py           # set/show/reset budgets; remaining-budget report
config/budgets.yaml            # the actual budget values (gitignored if $ amounts)
tests/test_budget_enforcement.py
```

## Missing CLI
- `eb budget set --project bikebrowser --usd 20`
- `eb budget set-tool minimax --usd 5 --calls 50`
- `eb budget set-resource comfyui --gpu-minutes 30 --max-batch 8`
- `eb budget show` → table of allocated / spent / remaining per tool.

## Missing ledger
Append-only `memory/budgets/<project>.ledger.jsonl`: one row per spend
`{ts, project, tool, kind: usd|calls|gpu_min, amount, est, mission, run_id}`.
`remaining(tool)` = allocated − sum(ledger). No ledger today → no remaining
query → no enforcement possible.

## Missing enforcement
`check_budget_or_block(tool, estimate)` must be called **inside** each paid/
heavy executor's `execute()` (same pattern as `enforce_executor_privilege`,
fail-closed) **before** the external call. No budget defined for a paid tool
⇒ **block** (not "assume unlimited"). Wire points:
- `executors/claude_executor.py`, `codex_executor.py` (paid API path),
- MiniMax adapter (when built),
- ComfyUI/Blender launchers (resource budget: gpu-minutes, wall-clock, batch).

## Tools affected (autonomous execution status until budgets exist)
| Tool | Cost kind | Autonomous status |
|---|---|---|
| MiniMax (5 privileges) | paid API | **BLOCKED** |
| Claude API / Codex (paid path) | paid API | **BLOCKED** unless per-call manual approval |
| Cloud generation / batch assets | paid | **BLOCKED** |
| ComfyUI (local GPU) | GPU minutes | **BLOCKED for heavy/batch** — resource governance missing |
| Blender (local render) | GPU/CPU minutes | **BLOCKED for batch renders** |
| Claude/Codex (Max-plan CLI, no per-call $) | runtime only | Allowed within normal runtime limits |
| Playwright / validator / local edits / docs | free local | **Allowed** |

## Risk if ignored
- **Runaway spend:** an autonomous loop retrying a failing MiniMax mission
  could exhaust the paid balance overnight with no ceiling and no record.
- **No attribution:** without a ledger, an overspend can't even be diagnosed
  or attributed to a mission after the fact.
- **GPU lockup / thermal:** uncontrolled ComfyUI/Blender batches can pin the
  GPU for hours, starving the rest of the system.
- **Silent governance hole:** privilege says "you may," but nothing says
  "you can afford it" — `governed_execute` ≠ "within budget" today.

## Recommended minimum implementation (before overnight autonomy)
Smallest working version (mirror the privilege-gate pattern):
1. **`config/budgets.yaml`** — project budget + per-tool budgets + per-tool
   resource caps. Absent tool entry ⇒ treated as **0 / blocked**.
2. **`budgets/models.py`** — `ProjectBudget`, `ToolBudget(usd, calls)`,
   `ResourceBudget(gpu_minutes, wall_clock_s, max_batch)`, `SpendEntry`.
3. **`budgets/ledger.py`** — append-only jsonl + `remaining(tool, kind)`.
4. **`budgets/enforcement.py::check_budget_or_block(tool, est)`** —
   **fail-closed**: block if no budget, exhausted, or est > remaining;
   record reservation; release/commit actual on completion (try/finally,
   same as resource reservations).
5. **Paid-tool block if no budget** — wired into paid executors' `execute()`.
6. **Resource-budget block** for ComfyUI/Blender (gpu-minutes + max-batch +
   wall-clock).
7. **CLI/config** to set budgets (`budgets/cli.py`).
8. **Remaining-budget report** (`eb budget show` + a line in the overnight
   report).
9. **Tests** — fail-closed when budget absent; block when exhausted; ledger
   sums correctly; reservation released on failure.

## Interim policy (until the above ships)
**Disable paid/heavy tools for autonomous runs** (keep them at `plan_only`)
and run autonomy only over the **allowed-free set** (audits, local tests,
Playwright, edits, docs). This is the gate enforced in
`overnight_execution_policy.md`. Estimated effort for the minimum version:
~1 focused implementation session (it reuses the privilege-gate +
reservation patterns already in the codebase).
