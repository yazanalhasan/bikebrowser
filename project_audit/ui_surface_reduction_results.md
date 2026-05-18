# UI Surface Reduction Results

Generated: 2026-05-17

## Result

The player-facing `/play` route no longer shows the React prototype sidebar, export status panel, bridge event log, Send Settings button, Send Balance button, or legacy Phaser BUG/debug controls.

The default experience is now:

`/play -> full viewport Godot iframe -> BikeBrowserWorld`

## Reduced Surface Area

- Removed dashboard-style Godot wrapper layout from normal play.
- Hid bridge diagnostics unless explicitly requested.
- Removed persistent side panel from the canonical flow.
- Removed visible prototype copy from `/play`.
- Moved legacy Phaser utility surface to `/legacy-play`.

## Diagnostics Boundary

Diagnostics remain available by opt-in:

- `/godot-prototype?diagnostics=1`
- `/play?diagnostics=1`
- `localStorage.bikebrowser_godot_diagnostics = '1'`

This keeps bridge event inspection and manual message testing recoverable without making those controls part of the authored player flow.

## First-Experience Impact

The first route now feels more like entering a place and less like launching a tool. The app shell is still available elsewhere, but it no longer frames the embodied slice.

## Validation

- Browser smoke verified no `godot-diagnostics` element appears on default `/play`.
- Browser smoke verified diagnostics still appears on `/godot-prototype?diagnostics=1`.
- Legacy BUG/report tooling remains reachable only through `/legacy-play`.

## Remaining Risk

The Godot export itself still owns any in-world HUD density. This sprint reduced the React shell/prototype layer; future passes should evaluate Godot HUD pacing through live playtest observation.
