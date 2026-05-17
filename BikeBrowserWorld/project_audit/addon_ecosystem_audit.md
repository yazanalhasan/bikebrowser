# Addon Ecosystem Audit

## Addon Matrix

| Addon | plugin.cfg | Script | Status |
| --- | --- | --- | --- |
| Aseprite Wizard | addons/AsepriteWizard/plugin.cfg | plugin.gd | installed/disabled |
| DialogueSystem | addons/DialogueSystem/plugin.cfg | dialogue_system_plugin.gd | installed/disabled |
| InventorySystem | addons/InventorySystem/plugin.cfg | inventory_system_plugin.gd | installed/disabled |
| NameGenerator | addons/NameGenerator/plugin.cfg | name_generator_plugin.gd | installed/disabled |
| Aseprite Importers | addons/nklbdev.aseprite_importers/plugin.cfg | editor_plugin.gd | installed/disabled |
| Importality | addons/nklbdev.importality/plugin.cfg | editor_plugin.gd | enabled |
| ProceduralQuest | addons/ProceduralQuest/plugin.cfg | procedural_quest_plugin.gd | installed/disabled |
| ReusableUI | addons/ReusableUI/plugin.cfg | scripts/reusable_ui_plugin.gd | installed/disabled |
| TerrainGenerator | addons/TerrainGenerator/plugin.cfg | TerrainGeneratorPlugin.gd | installed/disabled |

## Findings

- ACTIVE EDITOR ADDON: `nklbdev.importality`.
- INSTALLED/DISABLED: ReusableUI, NameGenerator, DialogueSystem, ProceduralQuest, InventorySystem, TerrainGenerator, AsepriteWizard.
- RUNTIME AUTOLOADED: Some disabled addons are still used as runtime autoloads.
- GENERATED BUT UNUSED: Many addons are complete library/demo systems rather than active gameplay features.
- RISK: Addon global classes can collide with core autoload expectations.
