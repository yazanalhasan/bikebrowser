---
name: Reviewer scope-violation false-positives from dirty baselines
description: When a reviewer flags a CRITICAL scope violation on a file that was already dirty in the working tree pre-dispatch, suspect mis-attribution and re-dispatch with corrected baseline before accepting the FAIL.
type: feedback
---

If `code-quality-reviewer` returns FAIL with a CRITICAL "scope violation" on a file, FIRST check whether that file was already dirty in the working tree BEFORE the worker ran. If yes, the reviewer is almost certainly attributing pre-existing user/orchestrator edits to the worker because `git diff HEAD -- <file>` mixes them together.

**Why:** Observed 2026-04-25 during `tts-dialog-integration` cycle 1 review. The reviewer FAIL'd the worker for "modifying the physics-question path at GameContainer.jsx:354-371." The worker had not touched it — those lines were a pre-existing user edit (orchestrator-authored earlier in the same session, never committed). `GameContainer.jsx` had been dirty since the previous commit `e2531ce` (long before the worker started), so `git diff HEAD` showed the user's edit AND the worker's edits as one combined diff. The reviewer couldn't distinguish them. A second reviewer dispatch with explicit baseline clarification retracted the FAIL and produced a correct NEEDS_REVISION on the actual issue (the resolver regex).

**How to apply:**

1. Before dispatching the reviewer for a worker that touched a previously-dirty file, ALWAYS include in the prompt: "File X was last committed at <SHA> and has these pre-existing modifications: <list>. Your review should ONLY consider the worker's claimed regions, NOT lines outside that range."
2. If a reviewer FAIL comes back on a file you know was dirty pre-dispatch, do NOT immediately mark the worker blocked. Re-dispatch the reviewer with the corrected baseline as a clarification round.
3. Cleaner long-term remedy: commit pre-existing dirt to its own branch/commit BEFORE dispatching workers that will touch the same file. The dispatch's diff then reads cleanly against a known-good baseline.
4. The reviewer's `git diff HEAD~ -- <file>` works correctly only when the worker's commit is at HEAD. Mid-session our flow keeps changes uncommitted in the working tree while the reviewer runs, so prefer `git diff HEAD -- <file>` and explicitly disclose any pre-dispatch dirt.

This is structurally a problem with how the dispatch loop interacts with the working-tree-only nature of mid-flight worker edits, not a worker mistake. Treat it as a recoverable orchestration glitch, not as a worker FAIL.
