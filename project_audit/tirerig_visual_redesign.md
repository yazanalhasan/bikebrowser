# TireRig Visual Redesign

Date: 2026-05-22

## Target Feel

The TireRig should feel like Mr. Chen has laid the wheel on a calm repair mat and is teaching Zuzu to see cause and effect. The player should understand the system without reading a paragraph.

## Current Redesign Implemented

### Central Mechanism

- Wheel remains centered on the mat.
- The tube is partially exposed near the wheel.
- The leak marker, prepared surface, and applied patch all share the same visual location.
- The wheel no longer spins during diagnosis, tube exposure, or patch application; it spins only at final verification.

### Cause Readability

Added:

- `PunctureCause`: small dark hole/debris mark at the leak.
- `AirEscapeTrace`: Aseprite sprite showing air leaving the hole.
- Leak marker/bubbles remain localized around the same hole.

### Patch Readability

Updated:

- `single_tube_patch.png` is now a larger, clearer oval rubber patch with rim/highlight.
- Patch kit stays as a supply prop.
- Applied patch is a separate Sprite2D directly over the hole.

### Surface Preparation

Added:

- `prepared_patch_zone.png`, an Aseprite scuffed/glue zone that appears after the tube is exposed and before the patch seals.

### Notebook Artifact

Added:

- `notebook_tire_patch_entry.png`, a small field-note sketch artifact that appears once the patch has sealed.

## Visual Grouping

The mat now reads in three clusters:

- Work object: wheel, tube, leak, prep zone, patch
- Tools: levers, glue/supply kit, pump/hose/gauge
- Learning artifact: notebook patch entry

## Remaining Visual Opportunity

The tube art itself could still be upgraded into a custom close-up loop/tube sprite with a clearer valve and puncture zone. Current staging is much better, but the tube silhouette is still inherited from older repair props.
