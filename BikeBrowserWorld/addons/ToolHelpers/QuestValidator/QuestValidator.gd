@tool
extends EditorPlugin

const DEFAULT_FOLDER := "res://Data/missions/"

func _enter_tree() -> void:
	add_tool_menu_item("Validate Quests", _validate_quests)

func _exit_tree() -> void:
	remove_tool_menu_item("Validate Quests")

func _validate_quests() -> void:
	var issues := validate(DEFAULT_FOLDER)
	if issues.is_empty():
		print("Quest Validator: no issues found.")
		return
	for issue in issues:
		print("%s: %s" % [issue.get("severity", "INFO"), issue.get("message", "")])

static func validate(folder: String) -> Array[Dictionary]:
	var quest_ids := {}
	var issues: Array[Dictionary] = []
	var files := _quest_files(folder)
	for path in files:
		var data := _read_json(path)
		if data.is_empty():
			issues.append({"severity": "ERROR", "file": path, "message": "invalid or empty JSON"})
			continue
		var quest_id := str(data.get("id", ""))
		if quest_id.is_empty():
			issues.append({"severity": "ERROR", "file": path, "message": "missing required field \"id\""})
			continue
		if quest_ids.has(quest_id):
			issues.append({"severity": "ERROR", "file": path, "message": "duplicate quest id \"%s\"" % quest_id})
		quest_ids[quest_id] = path
		for required in ["name", "steps"]:
			if not data.has(required):
				issues.append({"severity": "ERROR", "file": path, "message": "missing required field \"%s\"" % required})

	for path in files:
		var data := _read_json(path)
		var quest_id := str(data.get("id", ""))
		for field_name in ["prerequisites", "unlocks", "next_in_chain"]:
			for reference in _as_list(data.get(field_name)):
				if not quest_ids.has(reference):
					issues.append({
						"severity": "ERROR",
						"file": path,
						"quest_id": quest_id,
						"message": "%s \"%s\" not found" % [field_name, reference]
					})
	return issues

static func _quest_files(folder: String) -> Array[String]:
	var results: Array[String] = []
	var dir := DirAccess.open(folder)
	if dir == null:
		return results
	dir.list_dir_begin()
	var name := dir.get_next()
	while not name.is_empty():
		var path := folder.path_join(name)
		if dir.current_is_dir() and not name.begins_with("."):
			results.append_array(_quest_files(path))
		elif name.ends_with(".json") and name != "quest_schema.json":
			results.append(path)
		name = dir.get_next()
	dir.list_dir_end()
	return results

static func _read_json(path: String) -> Dictionary:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var parsed = JSON.parse_string(file.get_as_text())
	return parsed if typeof(parsed) == TYPE_DICTIONARY else {}

static func _as_list(value: Variant) -> Array[String]:
	var result: Array[String] = []
	match typeof(value):
		TYPE_STRING:
			if not str(value).is_empty():
				result.append(str(value))
		TYPE_ARRAY:
			for item in value:
				if typeof(item) == TYPE_STRING:
					result.append(str(item))
				elif typeof(item) == TYPE_DICTIONARY and item.has("id"):
					result.append(str(item.id))
	return result
