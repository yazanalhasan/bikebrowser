# Items 1–8 Implementation Playbook + Agent Attribution
**Date:** 2026-04-27
**Author context:** assembled from tonight's three-task fix session, the
2026-04-27 scene-access audit (commit `94919e2`), the bug log
(`.claude/bugs/2026-04-27-quest-engine-and-traversal.md`), and the
five `static-only-fix` commits shipped tonight (`f75d6ae`, `1ce8324`,
`941b42f`, `eef75cb`, `8b69696`).

This document is **planning, not implementation**. No code dispatch
should happen from a quick scan of this file — read the relevant
section in full before kicking off any agent.

---

## Section A — Per-item dispatch instructions

### A.1 — Wire the remaining 13 unwired `requiredObservation` quest steps

**Background.** The audit (`scene-access-audit.md`) found 14 of 17
`requiredObservation` quest steps had no emitter anywhere in
`src/`. Tonight's Fix 6 wired `coating_applied`, leaving **13**:

| Observation | Quest | Step |
|---|---|---|
| `mesquite` | food_chain_tracker | observe_mesquite |
| `javelina` | food_chain_tracker | observe_javelina |
| `dna_extracted` | extract_dna | run_extraction |
| `rna_extracted` | understand_expression | simulate_rna |
| `expression_simulated` | understand_expression | simulate_expression |
| `gene_inserted` | engineer_bacteria | insert_gene |
| `bio_production_complete` | engineer_bacteria | run_production |
| `bio_electrolyte_created` | bio_battery_integration | create_electrolyte |
| `fluid_zone_found` | the_living_fluid | find_fluid_zone |
| `basin_crossed` | the_living_fluid | cross_basin |
| `topology_zone_entered` | one_sided_forest | enter_topology_zone |
| `topology_loop_completed` | one_sided_forest | complete_loop |
| `memory_zone_entered` | invisible_map | enter_memory_zone |
| `water_found_blind` | invisible_map | find_water_blind |
| `composite_created` | perfect_composite | combine_materials |
| `buoyancy_test_passed` | boat_puzzle | test_raft |
| `motor_cleaned` | engine_cleaning | use_surfactant |

(That's 17; subtract `mesquite`, `javelina`, `motor_cleaned` if you
prefer the 13-count. The two food-chain observations are scene-entry
triggers and the engine-cleaning is a workshop interaction — they're
genuine workflow gaps. The other 14 cluster around
biology/topology/fluid systems that don't have substrate yet.)

**Hard rule from arc.md Section 8.5:** quests that consume the
biology workbench (8 of the 13) cannot be wired before the biology
substrate design lands (item A.5). Doing them now would lock in a
substrate design choice through implementation order.

**Pre-flight checks** (one-step-ahead pattern):
1. Confirm A.5 (biology substrate) and A.8 (knowledge state) design
   conversations are at least drafted before wiring any biology
   observation.
2. Confirm the *item economy* (Bug 4–6 in the bug log) for each
   quest's prerequisite items has been resolved — a quest that
   requires item X to emit observation Y cannot be wired before X
   has a source. See item A.4.
3. Confirm `data/sceneItemGrants.js` exists and is the canonical
   item-source registry (or build it as part of A.4).

**Agent selection.** No existing agent's scope cleanly covers
"per-quest emitter wiring." Two viable patterns:
- **(A) New agent: `quest-observation-wirer`** — narrow scope, one
  quest per dispatch, hard rule: only emit existing-named
  observations to existing scenes.
- **(B) Per-quest dispatch via `general-purpose`** — uses one custom
  prompt per quest. More overhead but no new agent definition.

**Recommendation:** Build the new `quest-observation-wirer` agent
*after* doing 2-3 quest wirings via general-purpose first. Wait
until the pattern is concrete before encoding it.

**Dispatch prompt template** (per quest):

```
QUEST OBSERVATION WIRING — <quest_id>.<step_id>

Context:
- See .claude/bugs/2026-04-27-scene-access-audit.md for the bug
  inventory.
- arc.md Section 8 for world-model alignment rules.
- The C3 quest engine fix (commit 922da63) is runtime-validated.
- The wiring discipline is "smallest possible change" — emit the
  observation from the most natural existing trigger; do NOT add a
  new mechanic, scene, or substrate as part of this dispatch.

Scope (single quest only):
1. Find the trigger surface for <step_id>. If it doesn't exist,
   halt-and-surface — do NOT invent it.
2. Add a single emitter that pushes <observation_id> to
   state.observations and persists via saveGame.
3. If the step expects a precondition item, verify the item has a
   source (sceneItemGrants.js or a quest grant). If not,
   halt-and-surface and refer to A.4.
4. If the trigger surface requires UI work that exceeds 50 LOC
   (new button, new interactable, new scene affordance),
   halt-and-surface — that's per-quest design, not pure wiring.

Hard rules:
- DO NOT touch questSystem.js (engine fix is correct).
- DO NOT modify the quest definition in quests.js (other than
  adding a step.scene field if missing — that's the only
  permitted quest-data edit, and it must reference an existing
  scene).
- DO NOT wire any other quest's emitters — exactly one quest
  per dispatch.

Output: per-quest receipt + commit message tagged
'static-only-fix'. Runtime validation by user mandatory.
```

**Runtime validation criterion** (per quest):
1. Player loads a save with the target quest active.
2. Player walks to the trigger surface (scene / interactable /
   workbench).
3. Trigger fires → console shows the observation pushed into
   `state.observations`.
4. Quest step advances on the next dialog dismissal.
5. Quest completes through to its reward dialog.
6. No regressions in the previously-wired quests
   (`bridge_collapse`, `heat_failure`, `desert_coating`).

**Verdict tag expected:** `runtime-validated` (per quest).

---

### A.2 — Fix 4 DISCOVERY_UNLOCKS audit false positives

**Background.** Bug 7 in the bug log:
`runtimeAudit.auditDiscoveryUnlocks()` validates keys against
`regions.js` IDs but `discoveryUnlocks.js` keys are correctly
WORLD_LOCATIONS IDs from `worldMapData.js`. The mismatch was
explicitly documented in `discoveryUnlocks.js:14-21` when the data
was written.

**Pre-flight checks:**
1. Confirm the audit-side fix is acceptable — no one is depending on
   the false-positive errors as gating signal.
2. Confirm `runtimeAudit.js` has a stable structure for adding
   alternate validation paths.
3. Verify there are no other `runtimeAudit` checks with the same
   coarseness pattern (audit currently flags region IDs only — any
   other check that should accept location IDs?).

**Agent selection.** Existing agent: **`runtime-audit-system`**.
This agent's scope is exactly the boot-time runtime audit. The fix
is in its domain.

**Dispatch prompt template:**

```
TASK — fix runtimeAudit.auditDiscoveryUnlocks coarseness

Bug 7 in .claude/bugs/2026-04-27-quest-engine-and-traversal.md.

Update auditDiscoveryUnlocks() to validate keys against the union
of (a) regions.js region IDs and (b) worldMapData.WORLD_LOCATIONS
IDs. Accept either as valid.

Justification: discoveryUnlocks.js:14-21 documents this exact
mismatch and recommends the fix. The data is correct at the
location-discovery granularity; the audit is too narrow.

Hard rules:
- DO NOT modify discoveryUnlocks.js (data is correct).
- DO NOT modify regions.js or worldMapData.js (data is correct).
- The fix is audit-side ONLY — read both data sources and accept
  union membership.
- Add a unit-test-style assertion in the audit so future
  divergence is caught.

Output: single-file edit to runtimeAudit.js. Build must pass.
Verdict tag: static-only-fix; runtime validation = boot the game,
confirm 0 DISCOVERY_UNLOCKS errors in console.
```

**Runtime validation criterion:** boot the game; console no longer
shows the 4 `DISCOVERY_UNLOCKS` ERRORs.

**Verdict tag expected:** `runtime-validated`.

**Estimated size:** <30 LOC, single file.

---

### A.3 — Classify 2 UNKNOWN-biome regions

**Background.** Bugs 8, 9. `chinese` and `malay` regions in
`regions.js` are tagged `BIOME.UNKNOWN` because the canonical
`BIOME` enum has no value for "multi-biome" or "tropical
rainforest / archipelago." The data file's inline comments
(`regions.js:479-481`, `:647-650`) explicitly document this.

**Two acceptable resolutions:**

- **(R1) Widen the enum.** Add `BIOME.JUNGLE` and/or
  `BIOME.MIXED`. Update terrain renderer to handle both. Audit
  passes; data improves.
- **(R2) Silence the audit for known-intentional UNKNOWNs.** Add
  an `acknowledgedUnknownBiomes` allowlist to `runtimeAudit.js`.
  Audit passes; data unchanged.

**Pre-flight checks:**
1. Decide R1 vs R2. R1 is more forward-leaning but has terrain-
   rendering implications (`world-terrain-renderer` agent's domain).
   R2 is purely audit-side and reversible. **Recommend R2 first;
   defer R1 until/if a future quest pod actually uses these regions.**
2. Confirm `world-terrain-renderer` doesn't already gracefully handle
   `BIOME.UNKNOWN` — if it does, R2 is harmless.

**Agent selection** (R2): **`runtime-audit-system`** (audit edit).
**Agent selection** (R1): **`world-biome-classifier`** (data edit) +
**`world-terrain-renderer`** (rendering update). Two agents in
sequence.

**Dispatch prompt template (R2 — recommended):**

```
TASK — silence intentional UNKNOWN-biome warnings

Bugs 8 & 9 in .claude/bugs/2026-04-27-quest-engine-and-traversal.md.

regions.js:479-481 and :647-650 document chinese/malay as
intentionally UNKNOWN biome (enum gap, not data error).

Add to runtimeAudit.js a small allowlist:
  const ACKNOWLEDGED_UNKNOWN_BIOMES = ['chinese', 'malay'];
…and skip the UNKNOWN-biome warn for entries in the allowlist.

Hard rules:
- DO NOT modify regions.js (data is intentional).
- DO NOT widen the BIOME enum here (that's R1, deferred).
- Add a comment block referencing both regions.js inline comments
  so future readers see the rationale.

Verdict tag: static-only-fix.
```

**Runtime validation criterion:** boot the game; console no longer
shows UNKNOWN-biome WARNs for chinese / malay. (Other regions, if
they later get UNKNOWN biome by mistake, still warn — the allowlist
is closed.)

**Verdict tag expected:** `runtime-validated`.

**Estimated size:** <15 LOC, single file.

---

### A.4 — Fix 3 INCOMPLETE_DATA item-source warnings

**Background.** Bugs 4, 5, 6 in the bug log:
- `healing_salve` (used by `desert_healer.use_salve`) — no source.
- `bio_sample_agave` (used by `extract_dna.collect_sample`) — no source.
- `bio_sample_bacteria` (used by `engineer_bacteria.collect_bacteria`) —
  no source.

Each requires either (a) a recipe / drop / shop entry that grants the
item, or (b) a quest reward, or (c) a scene-level grant in
`sceneItemGrants.js`.

**Pre-flight checks:**
1. Confirm `sceneItemGrants.js` exists and is the right home for these
   grants (vs in-quest rewards). If not, decide and document the
   pattern before wiring.
2. **For Bugs 5 & 6**: do not wire until A.5 (biology substrate)
   design lands. Wiring biology samples without the substrate
   pre-locks design.
3. **For Bug 4 (`healing_salve`)**: this is *not* biology-gated. It's
   a chemistry-recipe-style item. Can be wired independently.

**Agent selection.** No existing agent has scope for "add an item
source." Closest is `general-purpose` with a per-bug prompt, OR a
new agent: **`item-economy-wirer`** that takes (item_id, quest_id,
source_strategy) and wires one source.

**Recommendation:** general-purpose for Bug 4; defer Bugs 5 & 6 with
the rest of the biology block.

**Dispatch prompt template (Bug 4 only):**

```
TASK — wire healing_salve item source

Bug 4 in .claude/bugs/2026-04-27-quest-engine-and-traversal.md.

The desert_healer quest's use_salve step expects 'healing_salve'
in inventory. No system grants it.

Find the most natural source mechanism in the existing chemistry
recipe / foraging flow. Likely candidates (in priority order):
  1. desert_healer earlier step grants it as a reward
  2. DesertForagingScene as a foraged item
  3. ZuzuGarageScene workbench as a craft from creosote_leaves
     + something
Pick the one that requires the smallest patch (no new UI, no new
scene, no new mechanic).

Hard rules:
- DO NOT modify the engine.
- DO NOT wire bio_sample_agave or bio_sample_bacteria — those
  block on biology substrate design.
- The fix is item-source ONLY — do not also wire the use_salve
  observation emitter (that's A.1).

Verdict tag: static-only-fix.
```

**Runtime validation criterion:** player on `desert_healer`
quest reaches the source mechanism, gains `healing_salve` in
inventory.

**Verdict tag expected:** `runtime-validated`.

**Estimated size:** <30 LOC, 1-2 files.

---

### A.5 — Biology workbench substrate (CONVERSATION, not dispatch)

**Background.** arc.md Section 4 → "Biology Workbench" is the
single largest unbuilt system. arc.md Section 6 lists three open
design questions specifically about it:
- Stage 2 unlock trigger
- Engineered-organism consequence model
- Portability mechanism

**Why this is a conversation, not a dispatch.** The biology
substrate is the *foundation* for 8 of the 13 unwired observations
in A.1. Dispatching implementation before the design conversation
would lock in answers to design questions through code.

**Required design outputs before any biology dispatch:**
1. `biology-substrate.md` design doc covering:
   - Stage 1 (recipe biology) data schema and UI primitives.
   - Stage 1 → Stage 2 unlock trigger.
   - Stage 2 (parametric biology) parameter space schema.
   - Stage 3 (simulation biology) ecosystem model schema.
   - Engineered-organism consequence boundary (in-simulator only,
     in-game cosmetic, or in-game material).
   - Portability mechanism (item, ship-module, permanent unlock).
2. arc.md Section 4 amendment if substrate design changes carry-
   forward expectations.
3. **Cultural representation gate**: arc.md Section 2 cultural rule
   says cultural-context content (medicine plants etc.) needs
   human-authored design briefs. Confirm before dispatching.

**Conversation participants:** human (decision authority),
arc.md as authoritative source. No agent.

**Output:** `biology-substrate.md` design doc + arc.md amendment
commit (if needed).

**Verdict tag:** N/A — design conversation.

---

### A.6 — UX safety violations on /play

**Background.** Tonight's Explore agent finding: `AppLayout.jsx:27,42`
intentionally bypasses chrome on `/play` (game route — immersive
mode). `uxSafety.js:12-185` doesn't exempt the `/play` route, so 4
checks fire as false-positive CRITICALs at every game boot.

**Pre-flight checks:**
1. Confirm AppLayout's `/play` chrome-bypass is the intended design.
   Read the line-39 comment ("ZERO app chrome") in
   `AppLayout.jsx`. If the design has changed, the bypass should
   be re-evaluated, not the audit.
2. Confirm there are no *other* routes that legitimately bypass
   chrome (e.g., `/fullscreen`, `/embed`). If so, generalize the
   exemption to a route allowlist rather than hard-coding `/play`.

**Agent selection.** No existing agent has scope for `uxSafety.js`.
Closest is `general-purpose` with a focused prompt. The change is
small enough to not need a dedicated agent.

**Dispatch prompt template:**

```
TASK — exempt /play route from uxSafety chrome checks

Read-only investigation already complete (tonight's session, see
the H5-style verdict in conversation history): AppLayout.jsx
intentionally renders /play without header / nav / home button
(immersive game mode). uxSafety.js does not exempt /play, so all
4 chrome checks fire as false positives.

Update src/renderer/utils/uxSafety.js:
  1. Add a ROUTE_EXEMPTIONS map. Initial entry: '/play' exempts
     'MUST_HAVE_HOME_BUTTON', 'MUST_HAVE_HEADER',
     'MUST_HAVE_NAV_CONTAINER', 'NO_EMPTY_SCREEN'.
  2. enforceUXRules() reads the current pathname and skips
     exempted rules.
  3. Add a comment referencing AppLayout.jsx:27,42 so future
     readers see why these are exempted.

Hard rules:
- DO NOT modify AppLayout.jsx (chrome bypass is intentional).
- DO NOT broaden the exemption beyond /play in this dispatch.
- Verdict tag: static-only-fix.
```

**Runtime validation criterion:** boot the game, navigate to `/play`,
console no longer shows the 4 CRITICALs. Other routes still trigger
the checks (smoke test by visiting `/`).

**Verdict tag expected:** `runtime-validated`.

**Estimated size:** <30 LOC, single file.

---

### A.7 — NeighborhoodScene ↔ OverworldScene save migration

> **REFRAMED 2026-04-27 (user decision).** A.7 reframed — navigation
> paradigm is a committed-canon design conversation, not a fix. Three
> substrate docs now blocking A.1: biology, knowledge state, navigation.
>
> The three options below (O1 quarantine / O2 resurrect / O3 rewrite)
> predate the user's stated preference for side-scrolling navigation as
> a committed paradigm. The actual answer is closer to "O2 with a design
> doc first" — a `navigation-substrate.md` conversation that defines
> when scenes use edge-walking vs marker-based traversal, parallel to
> the `biology-substrate.md` (A.5) and `knowledge-state-substrate.md`
> (A.8) gates. That conversation is human design work; orchestrator
> dispatch is blocked until the substrate doc lands.
>
> A.7 is therefore SKIPPED in the current implementation session. The
> three options remain documented below as inputs to the design
> conversation, not as dispatch candidates.

**Background.** Tonight's Fix-1 halt. The seamless edge in
`seamlessTraversal.js:84-94` references the legacy `NeighborhoodScene`
which `config.js:77-80` migration redirects away. The result: the
seamless edge is architecturally orphaned. OverworldScene is
marker-based, not edge-walking — wiring `attachEdgeSensor` there
isn't a small change.

**Three options** (decide before dispatch):

- **(O1) Quarantine.** Delete the SCENE_ADJACENCY entries for
  Neighborhood ↔ DryWash. Keep the `attachEdgeSensor` /
  `performSeamlessTransition` / `applySeamlessEntry` primitives as
  documented future-foundation. NeighborhoodScene + GarageScene
  stay registered for save migration but stop being seamless edges.
  **Smallest, reversible.**
- **(O2) Resurrect.** Make NeighborhoodScene a live, walkable scene
  that the player can re-enter. Add an OverworldScene marker that
  enters NeighborhoodScene; route DryWashScene's west-edge back to
  Neighborhood instead of the WorldMap. **Largest, possibly
  exceeds 50 LOC.**
- **(O3) Wholesale rewrite of OverworldScene to add edge-walk
  semantics.** Wire `attachEdgeSensor` on OverworldScene with a
  custom adjacency map. **Architectural shift; do not pursue
  without an arc.md amendment.**

**Recommendation:** O1 in the next session. Cheap, honest, doesn't
foreclose O2 or O3.

**Pre-flight checks:**
1. Confirm grep across `src/` shows no other consumers of
   `SCENE_ADJACENCY[NeighborhoodScene]` or
   `SCENE_ADJACENCY[DryWashScene].west`.
2. Confirm `DryWashScene` still has at least one entry mechanism
   after the edge is removed (it does — `WorldMapScene.dry_wash`
   marker, now unlocked by tonight's Fix 5).
3. If O1: confirm the `phaser-traversal-system` agent definition
   doesn't claim Neighborhood ↔ DryWash as a load-bearing demo —
   if it does, edit the agent definition first (see Section B).

**Agent selection.** O1 fits **`phaser-traversal-system`**'s scope
*if* the agent definition is amended to clarify "primitive only,
no live edges." Otherwise general-purpose with a focused prompt.

**Dispatch prompt template (O1):**

```
TASK — quarantine the orphaned Neighborhood ↔ DryWash seamless edge

Per .claude/bugs/2026-04-27-scene-access-audit.md "legacy scene
keys still reachable via non-migrated systems":
seamlessTraversal.js:84-94 references the legacy NeighborhoodScene
which config.js:77-80 redirects via SCENE_KEY_MIGRATION; players
never arrive at NeighborhoodScene in the modern flow, so the
seamless edge cannot fire from this side.

Delete the SCENE_ADJACENCY entries for NeighborhoodScene and
DryWashScene from seamlessTraversal.js. Keep all primitives
(attachEdgeSensor, performSeamlessTransition, applySeamlessEntry,
SCENE_ADJACENCY exported as an empty object) — they're the
foundation for any future edge-walkable scene.

Add a comment block above the (now empty) SCENE_ADJACENCY export
explaining the quarantine and pointing at this playbook's A.7
section for context.

Also remove the attachEdgeSensor + performSeamlessTransition call
sites in NeighborhoodScene.js:184 and DryWashScene.js:99-100, but
leave the imports + functions in case future scenes wire them.

Hard rules:
- DO NOT delete the seamlessTraversal module.
- DO NOT modify any scene's create() flow except for the two
  call sites identified above.
- Verdict tag: static-only-fix.
```

**Runtime validation criterion:** boot the game, walk to
DryWashScene via the world map, confirm no traversal-related
errors in console. Walk back via world-map (no seamless edge to
test).

**Verdict tag expected:** `runtime-validated`.

**Estimated size:** ~30 LOC removed, 1 comment block added, 2-3
files (seamlessTraversal, NeighborhoodScene, DryWashScene).

---

### A.8 — Knowledge State System design (CONVERSATION, not dispatch)

**Background.** arc.md Section 8.5 explicitly gates this system:
*"NO system may consume knowledge-state queries before that design
doc lands."* Several quests (especially the biology and topology
ones) imply they want a Seen/Interacted/Understood model.

**Required design outputs before any knowledge-state dispatch:**
1. `knowledge-state-substrate.md` design doc covering:
   - Three-state model (Seen / Interacted / Understood).
   - Storage shape (state.knowledge.* schema).
   - Query API (`hasUnderstood(concept_id)`, etc.).
   - Boundary between knowledge state (conceptual) and
     discovery state (geographic) per arc.md 8.5.
2. arc.md Section 8.5 update to reflect the doc landing.

**Conversation participants:** human + arc.md. No agent.

**Output:** `knowledge-state-substrate.md` design doc.

**Verdict tag:** N/A — design conversation.

---

### A.9 — Ecology substrate (EcologyEntity carry-forward) — phased dispatch

**Background.** Per the Phase 0 + Phase 1 audit at
`.claude/bugs/2026-04-27-ecology-substrate-vs-static-layout-audit.md`,
the recommendation is **Path B**: port the procedural ecology model
(`populateWorld` + PLANT_ECOLOGY + PREDATOR_CHAINS) into a portable
carry-forward system at `src/renderer/game/systems/ecology/`, with no
scene imports inside the system. This is the Act-1 progenitor of the
arc.md §4 Stage-3 Simulation Biology workbench.

The audit also confirms (re-grep against tree at commit `8973d34`)
that **zero current quest is blocked by the orphan**, so this work is
*architectural*, not *bug-driven*. It runs parallel to A.5 (biology
substrate) and A.8 (knowledge state) as a third design-doc-gated
substrate.

**Phase structure.** Phases 2–8 from the audit map onto these
playbook items. Each is a separate dispatch.

#### A.9.1 — Phase 2: `ecology-substrate.md` design doc (CONVERSATION)

**Pre-flight checks:**
1. Re-confirm Path B vs Path C with the audit's §4 reasoning. If the
   curriculum benefit argument has shifted (e.g., arc.md §4 amends the
   Stage-3 design), re-run Phase 0.
2. Cross-check with A.5's `biology-substrate.md` if it has landed —
   the two schemas must align (ecology data feeds biology Stage-3).
3. Verify navigation-substrate decision (A.7 reframe) does not
   foreclose edge-walking in a way that blocks Phase 6.

**Agent selection:** none — human + arc.md.

**Output:** `.claude/specs/ecology-substrate.md` covering:
- `EcologyEntity` schema (species id, host-scene, observation hooks,
  visual token).
- Per-region serialization shape (`state.ecology[regionId]`).
- Tick / refresh schedule.
- Primitive declarations per arc.md §8.1.
- Asset-token boundary (separate from licensed asset import).

**Verdict tag:** N/A — design conversation.

#### A.9.2 — Phase 3: stand up `systems/ecology/` skeleton

**Pre-flight checks:**
1. A.9.1 doc must be drafted.
2. Confirm `data/ecology.js`, `data/flora.js`, `data/fauna.js` are
   read-only inputs for this dispatch (no schema edits).
3. Confirm the new system module has no scene imports (per arc.md §4).

**Agent selection:** `general-purpose` (no specialized agent for
ecology-substrate carry-forward yet; deferred per dispatch rule).

**Dispatch prompt template:**

```
TASK — stand up EcologyEntity system per ecology-substrate.md

Read .claude/specs/ecology-substrate.md (A.9.1 output) and
arc.md §4 (Carry-Forward Systems) + §8 (World Model Alignment).

Create src/renderer/game/systems/ecology/ with:
  - ecologyState.js  — per-region state shape, save/load hooks
  - ecologyQueries.js — read-only lookups (getSpeciesAt, etc.)
  - ecologyTicker.js  — deterministic populate / refresh
  - index.js          — barrel export

Move populateWorld() body into ecologyTicker.js. Keep
ecologyEngine.js as a thin wrapper for backwards compat with
NeighborhoodScene's existing import (do not break NeighborhoodScene
in this dispatch — quarantine fate decided in Phase 8).

Hard rules:
- No scene imports inside systems/ecology/.
- No edits to data/ecology.js, data/flora.js, data/fauna.js.
- Visual tokens (emoji / color) must come from data, not code.
- Declare primitive interactions per arc.md §8.1 in a header
  comment of each module.

Verdict tag expected: static-only — runtime validation in Phase 5.
```

**Runtime validation criterion:** game boots; NeighborhoodScene still
renders procedural flora/fauna identically to pre-dispatch behavior;
new system module's queries return the same shape.

**Verdict tag expected:** `runtime-validated` (after Phase 5 sweep).

#### A.9.3 — Phase 4: wire EcologyEntity to modern scenes

**Pre-flight checks:**
1. A.9.2 complete and runtime-validated.
2. Confirm StreetBlockScene + DogParkScene + DesertForagingScene
   layout JSON entries are stable (no in-flight layout edits).
3. Verify A.1 emitter wiring conventions (if any quests already
   wired). EcologyEntity's emitters must use the same observation
   string conventions as A.1.

**Agent selection:** `general-purpose` for the first scene; promote
to `quest-observation-wirer` (per A.1's recommendation) after
pattern emerges across scenes.

**Dispatch prompt template:**

```
TASK — attach EcologyEntity to <scene_name> existing static plants/animals

Read systems/ecology/index.js. For each plant/animal already drawn
by <scene_name> from layout data, attach a species id and (where
the quest engine names a requiredObservation) an emitter that
pushes the species name into state.observations on interaction or
proximity.

Hard rules:
- DO NOT add new sprites, new layout entries, or new mechanics.
- DO NOT touch layout JSON.
- DO NOT modify questSystem.js.
- DO NOT import licensed assets (separate dispatch).
- One scene per dispatch.

Verdict tag expected: static-only — runtime validation per scene.
```

**Runtime validation criterion:** player walks to the scene; observe
the species → console shows observation pushed; quest step advances.

**Verdict tag expected:** `runtime-validated`.

#### A.9.4 — Phase 5: progression-reachability re-validation

**Agent:** `runtime-audit-system` (post-A.2 .md amendment). Walk every
quest after A.9.2 + A.9.3; emit a delta report vs commit `8973d34`.
**Verdict tag expected:** `runtime-validated` (post boot test).

#### A.9.5 — Phase 6: procedural population layer (NAVIGATION-DEPENDENT)

Blocks on `navigation-substrate.md` (A.7 reframe). If marker-based wins,
deferred — procedural population needs edge-walking. Agent: `general-purpose`.

#### A.9.6 — Phase 7: Act-2 / Act-3 scaling pass

Blocks on A.5 (`biology-substrate.md`) + cultural-representation
briefs per arc.md §2 (naming any non-Sonoran species requires human
brief). Halt-and-surface if absent. Agent: `general-purpose`.

#### A.9.7 — Phase 8: legacy NeighborhoodScene + GarageScene cleanup

**Pre-flight checks:**
1. A.9.2–A.9.4 runtime-validated.
2. Confirm save migration in `config.js:77-80` already redirects
   players away from these scenes; deletion does not break loads.

**Agent selection:** `general-purpose`.

**Dispatch prompt template:**

```
TASK — retire legacy NeighborhoodScene and GarageScene

After EcologyEntity has subsumed populateWorld's role:
  - Remove NeighborhoodScene + GarageScene scene files.
  - Remove their config.js registrations; keep migration entries
    so existing saves load to ZuzuGarageScene / OverworldScene.
  - Confirm no other system imports them.

Hard rules:
- DO NOT delete data/ecology.js (canonical substrate).
- DO NOT delete ecologyEngine.js (thin wrapper retained).
- Verdict tag: static-only — runtime validation = boot a save in
  each migration-affected state and confirm load.
```

**Verdict tag expected:** `runtime-validated`.

---

#### A.9 sequencing summary

A.9.1 (design doc) blocks A.9.2.
A.9.2 (skeleton) blocks A.9.3, A.9.5.
A.9.5 (re-audit) is independent of A.9.6 / A.9.7.
A.9.6 blocks on `navigation-substrate.md`.
A.9.7 (Act-2/3) blocks on cultural-representation briefs.
A.9.8 (cleanup) is last and reversible.

Total LOC budget: ~1180 net (per audit Phase 1 §2).

---

## Section B — Agent attribution for bugs found in current session

### B.1 Per-bug attribution

Attribution is best-effort, based on commit history, file authorship
patterns, and the agent registry in the system prompt. Attributions
marked `unspecified` mean I couldn't pin a single agent without a
git-blame walk that wasn't worth tonight's time.

| Bug | Attribution | Confidence | Notes |
|---|---|---|---|
| Bug 1 — questSystem observe-step empty | `unspecified` | medium | Engine code predates the swarm-orchestrator era; the FIXME at line 199 was added by a later doc dispatch (commit `a2b9999`) which did not itself introduce the bug. |
| Bug 2 — east-edge traversal silent | `phaser-traversal-system` (originator) + save-migration author (orphan-er) | high | seamlessTraversal.js was created by phaser-traversal-system. The orphan condition came from save migration in `config.js:77-80` which the agent could not have anticipated. **Coordination gap, not a single-agent error.** |
| Bug 3 — pause storm | `unspecified` (resolved by intervening commit) | n/a | Diagnosis-only; cause unidentified. |
| Bug 4 — `healing_salve` no source | `unspecified` | low | Item declared in quests.js but never granted; quest data may have been authored by `phaser-bridge-quest-glue` or a similar quest-pod agent without item-economy hand-off. |
| Bug 5 — `bio_sample_agave` no source | `unspecified` (biology design block) | n/a | Biology substrate doesn't exist; item source is downstream of substrate. |
| Bug 6 — `bio_sample_bacteria` no source | `unspecified` (biology design block) | n/a | Same. |
| Bug 7 — DISCOVERY_UNLOCKS false positives | `runtime-audit-system` (audit) + `world-discovery-quests` (data) | high | Both shipped correctly *in isolation*; the validation contract was never explicitly negotiated. Coordination gap. |
| Bug 8 — `chinese` UNKNOWN biome | `world-biome-classifier` | high | Agent author marked it UNKNOWN due to enum gap. Inline comment documents the rationale. **Known data gap, not a defect.** |
| Bug 9 — `malay` UNKNOWN biome | `world-biome-classifier` | high | Same. |
| Materials Lab access (audit root cause) | `phaser-bridge-construction` or `phaser-bridge-quest-glue` (originator) | medium | The bridge-specific gate in `ZuzuGarageScene.js:198-208` is bridge-pod work; the gate was never generalized when desert_coating / perfect_composite were added. |
| ID drift: `mesquite_wood_sample` vs `mesquite_sample`/`mesquite_branch` | `phaser-bridge-construction` (granted id) + `phaser-lab-notebook-pipeline` (consumed alias) | medium | Two pods used different conventions for the same conceptual item. Coordination gap. |
| `worldMapData.questsAny` lacks active-or-completed | `unspecified` | medium | Early world-map work; sceneRegistry's richer predicate came later. The world-map helper wasn't backfilled. |
| `coating_applied` no emitter | `unspecified` (desert_coating quest authors) | low | Quest authored before the C3 engine fix; emitter wiring was implicitly on the "downstream" list that never materialized. |
| /play UX violations | `unspecified` (uxSafety predates AppLayout chrome bypass) | medium | uxSafety.js was authored before AppLayout was updated to skip chrome on `/play`. The contract between them broke silently. |

### B.2 Agent fixes proposed

For each agent that owns a class of bug, the right intervention
depends on whether the agent's *definition* misled it, or the
agent's *output* needs revision, or both.

#### `phaser-traversal-system`
- **Issue:** the agent shipped a SCENE_ADJACENCY table referencing
  legacy NeighborhoodScene without verifying the scene was reachable
  in the live flow.
- **Edit .md:** add a hard rule to the agent definition:
  > "Before adding any entry to SCENE_ADJACENCY, verify that BOTH
  > scenes are reachable in the modern flow (not redirected by
  > SCENE_KEY_MIGRATION, not orphaned in the scene graph). If
  > either side is unreachable, halt-and-surface — the seamless
  > edge cannot land on a scene the player never enters."
- **Re-run:** not currently needed — A.7's quarantine-O1 dispatch
  resolves the live defect. If a future seamless edge is needed
  (e.g., between two live scenes), the amended agent will apply.
- **Replace:** no.

#### `runtime-audit-system`
- **Issue:** the agent shipped `auditDiscoveryUnlocks()` that
  validates against region IDs while the data uses location IDs.
  The `data/discoveryUnlocks.js` inline comment even called this
  out — but the agent didn't read or honor that comment when the
  audit was authored.
- **Edit .md:** add a hard rule:
  > "Audit checks must consult the data file's inline documentation
  > before validating. If the data file's authors documented a
  > schema choice or a known mismatch with another data source, the
  > audit must accept that choice or halt-and-surface."
- **Re-run:** yes — for `auditDiscoveryUnlocks` specifically (item
  A.2). And once amended, the agent should sweep its other audit
  checks (`auditQuestNpcs`, `auditRegionBiomes`, etc.) against the
  same discipline.
- **Replace:** no.

#### `world-biome-classifier`
- **Issue:** marked `chinese`, `malay`, and one other region UNKNOWN
  due to enum gap. Documented in inline comments. Not a defect, but
  the agent should have raised the enum-gap as halt-and-surface.
- **Edit .md:** add a hard rule:
  > "If the existing BIOME enum has no value that fits a region's
  > primary biome, halt-and-surface a request to widen the enum
  > rather than tagging UNKNOWN. UNKNOWN is reserved for genuinely
  > ambiguous cases, not for known enum gaps."
- **Re-run:** yes if R1 is chosen for A.3. Otherwise no.
- **Replace:** no.

#### Bridge-pod agents (`phaser-bridge-construction`, `phaser-bridge-quest-glue`)
- **Issue:** the gating predicate at `ZuzuGarageScene.js:198-208` was
  authored as bridge-quest-specific. Subsequent quests that target
  the same lab were not anticipated.
- **Edit .md:** add a hard rule:
  > "When adding a scene-access gate (door, NPC condition, world-map
  > unlock), check whether the destination scene is intended to be
  > reachable from multiple quests. If yes, write the predicate
  > against `step.scene` membership or item-presence, not against
  > the specific quest's id + stepIndex."
- **Re-run:** not currently needed — tonight's Fix 2 + Fix 3
  already generalize the existing gates. But the rule is structural
  for future agent dispatches.
- **Replace:** no.

#### Lab + bridge ID drift (cross-agent)
- **Issue:** `phaser-bridge-construction` granted `mesquite_wood_sample`;
  `phaser-lab-notebook-pipeline` (or whoever shipped the lab's
  SAMPLE_ITEM_IDS) only listed `mesquite_sample`/`mesquite_branch`.
  Neither agent wrong in isolation.
- **Edit .md** (both agents):
  > "Item IDs are a cross-pod contract. When granting or consuming
  > an item, check the other side of the contract (granter vs
  > consumer) and reuse the existing canonical id. If the contract
  > is unclear, halt-and-surface to define the canonical id before
  > shipping."
- **Re-run:** not currently needed — tonight's Fix 4 added the
  canonical id to the lab's alias list.
- **Replace:** no.

#### `world-discovery-quests`
- **Issue:** shipped `discoveryUnlocks.js` keyed on location IDs
  while the audit was checking against region IDs. The inline doc
  flagged the mismatch correctly — the failure was on the audit
  side, not the data side. **Not actually at fault.**
- **Edit .md:** no change needed.
- **Re-run:** no.
- **Replace:** no.

#### `uxSafety` author (no agent — likely human or generic)
- **Issue:** shipped chrome-presence assertions without route
  awareness; AppLayout's later /play bypass broke the contract
  silently.
- **Edit .md:** N/A — no specific agent owns uxSafety. If a new
  agent ever takes ownership, codify the route-allowlist
  expectation in its definition.

### B.3 Patterns across multiple bugs

Three recurring patterns drive most of the bugs in this session:

#### Pattern 1 — Cross-agent contract drift
- Bug 2 (seamless ↔ migration), Bug 7 (audit ↔ data), Materials Lab
  gating (bridge-pod ↔ subsequent quest authors), ID drift (bridge ↔
  lab), uxSafety (audit ↔ AppLayout).
- **Cause:** agents author their domain in isolation; a later agent
  can break a downstream agent's invariants without either being
  individually wrong.
- **Structural mitigation:** the swarm-orchestrator should require
  every agent definition to declare (a) its inputs (what data
  contracts it depends on), (b) its outputs (what data contracts
  it provides). When a new agent's outputs would invalidate an
  existing agent's inputs, halt-and-surface for explicit
  reconciliation.
- **arc.md Section 8.1 already speaks to this** ("primitive
  declarations on every carry-forward system"). The discipline
  needs to extend from carry-forward systems to *all* shared
  contracts: scene IDs, item IDs, observation strings, audit
  contracts.

#### Pattern 2 — Item economy is fragmented
- Bugs 4, 5, 6, plus tonight's coating_applied work.
- **Cause:** quest authors declare items the quest needs without
  guaranteeing a source; emitter authors push observations without
  guaranteeing a precondition path.
- **Structural mitigation:** before any quest-authoring dispatch
  ships, the agent must verify (a) every `requiredItem` has a
  source, (b) every `requiredObservation` has an emitter (or is
  flagged in the playbook as future work). The runtime audit
  already partially does this — the gap is at agent-dispatch time,
  not at boot time.
- This is the structural reason A.4 exists as a separate item
  rather than being folded into A.1.

#### Pattern 3 — Audit checks narrower than data
- Bug 7 (region-ID-only validation), Bugs 8 & 9 (enum-strict
  validation without exemption for documented intentional gaps),
  /play UX (route-blind chrome assertions).
- **Cause:** audit code is written quickly in response to a single
  failure mode without considering the full surface of the data
  it's validating.
- **Structural mitigation:** every audit check that reports an
  ERROR must have a corresponding "known acknowledged exemption"
  list, defaulted empty, populated when the data author documents
  an intentional case. Reduces noise, surfaces real bugs.

---

## Section C — Sequencing recommendation

### Sequencing principles

1. **Agent-definition fixes before agent re-runs.** A re-run of a
   buggy agent without the .md fix will repeat the bug.
2. **Cheap-and-clearing first.** Items that clear console noise
   (A.6, A.2, A.3) make subsequent runtime tests legible.
3. **Architectural decisions before implementations they gate.** A.5
   and A.8 design conversations gate large blocks of A.1 wiring.
4. **A.7 before A.1's traversal-style observations.** A.1 entries
   like `fluid_zone_found`, `topology_zone_entered` may want to use
   the seamless-traversal primitive — A.7's quarantine settles
   whether that primitive is alive or dead.

### Recommended order

| Step | Item | Rationale |
|---|---|---|
| 1 | **Agent .md edits** for `phaser-traversal-system`, `runtime-audit-system`, `world-biome-classifier`, bridge-pod agents (5 .md edits, ~10 LOC each) | Pure planning; prevents next dispatch from regressing. Do all five in one batch. |
| 2 | **A.6 — UX safety on /play** | Clears 4 boot CRITICALs. Smallest fix; runtime test takes 30 seconds. |
| 3 | **A.2 — DISCOVERY_UNLOCKS audit** | Clears 4 boot ERRORs. Uses runtime-audit-system *post-.md-edit*. |
| 4 | **A.3 — UNKNOWN biome audit** (R2) | Clears 2 boot WARNs. Uses runtime-audit-system. Defer R1 (enum widening) until a quest pod actually needs it. |
| 5 | ~~A.7 — Neighborhood ↔ Overworld quarantine (O1)~~ **DEFERRED 2026-04-27** | Reframed as a navigation-paradigm design conversation, not a fix. Output: `navigation-substrate.md` (parallel to A.5 / A.8). See top of A.7 section. |
| 6 | **A.4 — `healing_salve` source only** | Independent of biology; gives one of the three INCOMPLETE_DATA warnings a fix. Bugs 5 & 6 deferred until A.5 lands. |
| 7 | **A.5 — Biology substrate design conversation** | Human decision. Output: `biology-substrate.md` + arc.md amendment. Gates 8 of A.1's observations + Bugs 5 & 6 of A.4. |
| 8 | **A.8 — Knowledge state system design conversation** | Human decision. Output: `knowledge-state-substrate.md`. Gates the topology / invisible-map / understanding observations in A.1. |
| 8b | **NEW — Navigation substrate design conversation** | Human decision (added 2026-04-27). Output: `navigation-substrate.md`. Defines when scenes use edge-walking vs marker-based; gates the seamless-edge wiring previously scoped under A.7 + the traversal-style A.1 observations (`fluid_zone_found`, `topology_zone_entered`, etc.). |
| 9 | **A.1 — non-biology, non-knowledge, non-navigation quest wiring** (subset that doesn't require traversal-style observations) | One per dispatch via general-purpose. Pattern emerges. |
| 10 | **`quest-observation-wirer` agent** | After ~3 quests via general-purpose, if the pattern is consistent, codify it as a new agent. Skip if the pattern doesn't generalize. |
| 11 | **A.1 — biology + knowledge + navigation quest wiring** (8+ quests) | Per-quest, post-design-doc. |

### Agent-fix → item-dispatch dependency graph

```
phaser-traversal-system .md edit  →  A.7 (and any future seamless work)
runtime-audit-system .md edit     →  A.2, A.3 (R2)
world-biome-classifier .md edit   →  A.3 (R1 only)
bridge-pod agents .md edits       →  future quest-pod dispatches (no
                                      immediate item)
```

A.6 has no agent dependency (no specific agent owns uxSafety).

A.4-Bug-4, A.5, A.7, A.8 have no agent dependency beyond what's in
the .md-edit batch.

A.1 has agent dependency on item 10 (the new
`quest-observation-wirer` agent), which itself depends on items 6
and 9 establishing the pattern first.

### What I recommend for the *next* session

If the next session is short (≤2 hours):
- Items 1–4 (.md edits + A.6 + A.2 + A.3). All small, all clear
  console noise, all low risk. One coherent "audit cleanup" arc.

If the next session is medium (≤4 hours):
- Add A.7 quarantine and A.4-Bug-4 (`healing_salve`). Now you've
  cleared all the post-tonight audit noise and resolved the
  Fix-1 halt.

If the next session is long or design-focused:
- Run A.5 and A.8 design conversations. These can't be agents;
  they need human judgment. They unblock A.1's largest block.

A.1 should NOT be the next session unless A.5, A.8, AND
`navigation-substrate.md` (added 2026-04-27 — see A.7 reframe block)
are at least drafted — wiring biology, knowledge-state, OR
traversal-style observations without their substrate designs
pre-locks design choices.

---

*End of playbook.*
