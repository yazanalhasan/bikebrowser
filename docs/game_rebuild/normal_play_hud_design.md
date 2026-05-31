# Normal-Play HUD Design

Date: 2026-05-27

## Goal

The normal `/game-rebuild` HUD should feel like gentle child-facing guidance, not a developer dashboard.

The HUD should answer:

- Where am I emotionally in the adventure?
- What is the next useful thing to try?
- What clue did I just discover?
- How do I open my notebook?

It should not expose raw system state unless debug mode is enabled.

## Current Observed HUD

Current strengths:

- objective state is clear
- prompts are readable
- clue/evidence state is useful
- debug overlay is already hidden by default and toggled with F3

Current gaps:

- top-left objective panel still feels like a checklist
- bottom-right clue panel still feels like status/debug state
- notebook count language is improved but still text-first
- no child-facing audio/replay/accessibility affordance is visible
- normal HUD and playtest HUD are not fully separated

## Expected Normal HUD

Normal HUD should include:

- one short current story hint
- small notebook affordance
- most recent clue toast
- optional speech replay icon/control
- no raw trust counters
- no raw region count unless map is open
- no dense material/debug lists

Debug/playtest HUD should include:

- objective list
- trust counters
- material evidence state
- region count
- diagnostic text
- asset registry final/fallback status

## Proposed Layout

Normal play:

- Top-left: compact story hint, max 2 lines.
- Bottom-left: control hint, fades after early use if feasible.
- Top/right or notebook surface: field notebook button/label.
- Toast area: clue/event feedback.

Debug/playtest:

- F3 toggles developer overlay.
- Optional test hook can force debug HUD for screenshots.

## Child-Facing Copy Rules

Prefer:

- "Clues so far"
- "New field note"
- "Bridge needs proof"
- "Try testing this"
- "Open field notebook"

Avoid:

- raw objective ids
- raw counters as primary UI
- "validation"
- "state"
- "debug"
- "materialTests"
- "trust: neighbor 1"

## Done Criteria

- Normal HUD does not show raw trust/material/debug counters by default.
- Debug HUD is hidden by default and still accessible with F3.
- Playwright verifies default HUD does not include debug-only strings.
- Playwright verifies debug overlay can be toggled.
- Captures show world landmarks first, HUD second.

## Implemented In Phase 8

- Replaced the top-left objective checklist with a compact `Today's trail` story hint.
- Replaced the bottom-right raw evidence/trust readout with a `Current clue` panel.
- Removed raw trust counters from normal-play HUD.
- Kept debug overlay hidden by default and accessible via F3.
- Added Playwright coverage that verifies the default HUD is child-facing and debug is hidden.

## Still Missing

- In-game audio/replay/accessibility controls are not surfaced yet.
- Final HUD frame/icon art is not integrated.
- A future mode split should allow playtest screenshots to show raw diagnostic state without exposing that state in normal play.

## Implementation Notes

Keep this as a scene presentation concern only. Quest state and clue state stay in portable systems. HUD should read summaries from runtime state, not own progression logic.
