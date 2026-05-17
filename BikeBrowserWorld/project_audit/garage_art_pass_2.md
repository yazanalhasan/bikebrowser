# Garage Art Pass 2 - Emotional Staging + Repair Theater

Generated: 2026-05-15

## Scope

This pass refined `res://Regions/Garage/ZuzuGarage.tscn` and `res://Data/layouts/garage.json` only.

No quest registry, dialogue manager, save service, reward bridge, autoload architecture, or gameplay systems were changed.

## Repair Theater Improvements

The repair bike is now staged as the clear emotional center of the garage:

- Increased the repair BMX scale from `0.32` to `0.36`.
- Enlarged and repositioned the repair-bike grounding shadow so the stand feels physically planted.
- Shifted the repair light slightly toward the drivetrain.
- Reduced the workbench light a bit so the workbench supports the repair area instead of competing with it.
- Added `DrivetrainFocusGlow` using `repair_chain_focus_glow.png` as a soft mechanical focus cue.

The goal is to guide the eye through composition and warmth rather than through a large UI-style highlight.

## Drivetrain Focus

The drivetrain now has three supporting cues:

- A small warm glint near the chain path.
- A subtle drivetrain focus glow.
- A floor grease/scuff detail near the stand.

These cues make the chain/crank/sprocket area feel physically important without turning the garage into a tutorial overlay.

## Repair State Performance

All three repair-state sprites remain staged in the same position and scale:

- Broken: `RepairBike`
- Aligning: `RepairBikeAligning`
- Repaired: `RepairBikeSeated`

Only the broken/slipped-chain bike is visible by default, preserving current behavior. `RepairSuccessGlint` was added as a hidden staged node for a future calm success moment.

## Lighting Hierarchy

Lighting now favors the repair zone:

- `RepairStandLight` energy increased from `0.4` to `0.56`.
- `RepairStandLight` texture scale increased from `1.5` to `1.85`.
- `WorkbenchLight` energy reduced from `0.6` to `0.48`.
- `DrivetrainFocusGlow` participates in the subtle ambient flicker system.

The room remains readable and warm; this pass avoids the earlier darkening problem.

## Workshop Flow

The workbench-to-bike flow is now clearer:

- Tools and chain-specific props remain clustered near the workbench.
- The repair bike is larger and warmer, reading as the destination of that tool flow.
- Floor scuffing and oil wear near the bike imply repeated repair activity.
- Open floor space remains preserved around the player path.

## BMX Identity

Existing BMX identity was preserved and subtly reinforced:

- The repair stand BMX remains the hero object.
- Grip/chain/wear detail nodes remain staged near the repair bike.
- The garage keeps the kid-workshop tone instead of becoming an industrial mechanic shop.

## Validation

- `garage.json` parses successfully.
- `res://Regions/Garage/ZuzuGarage.tscn` loads headlessly.
- `project_audit/runtime_repair_smoke.gd` passes.
- RuntimeValidator reports 0 errors and 1 warning: native TTS unavailable on this platform.

## Screenshots

No fresh screenshot was captured in this pass. The scene was validated headlessly; a final visual screenshot should be captured from the Godot editor or the next Web export after the user reviews the garage composition in-window.

## Remaining Weak Areas

- Repair-state switching is still not wired to quest progress.
- `RepairSuccessGlint` is staged but not activated yet.
- The success moment still needs a wheel spin or calm seated-chain animation.
- Some hidden/legacy primitive fallback nodes remain in the scene for rollback.
- The tire repair station needs its own theater pass.

