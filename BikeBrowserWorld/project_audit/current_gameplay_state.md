# Current Gameplay State

## Current Boot

- Main scene: `res://Regions/Neighborhood/NeighborhoodStreet.tscn`.
- This means `Boot.tscn` is not the active startup scene.
- The player currently starts in the neighborhood hub when F5 runs the configured project.

## What Exists Now

| Scene | Node count | Common node types | Instanced scenes |
| --- | --- | --- | --- |
| Regions/Boot/Boot.tscn | 9 | Label:3, Button:2, Control:1, CenterContainer:1, Panel:1, VBoxContainer:1 |  |
| Regions/Desert/DesertTrail.tscn | 15 | Sprite2D:5, Polygon2D:2, CollisionShape2D:2, Node2D:1, Area2D:1, Label:1 |  |
| Regions/Garage/TireRepairStation.tscn | 11 | Polygon2D:4, CollisionShape2D:2, ColorRect:2, Area2D:1, Node2D:1, Label:1 |  |
| Regions/Garage/ZuzuGarage.tscn | 67 | Sprite2D:23, Polygon2D:18, Node2D:12, PointLight2D:3, CollisionShape2D:3, Area2D:2 |  |
| Regions/Mine/CopperMine.tscn | 14 | Sprite2D:4, Polygon2D:2, CollisionShape2D:2, Node2D:1, Area2D:1, Label:1 |  |
| Regions/NPCs/CharlieNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/ColeNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/DrMayaNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/JacobNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/JamesNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/MrChenNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/MrsRamirezNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/OldMinerPeteNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/RangerNitaNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/NPCs/ZevonNpc.tscn | 4 | Area2D:2, AnimatedSprite2D:1, CollisionShape2D:1 |  |
| Regions/Neighborhood/MrChen.tscn | 9 | Polygon2D:5, Label:2, Area2D:1, CollisionShape2D:1 |  |
| Regions/Neighborhood/NeighborhoodStreet.tscn | 96 | Polygon2D:40, Sprite2D:24, Label:10, Node2D:9, CollisionShape2D:5, Area2D:4 |  |
| Regions/River/SaltRiver.tscn | 15 | Sprite2D:5, Polygon2D:2, CollisionShape2D:2, Node2D:1, Area2D:1, Label:1 |  |
| Regions/SystemShowcase/RuntimeSystemsDemo.tscn | 1 | Control:1 |  |
| Regions/SystemShowcase/SystemShowcase.tscn | 1 | Control:1 |  |
| Regions/SystemShowcase/ToolHelpersDemo.tscn | 1 | Control:1 |  |
| Regions/SystemShowcase/UiComponentsDemo.tscn | 1 | Control:1 |  |
| Regions/UI/DialogBox.tscn | 9 | Button:3, Label:2, CanvasLayer:1, Panel:1, VBoxContainer:1, HBoxContainer:1 |  |
| Regions/UI/Hud.tscn | 7 | Label:3, Panel:2, CanvasLayer:1, VBoxContainer:1 |  |

## Implemented

- Player movement script and player-group based interactions.
- NPC interaction prompts and dialogue request flow.
- Region transitions between neighborhood, garage, copper mine, desert trail, and salt river.
- Core quest, reward, save, and audio autoloads.

## Partially Implemented

- Mission JSON exists beyond the quests registered in `QuestRegistry`.
- Educational data exists but is not all surfaced in gameplay.
- Generated Projects 1-20 are present, but many are demos/libraries rather than active gameplay systems.

## Placeholder / Dead Ends

- Some region visuals are still simple blockout geometry plus prop sprites.
- Some NPC/dialogue assets exist only as data or prefab scenes.
- Some generated autoloads are available but do not participate in the first gameplay loop.

## Verification Notes

A headless scene-load pass was saved to `project_audit/headless_scene_check.txt`. The checked major scenes loaded without script parse errors or missing-resource errors. This does not prove interaction/game feel quality, because movement, camera, audio, and dialogue timing still require manual native Godot playtesting.
