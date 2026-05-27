extends SceneTree

const ROOTS := ["res://Core", "res://Systems", "res://Regions", "res://Prototypes", "res://tests"]
const MISSIONS_DIR := "res://Data/missions"

var failures: Array[String] = []
var mission_steps: Dictionary = {}

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	_load_mission_steps()
	_scan_roots()
	var quest_registry: Node = root.get_node_or_null("QuestRegistry")
	_assert(quest_registry != null, "QuestRegistry autoload exists")
	if quest_registry != null:
		quest_registry.active_quests.clear()
		quest_registry.completed_quests.clear()
		quest_registry.start_quest("act1_pre_ride_check")
		quest_registry.record_objective("act1_pre_ride_check", "__phantom_objective__")
		_assert(not quest_registry.active_quests.get("act1_pre_ride_check", {}).get("completedObjectives", []).has("__phantom_objective__"), "QuestRegistry rejects undeclared objectives")
		_assert(not quest_registry.objective_record_errors.is_empty(), "QuestRegistry records undeclared objective errors")
	_finish()

func _load_mission_steps() -> void:
	var dir := DirAccess.open(MISSIONS_DIR)
	_assert(dir != null, "missions directory opens")
	if dir == null:
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			var path := MISSIONS_DIR + "/" + file_name
			var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
			if typeof(parsed) == TYPE_DICTIONARY:
				var quest_id := String(parsed.get("id", ""))
				var ids := {}
				for step in parsed.get("steps", []):
					if typeof(step) == TYPE_DICTIONARY:
						var step_id := String(step.get("id", ""))
						if not step_id.is_empty():
							ids[step_id] = true
				if not quest_id.is_empty():
					mission_steps[quest_id] = ids
		file_name = dir.get_next()
	dir.list_dir_end()

func _scan_roots() -> void:
	for root_path in ROOTS:
		_scan_dir(root_path)

func _scan_dir(path: String) -> void:
	var dir := DirAccess.open(path)
	if dir == null:
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		var child := path + "/" + file_name
		if dir.current_is_dir():
			if not file_name.begins_with("."):
				_scan_dir(child)
		elif file_name.ends_with(".gd") or file_name.ends_with(".tscn"):
			_scan_file(child)
		file_name = dir.get_next()
	dir.list_dir_end()

func _scan_file(path: String) -> void:
	var text := FileAccess.get_file_as_string(path)
	var current_quest := ""
	for line in text.split("\n"):
		var quest_in_line := _first_capture(line, "quest_id\\s*(?::=|=)\\s*\"([^\"]+)\"")
		if not quest_in_line.is_empty():
			current_quest = quest_in_line
		var array_match := _first_capture(line, "objective_ids\\s*(?::=|=)\\s*Array\\[String\\]\\(\\[([^\\]]*)\\]\\)")
		if not array_match.is_empty():
			for objective_id in _quoted_values(array_match):
				_validate_reference(path, current_quest, objective_id)
		var objective_in_line := _first_capture(line, "objective_id\\s*(?::=|=)\\s*\"([^\"]+)\"")
		if not objective_in_line.is_empty():
			_validate_reference(path, current_quest, objective_in_line)
		var record_with_export := _first_capture(line, "record_objective\\(\\s*quest_id\\s*,\\s*\"([^\"]+)\"")
		if not record_with_export.is_empty():
			_validate_reference(path, current_quest, record_with_export)
	_scan_record_objective_literals(path, text)

func _scan_record_objective_literals(path: String, text: String) -> void:
	var regex := RegEx.new()
	regex.compile("record_objective\\(\\s*\"([^\"]+)\"\\s*,\\s*\"([^\"]+)\"")
	for match in regex.search_all(text):
		if path.ends_with("quest_objective_schema_check.gd") and match.get_string(2) == "__phantom_objective__":
			continue
		_validate_reference(path, match.get_string(1), match.get_string(2))

func _validate_reference(path: String, quest_id: String, objective_id: String) -> void:
	if quest_id.is_empty() or objective_id.is_empty():
		return
	var canonical := "act1_pre_ride_check" if quest_id == "bike_safety_check" else quest_id
	if not mission_steps.has(canonical):
		failures.append("%s references missing quest %s for objective %s" % [path, canonical, objective_id])
		return
	var ids: Dictionary = mission_steps[canonical]
	if not ids.has(objective_id):
		failures.append("%s references undeclared objective %s:%s" % [path, canonical, objective_id])

func _quoted_values(text: String) -> Array[String]:
	var values: Array[String] = []
	var regex := RegEx.new()
	regex.compile("\"([^\"]+)\"")
	for match in regex.search_all(text):
		values.append(match.get_string(1))
	return values

func _first_capture(text: String, pattern: String) -> String:
	var regex := RegEx.new()
	regex.compile(pattern)
	var match := regex.search(text)
	return match.get_string(1) if match else ""

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Quest objective schema check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
