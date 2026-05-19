# Chain Repair Visual Rescue

Lane: Mechanic-Art-Agent
Scope: Phase 3/4 chain repair visuals and narrow validation hooks only. /play remains the canonical Godot surface. No Act 2 content or new regions were added.

## Problem

The chain interaction already had a functional state machine, but the embedded visual rig was a centered Polygon2D placeholder. In play, that made the repair read like a generic front-side bike mechanism instead of a rear drivetrain repair on the actual garage bike.

## Changes

- Rebuilt res://Prototypes/EmbodiedMechanics/ChainRigEmbedded.tscn around existing sprite assets:
  - Assets/Props/Repair/bike_wheel.png
  - Assets/Props/Garage/cassette_gear_cluster.png
  - Assets/Props/Garage/rear_derailleur_closeup.png
  - Assets/Props/Repair/loose_bike_chain.png
  - Assets/Props/Bike/repair_chain_focus_glow.png
- Anchored the embedded rig to the rear drivetrain area with the rear wheel and cassette sharing the same local alignment point.
- Kept the pedal/crank visible as the cause, but made the visual readout sequence explicit:
  - pedal/crank rotates
  - chain run scrolls
  - rear cassette turns
  - rear wheel responds after drivetrain engagement
  - verified label appears only after clean spin
- Added ChainRig.get_alignment_snapshot() for narrow validation of rear drivetrain alignment and chain direction.
- Extended tests/chain_rig_state_check.gd to instantiate the embedded scene and assert:
  - rear sprocket is aligned to rear wheel
  - chain runs from crank toward rear drivetrain
  - wheel and cassette are sprite-art nodes
  - pedal-driven state still produces wheel spin

## Screenshot Paths

No new screenshots captured in this lane. The available capture harness is route-level and does not currently drive deterministic chain repair substates, so no before/after path is claimed here.

## Validation

- PASS: godot --headless --path BikeBrowserWorld --script res://tests/chain_rig_state_check.gd
- PASS: godot --headless --path BikeBrowserWorld --script res://tests/chain_hotspot_embodied_check.gd
- PASS: godot --headless --path BikeBrowserWorld --quit

Note: chain_rig_state_check.gd exits 0 but still prints existing Godot shutdown resource-leak warnings.
