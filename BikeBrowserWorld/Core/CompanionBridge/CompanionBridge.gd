extends Node

const ALLOWED_EVENTS := {
	"quest_started": true,
	"reward_intent": true,
	"save_requested": true,
	"debug_log": true
}

func _ready() -> void:
	call_deferred("_send_bridge_ready")

func _send_bridge_ready() -> void:
	await get_tree().create_timer(0.35).timeout
	send_event({
		"type": "debug_log",
		"message": "Godot bridge ready",
		"source": "godot"
	})

func send_event(event: Dictionary) -> void:
	var event_type := String(event.get("type", ""))
	if not ALLOWED_EVENTS.has(event_type):
		EventBus.log_debug("Blocked unsupported bridge event", { "type": event_type })
		return
	var payload := event.duplicate(true)
	if not payload.has("timestamp"):
		payload["timestamp"] = Time.get_datetime_string_from_system(true)
	EventBus.emit_game_event("bridge_event_sent", payload)
	if OS.has_feature("web"):
		var js_payload := JSON.stringify(payload)
		JavaScriptBridge.eval("window.parent && window.parent.postMessage(%s, '*');" % js_payload, true)

func receive_react_message(message: Dictionary) -> void:
	EventBus.emit_game_event("react_message_received", message)
