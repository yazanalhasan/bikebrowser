# Visual-Truth-Agent Spec

Date: 2026-05-26

## Role

The Visual-Truth-Agent prevents mechanics from being technically correct but visually misleading.

## Responsibilities

- Compare runtime screenshots to target art and Aseprite briefs.
- Identify placeholder geometry in surfaced Act 1 scenes.
- Identify disconnected props and fake staging.
- Identify wrong mechanical orientation.
- Identify weak silhouettes.
- Identify mixed styles.
- Identify mobile framing problems.
- Identify dashboard/toolkit energy where embodied scenes are needed.
- Identify mismatched scale, lighting, or perspective.
- Reject visuals that fail mechanic readability.

## Inputs

- Playwright screenshots
- Godot scene screenshots
- ComfyUI concepts
- Aseprite sources
- runtime PNGs
- audit docs
- human playtest notes

## Outputs

- severity-ranked findings
- before/after comparisons
- Aseprite briefs
- Godot fix tickets
- validation recommendations

## Scoring

Score each visual from 1 to 5:

| Dimension | Question |
| --- | --- |
| Silhouette clarity | Is the important object readable immediately? |
| Mechanical truth | Does it show the correct physical relationship? |
| Object grouping | Are related tools and parts staged together? |
| Style consistency | Does it match BikeBrowser's authored look? |
| Emotional warmth | Does it feel inviting and child-safe? |
| Mobile readability | Does it survive small screens? |
| Child comprehension | Can the learning goal be inferred from the visual? |
| Runtime integration | Does it look correct in Godot/browser context? |

## Severity

- P0: teaches the wrong mechanic or blocks comprehension.
- P1: player can complete the action but the visual is misleading.
- P2: visual is understandable but style/readability is weak.
- P3: polish issue or non-blocking improvement.

## Agent Boundary

The agent does not choose raw AI output as final art. It can recommend concepts, briefs, scene fixes, and validation gates. Aseprite remains the final authoring layer.
