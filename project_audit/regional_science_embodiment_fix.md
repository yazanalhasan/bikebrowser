# Regional Science Embodiment Fix

Date: 2026-05-26

## Desert Plant Observation

`PlantObservationStation.gd` is a player-facing matching panel. It starts with barrel cactus, agave, and mesquite, shows plant art and clue text, requires the player to use observation tools, and records notebook-ready plant evidence before quest completion.

## Salt River Water Quality

`WaterQualityStation.gd` is a staged evidence panel. The player collects a sample, dips the pH strip, matches the pH result, identifies a macroinvertebrate, and reports an evidence-based conclusion.

## Copper Evidence

`CopperEvidenceStation.gd` replaces the generic station behavior for `copper_rock_id`. The sequence is now:

1. Identify the plausible blue-green stained copper sample.
2. Use the probe and see the conductivity test light turn on only after the sample step.
3. Report the conductivity evidence to Pete.

## Validation

- `act1_regional_readiness_check.gd` passes.
- `act1_player_path_check.gd` passes with the specialized copper station.
- Regional quests now have visible cause/effect interactions rather than prompt-only completion.
