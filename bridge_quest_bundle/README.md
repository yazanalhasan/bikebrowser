# Bridge-Building Quest — File Bundle (flat)

Every file that drives **Mr. Chen's Crossing** (the bridge-building quest) in the
*rebuild* game (`/game-rebuild`). All files are in **one flat folder** — no subfolders.
The "lives at" column is the real path of each file in the repo (edit there, not here).
Legacy `src/renderer/game/**` files are intentionally excluded — old game, not played.

> ⚠️ **Read-only copy.** Edit the live files at the paths below, not this bundle.
> It's untracked in git — delete the folder anytime.

## Quest flow
`bridge_plan` → `reconnect_crossing` (see `act1Quests.js`), after the 8 materials are
collected + UTM-tested:
1. **Design** — pick a material per role → `BridgeDesignScene.js`
2. **Structural solve** — per-member stress, 5 load scenarios → `StructuralModel.js`
3. **Load test / stress viz** — hold or fail → `LoadTestSystem.js` + `LoadTestScene.js`
4. **Reconnect + cross** — payoff cutscene → `CrossingScene.js`

---

## Tier 1 — The bridge-building scene & its engine  ← *what you're unhappy with*

| File | Lives at | Role |
|---|---|---|
| `BridgeDesignScene.js` ★ | `src/game/phaser/scenes/` | **THE scene.** Leonardo-parchment builder: 5 slots (deck/support/brace/cable/foundation), live meters (Strength/Weight/Stability/Flood-proofing/Cost), hold-or-fail result diorama. The surface to redesign. |
| `ConstructionSystem.js` | `src/game/phaser/systems/` | `designBridge()` assembles the role→material plan; `completeBridgePlan()` gates it (all 8 tested; rejects weak-only). |
| `StructuralModel.js` | `src/game/phaser/systems/` | Deterministic per-member stress/strain solve. Member templates for deck/support/brace + optional cable (tension)/foundation (compression); 5 load scenarios person→monsoon_flood. |
| `LoadTestSystem.js` | `src/game/phaser/systems/` | Runs the load scenarios over a plan → pass/fail + per-member stress. |
| `LoadTestScene.js` | `src/game/phaser/scenes/` | Stress-visualization stepper (green/amber/red members). |
| `CrossingScene.js` | `src/game/phaser/scenes/` | Phase-6 payoff cutscene (narrator → Mr. Chen → Mrs. Ramirez → reward). |

## Tier 2 — Feeders, orchestration & wiring

| File | Lives at | Role |
|---|---|---|
| `MaterialsLabSystem.js` | `src/game/phaser/systems/` | The UTM — tests each material → `bridgeSafe` verdict; gates what's selectable. |
| `PredictionScene.js` | `src/game/phaser/scenes/` | Predict-before-test step for the UTM (materials-science framing before design). |
| `Act1RuntimeSystem.js` | `src/game/phaser/systems/` | Orchestrator: wires `bridgeDesign:start`, auto-runs the load test, `awardCrossingReward()`, `getAct1State()`. Large/shared — only the bridge methods matter. |
| `NeighborhoodScene.js` | `src/game/phaser/scenes/` | Overworld. Hosts the bridge zones (`bridge_plan`, `bridge_repair`), broken/repaired sprite + payoff glow, emits `bridgeDesign:start`/`crossing:start`. 2,239 lines, **mostly NOT bridge** — included for the bridge bits only. |
| `createGame.js` | `src/game/phaser/` | Scene registration (where BridgeDesign/LoadTest/Crossing get added). |
| `AssetRegistry.js` | `src/game/phaser/systems/` | Procedural textures incl. `leonardoNotebookBackdrop` + bridge debris. **The art/material look lives here.** |

## Tier 3 — Data driving the quest  (all live in `src/game/data/act1/`)

| File | Role |
|---|---|
| `act1Quests.js` | `bridge_plan` (choose_deck/support/brace/cable/foundation) + `reconnect_crossing` objectives. |
| `act1Materials.js` | The 8 construction materials + structural properties. |
| `act1Inventory.js` | Material inventory items. |
| `act1Dialogue.js` | `material_trade` (Mr. Chen's 8 samples), bridge intro/repaired lines. |
| `act1NotebookEntries.js` | `bridge_plan`, `bridge_repaired`, `compression_vs_tension` clues. |
| `act1Characters.js` | Mr. Chen (quest-giver). |
| `act1AssetManifest.js` | Asset-manifest entries for bridge/material/Leonardo art. |

## Tier 4 — Tests  (all live in `tests/e2e/`)

| File | Role |
|---|---|
| `game-rebuild.bridge-reachability.spec.js` | Player can reach + drive design; 5-role selection. |
| `game-rebuild.loadtest-reachability.spec.js` | Load-test scene reachable + steps through. |
| `game-rebuild.act1-acceptance.spec.js` | Full walkthrough incl. design → repair → cross. |

---

## Redesigning the bridge-building *scene*
The look/feel is almost entirely `BridgeDesignScene.js` (layout, parchment theme,
meters) + art tokens in `AssetRegistry.js` (`leonardoNotebookBackdrop`). Preserve these
seams so tests stay green: slot selection → `ConstructionSystem.designBridge`, plan gated
by `completeBridgePlan` (all 8 tested, no weak-only), passing design → `LoadTestScene` →
`CrossingScene`. Change presentation freely; keep those seams.
