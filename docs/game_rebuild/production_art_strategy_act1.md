# Act 1 Production Art Strategy

Date: 2026-05-27

## Direction

BikeBrowser+ Act 1 should read as a warm top-down Sonoran neighborhood adventure.

Art should be:

- child-readable
- sparse and intentional
- emotionally warm
- silhouette-first
- readable at gameplay scale
- compatible with data-driven systems and AssetRegistry fallback
- authored for runtime in Aseprite

Art should not be:

- generic fantasy
- clip-art suburban
- photorealistic
- AI-art sludge
- visually noisy
- texture-heavy
- dashboard-like
- dependent on scene-specific hacks

## Visual Language

Perspective:

- top-down / slight adventure-map read
- simplified depth through overlap, shadows, and landmark grouping

Palette:

- warm dusk neighborhood base
- muted Sonoran greens, terracotta, clay, sun-washed yellows
- cool road colors subdued so traversal space does not dominate
- interaction-critical elements get warm/cyan accents sparingly

Detail density:

- low to medium
- every object must support mood, navigation, gameplay, or learning
- no prop spam

## Asset Tiers

1. Placeholder
   - Generated Phaser geometry or simple temporary sprites.
   - Allowed in runtime.
   - Must be readable and clean.

2. Concept reference
   - Generated or sketched exploratory art.
   - Stored under generated/reference folders only.
   - Never runtime-final.

3. Curated reference
   - Human-selected concept material.
   - May guide palette, silhouette, staging, or mood.
   - Still not runtime-final.

4. Aseprite-authored production sprite
   - Human-cleaned/authored `.aseprite` source.
   - Meets silhouette, scale, and style rules.
   - Exported to PNG/spritesheet.

5. Runtime-final asset
   - Exported from Aseprite.
   - Registered through AssetRegistry.
   - Has fallback.
   - Passes visual QA.

## Generated Art Rule

Generated concepts may inform:

- composition
- palette
- silhouette options
- mood boards
- staging

Generated concepts may not:

- be copied directly into runtime-final paths
- replace Aseprite source
- bypass AssetRegistry
- be committed as final production art
- dictate cultural detail without review

## AssetRegistry Rule

All runtime art must load through AssetRegistry or an equivalent manifest-backed loader.

Requirements:

- final assets load if present
- placeholders remain as fallback
- final/fallback status is inspectable
- missing final assets are diagnostic warnings, not hidden failures
- no scene logic changes when an asset graduates from placeholder to final

## Acceptance Standard

An Act 1 production sprite is acceptable only if:

- readable at normal gameplay scale
- strong silhouette
- transparent background where appropriate
- exported from Aseprite source
- role clear without label where feasible
- does not increase clutter
- integrates with HUD/camera scale
- passes screenshot review on start, bridge, notebook, UTM, and map unlock states

## First Production Priority

1. Zuzu
2. NPC silhouettes
3. Garage/workbench
4. Bridge broken/repaired
5. Notebook field-journal UI
6. UTM tactile feedback
7. Ecology/chemistry support props
8. Normal-play HUD frame/elements
