# Autonomy Simulation Report (Phase 0.8)

Controlled simulation exercising the **real** governance modules (no game code
modified, no files written to either repo, no audio generated). Each scenario
invokes the actual functions and records which governance systems fire and how
they decide. This proves the modules **function and enforce correctly when
invoked**; `operational_wiring_audit.md` separately establishes that the
autonomous loop does **not yet invoke** them.

> Run via `python - <<PY … PY` against the live `brain/` modules + the real
> `memory/procedural/project_budgets.yaml`. Verbatim output below.

## Scenario 1 — Free local task (edit code)
```
tool_selection: python  allowed=True
budget:         True  - free local tool; no money budget required
privilege(codex): False - plan_only
mission_scoring: queue  priority=5
```
**Fires:** Tool Governance (→ free `python`), Budget (→ allowed, free), Privilege
(→ **plan_only, fail-closed**: even a "free" code edit via codex is refused real
execution by default), Mission Scoring (→ queue). **Correct.**

## Scenario 2 — Failed task (same failure repeats)
```
attempt 1: action=retry    - first failure; retry once (transient tolerance)
attempt 2: action=consult  - second consecutive failure; STOP retrying the same plan...
attempt 3: action=escalate - 3 attempts exhausted (cap 4); escalate to operator. No infinite retry
attempt 4: action=escalate - 4 attempts exhausted (cap 4); escalate to operator. No infinite retry
```
**Fires:** Recovery Guard — retry → consult → escalate. **No infinite retry**
confirmed. **Correct.**

## Scenario 3 — Asset generation request (junk, no acceptance)
```
promotion: REJECTED  missing=['provenance (unknown source / no source file or prompt)',
                              'validation (quality 44 < threshold 70)',
                              'acceptance (no passing acceptance signal)']
```
**Fires:** Asset Promotion — rejects on all three required signals. **Junk gate
works. Correct.**

## Scenario 4 — Budgeted task (paid MiniMax, no budget set)
```
budget:          BLOCKED - paid tool 'minimax' has no usd budget; blocked (fail-closed).
                           'governed_execute' is not authorization to spend.
mission_scoring: defer   blocked_by_budget=True
```
**Fires:** Budget Governance (→ **BLOCKED**, fail-closed against the real
`project_budgets.yaml`), Mission Scoring (→ **defer**, blocked_by_budget).
**Correct.**

## Scenario 5 — Voice generation request
```
voice status:         generation_disabled | generation_enabled=False
voice resource gate:  False - heavy tool 'local_tts' has no resource budget; blocked (fail-closed)
voice privilege gate: False
cache_path:           \cache\audio\dialogue\72aee7b7408810b0985901eb.ogg
```
**Fires:** Voice Governance (→ `generation_disabled`), Resource Budget (→ blocked,
no `local_tts` budget), Privilege (→ blocked). A deterministic cache path is
computed; **no audio file is created.** **Correct.**

## Which governance systems actually fired

| System | Fired when invoked? | Decision | Auto-invoked by the autonomous loop? |
|---|---|---|---|
| Tool Governance | ✅ | selected free `python` | ❌ not wired |
| Budget Governance | ✅ | free allowed; paid blocked | ❌ not wired |
| Resource Governance | ✅ | `local_tts` blocked (no budget) | ❌ not wired |
| Privilege | ✅ | plan_only / refused (fail-closed) | ✅ wired (executors) |
| Recovery Guard | ✅ | retry→consult→escalate | ❌ not wired |
| Mission Value Scoring | ✅ | queue / defer | ❌ not wired |
| Asset Promotion | ✅ | rejected junk | ❌ not wired |
| Voice Governance | ✅ | generation_disabled | ❌ not reachable |

## Interpretation
- **All eight systems are functionally operational as libraries** — they
  execute, enforce fail-closed, and produce correct decisions on real inputs.
- **Seven of eight are not auto-invoked** by any autonomous workflow (only the
  privilege gate is, via executors). Voice self-wires the gates internally but is
  itself unreachable.
- Therefore: **governance is proven correct and enforceable, but not yet
  operationally embedded** in the autonomous execution path. The simulation is
  the evidence; the wiring backlog (`governance_execution_flow.md`) is the path
  to making "Mission → Governance → Execution → Recovery → Acceptance →
  Checkpoint" run automatically rather than by direct invocation.

## Definition of Done — assessment
> "Executive Brain can demonstrate Mission → Governance → Execution → Recovery →
> Acceptance → Checkpoint using actual code paths."

- **Demonstrated via actual code paths (this report):** every governance
  decision above ran through real module code on real config. ✅
- **Demonstrated as an automatic chain inside the autonomous loop:** **not yet**
  — Mission→Privilege→Execution→Acceptance→Checkpoint runs automatically, but
  Mission-Scoring, Budget, Recovery, Asset-Promotion, and Lessons are not yet on
  that automatic path. ❌ (this is the Phase-0.8 wiring work, scoped and ready).

**Conclusion:** governance is **operational on invocation, not yet operational on
autonomy.** Closing the gap is pure wiring (no new governance logic), itemized in
`operational_wiring_audit.md` and `governance_execution_flow.md`.
