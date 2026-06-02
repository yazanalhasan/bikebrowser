# BikeBrowser — State of the Game (evidence-based)

Synthesis of the 14 phase audits in this folder. Rule held throughout:
**reality > design docs; runtime > documentation; implementation >
architecture.** Every claim traces to a phase doc with `file:line`
evidence.

## 1. What is BikeBrowser today?
A **polished but thin single-screen Act-1 vertical slice** of an Arizona
desert adventure, served at `/game-rebuild` from the **`src/game/` tree
(~4,943 LOC)**. The player walks a side-on street and completes ~13
"walk-to-glowing-halo → press E" interactions across **11 wired quests /
32 objectives** (`act1Quests.js` → `QuestSystem.js` → `Act1RuntimeSystem`)
in ~1.5 minutes: inspect bike → talk to Mr. Chen → find the dry wash →
collect & **UTM-test materials** → plan & **repair the bridge** (which
mechanically refuses untested/weak materials) → earn neighborhood trust →
unlock the wider map → fill the Field Notebook (13/16 clues). Around it
sits a **vast design-document corpus** (the 7-vehicle spine, the
biological spine, reasoning/curriculum, food-web, Sonoran dataset, visual
architecture v2.0, MiniMax) authored in a ~1-day commit burst that is
**not implemented** (`roadmap_reconciliation.md`).

## 2. What is actually playable?
The Act-1 desert slice, end-to-end, with a working Field Notebook, four
production-grade animated NPCs, a broken→repaired bridge with celebration
FX, and a genuine materials-test "squish" visualizer. It is a **Functional
Prototype**, not Production: the wider-map climax is a **dead end**
(empty `WorldMapScene` stub), buildings are drawn but **un-enterable**,
quest steps **aren't order-enforced**, the bike is a **31-LOC two-boolean
stub** (you never ride — `speed=178; setVelocity`), and tests are
**deterministic single-button** presses (no choice/mastery)
(`runtime_reality_audit.md`, `vehicle_audit.md`).

## 3. What systems are strongest?
- **Materials/UTM test rig + evidence-gated construction** — the genuine
  core. The bridge build **refuses untested or weak materials**
  (`ConstructionSystem.js:18-27,47`), and the UTM shows real deformation
  (`NeighborhoodScene.js:868-917`). This is the one tight, enforced
  "test-before-you-trust" loop and it is good (`educational_value_audit.md`).
- **Quest/dialogue/notebook plumbing** — 11 quests, 32 objectives, a
  16-card notebook, all wired and functional.
- **Character art** — 4 runtime-verified animated characters (audit JSON
  `pass:true`, MAE 15–18).

## 4. What systems are weakest?
- **Vehicles** — only the bike, as a stub; boat/aircraft/spacecraft are
  **Missing/Design-Only**.
- **Simulation** — **nothing runs a dynamic simulation.** Biology
  Stage 2/3 (`stepSimulation`/`createEcosystem`) are **throwing stubs**
  (`biology/index.js:159-269`); `simulationEngine.js` is a graph
  *validator*, not a time-stepper; ecology is a static field-guide
  (`simulation_readiness.md`).
- **Biology/ethnobotany/phytochemistry/pharmacology/reasoning/
  knowledge-state** — **Design Only** (each a lone `.md`, 0 JS, 0
  importers).

## 5. What content is strongest?
The **bridge-repair beat** (the emotional + educational climax) and the
**four characters with bilingual greetings + the trust mechanic**. The
art and audio on the live path are production-quality (~25 `final_ready`
PNGs, real `.ogg`/`.mp3`) (`asset_audit.md`).

## 6. What content is weakest?
- The **wider-map payoff** leads nowhere.
- `desert_helper` quest is **Partial** — its creosote/saguaro observation
  objectives have no wired interaction zone (the missing 3 notebook clues)
  (`quest_audit.md`).
- The **25 "Chapter-1 quests," the Sonoran 12-plant dataset, and the whole
  curriculum** are **markdown design docs with 0% in-game implementation.**

## 7. What should be built next?
In order: (a) **resolve the two-tree split** (decide the canonical tree;
the bigger systems live off-path at `/legacy-play`); (b) **deepen the one
proven loop** — real predict-then-test (a captured-hypothesis step; today
the UTM tests all four materials in one click,
`Act1RuntimeSystem.js:173`) and give the bridge/bike real player choice;
(c) **fix the dead ends** (make the wider-map unlock lead somewhere;
enterable buildings). See `executive_summary.md` for the % allocation.

## 8. What should NOT be built yet?
**More systems or content on top of the unbuilt base.** Specifically:
boats/aircraft/spacecraft, the biology/ethnobotany/pharmacology spine,
genetics/synthetic biology/terraforming, more quests, more plants, and the
MiniMax pipeline. The design corpus already runs ~10–20× ahead of
implementation; adding to it widens the gap.

## 9. What is the biggest risk?
**The design-vs-reality gap, compounded by the two-tree split.** ~5–10% of
the documented vision is built (`roadmap_reconciliation.md`), the most
capable systems tree is **off the shipping path**, and the last day of
work was entirely **documentation that reads like implementation**. The
risk is continuing to design/garden docs while the playable game stays a
90-second vignette — and losing the thread of which code is even canonical.

## 10. What is the biggest opportunity?
**The "test-before-you-trust" engineering loop is genuinely good and
genuinely educational** — and it already works. Doubling down on that one
proven mechanic (real hypotheses, player choice, consequence) on a single
consolidated codebase would turn a 90-second demo into an actual playable,
teachable Act 1 — and prove the core thesis before scaling the spine.
