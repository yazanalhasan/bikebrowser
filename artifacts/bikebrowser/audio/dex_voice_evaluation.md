# Dex Voice Evaluation (Executive Brain) — Step 3

## 1. Verify: did Dex fall back to browser TTS?
**Yes — confirmed.** `Act1AudioSystem.speakLine` sends `?voice=dex` to the XTTS
server. `brain/voice/config.py:resolve_character('dex')` was not in
`CHARACTER_VOICES` (`{narrator, mr_chen, mrs_ramirez, trader}`) → `KeyError` → the
server returns an HTTP error → the game falls back to **browser Web Speech** for
that line. The "bratty" pitch 1.34 / rate 1.16 only ever applied on that fallback.

## 2. Why
Not a Dex-specific bug — a **cast-wide mapping gap**. `CHARACTER_VOICES` was keyed by
*legacy npc ids* (`mr_chen`) while the runtime sends *voiceIds* (`garage_mentor`,
`dex`, `zuzu`, …). Only `narrator` and `trader` happened to match. So Dex — and Zuzu,
Mr. Chen, Mrs. Ramirez, and Mariam — all silently used browser TTS.

## 3. Fix
`brain/voice/config.py` re-keyed to the runtime voiceIds, with `dex` mapped to a
dedicated studio speaker. Verified: `resolve_character('dex')` now returns a speaker
(no KeyError); all nine runtime voiceIds resolve.

## 4. Candidate voices (XTTS v2 built-in studio speakers)
**Hard caveat:** this environment has **no GPU/audio**, so these are evaluated on the
speakers' known character/timbre reputation, not by listening. **Every candidate must
be auditioned on the GPU box** (`python -m brain.voice say dex "<line>" -o dex_x.wav`)
before being locked. Audition lines below.

| Candidate | Strengths | Weaknesses | Fit (／10) |
|---|---|---|---|
| **Andrew Chipper** *(recommended)* | Youthful, upbeat, energetic timbre — reads as a kid, not an adult; natural fast cadence; range to drop into sincerity for the heart beat | Could tip "too sunny" if not directed brash; confirm it doesn't sound *younger* than Zuzu | **8.5** |
| Craig Gutsy | Brash, confident, punchy — strong "just send it" energy | **Already assigned to `trader`** (re-use blurs cast distinctness); reads a touch older/adult | 7.0 |
| Dionisio Schuyler | Animated, expressive, good dynamic range for cocky→caught-out | May read older/theatrical; risk of "cartoonish" (a Dex must-NOT) | 6.5 |
| Damien Black | Edgy, attitude to spare | Too dark/adult/"villainous" — violates Dex's must-NOT (never mean/villain) | 4.0 |

## 5. Recommendation
**Primary: `Andrew Chipper`** — best balance of *youthful + energetic + brash* with
the range to crack into sincerity, and it keeps Dex distinct from `trader`.
**Alternates (in order): Craig Gutsy → Dionisio Schuyler.** Mapped `dex → Andrew
Chipper` in `config.py` (provisional).

Optional upgrade path: **clone** a bratty kid read via `speaker_wav` (a short,
rights-cleared reference clip) for a bespoke Dex — strongest identity, but needs a
source clip and a licensing check; defer unless the built-in audition disappoints.

## 6. Audition protocol (on the GPU box)
Run each candidate on a **cocky** line and a **soft** line; pick the speaker that
nails *both* (a Dex who can only do brash fails the arc):
- Cocky: *"Pssh. It's a bridge. Anybody coulda done it."*
- Soft (the crack): *"...okay. Okay, it held. Every plank. I watched all of them."*
- Tag: *"...Teach me to do it your way sometime. The boring way that actually works. Brain."*

```
python -m brain.voice say dex   "Pssh. It's a bridge. Anybody coulda done it." -o dex_chipper_cocky.wav
# then temporarily set dex -> "Craig Gutsy" / "Dionisio Schuyler" and repeat to compare
```
Score each on: youthful? brash-not-mean? can it go sincere? distinct from Zuzu &
trader? Lock the winner; record it in decision_log.md and update this file's verdict.
