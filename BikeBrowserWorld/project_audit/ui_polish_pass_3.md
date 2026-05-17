# UI Polish Pass 3

Generated: 2026-05-15

## Scope

This pass focused on emotional transparency: making the existing UI less noticeable while preserving readability and interaction clarity. It did not add new HUD systems, new overlays, quest changes, save changes, registry changes, or gameplay-flow rewrites.

## Invisible UI Improvements

- Prompt opacity was reduced again so prompts feel more like nearby world signage than floating widgets.
- Prompt pulse motion was reduced to near-stillness.
- Prompt scale emergence was minimized from a visible pop to a barely perceptible settle.
- HUD and reward panels were made lighter through lower opacity and smaller shadows.
- Dialogue panel visual weight was reduced while preserving strong readable text contrast.

## Interaction Pacing Refinements

- Interaction press feedback now uses a smaller `1.012` scale nudge instead of a noticeable pop.
- Chain, safety-check, tire-repair, and transition interactions now wait `0.08s` to `0.18s` where appropriate, creating a tiny human beat without feeling sluggish.
- Prompt fade-in now takes `0.30s`, and fade-out takes `0.26s`, helping prompts arrive and leave quietly.

## Dialogue Comfort Refinements

- Dialogue reveal speed was tuned from `38` to `36` characters per second.
- Dialogue open timing now uses `0.32s`.
- Dialogue close timing now uses `0.28s`.
- Final dialogue line pause increased slightly from `0.10s` to `0.14s`.
- Dialogue line spacing increased from `4` to `5`.

These are small cadence changes intended to feel like a calm evening conversation rather than theatrical pauses.

## Reward Pacing Refinements

- Reward panel maximum opacity was lowered from `0.94` to `0.88`.
- Reward entrance duration moved from `0.30s` to `0.36s`.
- Reward hold shortened from `2.35s` to `2.15s`.
- Reward fade-out lengthened from `0.55s` to `0.65s`.
- Reward scale change now starts at `0.99`, making the acknowledgement almost still.

The reward should register emotionally without interrupting exploration.

## World-First Presentation

- HUD panel opacity is now lower and its shadow smaller.
- Reward panel opacity is now lower and its shadow smaller.
- Dialogue panel opacity is now lower and its shadow smaller.
- Prompt bubbles use a more transparent dusk background and quieter warm border.

The intended player feeling is not "the UI is pretty," but "I know what to do and still feel present in the neighborhood."

## Screenshots

No screenshots were captured during this pass. Verification was performed headlessly. A rendered pass should be done after non-UI vertical-slice blockers are resolved.

## Remaining Emotionally Heavy Areas

- Prompt styling is still duplicated across existing interaction scripts to avoid adding a new UI framework layer during this strict presentation pass.
- Text-glyph icons remain temporary. Final handcrafted art would further reduce the visible-designed feeling.
- Full cinematic flow still needs rendered playthrough review once reward-intent test failures are addressed.

