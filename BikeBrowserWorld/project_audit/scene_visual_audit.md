# Scene-by-Scene Visual Audit

Screenshots were not captured in this automated pass because native Godot rendering requires the local editor/game window. This audit uses actual `.tscn` node trees and the current observed game screenshots from the session.

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

## Visual Findings

- IMPLEMENTED: The current neighborhood is no longer blank; it contains Zuzu, NPCs, props, and HUD text.
- PARTIALLY IMPLEMENTED: Mine, desert, river, garage, and showcase scenes exist as region scenes, but they need manual visual playtesting.
- PLACEHOLDER: Several scenes use ColorRect/Sprite2D blockout layers instead of cohesive tilemap/environment systems.
- RISK: Pixel density and scale vary across generated props, characters, and vector-derived garage assets.
- OPPORTUNITY: Formalize Background, Ground, PropsBack, NPCs, Player, PropsFront, Transitions, Camera, UI layers across all regions.

## Headless Scene Load Verification

`project_audit/headless_scene_check.txt` records a Godot headless load pass for the main neighborhood, garage, mine, desert, river, system showcase, HUD, and dialogue box scenes. No checked scene emitted a parse error or missing-resource error. Most one-shot headless launches emitted Godot shutdown warnings about ObjectDB/resources still in use; these should be treated as verification caveats until reproduced in the editor profiler, not as confirmed in-game failures.
