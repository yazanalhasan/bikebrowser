# Bug log — quest engine + traversal + pause storm
**Date:** 2026-04-27
**Source:** runtime testing of the Phaser DryWash pod after closure
**Status:** all three diagnosed statically; all three pending runtime-validated fixes

---

## Bug 1 — `questSystem.advanceQuest()` observe-branch is empty

### Where
`src/renderer/game/systems/questSystem.js:199-202`

```js
if (step.type === 'observe') {
  // Observe steps auto-advance when the player is near the target
  // The scene handles detection; if we reach advanceQuest, it's met
}
```

### Evidence
The user's save state shows `bridge_collapse`, `food_chain_tracker`, and
`desert_coating` in `completedQuests` while the corresponding
`requiredObservation` values are absent from `state.observations`.
Only `load_test_completed` is in `observations` — that's the one
observation type the user actually triggered (via the UTM material
testing flow).

The empty branch fires whenever a dialog tagged with the active quest
closes, because `LocalSceneBase.advanceFromDialog` calls
`advanceQuest(state)` blindly without checking the step's
`requiredObservation`. Result: every `observe` step in the codebase
silently auto-advances on dialog dismissal.

### Affected quests (19 of 21 `requiredObservation` values are unwired)

Out of the 21 unique `requiredObservation` strings in `quests.js`,
only **2** have an emission code path in `src/renderer/game/`:

| Wired ✓ | Emitter |
|---|---|
| `bridge_built` | `systems/construction/constructionSystem.js:530` (driven by `data/blueprints/bridgeBlueprint.js:39`) |
| `load_test_completed` | `scenes/LabRigBase.js:537` (currently only used by `MaterialLabScene`) |

The other 19 have **no emission code** anywhere in the codebase. If
the engine fix lands without their emissions also being wired, those
19 quests become unbeatable. The list:

| Observation | Quest | Where it should fire |
|---|---|---|
| `mesquite` | food_chain_tracker | scene-level on plant proximity (not wired) |
| `javelina` | food_chain_tracker | scene-level on NPC sighting (not wired) |
| `dna_extracted` | extract_dna | bio system (not wired) |
| `rna_extracted` | understand_expression | bio system (not wired) |
| `expression_simulated` | understand_expression | bio system (not wired) |
| `gene_inserted` | engineer_bacteria | bio system (not wired) |
| `bio_production_complete` | engineer_bacteria | bio system (not wired) |
| `bio_electrolyte_created` | bio_battery_integration | bio system (not wired) |
| `fluid_zone_found` | the_living_fluid | scene entry trigger (not wired) |
| `basin_crossed` | the_living_fluid | scene entry trigger (not wired) |
| `topology_zone_entered` | one_sided_forest | scene entry trigger (not wired) |
| `topology_loop_completed` | one_sided_forest | scene loop logic (not wired) |
| `memory_zone_entered` | invisible_map | scene entry trigger (not wired) |
| `water_found_blind` | invisible_map | scene logic (not wired) |
| `thermal_expansion_observed` | heat_failure | LabRig (config not present) |
| `composite_created` | perfect_composite | LabRig (config not present) |
| `buoyancy_test_passed` | boat_puzzle | LabRig (config not present) |
| `motor_cleaned` | engine_cleaning | workshop scene (not wired) |
| `coating_applied` | desert_coating | workshop scene (not wired) |

### Proposed fix approach
Three-line gate in the observe branch:

```js
if (step.type === 'observe') {
  if (step.requiredObservation &&
      !state.observations?.includes(step.requiredObservation)) {
    return { state, ok: false, message: step.hint || `Observe: ${step.requiredObservation}` };
  }
}
```

**Important caveat:** ship the gate alongside a Layer-2 audit decision
for the 19 unwired quests. Three options:
- (A) Wire each missing emission (real work, days)
- (B) Auto-emit on dialog dismissal as a transition shim (preserves bug, dishonest)
- (C) Mark unwired quests with `prerequisite: 'TODO_emit_<observation>'`
      so they don't appear as available until their emission lands

Recommend **C** for tonight's session — keeps the engine honest,
defers content wiring to per-quest sessions later.

### Verification protocol (runtime, user)
1. Resume existing save → all currently completed quests must still
   appear as completed (no retroactive uncomplete).
2. Use the inspect-save tool to manually remove `bridge_collapse` from
   `completedQuests`, then play the quest from start. After Mr. Chen's
   "go build the bridge" dialog, the quest must NOT auto-complete on
   subsequent dialog dismissal — it must wait for the actual
   `bridge_built` observation from `completeBuild()`.
3. Confirm `state.observations` now contains `bridge_built` after
   building, and the quest advances exactly then.
4. For one of the 19 unwired quests, confirm it now sits at its
   observe step instead of auto-completing (gate working) — OR
   confirm the prerequisite TODO is hiding it from availability
   (option C taken).

---

## Bug 2 — East-edge transition fires sensor code path but produces no scene transition at runtime

### Where
- `src/renderer/game/scenes/NeighborhoodScene.js:179-184` (sensor wiring)
- `src/renderer/game/systems/seamlessTraversal.js` (whole module)

### Evidence
Static analysis confirms wiring is correct:
- `SCENE_ADJACENCY.NeighborhoodScene.east → DryWashScene.west` (and reverse)
- `attachEdgeSensor(this, this.player, ...)` is called in NeighborhoodScene
  `create()`
- `performSeamlessTransition` is the callback passed to the sensor

The user walked Zuzu off the east edge of NeighborhoodScene; nothing
happened. No scene transition, no console error, no fade. The sensor
either isn't being created in the right position, isn't firing the
overlap callback, or the callback isn't reaching `scene.scene.start()`.

### Diagnosis
**NOT YET COMPLETED — needs runtime instrumentation.**
Static trace cannot detect runtime sensor failure. Recommended
investigation pattern (per tonight's plan):
1. Add `console.log` at every step of the sensor pipeline:
   - `attachEdgeSensor` — log each zone's bounds when created
   - The overlap callback — log when it fires (or fails to)
   - `performSeamlessTransition` entry — log all params
   - `applySeamlessEntry` entry — log all params
2. Walk east in the running game.
3. Console output reveals which link in the chain is silent.

### Proposed fix approach
Cannot specify until runtime instrumentation reveals which step
breaks. Likely culprits in order of probability:
- Sensor zone is positioned outside the player's actual walkable
  range (east edge of canvas vs. east edge of physics world differ)
- Sensor zone lacks proper Phaser physics-body activation
- Overlap callback fires but `performSeamlessTransition` early-returns
  on a missing adjacency lookup (typo in scene key?)
- `scene.scene.start()` fires but the destination scene crashes on
  init (look for an unhandled `init({entryEdge, vx, vy, facing})`)

### Verification protocol (runtime, user)
1. With logs in place, walk east; the console must show every step
   firing in order.
2. After fix: walk east, scene transitions to DryWashScene, player
   spawns at the west edge with preserved velocity, no flash, no
   error.
3. Walk west out of DryWashScene; transitions back to NeighborhoodScene
   at the east spawn. (Reverse direction was wired in
   SCENE_ADJACENCY.)

---

## Bug 3 — `scene.restart()` in LayoutEditorOverlayScene causes pause-storm warnings

**Status: RUNTIME-CONFIRMED FIXED 2026-04-27.** Verified across two save
cycles (ZuzuGarageScene and StreetBlockScene). Zero
"Cannot pause non-running Scene" warnings. `_findActiveLocal` sees
`count=2` cleanly on every call.

Cause: appears to have been resolved by an intervening commit between
the original report (earlier today) and the C1 diagnostic test
(commit `23de6c4` shipped Phase 1 instrumentation; the storm was
already gone before any fix landed). Specific commit not isolated.

Diagnostic instrumentation in `23de6c4` (the `[pause-storm-debug]`
tagged console.log calls) is intentionally retained as stable
diagnostic tooling — if the storm ever recurs, the tag makes it
immediately visible. Cost is one log line per save cycle.

Verdict for commit `23de6c4`: `runtime-validated` (the bug the
instrumentation was diagnosing is fixed; the instrumentation itself
is now stable diagnostic infrastructure).



### Where
`src/renderer/game/scenes/LayoutEditorOverlayScene.js` (save handler)

### Evidence
After hitting save in the layout editor, DevTools console fills with
~20 `Cannot pause non-running Scene <key>` warnings, one per
registered scene. Sometimes repeats over multiple frames.

### Diagnosis
Likely some pause-everything iteration on the scene manager (probably
inherited from a save-state freeze pattern in Phaser, or a hand-rolled
loop) that doesn't filter for actually-running scenes before calling
`pause()`. `scene.restart()` triggers a teardown path that fires the
pause loop, but the registered scenes that haven't booted this session
throw the warning.

### Proposed fix approach
Find the iteration that calls `pause()` across all scenes. Filter by
`scene.sys.isActive() || scene.sys.isPaused()` before pausing. Or
simply pause only the directly-relevant scene rather than
broadcasting.

### Verification protocol (runtime, user)
1. Open layout editor (F2), edit a position, save. Console must show
   zero `Cannot pause non-running Scene` warnings (or, if Phaser
   itself emits them under some condition, exactly one — for the
   actually-restarting scene).
2. Repeat 3 times in a session; no warning accumulation.

### Severity
Cosmetic. No functional break. The editor save still works; the
console is just noisy. Lowest priority of the three bugs.

---

## Surfaced 2026-04-27 by progressionReachabilityAudit (out of scope tonight)

Three additional `[INCOMPLETE_DATA]` warnings fired during the C1
runtime test. Documented here for future per-quest wiring sessions.
Not blockers for tonight's three-task plan.

### Bug 4 — `healing_salve` has no source
- **Quest/step:** `desert_healer` step `use_salve`
- **Audit message:** `WARN [INCOMPLETE_DATA] healing_salve has no source`
- **Implication:** the quest expects the player to use a healing salve
  but no recipe, drop, shop entry, or scene-level grant produces one.

### Bug 5 — `bio_sample_agave` has no source
- **Quest/step:** `extract_dna` step `collect_sample`
- **Audit message:** `WARN [INCOMPLETE_DATA] bio_sample_agave has no source`
- **Implication:** the bio system isn't yet wired (consistent with the
  Bug 1 unwired-observation list — `dna_extracted` lacks an emitter and
  the precondition sample lacks a source).

### Bug 6 — `bio_sample_bacteria` has no source
- **Quest/step:** `engineer_bacteria` step `collect_bacteria`
- **Audit message:** `WARN [INCOMPLETE_DATA] bio_sample_bacteria has no source`
- **Implication:** same root cause as Bug 5. The bio workbench (per
  arc.md Section 4) is unbuilt; sample acquisition steps for its
  quests have no item sources yet.

### Disposition
Schedule for the per-quest wiring sessions referenced in
`.claude/plans/observation-wiring-plan.md`. Bugs 5 and 6 specifically
should be tackled together when the biology workbench design lands
(currently deferred per arc.md Section 6 open questions).
