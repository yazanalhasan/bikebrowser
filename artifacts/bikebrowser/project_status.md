# BikeBrowser Project Status (Executive Brain)

**Owner:** Executive Brain. **Target:** ship a memorable, completable **Act 1 /
Chapter 1 (Sonoran bike)** demo per arc.md. **Identity:** pixel-JRPG, anime-adjacent,
STEM-adventure. **Branch:** `eb/p0-defect-sweep`.

## Health
- Build: ✅ clean (vite). Smoke: ✅ 1/1 (:5219). Critical path: ✅ completable.
- Risk register: scope-creep beyond Act 1 (mitigated: Act 1 = ship target); cultural
  content needs human briefs; art part B human-gated.

## Done (this ownership era)
| Area | State |
|---|---|
| Defects (earn_trust, draft art, test harness) | ✅ P0 |
| Repo hygiene (quarantine abandoned trees, docs reconciled) | ✅ P1 |
| Branching dialogue engine + all major NPCs | ✅ |
| Recurring rival (Dex) full arc | ✅ |
| Two choice-driven side quests | ✅ |
| Emotional heart-beats (5 characters) | ✅ |
| Ownership memory (bibles, analysis, this set) | ✅ (this turn) |

## In progress / next
- Memorable-moments content (community crossing payoff; more Zuzu reflections).
- Art part B (replacement proposals; human-gated).
- Optional: quest de-pad; push local commits; open PR.

## Local vs remote
**All content pushed.** Branch `eb/p0-defect-sweep` (P0 → … → side quests →
heart-beats → Community Crossing → ownership bibles) is on origin. **PR #8** open
(base `main`): "BikeBrowser Act 1 Recovery, Narrative Depth, and Executive Brain
Ownership" — not auto-merged. (A Dex-reposition + playtest-prep commit is the only
post-push local change.)

## Playtest readiness (Act 1)
- Validation: build clean; smoke + act1-complete (save/resume) + bridge-reachability
  + content drivers (side quests, Community Crossing) all green. See
  `validation_report.md`.
- Art part B (Dex sprite, Crossing backdrop, live SVG props) = **proposals written,
  human-gated**; not done.
- **Act 1 scope is FROZEN** (post playtest package): only fixes / polish / art
  proposals / validated swaps / a11y until feedback.
- Remaining before merge: full e2e suite + visual-snapshot reconciliation for the
  added Dex NPC; remove 8 dangling draft manifest entries.

## Success criteria (arc.md-aligned)
A player finishes Act 1 and **remembers Zuzu, Dex, Mr. Chen, Mrs. Ramirez, Auntie
Mariam**, and understands **Observe → Predict → Test → Trust Evidence** through story
and relationships, not tutorials. Decision test on every change: *"Does this deepen
emotional connection while preserving the arc.md STEM-adventure vision?"*
