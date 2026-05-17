# First 15 Minutes Flow

Generated: 2026-05-15

## Player-Facing Sequence

### 1. Spawn In Neighborhood

The player starts in `NeighborhoodStreet.tscn` as Zuzu. The HUD reads:

> Take a look around. Mrs. Ramirez and Mr. Chen are nearby.

The world is framed as Zuzu's home neighborhood at dusk.

### 2. Ambient Exploration

The player can walk around the street, see warm porch light, desert plants, street props, and nearby NPCs. Subtle cactus sway and light pulsing give the street a little life without distracting from the first objective.

### 3. Meet Mrs. Ramirez

Mrs. Ramirez is staged near the small safety-check bike. Pressing Enter near her starts a short friendly safety dialogue and activates `bike_safety_check`.

Educational purpose:

- Establish safety as a caring habit, not a rule lecture.

### 4. Complete Safety Micro-Interaction

The nearby bike station prompts the player through four steps:

1. Squeeze brakes.
2. Press tire.
3. Turn pedal.
4. Tell Mrs. Ramirez.

Expected timing: 20-40 seconds.

Feedback:

- Short text feedback.
- Soft click audio.
- Small bike visual changes.
- HUD quest guidance.

### 5. Receive First Reward

Completing the safety check gives:

- Small allowance boost.
- Safety Star badge.
- Warm positive reinforcement.

The HUD then points the player toward Mr. Chen.

### 6. Meet Mr. Chen

Mr. Chen is staged near the garage side of the street. His dialogue presents the slipped chain as a small mystery and invites Zuzu to learn by looking closely.

Educational purpose:

- Curiosity before instruction.
- Mechanic mentor tone without talking down to the player.

### 7. Accept Chain Repair Quest

Mr. Chen's dialogue starts `chain_repair`. The HUD directs the player toward the garage chain station.

### 8. Transition To Garage

The player enters the garage transition. Existing region loading handles the scene change, and `AudioService` now fades between region music.

### 9. Repair Chain

At the garage repair hotspot, the player completes:

1. Inspect chain.
2. Rotate pedals.
3. Align chain.
4. Seat chain.
5. Test rotation.

Expected timing: 1-2 minutes.

The interaction is intentionally forgiving. There are no harsh fail states.

### 10. Reward Moment

Completing `chain_repair` triggers the existing reward flow:

- Reward popup.
- Chain Detective badge.
- Positive audio cue.
- HUD messaging that the desert trail feels more open.

### 11. Return To Neighborhood

Returning to the neighborhood should now feel different:

- Zuzu has completed two helpful neighborhood actions.
- Mrs. Ramirez and Mr. Chen have framed the world as caring and repairable.
- The HUD implies the next region is ready to explore.

## Manual Playtest Checklist

Use Godot 4 and run:

`C:/Users/yazan/bikebrowser/BikeBrowserWorld/`

Main scene:

`res://Regions/Neighborhood/NeighborhoodStreet.tscn`

Test these in order:

1. Confirm Zuzu appears and movement feels smooth.
2. Confirm neighborhood music starts.
3. Walk to Mrs. Ramirez and press Enter.
4. Confirm the safety dialogue appears.
5. Interact with the safety station until it says Safety Checked.
6. Confirm reward popup and HUD message.
7. Walk to Mr. Chen and press Enter.
8. Confirm chain repair quest starts.
9. Enter the garage.
10. Confirm garage music fades in.
11. Interact with the chain hotspot through all repair steps.
12. Confirm chain repair reward popup.
13. Return to the neighborhood.
14. Confirm the game remains error-free in the Output panel.

## What To Watch For

- If the player does not know where to go after Mrs. Ramirez, increase the visual contrast of Mr. Chen or the garage prompt.
- If the safety station is hard to notice, make its glow larger or move it closer to Mrs. Ramirez.
- If the chain repair feels too abstract, add clearer sprocket/chain art before adding more mechanics.
- If music starts late in the editor, check whether imported MP3 files are still reimporting.
- If TTS is expected, remember native TTS is currently reported unavailable by runtime validation in this environment.

