# Controlled Expansion Plan

Generated: 2026-05-17

## Add Now

- Add `TireRig` as the first new major embodied mechanic.
- Replace the existing `TireRepairStation` press-to-advance loop with a hold-and-change interaction model.
- Add a small reusable mechanical-system base for parts, force/state telemetry, and validation hooks.
- Extend the existing garage tire station only; do not create a new region.
- Add a TireRig validation script and include it in the final validation set.

## Defer

- Large new regions.
- Full vehicle simulation.
- E-bike, motorcycle, car, boat, plane, or spacecraft systems beyond foundation hooks.
- Abstract quizzes about pressure/friction unless tied to physical interaction.
- Player-facing debug panels in the canonical `/play` route.

## Coherence Risks

- Tire repair could become a checklist instead of an embodied mechanism.
- More garage props could make the first 15 minutes feel noisy.
- A reusable vehicle foundation could become an oversized simulation engine.
- Debug/telemetry surfaces could leak into `/play`.
- TireRig could compete with BrakeRig/ChainRig instead of extending their grammar.

## Files Likely To Change

- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.gd`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`
- `BikeBrowserWorld/Systems/Mechanical/MechanicalSystemCore.gd`
- `BikeBrowserWorld/Systems/Interactions/TireRepairStation.gd`
- `BikeBrowserWorld/Regions/Garage/TireRepairStation.tscn`
- `BikeBrowserWorld/Systems/Playtest/PlaytestRigTelemetry.gd`
- `BikeBrowserWorld/tests/tire_rig_state_check.gd`
- `BikeBrowserWorld/Data/missions/flat_tire_repair.json`
- sprint report files under `project_audit/`

## Validation Plan

- Headless RuntimeValidator.
- Existing repair smoke and vertical slice checks.
- BrakeRig, ChainRig, ChainHotspot, interaction-overlap checks.
- New TireRig state validation.
- `npm run build`.
- Godot web export.
- Playwright route smokes for `/play`, `/godot-prototype?diagnostics=1`, and `/legacy-play`.
- Electron syntax check.

## Architecture Stance

Use a lightweight mechanical-system base only for shared lifecycle and telemetry. TireRig still owns its specific pressure, leak, patch, deformation, and readiness behavior. This avoids a giant simulation engine while giving future bicycle/e-bike/vehicle systems a common reporting and validation seam.
