# Level Editor Design Brief

## Goal

Build a developer-only in-game level editor for the Godot /play build. The editor is toggled with F2, manipulates live Godot scene nodes, and saves back to canonical .tscn / .tres files through a dev-only localhost API. It must not ship to production players.

## Architecture

- res://addons/level_editor/ contains all Godot editor runtime code and scenes.
- LevelEditor is an autoload singleton. It listens globally for F2 and owns editor state, selection, command history, save diff generation, and the dev API client.
- DevMode is a tiny autoload wrapper around ProjectSettings.get_setting("application/config/dev_mode", false).
- application/config/dev_mode=false is added to project.godot. Dev runs can set it true from CLI or a dev-only project patch. Production leaves it false.
- EditorOverlay.tscn is instanced by LevelEditor as a top-level CanvasLayer above the current scene while edit mode is active.
- The overlay does not create a sidecar scene tree. It inspects and mutates actual nodes in the active scene.
- Mutations go through a single command stack with undo/redo depth 50.
- React shell changes are limited to a postMessage listener for EDIT_MODE_ON / EDIT_MODE_OFF that hides or restores HUD/quest chrome.

## Edit Mode Lifecycle

- F2 checks DevMode.enabled. If false, it is a no-op.
- On enter:
  - get_tree().paused = true.
  - Editor overlay remains processable with PROCESS_MODE_ALWAYS.
  - Player, NPC, physics, audio cues pause naturally through tree pause.
  - AudioService is not modified; LevelEditor uses existing bus controls when available and otherwise stores/restores the Music bus volume with a -12 dB duck.
  - React shell receives EDIT_MODE_ON.
  - The calm EDIT MODE badge appears top-right.
- On exit:
  - Selection and transient handles clear.
  - Music volume restores.
  - get_tree().paused = false.
  - React shell receives EDIT_MODE_OFF.

## Panels

- Left inspector: selection properties. Single selection shows name, position, scale, rotation, z-index, layer/group, visible, modulate, and supported custom exported properties. Multi-selection shows shared editable properties only.
- Right layer panel: scene layers by top-level editable container/group, with visibility, lock, solo, object count, and reorder controls. Drag reorder is represented as node sibling order changes.
- Bottom asset palette: canonical sprite assets under res://Assets/, collapsible. Dragging creates Sprite2D nodes. This is Tier 2.
- Diff preview popup: appears before saving. Lists changed node paths and changed properties with before/after values. Confirm sends write request; cancel leaves scene dirty.

## Selection And Editing

- Left-click selects the topmost editable CanvasItem / Node2D under the cursor.
- Shift-click adds to selection.
- Ctrl-click toggles selection.
- Empty drag draws a rectangle and selects all editable objects inside.
- Esc clears selection.
- Selected objects draw a 1 px warm outline plus corner handles.
- Drag moves selected objects. Default snap grid is 8 px; Alt bypasses snap.
- Arrow keys nudge by 1 px; Shift+arrow nudges by 8 px.
- G toggles grid visibility.
- R starts rotation mode; Shift snaps to 15 degrees.
- H / V flip by negating scale axis.
- Ctrl+D duplicates with an 8,8 offset.
- Ctrl+C / Ctrl+V copy/paste serializable node snapshots across scene switches.
- Delete / Backspace removes selection.
- [ / ] moves selected nodes down/up one layer or sibling order.
- F frames selection, Home restores default camera, wheel zooms to cursor, middle mouse or Space+drag pans.

## Command Pattern

Every mutation is represented as label, do(), undo(), affected_paths, before_snapshot, and after_snapshot.

The command stack stores at least 50 commands. Commands cover property edit, transform edit, reparent/reorder, duplicate, paste, delete, visibility/lock/solo changes, and layer assignment. Save diff is derived by comparing the scene's baseline snapshots from edit-mode entry with the current node snapshots, not from informal command labels.

## File Write Strategy

Godot web export cannot write canonical project files directly. The editor therefore:

1. Computes the changed scene text/diff in Godot.
2. Fetches a dev session token from GET http://127.0.0.1:3001/api/dev-token.
3. Sends POST http://127.0.0.1:3001/api/dev-editor/save-scene with token, relative path, expected mtime/hash, and full contents.
4. The Node API validates, backs up, writes .tmp, then atomically renames.

Initial save serialization will preserve existing .tscn text and patch explicit changed property lines where possible. Newly created or deleted nodes use Godot serialization helpers where available; if the serializer cannot produce a safe canonical patch, save is rejected with a clear message.

## Dev Endpoint Contract

Routes are registered only when both conditions are true:

- NODE_ENV !== "production"
- BIKEBROWSER_DEV_EDITOR=1

Routes:

- GET /api/dev-token
  - 127.0.0.1-only.
  - Returns { success: true, token, projectRoot }.
- POST /api/dev-editor/save-scene
  - 127.0.0.1-only.
  - Requires x-dev-editor-token.
  - Body: { relativePath, contents, expectedHash?, expectedMtimeMs? }.
  - Accepts only .tscn or .tres.
  - Rejects payloads over 5 MB.
  - Rejects .., absolute paths, paths outside BikeBrowserWorld, and non-whitelisted extensions.
  - If expected hash/mtime disagrees with disk, returns 409 with reload-or-merge data.
  - Before write, copies current file to sibling .editor_backups/<basename>.bak.<timestamp>.
  - Keeps the latest 20 backups per file.
  - Writes <file>.tmp, then atomic rename.
  - Appends timestamp path byteCount sha256 to project_audit/editor_writes.log.

## Required Endpoint Guardrails

1. Localhost-only request guard. Reject anything not from loopback, regardless of the server's normal LAN bind.
2. Random startup session token.
3. Path whitelist under BikeBrowserWorld only; no ..; .tscn / .tres only.
4. Feature-gated by NODE_ENV !== "production" and BIKEBROWSER_DEV_EDITOR=1; routes do not register otherwise.
5. Append-only write audit log in project_audit/editor_writes.log.
6. Backup-before-write with last-20 pruning per file.
7. 5 MB maximum save payload.

## DEV_MODE Wiring

- project.godot: application/config/dev_mode=false.
- DevMode.gd exposes var enabled := false, initialized from project setting and optionally OS.has_feature("editor") / command-line override in dev-only runs.
- LevelEditor checks DevMode.enabled before loading overlay or handling F2.
- Tests/dev start set the project setting true for the dev export/run only.
- Production export leaves it false and excludes the editor addon.

## Production Exclusion

export_presets.cfg adds the level editor addon to exclude_filter, e.g.: exports/web/*,addons/level_editor/*

Validation showed Godot still packs cached addon resources under all_resources, so the export helper also enforces production exclusion by temporarily moving addons/level_editor out of the project during production export, clearing Godot export/editor caches, waiting for the web files, and restoring the folder afterward. Dev-editor exports use the Web Dev Editor preset and keep the folder in place.

Production safety validation must confirm:

- DevMode.enabled == false at runtime.
- F2 does nothing.
- addons/level_editor is absent from exported .pck.
- No dev endpoint URL appears in the production bundle.

## Tier 2 Scope

Tier 2 adds collision/interaction overlays (B), parent lines (P), sprite asset palette, screenshot capture (F12), quick play test (F5), and external file-change banner. Screenshot saves to project_audit/editor_screenshots/<timestamp>.png via the same dev endpoint family or a dedicated guarded screenshot route if browser filesystem access blocks direct save.

## Keybindings

| Key | Action |
| --- | --- |
| F2 | Toggle edit mode |
| Esc | Clear selection |
| G | Toggle grid |
| Arrow | Nudge 1 px |
| Shift+Arrow | Nudge 8 px |
| Alt+Drag | Free move, no snap |
| R | Rotate mode |
| Shift while rotating | Snap 15 degrees |
| H / V | Flip horizontal / vertical |
| Ctrl+D | Duplicate |
| Ctrl+C / Ctrl+V | Copy / paste |
| Delete / Backspace | Delete |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z / Ctrl+Y | Redo |
| Ctrl+S | Diff preview and save |
| [ / ] | Move selection down/up layer |
| Middle drag or Space+drag | Pan |
| Mouse wheel | Zoom toward cursor |
| F | Frame selection |
| Home | Default camera |
| B | Toggle hitbox/interaction overlay |
| P | Toggle parent lines |
| F12 | Screenshot |
| F5 | Quick play test |
