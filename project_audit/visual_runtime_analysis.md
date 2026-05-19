# Visual Runtime Analysis - UX Playtest Pass

Date: 2026-05-18
Agent: UX-Playtest-Agent

## Capture Set

- Manual player screenshots: `playtest_captures/ux-playtest-*.png`.
- Route sweep screenshots: `project_audit/visual_runtime_screens_ux_playtest/`.
- Raw sweep report: `project_audit/visual_runtime_capture_ux_playtest.json`.
- CUDA/PyTorch analysis: `project_audit/visual_runtime_analysis_ux_playtest.json`.
- GPU: NVIDIA GeForce RTX 5090.
- Images analyzed: 50.
- Findings emitted: 8.

## Key Metrics

| Surface | Active pixel ratio | Visual read |
| --- | ---: | --- |
| Desktop `/play` | 0.76 | Healthy, active scene fills most of the viewport. |
| Mobile landscape `/play` | 0.71 | Usable, though HUD density still matters. |
| Tablet portrait `/play` | 0.43 | Noticeable inactive vertical space. |
| Mobile portrait `/play` | 0.31 | Major framing issue; world becomes a horizontal band. |
| Lowres `/play` | 1.00 | Full-frame at 16:9. |

## Visual Findings

| Finding | Severity | Evidence | Recommendation |
| --- | --- | --- | --- |
| Portrait `/play` has large inactive vertical margins | High | CUDA flagged mobile and tablet portrait `/play`; manual Pixel 5 screenshots show a small play band with large green space above/below | Prioritize a portrait camera/layout pass before wider mobile playtest. |
| First HUD/objective competes with world labels | Medium | Start screenshots show HUD, `Act 1 Review`, `Bridge Review`, regional exits, garage/workshop labels together | Delay or soften later-review labels until after first repair objectives, or visually subordinate them. |
| Home button scale dominates mobile corner | Medium | Mobile screenshots show a large home button near the HUD | Keep escape visible, but reduce visual competition with quest text in portrait. |
| Prompt clustering near garage/bridge/desert | Medium | Desktop wander screenshot shows `Act 1 Review`, `Bridge Review`, `Fix`, and `Ride to Desert Trail` in the same visual area | Use proximity gating or priority prompts so only the most relevant prompt is emphasized. |
| Tap-only mobile gives no visible feedback | High | Low-attention mobile tap path produced no obvious movement or action change | Add mobile movement affordance, touch prompt, or explicit keyboard/controller expectation before external mobile test. |

## Runtime Noise

- Route capture reports `net::ERR_ABORTED` for Godot `.wasm` and `.pck` requests even when the game boots and validates. Treat this as capture noise unless paired with a blank canvas or runtime error.
- React Router future-flag warnings appear on captured routes and are not player-facing.
- WebGL `ReadPixels` performance warnings appear during capture and are not currently player-facing.

## Visual Verdict

Desktop `/play` is visually strong enough for focused internal playtesting. Mobile portrait is not ready for a confident child playtest because the layout makes the world feel small, the controls are not discoverable through tapping, and the HUD/review labels compete with the first objective.
