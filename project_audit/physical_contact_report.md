# Physical Contact Report

## Summary

The brake prototype now moves closer to physical intuition. The player can see the brake not only move, but grip and resist.

The educational target is:

```text
I can feel how brakes work.
```

The implementation remains authored and lightweight.

## Pressure

Pressure is represented through:

- lever resistance arc.
- slight lever vibration under load.
- cable load mark.
- caliper closure delay.
- pad over-compression at contact.

This makes the input feel less like a switch and more like a squeeze.

## Contact

Contact is represented through:

- pad movement toward the rotor/rim.
- contact pinch cue.
- compression glow.
- contact point cue.

The brake now reads more like it is gripping the wheel instead of merely reaching a pose.

## Friction

Friction is represented through:

- `friction_load` channel.
- friction band at the rotor/rim.
- progressive wheel slowdown.
- spin ghost fade.
- tiny visual hesitation under load.

The player should be able to see that wheel speed changes because of contact, not because an objective advanced.

## Wheel Resistance

The wheel no longer jumps from spinning to stopped. It enters a resistance phase:

```text
spin -> resistance -> heavy resistance -> stop -> verify
```

This is still deterministic and readable. No physics engine was introduced.

## Educational Validation

Current likely player understanding:

- The lever applies pressure.
- The cable carries that pressure.
- The caliper squeezes the wheel area.
- Friction slows the wheel.
- The brake works when the wheel stops.

The remaining validation should happen by observation, not explanation. A playtester should be asked what they saw before reading any report.

## Emotional Fit

The pass keeps the mood calm:

- quiet warm colors.
- small physical cues.
- no sparks.
- no score or reward burst.
- no engineering panel.
- no quiz overlay.

## Remaining Risks

- If the friction band is too visible, it may feel like UI instead of material contact.
- If the contact pinch is too subtle, the brake may still read as diagrammatic.
- If the slowdown takes too long, players may think the input is weak.
- If integrated poorly, the safety-check quest could still complete on prompt press instead of brake verification.

## Integration Guardrail

The only integration signal should be:

```text
brake_verified_changed(true)
```

QuestRegistry should not know about `friction_load`, `pad_contact`, `wheel_spin`, or any mechanical channel. Those remain local teaching mechanics.

