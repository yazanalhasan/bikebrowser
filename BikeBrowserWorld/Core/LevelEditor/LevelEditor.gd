extends Node

const OVERLAY_PATH := "res://addons/level_editor/EditorOverlay.tscn"

var active := false
var overlay: CanvasLayer = null
var previous_tree_paused := false
var previous_music_volume_db := 0.0
var music_bus_index := -1

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func _input(event: InputEvent) -> void:
	if not _dev_enabled():
		return
	if event is InputEventKey and event.pressed and not event.echo and event.keycode == KEY_F2:
		toggle()
		get_viewport().set_input_as_handled()

func _dev_enabled() -> bool:
	var dev := get_node_or_null("/root/DevMode")
	return dev != null and bool(dev.enabled) and ResourceLoader.exists(OVERLAY_PATH)

func toggle() -> void:
	if active:
		exit_edit_mode()
	else:
		enter_edit_mode()

func enter_edit_mode() -> void:
	if active or not _dev_enabled():
		return
	active = true
	previous_tree_paused = get_tree().paused
	_duck_music()
	get_tree().paused = true
	var overlay_scene: PackedScene = load(OVERLAY_PATH)
	overlay = overlay_scene.instantiate()
	overlay.name = "EditorOverlay"
	overlay.process_mode = Node.PROCESS_MODE_ALWAYS
	get_tree().root.add_child(overlay)
	overlay.call_deferred("open_for_scene", get_tree().current_scene)
	_post_shell_message("EDIT_MODE_ON")
	_publish_state()

func exit_edit_mode() -> void:
	if not active:
		return
	active = false
	if overlay != null and is_instance_valid(overlay):
		overlay.queue_free()
	overlay = null
	get_tree().paused = previous_tree_paused
	_restore_music()
	_post_shell_message("EDIT_MODE_OFF")
	_publish_state()

func _duck_music() -> void:
	music_bus_index = AudioServer.get_bus_index("Music")
	if music_bus_index < 0:
		return
	previous_music_volume_db = AudioServer.get_bus_volume_db(music_bus_index)
	AudioServer.set_bus_volume_db(music_bus_index, previous_music_volume_db - 12.0)

func _restore_music() -> void:
	if music_bus_index >= 0:
		AudioServer.set_bus_volume_db(music_bus_index, previous_music_volume_db)
	music_bus_index = -1

func _post_shell_message(message_type: String) -> void:
	if not OS.has_feature("web"):
		return
	var script := "window.parent && window.parent.postMessage({ type: '%s', timestamp: new Date().toISOString() }, window.location.origin);" % message_type
	JavaScriptBridge.eval(script, true)

func _publish_state(extra: Dictionary = {}) -> void:
	if not OS.has_feature("web"):
		return
	var selected_count := 0
	var selection := {}
	var target := {}
	if overlay != null and is_instance_valid(overlay) and overlay.has_method("selected_count"):
		selected_count = int(overlay.call("selected_count"))
	if overlay != null and is_instance_valid(overlay) and overlay.has_method("selection_debug"):
		selection = overlay.call("selection_debug")
	if overlay != null and is_instance_valid(overlay) and overlay.has_method("selection_target"):
		target = overlay.call("selection_target")
	var data := {
		"active": active,
		"selectedCount": selected_count,
		"selection": selection,
		"selectionTarget": target
	}
	for key in extra.keys():
		data[key] = extra[key]
	var json := JSON.stringify(data)
	JavaScriptBridge.eval("window.BikeBrowserLevelEditorState = %s;" % json, true)
