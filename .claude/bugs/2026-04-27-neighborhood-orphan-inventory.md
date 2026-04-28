# Neighborhood populateWorld() orphan inventory — 2026-04-27

Generated to inform the A.7 design conversation in
`.claude/plans/items-1-8-playbook-2026-04-27.md`.

Read-only audit; no code changes proposed.

## populateWorld() function summary

`populateWorld(options)` is defined in
`src/renderer/game/systems/ecologyEngine.js:450-485`. It walks the
`WORLD.width × WORLD.height` (1536×1024) play space on a configurable
sampling grid (default 60 px), calls `spawnFlora()`
(`ecologyEngine.js:269-298`) at every cell to deterministically seed
flora, calls `spawnFauna()` (`ecologyEngine.js:340-392`) on a
3×-coarser grid using nearby plants + `requiresPlants` filters from
`data/fauna.js`, and finally `applyFoodChain()`
(`ecologyEngine.js:398-435`) which appends predators near matching
prey using probabilities from `data/ecology.js:PREDATOR_CHAINS`. The
function returns `{ plants: object[], animals: object[] }`. Each
plant carries `{ type, species, x, y, size, color, heightOffset }`;
each animal carries `{ type, species, x, y, color, emoji, speed,
aerial }`. All exclusion (roads, garage area, NPC zones, world
boundary) goes through `isExcludedZone()`
(`ecologyEngine.js:227-250`). The function is **purely procedural**:
no NPCs, no quest hooks, no zones, no audio triggers, no save
mutations.

Call sites (file:line):
- `src/renderer/game/scenes/NeighborhoodScene.js:196` —
  `_spawnEcology()` calls `populateWorld({ gridSize: 60, timeOfDay:
  'day' })` and renders plants as `Phaser.GameObjects.Graphics` and
  animals as emoji `Text` objects. Plants/animals are pushed into
  `this._depthSortables` for the depth-sort system, but **no
  interaction zone, forage hook, observation emitter, or quest
  bridge is attached**. They are decorative-only; the food-chain
  quest's `requiredObservation: 'mesquite' / 'javelina'` would not
  fire here even if the player reached this scene.

That is the **only** caller of `populateWorld(` anywhere in `src/`.

## Entity inventory

### Plants / flora

The grid samples ~432 cells (1536/60 × 1024/60), each rolling against
all 11 species in `FLORA` (`data/flora.js:14-335`). Counts below are
"reachable in modern flow" vs "only spawned by populateWorld".
`StreetBlockScene` and `DogParkScene` both spawn from
`layout.plants` data (`drawPlant()` from `utils/plantRenderer.js`).
`DesertForagingScene` spawns *forageable resources* (item nodes), not
canonical plant species — counted as "partial" because the items
collected match flora-derived items even though the plant entity
itself isn't on screen.

| species | count or procedural | reachable in modern flow | callsite |
|---|---|---|---|
| `creosote` | procedural cluster (4) | yes | `StreetBlockScene.js:241` (street-block.layout.json:261, 268), `DogParkScene.js:134` (dog-park.layout.json:104) |
| `saguaro` | procedural single (density 0.15) | no | not present in any modern-flow `layout.plants` array; `DesertForagingScene.js:60` only renders 🌵 emoji decorations from `cacti[]`, no `saguaro` species hook |
| `mesquite` | procedural cluster (3) | yes | `StreetBlockScene.js:241` (street-block.layout.json:247, 254) |
| `palo_verde` | procedural cluster (2) | no | not present in any modern-flow scene |
| `jojoba` | procedural single (density 0.5) | yes | `StreetBlockScene.js:241` (street-block.layout.json:289) |
| `prickly_pear` | procedural cluster (3) | yes | `StreetBlockScene.js:241` (street-block.layout.json:275) |
| `barrel_cactus` | procedural single (density 0.25) | yes | `StreetBlockScene.js:241` (street-block.layout.json:282) |
| `desert_lavender` | procedural cluster (2) | yes | `StreetBlockScene.js:241` (street-block.layout.json:310) |
| `juniper` | procedural cluster (3) | no | not present in any modern-flow scene |
| `pinyon` | procedural cluster (2) | no | not present in any modern-flow scene |

Additional species referenced by quests/StreetBlock/DogPark `PLANT_INFO`
maps but **NOT** in `FLORA` (so populateWorld never spawns them):
`agave`, `yucca`, `ephedra`, `yerba_mansa` — confirming the modern
scenes already extended the species roster beyond what the ecology
engine ever knew. `agave`/`yucca` are at
`StreetBlockScene.js:241` (street-block.layout.json:296, 303).
`ephedra` and `yerba_mansa` are at `DogParkScene.js:134`
(dog-park.layout.json:102-103).

### Animals / fauna

All entries from `FAUNA` (`data/fauna.js:12-118`). populateWorld is
the only spawner. None of the modern-flow scenes spawn any of these
as gameplay entities; the only matches in modern-flow scenes are
**decorative emoji text with tween-only behavior, no species id, no
interaction zone, no observation emitter**.

| species | count or procedural | reachable in modern flow | callsite |
|---|---|---|---|
| `javelina` | procedural; requires `mesquite`/`prickly_pear` plants nearby; day-only | no | `populateWorld` only; never spawned, never observable elsewhere |
| `coyote` | procedural via `applyFoodChain`; night-only; near javelina/rabbit/kangaroo_rat | no | `populateWorld` only |
| `rabbit` | procedural; requires `creosote`/`jojoba`/`mesquite`; day-only | no | `populateWorld` only |
| `kangaroo_rat` | procedural; night-only | no | `populateWorld` only |
| `roadrunner` | procedural; day-only | no | `populateWorld` only |
| `quail` | procedural; requires `creosote`/`mesquite`; day-only | no | `populateWorld` only |
| `gila_monster` | procedural; day-only | partial — visual-only as 🦎 emoji at `DesertForagingScene.js:65` and `DesertTrailScene.js:100`, but those are unkeyed decorations (no `species: 'gila_monster'`, no observe/forage hook) |
| `hawk` | procedural via `applyFoodChain`; aerial; day-only | partial — visual-only as 🦅 emoji at `DesertForagingScene.js:71` and `MountainScene.js:118`; same caveat: no species id, no observation emitter |
| `elk` | procedural; elevation 5000+; day-only | no | `populateWorld` only |

(`MountainScene.js:129` adds a 🐐 mountain goat that has no entry in
`FAUNA` at all — an unrelated decoration. Listed for completeness.)

### NPCs

`populateWorld()` does not spawn any NPCs.

| id | reachable in modern flow | callsite |
|---|---|---|
| (none — populateWorld spawns no NPCs) | n/a | n/a |

The two NPCs that NeighborhoodScene places (`NPC_PLACEMENTS` from
`data/neighborhoodLayout.js:192-211`: `mrs_ramirez`, `mr_chen`) are
**also** placed by `StreetBlockScene.js:281-310`, so the NPCs are not
orphaned by NeighborhoodScene's deprecation. NPC spawning is
entirely outside `populateWorld()`.

### Other (props, zones, sprites, audio triggers)

`populateWorld()` produces nothing in this category. It returns only
flora and fauna objects. NeighborhoodScene's wider `create()`
(`NeighborhoodScene.js:65-192`) attaches landmark zones, an entry
zone to the garage, an east-edge sensor, and a debug overlay — but
those come from the editor-generated layout and from
`attachEdgeSensor`, not from `populateWorld`. The audio transition at
`NeighborhoodScene.js:178` is a generic per-scene call, not
ecology-driven.

| type | description | reachable in modern flow | callsite |
|---|---|---|---|
| (n/a — `populateWorld` produces no props/zones/audio) | | | |

## Quests blocked by this architectural orphan

Of all 21 quests in `data/quests.js`, only the food-chain quest
genuinely depends on `populateWorld`-spawned animals — fauna are
nowhere else. Forage-side dependencies on flora are mostly already
covered by `StreetBlockScene` / `DogParkScene` (see "Quests not
blocked but touching the same system" below).

### `food_chain_tracker`

(`data/quests.js:258-338`)

- **Step `find_mesquite`** (`quests.js:276-281`, type: `observe`,
  `requiredObservation: 'mesquite'`): blocked because **no scene in
  `src/` ever pushes the string `'mesquite'` into
  `state.observations`** (grep across `src/` confirms — only the
  quest definition references it). NeighborhoodScene draws a
  graphics-only mesquite from `populateWorld` but attaches no
  observation emitter (`NeighborhoodScene.js:198-234`). StreetBlock
  has interactable mesquite plants
  (`StreetBlockScene.js:241,400`) but its `_handlePlantInteract`
  (`StreetBlockScene.js:387-460`) only writes to
  `state.inventory`, never to `state.observations`. So **even if the
  player did reach NeighborhoodScene, the step would still be
  blocked.** The orphan is not the unique blocker — the absence of
  any `'mesquite'` emitter is.
- **Step `observe_prey`** (`quests.js:291-296`, type: `observe`,
  `requiredObservation: 'javelina'`): blocked because (a) the
  javelina entity itself only exists in `populateWorld` output
  (`fauna.js:14-24`, spawned at `ecologyEngine.js:340-392`,
  rendered at `NeighborhoodScene.js:237-251`), and (b) no scene
  emits `'javelina'` into `state.observations`. Same double-block:
  no entity in modern flow + no emitter anywhere.

The two `dialogue` and `quiz` steps in this quest do not require
ecology entities. The `harvest_mesquite` forage step
(`quests.js:316-321`, `requiredItem: 'mesquite_pods'`) is satisfiable
in `StreetBlockScene` (mesquite is in `street-block.layout.json:247`
and `mesquite_pods` is granted by `_handlePlantInteract` at
`StreetBlockScene.js:400`). So the quest is **partially** blocked at
the two `observe` steps; the foraging step has a path.

## Quests not blocked but touching the same system

These quests reference flora species that `populateWorld` would have
spawned, but the modern flow has an alternate forage path. They are
**not** blocked by the orphan.

### `desert_healer` (`quests.js:176-256`)
- How: `find_creosote` step → `creosote_leaves` foraged from
  creosote bush in `StreetBlockScene.js:241,401`
  (street-block.layout.json:261, 268) or `DogParkScene.js:130,215`
  (dog-park.layout.json:104). `find_agave` → `agave_fiber` foraged
  from `StreetBlockScene.js:296,405` (street-block.layout.json:296)
  or `DesertForagingScene.js:90` as a `Resource` node.

### `desert_survival` (`quests.js:340-420`)
- How: `find_prickly_pear` → prickly pear in
  `StreetBlockScene.js:402` (street-block.layout.json:275).
  `find_barrel` → barrel cactus in `StreetBlockScene.js:403`
  (street-block.layout.json:282).

### `medicine_balance` (`quests.js:422-504`)
- How: `find_ephedra` → `ephedra_stems` from `DogParkScene.js:213`
  (dog-park.layout.json:102) or `StreetBlockScene.js:408`.
  `find_lavender` → desert lavender in `StreetBlockScene.js:407`
  (street-block.layout.json:310).

### `desert_infection` (`quests.js:849-910`)
- How: `find_antimicrobial` and `treat_infection` both want
  `creosote_leaves`. Available at `StreetBlockScene.js:401` and
  `DogParkScene.js:215`.

### `toxic_knowledge` (`quests.js:976-1043`)
- How: `forage_ephedra` → ephedra path same as `medicine_balance`.

### `bridge_collapse` (`quests.js:1113-1300`)
- How: `forage_wood` → `mesquite_wood_sample` granted by
  `StreetBlockScene.js:400`. `collect_copper` →
  `copper_ore_sample` granted by `MountainScene.js:165-180` and/or
  `CopperMineScene` (per `sceneItemGrants.js:54-66`).
  `collect_steel` → `steel_sample` from
  `ZuzuGarageScene.js` (per `sceneItemGrants.js:84-89`).

### `perfect_composite` (`quests.js:1368-1439`)
- How (forage half only): `gather_fiber` → `agave_fiber` from
  `StreetBlockScene` or `DesertForagingScene`. `gather_resin` →
  `creosote_leaves` from `StreetBlockScene` / `DogParkScene`.
- The `combine_materials` step's `composite_created` observation has
  no emitter (per scene-access audit `2026-04-27-scene-access-audit.md:71-79`),
  but that is **not** a `populateWorld` orphan issue — it's a missing
  workbench feature. Listed for completeness so it isn't conflated.

### `engine_cleaning` (`quests.js:1507-1569`)
- How: `gather_yucca` → `yucca_root` from
  `StreetBlockScene.js:406` (street-block.layout.json:303). Note:
  `yucca` isn't in `FLORA`, so populateWorld never spawned it
  anyway — this quest never depended on the ecology engine.

### `desert_coating` (`quests.js:1571-1640`)
- How: `gather_resin` → `creosote_leaves` (same path).
  `gather_wax` → `jojoba_seeds` from `StreetBlockScene.js:404`
  (street-block.layout.json:289).

### `engineer_bacteria` (`quests.js:644-718`)
- The `collect_bacteria` step hint says *"Scoop soil near mesquite
  roots"* (`quests.js:667`). The required item is
  `bio_sample_bacteria` (`items.js:204`), which has **no source**
  in `sceneItemGrants.js` and is not granted by any scene's plant
  interaction. This is a missing-grant problem (an A.4 issue, not
  an A.7 issue), independent of populateWorld. The hint's mention
  of mesquite is decorative.

### `extract_dna` (`quests.js:508-573`)
- The `collect_sample` step's `bio_sample_agave` (`items.js:195`)
  has **no source** in `sceneItemGrants.js` either. Again an A.4
  issue, not an A.7 issue.

## Summary tally

- Quests fully blocked by the orphan: **0** — every blocked quest
  has at least one viable step or alternate path. The only quest
  whose ecology-coupled steps are *both* blocked is
  `food_chain_tracker`, but its blockage is due to *missing
  observation emitters*, not the absence of NeighborhoodScene
  itself. Even resurrecting NeighborhoodScene would not unblock
  those steps without separately wiring an emitter (see playbook
  A.1 in `.claude/plans/items-1-8-playbook-2026-04-27.md`).
- Quests partially blocked: **1** (`food_chain_tracker`: 2 observe
  steps blocked, 1 forage step + 4 dialogue/quiz steps satisfiable
  elsewhere).
- Quests completable in modern flow despite touching ecology
  concepts: **9** (`desert_healer`, `desert_survival`,
  `medicine_balance`, `desert_infection`, `toxic_knowledge`,
  `bridge_collapse`, `engine_cleaning`, `desert_coating`, plus the
  forage halves of `perfect_composite`).
- Quests with an unrelated blocker that *mentions* ecology: **2**
  (`engineer_bacteria`, `extract_dna` — blocked by missing
  bio-sample item sources, not by NeighborhoodScene).

## Implications for A.7

The evidence strongly supports **O1 (quarantine)**, with no urgency
to revisit O2 or O3. Three reasons drawn directly from the inventory:

1. **The orphan blocks zero quests on its own.** Every flora and
   fauna species `populateWorld` produces is either already mirrored
   in StreetBlock/DogPark/DesertForaging via static layouts, or only
   gates an `observe` step that has no emitter anywhere — meaning
   resurrecting NeighborhoodScene (O2) would not actually unblock
   `food_chain_tracker` without separate emitter work that A.1
   already plans for. The procedural ecology has no load-bearing
   role.

2. **`populateWorld` spawns nothing unique to the world model.** No
   NPCs, no zones, no audio triggers, no save state. The only
   "uniqueness" is the procedural placement noise — and the
   gameplay value of that noise is zero in modern flow because none
   of the spawned entities are interactive. Quarantining costs
   nothing functional; resurrecting would require attaching
   interactions, observe-emitters, depth sorting, and an
   OverworldScene marker — i.e. it would re-do most of the
   StreetBlock/DogPark plant work in a different scene.

3. **The seamless edge that A.7 quarantines is the only thing
   keeping NeighborhoodScene structurally relevant.** Quarantining
   the SCENE_ADJACENCY entry severs that single tether and allows
   NeighborhoodScene + populateWorld + `data/ecology.js`'s
   PLANT_ECOLOGY/PREDATOR_CHAINS tables to be retired or
   garden-walled as future-foundation in a later cycle without
   blocking any current quest.

If the design conversation later wants procedural fauna in the
modern flow (e.g. a "wildlife observation" mechanic), the
substrate-doc path described in the reframed A.7 block is correct:
add a navigation-substrate decision first, then choose between
porting `populateWorld` to a new edge-walkable scene (a future O2′)
or attaching observation triggers to the existing static plants in
StreetBlock/DogPark (a far smaller change, and the one the
`food_chain_tracker.find_mesquite` step would naturally hook into).
