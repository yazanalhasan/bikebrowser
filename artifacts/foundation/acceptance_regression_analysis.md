# Acceptance Regression Analysis (Path B)

Investigated whether the pre-existing rebuild WIP (committed as baseline
`0523c7e`) caused the acceptance failure. Evidence: `git diff 0523c7e^
0523c7e`, runtime zone dump, scene/layout source.

## Verdict
**A. Fragile test — primary cause**, **triggered by C. Scene layout
change.** **NOT B (gameplay regression), NOT D (interaction-zone overlap
bug), NOT E.**

## What the WIP actually changed
The WIP was a **legitimate layout/art refactor**: `NeighborhoodScene.js`
stopped hardcoding positions and now reads them from
`public/layouts/neighborhood.layout.json` (`bike_inspection`, `npc_neighbor`,
`mr_chen`, etc.), plus new environment/prop/UI art PNGs. In that refactor
the neighbor (Mrs. Ramirez) moved:
- **Before:** neighbor `x: 398`; bike interaction `x: 470` → gap **72px**.
- **After:** neighbor `x: 420` (layout); bike interaction `x: 470` → gap
  **50px**.

## Why that surfaced as an acceptance failure
The 22px move did **not** break gameplay — both zones still work, and a human
player reaches the bike fine. It **shrank the bike↔neighbor gap to 50px**,
which was enough for the test's pre-existing **24–28px walk dead band**
(Path A) to trap the player with the neighbor "nearest". The layout change
was the *trigger*; the *root cause* is the brittle test navigation. At the
old 72px gap the dead band happened not to bite; at 50px it did.

## Category classification
| Category | Applies? | Note |
|---|---|---|
| A. Fragile test | **YES (root)** | dead-band navigation; now fixed in `walkTo` |
| B. Gameplay regression | **No** | game is playable; Brain audit PASS; no logic changed |
| C. Scene layout change | **YES (trigger)** | neighbor 398→420 via layout refactor |
| D. Interaction-zone overlap | No | zones distinct (mr_chen 246, neighbor 420, bike 470); a 2nd `neighbor` registration dedupes to one runtime zone |
| E. Other | No | — |

## Disposition
- **Fix applied to the test, not the game** (correct: don't change gameplay
  to satisfy a brittle test). Layout positions are kept as authored.
- **No gameplay regression to fix.** The neighbor-near-bike spacing is an
  intentional art/layout choice; it is now safely navigable by the
  hardened test.
- **Latent risk noted for hardening** (`acceptance_hardening.md`): the test
  still hardcodes target coordinates (470,432) duplicated from the layout;
  closely-spaced zones remain a fragility class. Recommended follow-up:
  derive targets from `interactions.zones` at runtime rather than literals.
