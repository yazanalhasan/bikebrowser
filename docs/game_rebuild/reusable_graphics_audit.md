# Reusable Graphics Audit

Date: 2026-05-27

## Purpose

Review previous BikeBrowser graphics folders and identify assets that can be reused for the `/game-rebuild` Act 1 observed-vs-expected pass without importing visual clutter, raw generated art, or mismatched runtime assets.

This is an audit only. It does not promote assets into runtime.

## Inventory Generated

Generated files:

- `project_audit/reusable_graphics_inventory.json`
- `project_audit/reusable_graphics_contact_sheets/character.png`
- `project_audit/reusable_graphics_contact_sheets/bike_repair.png`
- `project_audit/reusable_graphics_contact_sheets/garage_workshop.png`
- `project_audit/reusable_graphics_contact_sheets/bridge_dry_wash.png`
- `project_audit/reusable_graphics_contact_sheets/lab_materials.png`
- `project_audit/reusable_graphics_contact_sheets/ecology_desert.png`
- `project_audit/reusable_graphics_contact_sheets/environment_tiles.png`
- `project_audit/reusable_graphics_contact_sheets/ui_notebook.png`

Scanned folders:

- `BikeBrowserWorld/Assets`
- `public/assets`
- `public/game/editor-assets/images`
- `backups/openclaw_bike_graphics_20260521_0802`
- `graphics_review_export`
- `validation`
- `src/game/art/final/act1`

## Summary Counts

| Category | Files | Candidate-like files | Source/reference files | Notes |
|---|---:|---:|---:|---|
| Character | 614 | 546 | 160 | Strongest reuse pool. Contains Zuzu, Mrs. Ramirez, Mr. Chen, and other NPC sheets. |
| Bike repair | 129 | 73 | 43 | Strong props and repair poses; must avoid old regression bike art unless reviewed. |
| Garage/workshop | 120 | 80 | 24 | Excellent candidate pool for making garage iconic. |
| Environment tiles | 169 | 153 | 13 | Useful for road/sidewalk/yard grounding, but could clutter the scene. |
| Ecology/desert | 101 | 97 | 2 | Strong plant and desert identity assets. |
| Bridge/dry wash | 67 | 62 | 9 | Very useful for bridge payoff and notebook bridge pages. |
| Lab/materials | 60 | 57 | 1 | Useful for UTM, chemistry, material stations, and future labs. |
| UI/notebook | 16 | 14 | 1 | Useful UI parts, but much of it is older dashboard-style UI. |
| Other | 783 | 0 | 18 | Mostly screenshots, reports, pack files, and non-runtime references. |

## Highest-Value Reuse Candidates

### Characters

These are the strongest candidates for replacing the current production-preview characters after Aseprite cleanup:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Zuzu idle/walk | `BikeBrowserWorld/Assets/Characters/Zuzu/Native96/zuzu_idle_native96_v1/sheet-transparent.png` | Better child-facing player sprite than current hand-authored preview. | Needs scale normalization and style check against current top-down scene. |
| Zuzu walk | `BikeBrowserWorld/Assets/Characters/Zuzu/Native96/zuzu_walk_native96_v1/sheet-transparent.png` | Gives real walk animation frames. | Needs Phaser spritesheet metadata and movement-facing decisions. |
| Zuzu 4-dir actions | `BikeBrowserWorld/Assets/Characters/Zuzu/Forge/zuzu_walk_4dir_v2/sheet-transparent.png` | Good for future richer traversal. | Lower resolution than Native96; may need upscaling or direct 48px gameplay scale. |
| Zuzu repair | `BikeBrowserWorld/Assets/Characters/Zuzu/Forge/zuzu_repair_4dir_v1/sheet-transparent.png` | Directly supports bike/UTM/garage tactile moments. | Use as animation reference if final style differs. |
| Mrs. Ramirez idle/talk/cheer | `BikeBrowserWorld/Assets/Characters/MrsRamirez/MrsRamirez_idle/sheet-transparent.png` and related sheets | Best existing NPC identity match for current Act 1 role. | Must confirm visual tone is respectful and child-readable. |
| Mr. Chen idle/talk/repair | `BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_idle.png`, `MrChen_talk.png`, `MrChen_repair.png` | Direct match for garage mentor. | Needs contact-sheet normalization and perhaps source recovery if no `.aseprite`. |

Verdict: reuse after Aseprite normalization. This is the single best folder for closing the NPC/Zuzu identity gap.

### Garage / Workshop

These are strong candidates for making the garage feel iconic:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Garage backdrop | `BikeBrowserWorld/Assets/Backgrounds/garage_interior_wall.png` | Already reads as workshop warmth. | Too large for direct scene; crop/paintover into a compact top-down landmark. |
| Garage wall panel | `BikeBrowserWorld/Assets/Backgrounds/Derived/garage_wall_panel.png` | Better production-ready wall detail. | Needs perspective fit. |
| Garage floor | `BikeBrowserWorld/Assets/Backgrounds/Derived/garage_floor_panel.png` | Useful for grounding garage area. | Avoid turning neighborhood into a full interior. |
| Workbench tools | `graphics_review_export/BikeBrowserWorld__Assets__Props__Garage__Raw__wooden_workbench_tools_raw.png` | Strong visual identity for workbench. | Raw/generated-looking; needs Aseprite cleanup. |
| Tool rack | `graphics_review_export/BikeBrowserWorld__Assets__Props__Garage__Raw__pegboard_tool_rack_raw.png` | Good readable garage prop. | Must reduce detail/noise. |
| Poster | `graphics_review_export/BikeBrowserWorld__Assets__Props__Garage__Raw__keep_pedaling_poster_raw.png` | Emotional bike-culture cue. | Could become clutter; use sparingly. |
| String lights | `graphics_review_export/BikeBrowserWorld__Assets__Props__Garage__Raw__hanging_string_lights_raw.png` | Warmth cue. | Use as stylized simplified lights, not full raw import. |

Verdict: use as Aseprite paintover/reference, with maybe one or two cleaned runtime props.

### Bridge / Dry Wash

These are good candidates for bridge repair and the Act 1 climax:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Dry wash channel | `BikeBrowserWorld/Assets/Props/DryWash/dry_wash_channel_tile.png` | Stronger terrain identity than current simple shape. | Must be scaled to avoid clutter. |
| Broken beam | `BikeBrowserWorld/Assets/Props/DryWash/broken_bridge_beam.png` | Clear damage read. | Use as component, not full scattered debris. |
| Bridge segment | `BikeBrowserWorld/Assets/Props/DryWash/test_bridge_segment.png` | Useful repaired bridge component. | Needs match to current bridge geometry. |
| Support pier | `BikeBrowserWorld/Assets/Props/DryWash/bridge_support_pier.png` | Makes supports visually real. | Must support triangle/load-path teaching. |
| Broken plank | `BikeBrowserWorld/Assets/Props/DryWash/broken_bridge_plank.png` | Useful before-state prop. | Avoid overdecorated debris field. |
| Clipboard plan | `BikeBrowserWorld/Assets/Props/DryWash/clipboard_bridge_plan.png` | Excellent interaction affordance for bridge plan. | Good runtime candidate after cleanup. |
| Bridge notebook cards | `BikeBrowserWorld/Assets/UI/BridgeNotebook/bridge_family_cards.png` | Directly supports notebook field-journal transformation. | Needs integration into journal UI. |
| Truss/load-path diagrams | `BikeBrowserWorld/Assets/UI/BridgeNotebook/source_png/triangle_truss_state*.source.png`, `load_path_arrows*.source.png` | Excellent educational visuals. | Use inside notebook, not as floating lecture UI. |

Verdict: high priority. These can directly improve the bridge climax and notebook.

### Bike Repair

Useful candidates:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| BMX repair stand | `BikeBrowserWorld/Assets/Props/Bike/garage_repair_stand_bmx*.png` and backup variants | Stronger bike repair visual than current preview art. | Must compare against regression/backup reports before reuse. |
| Rear/front wheel | `BikeBrowserWorld/Assets/Props/BikeRepair/rear_wheel.png`, `front_wheel.png` if present in inventory | Good for tire/chain close-ups. | Needs chain orientation validation. |
| Pump / patch / tube | `BikeBrowserWorld/Assets/Props/BikeRepair/*pump*`, `*patch*`, `*tube*` | Useful for future tire repair station. | Some are untracked/new Godot pass files; keep scoped. |
| Zuzu repair animation | `BikeBrowserWorld/Assets/Characters/Zuzu/Forge/zuzu_repair_4dir_v1/sheet-transparent.png` | Gives action feedback in garage. | Needs animation metadata. |
| Mr. Chen repair | `BikeBrowserWorld/Assets/Characters/NPCs/MrChen/MrChen_repair.png` | Good mentor staging. | Needs scale/style normalization. |

Verdict: reuse cautiously. Bike art was a known regression zone, so do not promote without visual-truth review.

### Ecology / Desert

Strong candidates:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Mesquite | `public/assets/ecology/plants/mesquite.png` and `BikeBrowserWorld/Assets/Props/Desert/mesquite_tree.png` | Direct Act 1 species. | Choose one style family; do not mix. |
| Creosote | `public/assets/ecology/plants/creosote.png` | Direct Act 1 observation. | Public ecology style is simpler than Godot props. |
| Saguaro | `public/assets/ecology/plants/saguaro.png` | Direct landmark. | Good as icon/token; maybe too clean for environment. |
| Palo verde | `public/assets/ecology/plants/palo_verde.png` and Godot prop | Strong Sonoran identity. | Optional for Act 1. |
| Desert terrain | `public/assets/ecology/terrain/dry_wash.png`, `desert_ground.png`, `sand.png`, `rock.png` | Good tile/reference material. | Keep sparse; avoid board-game tile feel. |

Verdict: reuse public ecology assets for notebook/cards and cleaned Godot desert props for world staging.

### Lab / Chemistry / Materials

Strong candidates:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Rubber workshop | `BikeBrowserWorld/Assets/Props/Labs/rubber_workshop_station.png` | Good chemistry/repair bridge between tire and material systems. | Could feel like a station if not embedded. |
| Fiber table | `BikeBrowserWorld/Assets/Props/Labs/fiber_processing_table.png` | Good material testing visual. | Might imply later-act content; use carefully. |
| Electronics bench | `BikeBrowserWorld/Assets/Props/Labs/electronics_bench.png` | Useful later, not Act 1 priority. | Too advanced for current Act 1 if foregrounded. |
| Beakers / drying tray / goggles | `BikeBrowserWorld/Assets/Props/Labs/*beaker*`, `drying_tray.png`, `safety_goggles.png` | Good chemistry embodiment details. | Needs simplified grouping, not scattered props. |
| Lab floor/wall | `BikeBrowserWorld/Assets/Backgrounds/lab_*` | Useful for later scenes. | Not for current neighborhood unless garage transforms. |

Verdict: reuse selected props for chemistry station and UTM, not full lab backgrounds.

### UI / Notebook

Candidates:

| Use | Candidate | Why useful | Caution |
|---|---|---|---|
| Dialogue box | `BikeBrowserWorld/Assets/UI/dialogue_box_bg.png` | Could replace current rectangle. | May be too generic; check visual bible. |
| Interaction prompt | `BikeBrowserWorld/Assets/UI/interaction_prompt_e.png` | Useful prompt affordance. | Must remain keyboard/touch neutral if mobile. |
| Minimap frame | `BikeBrowserWorld/Assets/UI/minimap_frame.png` | Could support field-map feel. | Avoid dashboard read. |
| Bridge notebook pages | `BikeBrowserWorld/Assets/UI/BridgeNotebook/*` | Better fit than generic UI. | Prioritize these over old generic panels. |

Verdict: BridgeNotebook assets are the best UI reuse. Generic UI panels should be avoided unless heavily restyled.

## Assets To Avoid For Direct Runtime Promotion

- `graphics_review_export/*Raw*` files: useful as references/contact-sheet sources, but often too detailed or generated-looking for direct runtime.
- `project_audit/screenshots/**`: evidence only, not runtime art.
- `playtest_captures/**`: evidence only.
- `backups/openclaw_bike_graphics_20260521_0802/**`: quarantine/reference; useful for comparing the bike art regression, not automatic runtime promotion.
- `BikeBrowserWorld/Assets/deprecated/**`: keep quarantined.
- Very large 1920x1080 backgrounds: use as mood/crop references, not direct top-down runtime assets.

## Recommended Promotion Order

1. **Characters first**
   - Promote Zuzu Native96 idle/walk.
   - Promote Mrs. Ramirez idle/talk/cheer.
   - Promote Mr. Chen idle/talk/repair.
   - Create or adapt Auntie Mariam only after style match is clear, because no exact legacy match surfaced.

2. **Bridge and notebook second**
   - Use DryWash bridge parts for before/after bridge.
   - Use BridgeNotebook diagrams/cards inside the notebook.
   - Add a bridge-plan page instead of another abstract HUD panel.

3. **Garage third**
   - Use garage wall/floor/workbench/tool-rack assets as Aseprite references.
   - Keep prop density low: one workbench, one poster/light cue, one tool cluster.

4. **Ecology and chemistry fourth**
   - Use public ecology plant tokens for notebook and observation cards.
   - Use Godot desert props for world landmarks if style-normalized.
   - Use beakers/drying tray/goggles/rubber station as one coherent chemistry cluster.

5. **Bike repair fifth**
   - Review against known bike-art regression docs before promotion.
   - Use only mechanically correct tire/chain/bike assets.

## Proposed Runtime Promotion Rules

Any reused asset must:

- be copied into `src/game/art/source/aseprite/act1/` as the editable source or converted into a new `.aseprite` source
- export to `src/game/art/final/act1/`
- be registered in `src/game/data/act1/act1AssetManifest.js`
- have a stable `AssetRegistry` key and placeholder fallback
- pass visual QA screenshots
- not come from `playtest_captures`, screenshots, or raw generated concept folders
- not increase clutter or make the scene feel like a prop collage

## Short Answer

Yes, there is reusable art.

The most reusable material is:

- Zuzu Native96 and Forge animation sheets
- Mrs. Ramirez sheets
- Mr. Chen sheets
- DryWash bridge parts and BridgeNotebook diagrams
- garage workbench/tool/lighting/poster assets
- public ecology plant tokens
- lab/chemistry props such as drying tray, beakers, goggles, and rubber station

The least safe material is:

- old raw/export atlases
- screenshots and playtest captures
- deprecated assets
- backup bike art that may represent the previous regression
- large full-scene backgrounds that do not match the top-down Act 1 substrate
