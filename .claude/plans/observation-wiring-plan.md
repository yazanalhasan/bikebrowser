# Observation Wiring Plan — 19 Unwired `requiredObservation` Quests
**Date:** 2026-04-27
**Dispatch:** per-quest design analysis (documentation only, zero code change)
**Source bug log:** `.claude/bugs/2026-04-27-quest-engine-and-traversal.md` (Bug 1)
**Companion engine fix:** scheduled tonight per `.claude/plans/tonight-2026-04-27.md`

## Summary

Nineteen `requiredObservation` values in `data/quests.js` have no corresponding
emission code path. Analyzed against the existing scene/system inventory.
Effort breakdown:

| Effort | Count | Observations |
|---|---|---|
| **TRIVIAL** (1–30 min) | 1 | `thermal_expansion_observed` (likely already half-wired via existing ThermalRigScene + LabRigBase) |
| **SMALL** (30 min – 2 hr) | 2 | `mesquite`, `javelina` |
| **MEDIUM** (½ day) | 4 | `composite_created`, `buoyancy_test_passed`, `motor_cleaned`, `coating_applied` |
| **LARGE** (multi-day) | 2 | `fluid_zone_found` + `basin_crossed` paired (one new mechanic), `memory_zone_entered` + `water_found_blind` paired |
| **POD-SCALE** (multiple sessions, multiple agents) | 8 | The 6 biology-arc observations (require a new BiologyLabScene), plus `topology_zone_entered` + `topology_loop_completed` paired (Möbius cave is real spatial-design work) |

Big honest signal: **8 of 19 are POD-SCALE**. The biology arc alone is its own
multi-session project. The science/exploration trio (Möbius cave, non-Newtonian
basin, invisible map) are each weekend-design conversations before any
implementation. None of those should be wired by a fast-moving worker agent.

The remaining 11 split into "wire-an-existing-rig pattern" (4) and
"plug into an existing scene" (3, plus the 4 LARGE/SMALL exploration ones).
Those 11 are the realistic short-term schedule.

---

### `mesquite` (in `food_chain_tracker`)

**Player-experience meaning:**
> Mr. Chen has asked Zuzu to find a mesquite tree and observe what animals
> are nearby. The player walks up to a mesquite tree and looks at it; that's
> the moment the observation should fire.

**Triggering scene(s):**
> StreetBlockScene (mesquite trees are rendered there). The food_chain_tracker
> quest has no explicit `scene` field on the step, so any scene that renders
> mesquite would qualify; StreetBlockScene is the documented one.

**Existing content in that scene:**
> StreetBlockScene already renders mesquite trees. `StreetBlockScene.js:250`
> pushes mesquite entries into `this._ecologyPlants`. `StreetBlockScene.js:400`
> defines a PLANT_INFO entry for mesquite with descriptive flavor text and
> grants of `mesquite_pods` and `mesquite_wood_sample`. Players can already
> walk up to a mesquite tree and interact with it.

**New content needed:**
- A proximity-detection callback fired when the player enters within ~80px
  of any mesquite tree. The hook would push `'mesquite'` onto
  `state.observations`.
- Probably reusable as a generic `addPlantProximityObservation(species, observationName)`
  helper on a base scene class so other plant-observation quests share the
  pattern.
- An update to `state.observations` via the registry so the change persists
  through the existing save loop.

**Open design questions:**
- Should the observation fire on proximity, on click/inspect, or only when
  the player has already triggered the inspect-plant flow that emits
  PLANT_INFO?
- Should it auto-fire on proximity even outside an active quest? (Yes is
  cheaper; no requires gating against `state.activeQuest`.)
- The quest hint says "look for animals nearby" — does that mean the
  observation should fire only when at least one fauna entity is also
  within proximity, or just on proximity to the tree alone?

**Effort estimate:**
> SMALL. The plant is already in the world; the only missing piece is a
> proximity hook that pushes one string onto an array.

**Suggested first dispatch (if user chooses to ship this one):**
> Add a generic `addPlantProximityObservation(species, observationName)`
> helper to LocalSceneBase (or wherever the scene base lives) that registers
> a per-frame proximity check against any plant in `_ecologyPlants` matching
> the given species, and pushes `observationName` onto `state.observations`
> exactly once per session. Wire it from StreetBlockScene's
> `createWorld()` for the mesquite case. Verify in DevTools that walking to
> a mesquite tree adds `'mesquite'` to `s.observations`.

---

### `javelina` (in `food_chain_tracker`)

**Player-experience meaning:**
> After the mesquite step, Mr. Chen tells Zuzu that javelinas eat mesquite
> pods and the player should look for them. The observation should fire
> when the player sees (gets near) a javelina entity in the world.

**Triggering scene(s):**
> StreetBlockScene or any scene that renders the desert-fringe ecology.
> Per fauna data, javelinas live at elevation 0–5000 and require mesquite
> or prickly pear. StreetBlockScene already has mesquite; it's the natural
> first home.

**Existing content in that scene:**
> Javelina is fully defined in `data/fauna.js:13-22` (label, elevation,
> diet, activity, speed, emoji). `NeighborhoodScene.js:193` has a comment
> "Spawn procedural ecology (flora + fauna)." A wider grep is needed to
> verify whether javelinas are actually spawned anywhere; the visible
> evidence is that fauna *data* exists but I didn't find a fauna-spawning
> scene block during this analysis. The ecology engine
> (`systems/ecologyEngine.js`) is the likely owner.

**New content needed:**
- Confirmation (or addition) that javelinas spawn as visible entities in
  StreetBlockScene's ecology pass. If they don't, that's the bigger lift:
  spawn loop + sprite + minimal wander behavior.
- Proximity-observation hook similar to the mesquite one, against the
  spawned fauna entity instead of a plant.

**Open design questions:**
- Are javelinas currently spawned anywhere in any scene? (Untested in
  this analysis — needs grep on `ecologyEngine.spawn` or equivalent.)
- Should they wander, idle, or follow a scripted patrol? Wander is the
  cheapest but the noisiest visually.
- Should they only spawn when food_chain_tracker is active, or always?
- If always-spawning, do we need a soft cap so the world doesn't fill
  with javelinas?

**Effort estimate:**
> SMALL if javelinas already spawn — same proximity hook as mesquite.
> MEDIUM if they don't — need to add spawning, sprite (or emoji
> placeholder), basic wander, depth-sort registration.

**Suggested first dispatch (if user chooses to ship this one):**
> First a 10-minute investigation pass: grep `ecologyEngine` callers and
> confirm whether `'javelina'` ever lands in a scene's display list at
> runtime. If yes, ship the proximity hook. If no, ship the spawning +
> hook in one cycle, scoped to StreetBlockScene only.

---

### `dna_extracted` (in `extract_dna`)

**Player-experience meaning:**
> Zuzu has collected a tissue sample from an agave plant and now needs
> to use a "biology workbench" (per the quest hint) to run a DNA extraction
> protocol. The observation fires when the extraction completes successfully.

**Triggering scene(s):**
> No scene explicitly named in the quest step. The hint says "Use the
> biology workbench to run the extraction protocol." There is no biology
> workbench scene in the current scene inventory.

**Existing content in that scene:**
> No biology workbench scene exists. Confirmed by `ls scenes/` — closest
> rigs are MaterialLabScene + ThermalRigScene (both LabRigBase consumers
> for materials science, not biology). However, a substantial
> `systems/biologySystem.js` exists with `collectSample`, `degradeSample`,
> and presumably extraction/expression logic; `data/biology.js` defines
> SAMPLE_SOURCES, GENES, MOLECULAR_TYPES. The data + pure-function
> backend exists; the scene/UI to drive it does not.

**New content needed:**
- A new `BiologyLabScene` (likely subclassing LabRigBase if the rig
  pattern fits; possibly a new base class if biology UX diverges).
- UI panels for: sample selection, extraction protocol, integrity
  readout, contamination feedback, time pressure (samples degrade).
- A doorway/portal to enter the lab from somewhere in the world
  (Mr. Chen's house? The garage with a "Biology" door analogous to
  the thermal-rig door?).
- Emission of `'dna_extracted'` on a successful extraction completion,
  presumably via the same LabRigBase observation-emission pattern that
  already drives `load_test_completed`.

**Open design questions:**
- Does the biology workbench reuse LabRigBase or warrant its own base?
  Material/thermal rigs are sample-in → result-out — biology has a
  multi-stage pipeline (collect → extract → optionally amplify →
  optionally express → optionally express in organism) which doesn't
  fit the rig metaphor cleanly.
- Where does the lab live in the world? New scene, new door from
  ZuzuGarageScene, new node on the world map?
- Does extraction have a real-time UI (matching the "samples degrade"
  flavor) or is it instantaneous?
- Is success deterministic from sample integrity, or stochastic?
- The quest grants no item from extraction — does the player carry a
  "DNA molecule" item afterwards, or is it state-only?

**Effort estimate:**
> POD-SCALE. This is the entry point to the entire biology arc (4 quests,
> 6 observations). Building one scene without designing the rest of the
> arc would force redesign later. Treat as a multi-session pod with its
> own design conversation upfront.

**Suggested first dispatch (if user chooses to ship this one):**
> First a design-conversation session, NOT a build dispatch. Decide the
> scene structure, base-class question, and minimum viable extraction
> UX. The first build dispatch should be a vertical slice: lab door
> entry + sample selection + a single extraction completion → emits
> `'dna_extracted'` → returns to garage. Defer RNA, expression,
> bacteria engineering, and bio-electrolyte to subsequent dispatches.

---

### `rna_extracted` (in `understand_expression`)

**Player-experience meaning:**
> Zuzu uses the biology workbench again, this time to extract the more
> fragile RNA molecule. The hint emphasizes time pressure ("hurry — RNA
> degrades fast"). Observation fires on successful RNA extraction.

**Triggering scene(s):**
> The same nonexistent biology workbench scene as `dna_extracted`.
> Quest has prerequisite `extract_dna`, so by the time this observation
> matters, the BiologyLabScene already exists.

**Existing content in that scene:**
> Same as `dna_extracted` — no scene exists. The data layer references
> RNA in `MOLECULAR_TYPES` (per imports in biologySystem.js) so the
> data side is partially modeled.

**New content needed:**
- An RNA-extraction protocol mode in BiologyLabScene (separate from DNA).
- Time-pressure UI element (degrading sample integrity bar) — the quest
  flavor demands it.
- Emission of `'rna_extracted'` on success.

**Open design questions:**
- Is RNA extraction a separate workflow from DNA extraction, or a mode
  toggle on the same protocol? The quest flavor suggests separate UX
  with explicit time pressure.
- Should the time-pressure element be pure-flavor (cosmetic countdown
  with no real consequence) or mechanically meaningful (sample integrity
  drops; failure if you take too long)?

**Effort estimate:**
> Inherits POD-SCALE from the biology arc; isolated effort would be SMALL
> *if* the lab scene exists. Don't ship in isolation.

**Suggested first dispatch (if user chooses to ship this one):**
> Defer until BiologyLabScene exists. When ready, add an RNA mode and
> emit observation; same dispatch can also add expression simulation
> (next observation) since both are "biology workbench operations."

---

### `expression_simulated` (in `understand_expression`)

**Player-experience meaning:**
> Zuzu picks a gene from extracted DNA and runs a simulation of the
> central dogma: DNA → RNA → Protein. Observation fires when the
> simulation completes and the player sees the produced protein.

**Triggering scene(s):**
> BiologyLabScene (still nonexistent).

**Existing content in that scene:**
> None. The simulation logic likely belongs in `biologySystem.js` already
> (collectSample is there; extraction and expression are imported from
> the same module). The UI doesn't exist.

**New content needed:**
- Gene-picker UI (which extractable gene from the player's DNA).
- Animation/visualization of DNA → RNA → Protein. Could be as simple
  as three labeled boxes appearing in sequence.
- Result panel showing the protein and its function.
- Emission of `'expression_simulated'` on completion.

**Open design questions:**
- How visually rich does the DNA-RNA-Protein animation need to be? A
  three-step text card vs. an actual animated transcription/translation
  diagram are very different efforts.
- Does the produced protein become a usable item (fed into the
  `engineer_bacteria` quest flow), or is it state-only?

**Effort estimate:**
> Inherits POD-SCALE. Isolated build is MEDIUM if the lab and DNA
> extraction already work.

**Suggested first dispatch (if user chooses to ship this one):**
> Defer until BiologyLabScene + DNA extraction exist. Ship simulation
> as a third "mode" in the same lab.

---

### `gene_inserted` (in `engineer_bacteria`)

**Player-experience meaning:**
> The player builds a DNA construct (cut + paste a gene into a vector)
> and inserts it into bacteria they've collected. Observation fires
> when the bacterial transformation succeeds.

**Triggering scene(s):**
> BiologyLabScene (nonexistent).

**Existing content in that scene:**
> The data layer has GENES and SAMPLE_SOURCES (with `extractableGenes`
> on samples). Genetic engineering as a system probably lives in
> `systems/geneticEngineering.js` (file exists per directory listing,
> not read in this analysis).

**New content needed:**
- A "DNA construct builder" UI — pick a gene, pick a vector, insert
  bacteria. Real genetic-engineering pedagogy here.
- Visualization of the insertion event (success/failure with reasons —
  contamination, integrity, mismatched promoters).
- Emission of `'gene_inserted'` on a successful transformation.

**Open design questions:**
- This is a substantial mini-game on its own; is the intended UX a
  cookbook step-through (do A, then B, then C, success!) or a
  parameter-choice puzzle (pick the right vector for this gene)?
- The quest references "ion transport gene" specifically (driving
  the bio-electrolyte payoff later). Is that the only gene available,
  or do players choose from a menu?

**Effort estimate:**
> Inherits POD-SCALE. Isolated effort is MEDIUM-LARGE depending on UX
> ambition.

**Suggested first dispatch (if user chooses to ship this one):**
> Defer until BiologyLabScene exists. Even within the biology pod, this
> is one of the heavier sub-dispatches; ship after DNA + RNA + expression
> are stable.

---

### `bio_production_complete` (in `engineer_bacteria`)

**Player-experience meaning:**
> After inserting the gene, Zuzu starts a "production cycle" and watches
> the engineered bacteria grow and produce the target protein. Observation
> fires when the production completes (or hits a configurable yield).

**Triggering scene(s):**
> BiologyLabScene (nonexistent).

**Existing content in that scene:**
> None. `geneticEngineering.js` likely has the production-yield math
> (untested in this analysis).

**New content needed:**
- A production-cycle UI: animated bacterial growth curve, yield readout,
  optionally a real-time wait or accelerated time.
- Emission of `'bio_production_complete'`.

**Open design questions:**
- Real-time wait or instant? Real-time forces the player to find
  something else to do while bacteria grow; instant is cheaper but
  less educationally honest.
- Does production output become a stockpile-able resource for downstream
  quests (bio_battery_integration), or is it state-only?

**Effort estimate:**
> Inherits POD-SCALE. Isolated SMALL-MEDIUM after the construct UI exists.

**Suggested first dispatch (if user chooses to ship this one):**
> Same dispatch as `gene_inserted` — both are part of the construct →
> production flow.

---

### `bio_electrolyte_created` (in `bio_battery_integration`)

**Player-experience meaning:**
> Zuzu uses the bacteria-produced ionic compounds to enhance battery
> chemistry, creating a higher-conductivity electrolyte. Observation
> fires when the enhanced electrolyte is created.

**Triggering scene(s):**
> Either BiologyLabScene's "production output" tab, or ZuzuGarageScene's
> battery workbench (which exists per save state references). The quest
> hint says "convert bio-production outputs to chemistry chemicals, then
> create an electrolyte" — implying a hop from bio output → chemistry
> input → battery panel.

**Existing content in that scene:**
> `systems/batteryChemistry.js` exists. Whether it has a UI or is
> system-only is untested here.

**New content needed:**
- Either a bio→chemistry conversion step in the lab, or an
  "import bio output" action on an existing battery workbench.
- Battery electrolyte creation flow that records the bio-derived bonus.
- Emission of `'bio_electrolyte_created'`.

**Open design questions:**
- Does this happen in the biology lab, the battery workbench, or
  both (move bio output → battery, then create electrolyte there)?
- Is the conductivity bonus visible to the player as a number, a
  rating, or just a quest-completion stinger?

**Effort estimate:**
> Inherits POD-SCALE from the biology arc. Standalone effort SMALL once
> the battery workbench + lab exist.

**Suggested first dispatch (if user chooses to ship this one):**
> Last dispatch in the biology pod. Wire only after the four upstream
> biology observations are emitting.

---

### `fluid_zone_found` (in `the_living_fluid`)

**Player-experience meaning:**
> Zuzu finds a "shimmering" patch of ground near the lake edge — a
> non-Newtonian fluid zone that behaves differently based on movement
> speed. Observation fires when the player enters the zone for the first
> time.

**Triggering scene(s):**
> LakeEdgeScene per the quest text ("near the lake edge"). Quest has no
> explicit `scene` field.

**Existing content in that scene:**
> LakeEdgeScene exists in the scene inventory. No grep evidence of any
> non-Newtonian fluid mechanic, no "shimmering ground" rendering, no
> shear-thickening movement modifier in any system. The quest's
> mechanic is invented; nothing in code yet.

**New content needed:**
- A bounded "fluid zone" region in LakeEdgeScene with a distinctive
  visual (shimmer animation, distinct ground texture).
- A movement modifier that varies with player speed: slow movement
  inside the zone causes "sinking" (movement penalty, possibly damage
  or forced exit), fast movement is normal.
- Trigger emission of `'fluid_zone_found'` on first entry.
- Trigger emission of `'basin_crossed'` (next observation) on exiting
  the opposite side after a continuous-sprint traversal.

**Open design questions:**
- "Sinking" semantics: visual-only with a slow-down penalty, or a
  damage/restart mechanic if Zuzu stops in the middle?
- Is the zone rectangular (cross from west edge to east edge) or
  irregular (puzzle-like meander)?
- Sprint already exists in the codebase? (Untested.) If not, the quest
  presupposes a sprint button that may itself need wiring.
- Does the visual respect the day/night/lighting state of the scene,
  or always shimmer?

**Effort estimate:**
> LARGE. New mechanic, new visual, depends on sprint existing, requires
> playtest tuning for "feels right" speed thresholds.

**Suggested first dispatch (if user chooses to ship this one):**
> First a design conversation on what "sinking" should feel like
> (penalty vs. damage vs. restart). After that, a single dispatch can
> add the zone + visual + sprint-gated movement modifier + both
> observation emissions, scoped to LakeEdgeScene. Plan for a tuning
> follow-up after the user playtests.

---

### `basin_crossed` (in `the_living_fluid`)

**Player-experience meaning:**
> The player successfully sprints across the entire fluid zone without
> stopping. Observation fires when they exit the opposite side.

**Triggering scene(s):**
> Same as `fluid_zone_found` — LakeEdgeScene.

**Existing content in that scene:**
> Same — none of this exists.

**New content needed:**
- Same zone definition as above, plus an "opposite-edge exit" detector
  that records the entry edge on enter and fires `'basin_crossed'` if
  the exit edge is the opposite one AND the player never stopped (or
  never slowed below a threshold) during traversal.

**Open design questions:**
- "Never stopped" is hard to define cleanly. Continuous sprint key held?
  Speed never below threshold X? Time-from-entry-to-exit below Y? Any
  of these is defensible; the user should pick.
- What happens if the player stops mid-zone? Do they get pushed back
  to entry edge, sink (damage), or just slowly emerge from the entry
  edge?

**Effort estimate:**
> Bundled with `fluid_zone_found` — same dispatch, same LARGE estimate.

**Suggested first dispatch (if user chooses to ship this one):**
> Same as `fluid_zone_found`.

---

### `topology_zone_entered` (in `one_sided_forest`)

**Player-experience meaning:**
> Zuzu enters a cave system in the mountain area where space behaves
> like a Möbius strip — walking forward eventually returns the player to
> a position that feels "behind" their start. Observation fires on first
> entry to this designated zone.

**Triggering scene(s):**
> MountainScene per the quest hint ("upper-right mountain area"). Quest
> has no explicit `scene` field.

**Existing content in that scene:**
> MountainScene exists. No Möbius mechanic, no spatial-inversion code,
> no cave entry trigger anywhere in the codebase per grep. The quest
> mechanic is entirely unbuilt.

**New content needed:**
- A cave entrance entity in MountainScene with a distinctive marker
  (the quest hint says 🔄).
- The cave itself is the harder part: how do you simulate Möbius
  topology in a Phaser scene? Options include:
  - A scripted scene that visually mirrors the player's sprite over a
    boundary line (cheap; doesn't actually invert space).
  - A teleport on crossing a midline that reverses Y velocity and
    flips visual orientation (fakes the experience).
  - An honest non-orientable surface (real engine work, probably
    requires a custom render pass).
- Emission of `'topology_zone_entered'` on cave entry.

**Open design questions:**
- How "real" should the Möbius effect feel? A visual gag (mirror
  flip) is shippable in a day; a believable spatial inversion is
  fundamentally different rendering work.
- Is the cave one screen, multiple linked screens, or a procedural
  space?
- Does the inversion affect controls (left becomes right) or only
  visuals?
- Does player save state survive the inversion, or does saving inside
  the cave produce funky load states?

**Effort estimate:**
> POD-SCALE. The mechanic needs a design conversation before any code.
> Even the "cheap" option is more nuanced than typical scene work
> because of save/transition implications.

**Suggested first dispatch (if user chooses to ship this one):**
> No code dispatch. The first dispatch should be a design document
> deciding which level of Möbius fidelity to ship. Then a build
> dispatch scoped to whichever option won.

---

### `topology_loop_completed` (in `one_sided_forest`)

**Player-experience meaning:**
> After entering the cave, Zuzu walks long enough to experience the
> spatial inversion (per quest hint: "Keep walking forward. After a
> while, you'll notice you're inverted!"). Observation fires when the
> inversion has happened — however the implementation chooses to define
> "happened."

**Triggering scene(s):**
> Same Möbius cave as `topology_zone_entered`.

**Existing content in that scene:**
> None.

**New content needed:**
- Whatever the chosen Möbius implementation defines as "loop completed."
  In the simplest visual-mirror option, this could be: the player has
  crossed the inversion boundary, walked a configurable distance past
  it, and now sees themself or their surroundings flipped.
- Emission of `'topology_loop_completed'`.

**Open design questions:**
- All inherited from `topology_zone_entered`. Pinning down what "loop
  completed" means depends entirely on the chosen Möbius approach.

**Effort estimate:**
> Bundled with `topology_zone_entered` — same POD-SCALE estimate.

**Suggested first dispatch (if user chooses to ship this one):**
> Same dispatch as `topology_zone_entered`. These two should land
> together or not at all.

---

### `memory_zone_entered` (in `invisible_map`)

**Player-experience meaning:**
> Zuzu walks into a "signal dead zone" in the world where the HUD,
> markers, and map UI fade out. Observation fires on entering the zone.

**Triggering scene(s):**
> Quest hint says "near the road corridors or mountain" — implying
> NeighborhoodScene or the zone between Neighborhood and MountainScene.
> No explicit `scene` field.

**Existing content in that scene:**
> No dead-zone implementation exists. No HUD-fading mechanism.
> NeighborhoodScene + MountainScene exist as scenes, but neither has any
> region that suppresses the HUD overlay.

**New content needed:**
- A bounded dead-zone region (possibly an entire scene or a sub-region
  inside one).
- A HUD-suppression toggle that tells GameContainer's React HUD overlay
  to fade out. This is a cross-layer change: the in-Phaser zone needs
  to communicate with the React HUD via the existing registry/event
  bus.
- A re-show on exiting the zone.
- Emission of `'memory_zone_entered'`.

**Open design questions:**
- Should the HUD fade smoothly over a couple of seconds (more dramatic)
  or hard-cut (clearer affordance)?
- Does map / journal / pause menu remain accessible inside the zone, or
  is the entire UI suppressed?
- Does the dead zone affect input (e.g., keyboard menu shortcuts) or
  only the visual HUD?
- Does the zone persist across scene boundaries (you walk from
  Neighborhood to a "dead-zone scene") or is it a region inside a
  single scene?
- Should sound respond too — radio static, dampened ambience?

**Effort estimate:**
> LARGE. The HUD-fade is a cross-layer change touching React + Phaser
> + the registry contract; "what should still work in dead zone" is a
> design conversation; the geographic placement of the zone needs to
> be coordinated with the rest of the world map.

**Suggested first dispatch (if user chooses to ship this one):**
> First a design conversation on what the dead zone should feel like
> and what UI should and shouldn't suppress. Then a single dispatch
> to wire the HUD-fade hook into GameContainer + add a reusable
> "dead zone" trigger area component, scoped to one scene as the first
> consumer.

---

### `water_found_blind` (in `invisible_map`)

**Player-experience meaning:**
> While inside the dead zone (UI suppressed), Zuzu navigates from
> memory to a water source — the lake or community pool. Observation
> fires when the player reaches a water source while the dead-zone
> state is active.

**Triggering scene(s):**
> LakeEdgeScene, CommunityPoolScene, or any scene tagged as "water
> source." Quest assumes the player has memorized scene locations
> from prior play.

**Existing content in that scene:**
> The water-source scenes (LakeEdgeScene, CommunityPoolScene) exist.
> Neither has a "this is water" tag that a quest system could query
> against.

**New content needed:**
- A "water source" marker on each qualifying scene (data tag or scene
  property).
- A dead-zone-aware proximity check: when the player is in any
  water-source scene AND the memory_zone_entered observation has
  fired AND the dead-zone is still active, fire `'water_found_blind'`.

**Open design questions:**
- Must the player still be inside the dead zone when they reach water,
  or does the observation fire if they reached water any time after
  entering the dead zone?
- If multiple water sources exist, does any one count, or does the
  quest want a specific one?
- Does the player fail or restart if they get lost (HUD remains off
  forever)? The quest text doesn't address recovery.

**Effort estimate:**
> Inherits LARGE from `memory_zone_entered`. Isolated effort small (just
> a tag + proximity check), but only meaningful after the dead-zone
> mechanic exists.

**Suggested first dispatch (if user chooses to ship this one):**
> Same dispatch as `memory_zone_entered`. These two are inseparable.

---

### `thermal_expansion_observed` (in `heat_failure`)

**Player-experience meaning:**
> Zuzu visits Mrs. Ramirez's thermal lab (in the garage) and runs a
> heating test on three different metal rods, watching how each material
> expands at different rates. Observation fires after all three have
> been tested.

**Triggering scene(s):**
> ThermalRigScene — explicit `scene: 'ThermalRigScene'` on the quest
> step at line 1340.

**Existing content in that scene:**
> ThermalRigScene exists. `ThermalRigScene.js:325` defines
> `getCompletionObservation() { return 'thermal_expansion_observed'; }`.
> ThermalRigScene extends LabRigBase. LabRigBase has the generic
> `observations: [...observations, observation]` push at line 537.
> The plumbing appears to be in place — the bug log's claim that this
> is unwired may be incorrect, OR the rig's completion logic doesn't
> actually call the LabRigBase emission helper at runtime.

**New content needed:**
- VERIFICATION FIRST. Before doing any work, confirm whether the rig
  actually fires `'thermal_expansion_observed'` at runtime when the
  third rod is tested. The static evidence suggests it should; the
  bug log's evidence (only `load_test_completed` ever made it into
  observations) suggests it doesn't.
- If wired but not firing: small fix to the rig's completion path.
- If genuinely unwired: a small additive to call the LabRigBase
  emission helper from ThermalRigScene's completion handler.

**Open design questions:**
- Does the rig need to be reachable? The quest hint says "Mrs.
  Ramirez's thermal lab is in Zuzu's garage — there's a doorway near
  the workbench." Confirm that doorway exists in ZuzuGarageScene.

**Effort estimate:**
> TRIVIAL. Verification + at most a one-line fix.

**Suggested first dispatch (if user chooses to ship this one):**
> Investigation pass first: with the engine fix from tonight in place,
> reset the heat_failure quest, walk to the thermal rig, run all three
> rod tests, and observe whether `thermal_expansion_observed` shows up
> in `state.observations`. If yes, this entry is already wired and
> the bug log was wrong. If no, ship a one-line fix in the rig's
> completion path.

---

### `composite_created` (in `perfect_composite`)

**Player-experience meaning:**
> Zuzu uses a "material workbench" to combine agave fiber + creosote
> resin into a plant-based composite. Observation fires when the
> combination succeeds.

**Triggering scene(s):**
> No explicit scene field. The hint says "material workbench" — likely
> MaterialLabScene (which already handles material testing) or a new
> CompositeLabScene paralleling ThermalRigScene.

**Existing content in that scene:**
> `systems/materials/compositeEngine.js` exists with full Voigt
> rule-of-mixtures math, Krenchel orientation factors, and "pending
> presets" support. The compositing logic is built. MaterialLabScene
> handles material testing but not composite creation per the file
> structure I read. No CompositeLabScene exists yet.

**New content needed:**
- Either:
  - A new "composite mode" tab in MaterialLabScene that consumes the
    existing compositeEngine, OR
  - A new CompositeLabScene cloning the LabRigBase pattern, dedicated
    to composite operations.
- A door/portal to enter the composite UI from the world (if separate
  scene) or a panel switch (if added to MaterialLabScene).
- Emission of `'composite_created'` on a successful composite synthesis.

**Open design questions:**
- Add to MaterialLabScene or split into a new lab? Splitting is
  cleaner architecturally but adds another door to author.
- Should the player choose fiber+resin proportions (engineering
  decision) or is the recipe fixed (educational walkthrough)?
- Does a successful composite get added to the inventory as a
  craftable item, or is it state-only?

**Effort estimate:**
> MEDIUM. The math is done; the work is UI + scene wiring + observation
> emission. Adding to MaterialLabScene is faster (no new door); splitting
> is slower but more honest if multiple "lab modes" emerge later.

**Suggested first dispatch (if user chooses to ship this one):**
> Build the composite UI as a new tab/mode in MaterialLabScene. Wire
> the LabRigBase emission helper to fire `'composite_created'` on
> successful synthesis. If the user later wants a separate
> CompositeLabScene, the tab is trivial to extract.

---

### `buoyancy_test_passed` (in `boat_puzzle`)

**Player-experience meaning:**
> Zuzu builds a raft from chosen materials and tests it in a simulation
> — must float AND remain stable with cargo. Observation fires when
> both conditions are met in a test run.

**Triggering scene(s):**
> No explicit scene field. The quest is by Mr. Chen ("get supplies
> across the lake") and references the lake — likely LakeEdgeScene
> with a buoyancy test panel, or a new BoatTestScene.

**Existing content in that scene:**
> No buoyancy test mechanic anywhere in code per inventory. LakeEdgeScene
> exists but has no boat-building UI. No buoyancy or density-test engine
> in `systems/materials/`.

**New content needed:**
- A buoyancy/stability simulation engine (density vs water, center-of-mass,
  cargo distribution). Could reuse parts of materialDatabase for material
  density values.
- A raft-building UI: pick hull material, place cargo, run simulation.
- Visual result: floats vs sinks vs capsizes.
- Emission of `'buoyancy_test_passed'` when both float AND stability
  pass thresholds.

**Open design questions:**
- Where does the test live? In LakeEdgeScene, in a workbench somewhere,
  or its own scene?
- How rich is the simulation? Real moment-of-inertia / center-of-mass
  math is real engineering content (matches the educational arc) but
  is more code than a simple "choose material → pass/fail."
- Are cargo items real game items or abstract weights?
- Does a passing raft become a usable craft item that crosses the lake?

**Effort estimate:**
> MEDIUM. New mechanic but the math is well-defined and the UI is
> bounded. Honest engineering content — worth doing well.

**Suggested first dispatch (if user chooses to ship this one):**
> Build a small `buoyancyEngine.js` in systems/materials/ following the
> compositeEngine pattern (pure functions, density + cargo math).
> Add a buoyancy test as a new mode in MaterialLabScene OR as a small
> panel inside LakeEdgeScene. Emit `'buoyancy_test_passed'` on success.

---

### `motor_cleaned` (in `engine_cleaning`)

**Player-experience meaning:**
> Zuzu uses harvested yucca-root surfactant to clean a clogged motor.
> Observation fires when the cleaning succeeds (contamination drops
> below a threshold).

**Triggering scene(s):**
> Likely ZuzuGarageScene (where the motor lives — bike workbench area).
> Quest has no explicit scene field.

**Existing content in that scene:**
> ZuzuGarageScene exists with a workbench. `chemistrySystem.js` exists.
> No surfactant-application UI in the workbench per the scenes I read.
> Yucca root is forageable per quest data.

**New content needed:**
- A "clean motor" interaction on the existing workbench in ZuzuGarageScene
  (or wherever the bike/motor lives).
- A simple before/after contamination meter UI.
- A check that the player has yucca_root in inventory.
- Emission of `'motor_cleaned'` on success.

**Open design questions:**
- Does cleaning consume the yucca_root, or is it a one-time use?
- Does the contamination level have any other gameplay effect (motor
  performance, range, energy efficiency) or is it purely a quest gate?
- Should "clean motor" be a mini-game (rub the spot, watch the meter
  drop) or a single-click interaction with a satisfying animation?

**Effort estimate:**
> MEDIUM. New interaction in an existing scene, simple UI, but it
> introduces a "motor contamination" property that may want to interact
> with the broader battery/e-bike system.

**Suggested first dispatch (if user chooses to ship this one):**
> Add a motor-contamination property to the player's e-bike state.
> Wire a "Clean motor" interaction on the garage workbench that
> consumes yucca_root, drops contamination to zero, and emits
> `'motor_cleaned'`. Don't tie it into broader e-bike mechanics yet
> — defer that to a follow-up dispatch.

---

### `coating_applied` (in `desert_coating`)

**Player-experience meaning:**
> Zuzu combines creosote resin + jojoba wax at a material workbench to
> create a protective coating, then applies it to bike components.
> Observation fires after the coating is created and applied.

**Triggering scene(s):**
> "Material workbench" per the quest hint. Same ambiguity as
> `composite_created` — likely MaterialLabScene with a coating tab,
> or ZuzuGarageScene's workbench, or a new dedicated scene.

**Existing content in that scene:**
> `systems/materials/` directory exists with material engines. No
> coating-specific engine. The combine-resin+wax recipe doesn't appear
> in any system file I've read.

**New content needed:**
- A coating-formulation step (combine resin + wax in the right ratio).
- An "apply to component" step (the quest mentions bike parts —
  presumably the player picks which components to coat).
- Coverage/quality readout (the quest emphasizes that gaps cause damage).
- Emission of `'coating_applied'` on a successful application.

**Open design questions:**
- Is coating a one-step (combine+apply) or two-step (formulate, then
  apply) workflow?
- Does coating affect the bike's actual damage/heat/UV properties going
  forward, or is it state-only?
- Same scene-placement question as composite_created.

**Effort estimate:**
> MEDIUM. Same shape as composite_created — math + UI + emission. Could
> be co-shipped with coating-related composite work since the patterns
> are similar.

**Suggested first dispatch (if user chooses to ship this one):**
> If shipping `composite_created` first, fold this in as another
> "material lab mode." Both are workbench-style fabrication operations
> consuming foraged inputs.

---

## Recommended sequencing

A defensible order to wire these 19 observations once tonight's engine
fix lands. Lean toward TRIVIAL/SMALL first to build runtime-validated
confidence in the engine fix, then group by reuse opportunity.

1. **`thermal_expansion_observed`** — TRIVIAL. Likely already half-wired
   via the existing ThermalRigScene + LabRigBase plumbing. First runtime
   verification of the engine fix. May be a no-op fix (if it's just
   already working).
2. **`mesquite`** — SMALL. Single proximity hook on already-rendered
   trees. Validates the "plant proximity" pattern that other ecology
   observations can reuse.
3. **`javelina`** — SMALL or MEDIUM. Same proximity pattern as mesquite
   IF fauna already spawn somewhere. Investigation pass first.
4. **`composite_created` + `coating_applied`** — MEDIUM, paired. Both
   are workbench-style fabrication operations that fit cleanly as new
   modes on MaterialLabScene. Share infrastructure — ship in one
   dispatch.
5. **`buoyancy_test_passed`** — MEDIUM. Build buoyancyEngine.js
   following the compositeEngine.js template, add as another lab mode
   or a new test scene.
6. **`motor_cleaned`** — MEDIUM. Garage workbench interaction,
   independent of the lab work above.
7. **Biology arc pod** (6 observations: `dna_extracted`, `rna_extracted`,
   `expression_simulated`, `gene_inserted`, `bio_production_complete`,
   `bio_electrolyte_created`) — POD-SCALE. Single multi-session pod
   beginning with a design conversation on the BiologyLabScene
   architecture, then a vertical slice (DNA extraction only),
   then per-quest dispatches.
8. **Non-Newtonian fluid pair** (`fluid_zone_found` + `basin_crossed`)
   — LARGE, paired. Design conversation first on "sinking" semantics,
   then one build dispatch for both observations.
9. **Invisible-map pair** (`memory_zone_entered` + `water_found_blind`)
   — LARGE, paired. Design conversation on HUD-fade scope first, then
   a cross-layer dispatch.
10. **Möbius cave pair** (`topology_zone_entered` + `topology_loop_completed`)
    — POD-SCALE, paired. Last to land. Real spatial-design work; should
    not be rushed.

The ordering produces three runtime-validated wins fast (1, 2, 3),
then four bundled lab/workbench wins (4, 5, 6), then leaves the three
hard exploration mechanics and the biology pod as their own
multi-session efforts.

## Out-of-scope flags

Items where the analysis surfaced surprises requiring user decision
rather than blind implementation:

- **`thermal_expansion_observed` may already be wired.** The bug log
  lists it as unwired ("LabRig (config not present)"), but
  ThermalRigScene.js:325 declares `getCompletionObservation()
  { return 'thermal_expansion_observed' }` and LabRigBase.js:537 is
  the generic emission helper. The static evidence and the bug log
  disagree. Resolution: runtime verification first (Sequencing #1).

- **`javelina` spawning is uncertain.** FAUNA data is fully defined
  (data/fauna.js:13-22) but I didn't find evidence of fauna actually
  being spawned in any scene's `_ecologyPlants` / `_ecologyFauna`
  pass. NeighborhoodScene line 193 references "spawn procedural
  ecology (flora + fauna)" in a comment, but the implementation may
  be flora-only. Resolution: investigation pass before estimating
  effort (Sequencing #3).

- **Biology arc requires a foundational architecture decision.** No
  BiologyLabScene exists. Whether to subclass LabRigBase or create
  a new base class for biology is a design question that affects all
  six biology observations. Don't ship one biology observation
  without resolving this.

- **Three POD-SCALE observations involve genuinely new game mechanics
  with playtest-required tuning** — non-Newtonian fluid (sprint-only
  surface), Möbius cave (non-orientable space), invisible-map dead
  zone (HUD suppression). None of these is "wiring an observation."
  They are gameplay-feature design conversations that should happen
  before any worker dispatch. The bug-log framing of "wire the
  observation" understates the work.

- **`composite_created` and `coating_applied` placement decision.**
  Both want a "material workbench." That could be MaterialLabScene
  (with new tabs), a new CompositeLabScene + new CoatingLabScene
  (cleaner but doubles door-authoring), or ZuzuGarageScene's
  workbench (mixes lab and shop UX). The user should decide before
  the first MEDIUM dispatch — picking wrong forces a refactor when
  the second observation lands.
