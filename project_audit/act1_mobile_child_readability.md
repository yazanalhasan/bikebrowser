# Act 1 Mobile / Child Readability

Date: 2026-05-18
Scope: `/play` mobile framing and child-readable route surface.

## Summary

Mobile portrait previously rendered the Godot world as a narrow horizontal band with large inactive green space above and below. The React route and iframe were already full-screen; the issue was inside Godot camera framing under stretched web export.

The responsive camera now reads the real window size through `DisplayServer.window_get_size()` before falling back to the stretched viewport size. This lets portrait browser sessions use the intended closer mechanic/world framing.

## Before / After

Measured with `tools/analyze_visual_runtime_cuda.py` on RTX 5090 CUDA.

| Capture | Active pixel ratio | Active bbox ratio | Bottom inactive margin |
| --- | ---: | ---: | ---: |
| Before camera fix: `mobile_play_after_camera_tune.png` | 0.3089 | 0.6623 | 0.3318 |
| After real-window camera fix: `mobile_play_after_window_camera_tune.png` | 0.6443 | 0.8448 | 0.1493 |

## Result

- Zuzu is now large enough to read in portrait.
- The safety-bike area, houses, sidewalk, road, and HUD remain visible.
- The route still preserves the calm neighborhood view instead of cropping the iframe or hiding UI.
- The remaining bottom margin is acceptable for the current web export because it keeps the world from feeling claustrophobic and leaves touch/portrait breathing room.

## Validation

- `godot --headless --path .\BikeBrowserWorld --script res://tests/vertical_slice_check.gd`
- `tools/export-godot-web.ps1`
- Playwright mobile portrait screenshot capture.
- CUDA visual metric pass.

## Follow-Up

For external child playtests, watch whether children can notice the first safety-bike prompt in portrait without being told to rotate the device. If not, add a subtle camera nudge or station-facing spawn adjustment before expanding any new content.

