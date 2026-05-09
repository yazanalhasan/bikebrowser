# Asset Generation Prompts

## Master Style Prompt

“Create a cozy 2D top-down three-quarter adventure game asset in a polished painterly-cartoon style. Warm Sonoran Desert neighborhood setting. Soft rounded forms, subtle painterly texture, gentle ambient occlusion, consistent down-right shadow, no harsh black outlines, readable silhouette, child-friendly educational game, transparent background, no text baked into the asset, no UI labels, no watermark, consistent scale for Phaser.”

## A. Sonoran Plant Atlas

Generate a transparent-background asset sheet with:

- Mesquite tree
- Creosote bush
- Ephedra/Mormon tea
- Barrel cactus
- Yucca
- Agave
- Desert lavender
- Prickly pear
- Jojoba shrub

Rules:

- Same perspective.
- Same lighting.
- Same scale.
- Isolated sprites.
- Padding between sprites.
- No text.
- Transparent background.

Use the master style prompt and name frames:

- `plant_mesquite_tree_01`
- `plant_creosote_bush_01`
- `plant_ephedra_mormon_tea_01`
- `plant_barrel_cactus_01`
- `plant_yucca_01`
- `plant_agave_01`
- `plant_desert_lavender_01`
- `plant_prickly_pear_01`
- `plant_jojoba_shrub_01`

## B. Neighborhood Buildings Atlas

Generate a transparent-background asset sheet with:

- Zuzu house
- Ramirez house
- Workshop garage
- Garage entrance
- Sidewalk pieces
- Driveway pieces
- Small signs

Rules:

- Top-down 3/4 orthographic view.
- Front face and roof/top surface visible.
- Consistent roof angle and door scale.
- No labels or baked text unless the sign face itself requires a symbol.

Frame names:

- `house_zuzu`
- `house_ramirez`
- `building_workshop`
- `building_garage_entrance`
- `tile_sidewalk_straight`
- `tile_driveway_concrete`
- `sign_garage_left`

## C. Animal Atlas

Generate:

- Jackrabbit
- Javelina
- Coyote

Each should have idle side view and slight 3/4 view.

Rules:

- Same lighting and scale.
- Friendly naturalistic style.
- Transparent background.
- No text.

Frame names:

- `animal_jackrabbit_01`
- `animal_javelina_01`
- `animal_coyote_01`

## D. Zuzu Character Sheet

Generate a consistent character sprite sheet for Zuzu:

- Young boy.
- Light skin.
- Brown hair.
- Expressive eyes.
- Missing-front-tooth smile.
- Red bike helmet variant.
- Yellow/orange tie-dye shirt.
- Blue patterned shorts.
- Child-friendly adventure style.

Frames:

- `zuzu_idle_down`
- `zuzu_idle_up`
- `zuzu_idle_left`
- `zuzu_idle_right`
- `zuzu_walk_down_01` to `zuzu_walk_down_04`
- `zuzu_walk_up_01` to `zuzu_walk_up_04`
- `zuzu_walk_left_01` to `zuzu_walk_left_04`
- `zuzu_walk_right_01` to `zuzu_walk_right_04`
- `zuzu_bike_idle`
- `zuzu_repair_kneel`
- `zuzu_excited`

Rules:

- Transparent background.
- Consistent size and anchor.
- No text.
- No weapon or sci-fi prop baked into the default character sheet.
