# Terrain Generator for Godot 4

Procedurally generates tilemap terrain using noise.

## Installation

1. Copy the `TerrainGenerator` folder to `res://addons/`
2. Enable in Project Settings > Plugins

## Usage

### From Code

```gdscript
var gen = TerrainGenerator.new()
gen.generate_terrain($TileMap, Rect2(0, 0, 100, 100), TerrainGenerator.Biome.DESERT, 12345)
gen.generate_dry_wash($TileMap, Vector2(50, 0), Vector2(50, 100), 3)
gen.generate_river($TileMap, [Vector2(0, 30), Vector2(50, 50), Vector2(100, 30)], 2)
```

### From Editor

1. Select a TileMap node.
2. Open the Terrain Generator dock.
3. Choose biome, seed, and bounds.
4. Click Generate.

## Biome Types

- Desert - Sand with scattered rocks and cacti
- Dry Wash - Eroded channels
- River - Water with sandy banks
- Mine - Rocky with rail tracks
- Neighborhood - Flattened with roads
