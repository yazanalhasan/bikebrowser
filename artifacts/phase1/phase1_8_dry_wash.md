# Phase 1.8 — Dry Wash: the first investigation region

Dry Wash is **not a map expansion** — it is a new *style of thinking*: the
Observation → Hypothesis → Investigation → Evidence → Conclusion loop, proving
the educational loop generalizes beyond bridge repair.

## What the player encounters (per the directive)
- **An engineering mystery:** "Why did the crossing wash out?"
- **An ecology mystery:** "Why do plants grow down a *dry* wash?"
- **A misleading hypothesis** in each (engineering: "the planks were too weak";
  ecology: "it must have rained recently").
- **Evidence that disproves it** (engineering: high-water mark + scour hole under
  the footings; ecology: bone-dry surface + deep roots to subsurface moisture).
- **A better explanation** (engineering: flash-flood *scour* undermined the
  footings → needs deeper, protected footings; ecology: the wash is a hidden
  *subsurface* water highway).

## Reuses systems already built
Notebook (Investigation entries), the reasoning style (predict→evidence→update),
ecology framing, and the inventory/material facts — no new content silo.

## Changes (one scoped slice)
1. **New** `src/game/data/act1/act1DryWash.js` — two investigations, each with a
   misleading + correct hypothesis, evidence that `disproves` a hypothesis, and a
   conclusion + notebook entry.
2. **New** `src/game/phaser/systems/InvestigationSystem.js` — the loop state
   machine: `observe → hypothesize → investigate → conclude`, with
   `updatedFromMisleading` (started wrong, corrected by evidence = the learning
   signal) and `disprovesHypothesis`.
3. `Act1RuntimeSystem` — registered `investigationSystem` (constructor/reset/
   state/load); methods `observeMystery/hypothesizeMystery/investigateMystery/
   concludeMystery` with feedback + notebook unlock; exposed on `__GAME__`.
4. `act1NotebookEntries.js` — Investigation entries `wash_scour`, `wash_water`.
5. `acceptance spec` — drives `wash_out_cause` with the **misleading** hypothesis
   and **asserts**: observed, hypothesis misleading, evidence disproves it,
   `correctedFromMisleading`, conclusion mentions "scoured", state concluded +
   updatedFromMisleading, notebook `wash_scour` unlocked.

## Validation
- `npm run build`: ✓ (8.2s).
- Playwright `game-rebuild.act1-acceptance`: **GREEN — 1 passed (1.5m)** (after a
  one-shot fix: the investigation drive was reordered to run *after* the
  map-unlock feedback assertion so it didn't clobber it — game logic unchanged).
- Investigation loop (live): observe ✓ → misleading hypothesis ✓ → evidence
  disproves ✓ → conclusion (scour) ✓ → corrected-from-misleading ✓ → notebook
  `wash_scour` ✓.
- New screenshot: `…/12_dry_wash_investigation.png`. Console errors: none.

## Result — the loop generalizes
Dry Wash proves a player can run the same evidence-based reasoning on a brand-new
problem, *be misled, be corrected by evidence, and reach a better explanation* —
the educational engine is not bound to bridge repair.

## Phase 1 complete
1.1 ecology · 1.2 UTM · 1.3 predict · 1.4 inventory · 1.5 gating · 1.6 bridge ·
1.7 reasoning grader · **1.8 Dry Wash investigation** — all green.

## Next (Phase 2)
2.1 Ecology Loop (Observe → Predict → Outcome with water/shade/competition/
habitat). Then arc_alignment_report.md updated.
