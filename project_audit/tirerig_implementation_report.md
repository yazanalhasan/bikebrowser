# TireRig Implementation Report

Generated: 2026-05-17

## Files

- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.gd`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`
- `BikeBrowserWorld/Systems/Interactions/TireRepairStation.gd`
- `BikeBrowserWorld/Regions/Garage/TireRepairStation.tscn`
- `BikeBrowserWorld/Data/missions/flat_tire_repair.json`
- `BikeBrowserWorld/tests/tire_rig_state_check.gd`

## State Machine

`tire_deflated_leaking -> leak_found -> tube_exposed -> patch_sealed -> inflating_with_deformation -> pressure_safe -> wheel_ready -> tire_verified`

The station records quest objectives at meaningful state transitions instead of advancing on each key press.

## Embodied Concepts

- Pressure: visible fill and sidewall firmness.
- Inflation: pressure rises only after patching.
- Puncture/leak: leak marker appears after inspection and closes as the patch seals.
- Patching: patch seal grows through a held interaction.
- Deformation: sidewall squash decreases as pressure rises.
- Readiness: a final spin check verifies that pressure holds.

## Interaction Model

The player holds `E` for the current tactile action. The rig advances through continuous state changes based on held time and physical state thresholds. It is not a press-to-advance ladder.

## Telemetry

TireRig emits:

- `mechanical_rig_event`
- `tire_rig_feedback`
- `tire_rig_objective`
- `tire_rig_verified`

`PlaytestRigTelemetry.gd` now tracks `tire_verified_changed` alongside brake and chain verification signals.

## Validation

`tire_rig_state_check.gd` passed and verifies:

- initial low pressure and high deformation
- leak discovery
- tube exposure
- patch seal
- leak closure
- pressure-safe threshold
- reduced deformation
- final readiness verification
- visual part presence in the TireRig scene
