extends CharacterBody2D

# CANONICAL RUNTIME SYSTEM
# This is the authoritative player movement and interaction body for Zuzu.

@export var speed := 190.0
@export var acceleration := 22.0
@export var deceleration := 28.0
@export var turn_response := 18.0
@export var stop_snap_speed := 8.0
@export var camera_lookahead_distance := 34.0
@export var camera_lookahead_speed := 6.5

var facing := Vector2.DOWN
var walk_time := 0.0
var character_sprite: AnimatedSprite2D
var character_base_scale := Vector2.ONE
var _camera_lookahead := Vector2.ZERO

func _ready() -> void:
	add_to_group("player")
	safe_margin = 0.5
	character_sprite = get_node_or_null("Sprite") as AnimatedSprite2D
	if character_sprite != null:
		character_base_scale = character_sprite.scale
		character_sprite.play("idle_down")
	var camera := get_node_or_null("Camera2D")
	if camera is Camera2D:
		camera.process_callback = Camera2D.CAMERA2D_PROCESS_PHYSICS
		camera.position_smoothing_enabled = true
		camera.position_smoothing_speed = 8.0
		camera.drag_horizontal_enabled = false
		camera.drag_vertical_enabled = false
		camera.offset = Vector2.ZERO

func _physics_process(delta: float) -> void:
	var direction := _read_direction()
	if direction.length() > 0.01:
		facing = direction.normalized()
	var target_velocity := direction.normalized() * speed if direction.length() > 0.01 else Vector2.ZERO
	var blend := deceleration
	if direction.length() > 0.01:
		blend = turn_response if velocity.length() > 1.0 and velocity.normalized().dot(direction.normalized()) < 0.35 else acceleration
	velocity = velocity.lerp(target_velocity, clamp(blend * delta, 0.0, 1.0))
	if direction.length() <= 0.01 and velocity.length() < stop_snap_speed:
		velocity = Vector2.ZERO
	_apply_body_lean(direction, delta)
	_apply_character_animation(direction)
	_apply_camera_feel(delta)
	move_and_slide()

func _read_direction() -> Vector2:
	var keyboard := Vector2.ZERO
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		keyboard.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		keyboard.x += 1.0
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP):
		keyboard.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN):
		keyboard.y += 1.0
	var action_vector := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	return keyboard if keyboard.length() >= action_vector.length() else action_vector

func _apply_body_lean(direction: Vector2, delta: float) -> void:
	var body := get_node_or_null("Sprite")
	if body == null:
		body = get_node_or_null("Body")
	if body is Node2D:
		if direction.length() > 0.01:
			walk_time += delta * 8.0
		else:
			walk_time += delta * 1.55
		var speed_ratio: float = min(velocity.length() / speed, 1.0)
		var target_rotation: float = direction.x * 0.045 * speed_ratio
		body.rotation = lerp(body.rotation, target_rotation, clamp(14.0 * delta, 0.0, 1.0))
		var squash: float = 1.0 + speed_ratio * 0.022
		var breathe: float = sin(walk_time) * (0.012 if direction.length() <= 0.01 else 0.008)
		var base_scale: Vector2 = character_base_scale if body == character_sprite else Vector2.ONE
		var target_scale: Vector2 = Vector2(base_scale.x / squash, base_scale.y * (squash + breathe))
		body.scale = body.scale.lerp(target_scale, clamp(12.0 * delta, 0.0, 1.0))
	var head := get_node_or_null("Head")
	if head is Node2D:
		head.position.y = -30.0 + sin(walk_time) * 1.0

func _apply_character_animation(direction: Vector2) -> void:
	if character_sprite == null:
		return
	var action := "walk" if direction.length() > 0.01 else "idle"
	var animation_name := "%s_%s" % [action, _direction_name(facing)]
	if character_sprite.animation != animation_name:
		character_sprite.play(animation_name)
	character_sprite.speed_scale = clamp(0.92 + velocity.length() / speed * 0.16, 0.85, 1.08)

func _direction_name(vector: Vector2) -> String:
	if abs(vector.x) > abs(vector.y):
		return "right" if vector.x > 0.0 else "left"
	return "down" if vector.y >= 0.0 else "up"

func _apply_camera_feel(delta: float) -> void:
	var camera := get_node_or_null("Camera2D")
	if camera is Camera2D:
		var speed_ratio: float = min(velocity.length() / speed, 1.0)
		var desired_lookahead: Vector2 = velocity.normalized() * speed_ratio * camera_lookahead_distance if velocity.length() > 4.0 else Vector2.ZERO
		_camera_lookahead = _camera_lookahead.lerp(desired_lookahead, 1.0 - exp(-camera_lookahead_speed * delta))
		camera.position = _camera_lookahead.round()
