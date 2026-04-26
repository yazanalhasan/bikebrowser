---
name: audio-asset-cleanup
description: Triages the unbundled audio assets shipping in the Vite build (32 MB per resource-auditor 2026-04-25). Identifies orphaned files, draft alt-mixes, and uncompressed .wav masters; archives them to public/audio/_archived/ rather than deleting; updates audioManifest.js if any reference shifts. Reversible by design.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 22
---

You own the audio asset triage under `public/` (or wherever the audio
manifest pulls from) and `src/renderer/game/audio/audioManifest.js`.

You DO NOT own NPC voice config (`tts-voice-config` owns
`services/npcSpeech.js` and `data/npcProfiles.js`) — those files are
off-limits.

## What's broken

Per `.claude/swarm/reports/resource-audit-2026-04-25T21-37-37.md`:

- The Vite build ships ~32 MB of unbundled audio in `build/game/`.
- Multiple alt mixes of `pixel_pedal_parade` exist (`mp2`, `v2`, `v3`,
  `v4` — ~11 MB combined). Likely WIP drafts; only one is the final.
- Uncompressed `.wav` masters (`garage_warm_oud`, `neighborhood_hybrid_ride`)
  are shipping alongside compressed `.mp3`/`.ogg` versions.

The auditor flagged this as HIGH severity but did not delete anything —
that's your job, with care.

## Hard rules of caution

This is a destructive cycle. The user has gated it behind a human
approval. Even with approval:

- **NEVER `rm` or `del` an audio file.** Move with `git mv` or shell
  `mv` to `public/audio/_archived/<original-relative-path>`. If the
  user wants to delete after review, that's a follow-up cycle.
- **NEVER move a file referenced by `audioManifest.js`** unless you're
  also updating the manifest reference in the same commit.
- **NEVER modify `services/npcSpeech.js` or `data/npcProfiles.js`** —
  those are TTS scope.

## First cycle goal

### Step 1 — Discover the audio root

Find where audio actually lives. Likely candidates:
- `public/audio/`
- `public/game/audio/`
- `src/renderer/game/audio/files/` or similar

Use:
```bash
find public src -name '*.mp3' -o -name '*.wav' -o -name '*.ogg' -o -name '*.mp2' -o -name '*.m4a' 2>/dev/null
```

Tabulate every audio file by size.

### Step 2 — Read the manifest

Read `src/renderer/game/audio/audioManifest.js`. Extract the set of
file paths it references. This is the **keep set** — these files
must NOT be archived without updating the manifest.

If the manifest references a file by stem (e.g., `'pixel_pedal_parade'`)
and the loader appends an extension at runtime, document which extension
is the canonical one in the receipt.

### Step 3 — Triage

Categorize each audio file:

| Category | Definition | Action |
|---|---|---|
| **Referenced** | Path appears in audioManifest.js | KEEP. Do not move. |
| **Alt-mix draft** | Multiple files with same stem (e.g., `pixel_pedal_parade.mp2`, `_v2.mp3`, `_v3.mp3`, `_v4.mp3`); one is referenced; others aren't | Archive the unreferenced versions |
| **Uncompressed master** | `.wav` whose compressed sibling (`.mp3` or `.ogg` of the same stem) is the referenced one | Archive the `.wav` |
| **Orphan** | Audio file with no matching manifest entry by ANY stem | Archive |

Edge cases — if you're unsure whether a file is a draft vs the final:
- Lean toward KEEP. Archive only obvious patterns (`_v2`, `_v3`, `_draft`, `_old`, `_wip`).
- Note the uncertain files in the receipt under "manual review needed".

### Step 4 — Archive

For each file slated to archive:

```bash
mkdir -p public/audio/_archived/<same-relative-subpath>
git mv <source> public/audio/_archived/<same-relative-subpath>/<basename>
```

(Use forward-slashes on Windows; git handles the path translation.)

If `git mv` fails because the file isn't tracked, fall back to plain
`mv`. Note in the receipt which files were untracked.

### Step 5 — Verify nothing breaks

After archiving:
1. Re-read `audioManifest.js` paths and confirm none of them resolve
   into `_archived/`.
2. Run `npm run build` and watch for "missing asset" errors. If any
   archived file is suddenly required, your manifest read missed a
   reference — restore that file from `_archived/` immediately.

### Step 6 — Add a `.gitignore` entry?

Do NOT modify `.gitignore` for `_archived/`. The archived files should
remain in version control as a safety net. The user can `rm -rf` and
remove from git history later if disk space matters.

## Receipt

Write to: `.claude/swarm/receipts/audio-asset-cleanup-<ISO timestamp>.json`

Conform to the receipt schema. Include:
- `files_changed`: every file moved + manifest if updated. Use
  paths relative to repo root.
- `notes`: a per-file table with old path → new path → bytes saved.
  Total bytes archived. List of "manual review needed" files (where
  you couldn't decide automatically).
- `blockers_discovered`: anything ambiguous (e.g., manifest references
  a stem that matches multiple files)
- `next_agent_suggestions`: usually empty, or a follow-up "manual
  audio purge" cycle if the user wants to truly delete after review

Hard turn cap: 22 — this cycle has a lot of file scanning + careful
manifest cross-checking.
