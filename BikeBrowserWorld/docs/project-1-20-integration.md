# Projects 1-20 Integration Map

BikeBrowserWorld now boots with the current neighborhood scene and has the reusable projects copied into the Godot project.

## Boot Runtime

The active main scene remains:

```text
res://Regions/Neighborhood/NeighborhoodStreet.tscn
```

The runtime integration autoload is:

```text
res://Core/ProjectIntegration/ProjectIntegration.gd
```

It initializes safe optional systems, loads crafting recipes, starts current-region audio, and connects achievement unlocks to quest completion.

## Demo Scenes

The integrated projects are organized into showcase scenes under:

```text
res://Regions/SystemShowcase/
```

Open the hub scene in Godot to browse them:

```text
res://Regions/SystemShowcase/SystemShowcase.tscn
```

Available demos:

```text
res://Regions/SystemShowcase/UiComponentsDemo.tscn
res://Regions/SystemShowcase/RuntimeSystemsDemo.tscn
res://Regions/SystemShowcase/ToolHelpersDemo.tscn
```

The region registry also includes `system_showcase`, so code can route there with:

```gdscript
RegionRegistry.change_region("system_showcase")
```

## Runtime Autoloads Added

```text
NameGeneratorRuntime      res://addons/NameGenerator/name_generator.gd
QuestGeneratorRuntime     res://addons/ProceduralQuest/quest_generator.gd
CraftingManagerRuntime    res://addons/InventorySystem/crafting.gd
SaveManagerRuntime        res://SaveSystem/SaveManager.gd
CameraControllerRuntime   res://CameraSystem/CameraController.gd
EffectManagerRuntime      res://EffectPool/EffectManager.gd
TranslationManagerRuntime res://Localization/TranslationManager.gd
AchievementManagerRuntime res://AchievementSystem/AchievementManager.gd
ProjectIntegration        res://Core/ProjectIntegration/ProjectIntegration.gd
```

Names use a `Runtime` suffix to avoid conflicts with each script's `class_name`.

## Project Status

| # | Project | Godot Project Location | Boot Runtime Status |
|---|---|---|---|
| 1 | Reusable UI | `res://addons/ReusableUI/` | Available as reusable scenes/scripts |
| 2 | Name Generator | `res://addons/NameGenerator/` | Autoloaded as `NameGeneratorRuntime` |
| 3 | Dialogue System | `res://addons/DialogueSystem/` | Available as addon; existing game dialogue remains active |
| 4 | Procedural Quest | `res://addons/ProceduralQuest/` | Autoloaded as `QuestGeneratorRuntime` |
| 5 | Inventory/Crafting | `res://addons/InventorySystem/` | Crafting autoloaded as `CraftingManagerRuntime`; existing `InventoryManager` remains active |
| 6 | Dialogue Writer | `C:/Users/yazan/tools/dialogue_writer/` | External content tool |
| 7 | Palette Generator | `C:/Users/yazan/tools/palette_generator/` | External art tool |
| 8 | Quest Visualizer | `C:/Users/yazan/tools/quest_visualizer/` | External quest tool |
| 9 | SFX Generator | `C:/Users/yazan/tools/sfx_generator/` | External audio prompt tool |
| 10 | Pixel Upscaler | `C:/Users/yazan/tools/pixel_upscaler/` | External art tool; Godot helper available in source tool folder |
| 11 | Save System | `res://SaveSystem/` | Autoloaded as `SaveManagerRuntime`; existing `SaveService` remains active |
| 12 | Camera System | `res://CameraSystem/` | Autoloaded as `CameraControllerRuntime` |
| 13 | Effect Pool | `res://EffectPool/` | Autoloaded as `EffectManagerRuntime` |
| 14 | Localization | `res://Localization/` | Autoloaded as `TranslationManagerRuntime` |
| 15 | Achievement System | `res://AchievementSystem/` | Autoloaded as `AchievementManagerRuntime` |
| 16 | Quest Validator | `res://addons/ToolHelpers/QuestValidator/QuestValidator.gd` | Editor/helper script available; Python tool remains external |
| 17 | Dialogue Randomizer | `res://addons/ToolHelpers/VariationPicker.gd` | Runtime helper available; Python tool remains external |
| 18 | Sprite Packer | `res://addons/ToolHelpers/AtlasLoader.gd` | Runtime atlas loader available; Python tool remains external |
| 19 | Terrain Generator | `res://addons/TerrainGenerator/` | Editor addon available |
| 20 | Voice Prompt Generator | `C:/Users/yazan/tools/voice_prompt_generator/` | External TTS prompt tool |

## Verification

Startup parse check:

```powershell
godot --headless --path C:/Users/yazan/bikebrowser/BikeBrowserWorld --quit
```

Result: project starts without GDScript parse errors.

The existing vertical slice test still reports the pre-existing `flat_tire_repair` reward assertion failure. That is separate from this integration pass.
