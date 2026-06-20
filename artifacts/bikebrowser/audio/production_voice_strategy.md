# Production Voice Strategy (Executive Brain) — Step 5

Dev vs shipping. The governing facts: BikeBrowser dialogue is **fixed and authored**
(not user-generated), the audience is **children**, and **XTTS-v2 weights are CPML —
non-commercial** (`commercial_use: RESTRICTED`, stated in `brain/voice/config.py`).

## Development (now → playtest)
**Use XTTS v2, local.** It is:
- free (local GPU; `approval_required: False`),
- expressive (studio-grade neural), multilingual (Arabic/Spanish),
- already wired (`/inspect/tts`) and now mapped for the whole cast,
- fast to iterate — change a speaker in `CHARACTER_VOICES`, re-run, hear it.

Use it for fast iteration, auditioning speakers, and the Act 1 playtest. **Do not
ship its output** — see licensing.

## Production (if Act 1 succeeds)
**Pre-render every line offline with a commercially-licensed neural engine and ship
the audio as game assets** (design in `pre_render_pipeline.md`). Rationale: removes the
runtime GPU dependency, deterministic quality, works offline, and — for a kids'
product — **no per-play network calls / no child data egress** (you send only authored
script text at build time).

### Engine comparison (for the pre-render step)
| Engine | Quality / expressiveness | Licensing for a shipped kids' game | Workflow | Reproducibility | Cost model |
|---|---|---|---|---|---|
| **XTTS v2 (local)** | High, very expressive, cloning | ❌ **non-commercial (CPML)** — dev only | CLI, instant, free | High (fixed seed/speaker) | Free (GPU) |
| **ElevenLabs** | **Best** character expressiveness; style/stability controls; strong young/brash voices | ✅ Commercial tiers; check child-content + voice-usage terms | API; great for baking; voice library | High (fixed voice + settings) | Paid per character |
| **Azure Neural TTS** | High; **has child/teen voices**; `<mstts:express-as>` styles (cheerful/angry/…) | ✅ Commercial; enterprise-clear terms | SSML API; batch synthesis | High | Paid per character |
| **Amazon Polly (Neural)** | Good; fewer character/child voices | ✅ Commercial | SSML API; batch | High | Paid per character |
| **OpenAI TTS** | Good, natural; limited named-character control | ✅ Commercial | API | Medium (fewer locked voices) | Paid per character |
| **Piper (local)** | Modest; many voices; low expressiveness | ✅ Permissive (MIT-ish) | Local CLI; free | High | Free |

### Recommendation
- **Primary: ElevenLabs** for the leads — best at the bratty/sincere range Dex needs
  and the warmth Chen/Mariam need; lock a voice + settings per character for
  reproducibility.
- **Strong alternative: Azure Neural** if you want first-class **child/teen voices**
  and SSML style control with the simplest enterprise licensing — a natural fit for
  Zuzu/Dex specifically.
- **Free fallback if budget is zero: Piper**, pre-rendered — permissive license, ships
  fine, at the cost of expressiveness (acceptable for narrator/signage, weak for Dex's
  arc).
- **Never ship XTTS output** (license). Keep XTTS as the **dev/audition** engine.

### Cost note (no spend now)
This document is strategy only. ElevenLabs/Azure require an API key and are **paid** —
**no purchase is being made**; a spend decision and key provisioning is a separate,
explicitly-approved step. Per-line cost is bounded because the script is finite and
baked **once** (not per play), so production TTS spend is a small, one-time-per-revision
cost, not a recurring runtime cost.

## Decision
- **Act 1 playtest:** XTTS v2 (local, free, now cast-complete). **Sufficient — ship the
  playtest on it.**
- **Production:** pre-rendered ElevenLabs (or Azure for child voices); Piper as the
  zero-budget fallback; Web Speech retained only as the in-engine safety net.
