# Vehicle System Foundation

Generated: 2026-05-17

## Added

`BikeBrowserWorld/Systems/Mechanical/MechanicalSystemCore.gd`

## Purpose

The foundation is intentionally small. It supports future bicycle, e-bike, motorcycle, car, boat, plane, and spacecraft mechanics without creating a giant simulation engine.

## Provided Capabilities

- part registration
- force channel reporting
- state transition notification
- validation snapshots
- telemetry forwarding through `EventBus.emit_game_event`

## What It Does Not Own

- no global vehicle simulation
- no physics solver
- no UI/debug panel
- no quest ownership
- no player-facing route or dashboard

## TireRig Usage

TireRig uses the base to report:

- `air_pressure`
- `sidewall_deformation`
- `leak`
- `tube_exposure`
- `patch_seal`
- `readiness`

This gives future systems a shared reporting shape while letting each embodied rig keep its own tactile grammar.

## Next Foundation Step

If the next mechanic is e-bike assist or torque transfer, add one small reusable helper for normalized force-flow traces. Do not add a full vehicle engine until at least three mechanics prove the same abstraction is needed.
