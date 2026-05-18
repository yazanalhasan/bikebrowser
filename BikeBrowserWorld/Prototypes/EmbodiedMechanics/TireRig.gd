extends "res://Systems/Mechanical/MechanicalSystemCore.gd"

signal tire_soft_feedback(kind: String)
signal tire_verified_changed(verified: bool)

const STATE_DEFLATED := "tire_deflated_leaking"
const STATE_LEAK_FOUND := "leak_found"
const STATE_TUBE_EXPOSED := "tube_exposed"
const STATE_PATCHED := "patch_sealed"
const STATE_INFLATING := "inflating_with_deformation"
const STATE_PRESSURE_SAFE := "pressure_safe"
const STATE_READY := "wheel_ready"
const STATE_VERIFIED := "tire_verified"

@export var wheel_path: NodePath
@export var tire_shape_path: NodePath
@export var sidewall_path: NodePath
@export var leak_marker_path: NodePath
@export var patch_path: NodePath
@export var pressure_bar_path: NodePath
@export var pressure_fill_path: NodePath
@export var readiness_label_path: NodePath

var pressure := 0.08
var deformation := 0.92
var leak_signal := 0.0
var leak_size := 0.72
var tube_exposure := 0.0
var patch_seal := 0.0
var verification_spin := 0.0
var wheel_readiness := 0.0
var tire_verified := false

var inspect_pressed := false
var patch_pressed := false
var pump_pressed := false
var spin_pressed := false
var hold_time := 0.0
var wheel_angle := 0.0
var active_action := ""

@onready var wheel: Node2D = get_node_or_null(wheel_path)
@onready var tire_shape: Node2D = get_node_or_null(tire_shape_path)
@onready var sidewall: CanvasItem = get_node_or_null(sidewall_path)
@onready var leak_marker: CanvasItem = get_node_or_null(leak_marker_path)
@onready var patch: CanvasItem = get_node_or_null(patch_path)
@onready var pressure_bar: CanvasItem = get_node_or_null(pressure_bar_path)
@onready var pressure_fill: ColorRect = get_node_or_null(pressure_fill_path)
@onready var readiness_label: Label = get_node_or_null(readiness_label_path)

func _ready() -> void:
	mechanical_state = STATE_DEFLATED
	validation_tags = {
		"domain": "bicycle",
		"mechanic": "tire_pressure_patch_readiness",
		"supports_inspection_camera": true,
		"supports_tactile_interaction": true,
	}
	register_part("wheel", wheel, {"role": "rotating_support"})
	register_part("tire_sidewall", sidewall, {"role": "deformation_readout"})
	register_part("puncture", leak_marker, {"role": "leak_source"})
	register_part("patch", patch, {"role": "seal"})
	_apply_visual_state()

func _process(delta: float) -> void:
	step_mechanic(delta)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept"):
		set_current_action_pressed(true)
	if event.is_action_released("ui_accept"):
		set_current_action_pressed(false)

func set_current_action_pressed(pressed: bool) -> void:
	var action := get_required_action()
	inspect_pressed = pressed and action == "inspect"
	patch_pressed = pressed and action in ["tube", "patch"]
	pump_pressed = pressed and action == "pump"
	spin_pressed = pressed and action == "verify"
	if pressed and active_action != action:
		active_action = action
		_emit_feedback(action + "_touch")
	elif not pressed:
		active_action = ""

func clear_actions() -> void:
	inspect_pressed = false
	patch_pressed = false
	pump_pressed = false
	spin_pressed = false
	active_action = ""

func get_required_action() -> String:
	if tire_verified:
		return "done"
	if leak_signal < 1.0:
		return "inspect"
	if tube_exposure < 1.0:
		return "tube"
	if patch_seal < 0.92:
		return "patch"
	if pressure < 0.78:
		return "pump"
	return "verify"

func get_required_action_label() -> String:
	var action := get_required_action()
	if action == "inspect":
		return "feel for the leak"
	if action == "tube":
		return "ease the tube out"
	if action == "patch":
		return "press the patch"
	if action == "pump":
		return "pump until the tire firms"
	if action == "verify":
		return "spin and check"
	return "wheel ready"

func step_mechanic(delta: float) -> void:
	var engaged := inspect_pressed or patch_pressed or pump_pressed or spin_pressed
	hold_time = hold_time + delta if engaged else max(hold_time - delta * 1.4, 0.0)

	if inspect_pressed:
		wheel_angle += delta * 2.8
		leak_signal = _approach(leak_signal, 1.0, delta * 0.86)
		pressure = max(pressure - delta * leak_size * 0.035, 0.02)
	elif leak_signal >= 1.0 and tube_exposure < 1.0 and patch_pressed:
		tube_exposure = _approach(tube_exposure, 1.0, delta * 0.78)
		pressure = max(pressure - delta * leak_size * 0.015, 0.02)
	elif tube_exposure >= 1.0 and patch_pressed:
		patch_seal = _approach(patch_seal, 1.0, delta * 0.72)
		leak_size = _approach(leak_size, 0.0, delta * 0.62)
	elif patch_seal >= 0.92 and pump_pressed:
		pressure = _approach(pressure, 0.84, delta * 0.54)
	elif pressure >= 0.78 and spin_pressed:
		wheel_angle += delta * (3.0 + pressure * 5.5)
		verification_spin = _approach(verification_spin, 1.0, delta * 0.82)
		wheel_readiness = _approach(wheel_readiness, _readable_curve(verification_spin, 0.56), delta * 1.0)
	else:
		verification_spin = _approach(verification_spin, 0.0, delta * 0.35)
		if patch_seal < 0.92:
			pressure = max(pressure - delta * leak_size * 0.020, 0.02)

	deformation = clamp(1.0 - pressure + (leak_size * 0.22), 0.0, 1.0)
	set_force_channel("air_pressure", pressure)
	set_force_channel("sidewall_deformation", deformation)
	set_force_channel("leak", leak_size)
	set_force_channel("tube_exposure", tube_exposure)
	set_force_channel("patch_seal", patch_seal)
	set_force_channel("readiness", wheel_readiness)

	var next_state := _resolve_state()
	if next_state != mechanical_state:
		transition_to(next_state, get_validation_snapshot())
		_on_state_changed(next_state)

	if mechanical_state == STATE_READY and not tire_verified:
		_set_verified()

	_apply_visual_state()

func _resolve_state() -> String:
	if tire_verified:
		return STATE_VERIFIED
	if wheel_readiness >= 0.86:
		return STATE_READY
	if pressure >= 0.78 and patch_seal >= 0.92:
		return STATE_PRESSURE_SAFE
	if pressure >= 0.28 and patch_seal >= 0.92:
		return STATE_INFLATING
	if patch_seal >= 0.92:
		return STATE_PATCHED
	if tube_exposure >= 1.0:
		return STATE_TUBE_EXPOSED
	if leak_signal >= 1.0:
		return STATE_LEAK_FOUND
	return STATE_DEFLATED

func _set_verified() -> void:
	tire_verified = true
	transition_to(STATE_VERIFIED, get_validation_snapshot())
	tire_verified_changed.emit(true)
	_emit_feedback("quiet_ready_spin")

func _on_state_changed(next_state: String) -> void:
	if next_state == STATE_LEAK_FOUND:
		_emit_feedback("air_hiss_found")
	elif next_state == STATE_PATCHED:
		_emit_feedback("patch_grabs")
	elif next_state == STATE_PRESSURE_SAFE:
		_emit_feedback("sidewall_firms")

func _apply_visual_state() -> void:
	if wheel:
		wheel.rotation = wheel_angle
	if tire_shape:
		var squash := deformation * 0.28
		tire_shape.scale = Vector2(1.0 + squash * 0.18, 1.0 - squash)
		tire_shape.position.y = deformation * 10.0
	if sidewall:
		sidewall.modulate = Color(0.18 + pressure * 0.18, 0.22 + pressure * 0.24, 0.26 + pressure * 0.28, 0.70)
	if leak_marker:
		leak_marker.visible = leak_signal > 0.16 and leak_size > 0.08
		leak_marker.modulate.a = clamp(leak_signal * leak_size, 0.0, 0.78)
	if patch:
		patch.visible = patch_seal > 0.08
		patch.modulate.a = clamp(0.30 + patch_seal * 0.70, 0.0, 1.0)
		if patch is Node2D:
			patch.scale = Vector2.ONE * (0.82 + patch_seal * 0.18)
	if pressure_bar:
		pressure_bar.visible = patch_seal >= 0.92 or pressure > 0.20
	if pressure_fill:
		pressure_fill.size.x = 138.0 * clamp(pressure, 0.0, 1.0)
		pressure_fill.color = Color(0.91, 0.60, 0.22, 1.0) if pressure < 0.72 else Color(0.34, 0.75, 0.48, 1.0)
	if readiness_label:
		readiness_label.visible = tire_verified

func _emit_feedback(kind: String) -> void:
	tire_soft_feedback.emit(kind)

func _readable_curve(value: float, threshold: float) -> float:
	return clamp((value - threshold) / max(1.0 - threshold, 0.001), 0.0, 1.0)

func _approach(current: float, target: float, amount: float) -> float:
	if current < target:
		return min(current + amount, target)
	return max(current - amount, target)
