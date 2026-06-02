# Acceptance Coordinate Audit

Compares the acceptance walkthrough's step targets against the **live runtime**
interaction zones, to prove the failure was zone-spacing (reality) and not stale
test coordinates.

## How the spec targets zones
`interactAt(page, step)` → `interactionTarget(page, step)` reads the **live**
`scene.interactions.zones` and returns the zone whose `id`/`action`/`label`
matches the step. So navigation targets are **runtime-derived**; the literal
`x/y` in the step objects are vestigial (not used for navigation). ⇒ the failure
is not "stale hardcoded coordinates."

## Step ↔ live zone (drifted tree, before fix)
| Step id | Live zone (id) | Live zone pos | Nearest-zone risk |
|---|---|---|---|
| bike_check | bike | (470,432) | ok (neighbor 420,438 ~50px) |
| mr_chen | mr_chen | (246,438) | ok |
| dry_wash | dry_wash | (1190,574) | ok |
| materials_table | materials_table | **(905,420)** | **collides with bridge_plan (~23px)** |
| ecology_patch | ecology_patch | (1030,760) | ok |
| chemistry_station | chemistry_station | (820,444) | ok (~90px to materials) |
| utm | utm | (742,408) | ok |
| bridge_plan | bridge_plan | **(920,438)** | **collides with materials_table (~23px)** ← failing step |
| bridge_repair | bridge_repair | (1255,642) | ok |
| wider_gate | wider_gate | (1484,514) | ok |

## Pairwise separation around the cluster (before → after fix)
| Pair | Before | After |
|---|---|---|
| materials_table (905,420) ↔ bridge_plan (920,438→1000,452) | **~23 px** ❌ | **~100 px** ✅ |
| bridge_plan ↔ chemistry (820,444) | ~100 px | ~182 px ✅ |
| bridge_plan ↔ utm (742,408) | ~180 px | ~262 px ✅ |
| bridge_plan ↔ ecology (1030,760) | far | far ✅ |

The 24 px `walkTo` ARRIVE band requires distinct zones to be comfortably > ~48 px
apart; baseline spacing was ~70 px. The drift compressed materials↔bridge_plan to
~23 px (inside the band); the fix restores ~100 px.

## What was NOT changed
- No acceptance assertion, step, prompt, threshold, or coverage altered.
- No `walkTo`/`interactionTarget` logic altered.
- Only the **game layout** (`bridge_plan_workbench` position) changed, fixing the
  real ambiguity.

## Outstanding hardening (separate, optional, not required for green)
`acceptance_hardening.md` S1 still recommends a `scene.interactions.byId(id)` for
precise scripted navigation (defense-in-depth against future closely-spaced
zones). Deferred; the layout fix restores green on its own.
