# Act 1 External Child Playtest Packet

Date: 2026-05-18
Build route: `/play`
Scope: small supervised external playtest for Act 1.

## What To Play

Ask the child to start at `/play` and play naturally from the neighborhood opening through the Act 1 review if they can. Do not route them through `/legacy-play`, `/play3d`, or diagnostics.

## What Not To Explain

- Do not explain the correct quest order up front.
- Do not explain how brakes, tires, chains, bridges, water tests, or copper tests work before the child tries.
- Do not point out hidden backend/side content.
- Do not tell them the spacecraft clue is coming.

## Observer Prompts

Only intervene if the child is stuck for more than two minutes or seems frustrated. Prefer neutral prompts:

- "What do you think the game wants you to check next?"
- "Who looks like they might know about this?"
- "What changed after you tried that?"
- "Can you describe what moved?"

## Comprehension Checklist

Mark yes/no/unclear:

- Brake: child notices brake pads or wheel resistance changing.
- Tire: child understands inspect, tube, patch, inflate, verify as one repair flow.
- Chain: child understands pedals move force through chain/sprockets to wheel.
- Bridge: child can say triangles/load/materials make the crossing safer.
- Desert/water/copper: child understands these are evidence-gathering stations, not random pickups.
- Workshop: child understands a raw material becomes a useful first part.
- Capstone: child connects bike systems, bridge/materials, field evidence, and future travel.
- Spacecraft curiosity: child expresses a question about how local systems could scale up.

## Friction Checklist

Record:

- First place the child gets stuck.
- Whether they find Mrs. Ramirez before wandering away.
- Whether the safety bike vs. Mrs. Ramirez target is clear.
- Whether Bridge Review and Act 1 Review read as later goals.
- Whether mobile portrait is readable if tested.
- Any prompt text they read out loud or ignore.
- Any interaction they repeat more than three times.

## Telemetry Notes

Use a normal play session. If a playtest telemetry mode is enabled separately, record:

- retries
- prompt repeats
- interaction failures
- mechanic release counts
- abandon/reload points
- time-to-understanding moments

Do not collect personal child information in the game notes. Use anonymous session labels only.

## Reset Instructions

For a fresh run, clear browser site data/local storage for the BikeBrowser dev URL, then reload `/play`.

## Known Caveats

- Godot headless validation still prints cleanup warnings after successful exits; this is not visible to the child.
- Vite build still reports large chunk/module-type warnings; these are development warnings.
- Mobile portrait framing is improved, but touch-only controls still need observation in a real child session.

