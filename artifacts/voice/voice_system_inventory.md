# Voice System Inventory (Phase 1)

Repository-wide inventory of voice/speech/narration/audio/TTS/language-learning
infrastructure across **BikeBrowser** (`C:/dev/bikebrowser`) and **Executive
Brain** (`C:/Users/admin/Documents/executive-brain`). Evidence-based; cited
`file:line`. Reality > assumptions.

## Headline
- **All speech in both repos is browser-native Web Speech API**
  (`window.speechSynthesis`). There is **no neural/local TTS engine, no voice
  model weights, no TTS npm/pip dependency** anywhere.
- Searches for `piper / kokoro / coqui / xtts / f5-tts / e2-tts / bark /
  tortoise / styletts` → **zero code/dependency hits** in either repo.
- **Executive Brain has no voice runtime code** — MiniMax voice is a paid,
  `plan_only`, no-adapter governance stub.
- **The machine is exceptionally capable and idle:** 2× RTX 5090 (32 GB each),
  torch 2.8.0+cu129 (CUDA ✓, 2 devices), openai-whisper installed. The gap is
  software-not-installed + not-wired, **not** hardware.

## Inventory by category

### Code — speech/voice (browser TTS)
| File:line | Repo/tree | What |
|---|---|---|
| `src/game/phaser/audio/Act1AudioSystem.js:148-221` | BB rebuild | `speechSynthesis` TTS orchestrator; `speakLine`/`autoSpeakLine` |
| `src/game/phaser/audio/NPCVoiceRegistry.js` | BB rebuild | 7 NPC voice profiles (rate/pitch/lang/gender) |
| `src/game/phaser/audio/SpeechNormalizationSystem.js` | BB rebuild | pre-TTS text normalization (pH, CO2, UTM, fractions) |
| `src/game/phaser/audio/MusicSystem.js:71-81` | BB rebuild | real `<Audio>` music playback (6 states) |
| `src/renderer/game/services/npcSpeech.js:36-292` | BB legacy | wired+active `speechSynthesis` NPC TTS service |
| `src/renderer/game/systems/audioLanguageSystem.js:41-209` | BB legacy | vocab TTS + syllable playback + mic capture (ORPHANED) |
| `src/renderer/game/audio/AudioManager.js:36-586` | BB legacy | Web Audio engine: buses, crossfade, ducking, procedural SFX |
| `src/renderer/spellingTrainer/SpellingTrainerApp.jsx:463-503` | BB | standalone `speechSynthesis` spelling practice |
| `BikeBrowserWorld/Core/AudioService/AudioService.gd:739-950` | BB Godot | native Godot `DisplayServer` TTS + embedded Web speechSynthesis |

### Code — language learning (legacy, orphaned)
| File:line | What | Wired? |
|---|---|---|
| `src/renderer/game/systems/languageProgressionSystem.js` | 6-stage mastery, XP, spaced repetition | orphaned |
| `src/renderer/game/systems/npcLanguageSystem.js` | trust + dialogue adaptation by language rank | orphaned |
| `src/renderer/game/systems/languageCoachAssistant.js` | AI language coach + term TTS | orphaned |
| `src/renderer/game/data/languages.js` | **169 vocab terms, 6 regions** | partly imported, undriven |

### Config / workload routing
| File:line | What |
|---|---|
| `src/server/ai/workloadClasses.js:221-227` | `speech_synthesis` workload → `BROWSER_PLATFORM`, 100ms budget |
| `src/server/ai/capabilityDetector.js:263` | `speechSynthesis: 'browser-platform'` |
| `BikeBrowserWorld/Data/audio/voice_profiles.json` | per-NPC pitch/rate/voiceHint profiles (Godot) |

### Environment variables (NAMES only — values redacted)
| Repo | Voice/audio/provider keys |
|---|---|
| EB `.env` | `MINIMAX_API_KEY` (present), `LANGSMITH_API_KEY`, `MESHY_API_KEY` (no ANTHROPIC/OPENAI key — Claude via CLI auth) |
| BB `.env` | `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `THAURA_API_KEY`, `MESHY_API_KEY` (none audio-specific) |

### Docker services
- **None** audio/TTS-related in either repo. EB `docker/` = Postgres/pgvector only.

### Local models (weights)
- **None.** `find` for `.onnx/.pt/.gguf/.safetensors` → zero voice models (only V8/Godot `.bin` caches).

### APIs
| Provider | Where | Status |
|---|---|---|
| MiniMax (audio) | EB `brain/integrations/api_registry.py:36` | paid; `audio_generation`; **no adapter** |
| MiniMax-audio service | EB `memory/environment/app_control_registry.yaml:488-500` | **stubbed/blocked** |
| Browser SpeechSynthesis | both game trees | free, runtime, **the only working voice** |

### Executors (EB)
- `brain/executors/registry.py:17-24` → `codex, claude, openclaw, playwright, validator, local_stub`. **No voice/audio/tts/minimax executor.**

### Procedural memory / playbooks / workflows (EB)
| File | What |
|---|---|
| `memory/procedural/executive_privileges.yaml:436-510` | 5 `minimax_*` privileges (voice/audio/music/video/animation), all `plan_only`, paid |
| `memory/procedural/capabilities/minimax.yaml:5,48` | `executor_id: null`; "adapter not_yet_implemented at runtime" |
| `memory/procedural/tool_playbooks/minimax_voice.md` | voice/TTS playbook (design); "runtime TTS stays in `audioLanguageSystem.js`" |
| `memory/procedural/creative_pipeline_policy.yaml:25-69` | MiniMax = motion/audio refs; cultural-voice human gate |
| **No** voice *workflow* | — | no generate/cache/assign/validate voice workflow exists |

### Tests
| File | What |
|---|---|
| `tests/e2e/game-rebuild.audio.spec.js` | TTS substrate: speech normalization, distinct NPC voices, no-overlap |
| `BikeBrowserWorld/tests/voice_identity_profile_check.gd` | Godot voice-id resolution + speak assertions |

### Local inference stack (machine)
| Component | Status |
|---|---|
| 2× RTX 5090 32 GB | present, GPU1 idle (31.7 GB free) |
| torch 2.8.0+cu129 | installed, CUDA ✓, 2 devices |
| openai-whisper 20250625 | **installed** (STT) |
| librosa 0.10.2 / soundfile 0.12.1 / ffmpeg | **installed** (audio analysis) |
| onnxruntime 1.23.2 | installed (CPU/Azure providers; no CUDA EP) |
| ollama | installed binary, **not running** |
| Piper/Coqui/XTTS/F5/E2/Bark/Kokoro/StyleTTS/Tortoise | **none installed** |

See `local_voice_capability_report.md` for the full machine audit and
`voice_gap_analysis.md` for the synthesis.
