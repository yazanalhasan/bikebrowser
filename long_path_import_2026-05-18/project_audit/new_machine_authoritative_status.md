# New Machine Authoritative Status

Date: 2026-05-17

## Verdict

This workstation is now validated as the authoritative Windows development environment for BikeBrowser and BikeBrowserWorld, with one important constraint:

- authoritative repo root: `C:\dev\bikebrowser`

The original long-path workspace should not be treated as the canonical validation root.

## Validated machine state

- Node `v20.20.2`
- npm `10.8.2`
- Godot `4.6.2.stable.official.71f334935`
- Aseprite CLI available on user PATH
- Godot 4.6.2 export templates installed

## Verified capabilities

- npm install path works in the short-path clone
- frontend production build works
- Godot project boot works
- Godot validation scripts pass
- web export works
- export metadata matches current commit
- telemetry JSON is emitted during playtest-mode validation

## Non-blocking notes

- Godot still reports resource-leak warnings on shutdown in several validation/export flows
- those warnings did not block boot, validation, export, or telemetry in the repaired environment

## Authoritative operating guidance

Use this sequence on this machine:
1. Work from `C:\dev\bikebrowser`.
2. Prefer Node 20 on PATH.
3. Keep Godot export templates installed for 4.6.2.
4. Use the checked-in `tools/export-godot-web.ps1` wrapper for repeatable web exports.
