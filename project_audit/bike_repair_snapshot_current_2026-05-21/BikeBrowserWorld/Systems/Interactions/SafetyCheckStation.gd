extends Area2D

@export var quest_id := "act1_pre_ride_check"

const GARAGE_HINT_SECONDS := 3.0
const BRAKE_HOLD_SECONDS := 0.8

var player_in_range := false
var step_index := 0
var pulse_time := 0.0
var interaction_locked := false
var brake_check_started := false
var brake_check_verified := false
var active_brake_objective := ""
var hold_progress := 0.0
var garage_hint_time := 0.0
var final_intro_spoken := false

var steps := [
	{
		"id": "air_front_checked",
		"prompt": "Check front tire",
		"message": "Front tire: firm.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "air_rear_flat_found",
		"prompt": "Check rear tire",
		"message": "Rear tire: flat. Slow leak, not a puncture in the road.",
		"voice": "Oh - that's a flat. Slow leak by the look of it. Hold on, though - we finish the check first. You don't bail on a checklist just because you found one problem.",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "brakes_front_checked",
		"prompt": "Squeeze front brake",
		"message": "Front brake catches firm.",
		"voice": "Brakes next. Squeeze the lever - really squeeze it. The pad should bite the rim fast. If the lever pulls all the way to the grip, you've got a problem.",
		"cue": "reward_tiny",
		"kind": "hold_brake",
	},
	{
		"id": "brakes_rear_checked",
		"prompt": "Squeeze rear brake",
		"message": "Brakes: both catch firm.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "hold_brake",
	},
	{
		"id": "chain_checked",
		"prompt": "Spin the pedal",
		"message": "Chain: runs clean.",
		"voice": "Now the chain. Spin the pedal and watch. Clean lines on the teeth, no jumps, no slack hanging.",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "quick_wheel_checked",
		"prompt": "Spin wheel",
		"message": "Wheel: spins true.",
		"voice": "Wheels spin true? Seat tight? Bars lined up with the front wheel? Quick once-over.",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "quick_seat_checked",
		"prompt": "Wiggle seat",
		"message": "Seat: firm.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "quick_handlebars_checked",
		"prompt": "Check bars",
		"message": "Handlebars: aligned.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "tube_received",
		"prompt": "Take tube",
		"message": "Mrs. Ramirez's rear tube is in your inventory.",
		"voice": "So - air is the only problem. Brakes, chain, the rest are good to go. Could you take the rear tube down to the garage and patch that for me? I'd really appreciate it.",
		"cue": "reward_small",
		"kind": "tap",
	},
	{
		"id": "tube_returned",
		"prompt": "Reinstall tube",
		"message": "The repaired tube goes back on Mrs. Ramirez's bike.",
		"voice": "You're back already? Let's get it on and finish the check.",
		"cue": "reward_small",
		"kind": "return_gate",
	},
	{
		"id": "final_air_checked",
		"prompt": "Final: Air",
		"message": "Final inspection: Air checked.",
		"voice": "This time you do it. I'll watch. A-B-C-Quick. You've got it.",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "final_brakes_checked",
		"prompt": "Final: Brakes",
		"message": "Final inspection: Brakes checked.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "hold_brake",
	},
	{
		"id": "final_chain_checked",
		"prompt": "Final: Chain",
		"message": "Final inspection: Chain checked.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "final_quick_checked",
		"prompt": "Final: Quick",
		"message": "Final inspection: wheels, seat, and bars checked.",
		"voice": "",
		"cue": "reward_tiny",
		"kind": "tap",
	},
	{
		"id": "final_report",
		"prompt": "Tell Mrs. Ramirez",
		"message": "I know how to do a pre-ride check. A-B-C-Quick. Air, Brakes, Chain, Quick check.",
		"voice": "Perfect. You did that yourself. That's a real pre-ride check, Zuzu. You can do this for any bike, anywhere. Thank you.",
		"cue": "reward_medium",
		"kind": "tap",
	},
]

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var bike_sprite: Sprite2D = get_node_or_null("BikeVisual/SafetyBike")
@onready var brake_highlight: Sprite2D = get_node_or_null("BikeVisual/BrakeHighlight")
@onready var tire_highlight: Sprite2D = get_node_or_null("BikeVisual/TireHighlight")
@onready var chain_highlight: Sprite2D = get_node_or_null("BikeVisual/ChainHighlight")
@onready var part_focus_glow: Sprite2D = get_node_or_null("BikeVisual/PartFocusGlow")
@onready var brake_rig: Node = get_node_or_null("BikeVisual/BrakeRig")
@onready var glow: Polygon2D = get_node_or_null("Glow")

var front_tire_marker: Polygon2D
var rear_tire_marker: Polygon2D
var seat_marker: Polygon2D
var handlebar_marker: Line2D
var hold_bar: ColorRect
var hold_fill: ColorRect
var garage_hint: Line2D
var chain_motion: Polygon2D
var active_state_variant: Sprite2D

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if brake_rig and brake_rig.has_signal("brake_verified_changed"):
		brake_rig.brake_verified_changed.connect(_on_brake_verified_changed)
	if brake_rig:
		brake_rig.visible = false
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	_build_embodied_overlays()
	_sync_step_from_quest_state()
	_update_visuals()

func _process(delta: float) -> void:
	pulse_time += delta
	if _world_input_blocked() and brake_rig and brake_rig.has_method("set_brake_pressed"):
		brake_rig.set_brake_pressed(false)
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)
	if bike_sprite:
		bike_sprite.modulate = Color(1.0, 0.985 + sin(pulse_time * 1.8) * 0.012, 0.94, 1.0)
		if _completed("air_rear_flat_found"):
			bike_sprite.rotation = sin(pulse_time * 5.0) * 0.010
	if glow:
		glow.modulate.a = 0.13 + sin(pulse_time * 2.2) * 0.035
	if garage_hint_time > 0.0:
		garage_hint_time = max(garage_hint_time - delta, 0.0)
		if garage_hint:
			garage_hint.visible = true
			garage_hint.modulate.a = min(0.62, garage_hint_time / GARAGE_HINT_SECONDS)
	elif garage_hint:
		garage_hint.visible = false
	_update_hold_visuals()
	_pulse_active_overlay()

func _unhandled_input(event: InputEvent) -> void:
	if _world_input_blocked() or not player_in_range:
		return
	var step := _current_step()
	if step.is_empty():
		return
	var kind := String(step.get("kind", "tap"))
	if kind == "hold_brake":
		if event.is_action_pressed("ui_accept"):
			get_viewport().set_input_as_handled()
			_begin_brake_check(String(step["id"]))
			if brake_rig and brake_rig.has_method("set_brake_pressed"):
				brake_rig.set_brake_pressed(true)
		elif event.is_action_released("ui_accept"):
			get_viewport().set_input_as_handled()
			if brake_rig and brake_rig.has_method("set_brake_pressed"):
				brake_rig.set_brake_pressed(false)
	elif event.is_action_pressed("ui_accept"):
		get_viewport().set_input_as_handled()
		advance_check()

func advance_check() -> void:
	if interaction_locked:
		return
	if not _mrs_ramirez_intro_recorded():
		EventBus.interaction_feedback.emit("Talk with Mrs. Ramirez first, then start A-B-C-Quick together.", "quiet")
		return
	var step := _current_step()
	if step.is_empty():
		return
	if String(step.get("kind", "tap")) == "hold_brake":
		_begin_brake_check(String(step["id"]))
		return
	if String(step.get("kind", "")) == "return_gate" and not InventoryManager.has_item("mrs_ramirez_rear_tube_repaired"):
		EventBus.interaction_feedback.emit("The rear tube still needs a clean garage repair first.", "quiet")
		return
	interaction_locked = true
	await get_tree().create_timer(0.08).timeout
	_record_step(step)
	await get_tree().create_timer(0.10).timeout
	interaction_locked = false

func _record_step(step: Dictionary) -> void:
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	var objective := String(step["id"])
	var voice := String(step.get("voice", ""))
	if not voice.is_empty():
		AudioService.speak(voice, "Mrs. Ramirez")
	QuestRegistry.record_objective(quest_id, objective)
	AudioService.play_sfx(String(step.get("cue", "reward_tiny")), "accomplishment")
	EventBus.interaction_feedback.emit(String(step["message"]), "warm")
	if objective == "air_front_checked":
		AudioService.speak("Now the back.", "Mrs. Ramirez")
	if objective == "air_rear_flat_found":
		AudioService.play_sfx("tire_press", "quiet")
	if objective == "tube_received":
		if not InventoryManager.has_item("mrs_ramirez_rear_tube_flat"):
			InventoryManager.add_item("mrs_ramirez_rear_tube_flat", 1, "quest")
		garage_hint_time = GARAGE_HINT_SECONDS
	if objective == "tube_returned":
		InventoryManager.remove_item("mrs_ramirez_rear_tube_repaired", 1)
	if objective == "final_report":
		InventoryManager.add_item("mrs_ramirez_bike_ready", 1, "quest")
	step_index = min(step_index + 1, steps.size())
	_update_visuals()

func _begin_brake_check(objective_id: String) -> void:
	if not _mrs_ramirez_intro_recorded():
		EventBus.interaction_feedback.emit("Talk with Mrs. Ramirez first, then try the brake together.", "quiet")
		return
	if active_brake_objective != objective_id:
		active_brake_objective = objective_id
		brake_check_verified = false
		hold_progress = 0.0
		if brake_rig and brake_rig.has_method("reset_verification"):
			brake_rig.reset_verification()
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	brake_check_started = true
	if brake_rig:
		brake_rig.visible = true
	if prompt:
		prompt.text = "[Hold E] " + String(_current_step().get("prompt", "Squeeze brake"))

func _on_brake_verified_changed(verified: bool) -> void:
	if not verified or brake_check_verified:
		return
	var step := _current_step()
	if step.is_empty() or String(step.get("kind", "")) != "hold_brake":
		return
	brake_check_verified = true
	_record_step(step)
	brake_check_started = false
	active_brake_objective = ""
	if brake_rig and brake_rig.has_method("set_brake_pressed"):
		brake_rig.set_brake_pressed(false)

func _current_step() -> Dictionary:
	_sync_step_from_quest_state()
	if step_index >= steps.size():
		return {}
	return steps[step_index]

func _sync_step_from_quest_state() -> void:
	var completed := _completed_objectives()
	var next := 0
	for i in range(steps.size()):
		if not completed.has(String(steps[i].get("id", ""))):
			next = i
			break
		next = i + 1
	step_index = min(next, steps.size())

func _completed_objectives() -> Array:
	var completed: Array = []
	if QuestRegistry.completed_quests.has(quest_id):
		for step in steps:
			completed.append(String(step.get("id", "")))
		return completed
	var state: Dictionary = QuestRegistry.active_quests.get(quest_id, {})
	return state.get("completedObjectives", [])

func _completed(objective_id: String) -> bool:
	return _completed_objectives().has(objective_id)

func _update_visuals() -> void:
	var done := step_index >= steps.size()
	var step := _current_step()
	if prompt:
		if not _mrs_ramirez_intro_recorded():
			prompt.text = "[E] Talk to Mrs. Ramirez"
		elif done:
			prompt.text = "[E] Pre-ride complete"
		else:
			var prefix := "[Hold E] " if String(step.get("kind", "")) == "hold_brake" else "[E] "
			prompt.text = prefix + String(step.get("prompt", "Inspect"))
		if player_in_range and not prompt.visible:
			_show_prompt()
		else:
			prompt.visible = player_in_range
	_set_overlay_visibility()

func _set_overlay_visibility() -> void:
	var step := _current_step()
	var objective := String(step.get("id", ""))
	var target_variant: Sprite2D = null
	if objective.find("brakes") != -1 and not brake_check_started:
		target_variant = brake_highlight
	elif objective.find("air_") == 0 or objective == "final_air_checked":
		target_variant = tire_highlight
	elif objective == "chain_checked" or objective == "final_chain_checked":
		target_variant = chain_highlight
	_set_state_variant(target_variant, objective)
	if brake_rig:
		brake_rig.visible = String(step.get("kind", "")) == "hold_brake" and brake_check_started and not brake_check_verified
	if front_tire_marker:
		front_tire_marker.visible = objective == "air_front_checked" or objective == "final_air_checked"
	if rear_tire_marker:
		rear_tire_marker.visible = _completed("air_rear_flat_found")
		rear_tire_marker.scale = Vector2(1.25, 0.42 + sin(pulse_time * 5.0) * 0.02)
	if seat_marker:
		seat_marker.visible = objective == "quick_seat_checked" or objective == "final_quick_checked"
	if handlebar_marker:
		handlebar_marker.visible = objective == "quick_handlebars_checked" or objective == "final_quick_checked"
	if chain_motion:
		chain_motion.visible = objective == "chain_checked" or objective == "final_chain_checked"

func _pulse_active_overlay() -> void:
	if active_state_variant and active_state_variant.visible:
		active_state_variant.modulate.a = 0.82 + sin(pulse_time * 3.0) * 0.04
	if part_focus_glow and part_focus_glow.visible:
		part_focus_glow.modulate.a = 0.28 + sin(pulse_time * 3.4) * 0.09
	if seat_marker and seat_marker.visible:
		seat_marker.position.y = -28 + sin(pulse_time * 10.0) * 1.3
	if handlebar_marker and handlebar_marker.visible:
		handlebar_marker.rotation = sin(pulse_time * 6.0) * 0.025
	if chain_motion and chain_motion.visible:
		chain_motion.rotation += 0.08

func _set_state_variant(target_variant: Sprite2D, objective: String) -> void:
	if target_variant == active_state_variant:
		_position_part_focus_glow(objective, target_variant != null)
		return
	for variant in [brake_highlight, tire_highlight, chain_highlight]:
		if variant == null:
			continue
		if variant == target_variant:
			variant.visible = true
			variant.modulate.a = 0.0
			var fade_in := create_tween()
			fade_in.tween_property(variant, "modulate:a", 0.86, 0.3)
		elif variant.visible:
			var fade_out := create_tween()
			fade_out.tween_property(variant, "modulate:a", 0.0, 0.3)
			fade_out.tween_callback(func() -> void:
				if variant != active_state_variant:
					variant.visible = false
			)
	active_state_variant = target_variant
	_position_part_focus_glow(objective, target_variant != null)

func _position_part_focus_glow(objective: String, visible: bool) -> void:
	if part_focus_glow == null:
		return
	part_focus_glow.visible = visible
	if not visible:
		return
	if objective.find("brakes") != -1:
		part_focus_glow.position = Vector2(208, 48)
		part_focus_glow.scale = Vector2(1.05, 0.72)
	elif objective.find("air_") == 0 or objective == "final_air_checked":
		part_focus_glow.position = Vector2(244, 184)
		part_focus_glow.scale = Vector2(1.22, 0.82)
	elif objective == "chain_checked" or objective == "final_chain_checked":
		part_focus_glow.position = Vector2(8, 134)
		part_focus_glow.scale = Vector2(0.94, 0.62)

func _update_hold_visuals() -> void:
	if hold_bar == null or hold_fill == null:
		return
	var step := _current_step()
	var visible := player_in_range and String(step.get("kind", "")) == "hold_brake" and brake_check_started
	hold_bar.visible = visible
	hold_fill.visible = visible
	if not visible:
		hold_progress = 0.0
		return
	if brake_rig and brake_rig.get("brake_pressed"):
		hold_progress = min(hold_progress + get_process_delta_time() / BRAKE_HOLD_SECONDS, 1.0)
	else:
		hold_progress = max(hold_progress - get_process_delta_time() * 1.8, 0.0)
	hold_fill.size.x = 74.0 * hold_progress

func _build_embodied_overlays() -> void:
	var visual := get_node_or_null("BikeVisual")
	if visual == null:
		return
	front_tire_marker = Polygon2D.new()
	front_tire_marker.name = "FrontTireSquish"
	front_tire_marker.position = Vector2(-36, 30)
	front_tire_marker.polygon = PackedVector2Array([Vector2(-15, -8), Vector2(15, -8), Vector2(18, 2), Vector2(12, 10), Vector2(-12, 10), Vector2(-18, 2)])
	front_tire_marker.color = Color(0.50, 0.78, 0.92, 0.45)
	front_tire_marker.visible = false
	visual.add_child(front_tire_marker)
	rear_tire_marker = Polygon2D.new()
	rear_tire_marker.name = "RearFlatTire"
	rear_tire_marker.position = Vector2(42, 34)
	rear_tire_marker.polygon = PackedVector2Array([Vector2(-20, -9), Vector2(20, -9), Vector2(24, 4), Vector2(14, 13), Vector2(-14, 13), Vector2(-24, 4)])
	rear_tire_marker.color = Color(0.35, 0.48, 0.58, 0.72)
	rear_tire_marker.visible = false
	visual.add_child(rear_tire_marker)
	seat_marker = Polygon2D.new()
	seat_marker.name = "SeatWiggle"
	seat_marker.position = Vector2(0, -28)
	seat_marker.polygon = PackedVector2Array([Vector2(-22, -6), Vector2(18, -6), Vector2(24, 0), Vector2(12, 7), Vector2(-22, 5), Vector2(-27, 0)])
	seat_marker.color = Color(0.98, 0.78, 0.42, 0.58)
	seat_marker.visible = false
	visual.add_child(seat_marker)
	handlebar_marker = Line2D.new()
	handlebar_marker.name = "HandlebarAlignment"
	handlebar_marker.position = Vector2(-38, -34)
	handlebar_marker.points = PackedVector2Array([Vector2(-24, 0), Vector2(24, 0)])
	handlebar_marker.width = 5.0
	handlebar_marker.default_color = Color(0.74, 0.95, 0.86, 0.68)
	handlebar_marker.visible = false
	visual.add_child(handlebar_marker)
	chain_motion = Polygon2D.new()
	chain_motion.name = "ChainMotion"
	chain_motion.position = Vector2(24, 10)
	chain_motion.polygon = PackedVector2Array([Vector2(-18, -5), Vector2(18, -5), Vector2(24, 0), Vector2(18, 5), Vector2(-18, 5), Vector2(-24, 0)])
	chain_motion.color = Color(0.93, 0.82, 0.52, 0.55)
	chain_motion.visible = false
	visual.add_child(chain_motion)
	hold_bar = ColorRect.new()
	hold_bar.name = "BrakeHoldBar"
	hold_bar.position = Vector2(-42, -74)
	hold_bar.size = Vector2(80, 9)
	hold_bar.color = Color(0.05, 0.08, 0.10, 0.72)
	hold_bar.visible = false
	add_child(hold_bar)
	hold_fill = ColorRect.new()
	hold_fill.name = "BrakeHoldFill"
	hold_fill.position = Vector2(3, 2)
	hold_fill.size = Vector2(0, 5)
	hold_fill.color = Color(0.92, 0.76, 0.38, 0.95)
	hold_fill.visible = false
	hold_bar.add_child(hold_fill)
	garage_hint = Line2D.new()
	garage_hint.name = "GaragePathHint"
	garage_hint.points = PackedVector2Array([Vector2(58, -8), Vector2(120, -22), Vector2(190, -12)])
	garage_hint.width = 6.0
	garage_hint.default_color = Color(1.0, 0.82, 0.42, 0.62)
	garage_hint.visible = false
	add_child(garage_hint)

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		_update_visuals()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		if prompt:
			_hide_prompt()
		if brake_rig and brake_rig.has_method("set_brake_pressed"):
			brake_rig.set_brake_pressed(false)

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

func _world_input_blocked() -> bool:
	var event_bus := get_node_or_null("/root/EventBus")
	return event_bus != null and event_bus.has_method("is_modal_active") and event_bus.is_modal_active()

func _mrs_ramirez_intro_recorded() -> bool:
	if QuestRegistry.completed_quests.has(quest_id):
		return true
	var state: Dictionary = QuestRegistry.active_quests.get(quest_id, {})
	var completed: Array = state.get("completedObjectives", [])
	return completed.has("talk_to_mrs_ramirez")
