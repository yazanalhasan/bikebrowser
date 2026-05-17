# Godot Scene Reference

This document lists the current Godot scenes and their responsibilities.

## Boot

### `Regions/Boot/Boot.tscn`

Purpose:
- Title/start screen.
- Audio unlock entry point.
- Starts the Godot prototype.

Expected key nodes:
- `Boot`
- `Center`
- UI labels/buttons

Script:
- `Regions/Boot/Boot.gd`

## World Regions

### `Regions/Neighborhood/NeighborhoodStreet.tscn`

Purpose:
- Outdoor dusk neighborhood.
- Zuzu spawn.
- Garage entrance.
- NPC introductions and early quests.

Important nodes:
- `GroundPropLayer`
- `BehindPropLayer`
- `MidPropLayer`
- `ForegroundPropLayer`
- `GarageEntrance`
- `MrChen`
- `MrsRamirezNpc`
- `OldMinerPeteNpc`
- `RangerNitaNpc`
- `DrMayaNpc`
- `Player`
- `DialogBox`
- `Hud`

Script:
- `Systems/World/RegionScene.gd`

Layout:
- `Data/layouts/neighborhood_street.json`

### `Regions/Garage/ZuzuGarage.tscn`

Purpose:
- Indoor garage/workshop.
- Chain repair.
- Tire repair.
- Factory friend workshop staging.

Important nodes:
- `FloorLayer`
- `WallLayer`
- `PropLayer`
- `InteractableLayer`
- `LightingLayer`
- `NPCLayer`
- `ExitZone`
- `ChainHotspot`
- `TireRepairStation`
- `Player`
- `DialogBox`
- `Hud`

Script:
- `Systems/World/RegionScene.gd`

Layout:
- `Data/layouts/garage.json`

## NPC Scenes

### `Regions/NPCs/MrChenNpc.tscn`

Purpose:
- Chain repair mentor and early mechanical guide.

### `Regions/NPCs/MrsRamirezNpc.tscn`

Purpose:
- Bike safety, encouragement, neighborhood cycling mentor.

### `Regions/NPCs/OldMinerPeteNpc.tscn`

Purpose:
- Copper mine, rocks, ore, and mining safety mentor.

### `Regions/NPCs/RangerNitaNpc.tscn`

Purpose:
- Desert ecology and observation mentor.

### `Regions/NPCs/DrMayaNpc.tscn`

Purpose:
- Salt River biology and water observation mentor.

### `Regions/NPCs/ZevonNpc.tscn`

Purpose:
- Rubber, plant fiber, and flexible-material workshop friend.

### `Regions/NPCs/JacobNpc.tscn`

Purpose:
- Kiln, carbon, and heat-processing workshop friend.

### `Regions/NPCs/CharlieNpc.tscn`

Purpose:
- Electronics, wiring, and controller workshop friend.

### `Regions/NPCs/ColeNpc.tscn`

Purpose:
- Battery chemistry and clean-energy workshop friend.

### `Regions/NPCs/JamesNpc.tscn`

Purpose:
- Refinement, filtering, drying, and purification workshop friend.

## UI Scenes

### `Regions/UI/DialogBox.tscn`

Purpose:
- Dialogue display and progression.

### `Regions/UI/Hud.tscn`

Purpose:
- Quest, reward, and debug/prototype HUD layer.

## Repair Scenes

### `Regions/Garage/TireRepairStation.tscn`

Purpose:
- Flat tire repair prototype.

## Notes

- Scene positions should remain layout-driven through JSON files in `Data/layouts/`.
- NPC art may be production placeholder quality; replace SpriteFrames resources in each character folder as final art lands.
