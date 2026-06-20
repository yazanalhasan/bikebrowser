# BikeBrowser Act 1 — Playtest Package (Executive Brain)

A ~30-minute single-act educational adventure demo. Branch `eb/p0-defect-sweep`.

## 1. How to run the demo
```bash
cd C:\dev\bikebrowser
npm install            # first time
npm run dev:react      # Vite dev server -> http://localhost:5173
# open http://localhost:5173/game-rebuild
```
Controls: WASD/arrows move · **E / Space** interact & advance dialogue · choices via
**↑/↓ + E** or number keys · **G** map · **N** notebook · **J** discoveries ·
**M** quiet audio · **R** replay voice.

## 2. What the player should test
- Complete the main quest chain: check the bike → find the broken wash crossing →
  gather + **test** the 8 materials at the UTM → **plan** the bridge → repair & cross.
- Watch **The Community Crossing** play after the repair (the emotional climax).
- Talk to every NPC (**Mr. Chen, Mrs. Ramirez, Auntie Mariam, Dex**) — try the
  dialogue **choices** and the **heart-beat** questions ("why do you…?").
- Try the two **side quests**: Dex's **Prediction Duel** and **Mariam's Garden**
  (post-repair). Try different choices.
- Read the **notebook** (N) — especially the "Zuzu's Notes" reflections.

## 3. Known issues (honest)
- **Dex's sprite** is a tinted version of the player (placeholder; a unique sprite is
  proposed, human-gated).
- **Community Crossing** uses simple figures + a procedural backdrop (painted backdrop
  proposed).
- **Ground/some props** are placeholder-tier art (on-style painted backgrounds exist
  but aren't ported to web scenes yet).
- 8 dangling draft manifest entries (no runtime effect; cleanup pending).
- Full e2e suite + visual snapshots not fully reconciled for the new Dex NPC.

## 4. Feedback questions
- Did you understand **why the bridge mattered**?
- **Which character do you remember most** — and why?
- Did **Dex** feel annoying, funny, or interesting?
- Did the **STEM concepts** (test before you trust, predict-then-test, observe) feel
  natural or forced?
- Did **The Community Crossing** feel like a payoff?
- Did any **art** feel unfinished or inconsistent? Where?
- **Where did you feel bored or confused?**
- Did the **choices** feel meaningful (did your answers matter)?

## 5. Target experience
A player finishes Act 1 and **remembers Mateo crossing, Dex changing, Mariam's seeds,
Ramirez's relief, Mr. Chen's trust, and Zuzu's growth** — and feels that **evidence
matters, people matter, community matters; the bridge is what allows the ending.**
Learning happens through **story and relationships, not tutorials.**

## 6. Completion checklist (for the tester)
- [ ] Reached and crossed the repaired bridge.
- [ ] Saw The Community Crossing to the end.
- [ ] Talked to all four NPCs (and Dex).
- [ ] Completed at least one side quest.
- [ ] Opened the notebook and read a "Zuzu's Note".
- [ ] Reached the wider-map gate (Act-1 end hook).
- [ ] Noted any art that looked unfinished.
