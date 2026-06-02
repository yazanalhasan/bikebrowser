# Autonomy Readiness Score

Evidence-based assessment of Executive Brain's (`C:/Users/admin/Documents/
executive-brain`) readiness for long autonomous BikeBrowser development.
Status taxonomy: **IMPLEMENTED / PARTIAL / DESIGN ONLY / MISSING.**
Reality > aspiration: every status is grounded in code that exists (or
doesn't).

> **UPDATE (post-R0 Governance Sprint + Voice Governance Sprint V1, 2026-06-02):**
> Several rows below have since shipped. **Budget + Resource readiness →
> IMPLEMENTED** (`brain/budgets/`), **Recovery/stuck-detection → IMPLEMENTED**
> (`brain/recovery/`), and **Voice production → IMPLEMENTED (governance-only,
> generation disabled)** (`brain/voice/`, tag `voice_governance_v1`). The table
> reflects these updated statuses; the original pre-sprint values are noted
> where they changed. Full suite: 426 passing.

## Per-area readiness

| Area | Status | Score /5 | Evidence |
|---|---|---|---|
| **Executor readiness** | IMPLEMENTED | 4 | `brain/executors/` codex/claude/openclaw/playwright/validator/local_stub, all real |
| Privilege enforcement | IMPLEMENTED | 5 | `executors/privilege_gate.py` fail-closed inside `execute()`; plan_only defaults; env flags can't bypass |
| **Acceptance readiness** | IMPLEMENTED | 5 | act1-acceptance 3/3 green + Brain audit PASS; the ratchet; stabilized + hardening plan |
| Playwright readiness | IMPLEMENTED | 5 | dual-route drives; deterministic after dead-band fix |
| Checkpoint readiness | IMPLEMENTED | 4 | `runtime/resume.py`, `replay.py`, `memory/checkpoints/` |
| Reconciliation (recovery substrate) | IMPLEMENTED | 4 | `reconciliation/` 5 reconcilers (execution/approval/mission/reality/resource) |
| Mission readiness | IMPLEMENTED | 4 | `brain/missions/`, `executive/loop.py`, `autonomous_completion.py` |
| Workflow readiness (LangGraph) | IMPLEMENTED | 4 | `brain/graph/` 12-node pipeline |
| Procedural memory | IMPLEMENTED | 4 | 114 entries, validates; legacy preservation registry exists |
| Codex readiness | PARTIAL | 3 | executor real; governed_execute gate; no autonomous fallback chain |
| Claude readiness | PARTIAL | 3 | executor real (CLI); plan_only default |
| OpenClaw readiness | PARTIAL | 3 | executor real; plan_only; shell allowlist + metachar guard |
| LangChain (retrieval/plan) | PARTIAL | 2 | `retrieval/selective.py` procedural retrieval only; not a full RAG/planning layer |
| LangSmith (observability) | PARTIAL | 2 | dependency present; tracing not wired into the loop |
| **Recovery / stuck-detection / escalation** | **IMPLEMENTED** (was PARTIAL→MISSING) | 5 | `brain/recovery/guard.py` 2-fail→consult→replan→escalate + `lessons.py`; 10 tests |
| Executor fallback routing | PARTIAL | 2 | router + codex-packet fallback; no general fallback chain |
| **MiniMax readiness** | DESIGN ONLY | 1 | 5 plan_only privileges + capability/policy docs; **adapter not_yet_implemented** (now budget-gated) |
| **Budget readiness** | **IMPLEMENTED** (was DESIGN ONLY/0) | 5 | `brain/budgets/` models/registry/ledger/enforcement/reports; fail-closed `check_budget_or_block`; 12 tests |
| Resource governance (heavy local) | **IMPLEMENTED** (was PARTIAL) | 5 | `check_resource_or_block` GPU-min/wall-clock/storage/batch caps; fail-closed |
| **Voice production** | **IMPLEMENTED** (gov-only, generation disabled) | 5 | `brain/voice/` full path (registry/cache/manifest/queue/validation/executor/adapters); `VOICE_GENERATION_ENABLED=False`; tag `voice_governance_v1`; 16 tests |

## The headline blocker (per user directive)
- **Budget readiness: NOT READY.**
- **Paid tool autonomy: BLOCKED** until the budget system exists.
- **MiniMax autonomous execution: BLOCKED.**
- **OpenAI / Claude API autonomous execution: BLOCKED** unless a manual
  approval is present per call.
- **ComfyUI / Blender local heavy runs: RESOURCE GOVERNANCE MISSING.**

## Final question — can EB safely run an 8-hour autonomous session?

**Partially — yes for unpaid local work, NO for paid/heavy work.**

- ✅ **SAFE autonomously today:** read-only audits, local tests, Playwright
  validation, code edits, docs, and non-paid local work within normal
  runtime limits — gated by the green acceptance ratchet + fail-closed
  privileges + checkpoints + reconciliation.
- ❌ **NOT SAFE autonomously until budgets exist:** MiniMax/paid-API/cloud
  generation, paid model calls, large batch asset generation, long GPU
  runs, uncontrolled ComfyUI batches, large Blender renders.
- ⚠️ **Stuck-loop risk:** recovery/escalation is informal — a malformed
  mission could burn iterations without the formal 2-fail→consult→replan
  guard (`recovery_and_escalation_system.md` defines the fix).

**Verdict: Do NOT start overnight autonomous *production* until (a) the
budget system is implemented, or (b) all paid/high-resource tools are
disabled, AND (c) the recovery/escalation guard is in place.** Unpaid
local autonomy (audits/tests/edits/docs) is safe now under the existing
governance.

## Prioritized gaps (full plan in `autonomy_repair_plan.md`)
1. **Budget governance** (DESIGN ONLY → minimum impl) — `budget_governance_gap.md`.
2. **Recovery/stuck-detection/escalation** (PARTIAL → formal) — `recovery_and_escalation_system.md`.
3. LangSmith tracing wired into the loop (observability for long runs).
4. Executor fallback chain + lessons_learned retrieval.
