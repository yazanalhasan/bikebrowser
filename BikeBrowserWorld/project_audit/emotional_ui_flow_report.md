# Emotional UI Flow Report

Generated: 2026-05-15

## Goal

Pass 3 asked the UI to disappear emotionally: guide the player, then get out of the way. The tuning focused on micro-motion, opacity, and timing rather than visible redesign.

## Prompt Disappearance

Prompt tuning after this pass:

- Idle alpha: `0.76`
- Alpha pulse range: `0.025`
- Scale pulse range: `0.003`
- Bubble background alpha: `0.64`
- Border alpha: `0.18`
- Fade in: `0.30s`
- Fade out: `0.26s`

Prompts should now appear gently, help briefly, and disappear quietly.

## Dialogue Flow

Dialogue tuning after this pass:

- Reveal speed: `36` characters per second
- Open: `0.32s`
- Close: `0.28s`
- Final-line breath: `0.14s`
- Line spacing: `5`

The goal is natural reading rhythm without artificial drama.

## Reward Flow

Reward tuning after this pass:

- Entrance opacity target: `0.88`
- Entrance duration: `0.36s`
- Hold: `2.15s`
- Fade out: `0.65s`
- Scale start: `0.99`

Rewards now feel closer to a small acknowledgement than an interruption.

## Quiet Space Preservation

- No new overlays were added.
- No extra persistent UI was added.
- No flashing, bounce, or large scale effects were added.
- Prompt and panel visual weight was reduced instead of increased.
- The HUD remains compact and world-first.

## Validation Results

Commands run:

```text
godot --headless --path . --quit
godot --headless --path . --script tests/vertical_slice_check.gd
```

Observed status:

- RuntimeValidator reports `0 errors`.
- Headless project load exits with code `0`.
- Godot still reports an ObjectDB leak warning and a resource-in-use shutdown error despite exit code `0`.
- Vertical slice still fails on existing reward-intent assertions for `chain_repair` and `flat_tire_repair`.

The remaining failures are not UI presentation regressions and were left untouched.

## Remaining Risks

- If prompt opacity feels too subtle against bright backgrounds in rendered playtest, raise only the bubble alpha slightly before increasing motion.
- If dialogue feels slow to fluent readers, keep the reveal speed near this range and prefer allowing click-to-advance rather than speeding all lines.
- Final icon art should replace glyphs when available.
