extends Node

# CANONICAL RUNTIME SYSTEM
# This is the authoritative moment-to-moment reward feedback bridge.
# Achievement systems may listen later, but rewards originate here.

func emit_reward_intent(reward: Dictionary, quest_id: String) -> void:
	var amount := float(reward.get("allowanceAmount", reward.get("allowance", 1.0)))
	var payload := {
		"type": "reward_intent",
		"source": "godot",
		"domain": reward.get("domain", "mechanics"),
		"questId": quest_id,
		"amount": amount,
		"currency": reward.get("currency", "allowance_usd"),
		"label": reward.get("label", "Quest reward"),
		"badge": reward.get("badge", ""),
		"childMessage": reward.get("childMessage", "Nice work."),
		"idempotencyKey": "godot:%s:%s:v1" % [quest_id, reward.get("finalObjective", "complete")]
	}
	EventBus.reward_intent.emit(payload)
	EventBus.reward_feedback.emit(payload)
	CompanionBridge.send_event(payload)
