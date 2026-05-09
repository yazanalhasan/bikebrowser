# BikeBrowser Art Bible

## A. Visual Style

BikeBrowser uses a cozy 2D adventure style for a child-centered educational game. The target look is polished, warm, readable, and inviting: a soft painterly-cartoon world with Sonoran Desert neighborhood identity.

Core rules:

- Cozy 2D adventure, not flat programmer art.
- Top-down 3/4 perspective with readable forms.
- Soft painterly-cartoon rendering.
- No harsh black outlines; use colored edge accents and ambient occlusion.
- Subtle shadows grounded down/right.
- Warm Arizona afternoon lighting.
- Consistent saturation across characters, plants, buildings, and props.
- Readable silhouettes at gameplay camera distance.

## B. Camera/Perspective

The game world uses orthographic top-down 3/4 perspective.

- Objects should show the front face and the roof/top surface where applicable.
- Houses, workshops, signs, bikes, plants, and characters must share one perspective family.
- Avoid mixed front-facing emoji sprites inside the map unless the asset has been specifically redrawn to match the perspective.
- Character sprites can face down/up/left/right, but their proportions and lighting must remain consistent.

## C. Color Palette

Use these palette tokens in code and asset prompts:

| Token | Hex | Use |
| --- | --- | --- |
| `grassBase` | `#7FB13D` | Main neighborhood grass |
| `grassHighlight` | `#A8CF62` | Grass flecks and sunlit patches |
| `grassShadow` | `#5D8E32` | Grass depth and plant grounding |
| `roadBase` | `#3F4548` | Asphalt |
| `roadEdge` | `#E8E2D6` | Curb/road edge |
| `sidewalkBase` | `#D7D3CA` | Sidewalk slabs |
| `sidewalkShadow` | `#A9A39A` | Sidewalk seams and curb shadows |
| `desertSand` | `#C9A76A` | Dirt, sand, dusty accents |
| `cactusGreen` | `#3E8F48` | Cacti and succulents |
| `mesquiteGreen` | `#5F9D35` | Mesquite foliage |
| `uiCream` | `#FFF7E8` | World labels and UI cards |
| `uiTextDark` | `#1F2937` | Primary text |
| `uiAccentGold` | `#F7B733` | Quest and reward accents |
| `uiAccentBlue` | `#2563EB` | Helpful actions and navigation |
| `dangerRed` | `#DC2626` | Danger, blocked, warning |
| `successGreen` | `#16A34A` | Success and completed state |

## D. Scale Rules

Use a consistent world scale.

- Tile size: `64x64`.
- Zuzu standing sprite visual height: about `72 px`.
- Adult NPC visual height: about `82 px`.
- Door height: `80-90 px`.
- Bike length: `90-110 px`.
- Car/golf-cart width: `120-150 px`.
- Small shrub: `32-48 px`.
- Large bush: `64-80 px`.
- Mesquite tree: `120-170 px`.
- House footprint: about `220-280 px` wide.
- Road lane width: `96-128 px`.

## E. Shadows

All world objects use consistent soft ellipse shadows.

- Characters: small soft oval under feet.
- Houses: subtle grounded shadow down/right.
- Trees: larger transparent soft blob.
- Props: small contact shadow.
- Shadows should be soft, low contrast, and never compete with gameplay markers.

## F. Labels

Labels are optional overlays, never baked into sprites.

Use a consistent `WorldLabel` component:

- Rounded cream background.
- Dark text.
- Small icon optional.
- Soft shadow.
- Scale with camera.
- Hide or fade labels when zoomed out or when player is far away.
- Show important interaction labels only near player.
- Do not place labels directly over important sprites.

## G. Asset Naming

Use normalized asset/frame names:

- `zuzu_idle_down`
- `zuzu_walk_down_01`
- `npc_mr_chen_idle`
- `plant_mesquite_tree_01`
- `plant_creosote_bush_01`
- `animal_jackrabbit_01`
- `animal_javelina_01`
- `animal_coyote_01`
- `prop_flat_tire_bike`
- `prop_bike_gps`
- `sign_garage_left`
- `house_zuzu`
- `house_ramirez`
- `building_workshop`

New art should enter the game through atlases, tilemaps, and manifest keys rather than one-off scene code.
