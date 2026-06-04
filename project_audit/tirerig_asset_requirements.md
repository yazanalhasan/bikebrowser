# TireRig Asset Requirements

Date: 2026-05-22

## Aseprite Assets Created/Updated

Generated with:

`C:\Program Files\Aseprite\Aseprite.exe --batch --script-param output=C:\dev\bikebrowser\BikeBrowserWorld\Assets\Props\BikeRepair --script C:\dev\bikebrowser\tools\aseprite\create_tire_repair_assets.lua`

### `single_tube_patch.png`

Purpose:

- Applied patch only.
- Must never represent the kit/packet.

Readability:

- Oval rubber patch.
- Dark body, lighter edge, subtle highlight.

### `prepared_patch_zone.png`

Purpose:

- Shows cleaned/roughened/glued area before patch is applied.

Readability:

- Warm glue/scuffed surface around a central puncture.

### `air_escape_trace.png`

Purpose:

- Shows air leaving the puncture before seal.

Readability:

- Blue air trail and small bubbles.

### `notebook_tire_patch_entry.png`

Purpose:

- Notebook artifact for the repair insight.

Readability:

- Simple sketch: hole, escaping air, patch logic.

## Existing Assets Retained

### `tire_patch_kit.png`

Use:

- Supply prop only.

Forbidden use:

- Do not use it as the applied patch.

### `patch_with_glue_tube.png`

Use:

- Glue/supply prop on the mat.

Forbidden use:

- Do not use it as the seal itself.

## Future Asset Pass

Recommended:

- Custom tube loop close-up with valve and puncture mark.
- Hand/press animation silhouette for patch pressure.
- Small tire casing cutaway showing tube inside tire.
- Three-frame pump hose compression or gauge bounce.
