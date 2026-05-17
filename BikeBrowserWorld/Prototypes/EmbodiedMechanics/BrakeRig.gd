extends Node2D

signal brake_soft_feedback(kind: String)
signal brake_verified_changed(verified: bool)

const STATE_IDLE := "idle_wheel_spinning"
const STATE_LEVER := "brake_lever_pressed"
const STATE_CABLE := "cable_tension_visible"
const STATE_CALIPER := "caliper_closed"
const STATE_STOPPED := "wheel_stopped"
const STATE_VERIFIED := "brake_verified"

@export var wheel_path: NodePath
@export var lever_path: NodePath
@export var cable_path: NodePath
@export var cable_slack_path: NodePath
@export var cable_pull_arrow_path: NodePath
@export var caliper_left_path: NodePath
@export var caliper_right_path: NodePath
@export var pad_left_path: NodePath
@export var pad_right_path: NodePath
@export var contact_path: NodePath
@export var contact_pinch_path: NodePath
@export var compression_glow_path: NodePath
@export var friction_band_path: NodePath
@export var force_path_path: NodePath
@export var lever_resistance_arc_path: NodePath
@export var cable_load_mark_path: NodePath
@export var spin_ghost_path: NodePath
@export var verification_label_path: NodePath
@export var brake_lever_label_path: NodePath
@export var cable_label_path: NodePath
@export var caliper_label_path: NodePath
@export var wheel_label_path: NodePath

var lever_pull := 0.0
var cable_tension := 0.0
var caliper_closure := 0.0
var pad_contact := 0.0
var friction_load := 0.0
var wheel_spin := 1.0
var brake_verified := false
var mechanical_state := STATE_IDLE

var brake_pressed := false
var hold_time := 0.0
var stopped_time := 0.0
var wheel_angle := 0.0

@onready var wheel: Node2D = get_node_or_null(wheel_path)
@onready var lever: Node2D = get_node_or_null(lever_path)
@onready var cable: CanvasItem = get_node_or_null(cable_path)
@onready var cable_slack: CanvasItem = get_node_or_null(cable_slack_path)
@onready var cable_pull_arrow: CanvasItem = get_node_or_null(cable_pull_arrow_path)
@onready var caliper_left: Node2D = get_node_or_null(caliper_left_path)
@onready var caliper_right: Node2D = get_node_or_null(caliper_right_path)
@onready var pad_left: Control = get_node_or_null(pad_left_path)
@onready var pad_right: Control = get_node_or_null(pad_right_path)
@onready var contact: CanvasItem = get_node_or_null(contact_path)
@onready var contact_pinch: CanvasItem = get_node_or_null(contact_pinch_path)
@onready var compression_glow: CanvasItem = get_node_or_null(compression_glow_path)
@onready var friction_band: CanvasItem = get_node_or_null(friction_band_path)
@onready var force_path: CanvasItem = get_node_or_null(force_path_path)
@onready var lever_resistance_arc: CanvasItem = get_node_or_null(lever_resistance_arc_path)
@onready var cable_load_mark: CanvasItem = get_node_or_null(cable_load_mark_path)
@onready var spin_ghost: CanvasItem = get_node_or_null(spin_ghost_path)
@onready var verification_label: Label = get_node_or_null(verification_label_path)
@onready var brake_lever_label: Label = get_node_or_null(brake_lever_label_path)
@onready var cable_label: Label = get_node_or_null(cable_label_path)
@onready var caliper_label: Label = get_node_or_null(caliper_label_path)
@onready var wheel_label: Label = get_node_or_null(wheel_label_path)

func _ready() -> void:
	_apply_visual_state()

func _process(delta: float) -> void:
	step_mechanic(delta)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept"):
		set_brake_pressed(true)
	if event.is_action_released("ui_accept"):
		set_brake_pressed(false)

func set_brake_pressed(pressed: bool) -> void:
	brake_pressed = pressed
	if pressed and mechanical_state == STATE_IDLE:
		_emit_feedback("soft_lever_click")

func step_mechanic(delta: float) -> void:
	if brake_pressed:
		hold_time += delta
		lever_pull = _approach(lever_pull, 1.0, delta * 2.35)
		cable_tension = _approach(cable_tension, _readable_curve(lever_pull, 0.24), delta * 2.55)
		caliper_closure = _approach(caliper_closure, _readable_curve(cable_tension, 0.46), delta * 2.35)
		pad_contact = _approach(pad_contact, _readable_curve(caliper_closure, 0.72), delta * 3.20)
		friction_load = _approach(friction_load, _readable_curve(pad_contact, 0.18), delta * 2.20)
	else:
		hold_time = max(hold_time - delta * 1.6, 0.0)
		lever_pull = _approach(lever_pull, 0.0, delta * 2.6)
		cable_tension = _approach(cable_tension, 0.0, delta * 2.9)
		caliper_closure = _approach(caliper_closure, 0.0, delta * 2.8)
		pad_contact = _approach(pad_contact, 0.0, delta * 3.4)
		friction_load = _approach(friction_load, 0.0, delta * 2.6)
		stopped_time = 0.0

	if friction_load > 0.0:
		var resistance := friction_load * friction_load
		wheel_spin = max(wheel_spin - delta * (0.16 + resistance * 0.74), 0.0)
	else:
		wheel_spin = max(wheel_spin - delta * 0.04, 0.35)

	if wheel_spin > 0.01:
		wheel_angle += delta * (7.0 + wheel_spin * 15.0) * wheel_spin

	var previous_state := mechanical_state
	mechanical_state = _resolve_state()
	if previous_state != mechanical_state:
		_on_state_changed(mechanical_state)

	if mechanical_state == STATE_STOPPED:
		stopped_time += delta
		if stopped_time >= 0.4:
			_set_verified()
	elif mechanical_state != STATE_VERIFIED:
		stopped_time = 0.0

	_apply_visual_state()

func _resolve_state() -> String:
	if brake_verified:
		return STATE_VERIFIED
	if wheel_spin <= 0.05 and pad_contact >= 0.85:
		return STATE_STOPPED
	if hold_time >= 0.64 and caliper_closure >= 0.75:
		return STATE_CALIPER
	if hold_time >= 0.34 and cable_tension >= 0.35:
		return STATE_CABLE
	if brake_pressed or lever_pull > 0.1:
		return STATE_LEVER
	return STATE_IDLE

func _set_verified() -> void:
	if brake_verified:
		return
	brake_verified = true
	mechanical_state = STATE_VERIFIED
	brake_verified_changed.emit(true)
	_emit_feedback("gentle_wheel_stop")

func _on_state_changed(next_state: String) -> void:
	if next_state == STATE_CABLE:
		_emit_feedback("subtle_cable_tension")
	elif next_state == STATE_STOPPED:
		_emit_feedback("soft_wheel_stop")

func _apply_visual_state() -> void:
	if wheel:
		wheel.rotation = wheel_angle
		wheel.modulate = Color(1.0, 1.0 - wheel_spin * 0.08, 1.0 - wheel_spin * 0.10, 1.0)
	if lever:
		lever.rotation = deg_to_rad(-38.0 * lever_pull + sin(hold_time * 38.0) * friction_load * 0.80)
	if cable:
		cable.modulate = Color(0.56 + cable_tension * 0.40, 0.66 + cable_tension * 0.24, 0.75 + cable_tension * 0.16, 0.42 + cable_tension * 0.58)
	if cable_slack:
		cable_slack.visible = cable_tension < 0.92
		cable_slack.modulate.a = clamp(0.60 - cable_tension * 0.62, 0.0, 0.60)
	if cable_pull_arrow:
		cable_pull_arrow.visible = brake_pressed or cable_tension > 0.08
		cable_pull_arrow.modulate.a = clamp(cable_tension * 0.72, 0.0, 0.72)
		if cable_pull_arrow is Node2D:
			cable_pull_arrow.position.x = -92.0 + cable_tension * 18.0
	if cable_load_mark:
		cable_load_mark.visible = cable_tension > 0.32
		cable_load_mark.modulate.a = clamp((cable_tension - 0.28) * 1.2, 0.0, 0.75)
		if cable_load_mark is Node2D:
			cable_load_mark.scale = Vector2(1.0 + cable_tension * 0.12, 1.0)
	if caliper_left:
		caliper_left.rotation = deg_to_rad(20.0 * caliper_closure)
	if caliper_right:
		caliper_right.rotation = deg_to_rad(-20.0 * caliper_closure)
	if pad_left:
		pad_left.position.x = 0.0 + caliper_closure * 15.0 + pad_contact * 1.5
	if pad_right:
		pad_right.position.x = 0.0 - caliper_closure * 15.0 - pad_contact * 1.5
	if contact:
		contact.visible = pad_contact > 0.78
		contact.modulate.a = 0.20 + pad_contact * 0.52
	if contact_pinch:
		contact_pinch.visible = pad_contact > 0.55
		contact_pinch.modulate.a = clamp((pad_contact - 0.50) * 1.45, 0.0, 0.76)
		if contact_pinch is Node2D:
			contact_pinch.scale = Vector2(0.84 + pad_contact * 0.20, 1.0 - friction_load * 0.10)
	if compression_glow:
		compression_glow.visible = pad_contact > 0.45
		compression_glow.modulate.a = clamp((pad_contact - 0.42) * 1.3, 0.0, 0.70)
		if compression_glow is Node2D:
			compression_glow.scale = Vector2.ONE * (0.86 + pad_contact * 0.18)
	if friction_band:
		friction_band.visible = friction_load > 0.05
		friction_band.modulate.a = clamp(friction_load * (0.16 + wheel_spin * 0.30), 0.0, 0.46)
		if friction_band is Node2D:
			friction_band.rotation = -wheel_angle * 0.18 + sin(hold_time * 28.0) * friction_load * 0.012
	if force_path:
		force_path.visible = brake_pressed or cable_tension > 0.12
		force_path.modulate.a = clamp((lever_pull + cable_tension + caliper_closure + pad_contact) * 0.16, 0.0, 0.64)
	if lever_resistance_arc:
		lever_resistance_arc.visible = lever_pull > 0.18
		lever_resistance_arc.modulate.a = clamp((lever_pull * 0.24) + (friction_load * 0.28), 0.0, 0.52)
	if spin_ghost:
		spin_ghost.visible = wheel_spin > 0.08
		spin_ghost.modulate.a = clamp(wheel_spin * (0.42 - friction_load * 0.26), 0.04, 0.42)
		if spin_ghost is Node2D:
			spin_ghost.rotation = -wheel_angle * 0.35 + sin(hold_time * 20.0) * friction_load * 0.018
	if verification_label:
		verification_label.visible = brake_verified
	if brake_lever_label:
		brake_lever_label.visible = mechanical_state in [STATE_IDLE, STATE_LEVER]
	if cable_label:
		cable_label.visible = mechanical_state in [STATE_CABLE, STATE_CALIPER, STATE_STOPPED]
	if caliper_label:
		caliper_label.visible = mechanical_state in [STATE_CALIPER, STATE_STOPPED]
	if wheel_label:
		wheel_label.visible = mechanical_state in [STATE_IDLE, STATE_STOPPED, STATE_VERIFIED]

func _emit_feedback(kind: String) -> void:
	brake_soft_feedback.emit(kind)

func _readable_curve(value: float, threshold: float) -> float:
	return clamp((value - threshold) / max(1.0 - threshold, 0.001), 0.0, 1.0)

func _approach(current: float, target: float, amount: float) -> float:
	if current < target:
		return min(current + amount, target)
	return max(current - amount, target)
