extends Node2D
class_name EffectOneShot

signal finished(effect: Node)

@export var lifetime: float = 0.8
@export var start_scale: Vector2 = Vector2.ONE
@export var end_scale: Vector2 = Vector2(1.4, 1.4)
@export var start_modulate: Color = Color.WHITE
@export var end_modulate: Color = Color(1, 1, 1, 0)
@export var auto_play_particles: bool = true

func _ready() -> void:
	reset_effect()

func play() -> void:
	visible = true
	scale = start_scale
	modulate = start_modulate
	for child in get_children():
		if child is CPUParticles2D and auto_play_particles:
			child.restart()
	var tween := create_tween()
	tween.parallel().tween_property(self, "scale", end_scale, lifetime)
	tween.parallel().tween_property(self, "modulate", end_modulate, lifetime)
	tween.finished.connect(_on_finished)

func reset_effect() -> void:
	visible = false
	scale = start_scale
	modulate = start_modulate

func _on_finished() -> void:
	visible = false
	finished.emit(self)

