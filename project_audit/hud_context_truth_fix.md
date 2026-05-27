# HUD Context Truth Fix

Date: 2026-05-26

## Finding

Normal `/play` keeps global Act 1 guidance active so a child can recover the main thread after wandering. Playtest review routes already support focused region loading through query parameters such as `playtest=1&playtestRegion=...`, and existing HUD checks assert region-specific guidance.

## Decision

No normal-play HUD behavior was changed. The truth pass relies on playtest region routes and screenshots for local context, while preserving the child-facing global guidance in canonical `/play`.

## Validation

- Existing `act1_hud_guidance_check.gd` covers region-local HUD guidance.
- New and existing screenshot captures use playtest routes where station context is explicit.
