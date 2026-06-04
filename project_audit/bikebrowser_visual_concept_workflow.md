# BikeBrowser Visual Concept Workflow

Date: 2026-05-26

## Workspace

Canonical concept workspace:

- `C:\AI\BikeBrowserConcepts`

Created or verified folders:

- `00_reference`
- `01_prompts`
- `02_workflows`
- `03_outputs`
- `04_selected`
- `05_aseprite_briefs`
- `06_rejected`
- `bridge_notebook`
- `tire_repair`
- `chain_repair`
- `workshop`
- `npcs`
- `regional_science`
- `ui_notebook`

## Contract

ComfyUI is a concept and staging tool. It is not the final runtime asset source.

Final production path:

```text
ComfyUI / SDXL / Flux concepts
  -> art-direction review
  -> Aseprite brief
  -> authored .aseprite source
  -> Aseprite PNG/JSON export
  -> Godot scene integration
  -> Playwright screenshots
  -> CUDA visual QA
  -> human review
```

## Raw Output Rules

- Raw AI output stays in `03_outputs` or the relevant topical folder.
- Selected concepts are copied or referenced in `04_selected`.
- Every selected concept must produce a brief in `05_aseprite_briefs`.
- No generated concept is copied directly into `BikeBrowserWorld\Assets` without Aseprite authorship and provenance notes.

## Review Questions

For every selected concept, answer:

- What staging problem does it solve?
- What silhouette should Aseprite preserve?
- What object grouping should Godot preserve?
- What mechanical truth must survive translation?
- What details must be discarded because they are AI noise?

## BikeBrowser Use Cases

- Tire repair mat coherence
- Chain repair drivetrain orientation
- Bridge notebook composition
- Regional science evidence boards
- NPC mentor mood studies
- Workshop warmth and tool grouping
- Mobile-readable notebook pages
