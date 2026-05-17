# Visual Placeholder Masterplan

Generated: 2026-05-15

## Audit Method

Inspected the playable vertical slice and reachable region scenes by scanning:

- `res://Regions/Neighborhood/NeighborhoodStreet.tscn`
- `res://Regions/Garage/ZuzuGarage.tscn`
- `res://Regions/Garage/TireRepairStation.tscn`
- `res://Regions/Desert/DesertTrail.tscn`
- `res://Regions/Mine/CopperMine.tscn`
- `res://Regions/River/SaltRiver.tscn`
- `res://Regions/UI/Hud.tscn`
- `res://Regions/UI/DialogBox.tscn`
- NPC scenes under `res://Regions/NPCs/`

Automated screenshot capture was attempted, but Godot headless used the dummy renderer and returned a null viewport texture. This dossier is therefore based on scene inspection, file references, and the current playable screenshots shown during testing.

## Section 1 — Immersion Breakers

These are Type A issues: replace immediately before the slice is judged visually.

| Priority | Scene | Node path | Current form | Why it breaks immersion | Replacement needed |
|---|---|---|---|---|---|
| P1 | `NeighborhoodStreet.tscn` | `SafetyCheckStation/BikeVisual/*` | Polygon2D bike made from frame, wheel, brake, chain primitives | The first educational interaction is about bike safety, but the bike reads as programmer geometry instead of a real tactile object. | Handcrafted small safety-check BMX sprite, 3/4 side view, readable brakes, tires, chain, and frame. Needs optional highlighted overlays for brake/tire/chain steps. |
| P1 | `ZuzuGarage.tscn` | `ChainHotspot` + `InteractableLayer/LooseChainProp` + `BikeWheelRepairProp` | Separate loose chain and wheel props, no complete bike assembly | The core repair fantasy is missing the object being repaired. The player fixes a chain without seeing a believable bike drivetrain. | Repair-stand BMX assembly with rear wheel, crank, chainring, rear sprocket, slipped-chain state, aligned-chain state, and final seated-chain state. |
| P1 | `ZuzuGarage.tscn` | `Background`, `Floor`, `Workbench`, `BikeStand`, `WarmLight`, `ToolShadow`, `ToolWall/*`, `CozyRug`, `BikeNotes/*` | Polygon2D primitives layered over/alongside real PNG/SVG props | The garage is emotionally central, but the primitive shapes compete with the nicer generated garage props and feel like debug scaffolding. | Replace with cohesive garage background plate and prop sprites. Keep PNG props; remove duplicate primitive overlays once art exists. |
| P1 | `NeighborhoodStreet.tscn` | `Background`, `MapFrame`, `TopGrass`, `BottomGrass`, `Road`, `TopSidewalk`, `BottomSidewalk`, `Sidewalk`, `Driveway` | Large flat Polygon2D color blocks | The world still reads as a map mockup. The road/grass/sidewalk are flat and lack tile detail, shadows, curb bevels, cracks, and environmental warmth. | Tiled or sliced neighborhood ground art: asphalt road tile, curb/sidewalk tile, driveway slab, grass/desert yard texture, dusk shadow overlays. |
| P1 | `NeighborhoodStreet.tscn` | `GarageMarker`, `ChainHotspotMarker` | Flat translucent rectangles | These look like debug interaction markers. They call attention to implementation instead of world affordances. | In-world affordances: garage threshold mat/light spill; small repair sign, glint, or tool sparkle near interactable object. |
| P1 | `NeighborhoodStreet.tscn` | `Player/Body`, `Player/Head`, `Player/Cap`, `Player/Backpack`, `Player/Shadow` fallback polygons | Polygon fallback player body remains in scene alongside animated sprite | If the sprite fails or layers show through, Zuzu turns into primitive geometry. Even hidden/fallback primitives are a future visual risk. | Confirm sprite always displays; replace fallback geometry with proper low-detail silhouette or remove visual fallback once player asset is stable. |
| P1 | `ZuzuGarage.tscn` | `Player/Body`, `Player/Head`, `Player/Cap`, `Player/Backpack`, `Player/Shadow` fallback polygons | Same fallback player geometry as neighborhood | Same risk in the emotional repair space. | Same as above. |
| P1 | `TireRepairStation.tscn` | `Tire`, `Rim`, `Tube`, `Patch`, `PressureBar`, `Fill` | Polygon2D tire and ColorRect gauge | Not currently in the main loop, but if reached it is visibly prototype UI/art. | Tire repair closeup sprite set: tire, tube, patch, pump gauge, pressure bar styled as physical gauge. |

## Section 2 — Bike Sprite Master List

These are the most important art needs because the game is about bikes and repair. All bike sprites should be BMX-inspired, tactile, warm, readable at gameplay scale, and slightly stylized.

| Sprite name | Purpose | Required angle | Animation needs | Interaction needs | Approx. size | Notes |
|---|---|---|---|---|---|---|
| `bmx_parked_fence_dusk.png` | Replace/upgrade `BikeByFence` | Side/3/4 side | Optional tiny idle sparkle | None | 96x64 | Must feel like Zuzu's neighborhood bike, not clipart. |
| `small_safety_check_bike.png` | Replace `SafetyCheckStation/BikeVisual` polygons | 3/4 side | Optional wheel turn frames | Brake/tire/chain highlight zones | 112x72 | First bike the player inspects. Needs clear brake levers, tire shape, chain line. |
| `small_safety_check_bike_brakes_highlight.png` | Safety step overlay | Same as safety bike | Pulse alpha | Shows brake area only | 112x72 | Warm amber/green highlight, not neon debug. |
| `small_safety_check_bike_tires_highlight.png` | Safety step overlay | Same | Pulse alpha | Shows tire pressure check | 112x72 | Should guide the eye to both tires. |
| `small_safety_check_bike_chain_highlight.png` | Safety step overlay | Same | Pulse alpha | Shows chain line | 112x72 | Must be readable at 720p. |
| `garage_repair_stand_bmx_slipped_chain.png` | Main chain repair object | 3/4 side, on stand | Idle wobble optional | Inspect chain | 160x112 | This is the highest priority replacement. |
| `garage_repair_stand_bmx_aligning_chain.png` | Chain align state | Same | Chain/hand ghost optional | Align chain step | 160x112 | Show chain near sprocket teeth. |
| `garage_repair_stand_bmx_seated_chain.png` | Fixed chain state | Same | Wheel rotation frames | Test rotation step | 160x112 | Success state should feel satisfying. |
| `chainring_closeup.png` | Educational close-up detail | Oblique close-up | Optional 3-frame rotation | Explain chain path | 96x96 | For later polish if minigame becomes more visual. |
| `rear_sprocket_closeup.png` | Educational close-up detail | Oblique close-up | Optional chain seating | Explain slipped chain | 96x96 | Should not be photo-realistic. |
| `rotating_crank_frames.png` | Repair animation strip | Side close-up | 6-8 frames | Rotate pedals | 128x64 strip | Use when replacing repeated Enter with tactile animation. |
| `garage_hanging_bike_frame.png` | Garage atmosphere | Side view | None | None | 96x64 | Adds BMX identity to garage wall. |
| `bike_rack_two_bikes.png` | Neighborhood atmosphere | 3/4 side | None | None | 128x80 | Good for street density later. |
| `broken_chain_floor_detail.png` | Repair clue prop | Top/3/4 | None | Optional sparkle | 48x32 | Replaces abstract loose chain if separate clue remains. |

## Section 3 — Garage Prop Master List

The garage is the emotional center. It should become a warm, safe, tactile workshop rather than a stack of primitive shapes.

| Prop | Current state | Needed replacement/style |
|---|---|---|
| Full garage wall/floor plate | Mix of SVG, PNG, and Polygon2D | One cohesive interior background plate with warm wall, concrete floor, soft shadows, corners, and dusk light spill. |
| Workbench | PNG exists plus Polygon2D duplicate | Use PNG or create upgraded sprite; remove primitive rectangle after replacement. Needs tools, wood grain, clutter silhouette. |
| Pegboard | PNG exists plus Polygon2D duplicate | Use one cohesive pegboard with wrench, screwdriver, chain tool silhouettes. |
| Repair stand | PNG exists, but not tied to complete bike | Upgrade with bike attached; current stand alone is not enough. |
| Loose chain | PNG exists | Keep as secondary detail, but core chain repair needs complete drivetrain. |
| Bike wheel repair prop | PNG exists | Good secondary prop; should not stand in for full chain repair object. |
| Warm light | Polygon and SVG/PNG glow mix | Use soft transparent glow sprite with dust motes, not a hard polygon. |
| Tool shadow | Polygon | Replace with soft painted shadow patch. |
| Notes/stickers | Polygon notes | Replace with small hand-drawn sticky notes and BMX stickers. |
| Rug | SVG/PNG plus polygon `CozyRug` | Use one asset. Current duplicates can create asset-family conflict. |
| Oil stains/grease marks | Mostly missing | Add subtle floor details near repair area. |
| Spare tires/tubes | PNG exists | Good; adjust scale and shadows to match player/NPC scale. |
| Hanging frame/wheels | Partial wheel prop exists | Add wall-hung BMX frame/wheel silhouettes for atmosphere. |

## Section 4 — Environmental Sprite Needs

### Neighborhood

| Need | Current state | Replacement direction |
|---|---|---|
| Road/asphalt | Flat Polygon2D `Road` | Tileable asphalt with dusk shading, small cracks, tire scuffs, painted lane marks. |
| Sidewalk/curb | Flat polygons | Curb segment sprites with edge bevel, expansion joints, warm rim light. |
| Driveway | Flat polygon | Driveway slab sprite with cracks, shadow gradient, garage light spill. |
| Houses | Polygon bodies/roofs | House facade sprites or modular house pieces with windows, porch, roof texture, lighted interiors. |
| Fence | PNG fence exists plus polygon fence fallback | Prefer PNG fence; remove primitive fence once all segments use sprite art. |
| Plants | PNG desert plants are acceptable | Add grounding shadows and consistent scale. |
| Mountains/sky | Mostly flat background | Distant mountain silhouette sprites and subtle dusk gradient. |
| Labels | Text labels over houses/NPCs | Replace with diegetic signs, mailbox names, porch details, or only show nameplates on interaction. |
| Transition edges | Prompt labels at invisible areas | Use visual paths/signs: mine trail sign, desert trail sign, river path marker. |

### Reachable Side Areas

| Scene | Placeholder issue | Replacement direction |
|---|---|---|
| `DesertTrail.tscn` | Background and trail are large flat polygons | Desert ground tile, dry wash path, footprints/tracks, depth layers. |
| `CopperMine.tscn` | Background/ground polygons with sparse sprites | Mine floor/wall tile, timber supports, rails, lantern pools, entrance shadows. |
| `SaltRiver.tscn` | Background and sandy bank polygons | Riverbank tile strips, water edge transitions, reeds, boardwalk shadow. |

## Section 5 — UI / HUD Visual Problems

| Severity | Surface | Current issue | Fix direction |
|---|---|---|---|
| Type B | `Hud.tscn` panel | Improved but still reads like a generic rectangular debug overlay | Add warm compact HUD frame using `Assets/UI/quest_tracker_panel.png` or a new cohesive panel skin. |
| Type B | Reward popup | Text-only reward box lacks celebratory iconography | Use badge icon, small coin/allowance icon, subtle sparkle animation. |
| Type B | Dialogue box | Functional panel/buttons; still generic UI | Use `Assets/UI/dialogue_box_bg.png`, portrait area, warm button style, typewriter pacing polish. |
| Type A/B | Interaction prompts | Raw labels over world objects | Replace with small keycap icon + diegetic prompt bubble, consistent with `Assets/UI/interaction_prompt_e.png`. |
| Type B | House/NPC labels | Persistent labels flatten the world | Move labels into hover/interaction nameplates, or replace house labels with physical signs. |

## Section 6 — Environmental Cohesion Findings

### Mismatched Asset Families

- Garage uses SVG environment kit assets, generated PNG props, and Polygon2D primitives in one scene.
- Neighborhood uses generated PNG props over large flat polygons.
- Player/NPCs use animated sprite assets, but fallback polygon bodies remain inside scenes.
- Some props are high-detail generated sprites while houses/roads are primitive flat shapes.

### Pixel Density Drift

- NPC/player sprites are comparatively detailed.
- Road/house/garage primitive geometry has infinite sharp edges and no pixel texture.
- Some generated props have painterly detail that does not match the simple vector-like world base.

### Shadow / Lighting Inconsistency

- Many sprites lack shared ground shadows.
- Polygon shadows are hard-edged.
- Dusk mood is established by color, but not consistently supported by cast shadows, rim light, or warm window/porch pools.

## Section 7 — Priority Order

### Priority 1 — Immersion Killers

1. Replace `SafetyCheckStation/BikeVisual` primitive bike with handcrafted safety-check bike sprite.
2. Replace chain repair staging with a complete repair-stand BMX and slipped/fixed chain states.
3. Remove or cover garage primitive Polygon2D objects once equivalent sprite art exists.
4. Replace main neighborhood road/sidewalk/driveway flat polygons with tile/sprite art.
5. Replace debug-looking `GarageMarker` and `ChainHotspotMarker` with diegetic visual affordances.

### Priority 2 — Gameplay Readability

1. Create consistent interaction prompt bubble/keycap style.
2. Add clear visual highlight overlays for brake/tire/chain safety steps.
3. Add chain path/sprocket readability to repair station.
4. Replace persistent labels with in-world signs/nameplates that appear contextually.

### Priority 3 — Atmosphere Upgrades

1. Create neighborhood house facade sprites.
2. Add dusk mountain silhouettes and sky gradient.
3. Add soft painted prop shadows.
4. Add garage clutter: oil stains, stickers, spare parts, hanging bike frame.
5. Add sidewalk cracks, tire marks, and driveway details.

### Priority 4 — Optional Polish

1. Animate porch light flicker with sprite glow frames.
2. Add drifting dust motes in garage and street.
3. Add small ambient wildlife silhouettes in side areas.
4. Add reward badge sparkle and icon animation.

## Section 8 — What Is Acceptable For Now

These can stay during the next pass:

- Generated neighborhood PNG props: saguaro, prickly pear, creosote, rock clusters, fence segments, mailbox, hydrant, street lamps.
- Existing NPC animated sprites.
- Existing music and reward stingers.
- Existing garage PNG props, as long as primitive duplicates are scheduled for removal/replacement.
- Basic HUD layout, provided it receives a cohesive skin later.

## Section 9 — Master TODO List

1. Generate/commission the bike sprite master list first.
2. Replace the safety station primitive bike in `NeighborhoodStreet.tscn`.
3. Replace the garage chain repair object in `ZuzuGarage.tscn`.
4. Create neighborhood road/sidewalk/driveway art kit.
5. Replace house primitives with facade sprites or modular house kit.
6. Replace prompt labels with prompt bubble UI.
7. Skin HUD and dialogue with coherent UI assets.
8. Add shared soft shadow sprites under player, NPCs, bikes, and props.
9. Remove or hide primitive fallback visuals after replacements are confirmed.
10. Repeat the audit after the first art replacement pass.

