# Tire Repair Concept Batch 001

Date: 2026-05-27

## Goal

Generate 20 BikeBrowser tire repair mat concepts to find clear staging for:

- wheel centered
- tube partly pulled out
- visible puncture
- single rubber patch
- pump hose connected
- tools grouped on repair mat
- warm workshop notebook style

## Inputs

- Aseprite brief: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\tire_repair_mat_brief_v001.md`
- Workflow: `C:\AI\BikeBrowserConcepts\02_workflows\sdxl_tire_repair_smoke_api_workflow.json`
- ComfyUI launch: `--disable-xformers`
- Model: `sd_xl_base_1.0.safetensors`

## Outputs

- Batch folder: `C:\AI\BikeBrowserConcepts\tire_repair\batch_001`
- Manifest: `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\batch_001_manifest.json`
- Contact sheet: `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\batch_001_contact_sheet.png`
- Selected references: `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5`
- Aseprite v002 brief: `C:\AI\BikeBrowserConcepts\05_aseprite_briefs\tire_repair_mat_brief_v002.md`

All 20 generations completed successfully.

## Prompt Used

Positive prompt:

```text
BikeBrowser visual concept sheet, warm workshop notebook style, kid-friendly bicycle tire repair mat close-up, one bicycle wheel centered flat on a rectangular repair mat, tire bead opened on one side, gray inner tube partly pulled out from tire, visible small puncture mark on the tube, one single flat rubber patch placed near or over the puncture, hand pump hose connected to valve, two tire levers and small patch kit grouped neatly on the mat, clear cause and effect, clean silhouettes, readable object grouping, simple warm wood workbench, soft pencil-and-gouache concept art for Aseprite pixel-art paintover, no text labels needed
```

Negative prompt:

```text
photorealism, final runtime sprite, cluttered dashboard UI, random text artifacts, malformed bicycle, extra wheels, multiple patches, unreadable spokes, fantasy UI, plastic toy look, placeholder geometry, over-detailed background, disconnected props, disembodied tools, incorrect tire mechanics, no wheel, no tube, no puncture, pump not connected, scattered tools, abstract shapes, product catalog render
```

## Visual-Truth-Agent Ranking

Scoring: 1 to 5 for each dimension. Total possible: 25.

| Rank | Concept | Mechanical clarity | Object grouping | Child readability | Silhouette clarity | Aseprite usefulness | Total | Notes |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | `tire_repair_mat_concept_14.png` | 4 | 3 | 4 | 5 | 4 | 20 | Best pump-to-valve/tire relationship and strong close-up wheel read; missing tube/patch truth. |
| 2 | `tire_repair_mat_concept_12.png` | 3 | 4 | 3 | 5 | 4 | 19 | Strong centered wheel and tool/callout grouping; too cluttered and text-heavy. |
| 3 | `tire_repair_mat_concept_18.png` | 3 | 4 | 3 | 4 | 5 | 19 | Best warm notebook/workbench handoff; tube and patch need authored correction. |
| 4 | `tire_repair_mat_concept_04.png` | 4 | 3 | 3 | 4 | 4 | 18 | Clear hose/valve relationship; side panels feel like a diagram, not embodied repair. |
| 5 | `tire_repair_mat_concept_20.png` | 3 | 3 | 4 | 4 | 4 | 18 | Good notebook mat tone and centered wheel; pump placement is mechanically impossible. |
| 6 | `tire_repair_mat_concept_19.png` | 2 | 4 | 4 | 4 | 4 | 18 | Clean parts sheet with good silhouettes; weak coherent repair action. |
| 7 | `tire_repair_mat_concept_11.png` | 2 | 5 | 3 | 4 | 3 | 17 | Excellent tool grouping and warm workbench; lacks repair mat mechanism. |
| 8 | `tire_repair_mat_concept_15.png` | 2 | 4 | 3 | 4 | 4 | 17 | Good isolated parts language; not a centered wheel/tube repair scene. |
| 9 | `tire_repair_mat_concept_17.png` | 3 | 3 | 3 | 4 | 3 | 16 | Strong pump close-up; missing tube, patch, and repair mat coherence. |
| 10 | `tire_repair_mat_concept_10.png` | 2 | 3 | 3 | 3 | 4 | 15 | Warm patch-kit mood; wheel absent and mechanism weak. |
| 11 | `tire_repair_mat_concept_08.png` | 1 | 4 | 3 | 3 | 3 | 14 | Nice mat/tool organization; no readable bicycle repair. |
| 12 | `tire_repair_mat_concept_03.png` | 1 | 2 | 3 | 5 | 3 | 14 | Excellent centered wheel silhouette; lacks repair props and mechanism. |
| 13 | `tire_repair_mat_concept_07.png` | 2 | 3 | 2 | 3 | 3 | 13 | Has pump/tube hints but reads physically confused. |
| 14 | `tire_repair_mat_concept_09.png` | 2 | 3 | 2 | 3 | 3 | 13 | Patch/glue vibe is useful, but wheel/tube relation is absent. |
| 15 | `tire_repair_mat_concept_06.png` | 1 | 3 | 2 | 3 | 3 | 12 | Technical wheel diagrams; not a repair mat scene. |
| 16 | `tire_repair_mat_concept_16.png` | 1 | 3 | 2 | 3 | 3 | 12 | Materials/detail collage; no coherent repair action. |
| 17 | `tire_repair_mat_concept_02.png` | 1 | 2 | 2 | 3 | 2 | 10 | Close-up tire fragments without readable task flow. |
| 18 | `tire_repair_mat_concept_13.png` | 1 | 2 | 2 | 3 | 2 | 10 | Mixed bike/study sheet; not useful for tire repair mat. |
| 19 | `tire_repair_mat_concept_01.png` | 1 | 2 | 1 | 2 | 2 | 8 | Collage is too fragmented and visually noisy. |
| 20 | `tire_repair_mat_concept_05.png` | 1 | 1 | 1 | 2 | 2 | 7 | Bike-frame sketch, not a repair mat concept. |

## Selected Top 5

Selected references were copied to:

- `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5\rank_1_concept_14.png`
- `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5\rank_2_concept_12.png`
- `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5\rank_3_concept_18.png`
- `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5\rank_4_concept_04.png`
- `C:\AI\BikeBrowserConcepts\tire_repair\batch_001\selected_top_5\rank_5_concept_20.png`

They were also copied into `C:\AI\BikeBrowserConcepts\04_selected`.

## Visual-Truth Findings

No generated concept fully satisfies the complete mechanic truth requirement. The batch is still valuable as composition reference, but the final Aseprite asset must deliberately synthesize the best traits:

- concept 14: pump-to-valve causality
- concept 12: centered wheel and bold tire silhouette
- concept 18: warm notebook/workbench language
- concept 04: hose/valve clarity
- concept 20: child-friendly notebook mat tone

The weakest repeated failure is the exposed tube/puncture/single-patch relationship. That part must be authored intentionally in Aseprite, not trusted to generation.

## Recommendation

Use `tire_repair_mat_brief_v002.md` as the production handoff. Start Aseprite from a simple top-down layout, not from direct image tracing:

1. Draw wheel centered on mat.
2. Open tire bead at lower-right.
3. Pull tube out through the opening.
4. Mark puncture on exposed tube.
5. Place one patch over puncture.
6. Connect pump hose to valve.
7. Group levers and patch kit nearby.

Then validate in Godot and Playwright screenshots.
