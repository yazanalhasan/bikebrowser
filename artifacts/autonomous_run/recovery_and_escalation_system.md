# Recovery & Escalation System

How the autonomous loop handles failure **without getting stuck, looping
forever, or burning budget.** This defines the formal guard that closes
blocker B3 (today recovery is informal — `executive/loop.py` /
`codex_executor.py` have ad-hoc retry, but no escalation contract). This is a
**design + repair spec**; status: **PARTIAL → to implement (R0.3).**

## Core contract
> **Never infinite retry.** After **2 failed attempts** on the same step,
> stop, consult, replan; if the replan also fails, **escalate to the operator
> and checkpoint.** Every failure is recorded.

## Stuck detection
A step is "stuck" when any holds:
- **2 consecutive failed attempts** with the same failure signature, OR
- **no measurable progress** across 2 attempts (same error, same state, no
  acceptance-dimension improvement), OR
- a **hard limit** is hit: per-mission iteration cap, wall-clock cap, or
  (once built) budget/resource cap.

A "failure signature" = `{step_id, error_class, key_message}` so distinct
errors don't share a counter and a flapping error is detected.

## The escalation ladder
```
Attempt 1 ──fail──> Attempt 2 (same plan, transient-fail tolerated)
   │ fail
   ▼
CONSULT  ── LangChain: retrieve matching lessons_learned + procedures
         ── LangGraph: inspect mission state / where it diverged
         ── Claude:    diagnose + propose a NEW plan (root-cause, not retry)
   │
   ▼
REPLAN  ── adopt new plan; try ONCE (counts as a fresh signature)
   │ fail
   ▼
FALLBACK ── if a declared executor fallback exists (B5), try alternate ONCE
   │ fail
   ▼
ESCALATE ── stop the step; checkpoint; write to overnight report:
            {mission, step, signatures, attempts, consult output, why stuck}
            move on to the next independent mission if any; else pause loop.
```
No branch loops back to "retry the same thing." Each downward step is a
*different* action (consult → replan → fallback → escalate), bounded.

## Failure categories & responses
| Category | Example | Response |
|---|---|---|
| **Transient** | network blip, timeout, flake | 1 retry (Playwright `retries:1`); then treat as real |
| **Deterministic test red** | acceptance assertion fails | **STOP** — do not weaken the gate; diagnose with trace/error-context; fix root cause or revert; never re-tag green |
| **Tool/executor error** | executor crash, missing CLI | fallback executor (B5) once; else escalate |
| **Plan wrong** | step can't achieve goal | consult+replan |
| **Resource/budget cap** | gpu-min/wall-clock/$ exhausted | **STOP** that work class; escalate; never override the cap |
| **Privilege denied** | plan_only tool, no promotion | **STOP**; request operator promotion; never bypass |
| **Ambiguous/unknown** | unclear state | reconcile (reality/execution reconciler) → consult → replan |

## Hard stops (never auto-override)
- A **red acceptance gate** stops promotion of that change. (Diagnose; fix or
  revert. The gate is never bypassed or weakened.)
- A **budget/resource cap** stops that work class.
- A **privilege denial** stops the action.
- A **destructive git op** (reset/force) or **publish/merge-to-main** requires
  operator approval — never autonomous.
- **2× consult+replan still failing** → escalate; do not keep replanning
  indefinitely.

## Recording & learning (closes L2)
On every failure, append a lessons_learned entry: `{signature, context,
attempted, consult_diagnosis, resolution|escalated, mission, run_id, ts}`.
Before the next attempt on a similar step, retrieve matching lessons
(LangChain) and feed them into the plan. This makes long runs *self-improving*
rather than repeating mistakes.

## Checkpointing on escalation
On escalate: write a checkpoint (`runtime/resume.py`) so the operator can
resume exactly where it stopped. No paid work is silently restarted on resume
— the budget ledger and reconcilers reconcile prior spend/state first.

## Iteration & time caps (defaults; operator-tunable)
- **Per-step attempts:** 2 before consult; +1 after replan; +1 fallback ⇒ max
  4 distinct attempts, then escalate.
- **Per-mission iterations:** hard cap (e.g. 20) → escalate.
- **Per-run wall-clock:** the overnight window (e.g. 8h) → graceful stop +
  report.
- All caps are **logged when hit** (no silent truncation).

## Implementation notes (R0.3)
- Add an attempt-counter + signature tracker around the executor call in
  `executive/loop.py`.
- Add a `consult()` step calling LangChain retrieve + Claude replan.
- Add an `escalate()` that checkpoints + writes the overnight-report stuck
  block + (optionally) a PushNotification/Telegram to the operator.
- Tests: stuck after 2 same-signature fails; consult invoked once; hard stop
  on red gate / cap / privilege; escalation checkpoints; lessons recorded.

This guard is required before **safe** long unattended runs (independent of
cost). It is Priority 0 (R0.3) in `autonomy_repair_plan.md`.
