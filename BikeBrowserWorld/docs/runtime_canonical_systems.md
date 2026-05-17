# Runtime Canonical Systems

This document records which systems are authoritative during live gameplay. Generated addons and reusable libraries remain in the project, but they do not own gameplay state unless explicitly bridged through a canonical core system.

| Domain | Canonical Runtime | Library / Demo Systems | Notes |
| --- | --- | --- | --- |
| Events | `res://Core/EventBus/EventBus.gd` | none | Central signal hub for gameplay. |
| Regions | `res://Core/RegionRegistry/RegionRegistry.gd` | `res://addons/TerrainGenerator/` | Region loading is JSON-driven through `Data/regions/regions.json`. |
| Save | `res://Core/SaveService/SaveService.gd` | `res://SaveSystem/SaveManager.gd`, `AutoSaveManager.gd`, `CloudSyncAdapter.gd` | SaveService owns gameplay save payloads. Generated save slots are library/demo code. |
| Dialogue | `res://Core/DialogueManager/DialogueManager.gd` | `res://addons/DialogueSystem/` | Gameplay must call `/root/DialogueManager`; addon graph dialogue is demoted to `AddonDialogueGraphManager`. |
| Quests | `res://Core/QuestRegistry/QuestRegistry.gd` | `res://addons/ProceduralQuest/` | QuestRegistry loads `Data/missions/*.json` and owns live quest state. |
| Inventory | `res://Core/InventoryManager/InventoryManager.gd` | `res://addons/InventorySystem/` | Core inventory owns first-loop gameplay inventory. |
| Rewards | `res://Core/RewardBridge/RewardBridge.gd` | `res://AchievementSystem/` | RewardBridge owns moment-to-moment reward feedback. Achievements can be bridged later. |
| Audio | `res://Core/AudioService/AudioService.gd` | external generation tools | AudioService owns region music, stingers, and TTS fallback behavior. |
| Player | `res://Systems/World/ZuzuController.gd` | `res://CameraSystem/` | ZuzuController owns player movement and player group participation. |

## Demoted Runtime Autoloads

The following generated runtimes were removed from `project.godot` autoloads to prevent duplicate state authority:

- `NameGeneratorRuntime`
- `QuestGeneratorRuntime`
- `CraftingManagerRuntime`
- `SaveManagerRuntime`
- `CameraControllerRuntime`
- `EffectManagerRuntime`
- `TranslationManagerRuntime`
- `AchievementManagerRuntime`

The files remain available as libraries and demos.
