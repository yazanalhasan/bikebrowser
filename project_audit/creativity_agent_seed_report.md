# Creativity-Agent Phase 9 Seed Report

Date: 2026-05-19
Lane: Creativity-Agent
Workspace: C:\dev\bikebrowser

## Scope Decision

Phase 9 is proposal-first. I did not add implementation hooks in this pass because the codebase is active with other agents and the requested gaps are best handed off as narrow station/notebook additions. The proposals preserve /play as canonical Godot, do not expand Act 2, do not add regions, and keep one creative moment per quest.

## Proposal Blocks
~~~text
GAP ID: plant-rib-rubbing
GAP CLASS: A/G
QUEST / LOCATION: desert_plant_observation / Desert Trail PlantObservationStation
NPC OWNER: Ranger Nita frames it as "show me the plant's trick without taking anything from it."
ONE-LINE INSIGHT: Desert plants solve heat and water problems with shape, not decoration.
INSPIRED BY: The Witness - noticing a local visual rule and tracing it back into the world
PLAYER VERBS: touch, turn, trace
INTERACTION (embodied, ~5 lines):
The player kneels at one already-observable plant and turns a small notebook stencil over its silhouette.
They trace one rib, pad, or leaf edge with the cursor/finger.
They rotate the stencil until the plant's shadow line matches the drawing.
They tap the observed feature that helps the plant save shade or water.
They close the notebook page and carry the traced shape back to Ranger Nita.
VISIBLE CAUSE/EFFECT:
The plant overlay settles into place, a soft shadow line appears, and Ranger Nita nods only when the observed feature matches the actual plant.
ARTIFACT PRODUCED:
Quest notebook page: "Plant Shape Rubbing" with the traced rib/pad/leaf edge.
MENSA LAYER (optional, second-read insight):
The same rib spacing echoes the bridge triangle lesson: repeated small shapes manage force, heat, or water better than one big surface.
FAILURE MODE (calm, never punishing):
The stencil lifts back slightly and Ranger Nita says to match the shape before naming it.
TIME BUDGET:
60-90s
ASSET NEEDS:
Aseprite plant stencil overlay, one notebook rubbing icon, 2 Ranger Nita TTS lines.
VALIDATION HOOK:
PlantObservationStation records plant_shape_rubbing_complete and notebook artifact id plant_shape_rubbing.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"I traced the plant before naming it. Its shape helps it hold water and make shade."
WHY THIS BELONGS HERE (<= 2 sentences):
The quest already asks for observation, so the gap is expression: the player needs to show what they noticed. It stays local to desert ecology and produces a field artifact instead of extra content.
~~~

~~~text
GAP ID: river-evidence-strip
GAP CLASS: C
QUEST / LOCATION: test_water_quality / Salt River WaterQualityStation
NPC OWNER: Dr. Maya frames it as "put the clues in the order the river gave them to you."
ONE-LINE INSIGHT: A water-quality answer is stronger when chemical and living evidence point the same way.
INSPIRED BY: Case of the Golden Idol - arranging evidence into a readable causal statement
PLAYER VERBS: dip, compare, place
INTERACTION (embodied, ~5 lines):
The player dips the sample strip and watches the color settle.
They drag the strip beside the pH chart instead of selecting from a menu.
They place one macroinvertebrate card next to the matching sensitivity mark.
They slide both clues onto a small evidence board labeled "river today."
They tap the board once to report the combined evidence to Dr. Maya.
VISIBLE CAUSE/EFFECT:
The sample vial tint and bug-card marker align on the board; the report line changes from "one clue" to "two clues agree" when both are placed.
ARTIFACT PRODUCED:
Quest notebook page: "Salt River Evidence Strip" with pH color and macroinvertebrate card.
MENSA LAYER (optional, second-read insight):
The evidence board teaches that two weak signals can become one stronger pattern when they are independent.
FAILURE MODE (calm, never punishing):
The misplaced card slides to a "check again" corner and Dr. Maya asks what the chart and tray have in common.
TIME BUDGET:
75-90s
ASSET NEEDS:
pH strip sprite states, macroinvertebrate evidence cards, one notebook evidence strip icon, 2 Dr. Maya TTS lines.
VALIDATION HOOK:
WaterQualityStation records water_evidence_strip_complete only after ph_match_recorded and macro_card_placed.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"My water clue was not just a color. I matched the strip and the tiny river animals before reporting."
WHY THIS BELONGS HERE (<= 2 sentences):
The existing quest already contains pH and macroinvertebrates, but the player needs to connect them physically. This turns collection into systems evidence without adding a new side quest.
~~~

~~~text
GAP ID: chain-sound-loop
GAP CLASS: A
QUEST / LOCATION: chain_repair / Garage ChainHotspot and ChainRig
NPC OWNER: Mr. Chen frames it as "make the quiet part happen with your hands, then tell me why."
ONE-LINE INSIGHT: A chain is fixed when force travels smoothly from pedal to wheel.
INSPIRED BY: Stephen's Sausage Roll - small spatial alignment causing an obvious mechanical result
PLAYER VERBS: rotate, align, listen
INTERACTION (embodied, ~5 lines):
The player rotates the pedal slowly and hears a soft click where the chain rides wrong.
They nudge the chain guide left or right until links sit over the sprocket teeth.
They rotate again and watch the rear wheel begin turning evenly.
They hold for one final smooth half-turn.
They tap Mr. Chen's notebook prompt: "pedal, chain, wheel."
VISIBLE CAUSE/EFFECT:
Clicking audio fades into a smooth chain sound, the rear wheel animation steadies, and the chain path highlight becomes continuous.
ARTIFACT PRODUCED:
Quest notebook page: "Pedal to Wheel Loop" with three connected sketches.
MENSA LAYER (optional, second-read insight):
The chain is the same idea as a bridge brace in motion: alignment lets force travel instead of wobble.
FAILURE MODE (calm, never punishing):
The pedal turns but the wheel stutters, and Mr. Chen says the links are close but not carrying yet.
TIME BUDGET:
60-90s
ASSET NEEDS:
Existing ChainRig states, small chain path highlight, one smooth/rough audio contrast, 2 Mr. Chen TTS lines.
VALIDATION HOOK:
ChainRig emits chain_sound_loop_complete after align_chain, seat_chain, and test_rotation complete in order.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"When the chain sat on the teeth, the pedal could move the wheel. Smooth motion means the force found its path."
WHY THIS BELONGS HERE (<= 2 sentences):
Chain repair is already embodied, but this locks the understanding into a cause-and-effect loop the player can explain. It does not add a second quest moment; it sharpens the existing one.
~~~

~~~text
GAP ID: tire-patch-choice
GAP CLASS: D/G
QUEST / LOCATION: flat_tire_repair / Garage TireRepairStation
NPC OWNER: Mrs. Ramirez frames it as "choose the patch that covers the leak, not the prettiest one."
ONE-LINE INSIGHT: A repair choice is good when it covers the cause and still lets the part work.
INSPIRED BY: A Monster's Expedition - simple object placement revealing why one shape works
PLAYER VERBS: inspect, choose, press
INTERACTION (embodied, ~5 lines):
The player rotates the tube until the tiny bubble leak is visible.
Three patch shapes sit beside it: too small, just right, and needlessly large.
The player chooses one and presses it over the leak.
They pump once and watch for bubbles.
They verify the wheel only after the chosen patch holds.
VISIBLE CAUSE/EFFECT:
A too-small patch lets one bubble escape, a too-large patch wrinkles at the edge, and the fitted patch seals cleanly.
ARTIFACT PRODUCED:
Inventory/notebook artifact: "Fitted Patch Sample" with the chosen patch outline.
MENSA LAYER (optional, second-read insight):
The correct patch is not maximum coverage; it is enough coverage with clean edges, mirroring later material tradeoffs.
FAILURE MODE (calm, never punishing):
Air bubbles reappear slowly and Mrs. Ramirez says the leak is still showing where the patch missed or wrinkled.
TIME BUDGET:
60-90s
ASSET NEEDS:
Three patch sprites, bubble leak sprite, tube close-up state, 2 Mrs. Ramirez TTS lines.
VALIDATION HOOK:
TireRepairStation records tire_patch_choice_complete when apply_patch uses fitted_patch and inflate_tire confirms no_bubbles.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"I picked the patch that covered the leak with clean edges. Bigger was not automatically better."
WHY THIS BELONGS HERE (<= 2 sentences):
The tire quest needs a real choice that expresses understanding rather than a fixed checklist. The choice is small, visible, and entirely inside the existing repair station.
~~~

~~~text
GAP ID: brake-catch-mark
GAP CLASS: A
QUEST / LOCATION: bike_safety_check / Neighborhood SafetyCheckStation
NPC OWNER: Mrs. Ramirez frames it as "find the moment the brake starts helping."
ONE-LINE INSIGHT: A brake feels safe when squeezing the lever makes the wheel slow before the handle touches the grip.
INSPIRED BY: Return of the Obra Dinn - reading a specific moment in a sequence instead of just seeing the outcome
PLAYER VERBS: squeeze, mark, release
INTERACTION (embodied, ~5 lines):
The player gently squeezes the brake lever while the wheel spins.
A small moving mark shows lever travel from loose to firm.
The player drops a chalk tick at the first moment the wheel visibly slows.
They release and squeeze once more to compare the tick against the catch point.
They report "catches early" or "needs help" to Mrs. Ramirez.
VISIBLE CAUSE/EFFECT:
The wheel spin slows at the catch point, and the chalk tick either lines up with safe travel or sits too close to the grip.
ARTIFACT PRODUCED:
Quest notebook page: "Brake Catch Mark" with lever travel and wheel response.
MENSA LAYER (optional, second-read insight):
The best clue is not whether the wheel stops eventually, but when cause begins after input.
FAILURE MODE (calm, never punishing):
If the tick is placed before or after the slowdown, it fades and Mrs. Ramirez asks the player to watch the wheel, not the lever alone.
TIME BUDGET:
45-75s
ASSET NEEDS:
Brake lever travel marker, chalk tick UI, wheel slow/fast state, 2 Mrs. Ramirez TTS lines.
VALIDATION HOOK:
SafetyCheckStation records brake_catch_mark_complete when check_brakes includes catch_tick_within_safe_band.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"I marked where the brake started slowing the wheel. Safe brakes catch before the lever reaches the grip."
WHY THIS BELONGS HERE (<= 2 sentences):
The safety check already includes brakes, but this makes the player's hand connect to the wheel response. It is calm, fast, and helps later mechanical thinking.
~~~

~~~text
GAP ID: copper-test-chain
GAP CLASS: C
QUEST / LOCATION: copper_rock_id / Copper Mine CopperEvidenceStation
NPC OWNER: Old Miner Pete frames it as "make the rock prove itself twice."
ONE-LINE INSIGHT: Copper evidence is stronger when color, weight, and conductivity agree.
INSPIRED BY: Her Story / Immortality - linking separate evidence fragments into one reliable conclusion
PLAYER VERBS: compare, touch, sort
INTERACTION (embodied, ~5 lines):
The player compares three existing rock samples by color stain and heft.
They place the likely sample on a small conductivity contact.
They touch the test leads to two marked spots on the sample.
They sort the sample into "color only" or "color plus conducts."
They report the sorted evidence to Pete.
VISIBLE CAUSE/EFFECT:
The meter needle twitches only for the conductive sample, and Pete's sorting tray label changes from "guess" to "evidence."
ARTIFACT PRODUCED:
Quest notebook page: "Copper Evidence Chain" with stain, heft, and conductivity marks.
MENSA LAYER (optional, second-read insight):
A flashy green stain can mislead; the reliable sample is the one where independent tests converge.
FAILURE MODE (calm, never punishing):
The tray accepts the sample but labels it "one clue only," and Pete invites another test before reporting.
TIME BUDGET:
75-90s
ASSET NEEDS:
Three sample cards/sprites, conductivity meter twitch, notebook evidence-chain icon, 2 Miner Pete TTS lines.
VALIDATION HOOK:
CopperEvidenceStation records copper_test_chain_complete after find_copper_rock and test_conductivity produce matching evidence flags.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"The best copper sample had more than a green clue. It also carried the little test current."
WHY THIS BELONGS HERE (<= 2 sentences):
The mine quest needs the player to connect observation and testing, not just pick up copper. The action stays inside the existing evidence station and uses Pete's current role.
~~~

~~~text
GAP ID: workshop-part-fit
GAP CLASS: G
QUEST / LOCATION: workshop_first_build / Garage WorkshopBuildStation
NPC OWNER: Zevon frames it as "show us where your part belongs before we call it useful."
ONE-LINE INSIGHT: A built part matters when it fits a real system need.
INSPIRED BY: SpaceChem - assembling a small output that must satisfy a clear downstream requirement
PLAYER VERBS: choose, fit, tighten
INTERACTION (embodied, ~5 lines):
The player brings one raw material to the workshop station.
They choose one friend helper from the existing garage group for tone, not a new route.
They drag the crafted part outline onto a bike/science-project silhouette.
They tighten one fastener or clip until the outline stops wobbling.
They stamp the notebook with "fits the need."
VISIBLE CAUSE/EFFECT:
A mismatched part sits crooked, while the correct part snaps flush and makes the target system animate once.
ARTIFACT PRODUCED:
Inventory artifact: "First Useful Part" plus notebook page showing where it fits.
MENSA LAYER (optional, second-read insight):
The same material can be wrong or right depending on the system it serves; usefulness is relational.
FAILURE MODE (calm, never punishing):
The part rests beside the silhouette and the helper says it is well-made but not useful there yet.
TIME BUDGET:
75-90s
ASSET NEEDS:
Part outline overlay, one fit/wobble animation, notebook stamp, 2 garage friend TTS lines using existing characters.
VALIDATION HOOK:
WorkshopBuildStation records workshop_part_fit_complete after craft_first_part and part_fit_target_matched.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"My first part became useful when it fit a real job. Building is not done until the part belongs somewhere."
WHY THIS BELONGS HERE (<= 2 sentences):
The workshop quest is the synthesis point, so expression belongs here. The player shows understanding through fit instead of reading a crafting explanation.
~~~

~~~text
GAP ID: spacecraft-systems-fold
GAP CLASS: E/F
QUEST / LOCATION: act1_regional_readiness / Neighborhood Act1CapstoneStation
NPC OWNER: Mr. Chen frames it as "fold your local clues into one bigger question."
ONE-LINE INSIGHT: Bikes, bridges, rivers, plants, copper, and spacecraft all depend on systems carrying force, matter, or signals.
INSPIRED BY: Tunic - a late page recontextualizing earlier simple marks into a larger pattern
PLAYER VERBS: fold, match, place
INTERACTION (embodied, ~5 lines):
The player opens the Regional Travel Sketchbook to a fold-out page with six empty clue slots.
They place one earned artifact from bike, bridge, plant, water, copper, and workshop moments.
They fold the page once so matching arrows touch: force, flow, material, signal.
They place the Spacecraft Clue Card over the aligned arrows.
They write one wider-region question from the revealed prompt.
VISIBLE CAUSE/EFFECT:
Earlier notebook marks line up into four system arrows, and the spacecraft card reveals a quiet diagram only when the fold is correct.
ARTIFACT PRODUCED:
Regional Travel Sketchbook fold-out and Spacecraft Clue Card with first question.
MENSA LAYER (optional, second-read insight):
The clue was not new lore; it was hidden in the way prior artifacts categorized systems all along.
FAILURE MODE (calm, never punishing):
The fold opens back up and Mr. Chen asks which two marks carry the same kind of thing.
TIME BUDGET:
2-3 min
ASSET NEEDS:
Sketchbook fold-out UI, clue card overlay, six artifact thumbnails, 3 Mr. Chen TTS lines.
VALIDATION HOOK:
Act1CapstoneStation records spacecraft_systems_fold_complete after all six artifact ids are placed and receive_spacecraft_clue fires.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"My local clues can become bigger system questions. Spacecraft use force, flow, materials, and signals too."
WHY THIS BELONGS HERE (<= 2 sentences):
The capstone should open curiosity without launching Act 2. This uses only earned Act 1 artifacts and makes the reward re-readable.
~~~

~~~text
GAP ID: mr-chen-bench-habit
GAP CLASS: H
QUEST / LOCATION: chain_repair and bridge_quest_5 / Garage or Neighborhood Mr. Chen station
NPC OWNER: Mr. Chen frames it as "every tool goes back where the next repair can find it."
ONE-LINE INSIGHT: Mr. Chen is a person with habits, and his habits teach mechanical care.
INSPIRED BY: Untitled Goose Game - character routine as readable world logic, not dialogue exposition
PLAYER VERBS: pick, place, notice
INTERACTION (embodied, ~5 lines):
After the chain or bridge station, one tool remains on Mr. Chen's bench in the wrong spot.
The player picks it up and places it on the matching pegboard silhouette.
Mr. Chen glances at the bench before speaking, then relaxes when the tool is home.
A small grease mark on the pegboard lines up with the tool handle.
The notebook records the bench habit as a character/world note.
VISIBLE CAUSE/EFFECT:
The bench changes from cluttered to ready, Mr. Chen's idle animation returns to measuring, and the interaction prompt disappears.
ARTIFACT PRODUCED:
Notebook character note: "Mr. Chen's Bench Habit."
MENSA LAYER (optional, second-read insight):
The grease marks reveal tool order by use frequency, quietly foreshadowing which repairs matter most.
FAILURE MODE (calm, never punishing):
The tool rests but does not settle; Mr. Chen says the pegboard already knows the shape.
TIME BUDGET:
30-60s
ASSET NEEDS:
One misplaced tool sprite, pegboard silhouette highlight, one Mr. Chen idle glance if available, 2 TTS lines.
VALIDATION HOOK:
NpcInteraction or station script records mr_chen_bench_habit_complete and notebook note id mr_chen_bench_habit.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"Mr. Chen puts tools back by shape and grease marks. A ready bench makes the next repair calmer."
WHY THIS BELONGS HERE (<= 2 sentences):
This makes Mr. Chen inhabit the space without adding an NPC or side quest. It teaches care through a tiny physical routine tied to existing garage mechanics.
~~~

~~~text
GAP ID: map-wash-shadow
GAP CLASS: B
QUEST / LOCATION: act1_regional_readiness / Neighborhood map and dry wash edge
NPC OWNER: Mrs. Ramirez frames it as "mark what the map does not shout."
ONE-LINE INSIGHT: A map is more useful when the player notices quiet land patterns, not only icons.
INSPIRED BY: Outer Wilds - environmental observation turning a familiar place into a readable map
PLAYER VERBS: look, mark, compare
INTERACTION (embodied, ~5 lines):
The player stands by the existing neighborhood map or dry wash sign.
They look from the map line to the real wash shadow nearby.
They place one small pencil mark where the wash crosses the travel route.
They compare it with the bridge and river marks already known.
The notebook adds a quiet route observation without gating travel.
VISIBLE CAUSE/EFFECT:
A faint wash line appears on the notebook map, and the bridge/river route labels become easier to read without changing unlocks.
ARTIFACT PRODUCED:
Notebook map annotation: "Wash Shadow Mark."
MENSA LAYER (optional, second-read insight):
The dry wash, Salt River, and bridge are one water-shape story at different timescales.
FAILURE MODE (calm, never punishing):
The mark erases softly if placed on a road icon instead of the wash line, and Mrs. Ramirez asks what shape water would follow.
TIME BUDGET:
30-60s
ASSET NEEDS:
Notebook map overlay line, pencil mark sprite, 1 Mrs. Ramirez TTS line.
VALIDATION HOOK:
Map/notebook station records map_wash_shadow_complete; it must not be a prerequisite for region unlocks.
NOTEBOOK ENTRY (verbatim, child-readable, <= 2 sentences):
"I marked the quiet wash line on my map. Some routes are shaped by water even when they look dry."
WHY THIS BELONGS HERE (<= 2 sentences):
Act 1 already uses neighborhood, river, and bridge spaces, but the player needs a quiet observation tying them together. It is notebook-only and never gates movement.
~~~

## Class Distribution

- A: 2 proposals (chain-sound-loop, brake-catch-mark)
- A/G: 1 proposal (plant-rib-rubbing)
- B: 1 proposal (map-wash-shadow)
- C: 2 proposals (river-evidence-strip, copper-test-chain)
- D/G: 1 proposal (tire-patch-choice)
- E/F: 1 proposal (spacecraft-systems-fold)
- G: 1 proposal (workshop-part-fit)
- H: 1 proposal (mr-chen-bench-habit)

## Consolidated Asset Needs

- Notebook artifacts: plant rubbing, Salt River evidence strip, pedal-to-wheel loop, fitted patch sample, brake catch mark, copper evidence chain, first useful part fit page, sketchbook fold-out, Mr. Chen bench habit, wash shadow map mark.
- Aseprite/UI sprites: plant stencil, pH strip states, macroinvertebrate cards, chain path highlight, patch shapes, bubble leak, brake lever marker, conductivity samples/meter, part fit overlay, sketchbook fold-out/clue card overlay, misplaced tool/pegboard silhouette, notebook map pencil line.
- Animation/audio changes: smooth/rough chain audio contrast, wheel slow state, tube bubble feedback, meter twitch, part wobble/snap, Mr. Chen bench glance if feasible.
- TTS/dialogue: short lines for Ranger Nita, Dr. Maya, Mr. Chen, Mrs. Ramirez, Miner Pete, Zevon or existing garage friends. Keep each moment startable with one short sentence.

## Handoffs

- Systems/Gameplay: add completion flags to existing stations only: plant_shape_rubbing_complete, water_evidence_strip_complete, chain_sound_loop_complete, tire_patch_choice_complete, brake_catch_mark_complete, copper_test_chain_complete, workshop_part_fit_complete, spacecraft_systems_fold_complete, mr_chen_bench_habit_complete, map_wash_shadow_complete.
- Notebook/Inventory: register the 10 artifact IDs and ensure each quest writes exactly one artifact. map_wash_shadow_complete must remain notebook-only and never block route unlocks.
- Art: build small overlays/sprites from existing stations and props. No new asset pipeline, no new region art, no new NPCs.
- Audio/Voice: record or synthesize 1-3 calm mentor lines per moment. Avoid reward fanfare; these are understanding confirmations.
- Validation: extend existing station checks where available (SafetyCheckStation, TireRepairStation, ChainHotspot/ChainRig, regional stations, act1_player_path_check.gd) rather than adding broad new suites.
- Orchestrator: coordinate station ownership before implementation because multiple agents may be touching BikeBrowserWorld/Systems/Interactions/* and Act 1 scenes.

## Mensa-Layer Inventory

- Plant: repeated shapes manage heat/water/force across ecology and engineering.
- River: independent weak clues combine into stronger evidence.
- Chain: alignment lets force travel cleanly, like structural bracing in motion.
- Tire: correct repair is enough coverage with clean edges, not maximum size.
- Brake: the meaningful clue is when input begins causing output.
- Copper: visual clues can mislead until independent tests converge.
- Workshop: usefulness depends on the system receiving the part.
- Capstone: earlier artifact categories already contain the spacecraft clue grammar.
- Mr. Chen: grease marks reveal tool order and repair priorities.
- Map: dry wash, river, and bridge are one water-shape story at different timescales.

## Risks

- Scope creep risk: these can become minigames if implementation adds scoring, timers, or extra rounds. Keep each as a single station interaction.
- Collision risk: station scripts and Act 1 scenes are likely shared lanes. Implementation should land one quest at a time behind existing objective flags.
- Notebook risk: if artifacts are only reward text, the proposal fails. Each moment needs a persistent notebook/inventory artifact.
- Readability risk: overlays must be legible on mobile and low-resolution layouts, especially pH colors, patch shapes, and brake catch mark.
- Canon risk: the spacecraft clue must stay a curiosity reward, not an Act 2 launch or lore dump.
- Route risk: map-wash-shadow must never gate travel or create a hidden objective.
