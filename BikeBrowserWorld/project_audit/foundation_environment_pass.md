# Foundation Environment Pass

Date: 2026-05-15

Scope: `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

This pass replaced the visible flat programmer-world foundations for the neighborhood scene: road, sidewalks, driveway, yard base, sky/mountain depth, curb shadows, and primitive house facades. It did not modify quest flow, runtime autoloads, dialogue systems, save logic, event bus behavior, audio logic, or interaction systems.

## Reference Rules Applied

- Warm Sonoran dusk palette from `project_audit/art_direction_rules.md`.
- Upper-left warm light with blue-purple shadows falling down-right.
- SNES/GBA readability with low-noise texture and clear traversal bands.
- Reusable lightweight PNG pieces instead of large unoptimized atlases.
- Static placement kept in `Data/layouts/neighborhood_street.json`.

## Current Foundation Geometry Audit

The following old foundation nodes were identified in `NeighborhoodStreet.tscn` before replacement:

- `Background`
- `MapFrame`
- `TopGrass`
- `BottomGrass`
- `Road`
- `TopSidewalk`
- `BottomSidewalk`
- `Sidewalk`
- `Driveway`
- `RoadLineA`
- `RoadLineB`
- `RoadLineC`
- `RoadLineD`
- `RamirezHouse`
- `WorkshopHouse`
- `ZuzuHouseRoof`
- `RamirezHouseRoof`
- `WorkshopHouseRoof`
- `PorchGlow`
- `SkyBand`
- `Fence/FenceRail`
- `Fence/FencePostA`
- `Fence/FencePostB`
- `Fence/FencePostC`
- `DesertPlants/CactusA`
- `DesertPlants/CactusArmA`
- `DesertPlants/CactusB`
- `DesertPlants/DesertRockA`
- `DesertPlants/DesertRockB`
- `TireTracks/TrackA`
- `TireTracks/TrackB`

## New Foundation Assets

Scene plates:

- `Assets/Backgrounds/Derived/neighborhood_dusk_mountains_panel.png`
- `Assets/Backgrounds/Derived/neighborhood_yard_ground_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_road_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_top_sidewalk_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_bottom_sidewalk_panel_v2.png`
- `Assets/Backgrounds/Derived/neighborhood_driveway_panel_v2.png`

Reusable tile kit:

- `Assets/Backgrounds/Derived/NeighborhoodFoundation/asphalt_straight_tile.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/asphalt_lane_stripe_tile.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/asphalt_variation_1.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/asphalt_variation_2.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/asphalt_variation_3.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/road_edge_top_curb_tile.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/road_edge_bottom_curb_tile.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/soft_road_shadow_overlay.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/sidewalk_tile_bottom_curb.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/sidewalk_tile_top_curb.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/sidewalk_seam_variation.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/sidewalk_corner_transition.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/sidewalk_driveway_cut.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/driveway_concrete_texture.png`
- `Assets/Backgrounds/Derived/NeighborhoodFoundation/driveway_intersection_tile.png`

House facade kit:

- `Assets/Props/Neighborhood/Houses/zuzu_house_facade.png`
- `Assets/Props/Neighborhood/Houses/ramirez_house_facade.png`
- `Assets/Props/Neighborhood/Houses/workshop_house_facade.png`
- `Assets/Props/Neighborhood/Houses/wall_facade_piece.png`
- `Assets/Props/Neighborhood/Houses/roof_section_piece.png`
- `Assets/Props/Neighborhood/Houses/warm_window_piece.png`
- `Assets/Props/Neighborhood/Houses/front_door_piece.png`
- `Assets/Props/Neighborhood/Houses/garage_door_piece.png`
- `Assets/Props/Neighborhood/Houses/trim_piece.png`
- `Assets/Props/Neighborhood/Houses/porch_light_piece.png`
- `Assets/Props/Neighborhood/Houses/house_shadow_piece.png`

Preview contact sheet:

- `project_audit/foundation_environment_preview.png`

## Scene Changes

Added `GroundArtLayer` sprite children:

- `DuskMountainsPanel`
- `YardGroundPanel`
- `RoadShadowOverlay`

Updated existing surface sprite references:

- `GroundArtLayer/RoadPanel` now uses `neighborhood_road_panel_v2.png`.
- `GroundArtLayer/TopSidewalkPanel` now uses `neighborhood_top_sidewalk_panel_v2.png`.
- `GroundArtLayer/BottomSidewalkPanel` now uses `neighborhood_bottom_sidewalk_panel_v2.png`.
- `GroundArtLayer/DrivewayPanel` now uses `neighborhood_driveway_panel_v2.png`.

Added `HouseLayer` sprite children:

- `HouseLayer/ZuzuHouseFacade`
- `HouseLayer/RamirezHouseFacade`
- `HouseLayer/WorkshopHouseFacade`

Hid obsolete visible primitive geometry:

- Background/map/grass base polygons.
- House body/roof polygons and polygon porch glow.
- Fence stand-in polygons now covered by existing fence sprites.
- Desert plant/rock stand-in polygons now covered by existing plant/rock sprites.
- Flat tire track polygons now represented in road/yard surface texture.

## Cohesion Improvements

- Road now has subdued asphalt variation, curb edge shading, tire scuffs, small cracks, and readable lane markings.
- Sidewalks now include expansion seams, warm sun-worn concrete texture, and curb bevels.
- Driveway now has slab seams, tire arcs, edge wear, and warm garage-light spill.
- Houses now read as lived-in dusk facades with roofs, trim, doors, windows, porch light glow, and soft ground shadows.
- Yard panel adds grass/desert transition noise and soft dirt edges around the traversal bands.
- Mountain/sky plate adds distant environmental depth without introducing parallax or heavy runtime systems.

## Remaining Flat Geometry

The following visible or potentially visible non-foundation items remain for later workstreams:

- Persistent text labels such as `ZuzuHouseLabel`, `RamirezHouseLabel`, `WorkshopLabel`, `NeighborhoodLabel`, `MrChenLabel`, and `MrsRamirezLabel`.
- `SafetyCheckStation/Glow`, a polygon interaction glow retained because the safety station is outside this foundation scope.
- `BikeRamp/RampDeck` and `BikeRamp/RampSide`, retained as a prop/gameplay affordance for a later prop pass.
- Hidden player fallback polygons remain hidden and were not touched in this foundation-only pass.

## Validation

Commands run:

```text
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --import
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd
```

Results:

- RuntimeValidator: 0 errors, 1 warning.
- QuestRegistry: 18 missions loaded, 0 quest validation errors, 0 warnings.
- Runtime smoke: PASS.
- Neighborhood scene: loaded with no missing texture parse errors after import.
- Known caveat: Godot still prints the existing shutdown ObjectDB/resource warning on headless one-shot runs.

