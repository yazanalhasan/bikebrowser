# Act 1 Excluded Dirty Worktree

Date: 2026-05-27

These files were intentionally excluded from the Act 1 `/game-rebuild` commit scope.

## Unrelated Godot Work

- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.gd`
- `BikeBrowserWorld/Prototypes/EmbodiedMechanics/TireRig.tscn`
- `public/godot/BikeBrowserWorld/index.html`
- `public/godot/BikeBrowserWorld/version.json`

## Unrelated Art / Generated Assets

- `BikeBrowserWorld/Assets/Props/BikeRepair/exposed_inner_tube.*`
- `BikeBrowserWorld/Assets/Props/BikeRepair/tire_repair_mat_base.*`
- `BikeBrowserWorld/Assets/Props/BikeRepair/tube_puncture_marker.*`
- `graphics_review_export/`
- `screenshot_baselines/`
- `screenshots/bike_graphics_after_reexport.png`
- `screenshots/legacy_game.png`
- `screenshots/mobile_game_after_clear_color.png`
- `visual_diffs/`
- `project_audit/screenshots/bike_repair_visual_correctness_rescue/*`
- `project_audit/screenshots/whole_game_quest_audit/`
- `project_audit/screenshots/game_rebuild_neighborhood.png`

## Unrelated Audits

- `project_audit/bike_repair_quests_and_bike_images_browser_review.html`
- `project_audit/bike_repair_snapshot_current_2026-05-21*`
- `project_audit/codex_exploration_checkpoint_2026-05-18.md`
- `project_audit/game_playtest_tire_repair_20260527.md`
- `project_audit/interactive_quest_playtest_audit_2026-05-22.md`
- `project_audit/openclaw_*`
- `project_audit/phaser_to_godot_content_parity_audit_2026-05-20.md`
- `project_audit/region_tscn_bundle_for_browser_review_DO_NOT_USE_OPENCLAW.md`
- `project_audit/runtime_environment_standardization.md`
- `project_audit/startup_cleanup_*`
- `project_audit/tire_repair_*`
- `project_audit/tirerig_*`
- `project_audit/visual_runtime_analysis_ux_playtest.json`
- `project_audit/visual_runtime_capture*.json`
- `project_audit/visual_runtime_screens*/`

## Unrelated Tooling

- `tools/comfyui-batch-notes.ps1`
- `tools/comfyui-healthcheck.ps1`
- `tools/open-bikebrowser-concepts.ps1`
- `tools/start-comfyui.ps1`
- `project_audit/comfyui_*`
- `project_audit/creative_toolchain_audit.md`
- `project_audit/gpu_cuda_pytorch_audit.md`
- `project_audit/ideal_bikebrowser_pipeline.md`
- `project_audit/missing_tool_install_plan.md`
- `project_audit/openclaw_ai_tooling_audit.md`
- `project_audit/visual_truth_agent_spec.md`
- `project_audit/vscode_workflow_setup.md`
- `project_audit/workstation_*`

## Uncertain / Manual Review Needed

- `backups/openclaw_bike_graphics_20260521_0802/`
- `long_path_import_2026-05-18/`
- `project_audit/visual_runtime_analysis.json`

`project_audit/visual_runtime_analysis.json` is Act 1 validation-related, but it lives in a broad scratch/audit directory with many unrelated untracked files. The committed Act 1 reports record the CUDA result instead.
