# Ecology Substrate vs Static-Layout Audit — 2026-04-27

Phased Ecology Orphan Resolution — **Phase 0 (audit) + Phase 1 (decision + plan)**.
Read-only audit. No code changes. No asset import.

Companion docs:
- `.claude/bugs/2026-04-27-neighborhood-orphan-inventory.md` (prior tactical audit — entity inventory, quest impact).
- `.claude/bugs/2026-04-27-scene-access-audit.md` (root-cause cross-reference for the orphan category).
- `.claude/plans/items-1-8-playbook-2026-04-27.md` (sequencing; gets the playbook addition for Phase 1).
- `arc.md` (strategic vision).
- `.claude/agents/swarm-orchestrator.md` (orchestration discipline).

---

## Phase 0 — Audit

### 1. Re-confirmation of prior tactical finding

The prior `neighborhood-orphan-inventory.md` summary tally was:
**0 quests fully blocked by the orphan; 1 quest (`food_chain_tracker`) partially blocked
because of missing observation emitters, not because of the orphan; 9 quests completable in modern
flow despite touching ecology concepts; 2 quests with unrelated blockers that mention ecology.**

Re-greps performed against the current tree (commit `8973d34`):

- `data/quests.js` — 17 `requiredObservation` steps and 24 `requiredItem` steps. The set is
  identical to the scene-access audit's enumeration: only `load_test_completed`,
  `thermal_expansion_observed`, `bridge_built`, and (post C3 fix) `coating_applied` have emitters;
  the other 14 do not. No quest definition has shifted. `food_chain_tracker.observe_mesquite`
  and `food_chain_tracker.observe_javelina` remain the only quest steps whose target species exist
  *exclusively* inside `populateWorld` output.
- `data/sceneItemGrants.js` — covers Street/Dog/DesertForaging/CopperMine/SaltRiver/Mountain/Zuzu.
  No NeighborhoodScene entry. No flora/fauna grant depends on `populateWorld`. The three
  INCOMPLETE_DATA warnings (`healing_salve`, `bio_sample_agave`, `bio_sample_bacteria`) are
  unchanged.
- Modern-flow scenes — `StreetBlockScene` and `DogParkScene` continue to mirror flora via
  `layout.plants` data; `DesertForagingScene` and `MountainScene` continue to render emoji-only
  decorative fauna with no species id, no observation emitter.
- `populateWorld` — single caller still `NeighborhoodScene.js:196`. No other consumer.

**Conclusion:** nothing has shifted. Prior audit's tactical finding stands —
*the orphan blocks zero quests on its own*. The strategic question (does the
**design** want a runtime ecology substrate as carry-forward foundation?) is still open.
This audit answers that strategic question.

---

### 2. Per-entity evaluation matrix

Each row is a `data/ecology.js`/`flora.js`/`fauna.js` entity. Columns:

- **RENDERED** — appears in any modern-flow scene (Street/Dog/DesertForaging/Mountain/etc).
- **HAS SPECIES ID?** — the rendered sprite carries a `species: '<name>'` field that links it
  back to the data tables (vs unkeyed emoji decoration).
- **HAS OBSERVATION EMITTER?** — any code path emits the species name into `state.observations`.
- **HAS FORAGE/ITEM GRANT?** — interaction yields a typed item via `sceneItemGrants` or
  `_handlePlantInteract`.
- **QUESTS USING IT** — quests whose steps name this species (forage or observe).
- **CURRENT BLOCKER** — what stops the entity from carrying the quest path today.
- **PATH** — recommended path (B = port runtime ecology / C = static curated / —
  if entity is fine as-is or out of scope).
- **USES PLANT_ECOLOGY / PREDATOR_CHAINS RELATIONSHIPS?** — whether the prior audit's
  tables actually carry meaningful relationship data for this entity.

#### Plants (FLORA + extras referenced by scenes)

| ENTITY | TYPE | RENDERED | SPECIES ID | OBS EMITTER | FORAGE GRANT | QUESTS | BLOCKER | PATH | USES PLANT_ECOLOGY? |
|---|---|---|---|---|---|---|---|---|---|
| `creosote` | flora | yes (Street, Dog) | yes (interactable) | no | yes (`creosote_leaves`) | desert_healer, desert_infection, perfect_composite, desert_coating | none for forage; no observe path | C | yes (supports kangaroo_rat / rabbit / quail; predators roadrunner / hawk) |
| `mesquite` | flora | yes (Street) | yes (interactable) | **no** | yes (`mesquite_pods`, `mesquite_wood_sample`) | food_chain_tracker (observe + harvest), bridge_collapse | observe step has no emitter; harvest works | B-or-C (B if `food_chain_tracker` keeps procedural feel; C suffices for emitter wiring alone) | yes (supports javelina / rabbit / quail) |
| `prickly_pear` | flora | yes (Street) | yes | no | yes (`prickly_pear_fruit`) | desert_survival | none | C | yes |
| `barrel_cactus` | flora | yes (Street) | yes | no | yes (`barrel_cactus_pulp`) | desert_survival | none | C | yes (waterSource flag, no animal supports) |
| `jojoba` | flora | yes (Street) | yes | no | yes (`jojoba_seeds`) | desert_coating | none | C | yes |
| `desert_lavender` | flora | yes (Street) | yes | no | yes (`desert_lavender_flowers`) | medicine_balance | none | C | n/a (no entry in PLANT_ECOLOGY) |
| `agave` | flora-extension | yes (Street) | yes | no | yes (`agave_fiber`) | desert_healer, perfect_composite | none | C | n/a (not in FLORA, not in PLANT_ECOLOGY) |
| `yucca` | flora-extension | yes (Street) | yes | no | yes (`yucca_root`) | engine_cleaning | none | C | n/a |
| `ephedra` | flora-extension | yes (Dog) | yes | no | yes (`ephedra_stems`) | medicine_balance, toxic_knowledge | none | C | n/a |
| `yerba_mansa` | flora-extension | yes (Dog) | yes | no | yes (`yerba_mansa_root`) | (referenced as flavour, no requiredItem) | none | C | n/a |
| `saguaro` | flora | partial (DesertForaging emoji 🌵 only, no species id) | no | no | no | none | not used by quests; only spawned by populateWorld | — (decorative; leave as visual decoration) | yes (supports hawk/quail; nesting flag) |
| `palo_verde` | flora | no | no | no | no | none | populateWorld only | — | yes (supports rabbit/quail; shade flag) |
| `juniper` | flora | no | no | no | no | none | populateWorld only | — | yes (supports elk) |
| `pinyon` | flora | no | no | no | no | none | populateWorld only | — | yes (supports elk; producesFood flag) |

#### Animals (FAUNA)

| ENTITY | TYPE | RENDERED | SPECIES ID | OBS EMITTER | FORAGE GRANT | QUESTS | BLOCKER | PATH | USES PREDATOR_CHAINS? |
|---|---|---|---|---|---|---|---|---|---|
| `javelina` | fauna (prey) | no | n/a | no | n/a | food_chain_tracker (observe) | entity exists only in populateWorld output; no emitter anywhere | B | yes (prey of coyote; eats mesquite/prickly_pear) |
| `coyote` | fauna (predator) | no | n/a | no | n/a | none directly; food_chain_tracker dialog references it | entity exists only in populateWorld; no quest path | B | yes (predator on javelina/rabbit/k-rat/quail) |
| `rabbit` | fauna (prey) | no | n/a | no | n/a | none | populateWorld only | B | yes (prey of coyote/hawk; eats creosote/jojoba/mesquite) |
| `kangaroo_rat` | fauna (prey) | no | n/a | no | n/a | none | populateWorld only | B | yes (prey of coyote/roadrunner/hawk) |
| `roadrunner` | fauna (predator) | no | n/a | no | n/a | none | populateWorld only | B | yes (predator on kangaroo_rat) |
| `quail` | fauna (prey) | no | n/a | no | n/a | none | populateWorld only | B | yes (prey of hawk/coyote; eats creosote/mesquite) |
| `gila_monster` | fauna (predator) | partial (DesertForaging/Trail emoji 🦎 only, no species id) | no | no | n/a | none | unkeyed decoration | C (attach species id, observation emitter as future hook) | partial (predatorsNearby reference only) |
| `hawk` | fauna (predator) | partial (DesertForaging/Mountain emoji 🦅 only, no species id) | no | no | n/a | none | unkeyed decoration | C (attach species id) | yes (predator on rabbit/k-rat/quail) |
| `elk` | fauna (prey) | no | n/a | no | n/a | none | populateWorld only; high-elevation only | — (defer; no quest hook) | yes (eats juniper/pinyon) |

**Key takeaways from the matrix:**

1. **Path C is sufficient for every plant in the modern-flow forage path.** Every plant
   currently driving an active quest already has a species id, a forage grant, and lives in a
   layout-driven scene. The only missing piece is an *observation emitter* on the existing
   interaction — that's a wiring fix, not a substrate fix.
2. **Path B has unique value for the food chain.** All eight committed predators/prey live
   exclusively in `populateWorld` output. PREDATOR_CHAINS encodes 8 prey↔predator probability
   edges that are coherent, internally consistent, and would teach exactly what
   `food_chain_tracker` and arc.md §3 Act 1 ("Desert ecology … animal habitats") name.
3. **PLANT_ECOLOGY and PREDATOR_CHAINS data are well-formed.** Every flora row in PLANT_ECOLOGY
   names supports / predatorsNearby / spawnBoost / biome consistently; every PREDATOR_CHAINS
   row maps real species in FAUNA to real species in FAUNA with sensible probabilities. This is
   *not* an "unsalvageable substrate" — it's a procedural model that needs a portable,
   scene-independent home.
4. **Three unkeyed decorations (saguaro, gila_monster, hawk) are a separate problem.** They
   render visually in modern scenes but carry no species id. Path C can attach metadata to them;
   Path B would render them as a real procedural population. The visual presence is a hint that
   the world *expects* an ecology layer, even if the current code path doesn't honor it.

---

### 3. arc.md curriculum check

Each "What the player learns" sub-section across Acts 1–3 is parsed for ecology-touching
concepts. Path C = static curated entities + observation emitter. Path B = same plus a runtime
food-web model with procedural relationships.

| CURRICULUM CONCEPT | ACT | PATH C SUFFICIENT? | PATH B BENEFIT IF ANY |
|---|---|---|---|
| "Desert ecology: heat, water, shade, native plants, animal habitats, washes, monsoon logic" | 1 | partial — covers plants, but "animal habitats" implies fauna ↔ flora linkage | yes — PLANT_ECOLOGY directly encodes habitat requirements (`requiresPlants`) |
| "Foraging and identification: useful plants, unsafe plants, ecological limits, harvest ethics" | 1 | yes (forage paths + dose-response) | minor — Path B could simulate over-harvesting |
| "Dose-response thinking: beneficial vs harmful quantities" | 1 | yes (chemistry layer) | none |
| "Food chains, predator/prey" (implicit in the `food_chain_tracker` quest design and arc.md §3 Act 1 ecology bullet) | 1 | partial — single-step observe/quiz works without procedural | yes — PREDATOR_CHAINS lets the player *follow* the chain (mesquite → javelina → coyote) as a discoverable network, not just a quiz |
| "Ecology and resource ethics: extraction has consequences" | 2 | partial | yes — depletion/regrowth needs a procedural population model |
| "Closed-loop ecology" | 3 | no | **yes — required**. Stage 3 of the Biology Workbench *is* a procedural ecology simulator (see arc.md §4 "Simulation Biology"). A live food-web model in Act 1 is the natural progenitor. |
| "Microbial ecology, plant adaptation" | 3 | no | yes (different model — biology workbench substrate, separate dispatch) |
| "Feedback loops and unintended consequences" | 3 | no | yes — same scaling argument |
| "Terraforming constraints" | 3 | no | yes — terrain-as-constraint per arc.md §8.4 + ecology-as-constraint compose |
| "Stewardship — sustainable balance over maximum growth" | 3 | no | yes — needs procedural state to demonstrate "balance" vs "extraction" |

**Reading:** Path C handles Act 1 forage learning fine. Path B becomes load-bearing the
moment the curriculum names "food chains," "extraction has consequences," "closed-loop
ecology," or "stewardship." The arc.md §4 Biology Workbench Stage-3 design *explicitly*
calls for a procedural ecosystem simulator. Path B is the Act 1 progenitor of that system.

This aligns with arc.md §8.2: "no act-specific carve-outs … the acts are layers of
capability over one continuous world." Building Path B now means the Stage-3 workbench
inherits a proven ecology runtime instead of inventing one in Act 3.

---

### 4. Decision recommendation

**Recommended path: B — port `populateWorld` into a modern carry-forward `EcologyEntity`
system at `src/renderer/game/systems/ecology/`.**

Reasoning, citation by citation:

- **Substrate is salvageable.** `data/ecology.js` defines 9 PLANT_ECOLOGY rows and 8
  PREDATOR_CHAINS edges. Both tables are internally consistent (every predator name in the
  chain table also exists in FAUNA; every prey requires-plant reference also exists in FLORA).
  Per the user's explicit guidance, Path B is preferred unless the data is too inconsistent to
  port — it isn't (Phase 0 §2 matrix).
- **Phase 0 §3 shows curriculum benefit increases monotonically across acts.** Path B is
  the only option that scales to Stage-3 simulation biology without inventing a new substrate
  in Act 3, which would violate arc.md §8.2.
- **Phase 0 §1 confirms zero current quest is blocked by the orphan**, so Path B is *not*
  forced by an immediate bug — it is forced by the carry-forward discipline of arc.md §4 and
  the world-model alignment rules of arc.md §8. Choosing Path C now would mean re-doing this
  work when Stage-3 biology lands.
- **Path A (quarantine) is rejected** because the substrate is well-formed and the
  curriculum benefits are real. Path A would discard living-system data that the design needs.
- **Path C (static-only) is the fallback,** retained as such per the dispatch's explicit
  guidance. If Phase 2's runtime port reveals a hidden inconsistency the audit missed, the
  fall-back is documented in Phase 1 §3.

The implementation phases below assume Path B.

---

## Phase 1 — Decision + dispatch plan

### 1. Recommended path

**Path B.** One sentence: the ecology data tables are internally consistent and the
curriculum benefit of a runtime food-web model is load-bearing for Act 3's simulation biology
per arc.md §4 and §8.2, so port the procedural model into a portable carry-forward system.

### 2. Per-future-phase scope estimate

These are *drafts only*. Phases 2–8 are gated on human authorization.

| Phase | Scope | LOC est. | Files touched | Agent |
|---|---|---|---|---|
| 2 | Author `ecology-substrate.md` design doc + draft `EcologyEntity` schema (declared per arc.md §8.1: environmental primitives consulted = biome + terrain; progression primitives updated = observations + knowledge state when A.8 lands; Act 1 → Act 3 scaling documented) | ~250 LOC doc | new `.claude/specs/ecology-substrate.md` | human + arc.md (no agent) |
| 3 | Stand up `src/renderer/game/systems/ecology/` skeleton: `ecologyState.js` (per-region serialized population), `ecologyQueries.js` (read-only lookups), `ecologyTicker.js` (deterministic re-population on scene mount). No scene imports inside the system. Move `populateWorld` body into the new module; preserve `data/ecology.js` unchanged. | ~400 LOC | new system files; ecologyEngine.js delegations; no scene edits | general-purpose |
| 4 | Wire `EcologyEntity` to existing scenes. StreetBlockScene + DogParkScene + DesertForagingScene attach a hidden `species:` tag to each existing static plant/animal. Add observation emitters (`mesquite`, `javelina`, others as needed) on existing interaction sites. **Asset import remains out of scope; visuals stay emoji/geometric.** | ~250 LOC | scene files (additive only); no layout JSON change | general-purpose, possibly later `quest-observation-wirer` |
| 5 | Quest re-validation. Re-run progression-reachability audit; mark `food_chain_tracker.observe_mesquite` / `observe_javelina` runtime-validated; verify other ecology-touching quests still pass. | ~30 LOC test/audit | runtimeAudit.js | runtime-audit-system |
| 6 | Procedural population layer. Re-introduce `applyFoodChain` semantics on a new edge-walkable scene (per `navigation-substrate.md` decision blocked behind A.7 reframe). If navigation substrate selects marker-based, defer this phase. | ~300 LOC | new scene OR Overworld marker; ecology system additions | general-purpose (post navigation-substrate) |
| 7 | Act-2 / Act-3 scaling pass. Add `regionId` parameter to ecology queries; verify Mexico/Andes etc. can attach their own species tables without code changes. Validates the Act-1→Act-3 scaling promise from arc.md §8.1. | ~150 LOC | data/ecology.js extension; system additions | general-purpose |
| 8 | Cleanup. Decide fate of legacy NeighborhoodScene + GarageScene + their `populateWorld` call site (now redirected through EcologyEntity). Likely: delete the scenes, retain `data/ecology.js` and the new system. | ~-200 LOC (net deletion) | scene removals; config.js migration entries | general-purpose |

LOC budget for the whole pipeline: ~1180 LOC across phases 3-8 (excluding doc work in 2).
That is bigger than a single static-only-fix but smaller than the biology workbench substrate
(per A.5).

### 3. Risk register

One bullet per risk; severity / mitigation.

- **R1 — Navigation substrate decision (parallel A.7) lands as marker-based.** Severity:
  medium. Mitigation: Phases 3–5 do not depend on edge-walking. They attach to existing
  scenes. Phase 6 is the only navigation-coupled phase; defer or skip it if marker-based wins.
- **R2 — `populateWorld` runtime moves to a tick or per-scene refresh schedule that
  desyncs from save state.** Severity: medium. Mitigation: serialize per-region populations
  into `state.ecology[regionId]` in Phase 3; treat the serialized form as canonical. Do not
  re-roll on each scene mount.
- **R3 — Act-3 simulation biology design (A.5) wants a different ecology data shape than
  the Act-1 port.** Severity: high. Mitigation: Phase 2's design doc must be reviewed
  alongside `biology-substrate.md`. If shapes diverge, halt Phase 3 and reconcile.
- **R4 — Cultural representation rule (arc.md §2) for the regional flora/fauna in Act 2.**
  Severity: low for Act-1 ecology (current scope), high if Phase 7 names species in
  Mexico/Andes/Anatolia/Zagros/East Africa/Yunnan without human design briefs. Mitigation:
  Phase 7 dispatch must halt-and-surface for human briefs before naming any non-Sonoran
  species.
- **R5 — Knowledge-state coupling.** Severity: medium. arc.md §8.5 forbids consuming
  knowledge-state queries before that substrate doc lands. EcologyEntity's observation
  emitters write to `state.observations`, not `state.knowledge`, so no coupling exists today —
  but if Phase 4 wants "did the player understand the food chain?" gating, halt-and-surface
  per A.8.
- **R6 — Asset import collision.** Severity: low. The asset-import dispatch (separate, later)
  may rename emoji placeholders to licensed sprites. EcologyEntity should expose a
  visual-token field that the asset layer can swap; do not hard-code emoji strings inside the
  system module. Mitigation: Phase 3 schema review.
- **R7 — Runtime perf at high entity counts.** Severity: low. populateWorld currently
  spawns ~432 cells × per-species rolls. The modern-flow scenes are smaller. Mitigation:
  document a per-region cap and a tick budget in Phase 2.
- **R8 — Static-only verdict drift.** Severity: medium. Per swarm-orchestrator rules, every
  Phase 3+ dispatch on a critical path requires runtime validation. Mitigation: Phases 3, 4,
  6 each ship with explicit `runtime-validated` gating in their playbook entries.

**Top three:** R3 (Act-3 substrate divergence), R1 (navigation decision dependency),
R8 (runtime-validation discipline).

### 4. arc.md §4 amendment draft (Path B selected)

*This is a draft. arc.md is NOT modified by this dispatch.*

> ### Ecology Substrate (EcologyEntity)
>
> Today: `data/ecology.js` defines plant↔animal relationships and predator/prey chains;
> `data/flora.js` and `data/fauna.js` define species. The legacy `populateWorld` function in
> `ecologyEngine.js` consumes these tables to seed flora and fauna in NeighborhoodScene only —
> the modern flow attaches static plants via layout JSON without honoring the procedural
> relationships.
>
> Scales to: Act 1 desert ecology (food chain discovery, predator/prey observation), Act 2
> regional ecology (extraction-has-consequences, scale to seven Earth regions, depletion
> dynamics), Act 3 closed-loop ecology (Stage-3 simulation biology consumes EcologyEntity as
> its progenitor; alien species data registers via the same schema).
>
> Discipline: ecology relationships live in data, not hard-coded per scene. Species
> registration is data-additive, not code-additive. EcologyEntity attaches *to* a scene via the
> entity's host-scene identifier, but its state and behavior do not depend on which scene
> mounted it (per Portability Principle).
>
> #### Primitive declarations (per §8.1)
>
> - **Environmental primitives consulted:** biome (per `data/ecology.js` BIOMES table for
>   Act 1; per regions.js for Act 2+); terrain (per arc.md §8.4 — sand/rock/ice constrains
>   spawn cells the same way it constrains construction).
> - **Progression primitives updated:** observation state
>   (`state.observations[species_id]`); knowledge state when `knowledge-state-substrate.md`
>   lands per arc.md §8.5 (deferred — do not consume before that doc lands).
> - **Act 1 → Act 3 scaling:** Act 1 = single region, declarative observation emission. Act 2
>   = per-region ecology tables, depletion dynamics, extraction tracking. Act 3 = same schema
>   feeds the Stage-3 simulation biology workbench; alien species register via the same
>   FLORA/FAUNA/PLANT_ECOLOGY pattern. No act-specific carve-outs (per §8.2).

### 5. Playbook addition

Drafted as **A.9** in `.claude/plans/items-1-8-playbook-2026-04-27.md`. The playbook file is
modified by this dispatch. See that file for the full text.

---

*End of audit.*
