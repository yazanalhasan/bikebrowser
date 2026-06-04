# ComfyUI BikeBrowser Prompt Library

Date: 2026-05-26

Use these as starting prompts. They are visual-direction prompts, not runtime asset requests.

## 1. Tire Repair Close-Up

Positive:

```text
BikeBrowser concept art, warm kid-friendly bicycle tire repair mat close-up, wheel centered on a workbench mat, tire partly open, inner tube partially pulled from tire, leak marker clearly visible on tube, one small patch placed exactly over the leak, patch kit nearby as supply object, two tire levers near rim, hand pump connected by hose, visible pressure change, clean silhouettes, readable mechanic-eye staging, soft workshop lighting, Aseprite paintover reference
```

Negative:

```text
photorealism, final pixel sprite, cluttered dashboard UI, random text artifacts, malformed bicycle, extra wheels, unreadable spokes, generic fantasy UI, plastic toy look, placeholder geometry, over-detailed background, disconnected props, patch kit used as the applied patch
```

Composition notes: top-down or shallow three-quarter close-up, wheel/tube centered, leak and patch within first read.

Palette notes: warm wood, rubber charcoal, tube gray, patch muted tan/red, small blue or yellow visual accents.

Output use: tire staging concepts and repair mat layout.

Aseprite handoff: redraw the wheel/tube/patch as authored pixel art; preserve only the clear grouping and leak-patch relationship.

Godot integration: target `TireRig.tscn` and `TireRepairStation.tscn`.

## 2. Chain Repair Mechanic-Eye

Positive:

```text
BikeBrowser concept art, close-up of real bicycle rear drivetrain, rear wheel behind crank, chainring near pedal, rear cassette aligned with rear wheel hub, chain path clearly seated from chainring to rear sprocket, pedal causality visible, kid-friendly mechanic-eye view, warm garage lighting, simplified readable silhouettes, Aseprite paintover reference
```

Negative:

```text
wrong drivetrain orientation, chainring behind rear wheel, extra sprockets, missing pedals, impossible chain path, malformed bicycle, unreadable spokes, random text, cluttered UI, photorealistic product render, placeholder geometry
```

Composition notes: crop tightly enough that cassette, chainring, crank, and rear wheel relationship are obvious.

Palette notes: dark chain, silver sprockets, warm frame color, high contrast contact points.

Output use: chain rig orientation and close-up framing.

Aseprite handoff: draw clean chain states: slipped, aligning, seated, test rotation.

Godot integration: target `ChainRigEmbedded.tscn`, `ChainRig.gd`, and `SlippedChainStation.tscn`.

## 3. Mr. Chen Bridge Notebook

Positive:

```text
BikeBrowser warm engineering notebook page, pencil sketch of triangle truss bridge, load path arrows, taped paper scraps, simple material labels, child-readable field notebook tone, Mr. Chen lesson visual, clean composition, no fake text, hand-drawn diagrams, soft desk lighting, Aseprite UI page reference
```

Negative:

```text
random unreadable words, complex engineering equations, generic fantasy book, photorealistic textbook, cluttered dashboard, glossy UI, broken bridge geometry, over-detailed background
```

Composition notes: one strong truss diagram, arrows, one material comparison area, generous blank space.

Palette notes: cream paper, graphite, muted teal/red annotation, warm shadow.

Output use: notebook page layout and bridge lesson visual direction.

Aseprite handoff: replace all generated text with authored labels.

Godot integration: notebook UI and Mr. Chen bridge lesson scenes.

## 4. Workshop Synthesis

Positive:

```text
BikeBrowser child-friendly garage workbench, calm maker-space warmth, bicycle tools grouped by purpose, first useful repaired part on mat, readable object clusters, warm afternoon light, cozy but uncluttered, mentor-friendly tone, Aseprite background reference
```

Negative:

```text
industrial clutter, dark repair shop, unsafe tools everywhere, random text, glossy sci-fi UI, photorealistic catalog render, toy plastic look, confusing object scale
```

Composition notes: leave a clean center action area and readable side tool zones.

Palette notes: warm wood, soft green/blue storage, restrained accent colors.

Output use: garage/workshop mood and prop grouping.

Aseprite handoff: simplify props into reusable authored clusters.

Godot integration: garage scene background and repair station staging.

## 5. Plant Observation Cards

Positive:

```text
BikeBrowser desert plant observation cards, three clear Arizona desert plant silhouettes, name area left blank, clue icons, field notebook labels, child-readable matching activity, warm educational tone, simple shapes, Aseprite card reference
```

Negative:

```text
random unreadable plant names, fantasy plants, photorealistic botanical plates, cluttered UI, too many species, tiny details, plastic stickers
```

Composition notes: exactly three card slots for first mastery pass.

Palette notes: desert greens, muted sand paper, small color-coded clues.

Output use: plant matching layout and card silhouette studies.

Aseprite handoff: use real plant references before final labels.

Godot integration: desert plant observation station.

## 6. Salt River Water Evidence

Positive:

```text
BikeBrowser Salt River water evidence board, water sample jar, pH strip changing color, simple pH comparison chart, macroinvertebrate tray, evidence conclusion area, field notebook style, clean child-readable science layout, Aseprite paintover reference
```

Negative:

```text
fake scientific text, laboratory clutter, scary pollution scene, photorealism, generic dashboard UI, unreadable labels, too many jars, fantasy creatures
```

Composition notes: sample -> strip -> chart -> organism tray -> conclusion path should read left to right.

Palette notes: river blue, paper cream, pH strip rainbow accents, magnifier highlight.

Output use: water quality station staging.

Aseprite handoff: redraw charts and labels manually.

Godot integration: Salt River station and notebook artifact.

## 7. Copper Conductivity

Positive:

```text
BikeBrowser copper conductivity evidence concept, small probe touching copper-colored rock, tiny light indicator turns on, simple wire path, material usefulness evidence, warm workshop science tone, clear cause and effect, Aseprite paintover reference
```

Negative:

```text
electric danger, sparks, random text, sci-fi device, photorealism, cluttered dashboard, magical glowing rock, confusing wire path
```

Composition notes: probe contact, rock, and light indicator should form one readable triangle.

Palette notes: copper orange accent, dark probe, gentle yellow light, neutral work mat.

Output use: copper evidence interaction staging.

Aseprite handoff: simplify to strong probe/rock/light silhouettes.

Godot integration: copper material station.

## 8. NPC Mood Studies

Positive:

```text
BikeBrowser warm mentor portrait study, friendly neighborhood educator, expressive but grounded face, approachable posture, child-safe adventure tone, soft workshop or street context, painterly concept for pixel-art character translation
```

Negative:

```text
photorealistic celebrity, uncanny face, glossy game promo, random text, fantasy armor, exaggerated cartoon toy look, inconsistent age, dramatic horror lighting
```

Composition notes: bust or half-body, readable expression, simple prop cue.

Palette notes: local neighborhood warmth, clothing accent color per NPC.

Output use: mood and silhouette, not final portrait.

Aseprite handoff: create final sprite and portrait from authored style sheet.

Godot integration: NPC portraits and dialogue UI.

## 9. UI Notebook Pages

Positive:

```text
BikeBrowser quest notebook page, sketchbook artifact, child-readable field notes, one central diagram, small evidence stickers, blank label spaces, warm paper texture, clean margins, Aseprite UI reference
```

Negative:

```text
random text artifacts, dense dashboard UI, generic fantasy journal, photorealistic paperwork, clutter, tiny unreadable labels, glossy mobile app style
```

Composition notes: one primary idea per page; reserve authored text zones.

Palette notes: cream paper, graphite lines, two accent colors maximum.

Output use: page composition and evidence grouping.

Aseprite handoff: replace all text, icons, and diagrams with authored assets.

Godot integration: notebook UI and quest artifacts.
