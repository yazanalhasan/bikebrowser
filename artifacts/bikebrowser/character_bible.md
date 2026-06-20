# BikeBrowser Character Bible (Executive Brain)

Canon for all dialogue/characterization. **Every new line must be checked against
this bible — no character drift.** Aligns with arc.md ("relationships, not facts";
playful characters, serious adventure; failure as feedback). Reflects the arcs and
heart-beats shipped through commit c5f98a3.

Voice profiles live in `src/game/phaser/audio/NPCVoiceRegistry.js`. Dialogue lives
in `src/game/data/act1/act1Dialogue.js`. Notebook reflections in
`act1NotebookEntries.js`. **How each character should *sound* is canon in
`artifacts/bikebrowser/audio/voice_direction_bible.md`** (XTTS speaker assignments +
must/must-not per character).

---

## Zuzu — the player-character (protagonist)
- **Identity:** a curious desert kid with a bike, a garage, and a notebook. The
  player. Bright, grounded, kind; never baby-talk (voice: rate 0.98, pitch 1.08).
- **Goals:** repair the bike, reconnect the broken crossing, help the block, earn
  the wider map. Underneath: to be *trusted* by people she looks up to.
- **Fears:** that the bridge will fall (that Dex is right); that being careful means
  being slow/scared.
- **Strengths:** observation, patience, the discipline to **test before trusting**.
- **Weaknesses:** self-doubt under pressure; takes on others' worries as her own.
- **Growth arc (Act 1):** from "fix a thing" → to understanding that evidence is how
  you earn trust — in bridges *and* in people. Voiced through four first-person
  **"Zuzu's Notes"** (zuzu_fear, zuzu_trust, zuzu_home, and the **crossing**
  reflection `zuzu_crossing` — "the bridge was never the point; the crossing was") —
  her interiority and the game's emotional spine. The crossing reflection is the
  arc's payoff and one of Act 1's most memorable lines.
- **Relationships:** mentee to Mr. Chen & Mariam; protector-of-the-block alongside
  Mrs. Ramirez; rival-becoming-friend to Dex.
- **Reasoning level (arc.md):** Act 1 keeps her Observe-dominant, rising to Predict.

## Dex — the recurring rival
- **Identity:** cocky "just send it" BMX kid. Foil to test-before-trust. Voice fast,
  bright, brash but **never mean** (browser-fallback tuning rate 1.16, pitch 1.34;
  XTTS speaker **Andrew Chipper**, provisional — audition pending, see
  `audio/dex_voice_evaluation.md`). The voice MUST be able to **crack into sincerity**
  for `dex_heart_kind` / the Crossing — a flat brash read fails his arc. Reuses the kid
  sprite + teal tint (placeholder; unique sprite is an art part-B item).
- **Goals:** to look fearless and fast; secretly, to be taken seriously.
- **Fears:** humiliation. Being laughed at.
- **Why he acts reckless (core):** he once measured carefully and it **still broke**,
  and everyone laughed. Now he breaks things first, laughing — "can't laugh at me if
  I'm already laughing." Bravado is **armor**. (Canon: `dex_heart`, notebook
  `dex_armor`.)
- **Relationship with Zuzu:** rivalry → grudging respect (when her tested bridge
  holds) → tentative friendship (the kindness branch `dex_heart_kind`: "we test the
  next one. Together"). He calls her "brain."
- **Growth arc:** bravado (intro) → skepticism (bridge) → respect (post-repair) →
  vulnerability + partnership (heart) → **visible care at the Community Crossing**
  ("It held. Every plank. I watched all of them... teach me your way sometime"). He
  never fully loses the swagger — it just stops being a wall.
- **Theme role:** embodies "prediction precedes intervention" by failing it; his
  arc *earns* the lesson rather than lecturing it.

## Mr. Chen — the garage mentor
- **Identity:** calm, precise, warm. Runs the garage; looks out for the block.
  Evidence-based. Voice slow, low, mentor (rate 0.88, pitch 0.92).
- **Backstory / core wound:** long ago he told a family their **porch beam was safe
  without testing it**. It held for them, then cracked later — he still sees their
  faces. (Canon: `mr_chen_heart`, notebook `chen_why`.)
- **Why he values testing:** not doubt — **care**. "I test now because I care what
  happens after I say it is safe." This reframes the UTM ethos as love, not rigor.
- **Relationship with Zuzu:** the steady teacher. He never lectures; he hands her
  instruments and lets her discover (the arc.md UTM pattern personified).
- **Theme role:** the human face of "test before you trust."

## Mrs. Ramirez — the neighbor (community anchor)
- **Identity:** warm, protective, bilingual (English/Spanish), the heart of the
  block. Voice warm female (rate 0.93, pitch 1.04); Spanish-context variant exists.
- **Family / Mateo:** her grandson **Mateo, seven**, crosses the wash to school every
  morning "with a backpack bigger than he is." Since the bridge broke he takes the
  long highway road; "I don't breathe right until he's home." (Canon: `ramirez_heart`,
  notebook `ramirez_mateo`.) Mateo makes the repair's stakes a *person*.
- **Community role:** carries the mercado bags this way; knows everyone; connects the
  block (her branch reveals the school, the mercado, and Mariam's garden across the
  wash).
- **Relationship with Zuzu:** warm, maternal ("mija"); trusts Zuzu's care. Her
  refrain: "Fix it well, mija. Not fast. **Well.**"
- **Theme role:** "careful is not slow; careful is kind" — the value of patience.

## Auntie Mariam — the family mentor (Arabic layer)
- **Identity:** gentle, steady, caring. The first intentional non-English learning
  layer (Levantine Arabic flavoring). Voice gentle female (rate 0.87, pitch 0.98).
  **Cultural-content guardrail (arc.md):** keep her warm and relational; deeper
  cultural specifics require a human design brief.
- **Past / migration:** she **built wells and footbridges in her village** before
  the desert — "stone, rope, and patience." A real builder; a mentor peer to Mr.
  Chen. (Canon: `mariam_builder`.)
- **Garden symbolism:** she carried her **seeds across an ocean in a tin box**; when
  they grow here, "a little of home grows too." The young saguaro is "the slowest,
  and the bravest." Helping the garden = helping home put down roots. (Canon:
  `mariam_heart`, notebook `mariam_seeds`; side quest "Mariam's Garden".)
- **Relationship with Zuzu:** sees herself in Zuzu ("you test before you trust");
  proud-mentor warmth. Trust earned through demonstrated care.
- **Theme role:** observation + engineering as continuity of home and belonging.

---

## Cross-character canon (do not drift)
- The block is a **web**, not a set of quest-givers: Ramirez↔Mariam (the garden
  across the wash), both↔Zuzu (mentorship/protection), Dex↔Zuzu (rivalry→friendship),
  Mr. Chen↔Mariam (two builders who value proof).
- Tone: warm, hopeful, grounded; humor (Dex) balanced with quiet emotion (Chen,
  Mariam). Never childish, never grim. "A serious adventure game with playful
  characters" (arc.md).
- Every character teaches **Observe→Predict→Test→Trust-Evidence** by living it, never
  by quizzing. A line that lectures or quizzes is off-canon.
