extends SceneTree

const MISSIONS_DIR := "res://Data/missions"
const SCAN_ROOTS := ["res://Regions", "res://Systems", "res://Core", "res://Data/dialogue", "res://Data/presentations"]

var failures: Array[String] = []
var surface_refs := {}

func _init() -> void:
	call_deferred("_run")

func _run() -> void:
	var text := ""
	for path in SCAN_ROOTS:
		text += "\n" + _read_tree(path)
	var missions := _load_missions()
	var data_only: Array[String] = []
	for quest_id in missions.keys():
		var mission: Dictionary = missions[quest_id]
		var refs := _count_refs(text, quest_id)
		surface_refs[quest_id] = refs
		var deprecated := bool(mission.get("deprecated", false))
		var deferred := String(mission.get("surface_status", "")) in ["deferred", "deferred_backend_only", "backend_only"]
		if refs == 0 and not deprecated:
			data_only.append(quest_id)
			if not deferred:
				failures.append("Registered quest has no runtime wiring and is not deferred: %s" % quest_id)
	_assert(data_only.has("bridge_quest_2"), "bridge_quest_2 is detected as data-only/deferred")
	_finish()

func _load_missions() -> Dictionary:
	var result := {}
	var dir := DirAccess.open(MISSIONS_DIR)
	if dir == null:
		failures.append("Cannot open missions directory")
		return result
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			var parsed = JSON.parse_string(FileAccess.get_file_as_string(MISSIONS_DIR + "/" + file_name))
			if typeof(parsed) == TYPE_DICTIONARY:
				var id := String(parsed.get("id", ""))
				if not id.is_empty():
					result[id] = parsed
		file_name = dir.get_next()
	dir.list_dir_end()
	return result

func _read_tree(path: String) -> String:
	var dir := DirAccess.open(path)
	if dir == null:
		return ""
	var text := ""
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		var child := path + "/" + file_name
		if dir.current_is_dir():
			if not file_name.begins_with("."):
				text += _read_tree(child)
		elif file_name.ends_with(".gd") or file_name.ends_with(".tscn") or file_name.ends_with(".json"):
			text += "\n" + FileAccess.get_file_as_string(child)
		file_name = dir.get_next()
	dir.list_dir_end()
	return text

func _count_refs(text: String, quest_id: String) -> int:
	var regex := RegEx.new()
	regex.compile("\\b" + quest_id + "\\b")
	return regex.search_all(text).size()

func _assert(condition: bool, message: String) -> void:
	if not condition:
		failures.append(message)

func _finish() -> void:
	if failures.is_empty():
		print("Data-only quest check passed")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
