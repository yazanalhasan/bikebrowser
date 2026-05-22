# Bridge Lesson Aseprite Asset Log

Date: 2026-05-22

## Export Method

Source pixel-art PNGs were generated with `tools/generate_bridge_notebook_assets.py`, then final game PNGs were exported through Aseprite CLI:

`C:\Program Files\Aseprite\Aseprite.exe -b <source_png> --save-as <final_png>`

This keeps the final lesson visuals in a compact pixel-art/Aseprite export workflow instead of relying only on procedural Godot drawing.

## Created Assets

Directory:

`BikeBrowserWorld/Assets/UI/BridgeNotebook/`

Final exported assets:

- `bridge_notebook_paper.png`
  - Warm paper background with faint grid/ruled marks and speckled notebook texture.

- `bridge_family_cards.png`
  - Six readable bridge family cards: beam, arch, frame, cable, suspension, truss.

- `dry_wash_gap.png`
  - Small dry-wash crossing scene used as a page texture behind the crossing/load-path interactions.

- `rectangle_frame_states.png`
  - Rectangle and racked/parallelogram frame states for the wobble page.

- `triangle_truss_states.png`
  - Braced triangle/truss state sketch for the triangle page.

- `load_path_arrows.png`
  - Load path sketch showing the visual language for force arrows.

- `bridge_notebook_badge.png`
  - Completion badge/sketch asset for bridge notebook reward use.

Source PNGs retained under:

`BikeBrowserWorld/Assets/UI/BridgeNotebook/source_png/`

## Runtime Use

`BikeBrowserWorld/Systems/UI/BridgePresentationDiagram.gd` loads the final PNGs with `Image.load()` and converts them to `ImageTexture` at runtime. This avoids a fresh-asset import race during headless script validation while still letting Godot import the PNGs normally in editor/export workflows.

The assets currently support the interactive notebook pages as textured paper/thumbnail layers with procedural interaction overlays. This keeps the lesson responsive and animated while giving it a warmer notebook-art base.

## Remaining Art Risks

- These assets are a first in-engine Aseprite pass, not final polished production art.
- The next art refinement should add more hand lettering, tape variations, grease marks, and page-specific object sprites.
- If the team later creates native `.aseprite` source files, the source PNG folder can be replaced by those files without changing the runtime filenames.
