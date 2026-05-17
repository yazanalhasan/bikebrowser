extends Node

var discovered: Dictionary = {}

func mark_discovered(discovery_id: String, payload: Dictionary = {}) -> void:
	discovered[discovery_id] = {
		"payload": payload,
		"discoveredAt": Time.get_datetime_string_from_system(true)
	}
	EventBus.emit_game_event("discovery_unlocked", {
		"discoveryId": discovery_id,
		"payload": payload
	})

func serialize() -> Dictionary:
	return discovered
