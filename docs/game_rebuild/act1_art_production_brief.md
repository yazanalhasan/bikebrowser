# Act 1 Art Production Brief

Act 1 now has a clean placeholder substrate. Production art should replace placeholders through the generated-concept -> curated reference -> Aseprite-authored final pipeline. Generated art must not enter runtime directly.

## Production Asset Targets

| Asset | Runtime Key | Target Path | Function | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| Zuzu | `placeholder.zuzu` | `src/game/art/final/zuzu/` | Player avatar | Clear child silhouette, readable at mobile scale, simple adventure posture |
| Bike | `placeholder.bike` | `src/game/art/final/bike/` | Traversal and repair identity | Correct bike geometry, readable wheels/frame/chain, warm BMX tone |
| Garage | `placeholder.garage` | `src/game/art/final/garage/` | Home workbench hub | Inviting but uncluttered, clear workbench/repair affordance |
| Workbench | `placeholder.workbench` | `src/game/art/final/workbench/` | Planning surface | Deck/support/brace planning reads instantly |
| Mentor NPCs | `placeholder.npc` | `src/game/art/final/npcs/` | Social trust and guidance | Distinct silhouettes, respectful representation, no stereotype shorthand |
| Bridge | `placeholder.bridge` | `src/game/art/final/bridge/` | Construction problem | Broken/repaired states, visible deck/support/triangle logic |
| UTM Rig | `placeholder.utmRig` | `src/game/art/final/utm/` | Material testing tool | Looks like a simplified real testing machine, not a quiz box |
| Ecology Plants | `placeholder.ecologyPlant` | `src/game/art/final/ecology/` | Observation/foraging | Mesquite, creosote, saguaro, wash marker readable without clutter |
| Chemistry Station | `placeholder.chemistryStation` | `src/game/art/final/chemistry/` | Mix/dry/test loop | Safe handling visible, no lab-danger vibe |
| Notebook UI | `placeholder.notebook` | `src/game/art/final/notebook/` | Evidence memory | Child-readable field notebook tone |
| Map Gate | `placeholder.mapGate` | `src/game/art/final/map/` | First wider-world transition | Shows expanded route and systems-upgrade clue without overpromising Act 2 |
| Quest Markers | `placeholder.questMarker` | `src/game/art/final/ui/` | Interaction guidance | Low-clutter, warm, legible against dusk background |

## Aseprite Requirements

- Final runtime sprites require `.aseprite` source files.
- Exported PNG names should be stable and referenced through `AssetRegistry`.
- Sprite dimensions should be defined before integration.
- Animation frames should be simple and purposeful.

## Rejection Criteria

- AI output copied directly into runtime.
- Malformed bicycle or bridge mechanics.
- Cluttered dashboard UI energy.
- Cultural caricature or decorative language use.
- Assets that read only in desktop screenshots but fail at mobile scale.
