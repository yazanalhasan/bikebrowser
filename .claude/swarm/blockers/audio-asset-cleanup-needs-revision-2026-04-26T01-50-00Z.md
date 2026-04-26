# audio-asset-cleanup — NEEDS_REVISION

**Reviewer verdict:** NEEDS_REVISION
**Reviewer receipt:** `.claude/swarm/receipts/code-quality-reviewer-audio-asset-cleanup-2026-04-26T01-45-00Z.json`
**Worker receipt:** `.claude/swarm/receipts/audio-asset-cleanup-2026-04-26T01-35-00Z.json`
**Resolution applied this cycle:** Orchestrator restored the 5 archived WAVs via `git mv` immediately after review. The runtime regression is no longer present in the working tree.

## Retroactive classification (added 2026-04-25 by orchestrator)

**Failure mode:** `SPEC_VALID_BUT_RUNTIME_INVALID`

The worker's diff was 100% spec-compliant. The spec missed a runtime-reality
check: it did not require that the higher-priority `.ogg`/`.mp3` siblings
referenced as the "compressed sibling" actually be playable (non-zero, valid).
Going forward, the orchestrator dispatches every destructive/archival agent
under the **Runtime Reality Validation Protocol** documented in
`.claude/agent-memory/swarm-orchestrator/feedback_runtime_reality_validation.md`.

Under that protocol, this same dispatch would have produced:
- `rrv_candidates[].decision: block` for all 5 .wav masters
- `blocker: "requires_upstream_fix"`
- `recommended_next_agent: "audio-compression-pass"`
- receipt status `blocked`, not `complete`

The diff would never have landed; no restore would have been needed.

## What happened

The worker correctly followed the spec criterion ("compressed sibling exists") and archived 5 `.wav` masters whose `.ogg` siblings were present on disk:

| WAV master archived | Original path |
|---|---|
| garage_warm_oud.wav (2.82 MB) | public/game/audio/music/ |
| neighborhood_hybrid_ride.wav (2.82 MB) | public/game/audio/music/ |
| **quest_focus_hybrid.wav (2.12 MB)** | public/game/audio/music/ ← world map music |
| reward_tarabi_stinger.wav (388 KB) | public/game/audio/stingers/ |
| upgrade_unlock_hybrid.wav (459 KB) | public/game/audio/stingers/ |

But all 5 of those `.ogg` siblings are **0-byte placeholders**.

`AudioManager._findAssetUrl` (line 527–539) iterates `['.ogg', '.mp3', '.wav']` in order and skips 0-byte responses via `if (len === '0') continue`. No `.mp3` exists for any of these stems. So the actual fallback chain at runtime was:

  `.ogg` → 0 bytes, skipped → `.mp3` → not found → `.wav` → **active source**

After the archive: `.ogg` skipped → `.mp3` not found → `.wav` not found → **silence**.

This silently broke 3 in-game music tracks (garage, neighborhood, world-map) plus 2 stingers. Build still succeeded because Vite doesn't validate runtime audio fetches.

## Root cause: spec gap, not worker error

The agent spec at `.claude/agents/audio-asset-cleanup.md` line 75-77 says:

> | **Uncompressed master** | `.wav` whose compressed sibling (`.mp3` or `.ogg` of the same stem) is the referenced one | Archive the `.wav` |

The criterion is "compressed sibling exists." It does NOT require "compressed sibling is non-zero bytes." The agent followed the spec literally and shipped a runtime regression.

## Fix applied

Orchestrator restored the 5 WAVs via `git mv` from `public/audio/_archived/game/audio/...` back to their original paths. The empty `_archived/game/audio/{music,stingers}/` directories were left in place (harmless; will be reused by the future re-attempt).

## Required for re-dispatch

Before audio-asset-cleanup runs again, the spec needs a one-line addition:

> | **Uncompressed master** | `.wav` whose compressed sibling (`.mp3` or `.ogg` of the same stem) is the referenced one **and is non-zero bytes** | Archive the `.wav` |

OR a new prerequisite in the procedure:

> Step 3.5 — For each candidate marked "Uncompressed master", verify the compressed sibling has non-zero size via `wc -c` or equivalent. Skip the archive if the sibling is 0 bytes — note as "needs compression first" in the receipt.

## Suggested follow-up sequence

The proper sequencing for actually shrinking the audio footprint is:

1. **audio-compression-pass** (NEW agent, doesn't exist yet): export playable `.ogg` (or `.mp3`) from each WAV master that has a 0-byte compressed sibling. Place at the original path. Verify non-zero. ~5 files to process.
2. **audio-asset-cleanup re-run**: with the new "non-zero sibling" rule, this time it will find genuine compressed alternatives and the archive will be safe.

Until step 1 lands, the WAVs MUST stay in their original locations or the world-map music goes silent.

## State

- `audio-asset-cleanup` is recorded in state.json with status `partial` and pointer to this revision note.
- The dep-overrides-housekeeping work that ran in parallel was unaffected and remains complete.
