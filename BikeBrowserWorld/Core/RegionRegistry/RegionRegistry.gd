extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative region transition and visited-region state manager.

const REGION_DATA_PATH := "res://Data/regions/regions.json"

var regions: Dictionary = {}
var visited_regions: Dictionary = {}
var last_positions: Dictionary = {}
var current_region_id := "boot"
var current_spawn_id := "default"
var is_transitioning := false
var _fade_layer: CanvasLayer
var _fade_rect: ColorRect

func _ready() -> void:
	regions = _load_json(REGION_DATA_PATH)
	_setup_fade()

func change_region(region_id: String, spawn_id: String = "default") -> void:
	if is_transitioning:
		return
	if not regions.has(region_id):
		EventBus.log_debug("Unknown region requested", { "regionId": region_id })
		return
	var region: Dictionary = regions[region_id]
	var scene_path := String(region.get("scenePath", ""))
	if scene_path.is_empty():
		EventBus.log_debug("Region has no scene path", { "regionId": region_id })
		return
	_store_current_player_position()
	is_transitioning = true
	await _fade_to(1.0, 0.18)
	current_region_id = region_id
	current_spawn_id = spawn_id
	visited_regions[region_id] = {
		"visited": true,
		"lastVisitedAt": Time.get_datetime_string_from_system(true)
	}
	SaveService.save_now("region_change")
	EventBus.region_entered.emit(region_id, spawn_id)
	var error := get_tree().change_scene_to_file(scene_path)
	if error != OK:
		EventBus.log_debug("Region scene failed to load", { "regionId": region_id, "scenePath": scene_path, "error": error })
		await _fade_to(0.0, 0.18)
		is_transitioning = false
		return
	await get_tree().process_frame
	await _fade_to(0.0, 0.25)
	is_transitioning = false

func get_spawn(region_id: String, spawn_id: String = "default") -> Dictionary:
	if not regions.has(region_id):
		return {}
	var spawns: Dictionary = regions[region_id].get("spawns", {})
	return spawns.get(spawn_id, spawns.get("default", {}))

func serialize() -> Dictionary:
	return {
		"currentRegion": current_region_id,
		"currentSpawn": current_spawn_id,
		"visited": visited_regions,
		"lastPositions": last_positions
	}

func _store_current_player_position() -> void:
	var tree := get_tree()
	if tree == null or tree.current_scene == null:
		return
	var player := tree.current_scene.get_node_or_null("Player")
	if player is Node2D and not current_region_id.is_empty():
		last_positions[current_region_id] = { "x": player.position.x, "y": player.position.y }

func _setup_fade() -> void:
	_fade_layer = CanvasLayer.new()
	_fade_layer.layer = 200
	add_child(_fade_layer)
	_fade_rect = ColorRect.new()
	_fade_rect.color = Color(0, 0, 0, 0)
	_fade_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	_fade_layer.add_child(_fade_rect)

func _fade_to(alpha: float, duration: float) -> void:
	if _fade_rect == null:
		return
	var color := _fade_rect.color
	color.a = alpha
	var tween := create_tween()
	tween.tween_property(_fade_rect, "color", color, duration)
	await tween.finished

func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}
