# Overnight Mobile Readability — 2026-05-18

## Summary

Mobile app routes are mostly navigable. The main unresolved playtest risk is canonical `/play` in portrait: the Godot world is readable, but the playable action band is still too compressed vertically for a first-session child playtest.

## Mobile Findings

| Surface | Finding | Status |
| --- | --- | --- |
| `/play` | Large bottom inactive margin; active band about two thirds of viewport | Needs focused Godot pass |
| `/legacy-play` | Fullscreen start surface scales cleanly | OK |
| `/play3d` | Debug-control text previously occupied top of scene | Fixed |
| `/youtube/search` | No-query state previously appeared as endless loading | Fixed |
| `/spelling-trainer` | Mobile layout is readable and touch targets are large enough | OK |
| Utility routes | Header/cart/back are usable; empty states are sparse | Defer |

## What Improved Tonight

- `/youtube/search` now gives a direct child-readable prompt when opened without a query.
- `/play3d` no longer exposes keyboard/debug instructions by default.
- The visual capture harness now includes all major routes and mobile/tablet viewports, so future mobile regressions are easier to catch.

## What Still Needs Work

The Godot `/play` mobile issue is not a React wrapper bug. The iframe fills the viewport; the world composition and/or camera framing still place most meaningful action in a landscape strip. A stronger fix should happen in Godot:

- mobile-specific camera zoom/limits by region,
- prompt safe-area and touch-control review,
- mechanic rig scale in portrait,
- screenshot-gated export validation.

## Playtest Readiness Judgment

Desktop and wide `/play` are suitable for an internal external-playtest rehearsal. Mobile `/play` is usable but should not be the primary first child playtest device until the framing pass lands.

