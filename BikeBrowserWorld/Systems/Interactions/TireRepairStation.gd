extends Area2D

@export var quest_id := "flat_tire_repair"

var player_in_range := false
var step_index := 0
var wobble := 0.0
var pressure := 0.0
var pulse_time := 0.0
var interaction_locked := false

var steps := [
	{
		"id": "inspect_wheel",
		"prompt": "Spin Wheel",
		"message": "You found the soft spot. The tube needs a careful look.",
		"tone": "curious",
		"audio_cue": "wheel_spin"
	},
	{
		"id": "remove_tube",
		"prompt": "Ease Tube Out",
		"message": "Gentle hands. The tube slides out without a pinch.",
		"tone": "careful",
		"audio_cue": "tube_slide"
	},
	{
		"id": "apply_patch",
		"prompt": "Press Patch",
		"message": "Press and hold. The patch grabs like a tiny shield.",
		"tone": "warm",
		"audio_cue": "patch_press"
	},
	{
		"id": "inflate_tire",
		"prompt": "Pump Air",
		"message": "The tire firms up. Stop in the green and it is ready.",
		"tone": "celebrate",
		"audio_cue": "pump_air"
	}
]

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var wheel: Node2D = get_node_or_null("Wheel")
@onready var tube: Polygon2D = get_node_or_null("Tube")
@onready var patch: Polygon2D = get_node_or_null("Patch")
@onready var pressure_bar: ColorRect = get_node_or_null("PressureBar")
@onready var pressure_fill: ColorRect = get_node_or_null("PressureBar/Fill")

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	if pressure_bar:
		pressure_bar.visible = false
	_update_visuals()

func _process(delta: float) -> void:
	pulse_time += delta
	if wheel:
		wheel.rotation += delta * (1.5 + wobble)
	if patch and step_index == 2:
		var scale := 1.0 + sin(pulse_time * 8.0) * 0.04
		patch.scale = Vector2(scale, scale)

func _unhandled_input(event: InputEvent) -> void:
	if player_in_range and event.is_action_pressed("ui_accept"):
		advance_repair()

func advance_repair() -> void:
	if interaction_locked:
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

func _update_visuals() -> void:
	var done := step_index >= steps.size()
	var next_step: Dictionary = steps[min(step_index, steps.size() - 1)]
	if prompt:
		prompt.text = "[E] " + ("Tire fixed" if done else String(next_step["prompt"]))
		if player_in_range and not prompt.visible:
			_show_prompt()
		else:
			prompt.visible = player_in_range
		if prompt.visible:
			prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
			prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)
	if tube:
		tube.visible = step_index >= 1
		tube.color = Color(0.05, 0.08, 0.09, 1.0) if step_index < 3 else Color(0.05, 0.18, 0.14, 1.0)
	if patch:
		patch.visible = step_index >= 2
	if pressure_bar:
		pressure_bar.visible = step_index >= 3
	if pressure_fill:
		pressure = min(1.0, step_index / 4.0)
		pressure_fill.size.x = 138.0 * pressure
		pressure_fill.color = Color(0.93, 0.68, 0.22, 1.0) if pressure < 0.75 else Color(0.27, 0.78, 0.47, 1.0)
	wobble = max(0.0, 1.0 - step_index * 0.25)

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
