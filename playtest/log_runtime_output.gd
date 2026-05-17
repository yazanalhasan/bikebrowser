extends Node

# Optional playtest helper. Attach/autoload only for live human playtest sessions.
# Mirrors meaningful gameplay events to playtest logs and session state.

const LOG_PATH := "res://../playtest/logs/runtime_live.log"
const SESSION_STATE_PATH := "res://../playtest/active_session/session_state.json"
const TELEMETRY_PATH := "res://../playtest/telemetry/runtime_events.jsonl"

var recent_prompt_state := "unknown"
var recent_interaction := "none"
var recent_npc := "none"
var recent_reward := "none"
var current_region := "unknown"
var current_audio_region := "unknown"
var current_quest := "unknown"
var recent_transition := "none"

func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../playtest/logs"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../playtest/telemetry"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://../playtest/active_session"))
	call_deferred("_connect_runtime_signals")
	_log("playtest_logger_ready", {})

func _connect_runtime_signals() -> void:
	var event_bus := get_node_or_null("/root/EventBus")
	if event_bus == null:
		_log("warning", { "message": "EventBus not available for playtest logging" })
		return
	event_bus.region_entered.connect(_on_region_entered)
	event_bus.dialogue_requested.connect(_on_dialogue_requested)
	event_bus.quest_started.connect(_on_quest_started)
	event_bus.quest_step_completed.connect(_on_quest_step_completed)
	event_bus.quest_completed.connect(_on_quest_completed)
	event_bus.reward_intent.connect(_on_reward_intent)
	event_bus.reward_feedback.connect(_on_reward_feedback)
	event_bus.interaction_feedback.connect(_on_interaction_feedback)
	event_bus.debug_log.connect(_on_debug_log)
	_log("runtime_signals_connected", {})

func _on_region_entered(region_id: String, spawn_id: String) -> void:
	recent_transition = "%s:%s" % [region_id, spawn_id]
	current_region = region_id
	current_audio_region = region_id
	_log("region_entered", { "region": region_id, "spawn": spawn_id })

func _on_dialogue_requested(dialogue: Dictionary) -> void:
	var dialogue_id := String(dialogue.get("id", dialogue.get("dialogueId", "unknown")))
	recent_npc = String(dialogue.get("speaker", dialogue.get("npc", recent_npc)))
	_log("dialogue_requested", { "dialogue": dialogue_id, "npc": recent_npc })

func _on_quest_started(quest_id: String) -> void:
	current_quest = quest_id
	_log("quest_started", { "quest": quest_id })

func _on_quest_step_completed(quest_id: String, step_id: String) -> void:
	current_quest = quest_id
	recent_interaction = step_id
	_log("quest_step_completed", { "quest": quest_id, "step": step_id })

func _on_quest_completed(quest_id: String) -> void:
	current_quest = quest_id
	_log("quest_completed", { "quest": quest_id })

func _on_reward_intent(reward: Dictionary) -> void:
	recent_reward = JSON.stringify(reward)
	_log("reward_intent", reward)

func _on_reward_feedback(reward: Dictionary) -> void:
	recent_reward = JSON.stringify(reward)
	_log("reward_feedback", reward)

func _on_interaction_feedback(message: String, tone: String) -> void:
	recent_prompt_state = tone
	recent_interaction = message
	_log("interaction_feedback", { "message": message, "tone": tone })

func _on_debug_log(message: String, payload: Dictionary) -> void:
	var text := message.to_lower()
	if text.find("warning") != -1 or text.find("error") != -1 or text.find("validation") != -1:
		_log("debug_log", { "message": message, "payload": payload })

func _log(event_type: String, payload: Dictionary) -> void:
	var event := {
		"timestamp": Time.get_datetime_string_from_system(true),
		"type": event_type,
		"scene": _current_scene_path(),
		"region": current_region,
		"quest": current_quest,
		"payload": payload
	}
	_append_line(LOG_PATH, "[%s] %s %s" % [event["timestamp"], event_type, JSON.stringify(payload)])
	_append_line(TELEMETRY_PATH, JSON.stringify(event))
	_update_session_state(event)

func _append_line(path: String, line: String) -> void:
	var file := FileAccess.open(path, FileAccess.READ_WRITE)
	if file == null:
		file = FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_warning("Could not write playtest log: %s" % path)
		return
	file.seek_end()
	file.store_line(line)

func _update_session_state(event: Dictionary) -> void:
	var state := _read_json(SESSION_STATE_PATH)
	state["currentRegion"] = current_region
	state["currentScene"] = _current_scene_path()
	state["currentQuest"] = current_quest
	state["recentInteraction"] = recent_interaction
	state["recentNpc"] = recent_npc
	state["recentTransition"] = recent_transition
	state["runtimeTimestamp"] = String(event.get("timestamp", ""))
	state["currentAudioRegion"] = current_audio_region
	state["recentRewardEvent"] = recent_reward
	state["recentPromptState"] = recent_prompt_state
	state["playerPosition"] = _player_position()
	_write_json(SESSION_STATE_PATH, state)

func _player_position() -> Dictionary:
	var player := get_tree().get_first_node_in_group("player")
	if player is Node2D:
		return {
			"available": true,
			"x": snapped(player.global_position.x, 0.01),
			"y": snapped(player.global_position.y, 0.01)
		}
	return { "available": false, "x": null, "y": null }

func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var parsed = JSON.parse_string(FileAccess.get_file_as_string(path))
	if typeof(parsed) == TYPE_DICTIONARY:
		return parsed
	return {}

func _write_json(path: String, data: Dictionary) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		push_warning("Could not write playtest session state: %s" % path)
		return
	file.store_string(JSON.stringify(data, "\t"))

func _current_scene_path() -> String:
	var scene := get_tree().current_scene
	if scene == null:
		return "unknown"
	return scene.scene_file_path if not scene.scene_file_path.is_empty() else scene.name
