extends Camera2D
class_name Camera2DPlus

@export var target_path: NodePath
@export var follow_enabled: bool = true
@export var smoothing_speed: float = 8.5
@export var look_ahead_distance: float = 38.0
@export var look_ahead_speed: float = 6.5
@export var dead_zone: Vector2 = Vector2(42, 26)
@export var min_zoom: Vector2 = Vector2(0.75, 0.75)
@export var max_zoom: Vector2 = Vector2(2.0, 2.0)

var target: Node2D
var _last_target_position: Vector2
var _look_ahead: Vector2 = Vector2.ZERO
var _shake_offset: Vector2 = Vector2.ZERO

func _ready() -> void:
	target = get_node_or_null(target_path) as Node2D
	if target != null:
		_last_target_position = target.global_position
	process_callback = Camera2D.CAMERA2D_PROCESS_PHYSICS
	position_smoothing_enabled = false

func _physics_process(delta: float) -> void:
	if follow_enabled:
		follow_player(delta)
	offset = _shake_offset

func follow_player(delta: float) -> void:
	if target == null:
		return

	var velocity := (target.global_position - _last_target_position) / maxf(delta, 0.001)
	_last_target_position = target.global_position
	var desired_look := velocity.normalized() * look_ahead_distance if velocity.length() > 4.0 else Vector2.ZERO
	_look_ahead = _look_ahead.lerp(desired_look, 1.0 - exp(-look_ahead_speed * delta))

	var desired_position := target.global_position + _look_ahead
	var delta_to_target := desired_position - global_position
	if absf(delta_to_target.x) < dead_zone.x:
		desired_position.x = global_position.x
	if absf(delta_to_target.y) < dead_zone.y:
		desired_position.y = global_position.y

	global_position = global_position.lerp(desired_position, 1.0 - exp(-smoothing_speed * delta)).round()

func set_shake_offset(value: Vector2) -> void:
	_shake_offset = value

func set_zoom_clamped(value: Vector2) -> void:
	zoom = Vector2(
		clampf(value.x, min_zoom.x, max_zoom.x),
		clampf(value.y, min_zoom.y, max_zoom.y)
	)
