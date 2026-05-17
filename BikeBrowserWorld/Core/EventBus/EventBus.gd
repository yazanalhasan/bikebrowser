extends Node

signal game_event(event)
signal region_entered(region_id, spawn_id)
signal dialogue_requested(dialogue)
signal quest_started(quest_id)
signal quest_step_completed(quest_id, step_id)
signal quest_completed(quest_id)
signal reward_intent(reward)
signal reward_feedback(reward)
signal interaction_feedback(message, tone)
signal audio_unlocked()
signal audio_unlock_failed(reason)
signal tts_unavailable(text)
signal save_requested(save_payload)
signal debug_log(message, payload)

func emit_game_event(type: String, payload: Dictionary = {}) -> void:
	var event := payload.duplicate(true)
	event["type"] = type
	event["timestamp"] = Time.get_datetime_string_from_system(true)
	game_event.emit(event)

func log_debug(message: String, payload: Dictionary = {}) -> void:
	debug_log.emit(message, payload)
	emit_game_event("debug_log", {
		"message": message,
		"payload": payload,
	})
