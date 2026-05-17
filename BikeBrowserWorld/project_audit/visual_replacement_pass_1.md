# Visual Replacement Pass 1

Generated: 2026-05-15

## Goal

Replace the worst visible placeholders from the first vertical slice without changing runtime architecture or expanding gameplay scope.

Reference docs used:

- `res://project_audit/visual_placeholder_masterplan.md`
- `res://project_audit/art_direction_rules.md`
- `res://project_audit/bike_sprite_generation_prompts.md`

## Replaced / Improved

### 1. Safety Check Bike

Scene:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

Old visual:

- `SafetyCheckStation/BikeVisual/Frame`
- `SafetyCheckStation/BikeVisual/Wheel/WheelA`
- `SafetyCheckStation/BikeVisual/Wheel/WheelB`
- `SafetyCheckStation/BikeVisual/Brake`
- `SafetyCheckStation/BikeVisual/Chain`

These were Polygon2D programmer-art shapes.

New assets:

- `res://Assets/Props/Bike/small_safety_check_bike.png`
- `res://Assets/Props/Bike/small_safety_check_bike_brakes_overlay.png`
- `res://Assets/Props/Bike/small_safety_check_bike_tires_overlay.png`
- `res://Assets/Props/Bike/small_safety_check_bike_chain_overlay.png`

Runtime behavior:

- `SafetyCheckStation.gd` now pulses the relevant soft overlay for brakes, tires, or chain.
- Old polygon bike parts remain in the scene but are hidden, so references are safe and the fake bike is no longer visible.

### 2. Garage Chain Repair Bike

Scene:

- `res://Regions/Garage/ZuzuGarage.tscn`

Old visual:

- Separate `LooseChainProp`
- Separate `BikeWheelRepairProp`
- Standalone repair stand/primitive staging

New assets:

- `res://Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png`
- `res://Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png`
- `res://Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png`

Runtime behavior:

- `ChainHotspot.gd` now swaps the repair bike sprite state as the player advances:
  - slipped chain
  - aligned chain
  - seated chain
- The old unrelated chain and wheel stand-ins are hidden.
- The repair stand is now the visual centerpiece of the garage interaction.

### 3. Debug-Like Markers

Scene:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

Hidden:

- `GarageMarker`
- `ChainHotspotMarker`

Replacement cue:

- `res://Assets/Props/Bike/warm_repair_glint.png`

This gives the garage/repair affordance a diegetic sparkle rather than a translucent debug rectangle.

### 4. Road / Sidewalk / Driveway Foundation

Scene:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

Old visual:

- Flat road polygon
- Flat sidewalk polygons
- Rectangular lane dashes
- Flat driveway polygon

New/active panel assets:

- `res://Assets/Backgrounds/Derived/neighborhood_road_panel_v2.png`
- `res://Assets/Backgrounds/Derived/neighborhood_top_sidewalk_panel_v2.png`
- `res://Assets/Backgrounds/Derived/neighborhood_bottom_sidewalk_panel_v2.png`
- `res://Assets/Backgrounds/Derived/neighborhood_driveway_panel_v2.png`
- `res://Assets/Backgrounds/Derived/neighborhood_yard_ground_panel_v2.png`
- `res://Assets/Backgrounds/Derived/neighborhood_dusk_mountains_panel.png`

Old flat polygons are hidden. The street base now uses textured panels instead of exposed color blocks.

### 5. House Facades

Scene:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`

Old visual:

- Flat house rectangles and triangle roofs.

New assets:

- `res://Assets/Props/Neighborhood/Houses/zuzu_house_facade.png`
- `res://Assets/Props/Neighborhood/Houses/ramirez_house_facade.png`
- `res://Assets/Props/Neighborhood/Houses/chen_workshop_facade.png`

Old polygon house bodies/roofs are hidden. The neighborhood now reads more like a street with real homes/workshop frontage.

### 6. Garage Cohesion

Scene:

- `res://Regions/Garage/ZuzuGarage.tscn`

Changed:

- Replaced visible garage floor/wall art with imported panel textures:
  - `res://Assets/Backgrounds/Derived/garage_floor_panel.png`
  - `res://Assets/Backgrounds/Derived/garage_wall_panel.png`
- Hid old primitive garage scaffolding:
  - `Floor`
  - `Workbench`
  - `BikeStand`
  - `WarmLight`
  - `ToolShadow`
  - `ToolWall/*`
  - `CozyRug`
  - `BikeNotes/*`
- Hid duplicate SVG/vector-feeling garage props where PNG props and the new repair bike now carry the visual read.

### 7. Grounding Shadows

Added soft blue-purple shadow sprites under:

- Player
- Mrs. Ramirez
- Mr. Chen
- Garage NPCs
- Safety bike
- Garage repair bike

Assets:

- `res://Assets/Backgrounds/Derived/soft_shadow_small.png`
- `res://Assets/Backgrounds/Derived/soft_shadow_medium.png`
- `res://Assets/Backgrounds/Derived/soft_shadow_large.png`

## Files Changed

Scenes:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`
- `res://Regions/Garage/ZuzuGarage.tscn`

Scripts:

- `res://Systems/Interactions/SafetyCheckStation.gd`
- `res://Systems/Interactions/ChainHotspot.gd`

Layouts:

- `res://Data/layouts/neighborhood_street.json`
- `res://Data/layouts/garage.json`

New visual assets:

- `res://Assets/Props/Bike/*.png`
- `res://Assets/Backgrounds/Derived/*.png`
- `res://Assets/Props/Neighborhood/Houses/chen_workshop_facade.png`

## Validation

Imported assets with:

```powershell
godot --headless --editor --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit
```

Validated scenes with:

```powershell
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Neighborhood/NeighborhoodStreet.tscn --quit-after 2
godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld res://Regions/Garage/ZuzuGarage.tscn --quit-after 2
```

Result:

- No parse errors.
- No missing texture/resource errors.
- RuntimeValidator: 0 errors, 1 warning.
- QuestRegistry loaded 18 missions.
- Dialogue files normalized: 21.
- Audio mappings: 7/7.

Known validation caveat:

- Godot headless still prints a shutdown resource warning. This existed before this pass and did not block scene loading.
- Native TTS remains unavailable in the headless environment.

## Remaining Visual Placeholders

These are still visible or likely visible and should be handled in later passes:

1. Interaction prompts are still raw labels.
2. HUD/dialogue panels still need full visual skinning.
3. Some primitive decorative elements remain hidden rather than deleted.
4. Side areas still contain flat Polygon2D ground foundations.
5. Tire repair station still uses Polygon2D/ColorRect prototype art.
6. Some older generated visual assets may still vary in pixel density.
7. Manual in-editor visual review is still required for exact scale and overlap.

## Pass Result

The largest immersion killers in the current vertical slice have been replaced or hidden:

- Fake safety bike removed from view.
- Chain repair now has a believable BMX repair stand.
- Road/sidewalk/driveway no longer present as plain flat polygons.
- House facades are now sprite-based.
- Garage primitive scaffolding is hidden behind cohesive panels/props.
- Main characters and important interactables have softer grounding.

