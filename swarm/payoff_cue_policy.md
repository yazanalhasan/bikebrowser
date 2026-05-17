# Payoff Cue Policy

Generated: 2026-05-16

## Purpose

Quest completion and repair success should feel meaningful, tactile, and warm without overstimulating the player or making the world feel heavily designed.

## Core Rule

Every completion moment must choose:

- One primary payoff cue.
- Zero or one secondary soft cue.

Anything beyond that requires explicit integration approval in the lane report.

## Disallowed Default Stack

Do not stack all of these by default:

- Visual glint.
- Audio stinger.
- Reward popup.
- Dialogue praise.
- Extra delay or pause.

That full stack is reserved for rare, intentionally authored moments, not routine repair or safety completion.

## Preferred Payoff Hierarchy

1. **Tactile physical feedback**
   - Repair object changes state.
   - Wheel, chain, brake, or tire visibly behaves better.
   - This is preferred for repair success.

2. **Soft audio confirmation**
   - Low-volume, short, warm, and not bright.
   - Must leave space after the cue.

3. **Compact UI acknowledgment**
   - Short reward text.
   - No large motion, long hold, or dominant panel.

4. **Dialogue recognition**
   - Reserved for human relationship moments.
   - Should not repeat what the object and reward already communicated.

5. **Visual glint or sparkle**
   - Use rarely.
   - If used, it is the primary cue or a very soft secondary cue, not one of many effects.

## Repair-Specific Rules

- Repair success should prioritize physical clarity over celebration.
- Chain repair recommended primary cue: chain/bike state becomes seated and clean.
- Safety check recommended primary cue: inspected part settles into a ready state.
- Tire repair recommended primary cue: tire visibly reads inflated/ready.
- Reward UI should confirm consequence, not steal the moment.

## Quest Completion Rules

- If completion happens immediately after a tactile repair, the tactile repair is usually primary.
- If completion happens after dialogue, one short human acknowledgment may be primary.
- If completion unlocks or changes the world, a world-state change may be primary.
- Reward panels should be compact, warm, and secondary unless no physical/world cue exists.

## Secondary Cue Limits

Allowed secondary cues:

- One soft audio tick after a physical repair.
- One compact reward line after a physical repair.
- One short NPC line after a quiet world-state change.

Not allowed without approval:

- Audio stinger plus reward popup plus dialogue praise.
- Glint plus reward popup plus audio stinger.
- Any payoff cue that blocks player control longer than needed for comprehension.

## Approval Checklist For Stacked Payoff

A lane must answer yes to all before using more than one secondary cue:

- Is this a rare milestone rather than a routine action?
- Does each cue communicate different information?
- Does the scene still have silence or visual rest afterward?
- Does the payoff avoid covering the repair object or character?
- Has the integration lane approved the stack in `swarm/merge_queue.md` or a lane report?

## Integration Gate

If a lane cannot name the primary cue and the optional secondary cue, the payoff is not ready to merge.
