extends SceneTree

var failures: Array[String] = []
var hud: CanvasLayer

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	if quest_registry == null:
		_finish()
		return
	if quest_registry.quests.is_empty():
		quest_registry.load_all_missions()
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()

	var hud_scene: PackedScene = load("res://Regions/UI/Hud.tscn")
	_assert(hud_scene != null, "HUD scene loads")
	if hud_scene == null:
		_finish()
		return
	hud = hud_scene.instantiate()
	root.add_child(hud)
	await process_frame

	_assert_hud_contains("Bike Safety Check", "Mrs. Ramirez", "initial HUD points to safety check")
	quest_registry.start_quest("bike_safety_check")
	await process_frame
	_assert_hud_contains("Bike Safety Check", "Talk with Mrs. Ramirez", "safety quest shows first objective")
	quest_registry.record_objective("bike_safety_check", "talk_to_mrs_ramirez")
	await process_frame
	_assert_hud_contains("Bike Safety Check", "Squeeze the brake levers", "safety quest advances to brake objective")
	_complete_all_objectives(quest_registry, "bike_safety_check")
	await process_frame
	_assert_hud_contains("Fix Mrs. Ramirez's Flat Tire", "tire station", "HUD points to flat tire after safety")

	quest_registry.start_quest("flat_tire_repair")
	await process_frame
	_assert_hud_contains("Fix Mrs. Ramirez's Flat Tire", "Inspect the tire", "flat tire shows inspect objective")
	_complete_all_objectives(quest_registry, "flat_tire_repair")
	await process_frame
	_assert_hud_contains("Mr. Chen's Slipped Chain", "garage repair stand", "HUD points to chain after tire")

	quest_registry.start_quest("chain_repair")
	await process_frame
	_assert_hud_contains("Mr. Chen's Slipped Chain", "Look closely at the chain path", "chain skips dialogue and shows repair objective")
	_complete_all_objectives(quest_registry, "chain_repair")
	await process_frame
	_assert_hud_contains("Celebrate and Learn", "bridge review station", "HUD points to bridge review after drivetrain repair")

	_complete_all_objectives(quest_registry, "bridge_quest_5")
	await process_frame
	_assert_hud_contains("Desert Plant Observation", "desert trail station", "HUD points to desert side-region station")
	_complete_all_objectives(quest_registry, "desert_plant_observation")
	await process_frame
	_assert_hud_contains("Test the Water Quality", "Salt River water station", "HUD points to water side-region station")
	_complete_all_objectives(quest_registry, "test_water_quality")
	await process_frame
	_assert_hud_contains("Identify the Copper Ore", "copper mine test station", "HUD points to copper side-region station")
	_complete_all_objectives(quest_registry, "copper_rock_id")
	await process_frame
	_assert_hud_contains("Workshop First Build", "garage workshop station", "HUD points to workshop station")
	_complete_all_objectives(quest_registry, "workshop_first_build")
	await process_frame
	_assert_hud_contains("Regional Readiness Review", "Act 1 review station", "HUD points to capstone after prerequisites")

	quest_registry.start_quest("act1_regional_readiness")
	await process_frame
	_assert_hud_contains("Regional Readiness Review", "tires, brakes, and chain", "capstone shows objective-level review guidance")
	_finish()

func _complete_all_objectives(quest_registry: Node, quest_id: String) -> void:
	if not quest_registry.completed_quests.has(quest_id) and not quest_registry.is_active(quest_id):
		quest_registry.start_quest(quest_id)
	var quest: Dictionary = quest_registry.get_quest(quest_id)
	for step in quest.get("steps", []):
		var step_id := String(step.get("id", ""))
		if not step_id.is_empty():
			quest_registry.record_objective(quest_id, step_id)

func _assert_hud_contains(title_part: String, hint_part: String, message: String) -> void:
	var title := String(hud.get_node("Panel/HBox/VBox/QuestLabel").text)
	var hint := String(hud.get_node("Panel/HBox/VBox/HintLabel").text)
	_assert(title.find(title_part) != -1, "%s title expected '%s', got '%s'" % [message, title_part, title])
	_assert(hint.find(hint_part) != -1, "%s hint expected '%s', got '%s'" % [message, hint_part, hint])

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if hud != null:
		root.remove_child(hud)
		hud.free()
	if failures.is_empty():
		print("Act 1 HUD guidance check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
