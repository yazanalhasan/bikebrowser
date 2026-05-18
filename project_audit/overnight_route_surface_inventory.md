# Overnight Route Surface Inventory — 2026-05-18

## Capture Method

- Tool: `tools/visual-runtime-capture.mjs`
- Routes: 13
- Viewports: desktop `1280x800`, wide `1920x1080`, tablet `820x1180`, mobile `390x844`
- Parallelism: 10 Playwright contexts
- Screenshots: `project_audit/visual_runtime_screens/`
- Raw report: `project_audit/visual_runtime_capture.json`
- CUDA analysis: `project_audit/visual_runtime_analysis.json`

## App Routes Covered

| Route | Status | Notes |
| --- | --- | --- |
| `/` | OK | Home is dense enough, navigable, and links to the game clearly. |
| `/play` | OK | Canonical Godot BikeBrowserWorld loads with diagnostics hidden. Mobile still has large vertical framing margin. |
| `/legacy-play` | OK | Phaser start surface remains available and contained. |
| `/godot-prototype?diagnostics=1` | OK | Diagnostics opt-in works; should stay out of normal `/play`. |
| `/play3d` | Improved | Debug-control copy was public by default; hidden unless `?controls=1`. Still reads as prototype route, not external-playtest content. |
| `/project-builder` | OK with caveat | Attempts backend search when API unavailable; UI recovers as an empty learning path. |
| `/build-planner` | OK | Form-heavy and sparse on wide screens but not a game blocker. |
| `/saved-notes` | OK with caveat | Empty-state route is very sparse, but coherent. |
| `/shop` | OK | Dense but usable; cart state visible. |
| `/safe-search` | OK with caveat | Empty-state route is sparse, but stable. |
| `/spelling-trainer` | OK with caveat | Main trainer is usable; optional Wi-Fi upload probe hits `127.0.0.1:3000/api/info` when that helper is absent. |
| `/youtube/search` | Improved | No-query state previously spun indefinitely; now shows a calm search invitation. |
| `/youtube/watch/:videoId` | OK with caveat | Embedding failure path shows fallback guidance; external YouTube telemetry requests abort under headless capture. |

## Godot Surfaces Covered

- `NeighborhoodStreet`
- `ZuzuGarage`
- `CopperMine`
- `DesertTrail`
- `SaltRiver`
- `SystemShowcase`
- Boot/runtime registry
- BrakeRig
- ChainRig
- TireRig
- ChainHotspot
- Vertical slice quest flow
- Interaction overlap topology

## Godot Region Triage

| Region | Classification | Reason |
| --- | --- | --- |
| NeighborhoodStreet | ready / core | First real play space and strongest external-playtest surface. |
| ZuzuGarage | ready / core | Home base for repair identity. |
| CopperMine | promising / gated | Should remain gated after chain readiness; material arc can wait. |
| DesertTrail | promising / gated | Supports ecology, but should not pull attention before repairs land. |
| SaltRiver | promising / gated | Biology/water route; not first-15-minute critical. |
| SystemShowcase | hide/defer | Tooling/demo energy, not child-facing playtest content. |

## Route Coherence Findings

- `/play` is the canonical path and remains Godot-backed.
- `/legacy-play` remains useful as validation/tooling fallback and should stay named as legacy.
- `/play3d` should be treated as experimental. It is visually interesting but carries prototype energy.
- Normal app utility routes are stable but many empty states are visually sparse; not immediate game blockers.

