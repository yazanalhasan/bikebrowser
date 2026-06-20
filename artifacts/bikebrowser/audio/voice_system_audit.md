# BikeBrowser Voice System Audit (Executive Brain)

Master index + executive summary for the Voice and Audio Identity mission
(2026-06-20). Scope: voice **identity, consistency, production readiness**. No new
gameplay, quests, or Act 2 work. Act 1 scope freeze respected — every change here
is audio identity (data/config/docs), reversible, and gameplay-neutral.

## Documents in this set
| File | Step | Purpose |
|---|---|---|
| [audio_pipeline_audit.md](audio_pipeline_audit.md) | 1 | How voice works today: runtime path, XTTS path, failure paths |
| [voice_direction_bible.md](voice_direction_bible.md) | 2 | Per-character voice identity (must/must-not) |
| [dex_voice_evaluation.md](dex_voice_evaluation.md) | 3 | Why Dex fell back to browser TTS; candidate voices; recommendation |
| [voice_consistency_review.md](voice_consistency_review.md) | 4 | Voice-vs-character across key scenes |
| [production_voice_strategy.md](production_voice_strategy.md) | 5 | Dev vs shipping engine strategy (XTTS / Azure / ElevenLabs) |
| [pre_render_pipeline.md](pre_render_pipeline.md) | 6 | Design (not impl) of a baked-audio pipeline |
| [voice_memorability_assessment.md](voice_memorability_assessment.md) | 7 | "What will a player remember each voice sounded like?" |
| [voice_playtest_questions.md](voice_playtest_questions.md) | 8 | Voice-specific playtest questions |

## The single most important finding
The game's audio system prefers a **local XTTS v2 server** (`/inspect/tts`) and
falls back to **browser Web Speech**. But `brain/voice/config.py:resolve_character`
only knew four keys — `narrator, mr_chen, mrs_ramirez, trader`. The game sends the
**runtime voiceId** (`zuzu`, `dex`, `garage_mentor`, `neighbor`, `arabic_mentor`,
`spanish_neighbor`, `ecology_sign`). Result: **only `narrator` and `trader`
resolved on XTTS; the entire main cast — Zuzu, Dex, Mr. Chen, Mrs. Ramirez, Auntie
Mariam — silently fell back to browser TTS.** Dex was simply the most noticeable
symptom of a cast-wide mapping gap.

**Fixed this turn** (`brain/voice/config.py`): the map is now keyed by the
voiceIds the game actually sends, so all five leads resolve to a studio speaker.
The newly-assigned speakers are **provisional pending an audition** on the GPU box.

## Final report — the four required answers

**1. What voices should each character use?** (provisional; audition to confirm)
| Character | voiceId | XTTS studio speaker | Status |
|---|---|---|---|
| Narrator | `narrator` | Royston Min | unchanged (worked) |
| Zuzu | `zuzu` | Daisy Studious | NEW mapping |
| Dex | `dex` | **Andrew Chipper** | NEW — recommended; alts Craig Gutsy / Dionisio Schuyler |
| Mr. Chen | `garage_mentor` | Kazuhiko Atallah | now reachable (was mismapped) |
| Mrs. Ramirez | `neighbor` / `spanish_neighbor` | Ana Florence | now reachable |
| Auntie Mariam | `arabic_mentor` | Suad Qasim | NEW mapping (Arabic) |

**2. Is XTTS sufficient for Act 1 playtesting?** **Yes.** It is local, free, expressive,
already wired, and now covers the whole cast. The only blockers were the mapping gap
(fixed) and a GPU/server dependency (acceptable for an internal playtest). It is the
right engine for the playtest milestone.

**3. What should be used for production?** **Pre-rendered audio assets baked offline
from a commercially-licensed neural engine** (recommended: ElevenLabs for
expressiveness, or Azure Neural TTS for child/teen voices + license simplicity).
XTTS-v2 weights are **CPML — non-commercial (`commercial_use: RESTRICTED`)**, so XTTS
is a **dev/playtest tool only**, not a shipping engine. Pre-rendering also removes the
runtime GPU dependency, guarantees deterministic quality, and keeps a child product
offline (no per-play network calls). See production_voice_strategy.md.

**4. Highest-impact next audio improvement?** **The cast mapping fix shipped this turn**
(five leads went from robotic browser-fallback to distinct neural voices in one config
edit). The next-highest is a **15-minute Dex audition** on the GPU box to lock the
recommended speaker, followed by the same audition for Zuzu and Mariam.

## Known risks
- **Cannot audition here.** This environment has no GPU/audio; all new speaker picks
  are reputational/characteristic-based and **must be heard before final**.
- **EB inspector not in this repo.** The `/inspect/tts` handler lives in
  executive-brain; I verified `brain/voice/config.py` resolves the cast, but the
  inspector→`synthesize` wiring (does it pass `voice` straight to `character`?) must be
  confirmed against the running server.
- **Two copies of `brain/voice/`.** If the live EB imports executive-brain's copy
  rather than this repo's, the mapping fix must be synced there too.
- **XTTS licensing** blocks commercial shipping — production must move off XTTS.
