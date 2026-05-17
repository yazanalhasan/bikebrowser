# Diegetic UI Report

Generated: 2026-05-15

## Goal

Pass 2 focused on making the interface feel more like it belongs to the neighborhood: softer prompts, calmer pacing, and less visual pressure.

## Prompt Feel

Prompts now behave more like subtle world cues:

- Lower alpha peak: `0.84`
- Slower pulse: `2.2` alpha rhythm and `2.0` scale rhythm
- Smaller scale movement: `0.006`
- Softer bubble background: dusk-blue at `0.72` alpha
- Softer border: warm gold at `0.24` alpha
- Fade in/out now uses calmer `0.24s` / `0.20s` timing

The intended effect is a cue that can be found easily without feeling like a demand.

## Reward Feel

The reward popup now favors emotional acknowledgment:

- Smaller entrance scale change: `0.98` to `1.0`
- Softer maximum opacity: `0.94`
- Longer hold for readability: `2.35s`
- Slower fade out: `0.55s`

This keeps reward moments noticeable but not spammy.

## Dialogue Feel

Dialogue was tuned toward a more comfortable conversation rhythm:

- Slower type reveal.
- More line spacing.
- Softer panel opacity and shadow.
- Slight final-line pause before closing.
- Gentler open/close easing.

The goal is for dialogue to feel like sitting with someone rather than reading an overlay.

## Accessibility Comfort

- Reduced prompt motion intensity.
- Reduced panel opacity and shadow heaviness.
- Preserved strong text contrast.
- Avoided flashing, bouncing, and large scale effects.
- Kept prompt labels short and scannable.

## Validation Results

Commands run:

```text
godot --headless --path . --quit
godot --headless --path . --script tests/vertical_slice_check.gd
```

Current status after this pass:

- RuntimeValidator reports `0 errors`.
- The headless project load exits with code `0`.
- Godot still reports an ObjectDB/resource cleanup warning at exit.
- The vertical slice still fails on existing reward-intent assertions for `chain_repair` and `flat_tire_repair`.

These issues are outside this UI/HUD presentation workstream and were not modified.

## Remaining Immersion Risks

- Final prompt placement should be reviewed in a rendered playtest after the non-UI blockers are fixed.
- Text-glyph icons should be replaced by final handcrafted icon assets.
- A future cleanup can centralize prompt styling once parallel workstreams are no longer editing the same interaction scripts.
