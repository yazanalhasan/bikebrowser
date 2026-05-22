# Bridge Lesson Visual Redesign Plan

Date: 2026-05-22

## North Star

The bridge lesson should feel like Mr. Chen opened a workshop engineering notebook on the bench and let Zuzu test ideas directly on the page.

It should not feel like a textbook, magazine spread, quiz modal, or static infographic. The player should learn by nudging, placing, dragging, labeling, and tracing. The central emotional beat is: "Oh, triangles stop the bridge from folding."

## Layout System

Use a notebook-spread overlay inside the existing HUD presentation flow.

- Background: warm cream paper with faint ruled/sketch grid texture.
- Edge treatment: worn page corners, tape tabs, soft grease/pencil smudges.
- Left margin: Mr. Chen note, page number, small tape marker.
- Center: one large interactive diagram.
- Bottom: child-readable action prompt and takeaway.
- Right/bottom controls: `Try`, `Next`, and `Rest`, using current input affordances.

Responsive behavior:

- Desktop/tablet: wide notebook spread, sketch centered.
- Mobile landscape: same spread, denser margins, shorter prompt line.
- Mobile portrait: single page stack, diagram first, short text second.

## Page Grammar

Every page has exactly:

1. Title
2. One short Mr. Chen line
3. One interactive diagram
4. One player action
5. One notebook takeaway

No page should require paragraph reading to understand what to do.

## Page 1: Crossing Problem

Title: `Crossing the Dry Wash`

Mr. Chen line:
`A crossing is a promise: weight must find ground again.`

Interactive diagram:
- Dry wash gap, two banks, three draggable/pressable crossing pieces:
  - log
  - plank
  - bridge deck
- When a piece is placed, ghost force arrows appear from the piece into the banks/ground.

Player action:
- Place the bridge deck across the gap.

Notebook takeaway:
`A bridge gives force a path from traveler to ground.`

## Page 2: Bridge Families

Title: `Six Ways Across`

Mr. Chen line:
`Different bridges solve the same problem with different forces.`

Interactive diagram:
- Six small bridge family cards:
  - beam
  - arch
  - frame
  - cable-stayed
  - suspension
  - truss
- Four force buckets:
  - bending
  - compression
  - tension
  - mixed

Player action:
- Sort or tap each card into the correct force bucket.
- Simplified mapping:
  - beam -> bending
  - arch -> compression
  - suspension -> tension
  - cable-stayed -> tension
  - frame -> mixed
  - truss -> mixed

Notebook takeaway:
`Bridge shape decides where bending, squeezing, and pulling go.`

## Page 3: Main Parts

Title: `Name the Parts`

Mr. Chen line:
`A bridge is easier to fix when you can name what carries what.`

Interactive diagram:
- Clipboard bridge sketch with deck, abutments, and center pier.
- Three labels:
  - deck / superstructure
  - abutment
  - pier / support

Player action:
- Tap the correct areas in order or drag labels onto targets.

Notebook takeaway:
`Deck carries the bike. Abutments and piers carry the deck.`

Milestone:
- Send Telegram after this page is implemented and passes a quick Godot content check.

## Page 4: Rectangle Wobble

Title: `The Wobble Problem`

Mr. Chen line:
`A rectangle can look strong until the side push arrives.`

Interactive diagram:
- A simple rectangular bridge frame.
- A hand/push arrow on one side.
- On push, frame visibly racks into a parallelogram.

Player action:
- Press or tap `Push`.

Notebook takeaway:
`Rectangles can fold sideways into a parallelogram.`

## Page 5: Triangle Truss

Title: `Add the Brace`

Mr. Chen line:
`A diagonal brace turns the wobble into triangles.`

Interactive diagram:
- Same rectangle frame.
- A draggable diagonal brace.
- When dropped into place, triangle lines light up.
- Pushing again shows the frame stays stiff.

Player action:
- Drag or tap-place the diagonal brace, then push.

Notebook takeaway:
`Triangles lock shape because the sides cannot slide without changing length.`

## Page 6: Dry Wash Load Path

Title: `Trace the Load`

Mr. Chen line:
`Now follow the bike's weight all the way down.`

Interactive diagram:
- Dry wash bridge with bike on deck.
- Animated force path:
  - deck
  - triangle braces
  - supports
  - ground

Player action:
- Trace or tap the force path in order.

Notebook takeaway:
`Triangles keep a bridge from folding. A good bridge sends the bike's weight from the deck, through braces, into supports, and down to the ground.`

Milestone:
- Send Telegram after this page is implemented and recorded in the notebook.

## Aseprite Asset Plan

Create a bridge notebook atlas and page-specific sprites under:

- `BikeBrowserWorld/Assets/UI/BridgeNotebook/`

Proposed assets:

- `bridge_notebook_paper.png`
- `mr_chen_pencil_marks.png`
- `dry_wash_gap.png`
- `crossing_pieces.png`
- `bridge_family_cards.png`
- `bridge_parts_clipboard.png`
- `rectangle_frame_states.png`
- `triangle_brace_piece.png`
- `triangle_truss_states.png`
- `load_path_arrows.png`
- `bridge_notebook_badge.png`

Art direction:

- warm cream paper
- dusty desert orange
- muted blueprint blue
- graphite pencil
- copper/wood accents
- chunky readable silhouettes
- no placeholder boxes
- no flat textbook diagrams

Export method:

- Generate/edit source sprites in an Aseprite-compatible pixel-art workflow.
- Export final PNGs through Aseprite CLI.
- Keep exports small and readable at Godot UI scale.

## Godot Implementation Plan

Primary implementation path:

- Replace the current slide-only `BridgePresentationDiagram.gd` behavior with an interactive notebook page renderer.
- Keep `HudController.gd` as the presentation owner so existing `presentation_requested` routing still works.
- Add page state:
  - current page id
  - interaction completion per page
  - selected/placed objects
  - labels placed
  - force path trace index
- `Next` should be disabled or visually quiet until the page's required action is complete.
- On final page completion, record quest notebook state.

Candidate files:

- `BikeBrowserWorld/Systems/UI/BridgePresentationDiagram.gd`
  - Convert from passive procedural sketch to interactive notebook diagram.

- `BikeBrowserWorld/Systems/UI/HudController.gd`
  - Restyle panel as notebook.
  - Pass current slide/page metadata to diagram.
  - Listen for diagram completion signals.
  - Record final notebook artifact when lesson finishes.

- `BikeBrowserWorld/Data/presentations/mr_chen_triangle_bridge_lesson.json`
  - Add `interaction_type`, `mr_chen_line`, `takeaway`, and compact action prompt fields.

- `BikeBrowserWorld/Core/QuestRegistry/QuestRegistry.gd`
  - Add bridge sketches to `_notebook_sketches()` when bridge lesson objectives are recorded.

## Notebook Integration Plan

After bridge lesson completion, the notebook should show:

- `Bridge families`
  - `beam bends, arch squeezes, cables pull, trusses mix forces`

- `Triangle brace`
  - `rectangle wobbles; diagonal brace makes triangles`

- `Load path`
  - `deck -> braces -> supports -> ground`

Final child-readable takeaway:

`Triangles keep a bridge from folding. A good bridge sends the bike's weight from the deck, through braces, into supports, and down to the ground.`

## Validation Plan

Add or update tests for:

- presentation JSON includes all six interactive pages
- notebook lesson preview scene loads
- rectangle wobble page can complete
- triangle brace page can complete
- load path page can complete
- bridge notebook sketches appear after bridge lesson objective completion
- no debug diagnostics are visible by default

Run:

- `npm run build`
- `godot --headless --path BikeBrowserWorld --quit`
- `godot --headless --path BikeBrowserWorld --script res://tests/bridge_triangle_lesson_content_check.gd`
- new bridge notebook lesson tests
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\export-godot-web.ps1`
- Playwright smoke on `/play?playtest=1&playtestRegion=bridge_presentation_preview`
- desktop/tablet/mobile screenshots

## Risks

- The existing modal has fixed pixel dimensions and needs responsive sizing before mobile can pass.
- If new PNGs are added, Godot import metadata may be generated during headless runs; this should be treated as expected asset import output.
- Full drag-and-drop can be brittle in browser/Godot export. Tap-place fallback should exist for every drag interaction.
- Quest objective advancement currently happens at the station level; lesson completion must not silently skip notebook artifact recording.
