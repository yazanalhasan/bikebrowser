# Budget Status — bikebrowser

Live status of the budget governance system implemented in the Executive Brain
repo (`C:/Users/admin/Documents/executive-brain/brain/budgets/`). This artifact
records the **current authorized spend envelope.** Governance is **live and
fail-closed**; no money or heavy-resource use is authorized yet.

## System (IMPLEMENTED)
- `brain/budgets/models.py` — `ProjectBudget`, `ToolBudget`, `ResourceBudget`, `SpendEntry`
- `brain/budgets/registry.py` — loads `memory/procedural/project_budgets.yaml`
- `brain/budgets/ledger.py` — append-only `memory/budgets/<project>.ledger.jsonl`
  (reserve / commit / release; reservations count against remaining)
- `brain/budgets/enforcement.py` — fail-closed `check_budget_or_block()` +
  `check_resource_or_block()`
- `brain/budgets/reports.py` — allocated / spent / remaining report
- Tests: `tests/test_budget_governance.py` — **12 passing**

## Current authorized envelope (project: bikebrowser)
```
Project USD limit: None (no overall paid budget authorized)
paid_tools : minimax, openai_api, claude_api, cloud_generation   → all BLOCKED (no tool budget set)
heavy_tools: comfyui, blender                                    → all BLOCKED (no resource budget set)
tools      : {}   (empty → fail-closed)
resources  : {}   (empty → fail-closed)
```

## What this means
- ✅ **Free local tools** (Playwright, Python, Node, file edits, docs,
  Claude/Codex Max-CLI runtime) — **allowed**, no money budget required.
- ⛔ **Paid tools** (MiniMax / OpenAI API / Claude API / cloud gen) — **blocked**
  until an operator adds a `tools:` entry with a `usd_limit`.
- ⛔ **Heavy local tools** (ComfyUI / Blender batches) — **blocked** until an
  operator adds a `resources:` entry with caps.
- Even if `project_budgets.yaml` is deleted, `DEFAULT_PAID_TOOLS` /
  `DEFAULT_HEAVY_TOOLS` keep these blocked (defense in depth).

## To authorize spend (operator action)
Edit `memory/procedural/project_budgets.yaml`:
```yaml
projects:
  bikebrowser:
    tools:
      minimax: { usd_limit: 5.0, call_limit: 50 }
    resources:
      comfyui: { gpu_minutes: 30, wall_clock_seconds: 1800, storage_gb: 5, max_batch: 8 }
```
Then `brain/budgets/reports.py::render_budget_report_md('bikebrowser')` shows
the remaining envelope, and `check_budget_or_block` / `check_resource_or_block`
permit spend up to those caps (and block beyond them).

## Status: Budget readiness — IMPLEMENTED (was DESIGN ONLY)
The autonomy-readiness blocker **B1 is closed**: budget governance now exists
and enforces fail-closed. Paid autonomy remains *administratively* blocked
(no limits set) — which is the safe default — but the *mechanism* is in place,
tested, and ready for an operator to authorize a real envelope.
