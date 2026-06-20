# Pre-Render Audio Pipeline (Executive Brain) — Step 6

**Design only — do not implement.** Assumes Act 1 succeeds and moves to a shipped,
pre-rendered voice track. Goal: turn authored dialogue into baked audio assets the
game plays directly, replacing runtime synthesis.

## Pipeline
```
Dialogue source (act1Dialogue.js, act1NotebookEntries.js, CrossingScene BEATS)
        ↓  extract: { lineId, speaker→voiceId, text, language }
Voice assignment (CHARACTER_VOICES / production voice map)
        ↓
Generation (offline; ElevenLabs/Azure for prod, XTTS for dev preview)
        ↓
Review (human listen-pass against voice_direction_bible.md; re-gen rejects)
        ↓
Asset storage (versioned audio under a content hash)
        ↓
Runtime playback (Act1AudioSystem: prefer baked asset → XTTS server → browser TTS)
```

## Stable line IDs (the linchpin)
Every spoken line needs a **stable id** so audio can be matched and re-baked
incrementally. Derive `lineId` from `dialogueId + index` (e.g. `dex_intro.02`); beats
from `scene + beatIndex` (e.g. `crossing.08`). Store the **source-text hash** beside
each asset so a changed line is detected and re-generated automatically; unchanged
lines are never re-billed.

## File structure
```
public/audio/voice/
  <lang>/                         # en, es, ar
    <voiceId>/                    # zuzu, dex, garage_mentor, ...
      <lineId>.<hash8>.ogg        # e.g. dex/dex_intro.02.9f3a1c7b.ogg
  manifest.voice.json             # lineId → { path, voiceId, lang, hash, duration }
```
- **Format:** OGG/Opus (small, broadly supported); WAV only as the generation master.
- **Master archive** (un-shipped): keep generation WAVs + the request params
  (engine, voice, settings, seed) for exact reproducibility.

## Naming conventions
- `voiceId` = the runtime `NPCVoiceRegistry` id (NOT display name) — matches what the
  engine already requests.
- `lineId` = `<dialogueId>.<zeroPaddedIndex>` / `<scene>.<beatIndex>`; lowercase,
  dot-separated; never reuse an id for different text.
- `hash8` = first 8 hex of sha256(normalized source text) — busts stale audio.

## Localization strategy
- Audio is foldered by language; the **manifest** keys by `lineId+lang`.
- One **actor/voice per character across languages** (Ramirez en+es = same voice id
  family; Mariam ar). Missing-language assets fall back: baked `<lang>` → baked `en`
  → XTTS → browser TTS, so a partially-localized build still plays.
- Subtitles/meaning always rendered regardless of audio language (already the policy).

## Update workflow
1. Author edits a line → its text hash changes.
2. A **bake script** (offline) diffs source vs `manifest.voice.json`, regenerates only
   changed/new `lineId`s, writes new `<hash8>` assets, prunes orphans, updates manifest.
3. Human review listens to the **diff set** only (not the whole game).
4. Commit assets + manifest together; the runtime picks them up by manifest lookup.

## Runtime change (minimal, future)
`Act1AudioSystem.speakLine` gains a first tier: **if `manifest.voice.json` has
`(lineId, lang)` → play that asset**; else current behavior (XTTS server → browser).
This requires lines to carry a `lineId` at call time — a small, additive change, **not
part of this mission**.

## Out of scope / deferred
- No implementation now. No id-threading into dialogue calls now. No engine purchase.
- Revisit only **after** Act 1 playtest validates the experience is worth baking.
