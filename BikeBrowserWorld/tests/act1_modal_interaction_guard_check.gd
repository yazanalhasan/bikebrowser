extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var event_bus: Node = root.get_node_or_null("EventBus")
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(event_bus != null, "EventBus autoload exists")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	if event_bus == null or quest_registry == null:
		_finish()
		return

	event_bus.set("modal_stack", 0)
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()

	var garage_scene: PackedScene = load("res://Regions/Garage/ZuzuGarage.tscn")
	_assert(garage_scene != null, "Garage scene loads")
	if garage_scene == null:
		_finish()
		return

	var garage: Node = garage_scene.instantiate()
	root.add_child(garage)
	await process_frame
	await process_frame

	var player: Node = garage.get_node_or_null("Player")
	var chain_hotspot: Node = garage.get_node_or_null("ChainHotspot")
	var tire_station: Node = garage.get_node_or_null("TireRepairStation")
	_assert(player != null, "garage player exists")
	_assert(chain_hotspot != null, "chain hotspot exists")
	_assert(tire_station != null, "tire station exists")

	event_bus.call("push_modal")
	_assert(bool(event_bus.call("is_modal_active")), "modal stack reports active")
	if player != null and player.has_method("_world_input_blocked"):
		_assert(bool(player.call("_world_input_blocked")), "player movement sees active modal")
	if chain_hotspot != null:
		chain_hotspot.set("player_in_range", true)
		chain_hotspot.call("_unhandled_input", _accept_event())
		_assert(not bool(chain_hotspot.get("pedal_engaged")), "chain hotspot ignores E while modal is active")
	if tire_station != null:
		tire_station.set("player_in_range", true)
		tire_station.call("_unhandled_input", _accept_event())
		_assert(not bool(tire_station.get("action_down")), "tire station ignores E while modal is active")
	event_bus.call("pop_modal")

	if chain_hotspot != null:
		chain_hotspot.call("_unhandled_input", _accept_event())
		_assert(bool(chain_hotspot.get("pedal_engaged")), "chain hotspot accepts E after modal closes")
	if tire_station != null:
		tire_station.call("_unhandled_input", _accept_event())
		_assert(bool(tire_station.get("action_down")), "tire station accepts E after modal closes")

	root.remove_child(garage)
	garage.free()
	event_bus.set("modal_stack", 0)
	await process_frame
	_finish()

func _accept_event() -> InputEventAction:
	var event := InputEventAction.new()
	event.action = "ui_accept"
	event.pressed = true
	return event

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Act 1 modal interaction guard check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
