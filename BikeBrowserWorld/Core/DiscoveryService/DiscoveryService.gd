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

func get_discoveries_by_prefix(prefix: String) -> Array:
	var entries: Array = []
	for discovery_id in discovered.keys():
		if String(discovery_id).begins_with(prefix):
			var entry: Dictionary = discovered.get(discovery_id, {})
			entries.append({
				"id": discovery_id,
				"payload": entry.get("payload", {}),
				"discoveredAt": entry.get("discoveredAt", ""),
			})
	return entries
