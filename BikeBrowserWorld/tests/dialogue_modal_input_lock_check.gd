extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(scene != null, "Neighborhood scene loads")
	if scene == null:
		_finish()
		return

	var neighborhood := scene.instantiate()
	root.add_child(neighborhood)
	current_scene = neighborhood
	await process_frame

	var player: CharacterBody2D = neighborhood.get_node_or_null("Player")
	var dialog: Node = neighborhood.get_node_or_null("DialogBox")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(player != null, "Player exists")
	_assert(dialog != null, "Dialog box exists")
	_assert(event_bus != null, "EventBus exists")
	if player == null or dialog == null or event_bus == null:
		_finish()
		return

	var start_position := player.position
	dialog.call("_on_dialogue_requested", {
		"id": "modal_lock_test",
		"speaker": "Mrs. Ramirez",
		"lines": [{ "speaker": "Mrs. Ramirez", "text": "Hold still and listen." }]
	})
	await process_frame
	_assert(event_bus.call("is_modal_active"), "Dialogue pushes modal state")

	Input.action_press("ui_right")
	for i in range(12):
		player.call("_physics_process", 1.0 / 60.0)
		await physics_frame
	Input.action_release("ui_right")

	_assert(player.position.distance_to(start_position) < 0.5, "Player does not move while dialogue is open")

	var event := InputEventAction.new()
	event.action = "ui_accept"
	event.pressed = true
	dialog.call("_unhandled_input", event)
	await create_timer(0.7).timeout
	_assert(not event_bus.call("is_modal_active"), "Dialogue pops modal state after completion")

	_finish()

func _finish() -> void:
	Input.action_release("ui_right")
	if failures.is_empty():
		print("Dialogue modal input lock check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
