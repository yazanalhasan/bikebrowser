# Voice Playtest Questions (Executive Brain) — Step 8

Voice-specific questions to add to the Act 1 playtest package
(`playtest_package/README.md`). Goal: measure whether the new per-character voices
land — identity, believability, and the "robotic?" failure mode — **without leading**
the tester. Keep these in a dedicated "Voice & Audio" section, asked **after** the
player finishes (so recall is organic).

## Recall / identity (unprompted first)
1. Which character's **voice** do you remember most? Why?
2. Could you tell the characters apart by voice with your eyes closed?
3. If you had to describe Dex's voice to a friend, what would you say?

## Believability (per lead)
4. Did **Dex** feel believable — a real cocky kid, not a cartoon villain?
5. Did **Dex's** voice change when he got sincere (the bridge held / "teach me your way")? Did you notice a shift?
6. Did **Mr. Chen** feel trustworthy — someone you'd believe about the bridge?
7. Did **Auntie Mariam** feel wise and warm?
8. Did **Mrs. Ramirez** feel like a caring neighbor?
9. Did **Zuzu** sound thoughtful and hopeful — like *you* in the story?

## Failure modes (catch the must-NOTs)
10. Did any voice sound **robotic** or fake? Which?
11. Did any voice feel **wrong** for the character — mismatched age, mood, or personality?
12. Did **Dex** ever sound **mean** or like a bully (he shouldn't)?
13. Did any voice make a line **hard to understand**? (literacy check)
14. Did the **Arabic** (Auntie Mariam) or **Spanish** (Mrs. Ramirez) lines sound natural?

## Emotional payoff (does voice serve the arc)
15. At the **Community Crossing**, did the voices add to the moment, or could you have
    read it just as well on text alone?
16. Was there a moment a character's **voice** (not their words) gave you a feeling?

## Logistics / quality
17. Was anything too quiet, too loud, or cut off?
18. Did narration ever **talk over** dialogue or itself?
19. Did you use the **M (quiet)** or **R (replay)** controls? Were they discoverable?

## A/B split (optional, sharpens signal)
Run two tester groups to isolate the voice contribution:
- **Voice ON** (XTTS, mapped cast) vs **Voice via browser fallback** (set
  `useServerVoice=false`) — compare Q1/Q4/Q10/Q15 across groups. If "ON" testers
  remember voices and "fallback" testers remember only lines, the cast fix is
  validated and the production pre-render is justified.

## What each question de-risks
- Q1–3, Q15–16, A/B → **memorability** (the #1 project risk: relationship recall).
- Q4–9 → **per-character fit** vs the direction bible.
- Q10–14 → the explicit **must-NOTs** (robotic, mean, unintelligible, flat localization).
- Q17–19 → **production quality** (levels, overlap, controls).
