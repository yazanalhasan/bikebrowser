# Operational Wiring Audit (Phase 0.8)

**Question:** can Executive Brain actually *use* the new governance systems
during a real autonomous workflow, or do they merely exist as tested modules?

**Answer (evidence-based):** they are **IMPLEMENTED and tested, and they fire
correctly when invoked** (proven in `autonomy_simulation_report.md`) — but with
one internal exception (voice), **none is WIRED into any production execution
path**, so **none is OPERATIONAL** in the autonomous loop yet. The pre-existing
gates (privilege, resource reservation, validation/acceptance, approval,
checkpoint) *are* operational.

## Method
Traced every governance symbol's call sites in `brain/` excluding its own module
and `tests/`:
```
grep -rn "<symbol>" brain/ --include=*.py | grep -v <own module> | grep -v tests
```
Result: **`enforce_executor_privilege` → 4 call sites** (claude/codex/openclaw/
playwright executors). **All other governance symbols → 0 production call sites.**
Also confirmed **0 production imports** of `brain.budgets`, `brain.recovery`,
`brain.tools`, `brain.missions.value_scoring`, `brain.assets.promotion`,
`brain.voice` anywhere outside their own packages/tests.

## The two real execution paths
1. **`brain/execution/runner.py::run_execution_package`** — uses
   `ResourceReservationStore` + `ResourceAwareScheduler` (capacity reservation,
   try/finally release), `run_validation_plan`, `evaluate_visual_improvement_gate`,
   `build_experience_gate_report`, `ApprovalStore`, `evaluate_meaningful_change`.
2. **`brain/graph/nodes.py`** — langgraph: input → retrieval → task_classification
   → risk_assessment → executor_routing → approval_gate → execution → validation →
   consolidation → memory_review → persistent_memory → **checkpoint_save**.
3. **Autonomous driver** `brain/executive/autonomous_completion.py` →
   `build_execution_package` → `run_execution_package(execute_shell=True)`, looping
   on **acceptance scores** (audio/completion/quest_playability).

None of these reference any new R0/voice module.

## Per-subsystem classification

Legend: **Implemented** = exists + tested · **Wired** = called by production code ·
**Operational** = reachable by a real autonomous workflow.

| Subsystem | Implemented | Wired | Operational | Can a real mission trigger it today? |
|---|---|---|---|---|
| **Budget Governance** | ✅ | ❌ | ❌ | No |
| **Resource Governance** (new GPU-min/wall-clock/batch caps) | ✅ | ❌ | ❌ | No (old *capacity* reservation is operational — different mechanism) |
| **Recovery Guard** | ✅ | ❌ | ❌ | No |
| **Lessons Learned** | ✅ | ❌ | ❌ | No |
| **Asset Promotion** | ✅ | ❌ | ❌ | No (old `run_validation_plan` runs; `evaluate_promotion` is not called) |
| **Mission Value Scoring** | ✅ | ❌ | ❌ | No (mission selection doesn't score) |
| **Tool Governance** | ✅ | ❌ | ❌ | No (graph `executor_routing_node` has its own logic; `select_tool` unused) |
| **Voice Governance** | ✅ | ⚠️ internal only | ❌ | No (voice executor self-wires gates, but nothing reaches the voice executor) |
| *(reference) Privilege gate* | ✅ | ✅ | ✅ | **Yes** — executors call it in `execute()` |
| *(reference) Acceptance/validation* | ✅ | ✅ | ✅ | **Yes** — runner + autonomous loop |
| *(reference) Checkpoint* | ✅ | ✅ | ✅ | **Yes** — `checkpoint_save_node` |

## Per-subsystem detail — what calls it / path / missing wiring

### Budget Governance — IMPLEMENTED, not wired
- **What calls it:** nothing (0 production sites).
- **Code path that should reach it:** `run_execution_package` (before any paid
  executor run) **and** inside paid executor `execute()` next to the privilege
  gate.
- **Missing wiring (exact):**
  ```python
  # brain/execution/runner.py, before executing a paid/heavy package:
  from brain.budgets import check_budget_or_block
  dec = check_budget_or_block(package.project, tool, "usd", est_cost)
  if not dec.allowed: return _blocked(package, dec.reason)
  # and inside claude/codex executor.execute() for the paid API path.
  ```

### Resource Governance (new caps) — IMPLEMENTED, not wired
- **What calls it:** nothing. The runner uses the *old* `ResourceReservationStore`
  (RAM/VRAM/disk capacity), not `check_resource_or_block` (GPU-minutes/wall-clock/
  batch).
- **Missing wiring:** add `check_resource_or_block(project, tool, gpu_minutes=…)`
  alongside the reservation in `run_execution_package` for ComfyUI/Blender/TTS.

### Recovery Guard — IMPLEMENTED, not wired
- **What calls it:** nothing. The graph has no recovery node; failures in
  `execution_node`/`run_execution_package` are not routed through
  `RecoveryGuard.record_outcome`.
- **Missing wiring:** wrap the execution attempt so each failure calls
  `record_outcome(sig, success=False)` and branches on RETRY/CONSULT/ESCALATE;
  persist a stuck report on escalate.

### Lessons Learned — IMPLEMENTED, not wired
- **What calls it:** nothing.
- **Missing wiring:** on failure (recovery path) `LessonStore().record(...)`;
  in `retrieval_node` (or before a retry) `LessonStore().retrieve(sig)` and feed
  into the replan context.

### Asset Promotion — IMPLEMENTED, not wired
- **What calls it:** nothing. `run_validation_plan` + visual gate run, but
  `evaluate_promotion` (validation+acceptance+provenance) is not invoked.
- **Missing wiring:** after an asset-producing task, call
  `evaluate_promotion(asset, acceptance_passed=…)` before the asset is committed
  / marked final (in `validation_node` or a new promotion node).

### Mission Value Scoring — IMPLEMENTED, not wired
- **What calls it:** nothing. `build_execution_package` selects work without
  `score_mission`.
- **Missing wiring:** in `package_builder` / mission selection, compute
  `rank_missions([...])` and only build packages for `do_now`/`queue`; defer the
  rest (esp. `blocked_by_budget`).

### Tool Governance — IMPLEMENTED, not wired
- **What calls it:** nothing. `executor_routing_node` routes by its own logic.
- **Missing wiring:** have routing consult `select_tool(need, paid_autonomy_enabled)`
  so paid/heavy tools are not selected without budget authorization.

### Voice Governance — IMPLEMENTED, internally wired, not reachable
- **What calls it:** within `brain/voice/`, `VoiceExecutor` calls
  `enforce_executor_privilege`, `check_resource_or_block`, `RecoveryGuard`,
  `evaluate_promotion` (internal mini-pipeline — verified in simulation). But
  **no CLI command, route, graph node, or mission reaches `VoiceExecutor`**.
- **Missing wiring:** a `cmd_voice` CLI command and/or a graph voice-capability
  node that constructs a `VoiceRequest` and calls `VoiceExecutor.plan/generate`.

## Definition-of-Done status
The DoD ("prove governance is operational, not merely implemented") is **partially
met**: the modules **execute and enforce correctly** when invoked (simulation
proves all five scenarios), and the **classic** gates (privilege → execution →
acceptance → checkpoint) are fully operational in the autonomous loop. But the
**new R0/voice governance is not yet in the autonomous code path** — it is
*invokable* but not *invoked*. The exact wiring to make it operational is listed
above and summarized as the Phase-0.8 implementation backlog in
`governance_execution_flow.md`.
