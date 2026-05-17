# Godot Art Import Pipeline

## Runtime Inputs

Godot consumes exported PNG sprite sheets, tile sheets, and Aseprite JSON metadata:

```text
Assets/Exports/Spritesheets/*.png
Assets/Exports/Spritesheets/*.json
Assets/Exports/Tilesets/*.png
Assets/Exports/Tilesets/*.json
```

## Texture Import Settings

For pixel/stylized sprites:

- Filter: nearest/off for crisp pixel clusters.
- Mipmaps: off for UI/characters; optional for large background textures.
- Compression: lossless or VRAM-safe defaults. Avoid artifacts on character sheets.
- Repeat: disabled except for intentional repeating tiles.

## Character Setup

Preferred initial setup:

1. Export Aseprite sprite sheet and JSON tags.
2. Import PNG into Godot.
3. Use `AnimatedSprite2D` or `AnimationPlayer`.
4. Anchor character visuals above the `CharacterBody2D` origin.
5. Keep gameplay collision as simple shapes, not image bounds.

## TileMapLayer Setup

Godot 4 uses `TileMapLayer` nodes instead of building new work on legacy multi-layer `TileMap` nodes.

Recommended layers:

- `FloorLayer`
- `WallLayer`
- `ShadowLayer`
- `PropLayer`
- `InteractableLayer`
- `LightingLayer`
- `FXLayer`
- `NPCLayer`
- `PlayerLayer`

Use TileMapLayer for repeated floor/wall/curb/road tiles. Use Sprite2D/AnimatedSprite2D scenes for furniture, characters, and interactive props that need Y-sort or animation.

## Y-Sort

- Enable Y-sort on the parent layer for props/NPC/player groups.
- Use bottom-center anchors for sortable sprites.
- Keep floor and lighting overlays out of Y-sort unless they must layer with characters.

## Scene Assembly

Static positions should stay data-driven in `Data/layouts/*.json`. Scene files may define reusable nodes and scripts, but authored placement data belongs in layout JSON wherever practical.

