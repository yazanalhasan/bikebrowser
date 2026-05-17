# Before / After Visual Notes

Generated: 2026-05-15

Automated screenshots could not be captured from Godot headless because the renderer uses a dummy viewport in this environment. Use this document as a visual review guide for manual Godot testing.

## Neighborhood

### Before

- Flat purple/brown map frame and flat road.
- Rectangular road lane dashes.
- Flat house polygons with triangle roofs.
- Persistent text labels over houses and NPCs.
- Safety bike built from Polygon2D geometry.
- Debug-like garage/chain markers.

### After

- Textured road, sidewalk, driveway, yard, and mountain panels.
- Sprite-based house facades for Zuzu's house, Mrs. Ramirez's house, and Mr. Chen's workshop.
- Safety-check station uses a cohesive BMX sprite.
- Brake/tire/chain focus is shown with soft amber-green overlays.
- Persistent house/NPC labels are hidden.
- Debug-like markers are hidden and replaced with a warm repair glint.
- Player/NPCs/interactables have soft grounding shadows.

### Manual Review Checklist

1. Confirm the three house facades fit the street and do not overlap NPCs.
2. Confirm the road panel scale feels like a road, not a stretched texture.
3. Confirm the safety bike is visible and not too large.
4. Confirm the brake/tire/chain overlays pulse gently and do not look neon.
5. Confirm hidden labels do not remove necessary guidance.
6. Confirm garage entrance remains understandable without the old rectangle.

## Garage

### Before

- Mixed SVG kit art, generated PNG props, and many Polygon2D primitives.
- Chain repair used a loose chain and separate wheel instead of a complete bike drivetrain.
- Repair stand did not clearly show slipped/aligned/fixed chain states.
- Hard-edged primitive light and shadow shapes competed with the warm workshop mood.

### After

- Garage floor and wall use imported panel textures.
- Primitive workbench/stand/light/tool-wall/rug/note shapes are hidden.
- New repair-stand BMX sprite shows slipped, aligned, and repaired chain states.
- The old loose chain and wheel stand-ins are hidden.
- Repair glint and soft grounding shadow help the station read as important without debug geometry.
- Garage NPCs and player have soft shadows.

### Manual Review Checklist

1. Confirm the repair bike is the visual centerpiece.
2. Confirm the three chain states change during the hotspot interaction.
3. Confirm hidden stand/chain/wheel placeholders are not visible.
4. Confirm the new bike is not too large for the garage.
5. Confirm the garage still feels warm after hiding primitive light shapes.
6. Confirm the exit prompt and chain prompt remain readable.

## Asset Sources

Generated and processed bike assets:

- `res://Assets/Props/Bike/small_safety_check_bike.png`
- `res://Assets/Props/Bike/small_safety_check_bike_brakes_overlay.png`
- `res://Assets/Props/Bike/small_safety_check_bike_tires_overlay.png`
- `res://Assets/Props/Bike/small_safety_check_bike_chain_overlay.png`
- `res://Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png`
- `res://Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png`
- `res://Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png`

Generated and processed house assets:

- `res://Assets/Props/Neighborhood/Houses/zuzu_house_facade.png`
- `res://Assets/Props/Neighborhood/Houses/ramirez_house_facade.png`
- `res://Assets/Props/Neighborhood/Houses/chen_workshop_facade.png`

Derived panel/shadow assets:

- `res://Assets/Backgrounds/Derived/garage_floor_panel.png`
- `res://Assets/Backgrounds/Derived/garage_wall_panel.png`
- `res://Assets/Backgrounds/Derived/soft_shadow_small.png`
- `res://Assets/Backgrounds/Derived/soft_shadow_medium.png`
- `res://Assets/Backgrounds/Derived/soft_shadow_large.png`

## Remaining Before/After Targets

Next visual passes should compare:

1. Raw label prompts vs prompt bubble UI.
2. Current HUD/dialogue panels vs fully skinned UI.
3. Tire repair prototype art vs proper tire repair close-up.
4. Side area flat terrain vs textured region foundations.
5. Current mixed-density prop set vs final cohesive sprite family.

