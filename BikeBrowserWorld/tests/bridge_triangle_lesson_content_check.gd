extends SceneTree

var failures: Array[String] = []

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var mission := _read_json("res://Data/missions/bridge_quest_5.json")
	var dialogue := _read_json("res://Data/dialogue/mr_chen_bridge.json")
	var presentation := _read_json("res://Data/presentations/mr_chen_triangle_bridge_lesson.json")

	_assert(String(mission.get("presentation_id", "")) == "mr_chen_triangle_bridge_lesson", "bridge_quest_5 points at Mr. Chen triangle bridge presentation")
	var step_ids := _ids_from_array(mission.get("steps", []))
	for required_id in ["watch_bridge_presentation", "compare_bridge_types", "identify_bridge_parts", "learn_triangles", "trace_load_path"]:
		_assert(step_ids.has(required_id), "bridge_quest_5 includes objective " + required_id)

	var dialogue_ids := _ids_from_array(dialogue.get("lines", []))
	_assert(dialogue_ids.has("triangle_bridge_presentation"), "mr_chen_bridge has triangle_bridge_presentation line")
	_assert(dialogue_ids.has("load_path_wrap"), "mr_chen_bridge has load_path_wrap line")

	var slides: Array = presentation.get("slides", [])
	_assert(slides.size() == 6, "presentation has six interactive notebook pages")
	var slide_text := JSON.stringify(slides)
	for keyword in ["Beam", "Arches", "superstructure", "abutments", "triangle", "truss"]:
		_assert(slide_text.to_lower().contains(keyword.to_lower()), "presentation mentions " + keyword)
	for slide in slides:
		if typeof(slide) != TYPE_DICTIONARY:
			continue
		_assert(not String(slide.get("interaction_type", "")).is_empty(), "slide has interaction type: " + String(slide.get("id", "")))
		_assert(not String(slide.get("takeaway", "")).is_empty(), "slide has notebook takeaway: " + String(slide.get("id", "")))

	if failures.is_empty():
		print("Bridge triangle lesson content check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)

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

func _ids_from_array(items: Array) -> Array[String]:
	var ids: Array[String] = []
	for item in items:
		if typeof(item) == TYPE_DICTIONARY:
			ids.append(String(item.get("id", "")))
	return ids

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)
