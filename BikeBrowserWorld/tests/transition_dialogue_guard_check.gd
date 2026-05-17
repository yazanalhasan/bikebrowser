extends SceneTree

var failures: Array[String] = []
var observed_region_entered := false

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var neighborhood_scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(neighborhood_scene != null, "NeighborhoodStreet scene loads")
	if neighborhood_scene == null:
		_finish()
		return

	var neighborhood: Node = neighborhood_scene.instantiate()
	root.add_child(neighborhood)
	current_scene = neighborhood
	await process_frame

	var garage_entrance: Node = neighborhood.get_node_or_null("GarageEntrance")
	var dialog_box: Node = neighborhood.get_node_or_null("DialogBox")
	var panel: Node = neighborhood.get_node_or_null("DialogBox/Panel")
	_assert(garage_entrance != null, "Garage entrance exists")
	_assert(dialog_box != null, "Dialog box exists")
	_assert(panel != null, "Dialog panel exists")

	if garage_entrance == null or panel == null:
		_finish()
		return

	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(event_bus != null, "EventBus autoload is available")
	if event_bus == null:
		_finish()
		return
	event_bus.region_entered.connect(func(_region_id: String, _spawn_id: String) -> void:
		observed_region_entered = true
	)

	panel.visible = true
	garage_entrance.player_in_range = true
	garage_entrance.call("_transition")
	await create_timer(0.35).timeout

	_assert(not observed_region_entered, "Garage transition waits while dialogue is visible")
	_assert(not garage_entrance.transition_locked, "Garage transition unlocks after dialogue guard")
	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Transition dialogue guard check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
