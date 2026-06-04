# First BikeBrowser ComfyUI Concept Batch Briefs

Date: 2026-05-26

## A. Tire Repair Close-Up Repair Mat

Goal: fix tire visual incoherence by finding a readable repair mat composition.

Deliverable target:

- Generate 20 SDXL concepts.
- Select 5.
- Turn best concept into an Aseprite brief.

Prompt:

```text
BikeBrowser concept art, warm kid-friendly bicycle tire repair mat close-up, wheel centered on a workbench mat, tire open at one side, inner tube partially pulled out, leak marker visible, one small patch placed over the leak, patch kit nearby as supplies, tire levers near rim, pump hose connected, visible pressure change, readable cause and effect, clean silhouettes, Aseprite paintover reference
```

Negative prompt:

```text
photorealism, final runtime sprite, malformed wheel, extra wheels, random text, disconnected props, patch kit as applied patch, cluttered dashboard UI, plastic toy look, placeholder geometry
```

Model recommendation: SDXL now; Flux later after local weights are installed.

Workflow recommendation: `sdxl_tire_repair_smoke_api_workflow.json`, then expand to 20 seeds.

Output folder: `C:\AI\BikeBrowserConcepts\tire_repair`

Selection criteria:

- leak, patch, tube, tire, pump, and tire levers read as one mechanism
- patch is a single small patch over leak
- wheel remains central
- background does not compete

Aseprite handoff: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\tire_repair_mat_brief_v001.md`

Godot target scene: `BikeBrowserWorld\Scenes\Systems\Repair\TireRig.tscn`

## B. Chain Repair Mechanic-Eye Drivetrain

Goal: fix chain orientation/readability by making drivetrain relationships obvious.

Deliverable target:

- Generate 20 concepts.
- Select 5.
- Turn best concept into an Aseprite brief.

Prompt:

```text
BikeBrowser concept art, close-up bicycle drivetrain mechanic-eye view, bike facing right, rear wheel behind crank, rear cassette aligned with rear hub, chainring and pedal in front of rear sprocket, chain path clearly travels from chainring to rear sprocket, slipped chain state and seated chain state readable, warm garage lighting, clean silhouettes, Aseprite paintover reference
```

Negative prompt:

```text
backward drivetrain, impossible chain path, extra gears, extra wheels, malformed bicycle, missing pedals, unreadable spokes, random text, dashboard UI, photorealistic product shot
```

Model recommendation: SDXL for staging; Flux later for richer concept exploration.

Workflow recommendation: SDXL text-to-image now, ControlNet lineart later using runtime bike silhouette.

Output folder: `C:\AI\BikeBrowserConcepts\chain_repair`

Selection criteria:

- rear sprocket sits with rear wheel
- crank/chainring sit forward of rear hub
- chain path can be traced at a glance
- pedal causality is visually implied

Aseprite handoff: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\chain_repair_drivetrain_brief_v001.md`

Godot target scene: `BikeBrowserWorld\Scenes\Systems\Repair\ChainRigEmbedded.tscn`

## C. Bridge Notebook Page

Goal: make Mr. Chen's bridge lesson visually polished and comprehensible.

Deliverable target:

- Generate 20 concepts.
- Select 5.
- Turn best concept into an Aseprite brief.

Prompt:

```text
BikeBrowser warm engineering notebook page, pencil sketch of triangle truss bridge, simple load path arrows, material swatches, taped field notes, child-readable blank label spaces, Mr. Chen lesson tone, clean page hierarchy, no fake text, Aseprite UI paintover reference
```

Negative prompt:

```text
random unreadable text, dense equations, generic fantasy journal, glossy dashboard UI, photorealistic textbook, cluttered page, broken bridge geometry, over-detailed background
```

Model recommendation: SDXL now; Flux later for richer notebook moods.

Workflow recommendation: SDXL text-to-image with a square or 4:3 notebook composition; later ControlNet from a hand-drawn layout.

Output folder: `C:\AI\BikeBrowserConcepts\bridge_notebook`

Selection criteria:

- triangle concept is first read
- arrows show force/load direction
- blank authored-label spaces are preserved
- page can become a Godot notebook artifact

Aseprite handoff: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\bridge_notebook_brief_v001.md`

Godot target scene: Mr. Chen bridge lesson and notebook artifact UI.
