---
name: Skip native code-quality-reviewer this session
description: Session-scoped protocol — skip native code-quality-reviewer dispatch entirely; go straight to orchestrator-completed verification. User directive 2026-04-26 after 7/7 stall rate.
type: feedback
---

For the rest of the 2026-04-26 session, **skip native `code-quality-reviewer` dispatch entirely** (both haiku default and sonnet override). Go straight to **orchestrator-completed verification** using the dispatch's own checklist as the standard.

**Why:** Reviewer stall rate hit 7/7 this session — every dispatch stalled mid-investigation with no receipt written. Both haiku (default) and sonnet (override per saved memory `feedback_reviewer_model.md`) failed. The orchestrator-completed path was already doing the real verification work each time; native dispatch added latency + state churn without adding rigor. User explicitly directed the change after the ZuzuGarageScene PASS was orchestrator-completed despite two reviewer attempts.

**How to apply:**

- After every worker dispatch this session, skip `Agent(subagent_type='code-quality-reviewer', ...)` entirely.
- Run the dispatch-specific verification checklist directly: build, structural checks (jq/node JSON parsing), behavior-line greps, scope-violation grep, plus any agent-spec-specific verifications (e.g. for layout extractor: leftover-literals + unreferenced-keys + width/2-resolution).
- Write the orchestrator-completed reviewer receipt directly with `status: orchestrator_completed` and `review_method` documenting which checks ran.
- Verdict logic stays the same: any CRITICAL → FAIL; any HIGH → NEEDS_REVISION; otherwise PASS.
- Document the bypass rationale in the state.json entry's `reviewer_bypass_rationale` field.

**Scope:** Session-scoped. New session → revisit. The underlying reviewer-stall pattern may be a session-specific load issue (context window pressure), an Agent tool transient, or a model availability issue — not necessarily permanent.

**Not affected:** `data-schema-keeper` (always reviewer-exempt anyway).

**Saved memory `feedback_reviewer_model.md` interaction:** the sonnet-override recovery path is no longer reliable in this session. Future sessions should still try haiku first then sonnet per the original rule before falling back to orchestrator-completed.
