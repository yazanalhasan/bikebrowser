# Scene access audit — 2026-04-27

ROOT CAUSE CATEGORY (from Stage 1):

> *Quest steps point the player at a scene that is gated by an unrelated
> quest's progress (and/or reference observations / scenes that no live
> system emits, no live scene exposes, and no `step.scene` pointer
> identifies). The scene exists and is registered, but the player has no
> reachable path from their actual quest state to its access point.*

This audit sweeps every quest, every scene, and every access mechanism for
the same category. All paths are absolute under `C:\Users\yazan\bikebrowser\`.

---

## Materials Lab — root cause

`MaterialLabScene` is registered (`src/renderer/game/config.js:51`), defined
in the logical scene registry (`src/renderer/game/systems/sceneRegistry.js:79`),
and has a working back-exit. Its only forward access point is the
`Materials Lab` doorway interactable in `ZuzuGarageScene` at
`src/renderer/game/scenes/ZuzuGarageScene.js:190-224`. That interactable is
gated on (a) holding the three bridge-quest sample items, *or* (b) being on
`bridge_collapse` at `stepIndex >= 8`. A player on `desert_coating` step 5
(`apply_coating`, `src/renderer/game/data/quests.js:1611-1617`) satisfies
neither predicate, and the gate's else-branch emits a Mr. Chen dialog
without starting the scene (`ZuzuGarageScene.js:216-222`). The
`apply_coating` step also has no `scene:` pointer to direct the quest UI,
and its `requiredObservation: 'coating_applied'` is referenced exactly once
in the codebase (the quest definition itself); no system writes
`'coating_applied'` to `state.observations`. The step is therefore
unreachable AND uncompletable even if the door opened.

---

## Other instances of same category

Format: `<Quest or Scene>: <failure mode> (file:line)`

### Quest steps whose target scene is gated, missing, or unspecified

- **`bridge_collapse.test_material`** (`src/renderer/game/data/quests.js:1221-1228`):
  has `scene: 'MaterialLabScene'`, requires `load_test_completed`. The
  doorway gate (`ZuzuGarageScene.js:198-203`) only opens at `stepIndex >= 8`.
  `test_material` is at step index 9 in the quest array — *if* the player
  has all three samples granted by earlier steps. **Working only because
  earlier bridge steps grant the items**; any save-state where the player
  is at `test_material` without the three samples in `inventory` would also
  hit the closed-door dialog. This is the same gate used by `desert_coating`,
  with no fallback for "active quest is bridge_collapse but inventory was
  trimmed".

- **`bridge_collapse.build_bridge`** (`src/renderer/game/data/quests.js:1274-1281`):
  has `scene: 'DryWashScene'`. DryWashScene is reached via WorldMap node
  `dry_wash` (`src/renderer/game/data/worldMapData.js:88-103`) which is
  gated on `questsAny: ['bridge_collapse']`. Reachable when the bridge
  quest is active. The `bridge_built` observation **is** emitted by
  `src/renderer/game/data/blueprints/bridgeBlueprint.js:39` via
  `src/renderer/game/systems/construction/constructionSystem.js:530`. OK
  in isolation, but see the seamless-traversal note below — the user's
  ongoing C2 traversal item only wires DryWash to the **legacy**
  `NeighborhoodScene`, not `OverworldScene`.

- **`heat_failure.observe_expansion`** (`src/renderer/game/data/quests.js:1340-1345`):
  has `scene: 'ThermalRigScene'`. The doorway in `ZuzuGarageScene.js:240-267`
  gates on `aq?.id === 'heat_failure' && stepIndex >= 3`. *Works* if and
  only if the player is on this exact quest and at/past index 3. No
  fallback for any other quest sending the player to the thermal rig. No
  other quest currently does.

- **`perfect_composite.combine_materials`** (`src/renderer/game/data/quests.js:1411-1416`):
  hint: *"Use the material workbench to combine them."* Same target as
  `desert_coating.apply_coating`. No `scene:` field. Required observation
  `'composite_created'` is referenced only at `quests.js:1414` — nothing
  in `src/` writes it. Even if the Materials Lab door were ungated, no UI
  combines `agave_fiber + creosote_leaves`. Step is uncompletable.
  (Quest prerequisite is `bridge_collapse`, so the player would arrive
  here with the bridge samples, satisfying `haveAll` and entering the lab
  — but the lab still does not implement compositing.)

- **`desert_coating.apply_coating`** (`src/renderer/game/data/quests.js:1611-1617`):
  the subject quest. Detailed in Stage 1.

- **`engine_cleaning.use_surfactant`** (`src/renderer/game/data/quests.js:1551-1556`):
  required observation `'motor_cleaned'`. Hint: *"Use the surfactant on
  the clogged motor. Watch the contamination drop."* No `scene:` field.
  Grep for `'motor_cleaned'` returns only the quests.js line. No emitter
  exists. No "motor" interactable exists in any scene file (grep `motor`
  in `src/renderer/game/scenes/`). Step is uncompletable.

- **`boat_puzzle.test_raft`** (`src/renderer/game/data/quests.js:1479-1485`):
  required observation `'buoyancy_test_passed'`. No `scene:` field. No
  emitter for `'buoyancy_test_passed'` anywhere in `src/`. No "raft sim"
  scene. Step is uncompletable.

- **`extract_dna.run_extraction`** (`src/renderer/game/data/quests.js:541-546`):
  required observation `'dna_extracted'`. Hint references "biology
  workbench" — there is no biology workbench scene or interactable in the
  codebase (grep `biology workbench` hits only `quests.js:545,614,683`).
  No emitter for `dna_extracted`. Step is uncompletable.

- **`understand_expression.simulate_rna`** (`src/renderer/game/data/quests.js:594-599`)
  and **`.simulate_expression`** (`quests.js:610-615`):
  required observations `'rna_extracted'`, `'expression_simulated'`. Same
  "biology workbench" non-existence. Both uncompletable.

- **`engineer_bacteria.insert_gene`** (`src/renderer/game/data/quests.js:679-684`)
  and **`.run_production`** (`quests.js:686-691`):
  observations `'gene_inserted'`, `'bio_production_complete'`. Same. Both
  uncompletable.

- **`bio_battery_integration.create_electrolyte`** (`src/renderer/game/data/quests.js:739-744`):
  observation `'bio_electrolyte_created'`. No emitter. Uncompletable.

- **`the_living_fluid.find_fluid_zone`** (`src/renderer/game/data/quests.js:812-817`)
  and **`.cross_basin`** (`quests.js:819-824`):
  observations `'fluid_zone_found'`, `'basin_crossed'`. No emitter found
  via grep. Uncompletable as written.

- **`one_sided_forest.enter_topology_zone`** (`src/renderer/game/data/quests.js:939-944`)
  and **`.complete_loop`** (`quests.js:946-951`):
  observations `'topology_zone_entered'`, `'topology_loop_completed'`. No
  emitter. Uncompletable.

- **`invisible_map.enter_memory_zone`** (`src/renderer/game/data/quests.js:1074-1079`)
  and **`.find_water_blind`** (`quests.js:1081-1086`):
  observations `'memory_zone_entered'`, `'water_found_blind'`. No emitter.
  Uncompletable.

- **`food_chain_tracker.observe_mesquite`** (`src/renderer/game/data/quests.js:276-281`)
  and **`.observe_javelina`** (`quests.js:291-296`):
  required observations `'mesquite'`, `'javelina'`. Grep finds these
  strings only in flora/fauna data tables, not as observation pushes.
  Uncompletable as written.

(Of all 17 `requiredObservation:` steps in `quests.js`, only 3 have a
matching emitter: `load_test_completed` via `MaterialLabScene.js:77` →
`LabRigBase.js:556-562`; `thermal_expansion_observed` via
`ThermalRigScene.js:325`; `bridge_built` via
`bridgeBlueprint.js:39` + `constructionSystem.js:530`. The other 14 are
write-only fields the engine never satisfies.)

### Scenes flagged for the same category

- **`ThermalRigScene`** (`src/renderer/game/scenes/ThermalRigScene.js`):
  registered (`config.js:55`). Only access point is the Thermal Lab
  doorway at `ZuzuGarageScene.js:240-267`, gated on
  `heat_failure.stepIndex >= 3`. Behaves identically to MaterialLab —
  any quest that sends a player to a thermal lab without being on
  `heat_failure` past step 3 will fall through the gate. Currently no
  other quest tries this, so the bug is latent rather than active.

- **`MaterialLabScene`**: see Stage 1 root-cause paragraph above.

- **`GarageScene`** (legacy, `src/renderer/game/scenes/GarageScene.js`):
  registered (`config.js:68`). No inbound `scene.start('GarageScene')`
  except from `NeighborhoodScene.js:672` (also legacy) and via
  `SCENE_KEY_MIGRATION` (`config.js:77-80`) — but the migration *redirects
  away* from `GarageScene` to `ZuzuGarageScene`. **Effectively
  unreachable** in the live flow. Only entered if a save's
  `state.player.scene === 'GarageScene'` is loaded directly without going
  through the migration, which the migration prevents.

- **`NeighborhoodScene`** (legacy, `src/renderer/game/scenes/NeighborhoodScene.js`):
  registered (`config.js:69`). Symmetric to GarageScene. The migration
  remaps it to `OverworldScene` (`config.js:79`). However it is the
  scene that the seamless traversal map seeds the
  `west↔east` adjacency for at `src/renderer/game/systems/seamlessTraversal.js:84-94`.
  Since players never *arrive* at `NeighborhoodScene` in the live flow,
  the seamless edge to `DryWashScene` cannot fire from this side. The
  reverse edge — DryWash → west → NeighborhoodScene
  (`seamlessTraversal.js:90`) — would either land the player on the
  legacy scene (broken save state) or, if migration reroutes them,
  spawn them in `OverworldScene` at an unspecified location. **Latent
  scene-orphan bug** matching the audit category. (User noted this is
  the C2 traversal that hasn't been runtime-validated yet.)

- **`LayoutEditorOverlayScene`** (`src/renderer/game/scenes/LayoutEditorOverlayScene.js`):
  registered last (`config.js:71`); dev-only F2 overlay, not part of
  player traversal — not an orphan in the gameplay sense.

### Access mechanisms with mismatched destinations or stale keys

- `ZuzuGarageScene.js:198-200` checks for `'mesquite_wood_sample'` in
  inventory. The MaterialLabScene's own scaleStation (`MaterialLabScene.js:28-32`)
  uses `'mesquite_sample'` / `'mesquite_branch'` as aliases for the same
  conceptual material — **two different item id conventions for the same
  thing across the access gate vs. the scene that gate leads to.** The
  garage gate will *not* recognize a player who only holds the lab's
  variant ids.

- `seamlessTraversal.js:85-93` references `NeighborhoodScene` (legacy
  scene key) instead of `OverworldScene` (live scene key). Migrations in
  `config.js:78-80` rename the save key but do **not** rewrite the
  seamless adjacency table. Stale destination key.

- `WORLD_LOCATIONS.dry_wash.unlockReq.questsAny: ['bridge_collapse']`
  (`src/renderer/game/data/worldMapData.js:99`). Uses `questsAny`, which
  in `worldMapData.isLocationUnlocked` (line 139) checks
  `completed.includes(q)` only — not "active OR completed" like
  `sceneRegistry.questsAnyOrActive` does (`sceneRegistry.js:425-430`).
  Result: a player *currently on* `bridge_collapse` who has not yet
  completed it cannot unlock the DryWash location, even though the
  bridge quest's `build_bridge` step (with `scene: 'DryWashScene'`,
  `quests.js:1280`) explicitly sends them there. **Same category: quest
  step's target scene is gated by completing the very quest that the
  step belongs to.** (`MountainScene`'s unlock uses the correct
  `questsAnyOrActive` (`sceneRegistry.js:267`); the worldMap helper
  lacks the equivalent branch.)

- `OverworldScene.js:73`: `if (!sceneDef.worldPos) continue;` silently
  drops every scene with `worldPos: null` from the marker pass.
  `MaterialLabScene`, `ThermalRigScene`, `WorldMapScene`, all four world
  sub-scenes (`DesertForagingScene`, `CopperMineScene`, `SaltRiverScene`,
  `DryWashScene`) have `worldPos: null` (`sceneRegistry.js:85, 105, 281,
  299, 318, 341, 365`). All seven rely on a *different* mechanism for
  inbound traversal (door interactable / world-map node). For each, that
  mechanism is the *only* mechanism — there is no Overworld fallback.

---

## Adjacent categories worth flagging

### Category: `requiredObservation` step has no emitter (silent dead-ends)

Same data as above, condensed. 14 of 17 `requiredObservation` quest steps
will block the quest forever:

  - `food_chain_tracker.observe_mesquite` (`quests.js:279`): no emitter.
  - `food_chain_tracker.observe_javelina` (`quests.js:294`): no emitter.
  - `extract_dna.run_extraction` (`quests.js:544`): no emitter.
  - `understand_expression.simulate_rna` (`quests.js:597`): no emitter.
  - `understand_expression.simulate_expression` (`quests.js:613`): no emitter.
  - `engineer_bacteria.insert_gene` (`quests.js:682`): no emitter.
  - `engineer_bacteria.run_production` (`quests.js:689`): no emitter.
  - `bio_battery_integration.create_electrolyte` (`quests.js:742`): no emitter.
  - `the_living_fluid.find_fluid_zone` (`quests.js:815`): no emitter.
  - `the_living_fluid.cross_basin` (`quests.js:822`): no emitter.
  - `one_sided_forest.enter_topology_zone` (`quests.js:942`): no emitter.
  - `one_sided_forest.complete_loop` (`quests.js:949`): no emitter.
  - `invisible_map.enter_memory_zone` (`quests.js:1077`): no emitter.
  - `invisible_map.find_water_blind` (`quests.js:1084`): no emitter.
  - `perfect_composite.combine_materials` (`quests.js:1414`): no emitter.
  - `boat_puzzle.test_raft` (`quests.js:1483`): no emitter.
  - `engine_cleaning.use_surfactant` (`quests.js:1554`): no emitter.
  - `desert_coating.apply_coating` (`quests.js:1615`): no emitter.

### Category: hint references a workbench/lab/mechanism that does not exist as a Phaser interactable

  - `extract_dna.run_extraction` hint *"biology workbench"* (`quests.js:545`): no biology workbench in any scene.
  - `understand_expression.simulate_expression` hint *"biology workbench"* (`quests.js:614`): same.
  - `engineer_bacteria.insert_gene` hint *"biology workbench"* (`quests.js:683`): same.
  - `bio_battery_integration.create_electrolyte` hint *"chemistry chemicals"* (`quests.js:743`): no chemistry workbench.
  - `perfect_composite.combine_materials` hint *"material workbench to combine them"* (`quests.js:1415`): the Materials Lab has no combine UI; only sample-test buttons (`MaterialLabScene._mountLeftBayInstruments`, lines 540-613).
  - `engine_cleaning.use_surfactant` hint *"Use the surfactant on the clogged motor"* (`quests.js:1555`): no clogged-motor interactable in any scene.
  - `boat_puzzle.test_raft` hint *"Test your raft design in the simulation"* (`quests.js:1484`): no raft sim scene.
  - `desert_coating.apply_coating` hint *"material workbench to combine resin + wax"* (`quests.js:1616`): same as perfect_composite.

### Category: cross-scene id drift

  - Bridge quest grants `'mesquite_wood_sample'` etc.; lab consumes
    `'mesquite_sample' | 'mesquite_branch'` (`MaterialLabScene.js:28-32`).
    The garage door gate reads only the bridge ids
    (`ZuzuGarageScene.js:198-200`). A player whose save has the lab
    aliases would be locked out by the door despite holding the items
    the lab itself recognizes.

### Category: legacy scene keys still reachable via non-migrated systems

  - `seamlessTraversal.js:84-94` references the legacy `NeighborhoodScene`
    instead of `OverworldScene`. The save migration in
    `config.js:77-80` does not rewrite this table. Effect: the seamless
    edge sensor in `NeighborhoodScene.js:184` could fire (the legacy
    scene is registered), but only via stale save data that the
    migration is supposed to prevent — i.e. the edge is mapped to a
    scene the live flow never enters. Latent dead edge.

### Category: world-map gating pattern lacks `questsAnyOrActive`

  - `worldMapData.js:130-144` (`isLocationUnlocked`) only honors
    `questsAny` (completed) and `questsAll` (completed). The richer
    `sceneRegistry.questsAnyOrActive` predicate (`sceneRegistry.js:425-430`)
    does not exist here. `dry_wash` is the only WORLD_LOCATION that
    needs it (`worldMapData.js:99`); all other world locations use
    completion-based gates that are valid as written. This single
    location gate makes `bridge_collapse.build_bridge` (whose
    `step.scene = 'DryWashScene'`, `quests.js:1280`) reach a locked
    travel node until the quest is *already* completed.
