extends Node

const INTEGRATED_PROJECTS := {
	"1": "ReusableUI",
	"2": "NameGenerator",
	"3": "DialogueSystem",
	"4": "ProceduralQuest",
	"5": "InventorySystem",
	"6": "DialogueWriter",
	"7": "PaletteGenerator",
	"8": "QuestVisualizer",
	"9": "SfxGenerator",
	"10": "PixelUpscaler",
	"11": "SaveSystem",
	"12": "CameraSystem",
	"13": "EffectPool",
	"14": "Localization",
	"15": "AchievementSystem",
	"16": "QuestValidator",
	"17": "DialogueRandomizer",
	"18": "SpritePacker",
	"19": "TerrainGenerator",
	"20": "VoicePromptGenerator"
}

var _logged_boot := false

func _ready() -> void:
	_connect_game_events()
	call_deferred("_finish_boot_integration")

func get_integrated_projects() -> Dictionary:
	return INTEGRATED_PROJECTS.duplicate(true)

func get_runtime_status() -> Dictionary:
	return {
		"autoloads": {
			"name_generator": _has_root("NameGeneratorRuntime"),
			"quest_generator": _has_root("QuestGeneratorRuntime"),
			"crafting": _has_root("CraftingManagerRuntime"),
			"save_manager": _has_root("SaveManagerRuntime"),
			"camera": _has_root("CameraControllerRuntime"),
			"effects": _has_root("EffectManagerRuntime"),
			"localization": _has_root("TranslationManagerRuntime"),
			"achievements": _has_root("AchievementManagerRuntime")
		},
		"projects": INTEGRATED_PROJECTS.keys()
	}

func _finish_boot_integration() -> void:
	_load_crafting_recipes()
	_start_region_audio()
	_log_boot_status()

func _connect_game_events() -> void:
	if not _has_root("EventBus"):
		return
	var event_bus := get_node("/root/EventBus")
	if not event_bus.quest_completed.is_connected(_on_quest_completed):
		event_bus.quest_completed.connect(_on_quest_completed)
	if not event_bus.reward_feedback.is_connected(_on_reward_feedback):
		event_bus.reward_feedback.connect(_on_reward_feedback)

func _load_crafting_recipes() -> void:
	var crafting := get_node_or_null("/root/CraftingManagerRuntime")
	if crafting != null and crafting.has_method("load_recipes"):
		crafting.load_recipes("recipes.json")

func _start_region_audio() -> void:
	var audio := get_node_or_null("/root/AudioService")
	var registry := get_node_or_null("/root/RegionRegistry")
	if audio == null or not audio.has_method("play_region_bed"):
		return
	var region_id := "neighborhood_street"
	if registry != null and "current_region_id" in registry:
		region_id = String(registry.current_region_id)
	if region_id == "boot" or region_id.is_empty():
		region_id = "neighborhood_street"
	audio.play_region_bed(region_id)

func _log_boot_status() -> void:
	if _logged_boot:
		return
	_logged_boot = true
	if _has_root("EventBus"):
		get_node("/root/EventBus").log_debug("Projects 1-20 integration ready", get_runtime_status())

func _on_quest_completed(quest_id: String) -> void:
	var achievements := get_node_or_null("/root/AchievementManagerRuntime")
	if achievements == null or not achievements.has_method("unlock"):
		return
	match quest_id:
		"chain_repair":
			achievements.unlock("chain_hero")
		"water_quality_test":
			achievements.unlock("water_scientist")
		"bridge_quest_4":
			achievements.unlock("bridge_engineer")

func _on_reward_feedback(_reward: Dictionary) -> void:
	var effects := get_node_or_null("/root/EffectManagerRuntime")
	if effects != null and effects.has_method("cleanup_old_effects"):
		effects.cleanup_old_effects()

func _has_root(node_name: String) -> bool:
	return get_node_or_null("/root/" + node_name) != null
