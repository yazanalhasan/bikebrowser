# Legacy Voice Audit (Phase 2)

Tree: `src/renderer/game/` (route `/legacy-play`, ~53k LOC). Evidence `file:line`.
Question per system: exists? functional? wired? unused? educational?

## Summary verdict
The legacy tree contains a **complete, genuinely-implemented heritage-language
learning system — that is almost entirely ORPHANED** (real code, never invoked
by any scene or by `GameContainer.jsx`). The only voice that actually plays is
English browser TTS of NPC dialogue (`npcSpeech.js`), plus music + procedural
SFX (`AudioManager.js`).

## Inventory

| System | Path | ~LOC | Functional? | Wired? | Audio? |
|---|---|---|---|---|---|
| audioLanguageSystem | `systems/audioLanguageSystem.js` | 301 | yes (real TTS + mic) | **ORPHANED** | TTS if called |
| languageCoachAssistant | `systems/languageCoachAssistant.js` | 339 | yes | **ORPHANED** | TTS if called |
| languageProgressionSystem | `systems/languageProgressionSystem.js` | 318 | yes (pure fns) | imported but **never driven** | no |
| npcLanguageSystem | `systems/npcLanguageSystem.js` | 339 | yes | **ORPHANED** | no |
| gameAI (reinforceLanguage) | `systems/gameAI.js` | — | yes | **ORPHANED** | no |
| phraseBuilder | `systems/phraseBuilder.js` | 230 | yes | **ORPHANED** | no |
| dialogueDifficulty | `systems/dialogueDifficulty.js` | 118 | yes | **WIRED** | no |
| **npcSpeech** | `services/npcSpeech.js` | 319 | yes | **WIRED+ACTIVE** | **English TTS** |
| npcAiClient | `services/npcAiClient.js` | 222 | yes | **WIRED** | no |
| **AudioManager** | `audio/AudioManager.js` | 586 | yes | **WIRED+ACTIVE** | **music+SFX** |
| proceduralAudio | `audio/proceduralAudio.js` | 490 | yes | WIRED (via AudioManager) | **synth SFX** |
| audioManifest | `audio/audioManifest.js` | 456 | data | WIRED | refs real files |
| data/languages | `data/languages.js` | 335 | **169 vocab, 6 regions** | imported, mostly undriven | no |
| data/languageQuests | `data/languageQuests.js` | 379 | data | **ORPHANED** | no |

There is **no `class DialogueSystem`** in legacy; dialogue = `npcAiClient` +
templates + `dialogueDifficulty`.

## What exists / is functional
- **Real heritage-language learning engine:** 6-stage mastery, evidence-weighted
  XP, spaced repetition, 5-rank region unlocks (`languageProgressionSystem.js:31,
  54,122,199,214`). Pure, serializable, correct.
- **Pronunciation practice:** mic capture via `getUserMedia`+`MediaRecorder`,
  syllable-by-syllable TTS, honest duration-based scoring (explicitly "not a fake
  accent grader") (`audioLanguageSystem.js:65,94,174-233`). 7 languages
  (ar/qu/sw/tr/ku/fa/zh).
- **NPC trust gated on correct local-language use** + dialogue adaptation to
  rank/mastery (`npcLanguageSystem.js:111,137,162`).
- **AI language coach** with 8 coaching message types + term TTS
  (`languageCoachAssistant.js:28,293`).
- **169 vocabulary terms across 6 regions** (`data/languages.js`).

## What is wired (actually runs)
- `npcSpeech.js` → live **English** TTS of NPC dialogue, auto-spoken on dialog
  events (`GameContainer.jsx:34,863,881`), gated by `speechEnabled`/`autoSpeak`
  settings. **English-only** (`utterance.lang='en-US'` `npcSpeech.js:202`) — it
  speaks dialogue text, **not** the localized vocabulary.
- `AudioManager.js` + `proceduralAudio.js` → music (29 prerecorded files in
  `public/game/audio/`) + procedurally-synthesized SFX.
- `npcAiClient.js` + `dialogueDifficulty.js` → adaptive dialogue text.

## What is unused
- The entire language-learning cluster (audioLanguageSystem, languageCoach,
  languageProgression, npcLanguage, gameAI, phraseBuilder, languageQuests) — real
  but **not imported/invoked by any scene or main**. Implementation-complete,
  unreachable.

## Educational features (present, mostly unwired)
Vocabulary mastery + spaced repetition + pronunciation practice with mic +
trust-via-language + AI coaching. **None of the localized-vocabulary learning
layer is reachable at runtime**; only English dialogue TTS + dialogue-difficulty
banding actually run.

## Audio assets (legacy)
- **0** `.mp3/.ogg/.wav` under `src/renderer/`. SFX is procedurally synthesized.
- 29 prerecorded music/stinger files under `public/game/audio/` (e.g.
  `music/garage_warm_oud.ogg`, `stingers/reward_tarabi_stinger.ogg`), streamed by
  AudioManager.

## Reuse implication
The legacy **language-learning design + data (169 terms, 6 regions, mastery,
pronunciation, trust-via-language)** is the single highest-value voice asset in
either repo — and it is **orphaned, not lost**. A local multilingual TTS engine
(see `voice_architecture_recommendation.md`) is exactly what would let this
heritage-language layer finally be *heard* (browser TTS couldn't reliably voice
ar/qu/sw/ku/fa). Preserve per the Legacy Preservation Registry; rewire, don't
rebuild.
