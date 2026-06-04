# Interactive Quest Playtest Audit — 2026-05-22

Scope: live browser playtest of `http://localhost:5174/play`, focused on interactive quest portions and especially the bike repair core. Screenshots captured from the in-app browser are in `project_audit/screenshots/whole_game_quest_audit/`.

## Screenshots Captured

- `project_audit/screenshots/whole_game_quest_audit/neighborhood_street.png`
- `project_audit/screenshots/whole_game_quest_audit/garage.png`
- `project_audit/screenshots/whole_game_quest_audit/dry_wash.png`
- `project_audit/screenshots/whole_game_quest_audit/desert_trail.png`
- `project_audit/screenshots/whole_game_quest_audit/salt_river.png`
- `project_audit/screenshots/whole_game_quest_audit/copper_mine.png`
- `project_audit/screenshots/whole_game_quest_audit/bridge_presentation_preview.png`

## Executive Read

The whole game is playable enough to navigate and inspect, but the current interaction quality is uneven. The Mr. Chen bridge notebook is now the strongest authored lesson surface. The bike repair core is the weakest relative to player expectation: it has real scripts and state machines, but the visible mechanical staging is confusing, misaligned, and sometimes physically backwards.

The biggest issue is not that the quests lack data. It is that the current visuals do not consistently prove the mechanic the quest claims to teach.

## Severity 1 — Bike Repair Core Breaks Mechanical Trust

### 1. Chain rig direction reads backwards

What I saw:
- In the garage screenshot, the repair bike points visually to the right: front wheel/fork are on the right, drivetrain should read as crank/front chainring toward the bike's middle/front and rear sprocket toward the back.
- In `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn`, the `RearWheel` and `Sprocket` are at `Vector2(78, -4)`, while `Chainring` and `Crank` are at `Vector2(-84, 22)`.
- In `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRig.gd`, `_seated_chain_point()` runs from `Vector2(-86, -9)` to `Vector2(78, -17)`, which means the chain seats from left chainring to right rear gear.

Why it matters:
- The player sees a right-facing bike, but the rig logic reads as if the rear wheel is in front of the crank.
- This matches your report that the chain is spinning toward the front.
- The result is worse than a cosmetic issue: it teaches the wrong spatial model for the drivetrain.

Likely owner:
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/ChainRig.gd`
- `BikeBrowserWorld/Regions/Garage/SlippedChainStation.tscn`

Fix direction:
- Flip the embedded drivetrain rig horizontally or rebuild node positions so rear sprocket/rear wheel sit behind the crank for the current bike orientation.
- Add a visual alignment test that checks chainring, rear sprocket, and bike-facing direction together, not just `sprocket.x > chainring.x`.

### 2. Tire repair station does not visually align as one repair object

What I saw:
- In `garage.png`, the wheel, tube, pump, lever, and patch kit are spread across the floor like separate props.
- The tire/wheel does not visually register as the same rear wheel/tube being removed from Mrs. Ramirez's bike.
- The player is asked to perform a continuous tire repair, but the layout looks like loose inventory icons arranged around Zuzu.

Why it matters:
- The interaction is supposed to be embodied: feel leak, expose tube, patch, inflate, verify.
- Current staging makes it hard to tell what is part of the mechanism, what is scenery, and what is clickable.
- A child will not naturally read "this tube belongs inside this tire, and this patch seals this specific puncture."

Likely owner:
- `BikeBrowserWorld/Regions/Garage/TireRepairStation.tscn`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`
- `BikeBrowserWorld/Systems/Interactions/TireRepairStation.gd`

Fix direction:
- Re-stage as a close repair mat: wheel/tire centered, tube partially pulled out at the leak site, pump connected by hose, patch applied directly over the puncture.
- Add a close-up camera/notebook overlay if the world-scale version remains too small.

### 3. Patch art reads as the packet/glue kit, not a single patch

What I saw:
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn` uses:
  - `PatchKitProp` with `res://Assets/Props/Repair/tire_patch_kit.png`
  - `Patch` with `res://Assets/Props/BikeRepair/patch_with_glue_tube.png`
- Even the applied patch is not a clean rubber patch; it includes the glue tube/kit concept.

Why it matters:
- The child-readable action should be: "small patch goes on small hole."
- The current asset says: "entire repair kit/package goes onto tire."
- This undercuts the causal chain of the tire lesson.

Likely owner:
- `BikeBrowserWorld/Assets/Props/BikeRepair/patch_with_glue_tube.png`
- `BikeBrowserWorld/Assets/Props/Repair/tire_patch_kit.png`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`

Fix direction:
- Keep the patch kit as a nearby supply prop.
- Create/use a separate `single_tube_patch.png` or small oval/square rubber patch sprite for the actual `Patch` node.
- Applied patch should be centered on `LeakMarker`, not visually detached from it.

## Severity 2 — Interaction Flow Is Hard To Trust

### 4. Normal playthrough interaction prompt appeared but did not advance during automation

What I saw:
- I navigated from the street toward Mrs. Ramirez.
- The prompt `[E] Talk to Mrs. Ramirez` appeared.
- Repeated `E`, `Space`, `Enter`, and click attempts did not open the dialogue in the automated browser session.

Why it matters:
- This may be automation-specific, but it reveals a real testing risk: prompts can be visible while acceptance is fragile.
- If this happens to a human intermittently, the first quest feels broken before the player reaches the garage.

Likely owner:
- `BikeBrowserWorld/Systems/Interactions/AnimatedNpcInteraction.gd`
- browser/Godot canvas focus handling
- `ui_accept` handling

Fix direction:
- Add a browser-level Playwright smoke that verifies visible `[E] Talk` prompt can actually open dialogue.
- Consider click/tap support on prompt or NPC for young players and mobile.

### 5. The HUD objective persists across playtest regions and muddies every screenshot

What I saw:
- Every region screenshot still shows `Mrs. Ramirez's Pre-Ride Check`, even when directly viewing dry wash, river, desert, mine, or bridge preview.

Why it matters:
- For normal Act 1 this may be intentional guidance.
- For playtest-region review, it hides whether the current station has its own contextual objective and makes screenshots look wrong.

Likely owner:
- `BikeBrowserWorld/Core/QuestRegistry/QuestRegistry.gd`
- `BikeBrowserWorld/Systems/UI/HudController.gd`
- playtest-region boot path

Fix direction:
- In playtest mode, allow region-local objective overrides or add a debug toggle to hide global guidance.

## Severity 3 — Other Quest Surfaces Are Mostly Station Prompts, Not Full Lessons Yet

### 6. Regional science stations are readable but still thin

What I saw:
- Desert, river, and mine regions have clear station labels and props.
- They look more coherent than the bike repair floor staging.
- They still read mostly as "walk to station, press E" rather than "discover through a physical object."

Examples:
- `desert_trail.png`: Plant station is visible, plants are arranged, but the central interaction zone is abstract.
- `salt_river.png`: Water station has good prop cluster, but the large water tile dominates more than the test-strip action.
- `copper_mine.png`: Copper evidence station has rocks and tools, but the evidence action is still prompt-first.

Fix direction:
- Add one visible cause/effect per station:
  - plant: magnifier/leaf shape comparison changes on screen
  - water: strip color visibly changes, macroinvertebrate tray highlights
  - copper: conductivity probe lights only on the right rock

### 7. Dry wash bridge build is structurally sparse compared with the notebook

What I saw:
- The dry wash region has Damage Review, Bridge Build, Later, and piles of material.
- It does not yet visually match the warmth/clarity of Mr. Chen's notebook lesson.

Why it matters:
- The notebook now teaches triangles well, but the in-world bridge quest still looks like a rough staging area.
- This creates a quality mismatch: lesson is better than the quest it supports.

Fix direction:
- Move some notebook visual language into the dry wash: sketched triangle ghost, load-path arrows, bracing preview before build.

## Quality Ranking By Quest Group

1. Bridge notebook lesson: best current interactive lesson surface.
2. Regional stations: visually understandable but mostly semi-embodied.
3. Mine/copper station: promising props, still prompt-led.
4. Dry wash bridge build: needs stronger cause/effect staging.
5. Bike repair core: highest priority repair; current mechanics are conceptually right but visually/physically misleading.

## Immediate Fix Order

1. Fix chain rig orientation so rear sprocket/rear wheel are actually rear relative to the bike.
2. Replace applied tire patch art with a single patch sprite.
3. Re-stage tire repair as a close-up repair mat with the tire/tube/patch/pump aligned.
4. Add a browser smoke for visible prompt -> successful interaction.
5. Add close-up screenshots/regression tests for chain and tire station states.

## Bottom Line

Yes: the interaction quality is currently bad in the bike repair core. Not unsalvageable, but bad enough that a player will notice the wrongness before they understand the intended mechanic. The chain orientation and patch packet issue should be treated as correctness bugs, not polish.
