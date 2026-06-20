# Voice Direction Bible (Executive Brain) — Step 2

Canon for how every major character should **sound**. Companion to
`character_bible.md` (who they are) and `NPCVoiceRegistry.js` (the parameters).
Every voice choice — speaker, pitch, rate, style — is checked against this. Aligns
with arc.md ("relationships, not facts"; playful characters, serious adventure) and
the child-literacy read-aloud goal (clear, never baby-talk, never robotic).

Each entry gives: **identity → must sound / must NOT sound → direction notes →
current params** (`NPCVoiceRegistry.js`) and **XTTS speaker** (provisional where noted).

---

## Zuzu — protagonist (player-character)
- **Age impression:** ~10–12, a desert kid. **Energy:** warm, even, unhurried.
  **Curiosity:** leans in; questions sound genuinely interested, not quizzy.
  **Optimism:** hopeful without being saccharine. **Confidence progression:** starts
  tentative/self-doubting → steadier as her tested predictions hold → quietly sure by
  the Community Crossing reflection.
- **Must sound:** thoughtful, observant, hopeful.
- **Must NOT sound:** sarcastic, cynical, robotic, baby-talk.
- **Direction:** she is the lens the child plays through — clarity first. Let the
  growth show in *pacing* (a touch more certain late-game), not in pitch theatrics.
- **Params:** rate 0.98, pitch 1.08, `gender: default`. **XTTS:** Daisy Studious
  (provisional — pick a bright, youthful, un-babyish read).

## Dex — recurring rival
- **Impulsive, energetic, overconfident, defensive.** Fast talker; interrupts his own
  caution. The bravado is **armor over insecurity** (canon: he measured once, it broke,
  everyone laughed).
- **Must sound:** fast, expressive, slightly reckless.
- **Must NOT sound:** villainous, mean, cartoonishly stupid.
- **The reveal:** the voice must let the *armor crack* in the heart beat
  (`dex_heart_kind`) and the Community Crossing — the same kid, suddenly quieter and
  sincere ("...okay. Okay, it held. Every plank.") The performance range from cocky to
  caught-out is the whole point; a flat brash read fails him.
- **Params:** rate 1.16, pitch 1.34 (browser-path "bratty" tuning), `gender: default`.
  **XTTS:** **Andrew Chipper** (provisional, recommended — youthful/energetic). See
  dex_voice_evaluation.md. Direction for the soft beats: same speaker, slower rate,
  lower energy — let XTTS prosody carry the sincerity.

## Mr. Chen — mentor
- **Calm, experienced, trustworthy, patient.** The adult the child trusts; evidence-based.
- **Must sound:** measured, grounded, reassuring.
- **Must NOT sound:** monotone, detached, emotionless.
- **Direction:** "measured" is not "flat." Warmth lives in small downward-resolving
  cadences and unhurried pauses. In the Community Crossing he has **no lines** — his
  pride is wordless — so everywhere he *does* speak must bank enough warmth that the
  silent scene reads as pride, not absence.
- **Params:** rate 0.88, pitch 0.92, `gender: male`. **XTTS:** Kazuhiko Atallah.

## Mrs. Ramirez — neighbor
- **Caring, protective, warm.** Community anchor; speaks Spanish in context.
- **Must sound:** welcoming, maternal, community-oriented.
- **Must NOT sound:** passive, generic.
- **Direction:** maternal *with backbone* — the protectiveness (kids near the wash)
  needs a little steel under the warmth, or she reads as wallpaper. Spanish lines use
  the same person's voice (`spanish_neighbor` → same speaker), never a different
  actor; meaning always in subtitles.
- **Params:** rate 0.93, pitch 1.04 (es-US variant 0.90/1.03), `gender: female`.
  **XTTS:** Ana Florence (both en + es).

## Auntie Mariam — elder
- **Wise, reflective, gentle.** Levantine-Arabic flavor; the garden/seeds keeper.
- **Must sound:** patient, thoughtful, emotionally grounded.
- **Must NOT sound:** overly dramatic, robotic.
- **Direction:** stillness is her signature — short phrases, room to breathe, never
  rushed. Emotion is *restraint*, not swell. Arabic routing when available; keep
  phrases short and relationship-based; subtitles carry meaning.
- **Params:** rate 0.87, pitch 0.98, `gender: female`, `language: ar`. **XTTS:**
  Suad Qasim (provisional — warm, MENA-appropriate; audition Arabic output).

---

## Cross-cast direction rules
1. **Distinctness:** the five leads must be tellable apart with eyes closed — separate
   speakers + the pitch/rate spread above. Dex (highest/fastest) ↔ Mr. Chen
   (lowest/slowest) are the poles.
2. **Range over caricature:** every lead needs at least one *soft* register (Dex's
   crack, Chen's pride, Mariam's seeds, Ramirez's relief, Zuzu's reflection). Voices
   tuned only for their loud setting fail the emotional beats.
3. **Child-first clarity:** never sacrifice intelligibility for flavor; this is a
   literacy read-aloud.
4. **No baby-talk, no robot.** Both are explicit fail states (Zuzu, Mariam).
5. **One actor per person across languages** (Ramirez en/es; Mariam ar) — language
   changes, identity does not.
