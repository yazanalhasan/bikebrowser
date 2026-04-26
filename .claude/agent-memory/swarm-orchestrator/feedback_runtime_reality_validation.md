---
name: Runtime Reality Validation for destructive/archival agents
description: Before any agent removes, archives, or rewrites assets, the dispatch prompt must require runtime usage verification + fallback-chain awareness; spec compliance alone is insufficient.
type: feedback
---

All destructive or archival agents (audio-asset-cleanup, future asset-pruners,
dependency-removers, dead-code-deleters, save-migration-rewriters) MUST honor
the **Runtime Reality Validation Protocol** before acting on any candidate.
The orchestrator injects this protocol into the dispatch prompt; the agent
must echo "RRV: <result>" per candidate in its receipt.

## The Protocol

### 1. Asset Usage Verification
Before modifying or removing any asset, the agent must:
- trace actual runtime usage (grep imports, registry entries, manifest refs)
- confirm the asset is NOT part of an active fallback chain
- confirm no code path resolves to it

### 2. Fallback Awareness
If the consuming system uses fallback logic (e.g.
`AudioManager._findAssetUrl` iterating `['.ogg', '.mp3', '.wav']` and
`continue`-ing on 0-byte responses):
- verify ALL higher-priority formats are valid (non-zero, loadable, parseable)
- if a higher-priority candidate is invalid → treat the next-priority format
  as the ACTIVE source, not a redundant master

### 3. Block Condition
If a candidate is part of a fallback chain AND any upstream format is
invalid (zero-byte, missing, unparseable), the agent must:
- BLOCK the action on that candidate
- emit `requires_upstream_fix` in the receipt
- list the upstream gap (which format, which path, why invalid)

### 4. Auto-Remediation Suggestion
When blocked, the agent must propose an upstream-fix path before exiting,
e.g. "audio-compression-pass agent should produce a playable .ogg from
this .wav before archive can proceed". Do NOT proceed with the destructive
change.

## Why this rule exists

**Incident: audio-asset-cleanup 2026-04-26.** Worker archived 5 .wav masters
whose .ogg siblings existed on disk — spec-compliant. But all 5 .ogg files
were 0-byte placeholders. AudioManager skips 0-byte responses and falls to
.mp3 (none exist) then .wav (now archived) → silence. Three in-game music
tracks (garage, neighborhood, world-map) and 2 stingers went silent. Build
succeeded because Vite doesn't validate runtime audio fetches. Restored via
`git mv` post-review. Classified retroactively as
**SPEC_VALID_BUT_RUNTIME_INVALID** — the worker followed the spec
correctly; the spec lacked a runtime-reality check.

## How to apply

Inject this protocol verbatim into the dispatch prompt for any agent whose
job involves any of:
- removing files (archive, delete, gitignore)
- rewriting save schemas (would orphan keys)
- removing dependencies (would break dynamic imports)
- removing dead code (would break runtime-only call sites)
- removing assets the build doesn't statically reference

Require the agent to:
1. List candidates in the receipt under `rrv_candidates[]`
2. For each: `{path, runtime_check, fallback_chain_check, upstream_validity, decision: act|block, blocker_reason?}`
3. Set receipt `status: blocked` with `blocker: "requires_upstream_fix"` if ANY candidate blocked, even if others passed
4. Propose the unblocking agent in `recommended_next_agent`

The reviewer should then independently spot-check 1-2 `rrv_candidates`
entries against the codebase before granting PASS on a destructive run.
