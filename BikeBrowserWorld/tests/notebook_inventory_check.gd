extends SceneTree

var failures: Array[String] = []
var hud: CanvasLayer
var recipe_feedback := ""

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	var inventory_manager: Node = root.get_node_or_null("InventoryManager")
	var event_bus: Node = root.get_node_or_null("EventBus")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	_assert(inventory_manager != null, "InventoryManager autoload exists")
	_assert(event_bus != null, "EventBus autoload exists")
	if quest_registry == null or inventory_manager == null or event_bus == null:
		_finish()
		return

	if quest_registry.quests.is_empty():
		quest_registry.load_all_missions()
	quest_registry.active_quests.clear()
	quest_registry.completed_quests.clear()
	inventory_manager.learned_recipes.clear()

	event_bus.recipe_feedback.connect(func(message: String, _tone: String) -> void:
		recipe_feedback = message
	)

	var hud_scene: PackedScene = load("res://Regions/UI/Hud.tscn")
	_assert(hud_scene != null, "HUD scene loads")
	if hud_scene == null:
		_finish()
		return
	hud = hud_scene.instantiate()
	root.add_child(hud)
	await process_frame

	_assert(hud.get_node_or_null("QuestNotebookPanel") is Panel, "HUD builds quest notebook panel")
	_assert(hud.get_node_or_null("InventoryPanel") is Panel, "HUD builds inventory panel")
	_assert(hud.get_node_or_null("FieldToggleBar") is HBoxContainer, "HUD exposes touch-accessible notebook/inventory buttons")

	hud.call("_toggle_overlay", "notebook")
	await process_frame
	var notebook_panel: Panel = hud.get_node("QuestNotebookPanel")
	_assert(notebook_panel.visible, "notebook opens from HUD toggle")
	_assert(event_bus.is_modal_active(), "open notebook pushes modal guard")
	hud.call("_toggle_overlay", "")
	await process_frame
	_assert(not event_bus.is_modal_active(), "closing notebook releases modal guard")

	_assert(not inventory_manager.is_recipe_learned("patch_ready_tube"), "tube patch recipe starts unlearned")
	var crafted_early: bool = inventory_manager.combine_items("inner_tube", "patch_kit")
	_assert(not crafted_early, "unlearned recipe refuses crafting")
	_assert(recipe_feedback.find("Not learned yet") != -1, "unlearned recipe gives child-readable feedback")

	quest_registry.start_quest("act1_pre_ride_check")
	quest_registry.record_objective("act1_pre_ride_check", "leak_found")
	quest_registry.record_objective("act1_pre_ride_check", "leak_marked")
	quest_registry.record_objective("act1_pre_ride_check", "patch_applied")
	await process_frame
	_assert(inventory_manager.is_recipe_learned("patch_ready_tube"), "patch recipe learns from flat tire objective")
	var crafted_after_learning: bool = inventory_manager.combine_items("inner_tube", "patch_kit")
	_assert(crafted_after_learning, "learned tube patch recipe crafts")
	_assert(inventory_manager.has_item("inner_tube_ready"), "crafted ready tube becomes visible inventory")

	quest_registry.start_quest("desert_plant_observation")
	quest_registry.record_objective("desert_plant_observation", "observe_three_plants")
	quest_registry.record_objective("desert_plant_observation", "journal_observations")
	await process_frame
	var snapshot: Dictionary = quest_registry.get_notebook_snapshot()
	_assert(snapshot.get("discoveredPlants", []).size() >= 3, "notebook snapshot includes discovered plants")
	_assert(snapshot.get("recipesLearned", []).size() >= 2, "notebook snapshot includes learned recipes")

	_finish()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if hud != null:
		root.remove_child(hud)
		hud.free()
	if failures.is_empty():
		print("Notebook inventory check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
