extends Node

signal game_event(event)
signal region_entered(region_id, spawn_id)
signal dialogue_requested(dialogue)
signal quest_started(quest_id)
signal quest_step_completed(quest_id, step_id)
signal quest_completed(quest_id)
signal reward_intent(reward)
signal reward_feedback(reward)
signal accomplishment_feedback(accomplishment)
signal interaction_feedback(message, tone)
signal interaction_focus_requested(target_position: Vector2, zoom_multiplier: float, duration: float)
signal interaction_focus_released(duration: float)
signal audio_unlocked()
signal audio_unlock_failed(reason)
signal tts_unavailable(text)
signal save_requested(save_payload)
signal debug_log(message, payload)
signal notebook_updated(snapshot)
signal inventory_updated(snapshot)
signal recipe_feedback(message, tone)

var modal_stack := 0

func push_modal() -> void:
	modal_stack += 1

func pop_modal() -> void:
	modal_stack = max(0, modal_stack - 1)

func is_modal_active() -> bool:
	return modal_stack > 0

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
