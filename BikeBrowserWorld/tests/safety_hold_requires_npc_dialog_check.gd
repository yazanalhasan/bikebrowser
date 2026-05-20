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

	var station: Node = neighborhood.get_node_or_null("SafetyCheckStation")
	var prompt: Label = neighborhood.get_node_or_null("SafetyCheckStation/Prompt")
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(station != null, "SafetyCheckStation exists")
	_assert(prompt != null, "SafetyCheckStation prompt exists")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	if station == null or quest_registry == null:
		_finish()
		return

	quest_registry.get("active_quests").erase("act1_pre_ride_check")
	quest_registry.get("completed_quests").erase("act1_pre_ride_check")
	station.set("player_in_range", true)
	station.call("_update_visuals")
	_assert(prompt == null or prompt.text == "[E] Talk to Mrs. Ramirez", "Safety station asks for Mrs. Ramirez before hold")
	station.call("_begin_brake_check", "brakes_front_checked")
	await process_frame
	_assert(not quest_registry.call("is_active", "act1_pre_ride_check"), "Tap/hold cannot start safety check before NPC dialog")

	quest_registry.call("start_quest", "act1_pre_ride_check")
	quest_registry.call("record_objective", "act1_pre_ride_check", "talk_to_mrs_ramirez")
	quest_registry.call("record_objective", "act1_pre_ride_check", "abc_page_created")
	quest_registry.call("record_objective", "act1_pre_ride_check", "air_front_checked")
	quest_registry.call("record_objective", "act1_pre_ride_check", "air_rear_flat_found")
	station.call("_update_visuals")
	_assert(prompt == null or prompt.text == "[Hold E] Squeeze front brake", "Hold prompt appears after NPC dialog objective")

	_finish()

func _finish() -> void:
	if failures.is_empty():
		print("Safety hold requires NPC dialog check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
