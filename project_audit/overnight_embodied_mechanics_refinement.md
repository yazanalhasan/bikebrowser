# Overnight Embodied Mechanics Refinement — 2026-05-18

## Scope

Reviewed and validated the three core embodied repair systems:

- BrakeRig
- ChainRig / ChainHotspot
- TireRig / TireRepairStation

## Validation

- `brake_rig_state_check.gd` — PASS
- `chain_rig_state_check.gd` — PASS
- `chain_hotspot_embodied_check.gd` — PASS
- `tire_rig_state_check.gd` — PASS
- `vertical_slice_check.gd` — PASS
- `interaction_overlap_check.gd` — PASS

## BrakeRig

What works:

- State machine verifies brake squeeze without tap-spam.
- Visible rig communicates cable pull, pad contact, friction, and wheel slowdown.
- SafetyCheckStation uses hold interaction for the first brake check.

Risk:

- In the neighborhood, the embedded rig is visually small. The state machine is sound, but mobile readability will depend on camera/zoom framing.

Decision:

- No logic change tonight. Keep stable and address framing in the mobile/mechanic-eye pass.

## ChainRig / ChainHotspot

What works:

- The chain quest now records objectives on physical state transitions rather than arbitrary presses.
- Camera zoom invites mechanic-eye focus during chain work.
- Quest objective IDs remain compatible with existing mission data and validation.

Risk:

- Camera zoom interactions need to remain compatible with any responsive camera zoom added at the player level.

Decision:

- No additional change tonight. Existing validation passed.

## TireRig / TireRepairStation

What works:

- Tire state objectives map to leak, tube, patch, pressure, and verification states.
- Signals emit telemetry-like events for objective, feedback, and verification.
- State validation passed.

Risk:

- TireRig tactile clarity should be visually checked in the exported browser build, not only headless.

Decision:

- No logic change tonight. Prioritize visual playtest of the rig in the next pass.

## Next Refinement Target

The next mechanics pass should not add new mechanics. It should improve framing:

- portrait mechanic-eye zoom,
- prompt position and size,
- rig scale relative to player,
- quiet verification cues,
- no extra reward noise.

