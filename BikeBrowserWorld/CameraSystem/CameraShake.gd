extends Node
class_name CameraShake

enum ShakeMode {
	RANDOM,
	DIRECTIONAL
}

@export var mode: ShakeMode = ShakeMode.RANDOM
@export var horizontal: bool = true
@export var vertical: bool = true
@export var decay: float = 8.0

var intensity: float = 0.0
var duration: float = 0.0
var elapsed: float = 0.0
var direction: Vector2 = Vector2.RIGHT
var offset: Vector2 = Vector2.ZERO

func start(new_intensity: float, new_duration: float, new_direction: Vector2 = Vector2.RIGHT) -> void:
	intensity = maxf(new_intensity, 0.0)
	duration = maxf(new_duration, 0.01)
	elapsed = 0.0
	direction = new_direction.normalized() if new_direction.length() > 0.0 else Vector2.RIGHT
	offset = Vector2.ZERO
	set_process(true)

func stop() -> void:
	intensity = 0.0
	duration = 0.0
	elapsed = 0.0
	offset = Vector2.ZERO
	set_process(false)

func _process(delta: float) -> void:
	if elapsed >= duration:
		stop()
		return

	elapsed += delta
	var remaining := clampf(1.0 - elapsed / duration, 0.0, 1.0)
	var amount := intensity * pow(remaining, decay * 0.15)

	if mode == ShakeMode.DIRECTIONAL:
		offset = direction * amount * sin(elapsed * 80.0)
	else:
		offset = Vector2(randf_range(-amount, amount), randf_range(-amount, amount))

	if not horizontal:
		offset.x = 0.0
	if not vertical:
		offset.y = 0.0

