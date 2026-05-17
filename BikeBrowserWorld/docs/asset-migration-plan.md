# Asset Migration Plan

## Ready Now

- `public/game/audio/music/garage_warm_oud.ogg`
- `public/game/audio/music/neighborhood_hybrid_ride.ogg`
- `public/game/audio/stingers/reward_tarabi_stinger.ogg`

These can be imported into Godot once audio unlock behavior is tested in Web export.

## Convert to AnimatedSprite2D

- `public/assets/game/atlases/zuzu.png`
- `public/assets/game/atlases/zuzu.json`

These should become Godot `SpriteFrames` or atlas-backed animation resources.

## Convert to TileMap

- `public/assets/game/maps/neighborhood.json`
- `public/assets/game/tilesets/sonoran_tiles.png`

Use these after the vertical slice proves runtime and bridge behavior.

## Placeholder Quality

- `public/assets/ecology/*`

Useful for early region tests, but likely not final art.

## Replace Later

- Phaser Graphics-drawn garage props.
- Emoji/text-as-prop scene elements.
- Temporary Godot ColorRect props in this vertical slice.

## Reusable Scene Candidates

- Zuzu player.
- Mr. Chen NPC.
- Transition zone.
- Chain hotspot.
- Workbench.
- Bike stand.
- Dialogue box.
