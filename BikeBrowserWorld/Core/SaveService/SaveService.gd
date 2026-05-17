extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay save payload writer. Generated save
# slot systems are library/demo systems unless explicitly bridged here.

const SAVE_KEY := "bikebrowser_godot_test_save"
const PHASER_SAVE_KEY := "bikebrowser_game_save"
const LOCAL_SAVE_PATH := "user://bikebrowser_godot_test_save.json"

var last_save: Dictionary = {}

func build_save_payload(reason: String = "manual") -> Dictionary:
	return {
		"schemaVersion": 1,
		"saveKey": SAVE_KEY,
		"reason": reason,
		"profile": {
			"activeChild": "zaydan"
		},
		"world": {
			"currentRegion": RegionRegistry.current_region_id,
			"currentSpawn": RegionRegistry.current_spawn_id
		},
		"regions": RegionRegistry.serialize(),
		"quests": QuestRegistry.serialize(),
		"inventory": InventoryManager.serialize(),
		"discoveries": DiscoveryService.serialize(),
		"domains": {
			"mechanics": {
				"active": true
			}
		},
		"bridge": {
			"mode": "prototype"
		},
		"timestamp": Time.get_datetime_string_from_system(true)
	}

func save_now(reason: String = "manual") -> Dictionary:
	var payload := build_save_payload(reason)
	last_save = payload
	_write_payload(payload)
	EventBus.save_requested.emit(payload)
	CompanionBridge.send_event({
		"type": "save_requested",
		"saveKey": SAVE_KEY,
		"save": payload
	})
	return payload

func load_saved_payload() -> Dictionary:
	if OS.has_feature("web"):
		var window = JavaScriptBridge.get_interface("window")
		var raw = window.localStorage.getItem(SAVE_KEY)
		if typeof(raw) == TYPE_STRING and raw.length() > 0:
			var parsed = JSON.parse_string(raw)
			if typeof(parsed) == TYPE_DICTIONARY:
				last_save = parsed
				return parsed
	else:
		if FileAccess.file_exists(LOCAL_SAVE_PATH):
			var raw_text := FileAccess.get_file_as_string(LOCAL_SAVE_PATH)
			var parsed = JSON.parse_string(raw_text)
			if typeof(parsed) == TYPE_DICTIONARY:
				last_save = parsed
				return parsed
	return {}

func _write_payload(payload: Dictionary) -> void:
	var serialized := JSON.stringify(payload)
	if serialized.contains(PHASER_SAVE_KEY):
		push_error("Refusing to write a Godot save payload that references the Phaser save key.")
		return
	if OS.has_feature("web"):
		var window = JavaScriptBridge.get_interface("window")
		window.localStorage.setItem(SAVE_KEY, serialized)
	else:
		var file := FileAccess.open(LOCAL_SAVE_PATH, FileAccess.WRITE)
		if file:
			file.store_string(serialized)
