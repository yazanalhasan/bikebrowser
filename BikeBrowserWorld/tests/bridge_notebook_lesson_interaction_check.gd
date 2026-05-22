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
	quest_registry.completed_quests["chain_repair"] = { "completedObjectives": ["align_chain"] }
	_assert(quest_registry.start_quest("bridge_quest_5"), "bridge_quest_5 can start after chain repair")
	quest_registry.record_objective("bridge_quest_5", "watch_bridge_presentation")

	var hud_scene: PackedScene = load("res://Regions/UI/Hud.tscn")
	_assert(hud_scene != null, "HUD scene loads")
	if hud_scene == null:
		_finish()
		return
	hud = hud_scene.instantiate()
	root.add_child(hud)
	await process_frame

	var presentation := _read_json("res://Data/presentations/mr_chen_triangle_bridge_lesson.json")
	hud.call("_show_presentation", presentation)
	await process_frame
	var panel: Panel = hud.get_node_or_null("BridgePresentationPanel")
	var diagram: Control = panel.get_node_or_null("Margin/Content/BridgePresentationDiagram") if panel != null else null
	var next_button: Button = hud.get("presentation_next_button")
	_assert(panel != null and panel.visible, "bridge notebook lesson panel opens")
	_assert(diagram != null, "bridge notebook diagram exists")
	_assert(diagram != null and diagram.has_method("force_complete_for_test"), "bridge diagram exposes test completion hook")

	var slides: Array = presentation.get("slides", [])
	for index in range(slides.size()):
		if diagram != null:
			diagram.call("force_complete_for_test")
		await process_frame
		if next_button != null:
			_assert(not next_button.disabled, "page %d unlocks the next button after interaction" % [index + 1])
		if index < slides.size() - 1:
			hud.call("_advance_presentation")
			await process_frame

	var state: Dictionary = quest_registry.active_quests.get("bridge_quest_5", {})
	var completed: Array = state.get("completedObjectives", [])
	for objective_id in ["watch_bridge_presentation", "compare_bridge_types", "identify_bridge_parts", "learn_triangles", "trace_load_path"]:
		_assert(completed.has(objective_id), "lesson records objective " + objective_id)

	var snapshot: Dictionary = quest_registry.get_notebook_snapshot()
	var sketch_text := JSON.stringify(snapshot.get("sketches", []))
	for phrase in ["Bridge families", "Triangle brace", "Bridge load path", "Triangles keep a bridge from folding"]:
		_assert(sketch_text.contains(phrase), "notebook contains " + phrase)

	_finish()

func _read_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		failures.append("Cannot read " + path)
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		failures.append("JSON root is not an object: " + path)
		return {}
	return parsed

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if hud != null:
		root.remove_child(hud)
		hud.free()
	if failures.is_empty():
		print("Bridge notebook lesson interaction check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
