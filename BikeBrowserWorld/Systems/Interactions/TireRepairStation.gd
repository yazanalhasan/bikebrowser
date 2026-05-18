extends Area2D

@export var quest_id := "flat_tire_repair"

var player_in_range := false
var action_down := false
var recorded_states := {}
var pulse_time := 0.0

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var tire_rig: Node = get_node_or_null("TireRig")

var state_objectives := {
	"leak_found": {
		"id": "inspect_wheel",
		"message": "You found the soft hiss instead of guessing.",
		"tone": "curious",
		"audio_cue": "wheel_spin",
	},
	"patch_sealed": {
		"id": "apply_patch",
		"message": "The patch settles in and the leak quiets down.",
		"tone": "careful",
		"audio_cue": "patch_press",
	},
	"tube_exposed": {
		"id": "remove_tube",
		"message": "The tube eases out without a pinch.",
		"tone": "careful",
		"audio_cue": "tube_slide",
	},
	"pressure_safe": {
		"id": "inflate_tire",
		"message": "The tire feels firm without being overfilled.",
		"tone": "warm",
		"audio_cue": "pump_air",
	},
	"tire_verified": {
		"id": "verify_wheel_ready",
		"message": "A quiet spin check says the wheel is ready.",
		"tone": "celebrate",
		"audio_cue": "soft_click",
	},
}

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	if tire_rig:
		if tire_rig.has_signal("mechanical_state_changed"):
			tire_rig.mechanical_state_changed.connect(_on_tire_state_changed)
		if tire_rig.has_signal("tire_soft_feedback"):
			tire_rig.tire_soft_feedback.connect(_on_tire_feedback)
		if tire_rig.has_signal("tire_verified_changed"):
			tire_rig.tire_verified_changed.connect(_on_tire_verified)
	_update_prompt()

func _process(delta: float) -> void:
	pulse_time += delta
	if tire_rig and tire_rig.has_method("set_current_action_pressed"):
		tire_rig.set_current_action_pressed(player_in_range and action_down)
	_update_prompt()

func _unhandled_input(event: InputEvent) -> void:
	if not player_in_range:
		return
	if event.is_action_pressed("ui_accept"):
		action_down = true
		_ensure_quest_started()
	if event.is_action_released("ui_accept"):
		action_down = false
		if tire_rig and tire_rig.has_method("clear_actions"):
			tire_rig.clear_actions()

func _ensure_quest_started() -> void:
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)

func _on_tire_state_changed(_previous_state: String, next_state: String) -> void:
	if not state_objectives.has(next_state) or recorded_states.has(next_state):
		return
	_ensure_quest_started()
	recorded_states[next_state] = true
	var entry: Dictionary = state_objectives[next_state]
	QuestRegistry.record_objective(quest_id, String(entry["id"]))
	AudioService.play_sfx(String(entry.get("audio_cue", "soft_click")), String(entry["tone"]))
	EventBus.interaction_feedback.emit(String(entry["message"]), String(entry["tone"]))
	EventBus.emit_game_event("tire_rig_objective", {
		"quest_id": quest_id,
		"objective_id": String(entry["id"]),
		"state": next_state,
	})

func _on_tire_feedback(kind: String) -> void:
	EventBus.emit_game_event("tire_rig_feedback", {
		"quest_id": quest_id,
		"feedback": kind,
	})

func _on_tire_verified(verified: bool) -> void:
	if verified:
		EventBus.emit_game_event("tire_rig_verified", {"quest_id": quest_id})

func _update_prompt() -> void:
	if not prompt:
		return
	var label := "wheel ready"
	if tire_rig and tire_rig.has_method("get_required_action_label"):
		label = String(tire_rig.get_required_action_label())
	prompt.text = "[hold E] " + label
	prompt.visible = player_in_range
	if prompt.visible:
		prompt.modulate.a = 0.74 + sin(pulse_time * 1.7) * 0.03
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		_update_prompt()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		action_down = false
		if tire_rig and tire_rig.has_method("clear_actions"):
			tire_rig.clear_actions()
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

func _hide_prompt() -> void:
	if not prompt:
		return
	var tween := create_tween()
	tween.tween_property(prompt, "modulate:a", 0.0, 0.26).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	tween.tween_callback(func() -> void: prompt.visible = false)
