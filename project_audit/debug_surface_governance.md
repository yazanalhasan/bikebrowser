# Debug Surface Governance

Generated: 2026-05-17

## Result

No new player-facing debug surface was added to default `/play`.

## Current Allowed Debug Surfaces

- `/legacy-play`
- `/godot-prototype?diagnostics=1`
- `/play?diagnostics=1`
- hidden/localStorage diagnostics flag: `bikebrowser_godot_diagnostics = '1'`

## Current Default Player Route

`/play` still renders the full-screen Godot wrapper with diagnostics hidden by default.

## Legacy Debug

The Phaser BUG/report surface remains only in the legacy Phaser route. It is preserved for internal testing and report workflows, but it is not part of the canonical player experience.

## TireRig Debug Policy

TireRig emits telemetry events but does not add visible debug panels. Any future TireRig inspector should be attached only to a diagnostics route or explicit dev flag.
