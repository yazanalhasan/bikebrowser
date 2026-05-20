extends SceneTree

var failures: Array[String] = []
var reward_payload: Dictionary = {}

const DIRECTLY_VALIDATED_MECHANICAL_QUESTS := {
	"act1_pre_ride_check": [
		"talk_to_mrs_ramirez", "abc_page_created", "air_front_checked", "air_rear_flat_found",
		"brakes_front_checked", "brakes_rear_checked", "chain_checked", "quick_wheel_checked",
		"quick_seat_checked", "quick_handlebars_checked", "tube_received", "garage_arrived",
		"tube_removed", "leak_found", "leak_marked", "patch_applied", "cement_set",
		"tube_reinflated", "repair_tested", "tube_returned", "final_air_checked",
		"final_brakes_checked", "final_chain_checked", "final_quick_checked", "final_report"
	],
	"chain_repair": ["inspect_chain", "rotate_pedals", "align_chain", "seat_chain", "test_rotation"],
}

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
	event_bus.reward_intent.connect(func(payload: Dictionary) -> void:
		reward_payload = payload
	)

	var neighborhood := _instantiate_scene("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(neighborhood != null, "Neighborhood scene loads for Act 1 path")
	if neighborhood == null:
		_finish()
		return
	root.add_child(neighborhood)
	await process_frame

	_assert(_transition_locked(neighborhood, "DesertExit"), "side exits are locked before drivetrain repair")
	_complete_directly_validated_mechanics(quest_registry)
	_assert(not _transition_locked(neighborhood, "DesertExit"), "side exits unlock after drivetrain repair")
	_assert(not _transition_locked(neighborhood, "MineExit"), "mine exit unlocks after drivetrain repair")
	_assert(not _transition_locked(neighborhood, "RiverExit"), "river exit unlocks after drivetrain repair")
	_assert(_station_has_visible_guidance(neighborhood, "BridgeReviewStation"), "bridge review station has visible guidance art")
	_assert(_transition_has_visible_guide(neighborhood, "DesertExit"), "desert exit has visible route guide")
	_assert(_transition_has_visible_guide(neighborhood, "MineExit"), "mine exit has visible route guide")
	_assert(_transition_has_visible_guide(neighborhood, "RiverExit"), "river exit has visible route guide")

	_assert(await _complete_station(neighborhood, "BridgeReviewStation"), "bridge review station completes bridge_quest_5")
	root.remove_child(neighborhood)
	neighborhood.free()
	await process_frame

	var garage := _instantiate_scene("res://Regions/Garage/ZuzuGarage.tscn")
	_assert(garage != null, "Garage scene loads for workshop build")
	if garage != null:
		root.add_child(garage)
		await process_frame
		_assert(_station_has_visible_guidance(garage, "WorkshopBuildStation"), "workshop station has visible guidance art")
		_assert(await _complete_station(garage, "WorkshopBuildStation"), "workshop station completes workshop_first_build")
		root.remove_child(garage)
		garage.free()
		await process_frame

	_assert(await _complete_visible_station_in_scene("res://Regions/Desert/DesertTrail.tscn", "PlantObservationStation"), "desert plant station is visible and completes desert observation")
	_assert(await _complete_visible_station_in_scene("res://Regions/Mine/CopperMine.tscn", "CopperEvidenceStation"), "copper station is visible and completes copper evidence quest")
	_assert(await _complete_visible_station_in_scene("res://Regions/River/SaltRiver.tscn", "WaterQualityStation"), "water station is visible and completes water-quality quest")

	neighborhood = _instantiate_scene("res://Regions/Neighborhood/NeighborhoodStreet.tscn")
	_assert(neighborhood != null, "Neighborhood reloads for Act 1 capstone")
	if neighborhood != null:
		root.add_child(neighborhood)
		await process_frame
		_assert(_station_has_visible_guidance(neighborhood, "Act1CapstoneStation"), "Act 1 capstone station has visible guidance art")
		_assert(await _complete_station(neighborhood, "Act1CapstoneStation"), "Act 1 capstone station completes regional readiness")
		root.remove_child(neighborhood)
		neighborhood.free()

	_assert(quest_registry.completed_quests.has("act1_regional_readiness"), "Act 1 capstone is complete through scene station")
	_assert(reward_payload.get("questId", "") == "act1_regional_readiness", "Act 1 capstone emits reward intent")
	_assert(reward_payload.get("badge", "") == "Systems Thinker", "Act 1 capstone reward keeps Systems Thinker badge")
	var reward_items: Array = reward_payload.get("items", [])
	_assert(reward_items.has("regional_travel_sketchbook"), "Act 1 capstone grants regional sketchbook")
	_assert(reward_items.has("spacecraft_clue_card"), "Act 1 capstone grants spacecraft clue card")
	_finish()

func _instantiate_scene(path: String) -> Node:
	var scene: PackedScene = load(path)
	if scene == null:
		return null
	return scene.instantiate()

func _complete_directly_validated_mechanics(quest_registry: Node) -> void:
	for quest_id in DIRECTLY_VALIDATED_MECHANICAL_QUESTS.keys():
		quest_registry.start_quest(quest_id)
		for objective_id in DIRECTLY_VALIDATED_MECHANICAL_QUESTS[quest_id]:
			quest_registry.record_objective(quest_id, objective_id)

func _complete_station_in_scene(scene_path: String, station_name: String) -> bool:
	var scene_root := _instantiate_scene(scene_path)
	if scene_root == null:
		return false
	root.add_child(scene_root)
	await process_frame
	var completed := await _complete_station(scene_root, station_name)
	root.remove_child(scene_root)
	scene_root.free()
	await process_frame
	return completed

func _complete_visible_station_in_scene(scene_path: String, station_name: String) -> bool:
	var scene_root := _instantiate_scene(scene_path)
	if scene_root == null:
		return false
	root.add_child(scene_root)
	await process_frame
	var visible := _station_has_visible_guidance(scene_root, station_name)
	var completed := await _complete_station(scene_root, station_name)
	root.remove_child(scene_root)
	scene_root.free()
	await process_frame
	return visible and completed

func _complete_station(scene_root: Node, station_name: String) -> bool:
	var station := scene_root.get_node_or_null(station_name)
	if station == null or not station.has_method("complete_station"):
		return false
	var guard := 0
	var completed := false
	while guard < 12:
		completed = bool(station.call("complete_station"))
		await process_frame
		if completed:
			return true
		guard += 1
	return false

func _station_has_visible_guidance(scene_root: Node, station_name: String) -> bool:
	var station := scene_root.get_node_or_null(station_name)
	if station == null:
		return false
	var sign := station.get_node_or_null("Sign")
	var mat := station.get_node_or_null("StationMat")
	var beacon := station.get_node_or_null("Beacon")
	if not (sign is Label and mat is Polygon2D and beacon is Polygon2D):
		return false
	return sign.visible and mat.visible and beacon.visible and sign.size.x > 0.0 and mat.polygon.size() >= 3 and beacon.polygon.size() >= 3

func _transition_has_visible_guide(scene_root: Node, transition_name: String) -> bool:
	var transition := scene_root.get_node_or_null(transition_name)
	if transition == null:
		return false
	var guide := transition.get_node_or_null("Guide")
	return guide is Label and guide.visible and guide.size.x > 0.0

func _transition_locked(scene_root: Node, transition_name: String) -> bool:
	var transition := scene_root.get_node_or_null(transition_name)
	if transition == null or not transition.has_method("_is_locked"):
		return true
	return bool(transition.call("_is_locked"))

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Act 1 player path check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
