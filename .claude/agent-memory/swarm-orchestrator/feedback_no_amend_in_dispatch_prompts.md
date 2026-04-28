---
name: Forbid git commit --amend in dispatch prompts
description: Workers default to git amend when they need to fix their own commit (e.g., backfilling receipt fields); orchestrator's no-amend rule is invisible to them unless dispatched explicitly. Add explicit guardrail to every dispatch prompt that involves a commit.
type: feedback
---

When a dispatched worker realizes mid-flight that its own commit
needs a fixup (most often: receipt's `commit_hash` field can't be
filled in until AFTER the commit is made, so the agent commits, then
edits the receipt, then amends the commit to backfill), the default
git instinct is `git commit --amend`. The orchestrator's CRITICAL
rule against amends ("Always create NEW commits rather than amending,
unless the user explicitly requests a git amend") lives in the
orchestrator agent definition — workers don't see it.

**Observed 2026-04-28** with the parallel Playwright dispatch
(general-purpose). Agent committed at SHA `b3cdada`, then realized
the receipt's `commit_hash` field still pointed at a placeholder.
It amended the commit, changing SHA to `99c77c5`. Self-correction
within its own dispatch — not destructive, didn't modify other
agents' work — but bypassed the orchestrator's amend rule. The
amend rule exists because pre-commit hooks failures can result in
data loss; even when the agent's amend is "harmless," the muscle
memory needs reinforcing.

**Why:** The orchestrator's amend prohibition is in the
orchestrator-agent definition file. Workers receive their dispatch
prompt as their entire context — they don't read other agent
definitions. The rule is invisible to them.

**How to apply:** Every dispatch prompt that grants commit authority
to the worker MUST include the explicit guardrail:

> Do NOT use `git commit --amend`. If your initial commit needs a
> fixup (e.g., receipt's commit_hash can't be filled until after
> the commit is made), make a SECOND commit with the fixup. Two
> small commits is better than one amended commit.

For receipt-backfill specifically: have the worker either (a) write
the receipt FIRST without commit_hash, then commit (omit commit_hash
or use "PENDING"), then add a tiny SECOND commit that fills in
commit_hash; OR (b) compute the SHA via `git log -1 --format=%H` after
staging-but-before-committing, embed it in the receipt, then commit
both files in one go. Approach (a) is simpler.

**Exception:** If the user explicitly authorizes amend in the dispatch
prompt for a specific reason, that's fine — the rule is "default
forbidden, opt-in allowed."
