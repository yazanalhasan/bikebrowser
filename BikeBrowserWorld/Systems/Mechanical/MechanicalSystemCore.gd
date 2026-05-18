extends Node2D
class_name MechanicalSystemCore

# Lightweight shared base for embodied mechanical rigs.
# It intentionally owns only common part registration, state notifications,
# validation snapshots, and telemetry forwarding. Specific physics and pacing
# stay in each rig.

signal mechanical_state_changed(previous_state: String, next_state: String)

var mechanical_state := "uninitialized"
var parts := {}
var force_channels := {}
var validation_tags := {}

func register_part(part_id: String, node: Node = null, metadata: Dictionary = {}) -> void:
	parts[part_id] = {
		"node_path": str(node.get_path()) if node != null else "",
		"metadata": metadata.duplicate(true),
	}

func set_force_channel(channel_id: String, value: float) -> void:
	force_channels[channel_id] = clamp(value, 0.0, 1.0)

func transition_to(next_state: String, payload: Dictionary = {}) -> void:
	if mechanical_state == next_state:
		return
	var previous := mechanical_state
	mechanical_state = next_state
	mechanical_state_changed.emit(previous, next_state)
	emit_mechanical_event("state_changed", payload)

func emit_mechanical_event(event_type: String, payload: Dictionary = {}) -> void:
	var event := payload.duplicate(true)
	event["rig"] = name
	event["mechanical_state"] = mechanical_state
	event["event_type"] = event_type
	event["parts"] = parts.keys()
	event["forces"] = force_channels.duplicate(true)
	if has_node("/root/EventBus"):
		get_node("/root/EventBus").emit_game_event("mechanical_rig_event", event)

func get_validation_snapshot() -> Dictionary:
	return {
		"rig": name,
		"mechanical_state": mechanical_state,
		"parts": parts.keys(),
		"forces": force_channels.duplicate(true),
		"validation_tags": validation_tags.duplicate(true),
	}
