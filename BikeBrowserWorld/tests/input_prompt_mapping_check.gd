extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var e_is_accept := false
	for event in InputMap.action_get_events("ui_accept"):
		if event is InputEventKey and event.physical_keycode == KEY_E:
			e_is_accept = true
	_assert(e_is_accept, "E key is mapped to ui_accept because prompts say [E]")
	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Input prompt mapping check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
