# Act 1 Completion Task List

Date: 2026-05-18
Repo: `C:\dev\bikebrowser`

## Purpose

This file defines the work still needed to consider Act 1 fully complete.

Working definition of complete Act 1:
- the backend Act 1 quest graph and the human-facing Act 1 UX are aligned
- the player can complete the full intended Act 1 learning arc without ambiguity
- the important characters, stations, and world transitions are surfaced in play rather than existing only as backend references
- the Act 1 critical path is stable under validation and playtest
- optional Act 1 side content is either fully surfaced or explicitly deferred

## Current State Summary

Backend Act 1 is broader than the player-facing path.

Currently loaded backend shape:
- 19 quests
- 10 NPC scenes
- 25 dialogue files
- 7 regions
- 56 registered items

Currently surfaced and interactable Act 1 spine:
- `bike_safety_check`
- `flat_tire_repair`
- `chain_repair`
- `bridge_quest_5`
- `desert_plant_observation`
- `test_water_quality`
- `copper_rock_id`
- `workshop_first_build`
- `act1_regional_readiness`

Main gap:
- Act 1 is functionally completable through the guided UX
- the backend content graph is wider than what the current player path exposes

## Definition Of Done

Act 1 should be considered complete only when all of the following are true:

1. The full intended Act 1 critical path is playable, readable, and emotionally coherent.
2. Every critical Act 1 quest has clear entry, progress, completion, and reward surfacing in the player UX.
3. Every Act 1 mentor or character that the story depends on is visibly present in the player route, not only in data or dialogue files.
4. Optional loaded Act 1 quests are either surfaced intentionally or marked deferred and removed from the active player-facing expectation.
5. Key inventory objects and stations that matter to Act 1 are introduced through play, not only registered in backend data.
6. Headless validation, runtime validation, and player-facing smoke coverage reflect the real Act 1 path.

## Act 1 Work Buckets

## 1. Lock The Critical Path

These are the quests that currently define the real Act 1 spine and must feel complete first.

### 1.1 Bike Safety Check
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/bike_safety_check.json`

Remaining tasks:
- Confirm the player is introduced cleanly to Mrs. Ramirez and understands why the safety check matters.
- Ensure each step is visibly acknowledged in the HUD or quest log:
  - `talk_to_mrs_ramirez`
  - `check_brakes`
  - `check_tires`
  - `check_chain`
  - `report_safety_check`
- Ensure reward feedback is readable and calm, not noisy.
- Verify this quest transitions naturally into tire/repair learning instead of feeling like a detached checklist.

### 1.2 Flat Tire Repair
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/flat_tire_repair.json`

Remaining tasks:
- Ensure each step is visible and attributable to player action:
  - `inspect_wheel`
  - `remove_tube`
  - `apply_patch`
  - `inflate_tire`
  - `verify_wheel_ready`
- Verify the TireRig teaches physical intuition rather than only rewarding step completion.
- Confirm repair completion is easy to read on mobile and low-resolution layouts.
- Confirm reward/badge messaging does not crowd out the sense of repair satisfaction.

### 1.3 Chain Repair
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/chain_repair.json`

Remaining tasks:
- Ensure Mr. Chen's chain quest remains the strongest embodied mechanic in Act 1.
- Ensure each chain step remains visible and attributable:
  - inspect chain
  - rotate pedals
  - align chain
  - seat chain
  - test rotation
- Verify the ChainRig still carries emotional pacing and mechanical clarity in the live route.
- Keep chain repair aligned with any tutorial text or first-session onboarding docs.

### 1.4 Bridge Completion / Celebration Layer
Status: partially surfaced through `bridge_quest_5`
Quest file: `BikeBrowserWorld/Data/missions/bridge_quest_5.json`

Remaining tasks:
- Ensure the player understands the bridge arc as a meaningful neighborhood problem, not a sudden late-game reward ceremony.
- Surface all `bridge_quest_5` steps clearly:
  - `talk_to_neighbors`
  - `receive_badge`
  - `unlock_new_area`
  - `learn_triangles`
- Make the bridge lesson feel like force/structure understanding, not abstract exposition.
- Ensure the new area unlock is clearly legible and worth the effort.

### 1.5 Desert Plant Observation
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/desert_plant_observation.json`

Remaining tasks:
- Ensure Ranger Nita is introduced as a real guide, not only as a station trigger.
- Confirm the player understands what counts as observation and reporting.
- Make the ecology loop feel like embodied noticing, not item scanning.
- Tie the observation output clearly into later review/capstone understanding.

### 1.6 Water Quality
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/test_water_quality.json`

Remaining tasks:
- Ensure Dr. Maya is meaningfully surfaced in the route.
- Confirm the player understands the sequence of collection, testing, identification, and reporting.
- Verify the station communicates evidence and comparison, not just sample collection.
- Ensure water evidence connects to broader systems thinking in the capstone.

### 1.7 Copper Evidence
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/copper_rock_id.json`

Remaining tasks:
- Ensure Old Miner Pete is meaningfully surfaced in the route.
- Confirm the player understands what makes copper evidence plausible.
- Make the conductivity/test logic feel discoverable and physical.
- Ensure the mine station reads as evidence gathering, not just pickup interaction.

### 1.8 Workshop First Build
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/workshop_first_build.json`

Remaining tasks:
- Ensure the workshop friends are introduced in a way that feels socially grounded.
- Confirm the player understands how raw material becomes a first useful part.
- Ensure the build feels like synthesis of earlier knowledge rather than a disconnected crafting menu.
- Make the chosen helper/friend meaningful in tone and identity.

### 1.9 Act 1 Regional Readiness Capstone
Status: surfaced in UX
Quest file: `BikeBrowserWorld/Data/missions/act1_regional_readiness.json`

Required steps:
- `review_bike_systems`
- `review_bridge_systems`
- `review_ecology_water`
- `review_materials_workshop`
- `sketch_regional_questions`
- `receive_spacecraft_clue`

Remaining tasks:
- Ensure all capstone prerequisites are enforced and understandable.
- Make the capstone feel like synthesis of lived experience, not an exam screen.
- Ensure the sketchbook and spacecraft clue land as curiosity-expanding rewards, not lore dumps.
- Verify the capstone communicates the bridge from neighborhood mechanics to larger systems.

## 2. Surface The Backend Quests That Still Sit Behind The UX

These quests are loaded in backend Act 1 but not yet clearly surfaced in the main player-facing path.

### 2.1 Bridge quest chain before `bridge_quest_5`
Loaded backend quests:
- `bridge_quest_1`
- `bridge_quest_2`
- `bridge_quest_3`
- `bridge_quest_4`
- `bridge_material_test`

Tasks:
- Decide whether the full bridge quest chain should become explicitly playable in Act 1 or remain condensed into the current surfaced bridge review path.
- If kept active, surface entry points, NPC ownership, and step progression clearly.
- If not kept active, either merge their function into the current UX path or mark them deferred and remove them from active Act 1 expectations.
- Ensure the bridge does not feel like unexplained missing middle chapters.

### 2.2 Ecology side quests
Loaded backend quests:
- `water_sample_observation`
- `algae_bloom_source`
- `track_the_animal`

Tasks:
- Decide whether these are mandatory Act 1 content, optional Act 1 side quests, or post-Act-1 expansions.
- If they remain Act 1, surface them with clear quest givers, location cues, and emotional relevance.
- Ensure they deepen the ecology/water arc instead of fragmenting it.
- If deferred, explicitly remove them from the sense that Act 1 is unfinished because of hidden quest stubs.

### 2.3 Materials / mine side quest
Loaded backend quest:
- `mine_cart_repair`

Tasks:
- Decide whether mine-cart repair is part of the real Act 1 player promise.
- If yes, surface it through Pete and the mine route with clear affordances.
- If not, move it out of the active Act 1 completion expectation.

### 2.4 `first_safety_check`
Loaded backend quest:
- `first_safety_check`

Tasks:
- Determine whether this is legacy overlap with `bike_safety_check` or a distinct onboarding step.
- Remove duplication in player expectations.
- Keep only one clearly surfaced first safety quest unless both are narratively necessary.

## 3. Surface The Missing Character Layer

These are the main character gaps between backend references and human-facing experience.

### 3.1 Essential mentors already encountered but needing stronger presence
Characters:
- Ranger Nita
n- Old Miner Pete
- Dr. Maya
- Zevon
- Jacob
- Charlie
- Cole
- James

Tasks:
- Ensure each character is introduced as a person, not only as a station owner or backend quest giver.
- Give each one at least one memorable player-facing identity moment.
- Ensure the player can associate each mentor with a domain of knowledge.

### 3.2 Referenced but not clearly surfaced Act 1 people
Characters/groups:
- Shopkeeper
- neighbors / neighbor kids
- Mom
- Abuela Rosa
- Uncle Karim

Tasks:
- Decide which of these are required for Act 1 completion and which are only flavor for now.
- If required, wire them into visible scene presence and interaction paths.
- If not required, keep their dialogue from implying missing obligations the player can never fulfill.

### 3.3 Mr. Chen and Mrs. Ramirez arc continuity
Tasks:
- Ensure the player always feels guided back into the neighborhood warmth of Act 1.
- Verify Mr. Chen and Mrs. Ramirez remain the emotional anchors of the first act.
- Keep the side-region mentors as expansion of the neighborhood world, not replacements for it.

## 4. Surface The Missing Object And Station Layer

The backend contains many registered items and scene objects that are not yet meaningfully felt by the player.

### 4.1 Mechanics objects
Examples:
- Bike Chain
- Inner Tube
- Patch Kit
- Tire Lever
- Air Pump
- Multi-Tool
- Chain Lube
- Brake Pads
- Spoke
- Gear Cable

Tasks:
- Ensure the core repair objects used in the main path are introduced through use, not just inventory registration.
- Decide which registered mechanic items are truly part of Act 1 interaction and which are future scaffolding.

### 4.2 Materials and science objects
Examples:
- Copper Ore
- Water Sample
- Algae Sample
- Macroinvertebrate
- Water Test Strip
- pH Chart
- Field Guide
- Binoculars
- Magnifying Glass
- Regional Travel Sketchbook
- Spacecraft Clue Card

Tasks:
- Ensure every item the player is meant to care about is acquired, observed, or discussed in-scene.
- Avoid backend-only items bloating the sense of unfinished content.
- Ensure capstone reward items are surfaced with meaning, not just granted silently.

### 4.3 Station and route readability
Surfaced stations already present:
- safety check bike
- TireRepairStation / TireRig
- ChainHotspot / ChainRig
- PlantObservationStation
- WaterQualityStation
- CopperEvidenceStation
- WorkshopBuildStation
- BridgeReviewStation
- Act1CapstoneStation

Tasks:
- Verify every important station has clear approach, prompt, feedback, and completion language.
- Ensure route exits to Desert, Mine, River, Garage, and bridge destinations are visible and emotionally understandable.
- Reduce any “prototype energy” where stations feel like disconnected kiosks instead of neighborhood/world affordances.

## 5. Unify Documentation And Onboarding With The Real Act 1 Path

Tasks:
- Align tutorial and onboarding docs with the actual current playable Act 1 opening.
- Resolve any mismatch between “garage-first” onboarding language and the currently surfaced neighborhood/repair route.
- Ensure Act 1 docs, quest log text, and mentor dialogue all tell the same story about what the first act is.

## 6. Validation Tasks Required Before Calling Act 1 Complete

### 6.1 Godot validation coverage
Tasks:
- Ensure the main surfaced Act 1 spine remains covered by headless validation where possible.
- Keep these validations green:
  - `vertical_slice_check.gd`
  - `brake_rig_state_check.gd`
  - `chain_rig_state_check.gd`
  - `tire_rig_state_check.gd`
  - `interaction_overlap_check.gd`
  - runtime boot / RuntimeValidator
- Add or extend tests when backend Act 1 quests become newly surfaced in the player route.

### 6.2 UX smoke coverage
Tasks:
- Extend browser-facing smoke coverage for surfaced Act 1 flows.
- Add dedicated player-facing coverage for mechanic readability and regional route coherence.
- Add targeted smoke checks for capstone completion and reward surfacing.

### 6.3 Playtest coverage
Tasks:
- Run human-facing playtests focused on:
  - onboarding clarity
  - TireRig readability
  - ChainRig readability
  - Bridge/capstone coherence
  - mobile readability
  - emotional warmth and neighborhood continuity
- Record where the player loses the thread between neighborhood repair and wider regional learning.

### 6.4 Telemetry coverage
Tasks:
- Ensure telemetry reflects the real Act 1 path instead of only backend quest completions.
- Track where players stall, backtrack, or skip interactions in the critical path.
- Use overnight capture/visual analysis to identify HUD clutter, unreadable framing, and route confusion.

## 7. Priority Order

Complete Act 1 in this order:

### Tier 1: Must finish first
- Lock the current critical path quests end to end.
- Ensure the capstone is coherent and satisfying.
- Ensure Mr. Chen and Mrs. Ramirez remain the emotional anchors.
- Validate the current guided UX across desktop and mobile.

### Tier 2: Must resolve for truthfulness
- Decide which loaded backend quests are truly part of Act 1.
- Surface or explicitly defer the bridge subquests and ecology/mine side quests.
- Remove any misleading implication that the player is missing content that is actually just hidden backend scaffolding.

### Tier 3: Must resolve for world completeness
- Surface the missing character layer.
- Surface important item meaning and station clarity.
- Improve social warmth and neighborhood inhabitation.

### Tier 4: Polish / convergence
- Clean tutorial/documentation mismatch.
- Improve reward clarity and pacing.
- Improve mobile readability and route calmness.
- Reduce prototype/kiosk energy in side-region stations.

## 8. Final Verdict

Act 1 should not be considered complete just because the player can reach the capstone.

Act 1 is complete when:
- the current critical path is strong and emotionally coherent
- the backend quest graph no longer overpromises unseen content
- the missing mentors, social layer, and meaningful objects are surfaced enough to make the world feel whole
- the first act reads as one warm embodied-learning journey instead of a set of disconnected mechanics and hidden quest stubs
