extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(quest_registry != null, "QuestRegistry exists")
	if quest_registry == null:
		_finish()
		return
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()
	quest_registry.completed_quests["chain_repair"] = {"completedObjectives": ["inspect_chain", "rotate_pedals", "align_chain", "seat_chain", "test_rotation"]}

	var scene: PackedScene = load("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(scene != null, "Neighborhood scene loads")
	if scene == null:
		_finish()
		return
	var neighborhood: Node = scene.instantiate()
	root.add_child(neighborhood)
	await process_frame

	var station: Node = neighborhood.get_node_or_null("BridgeReviewStation")
	_assert(station != null and station.has_method("complete_station"), "BridgeReviewStation exposes station method")
	if station == null:
		_teardown(neighborhood)
		_finish()
		return

	_assert(bool(station.call("complete_station")) == false, "first station click opens/records presentation but does not auto-complete lesson")
	await process_frame
	_assert(quest_registry.is_active("bridge_quest_5"), "bridge_quest_5 starts from station")
	_assert(_completed(quest_registry, "bridge_quest_5", "watch_bridge_presentation"), "watch presentation objective records")
	_assert(not _completed(quest_registry, "bridge_quest_5", "compare_bridge_types"), "compare objective waits for notebook evidence")
	_assert(bool(station.call("complete_station")) == false, "station click cannot bypass notebook evidence")
	_assert(not _completed(quest_registry, "bridge_quest_5", "learn_triangles"), "triangle objective waits for notebook evidence")

	for objective_id in ["compare_bridge_types", "identify_bridge_parts", "learn_triangles", "trace_load_path"]:
		quest_registry.record_objective("bridge_quest_5", objective_id)

	var guard := 0
	while guard < 6 and not quest_registry.completed_quests.has("bridge_quest_5"):
		station.call("complete_station")
		await process_frame
		guard += 1
	_assert(quest_registry.completed_quests.has("bridge_quest_5"), "celebration objectives complete only after lesson evidence")

	_teardown(neighborhood)
	_finish()

func _completed(quest_registry: Node, quest_id: String, objective_id: String) -> bool:
	if quest_registry.completed_quests.has(quest_id):
		return true
	var state: Dictionary = quest_registry.active_quests.get(quest_id, {})
	return state.get("completedObjectives", []).has(objective_id)

func _teardown(node: Node) -> void:
	root.remove_child(node)
	node.free()
	await process_frame

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Station evidence check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
