# ComfyUI Pipeline Final Report

Date: 2026-05-26

## Status

ComfyUI/SDXL is integrated as BikeBrowser's local concept and staging layer.

## Installed Path

- `C:\AI\ComfyUI`

## Active Models

- Working: `sd_xl_base_1.0.safetensors`
- Blocked: local Flux.1-dev weights are not installed yet

## Available Workflows

- `C:\AI\BikeBrowserConcepts\02_workflows\sdxl_tire_repair_smoke_api_workflow.json`

## Generation Status

- SDXL generation works.
- On RTX 5090, launch with `--disable-xformers` for now.
- Test output: `C:\AI\BikeBrowserConcepts\tire_repair\sdxl_smoke_tire_repair_00001_.png`

## Helper Scripts

- `tools\start-comfyui.ps1`
- `tools\comfyui-healthcheck.ps1`
- `tools\open-bikebrowser-concepts.ps1`
- `tools\comfyui-batch-notes.ps1`

## Concept Workspace

Created and documented:

- `C:\AI\BikeBrowserConcepts`

## Prompt Library

Created:

- `project_audit\comfyui_prompt_library.md`

Prompt families cover:

- tire repair
- chain repair
- bridge notebook
- workshop synthesis
- plant cards
- Salt River evidence
- copper conductivity
- NPC mood studies
- UI notebook pages

## Visual-Truth-Agent

Created:

- `project_audit\visual_truth_agent_spec.md`

The agent's job is to reject visually misleading mechanics even when the implementation technically functions.

## First Concept Batch Briefs

Created:

- `project_audit\comfyui_first_concept_batches.md`

First batches:

- Tire Repair Close-Up Repair Mat
- Chain Repair Mechanic-Eye Drivetrain
- Bridge Notebook Page

## Blockers

- Flux local generation remains blocked until gated model access is accepted and weights are downloaded.
- ControlNet custom nodes are installed, but ControlNet model weights are not installed.
- xformers is not reliable for RTX 5090 in this environment; use PyTorch attention.

## Next Recommended Action

Run the first real tire repair batch: 20 SDXL outputs, select 5, create one final Aseprite brief, then author the tire repair mat in Aseprite and validate it in Godot screenshots.
