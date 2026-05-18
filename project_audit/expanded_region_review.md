# Expanded Region Review

Generated: 2026-05-17

## Region Scope

Only the garage/workshop was expanded, through the existing TireRepairStation. No new large regions were created.

## Why Garage

TireRig directly supports the current authored repair arc:

- neighborhood safety context
- garage transition
- ChainRig repair
- now TireRig pressure/patch readiness

This keeps expansion focused instead of opening a large unfinished world.

## Scene Impact

`Regions/Garage/TireRepairStation.tscn` now instances `Prototypes/EmbodiedMechanics/TireRig.tscn`. The station remains a localized interaction surface inside the existing garage.

## Coherence

The garage is still the right container for TireRig. It reinforces the workshop identity and gives the player a second repair system without changing the broader route architecture.

## Remaining Risk

Garage density should be checked in a live playtest. The implementation is scoped, but adding more repair systems can make the workshop feel crowded if staging and camera framing are not tuned.
