# Overnight Visual + UX Sweep — 2026-05-18

## Summary

The high-parallel sweep captured 52 screenshots and ran CUDA/PyTorch image analysis on the RTX 5090. The game surfaces are visually alive and nonblank. The biggest remaining visual issue is mobile portrait framing in `/play`: the playable neighborhood band still occupies only about two thirds of the viewport, leaving a large inactive bottom margin.

## Visual Findings

| Finding | Severity | Classification | Decision |
| --- | --- | --- | --- |
| `/play` mobile/tablet has large vertical inactive margins | Medium | mobile layout / mechanic readability | Defer deeper Godot mobile camera/layout pass; existing camera zoom helped but did not fully solve landscape-authored composition. |
| `/play3d` exposed debug-control instructions | Medium | debug leakage / route coherence | Fixed; debug copy now requires `?controls=1`. |
| `/youtube/search` with no query showed loading state | Medium | onboarding / route coherence | Fixed; route now invites search with calm example prompts. |
| Sparse empty states on saved notes, safe search, build planner, YouTube search | Low/Medium | UI clutter / empty-state clarity | Mostly defer; these are app utility surfaces, not first-15-minute game blockers. |
| Optional spelling trainer upload server probe fails when helper is absent | Low | telemetry / optional helper | Defer; user-facing trainer remains usable and status explains upload server requirement. |
| YouTube embed/stat requests abort under headless capture | Low | external service / browser capture | Defer; fallback text is visible and this is expected in headless blocked-video conditions. |

## CUDA Metrics Snapshot

- Device: `cuda:0`
- GPU: `NVIDIA GeForce RTX 5090`
- Images analyzed: 52
- Findings emitted by the heuristic analyzer: 20
- `/play` active-pixel ratio:
  - desktop: about `0.81`
  - wide: about `0.89`
  - tablet: about `0.48`
  - mobile: about `0.35`

## Interpretation

The analyzer flags many utility pages as sparse because their current empty states are plain. That is real visual information, but not as important as game readability. The strongest playtest-facing risk is still portrait `/play`, because children on phones see a cozy but vertically inefficient slice of the world.

## Recommended Next Visual Pass

Focus only on the Godot first-15-minute loop:

- responsive camera framing for NeighborhoodStreet and Garage,
- prompt safe-area positioning,
- touch target review,
- mechanic-eye zoom for TireRig/BrakeRig/ChainRig in portrait,
- test screenshots for `/play` mobile and tablet after export.

