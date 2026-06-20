# Audio Pipeline Audit (Executive Brain) — Step 1

Exactly how voice works in BikeBrowser today, traced from code
(`src/game/phaser/audio/Act1AudioSystem.js`, `NPCVoiceRegistry.js`,
`brain/voice/`).

## Two-path architecture
`speakLine(text, voiceId, opts)` resolves a profile from `NPCVoiceRegistry`,
normalizes the text, then chooses a path:

```
speakLine
  ├─ serverEligible (useServerVoice && !serverVoiceDown && fetch) ──► speakViaServer  [PRIMARY]
  │        GET {ttsBase}/inspect/tts?text=..&voice=<voiceId>&language=..
  │        → WAV blob → HTMLAudioElement.play()   (engine: local XTTS v2)
  │        on HTTP error  → _speakViaBrowser (this line only)
  │        on network/CORS → serverVoiceDown=true → _speakViaBrowser (from now on)
  └─ else ──────────────────────────────────────────────────────────► _speakViaBrowser [FALLBACK]
           SpeechSynthesisUtterance(rate, pitch, lang, picked voice)
```

`ttsBase` defaults to `http://localhost:8000`, overridable via
`window.__BIKEBROWSER_TTS_BASE__`. Results cached per `voiceId|language|text` as
object URLs (`_ttsBlobCache`).

## Runtime path — Browser Web Speech (fallback)
- **Engine:** the browser's `speechSynthesis` (OS/browser-provided voices).
- **Which characters use it:** in practice, **everyone whose voiceId did not
  resolve on XTTS** — which, before this turn's fix, was the whole main cast
  (Zuzu, Dex, Mr. Chen, Mrs. Ramirez, Mariam). Also anyone, any time the EB
  server is unreachable (`serverVoiceDown`).
- **Controls used:** `utterance.rate = (opts.rate||profile.rate) * settings.speechRate`,
  `utterance.pitch = opts.pitch||profile.pitch`, `utterance.lang`, and a heuristic
  `pickBrowserVoice()` that matches by language prefix → profile `voiceHints` →
  gender hints → "natural" → first available.
- **Limitations:**
  - **Only pitch + rate are expressive knobs.** No emotion, emphasis, or style.
    Dex's "bratty" tuning (pitch 1.34 / rate 1.16) lives *only* here.
  - **Voice availability is non-deterministic** — depends on the user's OS/browser.
    A voice present on one machine is absent on another; headless Chromium has
    *no* voices at all (the known audio-spec failure).
  - **`gender: 'default'` profiles get no voice pick** (`pickBrowserVoice` returns
    null) → the OS default voice, so Zuzu and Dex (both `default`) are at the
    mercy of whatever default the browser ships.
  - Robotic timbre; not viable as the *intended* character voice — only a safety net.

## XTTS path — local neural server (primary)
- **Engine:** **Coqui XTTS v2** (`tts_models/multilingual/multi-dataset/xtts_v2`),
  not Piper despite a stale code comment. Runs in an isolated venv
  (`C:\AI\XTTS\.venv`) shelled out from `brain/voice/synthesize.py` → `_xtts_worker.py`.
- **Voice selection:** `synthesize()` takes exactly one of `character` (mapped via
  `CHARACTER_VOICES`), `speaker` (any studio speaker by name), or `speaker_wav`
  (clone from a reference clip). The server passes the request's `voice` as the
  `character`.
- **Speakers mapped (after this turn's fix):** narrator→Royston Min, zuzu→Daisy
  Studious*, dex→Andrew Chipper*, garage_mentor→Kazuhiko Atallah,
  neighbor/spanish_neighbor→Ana Florence, arabic_mentor→Suad Qasim*,
  ecology_sign→Royston Min, trader→Craig Gutsy. (* = provisional, audition pending.)
- **Quality level:** studio-grade neural TTS — expressive prosody, real timbre,
  multilingual (incl. Arabic for Mariam, Spanish for Ramirez). Far above Web Speech.
- **Latency:** synthesis is GPU work (single-flight, `max_concurrent=1`,
  ~2.1 GB VRAM peak, pinned GPU 1). First utterance of a unique
  `voice|language|text` incurs synthesis latency; repeats are served from the blob
  cache instantly. Not real-time-cheap, which is another argument for pre-rendering
  fixed dialogue (Step 6).
- **Hardware required:** an NVIDIA GPU with ≥3 GB free VRAM and the EB server
  running. No GPU/server ⇒ the path is simply never eligible and the game uses
  browser TTS.

## Pre-this-turn mapping defect (root cause)
`resolve_character` raised `KeyError` for any voiceId not in
`{narrator, mr_chen, mrs_ramirez, trader}`. The game sends `garage_mentor`,
`neighbor`, `arabic_mentor`, `zuzu`, `dex`, … so:
- `narrator`, `trader` → resolved → XTTS.
- `mr_chen`/`mrs_ramirez` were *in* the map but the game never sends those exact
  strings (it sends `garage_mentor`/`neighbor`) → KeyError → fallback.
- `zuzu`, `dex`, `arabic_mentor`, `spanish_neighbor`, `ecology_sign` → unmapped →
  KeyError → fallback.

Net: the **entire emotional cast was on browser TTS**, which is why voices felt
generic. Fixed by re-keying `CHARACTER_VOICES` to the runtime voiceIds.

## Failure paths (verified from code)
| Failure | Behavior |
|---|---|
| XTTS HTTP error (e.g. CARE-gated / unmapped voice) | per-line fallback to browser TTS; server stays "up" |
| XTTS network/CORS error (server down/unreachable) | `serverVoiceDown=true`; **all** subsequent lines use browser TTS for the session |
| Browser voice unavailable (`speechAvailable=false`) and server down | `speech_unavailable`; line is **skipped silently** (no audio), subtitles/text still shown |
| `speechEnabled=false` (M / reducedAudio) | `speech_skipped`; no audio by design; R replays last line |
| Empty/normalized-to-empty text | `speech_skipped` reason `empty` |

**Resilience verdict:** graceful — the game never errors or blocks on audio; worst
case is silent-with-text. But "graceful degradation" was masking the mapping defect:
the cast *sounded* fine-ish (browser voices exist on dev machines) so nobody noticed
they were never reaching XTTS at all.
