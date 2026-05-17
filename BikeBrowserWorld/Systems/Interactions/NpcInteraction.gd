extends Area2D

@export var npc_id := ""
@export var dialogue_id := ""
@export var feedback_message := "The character turns toward Zuzu, ready to talk."
@export var feedback_tone := "warm"

var player_in_range := false
var pulse_time := 0.0
var interaction_locked := false
var body_base_position := Vector2.ZERO
var body_base_rotation := 0.0
var last_presence_msec := -30000
@onready var prompt: Label = get_node_or_null("Prompt")
@onready var body_visual: Node2D = get_node_or_null("Body")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		prompt.text = "[E] Talk"
		_style_prompt(prompt)
		prompt.visible = false
	if body_visual:
		body_base_position = body_visual.position
		body_base_rotation = body_visual.rotation

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)
	if body_visual:
		body_visual.position = body_base_position
		body_visual.rotation = body_base_rotation
		match npc_id:
			"mr_chen":
				body_visual.rotation = body_base_rotation + sin(pulse_time * 0.65) * 0.012
			"mrs_ramirez":
				body_visual.position.x = body_base_position.x + sin(pulse_time * 0.55) * 0.45
			"old_miner":
				body_visual.rotation = body_base_rotation + sin(pulse_time * 0.48) * 0.01
			"desert_guide":
				body_visual.position.y = body_base_position.y + sin(pulse_time * 0.38) * 0.55
			"river_biologist":
				body_visual.position.y = body_base_position.y + sin(pulse_time * 0.5) * 0.35
			_:
				body_visual.position.y = body_base_position.y + sin(pulse_time * 1.6) * 0.8

func _unhandled_input(event: InputEvent) -> void:
	if player_in_range and event.is_action_pressed("ui_accept"):
		interact()

func interact() -> void:
	if interaction_locked:
		return
	interaction_locked = true
	await get_tree().create_timer(0.08).timeout
	if not player_in_range:
		interaction_locked = false
		return
	var dialogue_manager := get_node_or_null("/root/DialogueManager")
	if dialogue_manager != null and dialogue_manager.has_method("start_dialogue"):
		dialogue_manager.start_dialogue(_current_dialogue_id(), npc_id)
	else:
		push_warning("DialogueManager autoload is not available for NPC dialogue: %s" % dialogue_id)
	var event_bus := get_node_or_null("/root/EventBus")
	if event_bus != null:
		event_bus.interaction_feedback.emit(_current_feedback_message(), feedback_tone)
	await get_tree().create_timer(0.18).timeout
	interaction_locked = false

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if prompt:
			_show_prompt()
		_emit_presence_line()

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

func _current_dialogue_id() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "mrs_ramirez_after_chain"
			if _quest_completed("bike_safety_check"):
				return "mrs_ramirez_after_safety"
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "mr_chen_after_chain"
			if _quest_completed("bike_safety_check"):
				return "mr_chen_after_safety"
	return dialogue_id

func _current_feedback_message() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "Mrs. Ramirez glances at the bike chain and smiles like she heard the difference."
			if _quest_completed("bike_safety_check"):
				return "Mrs. Ramirez gives the tire a tiny nod, already back in her riding rhythm."
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "Mr. Chen listens for the chain before he says anything."
			if _quest_completed("bike_safety_check"):
				return "Mr. Chen notices Zuzu checking the bike before rushing in."
	return feedback_message

func _emit_presence_line() -> void:
	var now := Time.get_ticks_msec()
	if now - last_presence_msec < 14000:
		return
	last_presence_msec = now
	var event_bus := get_node_or_null("/root/EventBus")
	if event_bus == null:
		return
	var line := _presence_line()
	if not line.is_empty():
		event_bus.interaction_feedback.emit(line, "quiet")

func _presence_line() -> String:
	match npc_id:
		"mrs_ramirez":
			if _quest_completed("chain_repair"):
				return "Mrs. Ramirez murmurs, \"That chain sounds happier.\""
			if _quest_completed("bike_safety_check"):
				return "Mrs. Ramirez checks the breeze, then the curb, like she always does."
			return "Mrs. Ramirez flexes her fingers in her gloves. \"Cool evening for a ride.\""
		"mr_chen":
			if _quest_completed("chain_repair"):
				return "Mr. Chen rests a hand near the bike, just listening."
			if _quest_completed("bike_safety_check"):
				return "Mr. Chen says softly, \"Careful eyes. Good start.\""
			return "Mr. Chen studies the garage light for a moment."
	return ""

func _quest_completed(quest_id: String) -> bool:
	var quest_registry := get_node_or_null("/root/QuestRegistry")
	return quest_registry != null and quest_registry.completed_quests.has(quest_id)
