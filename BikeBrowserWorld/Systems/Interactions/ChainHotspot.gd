extends Area2D

# ChainHotspot — embodied drivetrain repair.
#
# Replaces the original press-to-advance ladder. The player holds the pedal
# action, ChainRig drives the visible mechanism, and quest objectives are
# recorded at meaningful state transitions instead of on each key tap.
#
# Objective recording is preserved 1:1 against chain_repair.json so the
# vertical_slice_check.gd contract and existing save data continue to hold:
#   STATE_SLIPPED → STATE_PEDAL    → record "inspect_chain"  (first contact)
#   STATE_PEDAL   → STATE_TENSION  → record "rotate_pedals"
#   STATE_TENSION → STATE_GUIDED   → record "align_chain"
#   STATE_GUIDED  → STATE_SEATED   → record "seat_chain"
#   STATE_SEATED  → STATE_SPINNING → record "test_rotation"
# Verified completes the quest naturally via the existing record chain.

@export var quest_id := "chain_repair"

const SLIPPED_CHAIN_TEXTURE := preload("res://Assets/Props/Bike/garage_repair_stand_bmx_slipped_chain.png")
const ALIGNING_CHAIN_TEXTURE := preload("res://Assets/Props/Bike/garage_repair_stand_bmx_aligning_chain.png")
const SEATED_CHAIN_TEXTURE := preload("res://Assets/Props/Bike/garage_repair_stand_bmx_seated_chain.png")

# Mechanic-eye zoom — gentle, restored on disengagement. Preserves the calm
# garage mood; the player feels invited closer to the drivetrain, not pulled.
const ZOOM_IDLE := Vector2(1.0, 1.0)
const ZOOM_ENGAGED := Vector2(1.45, 1.45)
const ZOOM_TWEEN_TIME := 0.42

var player_in_range := false
var pulse_time := 0.0
var interaction_locked := false
var pedal_engaged := false
var chain_repair_verified := false
var recorded_objectives := {}
var last_state := ""
var zoom_tween: Tween = null

@onready var prompt: Label = get_node_or_null("Prompt")
@onready var chain_prop: Node2D = get_parent().get_node_or_null("InteractableLayer/LooseChainProp") if get_parent() else null
@onready var wheel_prop: Node2D = get_parent().get_node_or_null("InteractableLayer/BikeWheelRepairProp") if get_parent() else null
@onready var repair_bike: Sprite2D = get_parent().get_node_or_null("InteractableLayer/RepairBike") if get_parent() else null
@onready var repair_glint: Sprite2D = get_parent().get_node_or_null("InteractableLayer/RepairGlint") if get_parent() else null
@onready var bike_visual: Node2D = get_node_or_null("BikeVisual")
@onready var chain_rig: Node = get_node_or_null("BikeVisual/ChainRig")
@onready var player_camera: Camera2D = _find_player_camera()

func _ready() -> void:
	body_entered.connect(_on_body_entered)
	body_exited.connect(_on_body_exited)
	if chain_rig and chain_rig.has_signal("chain_verified_changed"):
		chain_rig.chain_verified_changed.connect(_on_chain_verified_changed)
	if bike_visual:
		bike_visual.visible = false
	if QuestRegistry.completed_quests.has(quest_id):
		chain_repair_verified = true
		last_state = "chain_verified"
	if prompt:
		_style_prompt(prompt)
		prompt.visible = false
	_update_repair_visual()

func _process(delta: float) -> void:
	pulse_time += delta
	if prompt and prompt.visible:
		prompt.modulate.a = 0.76 + sin(pulse_time * 1.8) * 0.025
		prompt.scale = Vector2.ONE * (1.0 + sin(pulse_time * 1.6) * 0.003)
	if repair_glint:
		var glint_strength := 0.32 if not chain_repair_verified else 0.55
		repair_glint.modulate.a = glint_strength + sin(pulse_time * 3.6) * 0.08
	if chain_rig:
		_track_rig_state()

func _unhandled_input(event: InputEvent) -> void:
	if not player_in_range:
		return
	if QuestRegistry.completed_quests.has(quest_id):
		if event.is_action_pressed("ui_accept"):
			_quiet_post_repair_feedback()
		return
	if event.is_action_pressed("ui_accept"):
		_engage_pedal()
		if chain_rig and chain_rig.has_method("set_pedal_pressed"):
			chain_rig.set_pedal_pressed(true)
	elif event.is_action_released("ui_accept"):
		if chain_rig and chain_rig.has_method("set_pedal_pressed"):
			chain_rig.set_pedal_pressed(false)

func _engage_pedal() -> void:
	if pedal_engaged:
		return
	pedal_engaged = true
	if not QuestRegistry.is_active(quest_id):
		QuestRegistry.start_quest(quest_id)
	if bike_visual:
		bike_visual.visible = true
	_zoom_camera(ZOOM_ENGAGED)
	_record_objective_once("inspect_chain", "chain_inspect", "gentle",
		"There it is. The chain is trying to climb sideways.")

func _track_rig_state() -> void:
	if chain_rig == null:
		return
	var current_state: String = str(chain_rig.get("mechanical_state"))
	if current_state == last_state:
		return
	last_state = current_state
	match current_state:
		"pedal_rotated":
			pass
		"chain_tension_visible":
			_record_objective_once("rotate_pedals", "pedal_rotate", "careful",
				"Click... click... clunk. The drivetrain complains first.")
		"chain_guided":
			_record_objective_once("align_chain", "chain_align", "warm",
				"A small shift, and the chain lines up with the teeth.")
		"chain_seated":
			_record_objective_once("seat_chain", "chain_seat", "warm",
				"The links settle in. That's the sound we wanted.")
		"wheel_turns_cleanly":
			_record_objective_once("test_rotation", "wheel_spin_success", "celebrate",
				"Smooth spin. Quiet chain, happy bike.")
		"chain_verified":
			# Verified is the natural close-out; QuestRegistry will fire the
			# reward intent from the last record_objective above.
			pass

func _record_objective_once(objective_id: String, audio_cue: String, tone: String, message: String) -> void:
	if recorded_objectives.has(objective_id):
		return
	recorded_objectives[objective_id] = true
	AudioService.play_sfx(audio_cue, tone)
	QuestRegistry.record_objective(quest_id, objective_id)
	DiscoveryService.mark_discovered("chain_hotspot_%s" % objective_id, { "questId": quest_id })
	EventBus.interaction_feedback.emit(message, tone)
	_update_repair_visual()

func _on_chain_verified_changed(verified: bool) -> void:
	if not verified or chain_repair_verified:
		return
	chain_repair_verified = true
	# Visual state stays — player keeps seeing the wheel turn cleanly. The
	# quiet "Drivetrain clean." label on the rig is the soft secondary cue
	# (the primary payoff is the visibly-spinning wheel). Pull camera back so
	# the world breathes again after the repair lands.
	_zoom_camera(ZOOM_IDLE)

func _quiet_post_repair_feedback() -> void:
	if interaction_locked:
		return
	interaction_locked = true
	AudioService.play_sfx("wheel_spin_success", "gentle")
	EventBus.interaction_feedback.emit("The chain turns clean now. Just a soft garage sound.", "quiet")
	await get_tree().create_timer(0.18).timeout
	interaction_locked = false

func _zoom_camera(target: Vector2) -> void:
	if player_camera == null:
		return
	if zoom_tween and zoom_tween.is_valid():
		zoom_tween.kill()
	zoom_tween = create_tween()
	zoom_tween.tween_property(player_camera, "zoom", target, ZOOM_TWEEN_TIME).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)

func _find_player_camera() -> Camera2D:
	var parent := get_parent()
	if parent == null:
		return null
	var player := parent.get_node_or_null("Player")
	if player == null:
		return null
	return player.get_node_or_null("Camera2D") as Camera2D

func _update_repair_visual() -> void:
	if repair_bike == null:
		return
	if not recorded_objectives.has("align_chain"):
		repair_bike.texture = SLIPPED_CHAIN_TEXTURE
		if repair_glint:
			repair_glint.position = repair_bike.position + Vector2(88, -22)
	elif not recorded_objectives.has("seat_chain"):
		repair_bike.texture = ALIGNING_CHAIN_TEXTURE
		if repair_glint:
			repair_glint.position = repair_bike.position + Vector2(72, -10)
	else:
		repair_bike.texture = SEATED_CHAIN_TEXTURE
		if repair_glint:
			repair_glint.position = repair_bike.position + Vector2(50, 18)

func _update_prompt() -> void:
	if prompt == null:
		return
	if chain_repair_verified or QuestRegistry.completed_quests.has(quest_id):
		prompt.text = "[E] Chain fixed"
	else:
		prompt.text = "[Hold E] Pedal"
	if player_in_range and not prompt.visible:
		_show_prompt()
	else:
		prompt.visible = player_in_range

func _on_body_entered(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = true
		_update_prompt()

func _on_body_exited(body: Node) -> void:
	if body.is_in_group("player"):
		player_in_range = false
		if prompt:
			_hide_prompt()
		# Walking away releases the pedal and restores the wider view.
		if chain_rig and chain_rig.has_method("set_pedal_pressed"):
			chain_rig.set_pedal_pressed(false)
		if not chain_repair_verified:
			_zoom_camera(ZOOM_IDLE)

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
