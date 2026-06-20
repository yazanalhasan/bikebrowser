# Voice Consistency Review (Executive Brain) — Step 4

Does each delivered voice match the character through the key scenes? Reviewed
against `voice_direction_bible.md`. **Context:** until this turn's mapping fix, every
line below was rendered on **browser TTS** (robotic, pitch/rate only), so the
"current" column reflects the *fallback* reality, and "after fix" reflects XTTS with
the mapped speaker (provisional, audition pending).

| Scene | Speaker(s) | Direction target | Current (browser fallback) | After XTTS fix | Action |
|---|---|---|---|---|---|
| **Community Crossing** | Ramirez, Mariam, Dex, (Chen silent), Zuzu | warm relief; gentle wisdom; Dex's crack; wordless pride; Zuzu's payoff line | All robotic; Dex's "armor crack" lost (pitch-only); Mariam's Arabic warmth absent; the emotional climax under-served by voice | Distinct neural voices; Dex can go sincere; Mariam in warm Arabic; Zuzu's reflection lands | Audition Dex soft beat + Mariam Arabic specifically here |
| **Dex rivalry** (`dex_intro`, taunts) | Dex | fast, brash, never mean | Higher/faster but flat — "brash" without "person" | Andrew Chipper energy; brash + youthful | Confirm not-mean in audition |
| **Dex heart** (`dex_heart`, `dex_heart_kind`) | Dex | bravado → sincerity; armor cracks | **Fails** — browser pitch can't soften; reads same as taunts | Same speaker, slower/softer read carries the reveal | Highest-priority Dex audition line |
| **Mariam's Garden** (side quest) | Mariam | patient, gentle, grounded; Arabic flavor | Robotic; Arabic flavor absent (browser likely en voice) | Suad Qasim, Arabic routing | Verify `language: ar` reaches XTTS |
| **Prediction Duel** (vs Dex) | Dex, Zuzu | Dex cocky predictions vs Zuzu's measured ones — the contrast IS the lesson | Both robotic → contrast flattened; predict-before-test loses its voice | Dex fast/high vs Zuzu even/clear — audible contrast | Check Dex/Zuzu sit at opposite pitch/rate poles |
| **Mr. Chen heart scene** | Mr. Chen | measured, warm, reassuring; not monotone | Browser male voice, acceptable-ish but generic | Kazuhiko Atallah warmth | Lowest risk; confirm warmth |

## Findings
1. **Systemic, not per-line.** No scene's *script* is off-character; the failure was
   **delivery** — the whole cast on browser TTS. The mapping fix is the single biggest
   consistency win.
2. **Dex's two registers are the make-or-break.** His arc depends on the voice going
   from cocky to caught-out. Browser TTS cannot; XTTS can. The `dex_heart_kind` and
   Community Crossing soft lines are the **must-audition** items.
3. **Mariam's Arabic** is a consistency *and* respect issue — verify `language: 'ar'`
   actually routes to XTTS Arabic, or her warmth/identity is lost.
4. **Zuzu↔Dex contrast** (Prediction Duel) must be audible: opposite ends of the
   pitch/rate spread. Currently guaranteed by params; confirm post-audition.
5. **Mr. Chen's wordless pride** (Community Crossing) only works if his *spoken*
   scenes bank warmth — keep his read reassuring, never clipped.

## Verdict
Scripts: **on-canon.** Delivery: **was failing cast-wide (browser fallback); fixed at
the mapping layer.** Remaining consistency risk is concentrated in **Dex's soft
register** and **Mariam's Arabic routing** — both resolved by a short, targeted
audition, not by more code.
