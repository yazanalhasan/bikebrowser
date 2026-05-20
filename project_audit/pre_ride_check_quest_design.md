# Mrs. Ramirez's Pre-Ride Check Quest Design

Date: 2026-05-19
Quest ID: `act1_pre_ride_check`
Source quest to rename: `bike_safety_check`

## Intent

Turn the current safety check into Act 1's first complete embodied learning quest. Mrs. Ramirez teaches Zuzu a transferable pre-ride inspection model by doing the ABC check on Mrs. Ramirez's own bike, discovering a flat, repairing her tube at the garage, then returning for a final solo inspection.

The quest should feel like one continuous favor with stakes, not three disconnected skill prompts.

## Current-System Findings

- Mrs. Ramirez voice profile exists in `BikeBrowserWorld/Data/audio/voice_profiles.json`.
- Mr. Chen voice profile exists in the same file, and `MrChenNpc.tscn` exists. The garage scene has an `NPCLayer` with voiced NPC instances, so adding Mr. Chen support is a scene/data wiring task.
- `TireRig` already supports a hold-driven flat repair loop: leak found, tube exposed, patch sealed, pressure safe, verified. Retrofitting is a small delta, not a rewrite.
- The notebook is currently generated from `QuestRegistry.get_notebook_snapshot()`, not a standalone notebook authoring subsystem.
- Inventory is handled by `InventoryManager` with static labels and event-driven updates.
- Reward cues use the four-tier `AccomplishmentBus` and `AudioService` reward cue mapping.
- There is no freehand notebook drawing tool. The leak-marking moment should ship as a six-zone tube diagram choice, storing the selected zone in quest/game state and rendering it in the notebook snapshot.

## Halt-And-Surface Items

No hard halt found.

Scoped implementation decision: use six predefined tube zones for leak marking instead of freehand drawing. This preserves the intended understanding/expression moment without adding a broad drawing subsystem.

## Three-Act Flow

### Act 1: Learn The ABCs Together

Setting: Mrs. Ramirez's bike on the street near her house.

Mrs. Ramirez starts the renamed quest with voiced dialogue:

1. "Zuzu - perfect timing. I was just about to do my pre-ride check. Want to learn how? We'll do it together."
2. "Every ride, before I roll out: A, B, C, then a quick check. Air. Brakes. Chain. Then wheels, seat, handlebars. It takes a minute and it saves your day."

On the first ABC explanation:

- Create notebook ABC page.
- Add small accomplishment cue.
- Objective becomes: `Check Air: front tire.`

Embodied checks:

1. A - Air
   - Front tire: `[E] Check front tire`; firm tire gives a subtle squish.
   - Mrs. Ramirez: "Start with air. Squeeze the tire - should feel firm, not squishy. Front first."
   - After front passes: "Now the back."
   - Rear tire: visibly flat, pronounced deformation, soft hiss cue.
   - Mrs. Ramirez: "Oh - that's a flat. Slow leak by the look of it. Hold on, though - we finish the check first. You don't bail on a checklist just because you found one problem."
   - Notebook: "Rear tire: flat. (Slow leak, not a puncture in the road.)"
   - Tiny cue.

2. B - Brakes
   - Front brake: `[Hold E] Squeeze front brake`; hold required for about 0.8s.
   - Lever progress fill visible during hold.
   - Brake pads clamp on rim; wheel locks.
   - Mrs. Ramirez: "Brakes next. Squeeze the lever - really squeeze it. The pad should bite the rim fast. If the lever pulls all the way to the grip, you've got a problem."
   - Rear brake repeats.
   - Notebook: "Brakes: both catch firm."
   - Tiny cue per completed brake or per B section, depending on cue density.

3. C - Chain And Crank
   - `[E] Spin the pedal`.
   - Pedal, chainring, chain, rear sprocket, and rear wheel animate.
   - Mrs. Ramirez: "Now the chain. Spin the pedal and watch. Clean lines on the teeth, no jumps, no slack hanging."
   - Notebook: "Chain: runs clean."
   - Tiny cue.

4. Quick Check
   - Wheel: spins true, no wobble.
   - Seat: subtle wiggle confirms firm seat.
   - Handlebars: aligned with front wheel.
   - Mrs. Ramirez: "Wheels spin true? Seat tight? Bars lined up with the front wheel? Quick once-over."
   - Notebook lines for each.
   - Tiny cue per item.

Transition:

- Mrs. Ramirez: "So - air is the only problem. Brakes, chain, the rest are good to go. Could you take the rear tube down to the garage and patch that for me? I'd really appreciate it."
- Add inventory item: "Mrs. Ramirez's rear tube (flat, slow leak)".
- Small cue.
- Soft path hint to garage for about 3 seconds.
- Objective: "Take Mrs. Ramirez's tube to the garage and repair it."

### Act 2: Garage Repair

Setting: garage tire station.

Mr. Chen greets Zuzu with voice:

"Mrs. Ramirez sent you? Good - let's get her sorted. Slow leaks are tricky. We'll need to find where it's losing air."

TireRig updates:

1. Remove wheel/tube.
2. Inflate partially.
3. Submerge/listen for leak; visible bubbles or pssst at leak site.
4. Mark leak location in notebook tube diagram.
5. Sand/rough the spot.
6. Apply patch.
7. Wait for cement to set with a calm visible timer, about 3s.
8. Re-inflate.
9. Test again. No bubbles.
10. Mr. Chen: "Clean repair. That'll hold."

Creativity moment:

- After leak discovery, present a small tube diagram with six selectable zones.
- Player chooses the leak zone before patching can progress.
- Store selected zone in quest state.
- Notebook renders "Leak marked: [zone]" and keeps it permanently.

Repair completion:

- Notebook: "Patched Mrs. Ramirez's rear tube. Leak was [location player marked]. Cement set, tested clean."
- Replace flat tube item with "Mrs. Ramirez's rear tube (repaired)".
- Small cue.
- Objective: "Bring the repaired tube back to Mrs. Ramirez and finish the check."

### Act 3: Final Inspection

Setting: Mrs. Ramirez's bike.

Mrs. Ramirez:

1. "You're back already? Let's get it on and finish the check."
2. "This time you do it. I'll watch. A-B-C-Quick. You've got it."

Flow:

- Reinstall tube with short auto-animation.
- Player repeats A-B-C-Quick solo.
- No step-by-step voice prompting.
- ABC notebook page is available as reference.
- Each section ticks the ABC page.
- All four sections must complete.

Completion:

- Mrs. Ramirez: "Perfect. You did that yourself. That's a real pre-ride check, Zuzu. You can do this for any bike, anywhere. Thank you."
- Medium cue.
- Quest completes.
- Inventory/notebook state: "Mrs. Ramirez's bike: ready to ride."
- Capstone: "I know how to do a pre-ride check. A-B-C-Quick. Air, Brakes, Chain, Quick check."

## Voice Lines

Mrs. Ramirez:

1. "Zuzu - perfect timing. I was just about to do my pre-ride check. Want to learn how? We'll do it together."
2. "Every ride, before I roll out: A, B, C, then a quick check. Air. Brakes. Chain. Then wheels, seat, handlebars. It takes a minute and it saves your day."
3. "Start with air. Squeeze the tire - should feel firm, not squishy. Front first."
4. "Now the back."
5. "Oh - that's a flat. Slow leak by the look of it. Hold on, though - we finish the check first. You don't bail on a checklist just because you found one problem."
6. "Brakes next. Squeeze the lever - really squeeze it. The pad should bite the rim fast. If the lever pulls all the way to the grip, you've got a problem."
7. "Now the chain. Spin the pedal and watch. Clean lines on the teeth, no jumps, no slack hanging."
8. "Wheels spin true? Seat tight? Bars lined up with the front wheel? Quick once-over."
9. "So - air is the only problem. Brakes, chain, the rest are good to go. Could you take the rear tube down to the garage and patch that for me? I'd really appreciate it."
10. "You're back already? Let's get it on and finish the check."
11. "This time you do it. I'll watch. A-B-C-Quick. You've got it."
12. "Perfect. You did that yourself. That's a real pre-ride check, Zuzu. You can do this for any bike, anywhere. Thank you."

Mr. Chen:

1. "Mrs. Ramirez sent you? Good - let's get her sorted. Slow leaks are tricky. We'll need to find where it's losing air."
2. "Clean repair. That'll hold."

Runtime note: current voice system uses Web/native TTS from dialogue text and speaker profile rather than pre-rendered clip manifests. The shippable requirement is that these lines are invoked through `AudioService.speak` with the correct speaker, and fallback logs/text panels remain visible if TTS is unavailable.

## Art And Rig Needs

- Rear tire flat state: obvious deformation.
- Firm tire squish and flat tire pronounced squish.
- Brake lever progress fill for hold.
- Brake pad clamp on rim.
- Chain/pedal/rear wheel movement for chain check.
- Seat wiggle.
- Handlebar alignment visual.
- ABC notebook page.
- Six-zone tube leak diagram.
- TireRig water tub / bubble leak readout.
- Cement-set timer.

Existing assets support most bike/repair visuals. Any missing art should be built as simple but polished Godot shapes or existing sprite compositions, not placeholder polygons.

## Notebook Entries

- ABC page: A Air, B Brakes, C Chain, Quick Check.
- "Front tire: firm."
- "Rear tire: flat. (Slow leak, not a puncture in the road.)"
- "Brakes: both catch firm."
- "Chain: runs clean."
- "Wheel: spins true."
- "Seat: firm."
- "Handlebars: aligned."
- "Patched Mrs. Ramirez's rear tube. Leak was [marked zone]. Cement set, tested clean."
- "I know how to do a pre-ride check. A-B-C-Quick. Air, Brakes, Chain, Quick check."

## Inventory Items

- `mrs_ramirez_rear_tube_flat`: "Mrs. Ramirez's rear tube (flat, slow leak)".
- `mrs_ramirez_rear_tube_repaired`: "Mrs. Ramirez's rear tube (repaired)".
- `mrs_ramirez_bike_ready`: "Mrs. Ramirez's bike: ready to ride" as symbolic/notebook inventory.

## Accomplishment Cues

- ABC page created: small.
- Each inspection tick: tiny.
- Receiving tube: small.
- Tube repair completed: small.
- Final inspection ticks: tiny.
- Quest complete: medium.

## Act 1 UX Sweep Targets

Safety-check-class errors to scan and fix:

- Objective text that appears before NPC framing.
- One-tap interactions where a hold or visible state change is needed for understanding.
- Skill quests that lack a person waiting for the outcome.
- Quest completion without a closing reflection or notebook transfer.
- Region unlocks that are mechanically complete but narratively ungrounded.

Initial high-risk Act 1 quests:

- `chain_repair`: already more embodied than safety check, but confirm Mr. Chen framing and closure.
- `desert_plant_observation`: likely needs embodied observation closure.
- `test_water_quality`: check whether evidence chain is voiced and closes with Dr. Maya.
- `copper_rock_id`: check whether test meaning is explained by NPC voice.
- `workshop_first_build`: check whether build has stake and reflection.
- `act1_regional_readiness`: ensure it reads as capstone rather than checklist dump.

## Validation Plan

- Godot script checks for mission ID rename, voice profile resolution, notebook/inventory hooks, hold-E enforcement, TireRig progression, leak marking, and final quest completion.
- Playwright walk-through on `/play`: Mrs. Ramirez dialogue, Act 1 inspection, garage repair, return/final inspection.
- Capture screenshots for report: initial framing, flat discovery, brake hold, garage leak mark, repaired tube, final inspection notebook, completion.

