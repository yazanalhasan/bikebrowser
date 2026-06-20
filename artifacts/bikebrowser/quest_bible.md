# BikeBrowser Quest Bible — Act 1 (Executive Brain)

Canon for quests. Every quest must follow the **Observe→Predict→Test→Trust-Evidence**
loop and arc.md's "prediction precedes intervention" + "relationships, not facts."
Quest data: `src/game/data/act1/act1Quests.js`. Driven by `QuestSystem`
(multi-quest, all-quest fallback). Side quests are optional and never gate the path.

## Main chain (10 quests, linked; completable end to end)
1. **Bike Check** — talk Mr. Chen, inspect bike, open garage, find the wash path.
2. **Something's Wrong at the Wash** — ask a neighbor, find the wash, inspect the
   broken bridge.
3. **Find What Could Fix It** — gather 8 material samples (balsa…carbon fiber).
4. **Test Before You Trust** — UTM-test all 8 (the core predict-then-test mechanic;
   compression vs tension).
5. **Bridge Plan** — choose deck/supports/braces/cables/foundations (real branching;
   weak designs fail).
6. **Reconnect the Crossing** — build the tested repair, cross. Triggers **The
   Community Crossing Sequence** (CrossingScene) — the **emotional climax of Act 1**:
   six scenes show *why* the bridge mattered (Mateo crosses as Ramirez watches →
   Ramirez's relief "it was never about wood and steel" → Mariam carries her seeds
   across → Dex acts cool but visibly cares → Mr. Chen's wordless pride → Zuzu's
   reflection, unlocking notebook `zuzu_crossing`). The bridge is not the reward;
   the people are. Reinforces both north stars (Observe→Predict→Test→Trust-Evidence
   and Observe-People→Understand→Earn-Trust→Build-Community).
7. **Desert Helper** — observe mesquite/creosote/saguaro respectfully (harvest
   ethics).
8. **Mix, Dry, Test** — mix + dry a sealant for the deck.
9. **Neighborhood Trust** — thank the Spanish + Arabic neighbors; **earn_trust**
   (fixed in P0 — now completable) → unblocks Quest 10.
10. **First Wider Map** — open the gate, find the first systems-upgrade clue (Act-1 →
    Act-2 hook).

## Side quests (optional; commit 2308e65)
- **The Prediction Duel (Dex).** Predict which material truly wins under load
  (steel/brick/"let the test decide") → different Dex reactions + notebook
  (prediction_duel, evidence_over_bravado). Reinforces prediction + compression/
  tension. **Multiple outcomes.**
- **Mariam's Garden (Auntie Mariam, post-repair).** Observe her struggling saguaro;
  choose shade/terrace/watch-a-full-day-first → different notebook unlocks
  (garden_shade/garden_terrace/observe_first) + relationship. Reinforces observation
  → engineering. **Multiple outcomes; observe-first rewards most.**

## Quest design contract (binding — from prior canon + arc.md)
Major quests should move through: **Observe → Predict → Test → (Build/Engineer) →
Verify → Visible consequence → Social/world payoff → Reflect (notebook).** Forbidden:
fetch-only padding, menu-only "construction," intervention before prediction, quizzes.

## Standing issues to address (quest quality)
- Several main quests **batch-complete** multiple objectives from one interaction
  (2, 3, 7, 8) — checklist padding. Candidate for a future "de-pad" pass (make them
  real sequential steps). Not a blocker.
- WorldMapScene is a dead stub (real map is a HUD). Cosmetic.

## Rules for new quests
1. Reinforce a STEM relationship through **story**, not a tutorial.
2. **Predict before intervene.** If the quest lets the player change a system, it
   must first make them predict it.
3. **Reward knowledge/relationships/world** (dialogue, notebook, trust) over items.
4. Offer **choices with multiple outcomes**; observe/evidence-first paths reward most.
5. Side quests never gate the main path; main quests stay completable.
6. Fit the world bible (Sonoran desert, the block, the crossing) and character bible.
