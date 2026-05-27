extends SceneTree

# Integration test: ChainHotspot now drives a real ChainRig instead of the
# legacy 5-press ladder. This test proves the embodied loop end-to-end:
#   1. SlippedChainStation exposes the chain rig's Area2D click surface
#   2. Clicking that chain Area2D emits chain_grabbed exactly once
#   3. Garage instances the station as ChainHotspot
#   4. Sustained pedal pressure advances rig through state machine
#   5. STATE_VERIFIED fires, quest completes, reward_intent emits

var failures: Array[String] = []
var quest_started := false
var reward_payload: Dictionary = {}

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	_assert(event_bus != null, "EventBus autoload exists")
	if quest_registry == null or event_bus == null:
		_finish()
		return

	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()
	event_bus.set("modal_stack", 0)

	var station_scene: PackedScene = load("res://Regions/Garage/SlippedChainStation.tscn")
	_assert(station_scene != null, "SlippedChainStation scene loads")
	if station_scene == null:
		_finish()
		return

	var station: Area2D = station_scene.instantiate()
	root.add_child(station)
	await process_frame
	await process_frame
	_assert(station.get_node_or_null("BikeVisual/ChainRig") is Node2D, "station contains embedded ChainRig")
	_assert(station.get_node_or_null("BikeVisual/ChainRig/Chain/ClickArea") is Area2D, "station exposes chain Area2D click surface")
	_assert(station.has_signal("chain_grabbed"), "ChainHotspot exposes chain_grabbed signal")
	var station_grab_count: Array[int] = [0]
	station.connect("chain_grabbed", func() -> void: station_grab_count[0] += 1)
	var station_click_area: Area2D = station.get_node_or_null("BikeVisual/ChainRig/Chain/ClickArea")
	station_click_area.emit_signal("input_event", root, _left_click_event(), 0)
	_assert(station_grab_count[0] == 1, "direct station click emits chain_grabbed exactly once")
	_teardown(station)
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()
	event_bus.set("modal_stack", 0)

	event_bus.quest_started.connect(func(qid: String) -> void:
		if qid == "chain_repair":
			quest_started = true
	)
	event_bus.reward_intent.connect(func(payload: Dictionary) -> void:
		if payload.get("questId") == "chain_repair":
			reward_payload = payload
	)

	var garage_scene: PackedScene = load("res://Regions/Garage/ZuzuGarage.tscn")
	_assert(garage_scene != null, "ZuzuGarage scene loads")
	if garage_scene == null:
		_finish()
		return

	var garage: Node = garage_scene.instantiate()
	root.add_child(garage)
	await process_frame
	await process_frame

	var hotspot: Area2D = garage.get_node_or_null("ChainHotspot")
	var bike_visual: Node2D = garage.get_node_or_null("ChainHotspot/BikeVisual")
	var rig: Node2D = garage.get_node_or_null("ChainHotspot/BikeVisual/ChainRig")
	var click_area: Area2D = garage.get_node_or_null("ChainHotspot/BikeVisual/ChainRig/Chain/ClickArea")
	var player: Node2D = garage.get_node_or_null("Player")
	_assert(hotspot != null, "ChainHotspot exists in garage")
	_assert(hotspot != null and hotspot.scene_file_path == "res://Regions/Garage/SlippedChainStation.tscn", "garage ChainHotspot instances SlippedChainStation")
	_assert(bike_visual != null, "BikeVisual subtree exists under ChainHotspot")
	_assert(rig != null, "Embedded ChainRig instance exists")
	_assert(click_area != null, "garage chain click target is an Area2D")
	_assert(player != null, "Player exists in garage")
	if hotspot == null or rig == null or bike_visual == null or click_area == null:
		_teardown(garage)
		_finish()
		return

	_assert(bike_visual.visible, "BikeVisual starts visible so the real chain can be clicked")

	# Stop the rig's own _process so the test owns the time step deterministically.
	rig.set_process(false)
	rig.set_process_unhandled_input(false)

	var grab_count: Array[int] = [0]
	hotspot.connect("chain_grabbed", func() -> void: grab_count[0] += 1)
	click_area.emit_signal("input_event", root, _left_click_event(), 0)
	await process_frame

	_assert(grab_count[0] == 1, "garage chain click emits chain_grabbed exactly once")
	_assert(bike_visual.visible, "BikeVisual remains visible on chain grab")
	_assert(quest_started, "chain grab starts chain_repair quest")
	_assert(quest_registry.is_active("chain_repair"), "chain_repair is active after grab")
	_assert(hotspot.recorded_objectives.has("inspect_chain"), "inspect_chain recorded on grab")

	# Drive the rig to verified via deterministic stepping. Process the hotspot
	# manually so its _track_rig_state observes state transitions.
	rig.set_pedal_pressed(true)
	for _i in range(80):
		rig.step_mechanic(0.05)
		hotspot._track_rig_state()
		if rig.chain_verified:
			break

	_assert(rig.chain_verified, "rig reaches chain_verified within step budget")
	_assert(hotspot.chain_repair_verified, "hotspot recognizes verified state")
	_assert(hotspot.recorded_objectives.has("rotate_pedals"), "rotate_pedals recorded")
	_assert(hotspot.recorded_objectives.has("align_chain"), "align_chain recorded")
	_assert(hotspot.recorded_objectives.has("seat_chain"), "seat_chain recorded")
	_assert(hotspot.recorded_objectives.has("test_rotation"), "test_rotation recorded")
	_assert(quest_registry.completed_quests.has("chain_repair"), "chain_repair completes")
	_assert(reward_payload.get("type") == "reward_intent", "reward_intent fired exactly once")
	_assert(reward_payload.get("questId") == "chain_repair", "reward_intent carries chain_repair id")

	_teardown(garage)
	_finish()

func _left_click_event() -> InputEventMouseButton:
	var event := InputEventMouseButton.new()
	event.button_index = MOUSE_BUTTON_LEFT
	event.pressed = true
	return event

func _teardown(node: Node) -> void:
	root.remove_child(node)
	node.free()
	await process_frame

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Chain hotspot embodied check passed")
		quit(0)
	else:
		for f in failures:
			push_error(f)
		quit(1)
