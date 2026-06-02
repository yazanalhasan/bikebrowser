# Autonomy Limiters

Conditions that **degrade autonomy quality or breadth but are safe** — they
don't require stopping a class of work (unlike `autonomy_blockers.md`). Each
is something we can run with today, while noting the ceiling it imposes.

| # | Limiter | Current state | Desired | Complexity |
|---|---|---|---|---|
| L1 | LangChain used only for procedural retrieval, not planning | PARTIAL | retrieval + plan-repair assistance | Medium |
| L2 | No lessons_learned memory feeding next attempt | MISSING | failures recorded + retrieved before retry | Medium |
| L3 | Mission Value Scoring not encoded in the loop | DESIGN ONLY | score gates low-value/high-cost work | Low–Med |
| L4 | Single-machine, single-GPU; no parallel heavy jobs | n/a (hardware) | serialize heavy work | Low (policy) |
| L5 | Claude/Codex are CLI wrappers (no streaming token accounting) | PARTIAL | per-call runtime + token estimate | Medium |
| L6 | Checkpoint cadence is per-mission, not per-step | PARTIAL | step-level checkpoints for long missions | Low–Med |
| L7 | Reconciliation runs on demand, not continuously | PARTIAL | periodic reconcile during long runs | Low |
| L8 | Procedural memory freshness can lag code reality | PARTIAL | freshness re-validate in the loop | Low |
| L9 | No automatic asset-quality (junk) gate for generated art | MISSING | acceptance art-audit on every generated asset | Medium |

---

### L1 — LangChain scope
`retrieval/selective.py` retrieves procedural memory; LangChain is not used
for planning or plan-repair. **Limit:** replanning after failure is heuristic,
not retrieval-augmented. **Safe** because replanning still happens (loop +
operator); the ceiling is plan *quality*. Desired: feed prior plans + lessons
into a LangChain plan-repair step (also serves B3/L2).

### L2 — No lessons_learned loop
Failures aren't recorded as retrievable lessons, so attempt N+1 doesn't learn
from attempt N beyond what's in the immediate context. **Safe** (no harm) but
caps how much autonomy improves over a long run. Desired: append failure
signatures + resolutions to memory; retrieve matching ones before each retry.

### L3 — Mission Value Scoring not in-loop
`tool_selection_rules.md` defines Player/Educational/Engineering value vs
Implementation Cost, but the loop doesn't yet *gate* on it. **Limit:** the
system could spend effort on low-value/high-cost work. **Safe** (operator
queues missions today). Desired: compute the score, defer low-value/high-cost
missions automatically.

### L4 — Single-GPU serialization
Hardware reality: one machine, one GPU. **Limit:** heavy jobs (ComfyUI/Blender)
must serialize. **Safe** via policy (overnight policy serializes heavy work);
no code change needed beyond the resource budget (B2).

### L5 — CLI executor accounting
Claude/Codex run as CLI wrappers; we get exit/result but not granular token
streams. **Limit:** budget estimates for these are coarse. **Safe** for the
Max-plan CLI path (no per-call $), matters once paid-API estimation is needed.

### L6 — Checkpoint granularity
`runtime/resume.py` + `replay.py` checkpoint at mission boundaries. **Limit:** a
crash mid-long-mission resumes from the mission start, not the last step.
**Safe** (no data loss; just rework). Desired: step-level checkpoints for
multi-hour missions.

### L7 — On-demand reconciliation
The 5 reconcilers run when invoked, not continuously. **Limit:** drift between
intended and actual state isn't caught until a reconcile runs. **Safe** because
the acceptance gate + privilege gate catch the dangerous cases regardless.
Desired: periodic reconcile tick during long runs.

### L8 — Procedural freshness lag
Capability/playbook docs can describe code that has since changed. **Safe**
(memories are advisory, and recalled memories are verified before acting per
policy). Desired: a freshness re-validate pass in the loop.

### L9 — No automatic junk-asset gate
Generated art isn't automatically quality-gated before use. **Limit:** an
autonomous asset run (once budgets/MiniMax exist) could produce and commit
low-quality assets. **Currently moot** (generation is blocked by B1/B4) but
**must be built before** asset autonomy: run the acceptance art-audit on every
generated asset; reject below threshold; never commit junk.

## Bottom line
None of these block unpaid local autonomy. They cap how *good*, *broad*, and
*self-improving* autonomy is. L9 becomes a **prerequisite** the moment asset
generation is unblocked — wire it together with the budget system so the first
generated asset is already quality-gated.
