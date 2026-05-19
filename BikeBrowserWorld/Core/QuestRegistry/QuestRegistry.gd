extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative gameplay quest registry. Procedural quest
# addons are library/demo systems unless explicitly bridged here.

const MISSIONS_DIR := "res://Data/missions"
const ITEMS_PATH := "res://Data/items/items.json"
const ACT1_GUIDANCE_ORDER := [
	"bike_safety_check",
	"flat_tire_repair",
	"chain_repair",
	"bridge_quest_5",
	"desert_plant_observation",
	"test_water_quality",
	"copper_rock_id",
	"workshop_first_build",
	"act1_regional_readiness",
]
const ACT1_FALLBACK_GUIDANCE := {
	"bike_safety_check": "Find Mrs. Ramirez by the little bike and begin the safety check.",
	"flat_tire_repair": "Use the garage tire station to inspect, patch, inflate, and verify the flat tire.",
	"chain_repair": "Visit Mr. Chen's garage repair stand and work through the slipped-chain check.",
	"bridge_quest_5": "Return to the bridge review station and trace why the triangle braces carry force safely.",
	"desert_plant_observation": "Take the desert trail station and record plant structure before reporting the notes.",
	"test_water_quality": "Use the Salt River water station to collect, test, identify, and report the evidence chain.",
	"copper_rock_id": "Use the copper mine test station to observe the sample, check conductivity, and report the evidence.",
	"workshop_first_build": "Use the garage workshop station to turn one raw material into a useful first part.",
	"act1_regional_readiness": "Meet at the Act 1 review station and connect the bike, bridge, field, water, copper, and workshop evidence.",
}

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
	var item_ids := _load_item_ids()
	for quest_id in quests.keys():
		var quest: Dictionary = quests[quest_id]
		if quest.has("steps") and typeof(quest.get("steps")) != TYPE_ARRAY:
			quest_errors.append("Quest %s has non-array steps in %s" % [quest_id, quest.get("_source_path", "")])
		if quest.has("reward") and typeof(quest.get("reward")) != TYPE_DICTIONARY:
			quest_warnings.append("Quest %s has non-dictionary reward in %s" % [quest_id, quest.get("_source_path", "")])
		else:
			_validate_reward_items(quest_id, quest.get("reward", {}), item_ids)
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

func get_current_objective(quest_id: String) -> Dictionary:
	if not quests.has(quest_id):
		return {}
	var quest: Dictionary = quests.get(quest_id, {})
	var state: Dictionary = active_quests.get(quest_id, {})
	var completed: Array = state.get("completedObjectives", [])
	for step in quest.get("steps", []):
		if typeof(step) != TYPE_DICTIONARY:
			continue
		if String(step.get("type", "")) == "dialogue":
			continue
		var step_id := String(step.get("id", ""))
		if step_id.is_empty() or completed.has(step_id):
			continue
		return {
			"questId": quest_id,
			"questName": get_quest_title(quest_id),
			"objectiveId": step_id,
			"description": _step_guidance_text(step),
			"completedCount": _count_completed_before(quest, completed, step_id),
			"totalCount": _count_trackable_steps(quest),
		}
	return {}

func get_quest_title(quest_id: String) -> String:
	var quest: Dictionary = quests.get(quest_id, {})
	var title := String(quest.get("name", quest.get("title", "")))
	if title.is_empty():
		title = quest_id.replace("_", " ").capitalize()
	return title

func get_act1_hud_guidance() -> Dictionary:
	for quest_id in ACT1_GUIDANCE_ORDER:
		if active_quests.has(quest_id):
			var objective := get_current_objective(quest_id)
			if not objective.is_empty():
				return objective
	for quest_id in ACT1_GUIDANCE_ORDER:
		if completed_quests.has(quest_id):
			continue
		var guidance := {
			"questId": quest_id,
			"questName": get_quest_title(quest_id),
			"objectiveId": "",
			"description": String(ACT1_FALLBACK_GUIDANCE.get(quest_id, "")),
			"completedCount": 0,
			"totalCount": _count_trackable_steps(quests.get(quest_id, {})),
		}
		var missing := get_locked_reasons(quest_id)
		if not missing.is_empty():
			guidance["lockedReasons"] = missing
			guidance["description"] = _locked_guidance_text(quest_id, missing)
		return guidance
	return {
		"questId": "act1_complete",
		"questName": "Act 1 Complete",
		"objectiveId": "",
		"description": "Act 1 is complete. The wider-region travel sketchbook and spacecraft clue are ready.",
		"completedCount": 0,
		"totalCount": 0,
	}

func start_quest(quest_id: String) -> bool:
	if completed_quests.has(quest_id):
		return false
	if active_quests.has(quest_id):
		return true
	if not quests.has(quest_id):
		EventBus.log_debug("Unknown quest requested", { "questId": quest_id })
		return false
	var locked_reasons := get_locked_reasons(quest_id)
	if not locked_reasons.is_empty():
		EventBus.log_debug("Quest locked by prerequisites", {
			"questId": quest_id,
			"missing": locked_reasons
		})
		EventBus.emit_game_event("quest_locked", {
			"questId": quest_id,
			"missing": locked_reasons
		})
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

func can_start_quest(quest_id: String) -> bool:
	return quests.has(quest_id) and not completed_quests.has(quest_id) and get_locked_reasons(quest_id).is_empty()

func get_locked_reasons(quest_id: String) -> Array:
	var missing: Array = []
	if not quests.has(quest_id):
		missing.append("missing_quest:%s" % quest_id)
		return missing
	var quest: Dictionary = quests.get(quest_id, {})
	for prerequisite in _normalize_references(quest.get("prerequisites", [])):
		if not completed_quests.has(prerequisite):
			missing.append("quest:%s" % prerequisite)
	return missing

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
	_emit_unlock_events(quest)
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

func _step_guidance_text(step: Dictionary) -> String:
	var description := String(step.get("description", step.get("text", "")))
	if description.is_empty():
		description = String(step.get("id", "")).replace("_", " ").capitalize()
	return description

func _count_trackable_steps(quest: Dictionary) -> int:
	var count := 0
	for step in quest.get("steps", []):
		if typeof(step) == TYPE_DICTIONARY and String(step.get("type", "")) != "dialogue" and not String(step.get("id", "")).is_empty():
			count += 1
	return count

func _count_completed_before(quest: Dictionary, completed: Array, objective_id: String) -> int:
	var count := 0
	for step in quest.get("steps", []):
		if typeof(step) != TYPE_DICTIONARY or String(step.get("type", "")) == "dialogue":
			continue
		var step_id := String(step.get("id", ""))
		if step_id == objective_id:
			return count
		if not step_id.is_empty() and completed.has(step_id):
			count += 1
	return count

func _locked_guidance_text(quest_id: String, missing: Array) -> String:
	if quest_id == "act1_regional_readiness":
		return "Act 1 review unlocks after the safety, tire, chain, bridge, desert, water, copper, and workshop objectives are complete."
	var missing_names: Array[String] = []
	for reason in missing:
		var text_reason := String(reason)
		if text_reason.begins_with("quest:"):
			missing_names.append(get_quest_title(text_reason.trim_prefix("quest:")))
	if missing_names.is_empty():
		return String(ACT1_FALLBACK_GUIDANCE.get(quest_id, "Finish the earlier Act 1 objective first."))
	return "Finish %s to unlock this objective." % ", ".join(missing_names)

func _validate_quest_references(quest_id: String, field: String, value) -> void:
	var references := _normalize_references(value)
	for reference in references:
		var reference_id := String(reference)
		if not reference_id.is_empty() and not quests.has(reference_id):
			quest_errors.append("Quest %s references missing %s quest: %s" % [quest_id, field, reference_id])

func _validate_reward_items(quest_id: String, reward: Dictionary, item_ids: Dictionary) -> void:
	for item_id in _normalize_references(reward.get("items", [])):
		var id := String(item_id)
		if not id.is_empty() and not item_ids.has(id):
			quest_errors.append("Quest %s reward references missing item: %s" % [quest_id, id])

func _normalize_references(value) -> Array:
	var references: Array = []
	if typeof(value) == TYPE_ARRAY:
		references = value
	elif typeof(value) == TYPE_STRING and not String(value).is_empty():
		references = [value]
	return references

func _emit_unlock_events(quest: Dictionary) -> void:
	var quest_id := String(quest.get("id", ""))
	for unlock_id in _normalize_references(quest.get("unlocks", [])):
		EventBus.emit_game_event("quest_unlocked", {
			"questId": String(unlock_id),
			"sourceQuestId": quest_id
		})
	var next_id := String(quest.get("next", quest.get("next_in_chain", "")))
	if not next_id.is_empty():
		EventBus.emit_game_event("quest_unlocked", {
			"questId": next_id,
			"sourceQuestId": quest_id
		})

func _load_item_ids() -> Dictionary:
	var ids := {}
	var parsed := _load_json(ITEMS_PATH)
	var items: Array = parsed.get("items", [])
	for item in items:
		if typeof(item) == TYPE_DICTIONARY:
			var item_id := String(item.get("id", ""))
			if not item_id.is_empty():
				ids[item_id] = true
	return ids
