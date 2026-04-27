---
name: phaser-layout-editor-overlay
description: Builds a minimal in-game layout editor as a sibling Phaser overlay scene (LayoutEditorOverlayScene). Hotkey-toggled (F2). Reads the active scene's layout JSON, renders every entry as a draggable shape with its name labeled, single-select + drag to reposition, Save button writes back to disk via a new POST /api/save-layout Vite dev-server middleware. Strict scope — no shape creation, no rotation, no layers, no multi-select, no resize, no grid snap, no new dependencies. Hard cap ≤ 600 LOC across all files.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
memory: project
maxTurns: 28
---

You build a minimal in-game layout editor that lets the developer drag
the layout JSON's anchors visually while `npm run dev` is running.

This is the dev-loop closer for `phaser-scene-layout-extractor`'s data-
driven layout system. The extractor moved positions from code to JSON;
this agent makes that JSON editable in-game without leaving the browser.

## Goal (verbatim)

While `npm run dev` is running, the developer presses F2 to toggle into
"edit mode" on the currently active local scene. In edit mode, every
entry in that scene's layout JSON renders as a draggable overlay that
the developer can click and drag to reposition. A Save button writes
the modified JSON back to disk. The actual game scene continues
rendering underneath the overlay so positioning happens in visual
context.

## Architectural constraints

- Editor lives as a sibling Phaser scene (`LayoutEditorOverlayScene`)
  launched via `this.scene.launch(...)` on top of the active local scene.
  When toggled off, it sleeps; the game scene is never destroyed.
- Editor reads the *same* layout JSON the game scene reads
  (`this.cache.json.get(layoutKey)`). When the developer drags, the
  editor mutates only its local working copy. Save flushes to disk.
- The editor must NOT modify any existing scene `.js` files. Its only
  hook into the game is reading the cached layout JSON, plus the
  `layoutEditorConfig` opt-in property each scene declares.
- Saving uses a small Vite dev-server endpoint (see "Save endpoint").
- Auto-detect support: scenes opt in by setting a static
  `layoutEditorConfig` property on the scene class:
    static layoutEditorConfig = {
      layoutAssetKey: 'zuzuGarageLayout',
      layoutPath: 'layouts/zuzu-garage.layout.json',  // relative to public/
    };
  This dispatch adds it to ZuzuGarageScene only. Other scenes get it in
  follow-up dispatches — out of scope here.

## MUST

1. **Hotkey toggle.** F2 (and only F2) toggles edit mode on/off when
   the active scene declares `layoutEditorConfig`. If the active scene
   has no config, F2 prints a console warning and does nothing.

2. **Overlay rendering.** When edit mode is on, render each layout
   entry as a semi-transparent colored shape with its name labeled:
   - Rectangles (entries with `w` + `h`): outlined rectangle, 30% fill
     alpha, name label centered.
   - Ellipses (entries with `r`): outlined circle radius `r`, 30% fill
     alpha, name label centered.
   - Points (entries with only `x` + `y`): small filled circle radius 6,
     name label below.
   Distinct color per shape type (rect=blue, ellipse=purple, point=
   orange). Names always readable (white text with dark stroke).

3. **Single-select + drag.** Click any overlay shape to select it
   (highlight with brighter outline). Drag to move. The shape's x/y in
   the working copy update in real time. Releasing the mouse commits
   the new position to the working copy in memory. Clicking empty space
   deselects.

4. **Live preview of the underlying game scene.** While editing, the
   game scene also re-reads its layout from the working copy so it
   visually updates as you drag. Implementation: the game scene checks
   for a `window.__layoutEditorWorkingCopy` global that, when present,
   overrides what `loadLayout()` returns. The editor sets/clears this
   global when toggling on/off. After dragging, the editor emits a
   `'layout-changed'` event on the game's registry; the active local
   scene listens and re-runs its `createWorld()` against the new
   positions.

   If full re-render is too invasive for v1 (e.g. ZuzuGarageScene's
   create has too many side effects to safely re-run mid-session), fall
   back to: only the editor's overlay updates live; the underlying game
   shapes update on Save (which triggers a scene restart). Pick the
   path you can implement reliably and document the choice in the
   receipt.

5. **Save button.** A simple HTML button rendered as a fixed DOM overlay
   in the top-right corner of the canvas (NOT a Phaser GameObject —
   easier for v1). Clicking Save POSTs the working copy to the dev-
   server endpoint. On success, show "Saved ✓" for 2 seconds. On
   failure, show "Save failed: <reason>" and log to console.

6. **Save endpoint.** Add a Vite dev-server middleware in
   `vite.config.js` that handles `POST /api/save-layout`. It accepts
   JSON body `{ path: string, data: object }` and writes `data`
   (pretty-printed JSON) to `public/<path>`. Reject paths containing
   `..` or absolute paths. Reject if `path` doesn't start with
   `layouts/`. Only available in dev mode — gated by `command ===
   'serve'`.

7. **Schema preservation.** When saving, preserve every field in the
   original JSON exactly: `scene`, `version`, `_world`, `_note` fields
   on every object, and any future fields. The editor only writes back
   `x`/`y` (and for circles, leaves `r` alone — circles can be moved
   but not resized in v1). Object insertion order in the JSON file
   must match the original.

8. **ZuzuGarageScene gets `layoutEditorConfig` added** as a single
   static property. No other changes to that file.

## MUST NOT

- No shape creation tools, layer/depth controls, rotation, flipping,
  color pickers, multi-select, copy/paste, undo/redo, or any other
  PowerPoint-style features. Those are explicitly out of scope.
- No modifying `loadLayout.js` other than (optionally) making it check
  `window.__layoutEditorWorkingCopy` for the current scene's layout
  key. If you do modify it, the production code path must be
  byte-identical when the global is undefined.
- No modifying any scene `.js` file other than ZuzuGarageScene's
  static property addition.
- No new dependencies. Use Phaser's built-in input + the existing build
  setup.
- No grid snapping, alignment guides, or smart snapping.
- No support for resizing rectangles (no drag handles on edges/corners).
  Move only.

## File structure

```
src/renderer/game/scenes/LayoutEditorOverlayScene.js   (NEW)
src/renderer/game/utils/loadLayout.js                  (optional modify per MUST #4)
src/renderer/game/scenes/ZuzuGarageScene.js            (one-line static prop)
vite.config.js                                         (add POST /api/save-layout middleware)
src/renderer/game/config.js                            (register the overlay scene on game boot)
```

Reviewer FAILs on edits to any other file.

## Edge cases

- F2 with no active local scene: console warn, do nothing.
- F2 on a scene without `layoutEditorConfig`: console warn, do nothing.
- Save with no changes: still posts to endpoint (idempotent), shows
  "Saved ✓".
- Dragging a point object below x=0 or above world bounds: clamp to
  `[0, world.width] × [0, world.height]`. Read world size from the
  active scene via `scene.getWorldSize?.()` or fall back to
  `scene.scale.gameSize`.
- Multiple presses of F2 in quick succession: debounce 200ms or just
  let the scene's launch/sleep handle it gracefully.
- Save endpoint receives a path like `layouts/../etc/passwd`: reject
  with 400 and a JSON `{ error: 'invalid path' }` body.

## Verification (manual test plan — include results in receipt)

1. `npm run dev`, navigate into ZuzuGarageScene.
2. Press F2 — overlay appears, all 60 anchors visible and labeled.
3. Click "workbench" overlay — it highlights.
4. Drag it 100px right — it moves, label moves with it, real workbench
   either follows live (full path) or stays put until save (fallback).
5. Click Save — see "Saved ✓".
6. Open `public/layouts/zuzu-garage.layout.json` — confirm
   `workbench.x` updated, all other fields including `_note`s
   preserved, no other entries changed.
7. Press F2 again — overlay disappears, game continues normally.
8. Refresh the browser — workbench is at the new position.
9. `git diff public/layouts/zuzu-garage.layout.json` — only the
   workbench x/y line changed (and possibly whitespace/formatting if
   your save serializer differs from the original — try to match).

Build must pass: `npm run build`.

## Standards

- JavaScript (`.js`), not TypeScript.
- No new dependencies.
- DOM Save button uses `position: fixed; top: 8px; right: 8px;
  z-index: 1000;` and pointer-events enabled. Pointer-events on the
  Phaser canvas remain unchanged so the button doesn't eat clicks.
- All editor display objects tagged `occlusionRole: 'safe'` so the
  runtime audit doesn't flag them.
- Vite middleware uses Node's built-in `fs/promises` and `path` —
  no `fs-extra` or other libs.
- The `loadLayout.js` modification (if any) MUST be a single
  `if (typeof window !== 'undefined' && window.__layoutEditorWorkingCopy?.[key]) return window.__layoutEditorWorkingCopy[key];`
  short-circuit at function entry. One line. Production behavior
  byte-identical when the global is undefined.

## Hard cap

Total new + changed code across all files: ≤ 600 LOC. If you find
yourself heading past that, stop and surface the issue in
`blockers_discovered` rather than truncating features.

## Receipt requirement

Write `.claude/swarm/receipts/phaser-layout-editor-overlay-<ISO>.json`
per schema. Include:
- All files modified or created.
- Total LOC delta (must be ≤ 600).
- Which path you implemented for MUST #4 (full live preview vs.
  save-only fallback) — explicit statement.
- Confirmation of every MUST NOT item: explicit statement
  "no rotation added, no shape creation added, no layers added, no
  resize, no multi-select, no grid snap, no new dependencies."
- Verification step results (1–9 from the manual test plan).
- Build result (`npm run build`).
- Suggested next agent: a follow-up to add `layoutEditorConfig` to
  StreetBlockScene + remaining scenes one at a time.
