# HUD Readability Report

Generated: 2026-05-15

## Readability Changes

- HUD footprint remains compact and anchored near the top-left, keeping the world as the emotional focus.
- Quest title and hint now use clearer hierarchy: title first, guidance second.
- Warm cream text on dusk-blue panel improves comfort without harsh black-on-white contrast.
- Reward popup uses a separate warm panel so it feels distinct but not loud.
- Dialogue body text has more room and a larger size, while speaker text remains secondary.

## Interaction Prompt Readability

- Removed old `Press Enter` wording from targeted scenes.
- Short prompt phrases reduce reading load.
- Key-first structure, such as `[E] Talk`, makes the action scannable.
- Fade timing is short and calm.
- Pulse is now subtle enough to attract attention without feeling urgent.

## Animation Comfort

- Reward entrance uses gentle sine easing instead of a bouncy pop.
- Dialogue open/close uses short fade/scale transitions.
- Prompt pulse uses reduced scale and alpha movement.
- No flashing, harsh scaling, or casino-like reward motion was introduced.

## Accessibility Notes

- The pass favors stable, compact, high-legibility UI.
- Motion was reduced rather than removed, preserving a living feel while avoiding chaotic feedback.
- UI copy is supportive and low-pressure.
- Dialogue spacing and hierarchy should be easier to follow at a distance.

## Validation Results

Command run:

```text
godot --headless --path . --quit
```

Result:

- Quest validation: `0 errors, 0 warnings`
- Runtime validation: `0 errors, 1 warning`
- Quests loaded: `18`
- Dialogue files: `21`
- Regions: `7`
- Audio mappings: `7/7`

Known blocker still emitted during project load:

- `Systems/World/ZuzuController.gd:74-75`
- `Systems/World/ZuzuController.gd:103-104`

Godot reports typed-Variant inference warnings as parse errors for `target_rotation` and `desired_lookahead`. This is outside the UI/HUD polish scope.

Vertical slice command run:

```text
godot --headless --path . --script tests/vertical_slice_check.gd
```

Result:

- Failed before a clean pass due to the same `ZuzuController.gd` parse errors.
- Also reported existing reward-intent assertions for `chain_repair` and `flat_tire_repair`.

These failures were not caused by UI presentation changes and were not repaired because this workstream explicitly excludes runtime architecture, reward pipeline logic, and quest flow changes.

## Follow-Up Recommendations

- Repair the typed local variables in `Systems/World/ZuzuController.gd` so scene and walkthrough validation can complete.
- Resolve reward-intent assertions in the vertical slice test in a dedicated reward-system workstream.
- Replace temporary glyph icons with final warm UI assets once icon art is approved.
- Consider a later centralized prompt-style helper after parallel workstreams settle, to reduce duplicated prompt styling without changing behavior during this pass.

