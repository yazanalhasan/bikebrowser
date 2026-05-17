# UI Polish Pass 2

Generated: 2026-05-15

## Scope

This second pass refined emotional pacing and world/UI harmony. It deliberately avoided new runtime systems, quest-flow changes, save logic, registry changes, or large HUD redesigns.

## Emotional Pacing Improvements

- Reward popup timing now rises more gently, holds a little longer, and fades away more softly.
- Reward scale motion was reduced so the moment feels like recognition, not arcade celebration.
- Dialogue reveal speed was slowed to give lines more breathing room.
- Dialogue close timing now fades with a softer ease, avoiding the abrupt terminal-like disappearance.
- A small pause was added before dialogue completion closes, so the final line has a moment to land.

## Diegetic Prompt Improvements

- Prompt pulses now move more slowly and with less scale change.
- Prompt bubbles are slightly more transparent with a softer border, helping them sit over the world instead of blocking it.
- Prompt fade-in/fade-out timings are slower and calmer.
- Interaction press feedback was reduced from a noticeable pop to a smaller tactile nudge.
- Prompt padding was tightened so prompts remain compact near objects and characters.

## Reward Timing Changes

Before:

- Faster entrance.
- Stronger scale pop.
- Shorter hold.
- Quicker disappearance.

After:

- `0.30s` gentle fade/scale in.
- `2.35s` quiet hold.
- `0.55s` soft fade out.
- Lower maximum opacity so the reward card does not visually shout over the scene.

## Dialogue Atmosphere Improvements

- Dialogue panel opacity and shadow were softened.
- Dialogue line spacing was increased for a more comfortable reading rhythm.
- Typewriter speed changed from `44` to `38` characters per second.
- Opening timing changed from `0.22s` to `0.28s`.
- Closing timing changed from `0.18s` to `0.24s`.

## World/UI Balance

- HUD background and shadow strength were reduced.
- Reward panel opacity and shadow strength were reduced.
- Prompt bubble opacity was reduced across NPC, transition, chain, safety-check, and tire-repair interactions.
- The world remains the dominant visual layer; UI now reads more like soft signage and small physical feedback.

## Iconography Refinement

- HUD quest glyph was changed from a sharp star-like marker to a quieter circular keepsake mark.
- Reward glyph remains compact and readable.
- No glossy, stock, or large celebratory icons were introduced.

## Screenshots

No new screenshots were captured in this pass. Current validation was headless, and full vertical-slice playthrough remains blocked by non-UI reward-intent assertions listed in `diegetic_ui_report.md`.

## Remaining UI Immersion Issues

- Prompt styling is still repeated in several existing interaction scripts. This was left intact to respect the no-new-framework constraint for this parallel workstream.
- Reward and quest icons are still text glyphs. They should eventually be replaced with approved handcrafted UI art.
- Full emotional playtest in the rendered world should be repeated after the existing non-UI reward-intent blockers are resolved.
