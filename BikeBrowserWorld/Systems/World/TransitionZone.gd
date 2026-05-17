extends Area2D

@export var target_region := ""
@export var target_spawn := "default"
@export var require_accept := true
@export var feedback_message := "The warm light pulls Zuzu into the next space."
# Set true on a transition that is intentionally overlapping an NPC interaction
# circle (e.g. a doorway an NPC is supposed to greet from). The interaction-overlap
# regression test treats this as opt-in.
@export var allow_overlap: bool = false
# If non-empty, the transition is locked until the named quest is in
# QuestRegistry.completed_quests. Used to keep skeleton side regions out of
# the first 15 minutes. See project_audit/side_region_containment.md.
@export var required_quest_id := ""

var player_in_range := false
var pulse_time := 0.0
var transition_locked := false
@onready var prompt: Label = get_node_or_null("Prompt")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		prompt.text = _prompt_copy(prompt.text)
		_style_prompt(prompt)
		prompt.visible = false

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)

func _unhandled_input(event: InputEvent) -> void:
	if require_accept and player_in_range and event.is_action_pressed("ui_accept"):
		_transition()

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		if _is_locked():
			return
		if prompt:
			_show_prompt()
		if not require_accept:
			_transition()

func _is_locked() -> bool:
	if required_quest_id == "":
		return false
	var registry := get_node_or_null("/root/QuestRegistry")
	if registry == null:
		return false
	return not registry.completed_quests.has(required_quest_id)

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		if prompt:
			_hide_prompt()

func _transition() -> void:
	if transition_locked:
		return
	if _is_locked():
		return
	if _dialogue_is_active():
		return
	transition_locked = true
	if prompt:
		var tween := create_tween()
		tween.tween_property(prompt, "scale", Vector2.ONE * 1.012, 0.10).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
		tween.tween_property(prompt, "scale", Vector2.ONE, 0.16).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	await get_tree().create_timer(0.18).timeout
	if not player_in_range or _dialogue_is_active():
		transition_locked = false
		return
	AudioService.play_sfx("transition_soft", "transition")
	EventBus.interaction_feedback.emit(feedback_message, "transition")
	RegionRegistry.change_region(target_region, target_spawn)

func _dialogue_is_active() -> bool:
	var scene := get_tree().current_scene
	if scene == null:
		return false
	var dialogue_panel := scene.get_node_or_null("DialogBox/Panel")
	return dialogue_panel is CanvasItem and dialogue_panel.visible

func _prompt_copy(raw_text: String) -> String:
	var text := raw_text.strip_edges()
	if text == "":
		text = "Enter"
	if text.begins_with("[E]"):
		text = text.substr(3).strip_edges()
	return "[E] " + text.replace("Enter ", "")

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
