# Quest Audit (Phase 3) — Evidence-Based

**Scope:** BikeBrowser at `C:/dev/bikebrowser`. Reality > docs. The LIVE
`/game-rebuild` runtime is served by `src/game/`. Off-path = `src/renderer/game/`
(mounted at `/legacy-play`). Design-only = markdown in `artifacts/`.

---

## Headline numbers

| Bucket | Count | Where | Playable in live runtime? |
|---|---|---|---|
| **Live Act-1 quest chain** | **11 quests / 32 objectives** | `src/game/data/act1/act1Quests.js` | **YES — fully wired** |
| Off-path "cognitive quests" | 10 | `src/renderer/game/data/cognitiveQuests/arizonaCognitiveQuests.js` | NO (not referenced anywhere in `src/game/`) |
| Design-doc "25 quests" | 25 | `artifacts/biology_next_phase/chapter1_quest_set_v1.md` | NO (prose markdown, not code) |

- **Total quest count (all buckets):** 46 nominal (11 live + 10 off-path + 25 doc).
- **Chapter-1 count:** All three buckets are Chapter-1 / Act-1 content.
- **IMPLEMENTED & playable count: 11** (the live Act-1 chain only).

---

## 1. LIVE Act-1 quests — IMPLEMENTED / PLAYABLE

Source of truth: `src/game/data/act1/act1Quests.js` (11 quest objects, 122 LOC).
`src/game/phaser/data/quests.js:3` re-exports `act1Quests` as `quests`, which
`QuestSystem` (`src/game/phaser/systems/QuestSystem.js:1`) consumes. Objectives are
completed by real interactions: `NeighborhoodScene.createInteractions()`
(`NeighborhoodScene.js:669-767`) registers ~13 interaction zones, each carrying an
`action`/`dialogueId`; `Act1RuntimeSystem.handleInteraction()`
(`Act1RuntimeSystem.js:137-182`) and `applyDialogueEffects()` (`:117-135`) call
`completeObjective(...)`, which advances the linear chain via `quest.next`
(`QuestSystem.js:38-49`). This is a verified, end-to-end working loop — not a stub.

| # | Quest id | Name | Objectives | Backing system (real code) | Status |
|---|---|---|---|---|---|
| 1 | `bridge_dry_wash_intro` | Bike Check | 4 | BikeSystem.checkBike (`BikeSystem.js:13`) | **Complete/Playable** |
| 2 | `wash_problem` | Something's Wrong at the Wash | 3 | DiscoveryMapSystem.discover | **Complete/Playable** |
| 3 | `find_materials` | Find What Could Fix It | 4 | InventorySystem + EcologyObservationSystem | **Complete/Playable** |
| 4 | `test_materials` | Test Before You Trust | 4 | MaterialsLabSystem (UTM, `Act1RuntimeSystem.js:184`) | **Complete/Playable** |
| 5 | `bridge_plan` | Bridge Plan | 3 | ConstructionSystem.completeBridgePlan (`ConstructionSystem.js:17`) | **Complete/Playable** |
| 6 | `reconnect_crossing` | Reconnect the Crossing | 2 | ConstructionSystem.repairBridge/crossBridge (`:40,:53`) | **Complete/Playable** |
| 7 | `desert_helper` | Desert Helper | 3 | EcologyObservationSystem.observe | **Partial** (see note) |
| 8 | `mix_dry_test` | Mix, Dry, Test | 2 | ChemistrySystem.runRecipe | **Complete/Playable** |
| 9 | `neighborhood_trust` | Neighborhood Trust | 3 | TrustSystem + LanguageSystem (dialogue effects) | **Complete/Playable** |
| 10 | `first_wider_map` | First Wider Map | 2 | DiscoveryMapSystem.unlockWiderMap (`Act1RuntimeSystem.js:276`) | **Complete/Playable** |

(Quest 6's `repair_bridge` interaction completes both quest-5 plan objectives and
quest-6 in one handler chain, gated by the construction state machine — `bridge_plan`'s
three objectives are auto-completed inside `completeBridgePlan` rather than as separate
player choices, so they are scripted, not interactive choices.)

**Quality assessment — live chain:** This is a genuine **Functional Prototype /
near-Functional vertical slice**, the strongest part of the codebase. It has real
state machines with honest failure paths: `completeBridgePlan` rejects `weak_scrap_only`
and blocks if UTM tests are missing (`ConstructionSystem.js:18-27`); `repairBridge`
refuses without a plan (`:41`); `unlockWiderMap` refuses until the bridge is reconnected
(`Act1RuntimeSystem.js:277`). Notebook unlocks, trust, language, audio cues, and inventory
all fire from the same handlers. **Caveat:** it is shallow and largely linear/one-shot —
~13 "walk-to-halo, press E" interactions; many objectives are completed in bundles by a
single handler (e.g. `collect_materials` completes 3 objectives at once,
`Act1RuntimeSystem.js:162`), so the "32 objectives" overstate the count of distinct player
decisions. Several quest steps (deck/support/brace choice; observe creosote/saguaro) are
hard-coded to the correct answer rather than offering real choice. Completes in ~1.5 min.

### Quest 7 partial flag
`desert_helper` declares 3 objectives (`observe_mesquite`, `observe_creosote`,
`observe_saguaro`) but the `ecology_patch` handler only completes `collect_mesquite`/
`observe_mesquite` (`Act1RuntimeSystem.js:166-171,234-245`). Creosote and saguaro
observations have objective ids and a species map but **no interaction zone wired to a
species selector** in the scene — so quest 7 cannot self-complete through its own listed
objectives via the registered zones. Classify **Partial** (data present, full wiring
incomplete). Note: this matches the "13/16 clues" field-notebook reality reported in
ground-truth — not everything authored is reachable.

---

## 2. Off-path cognitive quests — NOT in live runtime

`src/renderer/game/data/cognitiveQuests/arizonaCognitiveQuests.js` (258 LOC) defines
**10** multiple-choice reasoning puzzles (titles: The Silent Leak, Scorching Pavement
Timing, Water Logic, Tool Efficiency Puzzle, Bridge Load Logic, Navigation Without Map,
Wind vs Effort, Energy Tradeoff, Desert Growth Logic, Sequence of Repair). Each is a
structured `{prompt, options[], correct}` data object — real data, consumed by
`src/renderer/game/scenes/CognitiveQuestScene.js`.

**Reachability:** `grep` for `CognitiveQuest|arizonaCognitiveQuests` across `src/game/`
returns **zero** hits — this content lives entirely in the legacy `/legacy-play` tree and
is NOT reachable from the shipping `/game-rebuild` path.
**Classify: Functional (off-path) — playable only in legacy, dead to the live game.**

---

## 3. The "25 quests" — DESIGN DOCUMENT, not quests

`artifacts/biology_next_phase/chapter1_quest_set_v1.md` (193 lines, authored 2026-06-02)
is a **prose design doc**: 25 numbered quest *concepts* grouped A–F, each a one-line
pitch plus taxonomy tags (`H:`/`R:`/`G:`/`D:`/`Bio:`/`Eng:`/`→` seeds). Examples: "First
Light, First Look", "The Moth and the Yucca", "The Bark That Eases Pain". There is **no
JS, no data object, no scene, no entity wiring** — these reference Sonoran entities
(`saguaro`, `banana_yucca`, `yucca_moth`, `datura_wrightii`, etc.) and instruments
(`UTM`, `ecosystem_simulator(intro)`, `pharmacology_bench`) that do not exist as runtime
code on either path. The doc's own "Set-level coverage check" (`:180`) is a design
self-audit, not test output.
**Classify: Design Only / Planned. Be explicit: these are NOT 25 quests in the game —
they are 25 quest *briefs* in a markdown file, 0% implemented.**

---

## Bottom line
The game has **11 implemented, playable quests** (the Act-1 chain in `src/game/`),
one of which (`desert_helper`) is **Partial**. Everything else — 10 legacy cognitive
puzzles and the 25-quest "set" — is **off-path or design-only and does not play in the
live experience.**
