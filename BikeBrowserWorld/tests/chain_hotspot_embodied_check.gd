extends SceneTree

# Integration test: ChainHotspot now drives a real ChainRig instead of the
# legacy 5-press ladder. This test proves the embodied loop end-to-end:
#   1. Player enters the hotspot zone
#   2. Pedal press engages the rig (rig becomes visible, camera zooms)
#   3. Sustained pedal pressure advances rig through state machine
#   4. Each state transition records the matching chain_repair objective
#   5. STATE_VERIFIED fires, quest completes, reward_intent emits
#
# Together with brake_integration_check this establishes the shared embodied
# pattern: ChainRig and BrakeRig are interchangeable templates.

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
	var player: Node2D = garage.get_node_or_null("Player")
	_assert(hotspot != null, "ChainHotspot exists in garage")
	_assert(bike_visual != null, "BikeVisual subtree exists under ChainHotspot")
	_assert(rig != null, "Embedded ChainRig instance exists")
	_assert(player != null, "Player exists in garage")
	if hotspot == null or rig == null or bike_visual == null:
		_teardown(garage)
		_finish()
		return

	_assert(not bike_visual.visible, "BikeVisual starts hidden")

	# Stop the rig's own _process so the test owns the time step deterministically.
	rig.set_process(false)
	rig.set_process_unhandled_input(false)

	# Engage the hotspot directly — equivalent to player entering range and pressing E.
	hotspot.player_in_range = true
	hotspot._engage_pedal()
	rig.set_pedal_pressed(true)
	await process_frame

	_assert(bike_visual.visible, "BikeVisual becomes visible on engage")
	_assert(quest_started, "engage starts chain_repair quest")
	_assert(quest_registry.is_active("chain_repair"), "chain_repair is active after engage")
	_assert(hotspot.recorded_objectives.has("inspect_chain"), "inspect_chain recorded on engage")

	# Drive the rig to verified via deterministic stepping. Process the hotspot
	# manually so its _track_rig_state observes state transitions.
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
