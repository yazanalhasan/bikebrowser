extends Node

# Startup validation for the canonical runtime architecture. This node is
# diagnostic only: it reports problems without taking ownership of gameplay.

const REGION_DATA_PATH := "res://Data/regions/regions.json"
const DIALOGUE_DIR := "res://Data/dialogue"
const MISSIONS_DIR := "res://Data/missions"
const NPC_DIR := "res://Regions/NPCs"
const PROJECT_REPORT_PATH := "res://project_audit/latest_runtime_validation.md"
const USER_REPORT_PATH := "user://runtime_validation_report.md"

var errors: Array = []
var warnings: Array = []
var details: Dictionary = {}

func _ready() -> void:
	await get_tree().process_frame
	run_validation()

func run_validation() -> Dictionary:
	errors.clear()
	warnings.clear()
	details.clear()
	_validate_autoloads()
	_validate_regions()
	_validate_quests()
	_validate_dialogue()
	_validate_npcs()
	_validate_audio()
	_write_reports()
	print("Runtime validation complete:")
	print("- errors: %d" % errors.size())
	print("- warnings: %d" % warnings.size())
	print("- quests loaded: %s" % details.get("quest_count", 0))
	print("- dialogue files: %s" % details.get("dialogue_count", 0))
	print("- regions: %s" % details.get("region_count", 0))
	print("- audio mappings: %s/%s" % [details.get("audio_mapped", 0), details.get("region_count", 0)])
	return get_report()

func get_report() -> Dictionary:
	return {
		"errors": errors,
		"warnings": warnings,
		"details": details
	}

func _validate_autoloads() -> void:
	var canonical := [
		"EventBus",
		"SaveService",
		"RegionRegistry",
		"QuestRegistry",
		"DiscoveryService",
		"InventoryManager",
		"DialogueManager",
		"RewardBridge",
		"AudioService"
	]
	var root := get_tree().root
	for autoload_name in canonical:
		if root.get_node_or_null(String(autoload_name)) == null:
			errors.append("Missing canonical autoload: %s" % autoload_name)
	var duplicate_runtimes := [
		"SaveManagerRuntime",
		"QuestGeneratorRuntime",
		"CraftingManagerRuntime",
		"CameraControllerRuntime",
		"EffectManagerRuntime",
		"TranslationManagerRuntime",
		"AchievementManagerRuntime"
	]
	for autoload_name in duplicate_runtimes:
		if root.get_node_or_null(String(autoload_name)) != null:
			warnings.append("Duplicate/generated runtime autoload is active: %s" % autoload_name)
	var addon_dialogue := _read_text("res://addons/DialogueSystem/DialogueManager.gd")
	if addon_dialogue.find("class_name DialogueManager") != -1:
		errors.append("Addon dialogue script still declares class_name DialogueManager")

func _validate_regions() -> void:
	var regions := _read_json(REGION_DATA_PATH)
	if regions.is_empty():
		errors.append("Missing or invalid region metadata: %s" % REGION_DATA_PATH)
		details["region_count"] = 0
		return
	details["region_count"] = regions.size()
	var region_ids: Array = []
	for region_id in regions.keys():
		region_ids.append(String(region_id))
		var region: Dictionary = regions[region_id]
		var scene_path := String(region.get("scenePath", ""))
		if scene_path.is_empty() or not ResourceLoader.exists(scene_path):
			errors.append("Region %s has missing scene path: %s" % [region_id, scene_path])
			continue
		var scene_text := _read_text(scene_path)
		var layout_path := _extract_assignment(scene_text, "layout_path")
		if not layout_path.is_empty() and not FileAccess.file_exists(layout_path):
			errors.append("Region %s layout path is missing: %s" % [region_id, layout_path])
		var spawns = region.get("spawns", {})
		if typeof(spawns) != TYPE_DICTIONARY or spawns.is_empty():
			warnings.append("Region %s has no spawn metadata" % region_id)
	details["region_ids"] = region_ids

func _validate_quests() -> void:
	var report := {}
	var quest_registry := get_node_or_null("/root/QuestRegistry")
	if quest_registry != null and quest_registry.has_method("get_validation_report"):
		report = quest_registry.get_validation_report()
	details["quest_count"] = int(report.get("quest_count", 0))
	details["quest_ids"] = report.get("quest_ids", [])
	var mission_file_count := _count_json_files(MISSIONS_DIR)
	details["mission_file_count"] = mission_file_count
	if details["quest_count"] != mission_file_count:
		errors.append("QuestRegistry loaded %d missions but %d mission JSON files exist" % [details["quest_count"], mission_file_count])
	for message in report.get("errors", []):
		errors.append("QuestRegistry: %s" % message)
	for message in report.get("warnings", []):
		warnings.append("QuestRegistry: %s" % message)

func _validate_dialogue() -> void:
	var report := {}
	var dialogue_manager := get_node_or_null("/root/DialogueManager")
	if dialogue_manager != null and dialogue_manager.has_method("validate_all_dialogues"):
		report = dialogue_manager.validate_all_dialogues()
	details["dialogue_count"] = int(report.get("dialogue_count", 0))
	details["dialogue_schemas"] = report.get("schemas", {})
	for message in report.get("errors", []):
		errors.append("DialogueManager: %s" % message)
	for message in report.get("warnings", []):
		warnings.append("DialogueManager: %s" % message)
	_validate_dialogue_quest_references(report.get("dialogue_ids", []))

func _validate_dialogue_quest_references(dialogue_ids: Array) -> void:
	var dialogue_manager := get_node_or_null("/root/DialogueManager")
	if dialogue_manager == null or not dialogue_manager.has_method("load_dialogue"):
		errors.append("DialogueManager autoload missing during dialogue quest reference validation")
		return
	for dialogue_id in dialogue_ids:
		var dialogue: Dictionary = dialogue_manager.load_dialogue(String(dialogue_id))
		var on_complete: Dictionary = dialogue.get("onComplete", {})
		if on_complete.get("type", "") == "start_quest":
			_validate_quest_id(String(on_complete.get("questId", "")), "dialogue %s onComplete" % dialogue_id)
		var tree: Dictionary = dialogue.get("dialogue_tree", {})
		for node_id in tree.keys():
			var node: Dictionary = tree[node_id]
			var action := String(node.get("action", ""))
			_validate_action_quest_reference(action, "dialogue %s node %s" % [dialogue_id, node_id])

func _validate_npcs() -> void:
	var npc_ids := {}
	var npc_count := 0
	var dir := DirAccess.open(NPC_DIR)
	if dir == null:
		warnings.append("Cannot open NPC directory: %s" % NPC_DIR)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".tscn"):
			npc_count += 1
			var path := NPC_DIR + "/" + file_name
			var text := _read_text(path)
			var npc_id := _extract_assignment(text, "npc_id")
			var dialogue_id := _extract_assignment(text, "dialogue_id")
			if npc_id.is_empty():
				warnings.append("NPC scene missing npc_id: %s" % path)
			elif npc_ids.has(npc_id):
				errors.append("Duplicate NPC id '%s' in %s and %s" % [npc_id, path, npc_ids[npc_id]])
			else:
				npc_ids[npc_id] = path
			if dialogue_id.is_empty():
				warnings.append("NPC scene missing dialogue_id: %s" % path)
			elif not FileAccess.file_exists(DIALOGUE_DIR + "/" + dialogue_id + ".json"):
				errors.append("NPC %s references missing dialogue: %s" % [npc_id, dialogue_id])
			if text.find("CollisionShape2D") == -1:
				warnings.append("NPC scene has no CollisionShape2D text reference: %s" % path)
			if text.find("AnimatedSprite2D") == -1 and text.find("Body") == -1:
				warnings.append("NPC scene has no obvious visual node: %s" % path)
		file_name = dir.get_next()
	dir.list_dir_end()
	details["npc_count"] = npc_count

func _validate_audio() -> void:
	var region_ids: Array = details.get("region_ids", [])
	var audio_errors: Array = []
	var audio_service := get_node_or_null("/root/AudioService")
	if audio_service != null and audio_service.has_method("validate_audio_mappings"):
		audio_errors = audio_service.validate_audio_mappings(region_ids)
	for message in audio_errors:
		errors.append("AudioService: %s" % message)
	details["audio_errors"] = audio_errors
	details["audio_mapped"] = region_ids.size() - audio_errors.size()
	if not DisplayServer.has_feature(DisplayServer.FEATURE_TEXT_TO_SPEECH):
		warnings.append("Native TTS unavailable on this platform")

func _validate_action_quest_reference(action: String, context: String) -> void:
	if action.is_empty():
		return
	var parts := action.split(" ")
	if parts.is_empty():
		return
	if parts[0] == "start_quest" or parts[0] == "complete_quest":
		if parts.size() < 2:
			errors.append("%s has %s action without quest id" % [context, parts[0]])
			return
		_validate_quest_id(parts[1], context)

func _validate_quest_id(quest_id: String, context: String) -> void:
	var quest_registry := get_node_or_null("/root/QuestRegistry")
	if quest_id.is_empty():
		errors.append("%s references empty quest id" % context)
	elif quest_registry != null and quest_registry.has_method("has_quest") and not quest_registry.has_quest(quest_id):
		errors.append("%s references missing quest id: %s" % [context, quest_id])

func _write_reports() -> void:
	var markdown := _build_markdown_report()
	_write_text(USER_REPORT_PATH, markdown)
	_write_text(PROJECT_REPORT_PATH, markdown)

func _build_markdown_report() -> String:
	var lines: Array = []
	lines.append("# Runtime Validation Report")
	lines.append("")
	lines.append("- Errors: %d" % errors.size())
	lines.append("- Warnings: %d" % warnings.size())
	lines.append("- Quests loaded: %s / mission files: %s" % [details.get("quest_count", 0), details.get("mission_file_count", 0)])
	lines.append("- Dialogue files normalized: %s" % details.get("dialogue_count", 0))
	lines.append("- Regions: %s" % details.get("region_count", 0))
	lines.append("- NPC scenes scanned: %s" % details.get("npc_count", 0))
	lines.append("")
	lines.append("## Errors")
	lines.append("")
	if errors.is_empty():
		lines.append("None.")
	else:
		for message in errors:
			lines.append("- %s" % message)
	lines.append("")
	lines.append("## Warnings")
	lines.append("")
	if warnings.is_empty():
		lines.append("None.")
	else:
		for message in warnings:
			lines.append("- %s" % message)
	lines.append("")
	lines.append("## Details")
	lines.append("")
	lines.append("```json")
	lines.append(JSON.stringify(details, "\t"))
	lines.append("```")
	return "\n".join(lines)

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _read_text(path: String) -> String:
	if not FileAccess.file_exists(path):
		return ""
	return FileAccess.get_file_as_string(path)

func _write_text(path: String, text: String) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		warnings.append("Could not write validation report: %s" % path)
		return
	file.store_string(text)

func _count_json_files(path: String) -> int:
	var dir := DirAccess.open(path)
	if dir == null:
		return 0
	var count := 0
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			count += 1
		file_name = dir.get_next()
	dir.list_dir_end()
	return count

func _extract_assignment(text: String, property_name: String) -> String:
	var pattern := property_name + "\\s*=\\s*\"([^\"]*)\""
	var regex := RegEx.new()
	if regex.compile(pattern) != OK:
		return ""
	var match := regex.search(text)
	if match == null:
		return ""
	return match.get_string(1)
