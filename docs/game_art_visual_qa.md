# Game Art Visual QA

## Purpose

The Act 1 character visual audit proves that the character frame shown as source art is the exact frame rendered in the live Phaser scene. It exists because metadata-only checks can pass while the visual evidence shown to a user is wrong.

## Why Metadata-Only Checks Failed

The earlier process checked texture keys and source files, then cropped a convenient source frame. That missed important runtime facts:

- the live object may be on a different animation frame;
- the scene may apply scale, alpha, tint, flip, origin, depth, or camera transforms;
- a source crop can be valid art but not the exact rendered runtime frame;
- a screenshot claim can say "matches" without comparing pixels.

## Command

Run:

```bash
npm run art:audit:act1
```

The command starts or connects to the local Vite/Phaser app, opens `/game-rebuild`, captures live character runtime metadata, crops exact source frames from Phaser frame metadata, captures the live scene, crops each character from the scene screenshot, compares the two visually, and exits nonzero on mismatch.

## Output Artifacts

Artifacts are written under:

```text
artifacts/art_audit/
```

Key outputs:

- `source_exact/{characterId}.png`
- `runtime_scene/act1_scene.png`
- `runtime_crops/{characterId}.png`
- `diff_overlay/{characterId}.png`
- `contact_sheet/act1_character_match_sheet.png`
- `act1_character_visual_audit.json`
- `act1_character_visual_audit.md`

## Pass/Fail Criteria

The audit fails if:

- a required character is missing;
- the texture key cannot be mapped to a runtime source file;
- the source crop is not extracted from Phaser runtime frame metadata;
- the live scene screenshot or runtime crop cannot be created;
- masked pixel comparison exceeds the configured error threshold;
- background/transparent padding dominates the crop too heavily.

The audit warns if:

- tint, alpha, flip, rotation, or non-uniform scaling changes the rendered appearance;
- source and runtime crop aspect ratios differ;
- rotation forces conservative axis-aligned cropping.

## Contact Sheet

The contact sheet shows each character as:

1. exact source frame;
2. runtime scene crop;
3. difference overlay;
4. texture key, frame index, pass/fail, and diff score.

Use this sheet as the human-readable QA artifact before telling a user that source art matches runtime art.

## Known Limitations

Runtime character crops are conservative axis-aligned crops. If a character is rotated, the audit warns and may include extra background. The comparison masks transparent source pixels, so it focuses on the character body rather than the scene background behind the sprite.
