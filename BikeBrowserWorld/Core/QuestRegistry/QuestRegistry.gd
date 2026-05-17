extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay quest registry. Procedural quest
# addons are library/demo systems unless explicitly bridged here.

const MISSIONS_DIR := "res://Data/missions"

var quests: Dictionary = {}
var active_quests: Dictionary = {}
var completed_quests: Dictionary = {}
var quest_errors: Array = []
var quest_warnings: Array = []

func _ready() -> void:
	load_all_missions()
	validate_quest_graph()
	print_quest_summary()

func load_all_missions() -> void:
	quests.clear()
	quest_errors.clear()
	quest_warnings.clear()
	var dir := DirAccess.open(MISSIONS_DIR)
	if dir == null:
		var message := "QuestRegistry: cannot open missions directory: %s" % MISSIONS_DIR
		quest_errors.append(message)
		push_error(message)
		return
	dir.list_dir_begin()
	var file_name := dir.get_next()
	while file_name != "":
		if not dir.current_is_dir() and file_name.ends_with(".json"):
			_load_mission_file(MISSIONS_DIR + "/" + file_name)
		file_name = dir.get_next()
	dir.list_dir_end()

func _load_mission_file(path: String) -> void:
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		quest_errors.append("Cannot read mission file: %s" % path)
		return
	var parsed = JSON.parse_string(file.get_as_text())
	if typeof(parsed) != TYPE_DICTIONARY:
		quest_errors.append("Mission file is not a JSON object: %s" % path)
		return
	var mission: Dictionary = parsed
	if not mission.has("id") or String(mission["id"]).strip_edges().is_empty():
		quest_errors.append("Mission missing id: %s" % path)
		return
	var id := String(mission["id"])
	if quests.has(id):
		quest_errors.append("Duplicate mission id '%s' in %s and %s" % [id, path, quests[id].get("_source_path", "")])
		return
	mission["_source_path"] = path
	quests[id] = mission

func validate_quest_graph() -> void:
	for quest_id in quests.keys():
		var quest: Dictionary = quests[quest_id]
		if quest.has("steps") and typeof(quest.get("steps")) != TYPE_ARRAY:
			quest_errors.append("Quest %s has non-array steps in %s" % [quest_id, quest.get("_source_path", "")])
		if quest.has("reward") and typeof(quest.get("reward")) != TYPE_DICTIONARY:
			quest_warnings.append("Quest %s has non-dictionary reward in %s" % [quest_id, quest.get("_source_path", "")])
		_validate_quest_references(quest_id, "prerequisites", quest.get("prerequisites", []))
		_validate_quest_references(quest_id, "unlocks", quest.get("unlocks", []))
		var next_id := String(quest.get("next", quest.get("next_in_chain", "")))
		if not next_id.is_empty() and not quests.has(next_id):
			quest_errors.append("Quest %s references missing next quest: %s" % [quest_id, next_id])

func print_quest_summary() -> void:
	print("QuestRegistry loaded %d missions from %s" % [quests.size(), MISSIONS_DIR])
	print("Registered runtime quests:")
	for quest_id in quests.keys():
		print("- %s" % quest_id)
	print("Quest validation: %d errors, %d warnings" % [quest_errors.size(), quest_warnings.size()])

func get_validation_report() -> Dictionary:
	return {
		"quest_count": quests.size(),
		"errors": quest_errors,
		"warnings": quest_warnings,
		"quest_ids": quests.keys()
	}

func has_quest(quest_id: String) -> bool:
	return quests.has(quest_id)

func get_quest(quest_id: String) -> Dictionary:
	return quests.get(quest_id, {})

func start_quest(quest_id: String) -> bool:
	if completed_quests.has(quest_id):
		return false
	if active_quests.has(quest_id):
		return true
	if not quests.has(quest_id):
		EventBus.log_debug("Unknown quest requested", { "questId": quest_id })
		return false
	active_quests[quest_id] = {
		"stepIndex": 0,
		"completedObjectives": [],
		"startedAt": Time.get_datetime_string_from_system(true)
	}
	EventBus.quest_started.emit(quest_id)
	CompanionBridge.send_event({
		"type": "quest_started",
		"questId": quest_id
	})
	SaveService.save_now("quest_started")
	return true

func is_active(quest_id: String) -> bool:
	return active_quests.has(quest_id)

func record_objective(quest_id: String, objective_id: String) -> void:
	if not active_quests.has(quest_id):
		EventBus.log_debug("Objective ignored because quest is inactive", {
			"questId": quest_id,
			"objectiveId": objective_id
		})
		return
	var state: Dictionary = active_quests[quest_id]
	var completed: Array = state.get("completedObjectives", [])
	if not completed.has(objective_id):
		completed.append(objective_id)
	state["completedObjectives"] = completed
	active_quests[quest_id] = state
	EventBus.quest_step_completed.emit(quest_id, objective_id)
	if _quest_objectives_complete(quest_id, completed):
		complete_quest(quest_id)
	else:
		SaveService.save_now("quest_objective")

func complete_quest(quest_id: String) -> void:
	if not active_quests.has(quest_id):
		return
	var quest: Dictionary = quests.get(quest_id, {})
	active_quests.erase(quest_id)
	completed_quests[quest_id] = {
		"completedAt": Time.get_datetime_string_from_system(true)
	}
	EventBus.quest_completed.emit(quest_id)
	RewardBridge.emit_reward_intent(quest.get("reward", {}), quest_id)
	SaveService.save_now("quest_completed")

func serialize() -> Dictionary:
	return {
		"active": active_quests,
		"completed": completed_quests
	}

func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _quest_objectives_complete(quest_id: String, completed: Array) -> bool:
	var quest: Dictionary = quests.get(quest_id, {})
	var steps: Array = quest.get("steps", [])
	for step in steps:
		var step_id := String(step.get("id", ""))
		if step.get("type", "") != "dialogue" and step_id != "" and not completed.has(step_id):
			return false
	return true

func _validate_quest_references(quest_id: String, field: String, value) -> void:
	var references: Array = []
	if typeof(value) == TYPE_ARRAY:
		references = value
	elif typeof(value) == TYPE_STRING and not String(value).is_empty():
		references = [value]
	for reference in references:
		var reference_id := String(reference)
		if not reference_id.is_empty() and not quests.has(reference_id):
			quest_errors.append("Quest %s references missing %s quest: %s" % [quest_id, field, reference_id])
