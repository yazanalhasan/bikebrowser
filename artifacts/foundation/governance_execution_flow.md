# Governance Execution Flow (Phase 0.8)

The intended autonomous execution chain, with each step classified
**Implemented / Partially Wired / Missing** based on the wiring evidence in
`operational_wiring_audit.md`. "Wired" = called by a production code path
reachable from the autonomous loop (`autonomous_completion.py →
build_execution_package → run_execution_package`, and the langgraph pipeline).

## The flow

```
   Mission                       IMPLEMENTED + operational  (brain/missions/, package_builder)
     ↓
   Mission Scoring               MISSING wiring             (score_mission exists; never called)
     ↓
   Tool Selection                PARTIALLY WIRED            (graph executor_routing_node operational;
     ↓                                                       new select_tool engine not called)
   Privileges                    IMPLEMENTED + WIRED + OPERATIONAL  (executors call enforce_executor_privilege)
     ↓
   Budget                        MISSING wiring             (check_budget/resource exist; never called)
     ↓
   Execution                     IMPLEMENTED + OPERATIONAL  (run_execution_package + execution_node + executors)
     ↓
   Recovery                      MISSING wiring             (RecoveryGuard exists; no node/runner call;
     ↓                                                       only codex-packet ad-hoc retry today)
   Acceptance                    IMPLEMENTED + OPERATIONAL  (run_validation_plan, visual + experience gates,
     ↓                                                       acceptance scores drive the autonomous loop)
   Asset Promotion               MISSING wiring             (evaluate_promotion exists; validation runs but
     ↓                                                       promotion gate not called)
   Checkpoint                    IMPLEMENTED + OPERATIONAL  (checkpoint_save_node → MemoryStore.persist_checkpoint;
     ↓                                                       runtime/resume + replay)
   Lessons Learned               MISSING wiring             (LessonStore exists; never recorded/retrieved)
```

## Step table

| # | Step | Status | Operational today? | Evidence / gap |
|---|---|---|---|---|
| 1 | Mission | Implemented | ✅ | `brain/missions/`, `package_builder.build_execution_package` |
| 2 | Mission Scoring | **Missing wiring** | ❌ | `score_mission`/`rank_missions` exist; selection doesn't call them |
| 3 | Tool Selection | **Partially Wired** | ⚠️ | graph `executor_routing_node` operational; `select_tool` (budget/privilege-aware) unused |
| 4 | Privileges | Implemented+Wired | ✅ | `enforce_executor_privilege` in 4 executors' `execute()` |
| 5 | Budget | **Missing wiring** | ❌ | `check_budget_or_block`/`check_resource_or_block` never called in runner/executors |
| 6 | Execution | Implemented+Wired | ✅ | `run_execution_package`, `execution_node`, real executors |
| 7 | Recovery | **Missing wiring** | ❌ | `RecoveryGuard` uncalled; only codex-packet ad-hoc retry exists |
| 8 | Acceptance | Implemented+Wired | ✅ | validation + visual/experience gates; acceptance scores loop the driver |
| 9 | Asset Promotion | **Missing wiring** | ❌ | `evaluate_promotion` uncalled; old `run_validation_plan` runs instead |
| 10 | Checkpoint | Implemented+Wired | ✅ | `checkpoint_save_node`, `runtime/resume.py`, `replay.py` |
| 11 | Lessons Learned | **Missing wiring** | ❌ | `LessonStore` never recorded/retrieved |

## The operational spine (works today)
```
Mission → Privileges → Execution → Acceptance → Checkpoint
```
This subset **is** operational end-to-end: a mission becomes a package, the
executor enforces privileges (fail-closed) inside `execute()`, execution runs,
validation/visual/experience gates score acceptance (the autonomous loop iterates
on those scores), and `checkpoint_save_node` persists progress. Resource
*capacity* reservation and approval gating are also operational.

## The missing spine (Phase-0.8 backlog to make governance operational)
```
Mission → [Mission Scoring] → [Tool Selection (budget-aware)] → Privileges →
[Budget] → Execution → [Recovery + Lessons] → Acceptance → [Asset Promotion] →
Checkpoint
```
Bracketed steps need wiring (exact call sites in `operational_wiring_audit.md`):
1. `package_builder`: gate mission selection with `rank_missions`.
2. `executor_routing_node`: consult `select_tool` (block paid/heavy without budget).
3. `run_execution_package` + paid executor `execute()`: `check_budget_or_block` /
   `check_resource_or_block`.
4. execution failure path: `RecoveryGuard.record_outcome` + `LessonStore`.
5. post-asset task: `evaluate_promotion` before commit/finalize.
6. CLI/graph: a voice entry point that reaches `VoiceExecutor`.

Each is a small, well-scoped wiring change — no new governance logic, just
connecting tested modules into the two execution paths.
