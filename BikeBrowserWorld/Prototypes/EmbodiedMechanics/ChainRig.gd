extends Node2D

# ChainRig — embodied chain-repair mechanism, cloned from BrakeRig.
#
# Educational loop:
#   player holds pedal action
#   → crank rotates
#   → chain tension builds (chain is currently slipped off the chainring)
#   → with sustained pedaling the chain aligns and seats onto the sprocket
#   → drivetrain transmits force to the rear wheel
#   → wheel spins cleanly
#   → verified after a brief sustained-clean-spin window
#
# All visual node references are optional. The state machine is self-contained
# so chain_rig_state_check.gd can exercise it headless, and a .tscn that wires
# up sprites is a Sprint-6 follow-up.

signal chain_soft_feedback(kind: String)
signal chain_verified_changed(verified: bool)

const STATE_SLIPPED := "chain_slipped"
const STATE_PEDAL := "pedal_rotated"
const STATE_TENSION := "chain_tension_visible"
const STATE_GUIDED := "chain_guided"
const STATE_SEATED := "chain_seated"
const STATE_SPINNING := "wheel_turns_cleanly"
const STATE_VERIFIED := "chain_verified"

@export var crank_path: NodePath
@export var chainring_path: NodePath
@export var chain_path: NodePath
@export var chain_slack_path: NodePath
@export var chain_tension_mark_path: NodePath
@export var sprocket_path: NodePath
@export var seated_glow_path: NodePath
@export var rear_wheel_path: NodePath
@export var spin_ghost_path: NodePath
@export var verification_label_path: NodePath
@export var pedal_label_path: NodePath
@export var chain_label_path: NodePath
@export var sprocket_label_path: NodePath
@export var wheel_label_path: NodePath

var pedal_rotation := 0.0
var chain_tension := 0.0
var chain_alignment := 0.0
var chain_seated := 0.0
var drivetrain_engagement := 0.0
var wheel_spin := 0.0
var chain_verified := false
var mechanical_state := STATE_SLIPPED

var pedal_pressed := false
var hold_time := 0.0
var verified_time := 0.0
var crank_angle := 0.0
var wheel_angle := 0.0

@onready var crank: Node2D = get_node_or_null(crank_path)
@onready var chainring: Node2D = get_node_or_null(chainring_path)
@onready var chain: CanvasItem = get_node_or_null(chain_path)
@onready var chain_slack: CanvasItem = get_node_or_null(chain_slack_path)
@onready var chain_tension_mark: CanvasItem = get_node_or_null(chain_tension_mark_path)
@onready var sprocket: Node2D = get_node_or_null(sprocket_path)
@onready var seated_glow: CanvasItem = get_node_or_null(seated_glow_path)
@onready var rear_wheel: Node2D = get_node_or_null(rear_wheel_path)
@onready var spin_ghost: CanvasItem = get_node_or_null(spin_ghost_path)
@onready var verification_label: Label = get_node_or_null(verification_label_path)
@onready var pedal_label: Label = get_node_or_null(pedal_label_path)
@onready var chain_label: Label = get_node_or_null(chain_label_path)
@onready var sprocket_label: Label = get_node_or_null(sprocket_label_path)
@onready var wheel_label: Label = get_node_or_null(wheel_label_path)

func _ready() -> void:
	_apply_visual_state()

func _process(delta: float) -> void:
	step_mechanic(delta)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_accept"):
		set_pedal_pressed(true)
	if event.is_action_released("ui_accept"):
		set_pedal_pressed(false)

func set_pedal_pressed(pressed: bool) -> void:
	pedal_pressed = pressed
	if pressed and mechanical_state == STATE_SLIPPED:
		_emit_feedback("soft_pedal_engage")

func step_mechanic(delta: float) -> void:
	if pedal_pressed:
		hold_time += delta
		pedal_rotation = _approach(pedal_rotation, 1.0, delta * 2.10)
		chain_tension = _approach(chain_tension, _readable_curve(pedal_rotation, 0.18), delta * 2.45)
		chain_alignment = _approach(chain_alignment, _readable_curve(chain_tension, 0.40), delta * 2.30)
		chain_seated = _approach(chain_seated, _readable_curve(chain_alignment, 0.66), delta * 2.60)
		drivetrain_engagement = _approach(drivetrain_engagement, _readable_curve(chain_seated, 0.74), delta * 2.40)
	else:
		hold_time = max(hold_time - delta * 1.8, 0.0)
		pedal_rotation = _approach(pedal_rotation, 0.0, delta * 2.4)
		chain_tension = _approach(chain_tension, 0.0, delta * 2.7)
		chain_alignment = _approach(chain_alignment, 0.0, delta * 2.6)
		# Once the chain is seated, it stays seated — releasing the pedal does not
		# unseat a working chain. This matches the physical mechanism and
		# prevents the player having to hold E forever after they've succeeded.
		if chain_seated < 0.82:
			chain_seated = _approach(chain_seated, 0.0, delta * 1.6)
		drivetrain_engagement = _approach(drivetrain_engagement, chain_seated * 0.62, delta * 2.0)
		verified_time = 0.0 if not chain_verified else verified_time

	# Wheel spin tracks drivetrain engagement. When seated and engaged the
	# wheel accelerates; otherwise it decays.
	if drivetrain_engagement > 0.05:
		wheel_spin = _approach(wheel_spin, drivetrain_engagement, delta * 1.6)
	else:
		wheel_spin = max(wheel_spin - delta * 0.45, 0.0)

	# Crank angle follows pedal_rotation linearly; wheel angle follows wheel_spin
	crank_angle += delta * (pedal_rotation * 6.2)
	if wheel_spin > 0.01:
		wheel_angle += delta * (1.4 + wheel_spin * 8.0)

	var previous_state := mechanical_state
	mechanical_state = _resolve_state()
	if previous_state != mechanical_state:
		_on_state_changed(mechanical_state)

	if mechanical_state == STATE_SPINNING:
		verified_time += delta
		if verified_time >= 0.4:
			_set_verified()
	elif mechanical_state != STATE_VERIFIED:
		verified_time = 0.0

	_apply_visual_state()

func _resolve_state() -> String:
	if chain_verified:
		return STATE_VERIFIED
	if wheel_spin >= 0.55 and chain_seated >= 0.80:
		return STATE_SPINNING
	if chain_seated >= 0.72:
		return STATE_SEATED
	if chain_alignment >= 0.45:
		return STATE_GUIDED
	if chain_tension >= 0.32:
		return STATE_TENSION
	if pedal_pressed or pedal_rotation > 0.10:
		return STATE_PEDAL
	return STATE_SLIPPED

func _set_verified() -> void:
	if chain_verified:
		return
	chain_verified = true
	mechanical_state = STATE_VERIFIED
	chain_verified_changed.emit(true)
	_emit_feedback("clean_drivetrain_spin")

func _on_state_changed(next_state: String) -> void:
	if next_state == STATE_TENSION:
		_emit_feedback("subtle_chain_tension")
	elif next_state == STATE_SEATED:
		_emit_feedback("soft_chain_bite")

func _apply_visual_state() -> void:
	if crank:
		crank.rotation = crank_angle
	if chainring:
		chainring.rotation = crank_angle
	if chain:
		chain.modulate = Color(0.62 + chain_tension * 0.32, 0.66 + chain_tension * 0.22, 0.74 + chain_tension * 0.14, 0.46 + chain_tension * 0.50)
	if chain_slack:
		chain_slack.visible = chain_tension < 0.88
		chain_slack.modulate.a = clamp(0.62 - chain_tension * 0.66, 0.0, 0.62)
	if chain_tension_mark:
		chain_tension_mark.visible = chain_tension > 0.28
		chain_tension_mark.modulate.a = clamp((chain_tension - 0.24) * 1.2, 0.0, 0.72)
		if chain_tension_mark is Node2D:
			chain_tension_mark.scale = Vector2(1.0 + chain_tension * 0.12, 1.0)
	if sprocket:
		# Sprocket only rotates when chain is seated and drivetrain engaged.
		sprocket.rotation = wheel_angle
	if seated_glow:
		seated_glow.visible = chain_seated > 0.50
		seated_glow.modulate.a = clamp((chain_seated - 0.48) * 1.30, 0.0, 0.74)
		if seated_glow is Node2D:
			seated_glow.scale = Vector2.ONE * (0.88 + chain_seated * 0.16)
	if rear_wheel:
		rear_wheel.rotation = wheel_angle
		rear_wheel.modulate = Color(1.0, 1.0 - (1.0 - wheel_spin) * 0.06, 1.0 - (1.0 - wheel_spin) * 0.08, 1.0)
	if spin_ghost:
		spin_ghost.visible = wheel_spin > 0.10
		spin_ghost.modulate.a = clamp(wheel_spin * 0.42, 0.04, 0.42)
		if spin_ghost is Node2D:
			spin_ghost.rotation = wheel_angle * 0.35
	if verification_label:
		verification_label.visible = chain_verified
	if pedal_label:
		pedal_label.visible = mechanical_state in [STATE_SLIPPED, STATE_PEDAL]
	if chain_label:
		chain_label.visible = mechanical_state in [STATE_TENSION, STATE_GUIDED, STATE_SEATED]
	if sprocket_label:
		sprocket_label.visible = mechanical_state in [STATE_SEATED, STATE_SPINNING]
	if wheel_label:
		wheel_label.visible = mechanical_state in [STATE_SPINNING, STATE_VERIFIED]

func _emit_feedback(kind: String) -> void:
	chain_soft_feedback.emit(kind)

func _readable_curve(value: float, threshold: float) -> float:
	return clamp((value - threshold) / max(1.0 - threshold, 0.001), 0.0, 1.0)

func _approach(current: float, target: float, amount: float) -> float:
	if current < target:
		return min(current + amount, target)
	return max(current - amount, target)
