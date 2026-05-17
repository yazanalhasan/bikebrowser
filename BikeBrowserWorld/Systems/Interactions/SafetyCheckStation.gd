extends Area2D

@export var quest_id := "bike_safety_check"

var player_in_range := false
var step_index := 0
var pulse_time := 0.0
var interaction_locked := false
var brake_check_started := false
var brake_check_verified := false

var steps := [
	{
		"id": "check_brakes",
		"prompt": "Squeeze Brakes",
		"message": "The brake pads catch clean. Mrs. Ramirez would nod at that.",
		"tone": "warm",
		"audio_cue": "brake_check"
	},
	{
		"id": "check_tires",
		"prompt": "Press Tire",
		"message": "Firm tire. Not rock-hard, not mushy. Just ready.",
		"tone": "curious",
		"audio_cue": "tire_press"
	},
	{
		"id": "check_chain",
		"prompt": "Turn Pedal",
		"message": "The chain rolls easy, no fuss.",
		"tone": "celebrate",
		"audio_cue": "chain_roll"
	},
	{
		"id": "report_safety_check",
		"prompt": "Tell Mrs. Ramirez",
		"message": "Mrs. Ramirez smiles like she already knew you'd be careful.",
		"tone": "celebrate",
		"audio_cue": "soft_reward"
	}
]

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var bike_sprite: Sprite2D = get_node_or_null("BikeVisual/SafetyBike")
@onready var brake_highlight: Sprite2D = get_node_or_null("BikeVisual/BrakeHighlight")
@onready var tire_highlight: Sprite2D = get_node_or_null("BikeVisual/TireHighlight")
@onready var chain_highlight: Sprite2D = get_node_or_null("BikeVisual/ChainHighlight")
@onready var brake_rig: Node = get_node_or_null("BikeVisual/BrakeRig")
@onready var glow: Polygon2D = get_node_or_null("Glow")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if brake_rig and brake_rig.has_signal("brake_verified_changed"):
		brake_rig.brake_verified_changed.connect(_on_brake_verified_changed)
	if brake_rig:
		brake_rig.visible = false
	if QuestRegistry.completed_quests.has(quest_id):
		step_index = steps.size()
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	_update_visuals()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)
	if bike_sprite:
		bike_sprite.modulate = Color(1.0, 0.985 + sin(pulse_time * 1.8) * 0.012, 0.94, 1.0)
		if step_index >= 2:
			bike_sprite.rotation = sin(pulse_time * 5.0) * 0.012
	if glow:
		glow.modulate.a = 0.13 + sin(pulse_time * 2.2) * 0.035
	_pulse_active_overlay()

func _unhandled_input(event: InputEvent) -> void:
	if not player_in_range:
		return
	if step_index == 0 and not QuestRegistry.completed_quests.has(quest_id):
		if event.is_action_pressed("ui_accept"):
			_begin_brake_check()
			if brake_rig and brake_rig.has_method("set_brake_pressed"):
				brake_rig.set_brake_pressed(true)
		elif event.is_action_released("ui_accept") and brake_rig and brake_rig.has_method("set_brake_pressed"):
			brake_rig.set_brake_pressed(false)
	elif event.is_action_pressed("ui_accept"):
		advance_check()

func advance_check() -> void:
	if interaction_locked:
		return
	if step_index == 0 and not QuestRegistry.completed_quests.has(quest_id):
		_begin_brake_check()
		return
	interaction_locked = true
	if prompt:
		var tween := create_tween()
		tween.tween_property(prompt, "scale", Vector2.ONE * 1.012, 0.10).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		tween.tween_property(prompt, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	await get_tree().create_timer(0.08).timeout
	if not player_in_range:
		interaction_locked = false
		return
	if QuestRegistry.completed_quests.has(quest_id):
		AudioService.play_sfx("soft_click", "gentle")
		EventBus.interaction_feedback.emit("The bike still feels ready. Mrs. Ramirez's little habit stuck.", "quiet")
		await get_tree().create_timer(0.12).timeout
		interaction_locked = false
		return
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	var step: Dictionary = steps[min(step_index, steps.size() - 1)]
	AudioService.play_sfx(String(step.get("audio_cue", "soft_click")), String(step["tone"]))
	QuestRegistry.record_objective(quest_id, String(step["id"]))
	EventBus.interaction_feedback.emit(String(step["message"]), String(step["tone"]))
	step_index = min(step_index + 1, steps.size())
	_update_visuals()
	await get_tree().create_timer(0.10).timeout
	interaction_locked = false

func _begin_brake_check() -> void:
	if brake_check_verified:
		return
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	brake_check_started = true
	if brake_rig:
		brake_rig.visible = true
	if prompt:
		prompt.text = "[Hold E] Squeeze Brakes"

func _on_brake_verified_changed(verified: bool) -> void:
	if not verified or brake_check_verified or step_index != 0:
		return
	brake_check_verified = true
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	QuestRegistry.record_objective(quest_id, "check_brakes")
	EventBus.interaction_feedback.emit("Looks good.", "quiet")
	step_index = 1
	_update_visuals()

func _update_visuals() -> void:
	var done := step_index >= steps.size()
	var next_step: Dictionary = steps[min(step_index, steps.size() - 1)]
	if prompt:
		if step_index == 0 and not brake_check_verified:
			prompt.text = "[Hold E] Squeeze Brakes"
		else:
			prompt.text = "[E] " + ("Safety checked" if done else String(next_step["prompt"]))
		if player_in_range and not prompt.visible:
			_show_prompt()
		else:
			prompt.visible = player_in_range
	_set_overlay_visibility()

func _set_overlay_visibility() -> void:
	if brake_highlight:
		brake_highlight.visible = step_index == 0 and not brake_check_started
	if tire_highlight:
		tire_highlight.visible = step_index == 1
	if chain_highlight:
		chain_highlight.visible = step_index == 2
	if brake_rig:
		brake_rig.visible = step_index == 0 and brake_check_started and not brake_check_verified

func _pulse_active_overlay() -> void:
	for overlay in [brake_highlight, tire_highlight, chain_highlight]:
		if overlay and overlay.visible:
			overlay.modulate.a = 0.34 + sin(pulse_time * 3.0) * 0.09

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		_update_visuals()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		if prompt:
			_hide_prompt()

func _style_prompt(label: Label) -> void:
	label.add_theme_font_size_override("font_size", 13)
	label.add_theme_color_override("font_color", Color(1.0, 0.94, 0.84, 1.0))
	label.add_theme_color_override("font_shadow_color", Color(0.04, 0.05, 0.07, 0.75))
	label.add_theme_constant_override("shadow_offset_x", 1)
	label.add_theme_constant_override("shadow_offset_y", 1)
	var bubble := StyleBoxFlat.new()
	bubble.bg_color = Color(0.12, 0.17, 0.24, 0.64)
	bubble.border_color = Color(1.0, 0.82, 0.48, 0.18)
	bubble.set_border_width_all(1)
	bubble.set_corner_radius_all(10)
	bubble.content_margin_left = 9
	bubble.content_margin_right = 9
	bubble.content_margin_top = 4
	bubble.content_margin_bottom = 4
	label.add_theme_stylebox_override("normal", bubble)

func _show_prompt() -> void:
	prompt.visible = true
	prompt.modulate.a = 0.0
	prompt.scale = Vector2(0.995, 0.995)
	var tween := create_tween()
	tween.tween_property(prompt, "modulate:a", 0.78, 0.30).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	tween.parallel().tween_property(prompt, "scale", Vector2.ONE, 0.30).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)

func _hide_prompt() -> void:
	var tween := create_tween()
	tween.tween_property(prompt, "modulate:a", 0.0, 0.26).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: prompt.visible = false)
