# ComfyUI To Aseprite Pipeline

Date: 2026-05-26

## Canonical Pipeline

1. Generate visual concepts in ComfyUI.
2. Select the strongest 3 to 5 outputs.
3. Crop and annotate composition.
4. Extract visual decisions:
   - silhouette
   - staging
   - color palette
   - object grouping
   - camera angle
   - mechanic readability
5. Create an Aseprite brief.
6. Produce the final `.aseprite` source.
7. Export PNG/JSON through Aseprite.
8. Import into Godot.
9. Capture Playwright screenshots.
10. Run CUDA visual checks.
11. Human review.
12. Commit.

## Naming

Concept batch:

```text
YYYYMMDD_topic_model_batchNN
```

Selected concept:

```text
topic_model_batchNN_selectedNN.png
```

Aseprite brief:

```text
topic_asset_brief_vNN.md
```

Final asset:

```text
topic_asset.aseprite
topic_asset.png
topic_asset.json
```

## Required Metadata

Every Aseprite brief should include:

- source concept path
- model family and checkpoint
- prompt and negative prompt
- selected visual decisions
- rejected AI artifacts
- target Godot scene
- target runtime asset path
- mechanic truth checklist
- reviewer and date

## Rejection Criteria

Reject concepts that contain:

- wrong bicycle orientation
- disconnected repair props
- patch not aligned to leak
- unreadable chain path
- extra wheels or malformed bike parts
- random text artifacts
- over-detailed background that harms mobile readability
- style mismatch with authored Aseprite assets
- dashboard/toolkit visual language in embodied scenes

## Visual Truth Checklist

- Can a child tell what object matters first?
- Does the image show cause and effect?
- Does the mechanic match real bicycle behavior?
- Are props grouped by task rather than scattered?
- Would this survive as a small Godot/browser screenshot?
- Is the palette warm without becoming muddy?
- Is every generated text area planned for authored replacement?

## Provenance Rule

ComfyUI output is concept provenance. Aseprite source is production provenance.

Do not ship raw ComfyUI output as runtime art unless a separate human exception explicitly documents why that output is being used and how licensing/provenance are handled.
