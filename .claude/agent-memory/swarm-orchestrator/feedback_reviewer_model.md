---
name: Haiku swarm agent model fallback
description: Any haiku-frontmatter swarm agent that stalls mid-investigation without writing its receipt should be retried with model=sonnet override on the Agent dispatch.
type: feedback
---

If a swarm agent whose frontmatter declares `model: haiku` returns a mid-investigation message ("Now let me check..." / "Let me extract more carefully..." / "The script had issues...") without writing its receipt to disk, retry the dispatch with `model: "sonnet"` in the Agent tool call.

**Why:** Observed 2026-04-25 across two different haiku-frontmatter agents:
- `code-quality-reviewer` (model: haiku, maxTurns: 8) — TWO consecutive runs failed to produce a receipt during asset-pipeline-3d review. Sonnet override on the third try finished in 7 tool uses.
- `data-schema-keeper` (model: haiku, maxTurns: 10) — first run failed to produce a receipt during initial swarm-data validation. Same exploration-vs-budget pattern.

The pattern in both: haiku spends the turn budget exploring/parsing instead of writing the deliverable. Sonnet, run on the same prompt, plans tighter and ships the receipt.

**How to apply:** When any haiku-model swarm agent finishes its dispatch without a receipt at the expected path, re-dispatch with `model: "sonnet"` (the parameter on the Agent tool overrides frontmatter). Log a transient blocker note under `.claude/swarm/blockers/` so the trail exists. Don't retry haiku a second time — sonnet has been the reliable recovery in both cases observed. Reserve user escalation for the case where sonnet ALSO fails.
