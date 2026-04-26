---
name: Receipt recovery for stalled-but-correct workers
description: When a worker's code lands but it stalled before writing a receipt, the orchestrator runs RECEIPT_RECOVERY (verify → synthesize receipt → mark complete_with_recovery → audit log) instead of blocking on the no-receipt hard rule.
type: feedback
---

When a dispatched agent produces valid code changes on disk but never
writes its receipt, do not block on the "no receipt = failed" rule.
Instead, enter **RECEIPT_RECOVERY** mode:

1. **Verify** the work matches its spec:
   - Target files exist on disk.
   - Expected functions/symbols/imports are present (grep / read).
   - No syntax errors (`node --check` or build of the affected module).
   - Cross-check sibling agents' receipts if they reference the work.

2. **If verification passes**, synthesize the receipt yourself from:
   - `git diff HEAD -- <files>`
   - The agent's spec (.claude/agents/<name>.md)
   - Any sibling agent's confirmation in their receipts
   Receipt path matches what the worker would have written.
   `status: "complete_with_recovery"` (NOT plain `complete`).
   Notes must include: why recovery was needed, what was verified, what
   was synthesized vs. observed.

3. **Mark the agent in state.json** as `status: complete_with_recovery`
   on the completed[] entry, with `recovery_event` pointing to the audit
   log.

4. **Log the recovery event** to
   `.claude/swarm/recovery-events/<agent>-<ts>.md` for audit trail —
   what stalled the worker, what was on disk, what got synthesized.

**Why:** The orchestrator's "no receipt = failed" rule was meant to
prevent silently passing agents that didn't actually do the work. When
the work IS verifiably done (file diff matches spec, sibling confirms,
syntax clean), refusing to gate on a missing receipt is bureaucratic
churn — the user explicitly approved this recovery path 2026-04-25
after world-path-renderer stalled at max_turns running a syntax checker
post-edit. The recovery synthesis is itself an audit artifact, not a
free pass.

**How to apply:** Trigger when a worker's Agent return shows `tool_uses`
hitting/near max but no receipt on disk AND files referenced in the
spec show diffs matching the spec's outputs. Skip recovery and stay
blocked if any of: (a) files don't exist, (b) symbols missing, (c)
syntax broken, (d) sibling receipts disagree, (e) diff is partial in a
way the spec doesn't allow. The reviewer still runs after recovery —
recovery doesn't bypass the quality gate, only the receipt gate.
