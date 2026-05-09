# Asset Pipeline

## Workflow

1. Generate concept art first.
2. Approve the style against `ART_BIBLE.md`.
3. Generate atlas sheets for characters, buildings, props, plants, animals, and UI.
4. Slice into atlases using TexturePacker or an equivalent atlas tool.
5. Export Phaser-compatible JSON atlas files.
6. Place atlas PNG/JSON files into `public/assets/game/atlases`.
7. Register atlas keys in `src/game/assets/assetManifest.js`.
8. Use frame names from the manifest and metadata.
9. Never hard-code new random art inside scene files.

## Phaser Runtime Rules

- Use atlases for non-uniform packed sprites.
- Use spritesheets only for uniform frame strips.
- Use tilemaps for modular worlds.
- Use Tiled for maps that need tile layers, object layers, freely placed objects, and object templates.
- Labels are `WorldLabel` overlays, not baked into images.
- Static placeholder graphics are acceptable while final art is missing, but they must follow the art bible.

## Adding A Final Atlas

1. Export `name.png` and `name.json`.
2. Put both files in `public/assets/game/atlases`.
3. Add an entry to `ASSET_MANIFEST.atlases`.
4. Add or update expected frame metadata in `assetMetadata.js`.
5. Run:

```bash
npm run audit:game-assets
npm run build
```

6. Check the scene in the browser at normal play zoom.

## Placeholder Retirement

When a final atlas frame exists, runtime helpers should automatically prefer it over placeholder art. Do not delete fallback factories; they are useful for development builds and missing-asset recovery.
