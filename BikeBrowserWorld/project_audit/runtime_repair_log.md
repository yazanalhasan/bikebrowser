# Runtime Repair Log

Branch: `repair/runtime-canonicalization`

## Baseline Validation

- Ran Godot headless scene checks for Neighborhood, Garage, Mine, Desert, River, SystemShowcase, HUD, and DialogBox.
- No parse errors or missing-resource errors were reported.
- Godot emitted one-shot shutdown warnings about ObjectDB/resources still in use, matching the prior audit caveat.

## Changes

### `addons/DialogueSystem/DialogueManager.gd`

- Reason: Prevent global `class_name DialogueManager` from shadowing the canonical autoload.
- Before: Addon declared `class_name DialogueManager`.
- After: Addon declares `class_name AddonDialogueGraphManager`.
- Validation: Headless scene parse check after patch.

### `addons/DialogueSystem/dialogue_system_plugin.gd`

- Reason: Keep addon editor plugin aligned with renamed addon manager.
- Before: Plugin registered an addon autoload named `DialogueManager`.
- After: Plugin registers `AddonDialogueGraphManager`.
- Validation: Static review; plugin is installed but not currently enabled.

### `Core/EventBus/EventBus.gd`

- Reason: Allow TTS fallback to be visible to HUD/debug tooling.
- Before: No `tts_unavailable` signal.
- After: Added `signal tts_unavailable(text)`.
- Validation: Pending final headless validation.

### `Core/DialogueManager/DialogueManager.gd`

- Reason: Make canonical dialogue runtime tolerate all existing dialogue schemas.
- Before: Loaded raw dialogue JSON and expected consumers to handle schema details.
- After: Normalizes `lines`, `dialogue_tree`, and `nodes` into a common internal tree and compatibility `lines` array.
- Validation: Pending final runtime validation report.

### `Core/QuestRegistry/QuestRegistry.gd`

- Reason: Runtime only loaded two missions while 18 mission JSON files exist.
- Before: Hardcoded `chain_repair` and `flat_tire_repair`.
- After: Scans `res://Data/missions/*.json`, validates IDs/references, and preserves public quest API.
- Validation: Pending final runtime validation report.

### `Core/AudioService/AudioService.gd`

- Reason: Some registered regions had no explicit music mapping and TTS could fail silently.
- Before: No mapping for `boot`, `desert_trail`, or `system_showcase`; native TTS only debug-logged unavailable support.
- After: Every registered region maps to a track; missing music falls back with warnings; native TTS emits `tts_unavailable`.
- Validation: Pending final runtime validation report.

### `Core/RuntimeValidator/RuntimeValidator.gd`

- Reason: Prevent content/runtime graph drift from silently returning.
- Before: No startup validation report.
- After: Validates canonical autoloads, regions, quests, dialogue, NPCs, and audio; writes reports to `user://runtime_validation_report.md` and `res://project_audit/latest_runtime_validation.md`.
- Validation: Pending final headless boot.

### `project.godot`

- Reason: Demote generated runtime systems so canonical core systems own gameplay state.
- Before: Generated runtime autoloads were active.
- After: Removed generated runtime autoloads and added `RuntimeValidator`.
- Validation: Headless boots of the major scenes load with QuestRegistry showing 18 missions and RuntimeValidator showing 0 errors / 1 warning.

### `docs/runtime_canonical_systems.md`

- Reason: Document canonical runtime ownership for future development.
- Before: No explicit canonical ownership table.
- After: Added domain-by-domain ownership and demoted runtime list.
- Validation: Documentation only.

### `addons/DialogueSystem/README.md`

- Reason: Avoid future copy-paste of bare `DialogueManager` references from addon docs.
- Before: Addon README examples used `DialogueManager`.
- After: Addon README examples use `AddonDialogueGraphManager`.
- Validation: Text-only documentation update.

### `Core/RegionRegistry/RegionRegistry.gd`, `Core/SaveService/SaveService.gd`, `Core/InventoryManager/InventoryManager.gd`, `Core/RewardBridge/RewardBridge.gd`, `Systems/World/ZuzuController.gd`

- Reason: Mark canonical runtime ownership directly in code.
- Before: No explicit canonical ownership comments.
- After: Added short `CANONICAL RUNTIME SYSTEM` comments.
- Validation: Headless scene parse checks.

## Validation Results

### Runtime Smoke

- Command: `godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --script res://project_audit/runtime_repair_smoke.gd`
- Result: Script printed `runtime_repair_smoke: PASS`.
- Caveat: Godot still emitted the same one-shot shutdown ObjectDB/resource warnings seen during the audit.

### Runtime Validator

- Report: `project_audit/latest_runtime_validation.md`
- Errors: 0
- Warnings: 1 (`Native TTS unavailable on this platform`)
- Quests loaded: 18 / 18 mission files
- Dialogue files normalized: 21
- Regions: 7
- Audio mappings: 7 / 7

### Headless Scene Check

- Checked Neighborhood, Garage, Mine, Desert, River, SystemShowcase, RuntimeSystemsDemo, HUD, and DialogBox.
- No script parse errors or missing-resource errors were reported.
- Godot emitted the known shutdown ObjectDB/resource warnings on one-shot headless scene loads.

### Main Project Headless Boot

- Command: `godot --headless --path C:\Users\yazan\bikebrowser\BikeBrowserWorld --quit`
- Result: exit code 0.
- RuntimeValidator summary: 0 errors, 1 warning, 7/7 audio mappings.
- Caveat: same known ObjectDB/resource shutdown warnings.
