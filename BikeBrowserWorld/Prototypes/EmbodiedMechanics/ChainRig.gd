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
signal mechanical_state_changed(previous_state: String, next_state: String)

const STATE_SLIPPED := "chain_slipped"
const STATE_PEDAL := "pedal_rotated"
const STATE_TENSION := "chain_tension_visible"
const STATE_GUIDED := "chain_guided"
const STATE_SEATED := "chain_seated"
const STATE_SPINNING := "wheel_turns_cleanly"
const STATE_VERIFIED := "chain_verified"
const LIVE_CHAIN_STIFFNESS := 34.0 # px/s² visual spring force toward readable chain path.
const LIVE_CHAIN_DAMPING := 4.8 # px/s velocity damping for chain links.
const LIVE_CHAIN_TORQUE := 18.0 # rad/s² torque toward readable link tangent.
const LIVE_CHAIN_ANGULAR_DAMPING := 3.2 # rad/s angular damping for chain links.

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
var chain_scroll := 0.0
var chain_links: Array[RigidBody2D] = []

@onready var crank: Node2D = get_node_or_null(crank_path)
@onready var chainring: Node2D = get_node_or_null(chainring_path)
@onready var chain: CanvasItem = get_node_or_null(chain_path)
@onready var chain_links_container: Node = get_node_or_null("Chain/Links")
@onready var chain_joints_container: Node = get_node_or_null("Chain/Joints")
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
	_collect_chain_links()
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
	chain_scroll = fposmod(chain_scroll + pedal_rotation * 52.0 * delta, 12.0)
	if wheel_spin > 0.01:
		wheel_angle += delta * (1.4 + wheel_spin * 8.0)

	var previous_state := mechanical_state
	mechanical_state = _resolve_state()
	if previous_state != mechanical_state:
		_on_state_changed(previous_state, mechanical_state)

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
	var previous_state := mechanical_state
	chain_verified = true
	mechanical_state = STATE_VERIFIED
	if previous_state != mechanical_state:
		mechanical_state_changed.emit(previous_state, mechanical_state)
	chain_verified_changed.emit(true)
	_emit_feedback("clean_drivetrain_spin")

func _on_state_changed(previous_state: String, next_state: String) -> void:
	mechanical_state_changed.emit(previous_state, next_state)
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
		_apply_chain_link_state()
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

func get_alignment_snapshot() -> Dictionary:
	return {
		"crank_position": crank.global_position if crank else Vector2.ZERO,
		"chainring_position": chainring.global_position if chainring else Vector2.ZERO,
		"rear_sprocket_position": sprocket.global_position if sprocket else Vector2.ZERO,
		"rear_wheel_position": rear_wheel.global_position if rear_wheel else Vector2.ZERO,
		"rear_drivetrain_aligned": sprocket != null and rear_wheel != null and sprocket.global_position.distance_to(rear_wheel.global_position) <= 4.0,
		"bike_faces_right": true,
		"rear_sits_behind_crank": chainring != null and sprocket != null and sprocket.global_position.x < chainring.global_position.x,
		"chain_runs_to_rear": chainring != null and sprocket != null and sprocket.global_position.x < chainring.global_position.x,
		"wheel_responds_to_pedal": pedal_rotation > 0.05 and drivetrain_engagement > 0.05 and wheel_spin > 0.01,
	}

func _collect_chain_links() -> void:
	chain_links.clear()
	if not chain_links_container:
		return
	for child in chain_links_container.get_children():
		if child is RigidBody2D:
			child.freeze = false
			child.sleeping = false
			chain_links.append(child)
	chain_links.sort_custom(func(a: RigidBody2D, b: RigidBody2D) -> bool: return a.name < b.name)

func _apply_chain_link_state() -> void:
	if chain_links.is_empty():
		return
	var seating_weight: float = clamp(chain_alignment * 0.35 + chain_seated, 0.0, 1.0)
	var tension_weight: float = clamp(chain_tension, 0.0, 1.0)
	var link_count: int = chain_links.size()
	for index in range(link_count):
		var t: float = float(index) / max(float(link_count - 1), 1.0)
		var slipped_position: Vector2 = _slipped_chain_point(t)
		var seated_position: Vector2 = _seated_chain_point(t)
		var target_position: Vector2 = slipped_position.lerp(seated_position, seating_weight)
		target_position.y -= sin(t * PI) * tension_weight * (1.0 - seating_weight) * 8.0
		var link: RigidBody2D = chain_links[index]
		link.sleeping = false
		var correction: Vector2 = target_position - link.position
		var desired_velocity: Vector2 = correction * (6.0 + tension_weight * 5.0)
		var spring_force: Vector2 = correction * LIVE_CHAIN_STIFFNESS - link.linear_velocity * LIVE_CHAIN_DAMPING
		link.apply_central_force(spring_force)
		link.linear_velocity = link.linear_velocity.lerp(desired_velocity, 0.16)
		var target_angle := _chain_link_angle(t, seating_weight)
		target_angle += sin((t + chain_scroll / 12.0) * TAU) * pedal_rotation * 0.035
		var angle_delta := wrapf(target_angle - link.rotation, -PI, PI)
		link.apply_torque(angle_delta * LIVE_CHAIN_TORQUE - link.angular_velocity * LIVE_CHAIN_ANGULAR_DAMPING)
		link.angular_velocity = lerp(link.angular_velocity, angle_delta * 7.0, 0.12)
		link.modulate.a = clamp(0.72 + chain_tension * 0.28, 0.72, 1.0)
	_apply_chain_joint_positions()

func _apply_chain_joint_positions() -> void:
	if not chain_joints_container or chain_links.is_empty():
		return
	var anchor_joint := chain_joints_container.get_node_or_null("ChainringAnchorJoint") as Node2D
	if anchor_joint:
		anchor_joint.position = chain_links[0].position
	for index in range(chain_links.size() - 1):
		var joint_name: String = "Link%02dToLink%02d" % [index, index + 1]
		var joint := chain_joints_container.get_node_or_null(joint_name) as Node2D
		if joint:
			joint.position = chain_links[index].position.lerp(chain_links[index + 1].position, 0.5)

func _slipped_chain_point(t: float) -> Vector2:
	# Pixel coordinates in the rig's local space; the front anchor is the
	# chainring, while the free slipped tail hangs back toward the rear wheel.
	var start: Vector2 = Vector2(18.0, -7.0)
	var control: Vector2 = Vector2(-24.0, 42.0)
	var free_tail: Vector2 = Vector2(-104.0, 52.0)
	var left: Vector2 = start.lerp(control, t)
	var right: Vector2 = control.lerp(free_tail, t)
	return left.lerp(right, t)

func _seated_chain_point(t: float) -> Vector2:
	if t <= 0.50:
		return Vector2(18.0, -9.0).lerp(Vector2(-106.0, -17.0), t / 0.50)
	if t <= 0.72:
		var arc_t: float = (t - 0.50) / 0.22
		var angle: float = lerp(-PI * 0.5, PI * 0.5, arc_t)
		return Vector2(-106.0, -4.0) + Vector2(cos(angle), sin(angle)) * 13.0
	var return_t: float = (t - 0.72) / 0.28
	return Vector2(-106.0, 9.0).lerp(Vector2(14.0, 28.0), return_t)

func _chain_link_angle(t: float, seating_weight: float) -> float:
	var sample_a: Vector2 = _slipped_chain_point(max(t - 0.02, 0.0)).lerp(_seated_chain_point(max(t - 0.02, 0.0)), seating_weight)
	var sample_b: Vector2 = _slipped_chain_point(min(t + 0.02, 1.0)).lerp(_seated_chain_point(min(t + 0.02, 1.0)), seating_weight)
	return (sample_b - sample_a).angle()

func _emit_feedback(kind: String) -> void:
	chain_soft_feedback.emit(kind)

func _readable_curve(value: float, threshold: float) -> float:
	return clamp((value - threshold) / max(1.0 - threshold, 0.001), 0.0, 1.0)

func _approach(current: float, target: float, amount: float) -> float:
	if current < target:
		return min(current + amount, target)
	return max(current - amount, target)
