# Act 1 First Production Art Batch

Date: 2026-05-27

Purpose: define the first runtime-safe Aseprite-authored production batch needed to move Observed toward Expected.

## Required Batch

| Asset | Asset key | Current placeholder | Final path | Source path | Size target | Frames | Emotional role | Gameplay function | Acceptance criteria |
|---|---|---|---|---|---|---|---|---|---|
| Zuzu idle/walk | `placeholder.zuzu` -> `act1.zuzu` | Phaser geometry | `src/game/art/final/act1/zuzu.png` | `src/game/art/source/aseprite/act1/zuzu.aseprite` | 48x64-ish | idle + 4-way walk | Curious child protagonist | Player readability | Reads instantly against road/NPC rings; warm but not childish. |
| Zuzu bike/readiness | `act1.zuzu_bike` | none/current bike separate | `src/game/art/final/act1/zuzu_bike.png` | `src/game/art/source/aseprite/act1/zuzu_bike.aseprite` | 64x64-ish | idle/check pose | Bike adventure promise | Bike-check moment | Clearly connects Zuzu to bike repair fantasy. |
| Garage mentor | `act1.npc.garage_mentor` | tinted NPC | `src/game/art/final/act1/npc_garage_mentor.png` | `src/game/art/source/aseprite/act1/npc_garage_mentor.aseprite` | 48x64-ish | idle | Calm practical mentor | Dialogue/trust | Distinct silhouette; tool/mentor cue readable. |
| Neighbor NPC | `act1.npc.neighbor` | tinted NPC | `src/game/art/final/act1/npc_neighbor.png` | `src/game/art/source/aseprite/act1/npc_neighbor.aseprite` | 48x64-ish | idle | Warm local care | Wash/bridge concern | Reads as neighborly and memorable without caricature. |
| Spanish NPC/context | `act1.npc.spanish_neighbor` | same Mrs. Ramirez | `src/game/art/final/act1/npc_spanish_neighbor.png` | `src/game/art/source/aseprite/act1/npc_spanish_neighbor.aseprite` | 48x64-ish | idle/talk | Relationship-based language | Trust/language interaction | Same person or context variant; respectful and subtle. |
| Arabic mentor/family NPC | `act1.npc.arabic_mentor` | tinted NPC | `src/game/art/final/act1/npc_arabic_mentor.png` | `src/game/art/source/aseprite/act1/npc_arabic_mentor.aseprite` | 48x64-ish | idle/talk | Gentle family mentor | Language/trust | Human-authored cultural brief required before deep detail. |
| Trader/sign narrator | `act1.npc.trader_or_sign` | tool/sign placeholders | `src/game/art/final/act1/npc_trader_or_sign.png` | `src/game/art/source/aseprite/act1/npc_trader_or_sign.aseprite` | 48x64-ish | idle | Practical material helper | Material collection | Distinct role; no clutter. |
| Garage/workbench cluster | `act1.garage_workbench` | garage + repair station geometry | `src/game/art/final/act1/garage_workbench.png` | `src/game/art/source/aseprite/act1/garage_workbench.aseprite` | 192x128-ish | optional glow states | Creative heart/home base | Bike/repair/material hub | Feels safe, warm, iconic; not visually busy. |
| UTM rig | `act1.utm_rig` | simple rig geometry | `src/game/art/final/act1/utm_rig.png` | `src/game/art/source/aseprite/act1/utm_rig.aseprite` | 96x96-ish | idle/test/compress | Real tool, simplified | Material testing | Child understands press/test action from silhouette. |
| Material samples | `act1.material_samples` | tool/material table geometry | `src/game/art/final/act1/material_samples.png` | `src/game/art/source/aseprite/act1/material_samples.aseprite` | spritesheet 32x32 each | steel/copper/wood/scrap | Evidence objects | Inventory/testing | Each material visually distinct at small size. |
| Bridge broken | `act1.bridge_broken` | bridge placeholder | `src/game/art/final/act1/bridge_broken.png` | `src/game/art/source/aseprite/act1/bridge_broken.aseprite` | 192x96-ish | static | Act 1 problem | Bridge discovery | Clearly unsafe without looking scary. |
| Bridge repaired | `act1.bridge_repaired` | same bridge placeholder | `src/game/art/final/act1/bridge_repaired.png` | `src/game/art/source/aseprite/act1/bridge_repaired.aseprite` | 192x96-ish | optional sparkle/crossing | Emotional payoff | Crossing unlock | Before/after state obvious in screenshot. |
| Notebook frame/cards | `act1.notebook_ui` | text panel | `src/game/art/final/act1/notebook_ui.png` | `src/game/art/source/aseprite/act1/notebook_ui.aseprite` | scalable UI slices or 384x280 | tabs/cards | Treasured field journal | Evidence review | Looks like Zuzu owns it; supports readable text. |
| Ecology plant tokens | `act1.ecology_tokens` | plant placeholder | `src/game/art/final/act1/ecology_tokens.png` | `src/game/art/source/aseprite/act1/ecology_tokens.aseprite` | 32-64 each | mesquite/creosote/saguaro | Living desert | Observation | Plants read as habitat clues, not station icons. |
| Chemistry station | `act1.chemistry_station` | glassware placeholder | `src/game/art/final/act1/chemistry_station.png` | `src/game/art/source/aseprite/act1/chemistry_station.aseprite` | 96x80-ish | mix/dry/ready | Safe experiment | Sealant/recipe | Shows mixing/drying/useful output clearly. |
| Normal-play HUD | `act1.hud_frame` | text boxes | `src/game/art/final/act1/hud_frame.png` | `src/game/art/source/aseprite/act1/hud_frame.aseprite` | UI slice/small icons | normal/debug states | Child-facing guidance | HUD | Normal HUD feels warm and minimal; debug hidden by default. |
| Map gate marker | `act1.map_gate` | gate placeholder | `src/game/art/final/act1/map_gate.png` | `src/game/art/source/aseprite/act1/map_gate.aseprite` | 96x96-ish | locked/unlocked | Wider-world clue | Act 2 tease | Feels mysterious but restrained. |

## Integration Requirements

- Every final asset must have Aseprite source.
- Every runtime asset must be loaded through AssetRegistry.
- Placeholder fallback must remain.
- Generated concept references may inform but not become final art.
- Visual QA must compare placeholder/final captures.
- No scene should hardcode final asset filenames directly.

## Minimum First Runtime Integration

If time is constrained, integrate in this order:

1. Zuzu
2. NPC set
3. garage/workbench
4. bridge broken/repaired
5. notebook UI
6. UTM rig/material samples

This order maximizes child-facing impact before secondary environmental polish.
