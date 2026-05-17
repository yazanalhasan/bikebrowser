# Neighborhood Surface Replacement Report

Date: 2026-05-15

## Summary

The neighborhood foundation has been moved from flat polygon surfaces toward a layered handcrafted dusk environment. The pass replaces the visual role of flat road, sidewalk, driveway, yard, sky, and house polygons with imported PNG plates and reusable tile-kit pieces. Runtime architecture and gameplay systems were not changed.

## Replaced Polygon Surfaces

| Old Node | Replacement |
|---|---|
| `Background` | `GroundArtLayer/DuskMountainsPanel` plus `GroundArtLayer/YardGroundPanel` |
| `MapFrame` | `GroundArtLayer/YardGroundPanel` |
| `TopGrass` | `GroundArtLayer/YardGroundPanel` |
| `BottomGrass` | `GroundArtLayer/YardGroundPanel` |
| `Road` | `GroundArtLayer/RoadPanel` with `neighborhood_road_panel_v2.png` |
| `TopSidewalk` | `GroundArtLayer/TopSidewalkPanel` |
| `BottomSidewalk` | `GroundArtLayer/BottomSidewalkPanel` |
| `Sidewalk` | `GroundArtLayer/TopSidewalkPanel` |
| `Driveway` | `GroundArtLayer/DrivewayPanel` |
| `RoadLineA-D` | Painted lane markings inside `neighborhood_road_panel_v2.png` |
| `RamirezHouse` + `RamirezHouseRoof` | `HouseLayer/RamirezHouseFacade` |
| `WorkshopHouse` + `WorkshopHouseRoof` | `HouseLayer/WorkshopHouseFacade` |
| `ZuzuHouseRoof` | `HouseLayer/ZuzuHouseFacade` |
| `PorchGlow` | Warm window/porch glow baked into facade sprites |
| `SkyBand` | Dusk gradient in `neighborhood_dusk_mountains_panel.png` |
| `Fence/FenceRail` and posts | Existing sprite fence segments remain primary visual |
| `DesertPlants/*` primitive cacti/rocks | Existing generated plant and rock sprites remain primary visual |
| `TireTracks/*` | Subtle tire scuffs baked into road and driveway textures |

## Road Pass

Added a cohesive asphalt kit with:

- Straight asphalt tile.
- Lane stripe tile.
- Road edge curb tiles.
- Driveway intersection tile.
- Soft road shadow overlay.
- Three asphalt variation tiles.

The live scene uses the sliced `neighborhood_road_panel_v2.png`, which combines subtle asphalt noise, cracks, tire scuffs, readable lane dashes, and curb shading. The palette stays close to `#28323a` and `#343d43` with blue-purple shadowing.

## Sidewalk And Curb Pass

Added sidewalk and curb pieces with:

- Warm sun-worn concrete.
- Expansion seams.
- Top and bottom curb bevels.
- Corner transition.
- Driveway cut.
- Seam variation.

The live scene now uses separate top and bottom sidewalk panels so curb shadowing reads consistently against the road.

## Driveway Pass

Added `neighborhood_driveway_panel_v2.png` and reusable driveway tiles. The driveway now includes:

- Concrete texture.
- Slab seam lines.
- Soft garage-light spill.
- Edge wear.
- Subtle tire marks.

## House Facade Pass

Added full facade sprites for:

- Zuzu house.
- Ramirez house.
- Workshop / garage house.

Also added modular components for later expansion:

- Wall facade.
- Roof section.
- Warm window.
- Front door.
- Porch light.
- Trim.
- Garage door.
- Shadow piece.

The facades use warm windows and porch glow to support the emotional read of a cozy lived-in neighborhood at dusk.

## Yard And Ground Cohesion

The new yard panel adds:

- Grass/desert texture variation.
- Soft dirt transitions around traversal bands.
- Warmer lower-yard tint.
- Low-contrast grounding noise for plants, fence, mailbox, and road edges.

This helps existing props feel placed into a shared world instead of floating over color blocks.

## Depth And Atmosphere

Added `neighborhood_dusk_mountains_panel.png` with:

- Dusk gradient.
- Distant mountain silhouettes.
- Soft blue-purple lower atmospheric band.

This is static and lightweight; no parallax system or particles were added.

## Readability Notes

- Road and sidewalk bands still clearly guide horizontal traversal.
- NPCs and player remain above the foundation layers.
- The driveway still points naturally to the garage entrance.
- Curb bevels and road shadows improve depth perception without cluttering interactables.

## Screenshot / Preview

Headless viewport screenshots are unreliable in this setup, so a generated contact-sheet preview was saved:

- `project_audit/foundation_environment_preview.png`

## Remaining Follow-Up

- Replace persistent world labels with diegetic signs/nameplates in a UI/signage pass.
- Replace `BikeRamp` polygon prop in a future prop pass.
- Replace `SafetyCheckStation/Glow` polygon in the safety-station visual pass.
- Consider a later hand-painted full-scene background plate if the tile panels still feel too modular after editor review.

