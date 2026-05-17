extends Node
class_name SaveManager

const SaveDataScript := preload("res://SaveSystem/SaveData.gd")

signal game_saved(slot: int, save_data: Resource)
signal game_loaded(slot: int, save_data: Resource)
signal save_deleted(slot: int)
signal save_failed(slot: int, reason: String)

const SAVE_DIR := "user://saves"
const SLOT_COUNT := 5

var current_slot: int = 1
var current_save: Resource

func _ready() -> void:
	_ensure_save_dir()

func save_game(slot: int) -> bool:
	if not _is_valid_slot(slot):
		save_failed.emit(slot, "Invalid save slot.")
		return false

	var save_data := _collect_save_data(slot)
	_capture_screenshot(save_data)
	var file := FileAccess.open(_slot_path(slot), FileAccess.WRITE)
	if file == null:
		save_failed.emit(slot, str(FileAccess.get_open_error()))
		return false

	file.store_string(JSON.stringify(save_data.to_dict(), "\t"))
	current_slot = slot
	current_save = save_data
	game_saved.emit(slot, save_data)
	return true

func load_game(slot: int) -> Resource:
	if not _is_valid_slot(slot):
		save_failed.emit(slot, "Invalid save slot.")
		return null

	var path := _slot_path(slot)
	if not FileAccess.file_exists(path):
		save_failed.emit(slot, "Save file does not exist.")
		return null

	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		save_failed.emit(slot, str(FileAccess.get_open_error()))
		return null

	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		save_failed.emit(slot, "Save file is not valid JSON.")
		return null

	var save_data := SaveDataScript.from_dict(parsed)
	current_slot = slot
	current_save = save_data
	_apply_save_data(save_data)
	game_loaded.emit(slot, save_data)
	return save_data

func auto_save() -> bool:
	return save_game(current_slot)

func delete_save(slot: int) -> bool:
	if not _is_valid_slot(slot):
		return false

	var path := _slot_path(slot)
	if FileAccess.file_exists(path):
		var result := DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
		if result != OK:
			save_failed.emit(slot, "Could not delete save.")
			return false

	save_deleted.emit(slot)
	return true

func get_save_info(slot: int) -> Dictionary:
	if not _is_valid_slot(slot) or not FileAccess.file_exists(_slot_path(slot)):
		return {}

	var file := FileAccess.open(_slot_path(slot), FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		return {}
	var save_data := SaveDataScript.from_dict(parsed)
	if save_data == null:
		return {}

	return {
		"slot": slot,
		"timestamp": save_data.timestamp,
		"playtime_seconds": save_data.playtime_seconds,
		"player_name": save_data.player.get("name", "Zuzu"),
		"level": save_data.player.get("level", 1),
		"screenshot_path": save_data.screenshot_path
	}

func get_all_save_info() -> Array[Dictionary]:
	var saves: Array[Dictionary] = []
	for slot in range(1, SLOT_COUNT + 1):
		saves.append(get_save_info(slot))
	return saves

func _collect_save_data(slot: int) -> Resource:
	var save_data := SaveDataScript.new()
	save_data.slot = slot
	save_data.timestamp = Time.get_datetime_string_from_system(true)
	save_data.playtime_seconds = int(Time.get_ticks_msec() / 1000)

	var tree := get_tree()
	if tree == null:
		return save_data

	var player_node := tree.get_first_node_in_group("player")
	if player_node != null and player_node.has_method("get_save_data"):
		save_data.player.merge(player_node.get_save_data(), true)

	for node in tree.get_nodes_in_group("saveable"):
		if node.has_method("get_save_key") and node.has_method("get_save_data"):
			save_data.world[node.get_save_key()] = node.get_save_data()

	return save_data

func _apply_save_data(save_data: Resource) -> void:
	var tree := get_tree()
	if tree == null:
		return

	var player_node := tree.get_first_node_in_group("player")
	if player_node != null and player_node.has_method("apply_save_data"):
		player_node.apply_save_data(save_data.player)

	for node in tree.get_nodes_in_group("saveable"):
		if node.has_method("get_save_key") and node.has_method("apply_save_data"):
			var key = node.get_save_key()
			if save_data.world.has(key):
				node.apply_save_data(save_data.world[key])

func _slot_path(slot: int) -> String:
	return "%s/slot_%d.json" % [SAVE_DIR, slot]

func _screenshot_path(slot: int) -> String:
	return "%s/slot_%d.png" % [SAVE_DIR, slot]

func _capture_screenshot(save_data: Resource) -> void:
	var viewport := get_viewport()
	if viewport == null:
		return
	var image := viewport.get_texture().get_image()
	if image == null:
		return
	image.resize(320, 180, Image.INTERPOLATE_LANCZOS)
	var path := _screenshot_path(save_data.slot)
	if image.save_png(path) == OK:
		save_data.screenshot_path = path

func _is_valid_slot(slot: int) -> bool:
	return slot >= 1 and slot <= SLOT_COUNT

func _ensure_save_dir() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(SAVE_DIR))
