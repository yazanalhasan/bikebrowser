# Level Editor Report

## Shipped

### Tier 1

- F2 toggles edit mode in Godot when DevMode.enabled is true.
- application/config/dev_mode=false is the default project setting.
- DevMode autoload exposes enabled; /play dev runs pass devEditor=1.
- LevelEditor autoload is a small production-safe bootstrap under Core/LevelEditor.
- Editor payload lives under addons/level_editor/ and is loaded only in dev mode.
- Edit mode pauses the tree, keeps the overlay processable, ducks the Music bus by 12 dB, and restores state on exit.
- React shell listens for EDIT_MODE_ON / EDIT_MODE_OFF and hides the home/HUD chrome while editing.
- Selection supports click, shift-add, ctrl-toggle, Esc clear, warm outlines, and corner handles.
- Move supports drag, arrow nudges, Shift+arrow 8 px nudges, Alt drag free move, and default 8 px snap.
- Grid toggle: G.
- Layer panel lists scene layers, visibility, lock, solo, and object count.
- Inspector edits position, scale, rotation, z-index, and visible for single selection.
- Rotation mode toggle: R; flip: H / V.
- Duplicate/copy/paste/delete exist for runtime editing.
- Undo/redo command stack covers property edits and movement with depth 50.
- Ctrl+S opens a diff preview and saves supported property patches through the dev endpoint.
- Camera controls: middle drag / Space drag pan, wheel zoom, F frame selection, Home reset.
- Production F2 is a no-op because DevMode.enabled is false and the addon payload is absent.

### Tier 2 Partial

- B toggles bounding-box overlay for editable nodes.
- P toggles parent anchor lines for selected nodes.
- F12 saves a viewport screenshot to user://editor_screenshots.
- F5 exits edit mode for 10 seconds, then returns to edit mode.

## Dev Save Endpoint

Routes register only when NODE_ENV is not production and BIKEBROWSER_DEV_EDITOR=1.

- GET /api/dev-token
- POST /api/dev-editor/save-scene

Guardrails implemented:

- API binds to 127.0.0.1 when the dev editor flag is enabled.
- Requests are still checked for loopback origin.
- Random startup token required via x-dev-editor-token.
- Writes are whitelisted to BikeBrowserWorld, reject .., reject absolute paths, and allow only .tscn / .tres.
- Payload limit is 5 MB.
- Existing file is backed up to sibling .editor_backups/ before atomic temp-file rename.
- Last 20 backups per file are kept.
- Successful writes append timestamp, path, byte count, and SHA-256 to project_audit/editor_writes.log.

## Production Safety

- Production project setting: application/config/dev_mode=false.
- Production export preset remains Web Single Threaded.
- tools/export-godot-web.ps1 temporarily hides addons/level_editor during production exports, clears Godot export/editor caches, waits for web files to materialize, then restores the addon.
- Validation export to tmp/level_editor_prod_export_script found no addons/level_editor, api/dev-editor, api/dev-token, BikeBrowserLevelEditorState, or devEditor strings in the production bundle.
- Dev export preset Web Dev Editor includes the addon and is used for local /play editing.

## Keybindings

| Key | Action |
| --- | --- |
| F2 | Toggle edit mode |
| Esc | Clear selection |
| Click | Select |
| Shift+Click | Add selection |
| Ctrl+Click | Toggle selection |
| Drag | Move selection |
| Alt+Drag | Free move |
| Arrow | Nudge 1 px |
| Shift+Arrow | Nudge 8 px |
| G | Toggle grid |
| R | Toggle rotation mode |
| H / V | Flip horizontal / vertical |
| Ctrl+D | Duplicate |
| Ctrl+C / Ctrl+V | Copy / paste |
| Delete / Backspace | Delete runtime node |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Ctrl+S | Diff preview and save |
| [ / ] | Reorder selected nodes |
| Middle drag / Space drag | Pan |
| Wheel | Zoom |
| F | Frame selection |
| Home | Reset view |
| B | Bounds overlay |
| P | Parent lines |
| F12 | Screenshot |
| F5 | Quick play test |

## Known Limitations

- Save currently supports explicit property patches for position, scale, rotation, z-index, and visible. Structural edits such as duplicate/delete are runtime-only until serializer support is expanded.
- Drag-rectangle selection and true drag-to-reorder layers are not complete.
- Multi-selection inspector is minimal.
- Modulate color and arbitrary exported custom properties are not yet editable.
- Asset palette UI is stubbed; drag-to-instance Sprite2D is deferred.
- External scene live-reload banner is deferred.
- Screenshot annotation is deferred.
- Browser save confirmation is a Godot dialog inside the canvas, so Playwright validates save through runtime state and endpoint round trip rather than DOM text.

## Adding Property Types

Add new property support in two places:

1. EditorOverlay.gd
   - Expose the property in _snapshot.
   - Add inspector field rendering and mutation in _set_selected_property.
   - Include it in _changed_patches.
2. src/server/api-server.js
   - Add serialization in valueToTscn.
   - Keep the parser strict; reject unsupported property formats instead of guessing.

## Deferred Tier 3

- Telemetry heatmap overlay.
- Measurement tool.
- Alignment/distribution toolbar.
- Scene tree view.

## Validation

- node -c src/server/api-server.js: pass.
- godot_console.exe --headless --path BikeBrowserWorld --quit: pass, existing shutdown resource warnings remain.
- npm run build: pass.
- npx playwright test tests/e2e/godot-level-editor.smoke.spec.js --project=chromium: pass.
- Dev save endpoint round trip: pass; backup and editor_writes.log append verified.
- Production safety export: pass with export helper; no editor addon/dev endpoint strings found.

