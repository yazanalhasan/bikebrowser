extends Node

# Optional playtest helper. Attach/autoload only for live human playtest sessions.
# Captures the current viewport without pausing gameplay.

@export var capture_action := "playtest_screenshot"
@export var fallback_key := KEY_F12
@export var include_debug_overlays := false

const SCREENSHOT_DIR := "res://../playtest/screenshots"
const SESSION_STATE_PATH := "res://../playtest/active_session/session_state.json"

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(SCREENSHOT_DIR))
	set_process_unhandled_input(true)

func _unhandled_input(event: InputEvent) -> void:
	if InputMap.has_action(capture_action) and event.is_action_pressed(capture_action):
		capture_screenshot()
		return
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == fallback_key:
		capture_screenshot()

func capture_screenshot() -> String:
	var viewport := get_viewport()
	if viewport == null:
		return ""
	var image := viewport.get_texture().get_image()
	if image == null:
		return ""
	var timestamp := _timestamp_for_file()
	var path := "%s/playtest_%s.png" % [SCREENSHOT_DIR, timestamp]
	var absolute_path := ProjectSettings.globalize_path(path)
	var error := image.save_png(path)
	if error != OK:
		push_warning("Playtest screenshot save failed: %s" % error)
		return ""
	_update_session_state(absolute_path)
	print("Playtest screenshot captured: %s" % absolute_path)
	return absolute_path

func _update_session_state(screenshot_path: String) -> void:
	var state := _read_json(SESSION_STATE_PATH)
	state["lastScreenshotPath"] = screenshot_path
	state["runtimeTimestamp"] = Time.get_datetime_string_from_system(true)
	state["currentScene"] = _current_scene_path()
	_write_json(SESSION_STATE_PATH, state)

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _write_json(path: String, data: Dictionary) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_warning("Could not write playtest session state: %s" % path)
		return
	file.store_string(JSON.stringify(data, "\t"))

func _current_scene_path() -> String:
	var scene := get_tree().current_scene
	if scene == null:
		return "unknown"
	return scene.scene_file_path if not scene.scene_file_path.is_empty() else scene.name

func _timestamp_for_file() -> String:
	var stamp := Time.get_datetime_string_from_system(false, true)
	return stamp.replace(":", "-").replace(" ", "_")
