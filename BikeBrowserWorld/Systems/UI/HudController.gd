extends CanvasLayer

@onready var quest_label: Label = $Panel/HBox/VBox/QuestLabel
@onready var hint_label: Label = $Panel/HBox/VBox/HintLabel
@onready var reward_panel: Panel = $RewardPanel
@onready var reward_label: Label = $RewardPanel/HBox/RewardLabel

func _ready() -> void:
	EventBus.quest_started.connect(_on_quest_started)
	EventBus.quest_step_completed.connect(_on_quest_step_completed)
	EventBus.quest_completed.connect(_on_quest_completed)
	EventBus.game_event.connect(_on_game_event)
	EventBus.reward_intent.connect(_on_reward_intent)
	EventBus.reward_feedback.connect(_on_reward_feedback)
	EventBus.interaction_feedback.connect(_on_interaction_feedback)
	if reward_panel:
		reward_panel.visible = false
	_refresh_guidance()

func _on_quest_started(quest_id: String) -> void:
	_refresh_guidance(quest_id)

func _on_quest_step_completed(_quest_id: String, _step_id: String) -> void:
	_refresh_guidance()

func _on_quest_completed(quest_id: String) -> void:
	_refresh_guidance(quest_id)

func _on_game_event(event: Dictionary) -> void:
	var event_type := String(event.get("type", ""))
	if event_type == "quest_unlocked" or event_type == "quest_locked":
		_refresh_guidance()

func _on_reward_intent(reward: Dictionary) -> void:
	_refresh_guidance(String(reward.get("questId", "")))

func _on_reward_feedback(reward: Dictionary) -> void:
	if not reward_panel or not reward_label:
		return
	var item_text := _format_reward_items(reward.get("items", []))
	var badge_text := String(reward.get("badge", "keepsake"))
	if item_text.is_empty():
		reward_label.text = "+$%.2f  %s" % [float(reward.get("amount", 0.0)), badge_text]
	else:
		reward_label.text = "+$%.2f  %s  %s" % [float(reward.get("amount", 0.0)), badge_text, item_text]
	reward_panel.visible = true
	var tween := create_tween()
	reward_panel.scale = Vector2(0.99, 0.99)
	reward_panel.modulate.a = 0.0
	tween.tween_property(reward_panel, "modulate:a", 0.88, 0.36).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(reward_panel, "scale", Vector2.ONE, 0.36).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.tween_interval(2.15)
	tween.tween_property(reward_panel, "modulate:a", 0.0, 0.65).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: reward_panel.visible = false)

func _on_interaction_feedback(message: String, tone: String) -> void:
	hint_label.text = message
	call_deferred("_refresh_guidance")

func _refresh_guidance(preferred_quest_id := "") -> void:
	var guidance := _guidance_for(preferred_quest_id)
	quest_label.text = String(guidance.get("questName", "First Ride Check"))
	hint_label.text = _format_guidance_hint(guidance)

func _guidance_for(preferred_quest_id: String) -> Dictionary:
	if preferred_quest_id != "" and QuestRegistry.has_method("get_current_objective") and QuestRegistry.is_active(preferred_quest_id):
		var objective: Dictionary = QuestRegistry.get_current_objective(preferred_quest_id)
		if not objective.is_empty():
			return objective
	if QuestRegistry.has_method("get_act1_hud_guidance"):
		return QuestRegistry.get_act1_hud_guidance()
	return {
		"questName": "First Ride Check",
		"description": "Move with WASD or arrows. Walk to the glowing bike or garage prompt, then use E.",
	}

func _format_guidance_hint(guidance: Dictionary) -> String:
	var description := String(guidance.get("description", "Move close and use the small prompt."))
	var objective_id := String(guidance.get("objectiveId", ""))
	if objective_id.is_empty():
		return description
	var completed_count := int(guidance.get("completedCount", 0))
	var total_count := int(guidance.get("totalCount", 0))
	if total_count > 0:
		return "Objective %d/%d: %s" % [completed_count + 1, total_count, description]
	return description

func _nice_title(quest_id: String) -> String:
	match quest_id:
		"chain_repair":
			return "Fix Mr. Chen's Chain"
		"bike_safety_check":
			return "Safety Check"
		"flat_tire_repair":
			return "Patch the Flat Tire"
		_:
			return quest_id.replace("_", " ").capitalize()

func _format_reward_items(items) -> String:
	if typeof(items) != TYPE_ARRAY or items.is_empty():
		return ""
	var names: Array[String] = []
	for item in items:
		var label := String(item).replace("_", " ").capitalize()
		if not label.is_empty():
			names.append(label)
	if names.is_empty():
		return ""
	return "+ " + ", ".join(names)
