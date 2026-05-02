## Layout system rule

Scene layouts are data-driven. NEVER write literal pixel coordinates in
scene files. All positions come from `public/layouts/<scene>.layout.json`
loaded via `loadLayout(this, '<key>')` (from
`src/renderer/game/utils/loadLayout.js`) and accessed as
`this.layout.<name>`.

To add a new on-screen element: add it to the layout JSON first, then
reference it in code. If a position must be computed at runtime
(e.g. follows the player), that's fine — but anchors and static
positions belong in the JSON.
