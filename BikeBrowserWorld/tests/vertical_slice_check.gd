extends SceneTree

var failures: Array[String] = []
var observed_quest_started := false
var observed_reward_payload: Dictionary = {}

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var neighborhood_scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	var garage_scene: PackedScene = load("res://Regions/Garage/ZuzuGarage.tscn")
	var tire_station_scene: PackedScene = load("res://Regions/Garage/TireRepairStation.tscn")
	var dialogue_data = JSON.parse_string(FileAccess.get_file_as_string("res://Data/dialogue/mr_chen_chain.json"))
	var quest_data = JSON.parse_string(FileAccess.get_file_as_string("res://Data/missions/chain_repair.json"))
	var tire_quest_data = JSON.parse_string(FileAccess.get_file_as_string("res://Data/missions/flat_tire_repair.json"))

	_assert(neighborhood_scene != null, "NeighborhoodStreet scene loads")
	_assert(garage_scene != null, "ZuzuGarage scene loads")
	_assert(tire_station_scene != null, "TireRepairStation scene loads")
	if neighborhood_scene == null or garage_scene == null:
		for failure in failures:
			push_error(failure)
		quit(1)
		return
	_assert(typeof(dialogue_data) == TYPE_DICTIONARY, "Mr. Chen dialogue data loads")
	_assert(typeof(quest_data) == TYPE_DICTIONARY and quest_data.get("id") == "chain_repair", "chain_repair quest data loads")
	_assert(typeof(tire_quest_data) == TYPE_DICTIONARY and tire_quest_data.get("id") == "flat_tire_repair", "flat_tire_repair quest data loads")

	var neighborhood: Node = neighborhood_scene.instantiate()
	root.add_child(neighborhood)
	await process_frame

	_assert(neighborhood.get_node_or_null("Player") is CharacterBody2D, "Neighborhood has Zuzu CharacterBody2D")
	_assert(neighborhood.get_node_or_null("MrChen") is Area2D, "Neighborhood has Mr. Chen interaction Area2D")
	_assert(neighborhood.get_node_or_null("GarageEntrance") is Area2D, "Neighborhood has garage entrance transition")
	_assert(neighborhood.get_node_or_null("DesertPlants") is Node2D, "Neighborhood has desert plant storytelling props")
	_assert(neighborhood.get_node_or_null("BikeRamp") is Node2D, "Neighborhood has playful bike ramp prop")
	_assert(neighborhood.get_node_or_null("Player/Shadow") is Polygon2D, "Zuzu has grounding shadow")
	_assert(neighborhood.get_node_or_null("Player/Head") is Polygon2D, "Zuzu has a readable character silhouette")
	_assert(neighborhood.get_node_or_null("MrChen/AnimatedSprite2D") is AnimatedSprite2D, "Mr. Chen uses production animated sprite art")

	var garage: Node = garage_scene.instantiate()
	root.add_child(garage)
	await process_frame

	_assert(garage.get_node_or_null("Player") is CharacterBody2D, "Garage has Zuzu CharacterBody2D")
	_assert(garage.get_node_or_null("ChainHotspot") is Area2D, "Garage has chain hotspot Area2D")
	_assert(garage.get_node_or_null("TireRepairStation") is Area2D, "Garage has tactile tire repair station")
	_assert(garage.get_node_or_null("ExitZone") is Area2D, "Garage has exit transition")
	_assert(garage.get_node_or_null("ToolWall") is Node2D, "Garage has repair clutter storytelling props")
	_assert(garage.get_node_or_null("Player/Shadow") is Polygon2D, "Garage Zuzu has grounding shadow")
	_assert(garage.get_node_or_null("FloorLayer") is Node2D, "Garage has production floor layer")
	_assert(garage.get_node_or_null("WallLayer") is Node2D, "Garage has production wall layer")
	_assert(garage.get_node_or_null("ShadowLayer") is Node2D, "Garage has production shadow layer")
	_assert(garage.get_node_or_null("PropLayer") is Node2D, "Garage has production prop layer")
	_assert(garage.get_node_or_null("InteractableLayer") is Node2D, "Garage has production interactable layer")
	_assert(garage.get_node_or_null("LightingLayer") is Node2D, "Garage has production lighting layer")
	_assert(garage.get_node_or_null("FXLayer") is Node2D, "Garage has production FX layer")
	_assert(garage.get_node_or_null("NPCLayer") is Node2D, "Garage has production NPC layer")
	_assert(garage.get_node_or_null("PlayerLayer") is Node2D, "Garage has production player layer")
	_assert(garage.get_node_or_null("FloorLayer/FloorTiles") is TileMapLayer, "Garage has TileMapLayer-ready floor scaffold")
	_assert(FileAccess.file_exists("res://Data/environment_kits/garage_kit.json"), "Garage kit manifest exists")
	_assert(FileAccess.file_exists("res://Assets/Environment/GarageKit/workbench.svg"), "Garage kit includes production workbench asset")
	_assert(FileAccess.file_exists("res://docs/art-pipeline.md"), "Art pipeline documentation exists")
	_assert(FileAccess.file_exists("res://docs/aseprite-setup.md"), "Aseprite setup documentation exists")
	_assert(FileAccess.file_exists("res://docs/godot-art-import.md"), "Godot art import documentation exists")
	_assert(FileAccess.file_exists("res://docs/visual-production-rules.md"), "Visual production rules exist")
	_assert(FileAccess.file_exists("res://docs/zuzu-character-guide.md"), "Zuzu protagonist character guide exists")
	_assert(FileAccess.file_exists("res://tools/export_sprites.bat"), "Aseprite sprite export automation exists")
	_assert(FileAccess.file_exists("res://tools/export_tilesets.bat"), "Aseprite tileset export automation exists")
	_assert(FileAccess.file_exists("res://tools/aseprite/create_starter_assets.lua"), "Starter Aseprite asset generator exists")
	_assert(FileAccess.file_exists("res://Assets/Characters/Zuzu/Zuzu_idle.aseprite"), "Zuzu idle Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Characters/Zuzu/Zuzu_walk.aseprite"), "Zuzu walk Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Characters/NPCs/MrChen/MrChen_idle.aseprite"), "Mr. Chen idle Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Characters/NPCs/MrChen/MrChen_talk.png"), "Mr. Chen production talk sheet exists")
	_assert(FileAccess.file_exists("res://Assets/Environment/GarageKit/garage_floor_tiles.aseprite"), "Garage floor Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Environment/GarageKit/garage_wall_tiles.aseprite"), "Garage wall Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Environment/GarageKit/garage_props.aseprite"), "Garage props Aseprite source exists")
	_assert(FileAccess.file_exists("res://Assets/Exports/Spritesheets/Zuzu_idle.png"), "Zuzu idle sprite sheet export exists")
	_assert(FileAccess.file_exists("res://Assets/Exports/Spritesheets/Zuzu_idle.json"), "Zuzu idle sprite metadata export exists")
	_assert(FileAccess.file_exists("res://Assets/Characters/NPCs/MrChen/MrChen_idle.png"), "Mr. Chen production sprite sheet exists")
	_assert(FileAccess.file_exists("res://Assets/Exports/Tilesets/garage_floor_tiles.png"), "Garage floor tileset export exists")
	_assert(FileAccess.file_exists("res://Assets/Exports/Tilesets/workbench.png"), "Workbench tileset export exists")

	var event_bus: Node = root.get_node_or_null("EventBus")
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	var save_service: Node = root.get_node_or_null("SaveService")
	var audio_service: Node = root.get_node_or_null("AudioService")
	_assert(event_bus != null, "EventBus autoload is available")
	_assert(quest_registry != null, "QuestRegistry autoload is available")
	_assert(save_service != null, "SaveService autoload is available")
	_assert(audio_service != null, "AudioService autoload is available for atmosphere")
	_assert(audio_service.has_method("unlock_audio"), "AudioService exposes explicit unlock flow")
	_assert(audio_service.has_method("speak"), "AudioService exposes browser TTS fallback")
	_assert(audio_service.has_method("play_region_bed"), "AudioService can switch ambience/music by region")

	var boot_scene: PackedScene = load("res://Regions/Boot/Boot.tscn")
	var boot: Node = boot_scene.instantiate()
	root.add_child(boot)
	await process_frame
	_assert(boot.get_node_or_null("Center/Panel/VBox/AudioUnlockHint") is Label, "Boot screen has audio unlock hint")
	boot.queue_free()
	if quest_registry.quests.is_empty():
		quest_registry._ready()
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()

	event_bus.quest_started.connect(func(quest_id: String) -> void:
		observed_quest_started = true
	)
	event_bus.reward_intent.connect(func(payload: Dictionary) -> void:
		observed_reward_payload = payload
	)
	var started: bool = quest_registry.start_quest("chain_repair")
	quest_registry.record_objective("chain_repair", "inspect_chain")
	quest_registry.record_objective("chain_repair", "rotate_pedals")
	quest_registry.record_objective("chain_repair", "align_chain")
	quest_registry.record_objective("chain_repair", "seat_chain")
	quest_registry.record_objective("chain_repair", "test_rotation")
	await process_frame

	_assert(started, "chain_repair starts from QuestRegistry")
	_assert(observed_quest_started, "chain_repair emits quest_started")
	_assert(observed_reward_payload.get("type") == "reward_intent", "chain_repair emits reward_intent")
	_assert(observed_reward_payload.get("questId") == "chain_repair", "reward_intent includes quest id")
	_assert(save_service.SAVE_KEY == "bikebrowser_godot_test_save", "Godot save key remains isolated")

	observed_quest_started = false
	observed_reward_payload = {}
	var tire_started: bool = quest_registry.start_quest("flat_tire_repair")
	quest_registry.record_objective("flat_tire_repair", "inspect_wheel")
	quest_registry.record_objective("flat_tire_repair", "remove_tube")
	quest_registry.record_objective("flat_tire_repair", "apply_patch")
	quest_registry.record_objective("flat_tire_repair", "inflate_tire")
	await process_frame

	_assert(tire_started, "flat_tire_repair starts from QuestRegistry")
	_assert(observed_quest_started, "flat_tire_repair emits quest_started")
	_assert(observed_reward_payload.get("questId") == "flat_tire_repair", "flat_tire_repair emits reward_intent")
	_assert(observed_reward_payload.get("badge") == "Patch Hero", "flat_tire_repair reward includes badge feedback")

	if failures.is_empty():
		print("BikeBrowserWorld vertical slice check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
