# BikeBrowserWorld Art Pipeline

## Goal

BikeBrowserWorld uses Aseprite as the source editor for characters, tiles, props, animation, and asset cleanup. Godot should consume exported PNG sprite sheets, tile sheets, and JSON metadata, not hand-built placeholder SVG geometry.

## Source and Export Layout

```text
Assets/
  Characters/
    Zuzu/
    NPCs/
  Environment/
    GarageKit/
    NeighborhoodKit/
    Props/
    Lighting/
  UI/
  FX/
  Audio/
  Concepts/
  References/
  Exports/
    Spritesheets/
    Tilesets/
```

Source files:

- `.aseprite` files live beside the thing they describe.
- Character animation source lives under `Assets/Characters`.
- Tile and prop source lives under `Assets/Environment`.
- Concept/reference images are not imported into runtime scenes.

Export files:

- Character sheets: `Assets/Exports/Spritesheets/*.png`
- Character metadata: `Assets/Exports/Spritesheets/*.json`
- Tile sheets: `Assets/Exports/Tilesets/*.png`
- Tile metadata: `Assets/Exports/Tilesets/*.json`

## Aseprite Workflow

Official docs:

- [Aseprite docs](https://www.aseprite.org/docs/)
- [Exporting](https://www.aseprite.org/docs/exporting/)
- [Animation](https://www.aseprite.org/docs/animation/)
- [CLI](https://www.aseprite.org/docs/cli/)

Create sprites in Aseprite, save source as `.aseprite`, then export through the batch scripts in `tools/`.

## Naming

Use lowercase runtime export names and descriptive source names:

```text
Zuzu_idle.aseprite -> zuzu_idle.png / zuzu_idle.json
Zuzu_walk.aseprite -> zuzu_walk.png / zuzu_walk.json
garage_floor_tiles.aseprite -> garage_floor_tiles.png / garage_floor_tiles.json
```

Tags:

- `idle_down`
- `idle_up`
- `idle_side`
- `walk_down`
- `walk_up`
- `walk_side`
- `talk`
- `repair`

## Standards

- Character frame size: `48x64`
- Small prop tile: `32x32`
- Large prop tile: `64x64`
- Garage/environment tile base: `32x32`
- Isometric/2.5D prop footprints may be larger, but anchors remain bottom-center.
- Character anchors: bottom-center.
- Prop anchors: bottom-center when Y-sorted, top-left only for pure TileMapLayer floor/wall tiles.

## Godot Runtime Contract

Godot scenes should reference exported PNG/JSON outputs. Aseprite source files are editable production assets; they should not be treated as runtime dependencies unless an importer plugin is intentionally added later.

