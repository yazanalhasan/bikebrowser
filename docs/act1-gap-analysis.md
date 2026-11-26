# Act 1 gap analysis

Compared against `arc.md` Act 1 (Sonoran Desert / Bike School) and the
substrate docs it names. Status is what was true on
`cursor/playability-and-build-health-e495` before this branch, then what
this branch changes.

Architectural rules treated as fixed: `arc.md` §4 (systems do not import
scenes; data is canonical; layouts stay in JSON) and §8 (declare
primitives, no act-only forks, no decoration biomes, terrain is a
constraint, do not invent a second discovery set, do not fragment
biome lookup).

## Completion criteria

| Criterion | Before | This branch |
| --- | --- | --- |
| Bike repaired enough to reach the wider map | `flat_tire_repair` and `chain_repair` exist and the Playwright playthrough can finish them. A child was not told they add up to a map unlock. | **Done as a gate.** Both quests are required by `evaluateAct1`. |
| Bridge reconnected | `bridge_collapse` plus construction drag/drop and Dry Wash exist. | **Done as a gate.** Completing `bridge_collapse` is the reconnect. |
| Material testing demonstrated | Material lab, UTM rig, thermal rig, and the bridge quest's weigh/test steps exist. | **Done as a gate.** `bridge_collapse`, `heat_failure`, `perfect_composite`, `desert_coating`, or a `materialLog` entry counts. Noted below. |
| Ecology / foraging / chemistry / dose-response | Quests exist: `desert_healer`, `food_chain_tracker`, `desert_survival`, `medicine_balance`. | **Done as a gate.** Foraging/ecology and dose-response are both required. |
| NPC trust unlocks the next region | Reputation numbers exist. The only region past Arizona is `mountain_range` at 50 reputation plus the bridge. | **Partial.** Trust is reputation ≥ 40 (the sum of the bike quests plus one desert quest). The new map node is a ceremony, not a new biome. |
| First systems upgrade | Not a single flag. | **Done.** `regional_travel` is stamped when the gates pass. The world map shows "Road Beyond the Desert." |

Reading used for the material gate: the bridge quest's own learning goal is
"material selection through hands-on testing." Completing it counts as the
demonstration. A separate thermal or composite quest also counts if the
bridge was not the test the child did. This is a reading of Act 1's
completion list, not a Section 6 material-science decision.

## Setting and learning goals

| Item | Status |
| --- | --- |
| Sonoran neighborhood, garage, desert, mine, river, dry wash | **Done** (already shipped scenes). |
| Bike mechanics lessons | **Done** via flat tire, chain, explainers. |
| Desert ecology and foraging | **Partial.** Quests and foraging scenes exist. Several map props were still "coming soon." This branch turns the sports-field start, pool board, dock, and dog-park props into short lessons. |
| Chemistry and dose-response | **Partial.** `medicine_balance` and crafting recipes exist. Stage-1 biology recipes exist; Stages 2 and 3 stay stubs (Act 2 / Act 3). |
| Materials, construction, fog map | **Done** as previously shipped systems. This branch does not replace them. |
| Community and trust | **Partial.** Reputation is the trust number. Cultural mentor dialogue is **not** authored here. |

## Systems named in Act 1

| System | Status | Note |
| --- | --- | --- |
| Bike movement and upgrade | **Done** | Walk, pad, garage tools, upgrade items on quest rewards. |
| Garage / workbench | **Done** | Layout, recipes, onboarding. |
| Inventory and foraging | **Done** | Item ids, forage steps, crafting recipes. |
| Materials lab / UTM | **Done** | Canonical instrument. Not re-platformed. |
| Thermal rig | **Done** | Desert heat lessons. |
| Bridge construction | **Done** | Drag/drop construction system. |
| Quest engine / NPC dialogue | **Partial** | Works. Some steps still name scenes. Observation gating is still uneven (known in `arc.md` §4). This branch does not rewrite every quest. |
| Fog-of-war discovery map | **Done** | Existing discovery state. Not duplicated. |
| Language interaction layer | **Missing → mechanics only** | `data/languages.js` already contains Arabic and Spanish lines from earlier work. This branch does **not** add culture-specific lines. New practice cards are English placeholders. |
| Knowledge state | **Design only → v1 shipped beside old unlocks** | See decisions. Existing `state.knowledge` concept unlocks are left in place. |

## Coming-soon props

| Prop | This branch |
| --- | --- |
| Interaction manager repair / craft / puzzle / pace | Real checks against inventory, recipes, or a lesson question. |
| Sports-field start line | Pace lesson (friction and gears). |
| Pool diving board | Buoyancy lesson. |
| Lake dock (when not already in the boat quest) | Shade and water lesson. |
| Dog-park ball and collar | Short observations, not a promised quest. |
| Mountain cave and lake cave | No dungeon. One sentence on rock and heat, plus an observation. A cave puzzle still needs a human brief. |

## Explicitly not in this branch

- Child-safety lockdown (PIN, external links, YouTube embed, API key, shopping, spelling OCR).
- Act 2 regions, spacecraft, Stage 2/3 biology.
- New Arabic, Spanish, or indigenous dialogue.
- Silent answers to Section 6 questions that have no proposed default.
