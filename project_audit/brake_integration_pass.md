# Brake Integration Pass

## Goal

Sprint 4 integrates the embodied brake mechanic into Mrs. Ramirez's real neighborhood safety check. The brake check no longer completes from a simple button press. It completes only after the player physically holds the brake input and the embedded rig verifies wheel resistance.

## Files Changed

```text
BikeBrowserWorld/Systems/Interactions/SafetyCheckStation.gd
BikeBrowserWorld/Regions/Neighborhood/NeighborhoodStreet.tscn
BikeBrowserWorld/tests/safety_check_brake_integration_check.gd
project_audit/brake_integration_pass.md
project_audit/embodied_learning_integration_report.md
```

Related prototype files remain in place and are reused:

```text
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeRig.gd
BikeBrowserWorld/Prototypes/EmbodiedMechanics/BrakeTestPrototype.tscn
```

## Integration Changes

The real `SafetyCheckStation` now owns a small embedded `BrakeRig` under:

```text
SafetyCheckStation/BikeVisual/BrakeRig
```

The station behavior changed:

- entering the brake step shows `[Hold E] Squeeze Brakes`.
- pressing/holding `ui_accept` starts the brake check and pulls the rig.
- releasing `ui_accept` relaxes the rig.
- `check_brakes` is recorded only when `brake_verified_changed(true)` fires.
- after verification, the station advances to the tire step.

## Fake Interaction Loop Removed

Before:

```text
press E -> record check_brakes -> show success text
```

After:

```text
hold E -> lever moves -> cable loads -> caliper closes -> pads grip -> wheel resists/stops -> record check_brakes
```

The button press alone now starts the check but does not complete it.

## Tactile Verification Improvements

The embedded rig preserves the prototype's core readability cues:

- lever movement.
- cable slack-to-tension.
- cable load mark.
- caliper closure.
- pad compression.
- contact pinch.
- friction band.
- wheel spin ghost and progressive stop.

The quest objective waits for the physical proof.

## Payoff Restraint

Primary payoff:

- The brake visibly stops the wheel.

Secondary cue:

- One quiet feedback line: `Looks good.`

No audio stinger, reward spectacle, glint stack, or large educational overlay was added for brake verification.

## Validation

Focused integration command:

```text
godot --headless --path BikeBrowserWorld --script res://tests/safety_check_brake_integration_check.gd
```

Observed result:

```text
Safety check brake integration passed
```

Prototype regression command:

```text
godot --headless --path BikeBrowserWorld --script res://tests/brake_rig_state_check.gd
```

Observed result:

```text
Brake rig state check passed
```

Godot continues to emit the project's known headless shutdown cleanup warning after script tests quit. Both commands exit with code 0 and the assertions pass.

## Remaining Prototype Energy

- The embedded rig is still drawn with lightweight procedural shapes.
- The rig is visually readable but may need hand-tuned placement against the production bike sprite.
- The tire and chain steps remain older prompt-driven interactions.
- The final quest reward can still happen later through normal quest completion; the brake step itself is restrained.

## Recommendation

Run the real neighborhood scene and approach Mrs. Ramirez's bike. If the embedded brake rig reads at gameplay distance, keep this as the reference pattern for future safety-check interactions. If it feels too overlay-like, the next pass should tune placement and opacity, not add systems.

