# Tire Repair Visual Rescue

Lane: Mechanic-Art-Agent
Scope: Phase 3/4 tire repair visuals and narrow validation hooks only. /play remains the canonical Godot surface. No Act 2 content or new regions were added.

## Problem

The tire repair state machine worked, but the canonical visual flow still included a ColorRect-style pressure bar and low-fidelity placeholder geometry. The repair needed to read as an in-world wheel, tube, patch, pump, gauge, and readiness sequence, especially on mobile.

## Changes

- Rebuilt res://Prototypes/EmbodiedMechanics/TireRig.tscn around existing repair assets:
  - Assets/Props/Repair/bike_wheel.png
  - Assets/Props/Repair/inner_tube.png
  - Assets/Props/Repair/floor_air_pump.png
  - Assets/Props/Repair/tire_patch_kit.png
  - Assets/Props/Garage/air_pressure_gauge.png
  - Assets/Props/BikeRepair/tire_lever_set.png
  - Assets/Props/BikeRepair/patch_with_glue_tube.png
- Removed the ColorRect pressure UI from the canonical TireRig scene.
- Replaced pressure readout with an in-world pump assembly:
  - pump handle moves while pumping
  - gauge appears after patching/inflation begins
  - gauge needle rotates with pressure buildup
- Preserved and clarified the full mechanical flow:
  - inspect/spin wheel
  - find leak marker and bubbles
  - expose/remove tube
  - apply patch
  - pump tire and build pressure
  - show wheel-ready glow and readiness label
- Updated TireRig.gd to drive pressure_gauge, gauge_needle, pump_handle, tube_prop, and wheel_ready_glow.
- Extended tests/tire_rig_state_check.gd to assert the sprite-art wheel, in-world gauge, pump handle, and absence of PressureBar.

## Screenshot Paths

No new screenshots captured in this lane. The current automated screenshot flow captures routes, not deterministic tire repair substates, so no before/after path is claimed here.

## Validation

- PASS: godot --headless --path BikeBrowserWorld --script res://tests/tire_rig_state_check.gd
- PASS: godot --headless --path BikeBrowserWorld --script res://tests/playtest_rig_telemetry_check.gd
- PASS: godot --headless --path BikeBrowserWorld --quit
