extends CanvasLayer

@onready var quest_label: Label = $Panel/HBox/VBox/QuestLabel
@onready var hint_label: Label = $Panel/HBox/VBox/HintLabel
@onready var reward_panel: Panel = $RewardPanel
@onready var reward_label: Label = $RewardPanel/HBox/RewardLabel

func _ready() -> void:
	EventBus.quest_started.connect(_on_quest_started)
	EventBus.quest_completed.connect(_on_quest_completed)
	EventBus.reward_intent.connect(_on_reward_intent)
	EventBus.reward_feedback.connect(_on_reward_feedback)
	EventBus.interaction_feedback.connect(_on_interaction_feedback)
	quest_label.text = "Home at Dusk"
	hint_label.text = "Take a look around. Mrs. Ramirez and Mr. Chen are nearby."
	if reward_panel:
		reward_panel.visible = false

func _on_quest_started(quest_id: String) -> void:
	quest_label.text = _nice_title(quest_id)
	match quest_id:
		"bike_safety_check":
			hint_label.text = "Mrs. Ramirez's little bike is waiting by the curb."
		"chain_repair":
			hint_label.text = "Mr. Chen left the garage light on for the chain."
		_:
			hint_label.text = "Move close and use the small prompt."

func _on_quest_completed(quest_id: String) -> void:
	quest_label.text = _nice_title(quest_id)
	match quest_id:
		"bike_safety_check":
			hint_label.text = "Mrs. Ramirez gives a small proud nod. Mr. Chen could use those same careful eyes."
		"chain_repair":
			hint_label.text = "The chain runs quiet. Back outside, the neighborhood will hear it too."
		_:
			hint_label.text = "The neighborhood notices your careful work."

func _on_reward_intent(reward: Dictionary) -> void:
	hint_label.text = "A small reward is ready."

func _on_reward_feedback(reward: Dictionary) -> void:
	if not reward_panel or not reward_label:
		return
	reward_label.text = "+$%.2f  %s" % [float(reward.get("amount", 0.0)), String(reward.get("badge", "keepsake"))]
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
