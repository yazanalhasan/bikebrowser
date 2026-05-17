extends Node

const ALLOWED_EVENTS := {
	"quest_started": true,
	"reward_intent": true,
	"save_requested": true,
	"debug_log": true
}

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
		var window = JavaScriptBridge.get_interface("window")
		window.parent.postMessage(payload, "*")

func receive_react_message(message: Dictionary) -> void:
	EventBus.emit_game_event("react_message_received", message)
