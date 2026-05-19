# Act 1 Asset Replacement Log

Date: 2026-05-18
Owner: Art-Polish-Agent

## Replacement / Polish Changes Made

| File | Change | Reason | Safety notes |
| --- | --- | --- | --- |
| `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn` | Added `RepairPropLayer` with existing `inner_tube.png`, `floor_air_pump.png`, and `tire_patch_kit.png` sprites. | The tire rig was the clearest small placeholder-style Act 1 visual: polygon wheel plus ColorRect pressure UI without nearby Aseprite-consistent repair tools. | Cosmetic scene-only change. Existing scripted NodePaths, wheel node, leak marker, patch, pressure bar, and readiness label were preserved. No mission flow or Act 2 content touched. |

## Replacements Deferred

| Surface | Deferred replacement | Reason |
| --- | --- | --- |
| Workshop first build station | Dedicated Aseprite-style workshop build station or compact bench vignette. | Current station is generic mat/beacon/label. Existing scene is actively edited by others, so I did not risk a broader station scene rewrite. |
| Plant observation station | Field notebook, sample bag, binoculars, or plant-observation mat visual cluster. | Desert scene has good props and NPC art, but the station itself is generic. Needs domain-specific station art, not just moving existing plants. |
| Water quality station | Test strip, sample jar, tray, clipboard, and comparison chart cluster. | Salt River has good props; station affordance remains generic. Needs a composed station asset or isolated scene pass. |
| Copper evidence station | Conductivity tester, wire spool, ore sample table, and copper-stain evidence cluster. | Mine has strong location props but generic station affordance. A safe replacement should preserve quest station script and collision. |
| Bridge review / celebration | Visible bridge problem/repair/triangle-force visual anchor. | No dedicated bridge art surfaced in the inspected canonical scenes. Needs design decision on whether the bridge is condensed into review or visually present in neighborhood. |
| Act 1 capstone reward | Regional travel sketchbook and spacecraft clue card reward art. | Current capstone appears text/station driven. Needs reward visuals without adding Act 2 route content. |

## Validation

- Ran `godot --headless --path BikeBrowserWorld --quit`.
- Result: project opened and quit with the existing Godot resource-leak warning at exit; no scene parse failure was reported.
- Ran referenced resource check across `.tscn` and `.tres`; no missing `res://` resources found.

