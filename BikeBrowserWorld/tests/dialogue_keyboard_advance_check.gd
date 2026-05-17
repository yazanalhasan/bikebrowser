extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var dialog_scene: PackedScene = load("res://Regions/UI/DialogBox.tscn")
	_assert(dialog_scene != null, "DialogBox scene loads")
	if dialog_scene == null:
		_finish()
		return

	var dialog: Node = dialog_scene.instantiate()
	root.add_child(dialog)
	await process_frame
	var audio_service: Node = root.get_node_or_null("AudioService")
	if audio_service != null:
		audio_service.set("voice_enabled", false)
	_assert(dialog.has_method("_unhandled_input"), "DialogController handles keyboard input")
	if not dialog.has_method("_unhandled_input"):
		_finish()
		return

	var dialogue := {
		"id": "keyboard_advance_test",
		"speaker": "Mrs. Ramirez",
		"lines": [
			{ "speaker": "Mrs. Ramirez", "text": "First line." },
			{ "speaker": "Mrs. Ramirez", "text": "Second line." }
		]
	}
	dialog.call("_on_dialogue_requested", dialogue)
	await process_frame
	_assert(int(dialog.get("current_index")) == 0, "Dialogue starts on first line")

	var event := InputEventAction.new()
	event.action = "ui_accept"
	event.pressed = true
	dialog.call("_unhandled_input", event)
	await process_frame

	_assert(int(dialog.get("current_index")) == 1, "ui_accept advances open dialogue")
	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Dialogue keyboard advance check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
