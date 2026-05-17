extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(scene != null, "NeighborhoodStreet scene loads")
	if scene == null:
		_finish()
		return

	var neighborhood := scene.instantiate()
	root.add_child(neighborhood)
	await process_frame

	var station: Node = neighborhood.get_node_or_null("SafetyCheckStation")
	_assert(station != null, "SafetyCheckStation exists")
	_assert(station.get_node_or_null("BikeVisual/BrakeRig") != null, "SafetyCheckStation owns embodied brake rig")
	if station == null:
		_finish()
		return

	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(quest_registry != null, "QuestRegistry autoload is available")
	if quest_registry == null:
		_finish()
		return
	if quest_registry.quests.is_empty():
		quest_registry._ready()
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()

	station.set("player_in_range", true)
	station.call("advance_check")
	await create_timer(0.25).timeout
	var quest_id := String(station.get("quest_id"))
	_assert(quest_registry.is_active(quest_id), "safety quest starts when brake check begins")
	var active_state: Dictionary = quest_registry.active_quests.get(quest_id, {})
	var completed: Array = active_state.get("completedObjectives", [])
	_assert(not completed.has("check_brakes"), "button press alone does not complete brake objective")
	_assert(station.get("step_index") == 0, "station stays on brake step until brake is physically verified")

	var brake_rig: Node = station.get_node_or_null("BikeVisual/BrakeRig")
	_assert(brake_rig != null, "brake rig remains available after starting check")
	if brake_rig:
		brake_rig.call("set_brake_pressed", true)
		var guard := 0
		while not bool(brake_rig.get("brake_verified")) and guard < 80:
			brake_rig.call("step_mechanic", 0.10)
			guard += 1
		await process_frame
		completed = quest_registry.active_quests.get(quest_id, {}).get("completedObjectives", [])
		_assert(completed.has("check_brakes"), "physical brake verification completes brake objective")
		_assert(station.get("step_index") == 1, "station advances to tire step after brake verification")

	root.remove_child(neighborhood)
	neighborhood.free()
	scene = null
	await process_frame
	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Safety check brake integration passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
