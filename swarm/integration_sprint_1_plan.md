# Integration Sprint 1 Plan

Generated: 2026-05-16

## Goal

Convert accumulated polish into authored restraint for the first playable slice: neighborhood spawn, Mrs. Ramirez safety check, Mr. Chen, garage chain repair, completion, and return.

## Sprint Rule

This sprint is reduction-first. No lane may add new content, new regions, new systems, new reward ceremony, or new decorative layers until the reduction pass is validated.

## Editorial Decision

Completion moments use one primary payoff cue and at most one secondary soft cue. Repair success prioritizes tactile physical feedback over UI spectacle.

## Exact Merge / Reduction Order

1. **Lane 9 docs and governance**
   - Merge first.
   - Purpose: establish payoff policy, garage reduction plan, lane pause/resume rules, and validation gates.
   - Runtime impact: none.

2. **Reward validation stabilization**
   - Merge before any visual/audio reward polish.
   - Purpose: resolve reward-intent assertion failures for `chain_repair` and `flat_tire_repair`.
   - Editorial constraint: do not improve reward ceremony in this step.
   - Sensitive files:
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\RewardBridge\RewardBridge.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\QuestRegistry\QuestRegistry.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\tests\vertical_slice_check.gd`

3. **Payoff cue reduction pass**
   - Apply `swarm/payoff_cue_policy.md`.
   - Choose the primary cue per completion moment before code changes.
   - Garage chain repair recommended cue: repair bike state change is primary; soft audio or compact reward text may be secondary, not both.

4. **Garage first-read reduction**
   - Apply `swarm/garage_reduction_plan.md`.
   - Reduce before adding: workbench contrast, duplicate warm pools, extra glints, ambient motion, reward effects, dialogue praise, and stingers.
   - Sensitive files:
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Regions\Garage\ZuzuGarage.tscn`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Data\layouts\garage.json`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Systems\Interactions\ChainHotspot.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Systems\Interactions\TireRepairStation.gd`

5. **UI/audio/NPC cadence harmonization**
   - Review as one combined pacing layer.
   - Do not merge UI, audio, and NPC changes independently if they all affect completion/dialogue timing.
   - Sensitive files:
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Systems\UI\HudController.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Regions\UI\Hud.tscn`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Regions\UI\DialogBox.tscn`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Core\AudioService\AudioService.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Systems\Interactions\NpcInteraction.gd`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Systems\Interactions\AnimatedNpcInteraction.gd`

6. **Neighborhood quiet-band protection**
   - Validate that the street still has decompression space.
   - Do not add new memory anchors or prompts.
   - Sensitive files:
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Regions\Neighborhood\NeighborhoodStreet.tscn`
     - `C:\Users\yazan\bikebrowser\BikeBrowserWorld\Data\layouts\neighborhood_street.json`

7. **Manual emotional playthrough**
   - Run after the technical checks pass.
   - Judge whether the game feels effortless, not heavily designed.

## Lane Pause / Continue Rules

- Pause: lane 3 additive garage staging, lane 4 storytelling additions, lane 8 new NPC lines, side-region expansion.
- Continue reduction-only: lane 2 foundation, lane 5 UI, lane 7 audio.
- Continue selectively: lane 1 bike readability only when it improves physical clarity without adding spectacle.
- Wait: lane 6 camera/game feel until visual hierarchy is stable.
- Continue governance: lane 9.

## High-Conflict Files

| File | Conflict Reason | Sprint Rule |
| --- | --- | --- |
| `BikeBrowserWorld\Regions\Garage\ZuzuGarage.tscn` | Central overworked scene; many lanes touch it | One integration owner at a time; reduction-first edits only. |
| `BikeBrowserWorld\Data\layouts\garage.json` | Static placement authority for garage | Any static position change must remain layout-driven. |
| `BikeBrowserWorld\Regions\Neighborhood\NeighborhoodStreet.tscn` | Foundation, storytelling, NPC, UI, and audio overlap | Protect quiet road band and traversal readability. |
| `BikeBrowserWorld\Data\layouts\neighborhood_street.json` | Static placement authority for neighborhood | No new anchors unless they replace or merge existing emphasis. |
| `BikeBrowserWorld\Systems\Interactions\ChainHotspot.gd` | Repair completion and tactile feedback | Must follow payoff cue policy. |
| `BikeBrowserWorld\Systems\Interactions\TireRepairStation.gd` | Prototype-energy source near stronger chain repair | Simplify or hold back; do not over-polish with UI spectacle. |
| `BikeBrowserWorld\Systems\Interactions\SafetyCheckStation.gd` | Safety completion cue and prompt cadence | Keep one clear cue and one soft support cue. |
| `BikeBrowserWorld\Systems\UI\HudController.gd` | Reward and prompt surface | Keep UI supportive, compact, and secondary. |
| `BikeBrowserWorld\Core\AudioService\AudioService.gd` | Stingers, silence windows, ambience | Mix reduction only unless validation requires a fix. |
| `BikeBrowserWorld\Systems\Interactions\NpcInteraction.gd` | Proximity lines and dialogue timing | Avoid filling quiet spaces with warmth narration. |
| `BikeBrowserWorld\Systems\Interactions\AnimatedNpcInteraction.gd` | Animated NPC cadence | Same pause rules as NPC interaction. |
| `BikeBrowserWorld\Core\RewardBridge\RewardBridge.gd` | Protected reward authority | Validation fixes only with integration review. |
| `BikeBrowserWorld\Core\QuestRegistry\QuestRegistry.gd` | Protected quest authority | Do not alter quest ownership casually. |
| `BikeBrowserWorld\Core\RuntimeValidator\RuntimeValidator.gd` | Protected validation authority | Do not change to hide failures. |

## Validation Commands

Run from `C:\Users\yazan\bikebrowser`.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd
```

Expected: runtime smoke passes; RuntimeValidator reports 0 errors.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
```

Expected: neighborhood scene loads without missing resources or script parse errors.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Garage/ZuzuGarage.tscn --quit-after 2
```

Expected: garage scene loads without missing resources or script parse errors.

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://tests/vertical_slice_check.gd
```

Expected before sprint completion: reward-intent assertions must be fixed or explicitly documented if still failing.

```powershell
npm run build
```

Expected: Vite build completes without introducing React/Electron regressions.

```powershell
npm run test:e2e:playthrough
```

Expected: browser-side playthrough smoke tests pass or failures are documented as unrelated to Godot integration.

## Manual Validation

Perform one native or rendered playthrough with audio enabled:

1. Start in neighborhood.
2. Approach Mrs. Ramirez and safety bike.
3. Complete safety check.
4. Talk to Mr. Chen.
5. Enter garage.
6. Complete chain repair.
7. Observe reward/completion.
8. Return to neighborhood.

Record:

- First thing seen in garage.
- Whether the repair bike remains the first read.
- Whether reward feels meaningful without ceremony.
- Whether audio leaves enough quiet.
- Whether NPC lines feel human rather than explanatory.
- Whether UI supports action without becoming the main experience.

## Success Criteria

- Reward validation is no longer the main prototype-energy source.
- Garage repair/workbench area has one clear first read.
- Completion moments follow the payoff cue policy.
- UI, audio, NPC, and visual cues do not all peak together.
- Neighborhood quiet road band still feels intentionally calm.
- No protected systems are changed except approved validation fixes.
- Every active lane updates its swarm report with what became quieter, softer, merged, removed, or intentionally preserved.
